"""Phase 4 tests: engine, thresholds, scoring, trends, performance."""

from datetime import date

from app.analytics.indicator_engine import (
    achievement_pct,
    aggregate_for_records,
    compute_value,
    evaluate_indicator,
    evaluate_status,
    recompute_indicator_values,
)
from app.analytics.performance import (
    find_persistent_streaks,
    is_persistently_underperforming,
)
from app.analytics.registry import INDICATOR_DEFINITIONS, get_definition
from app.analytics.scoring import compute_health_score, score_band
from app.analytics.trends import build_monthly_series
from app.models.enums import AggregationLevel, IndicatorDirection


def test_compute_value_and_divide_by_zero():
    assert compute_value(45, 50, 100.0) == 90.0
    assert compute_value(3, 5000, 1000.0) == 0.6
    assert compute_value(5, 0, 100.0) is None
    assert compute_value(None, 50, 100.0) is None


def test_status_higher_is_better_tb_example():
    d = IndicatorDirection.HIGHER_IS_BETTER
    assert evaluate_status(95, 90, 70, d) == "NORMAL"
    assert evaluate_status(90, 90, 70, d) == "NORMAL"  # at target
    assert evaluate_status(85, 90, 70, d) == "WARNING"
    assert evaluate_status(70, 90, 70, d) == "WARNING"  # at critical
    assert evaluate_status(65, 90, 70, d) == "CRITICAL"
    assert evaluate_status(None, 90, 70, d) == "NO_DATA"


def test_status_lower_is_better_malaria():
    d = IndicatorDirection.LOWER_IS_BETTER
    assert evaluate_status(1.5, 2.0, 5.0, d) == "NORMAL"
    assert evaluate_status(2.0, 2.0, 5.0, d) == "NORMAL"
    assert evaluate_status(4.0, 2.0, 5.0, d) == "WARNING"
    assert evaluate_status(7.0, 2.0, 5.0, d) == "CRITICAL"


def test_evaluate_indicator_full_result():
    definition = get_definition("TB_SUCCESS")
    result = evaluate_indicator(9, 10, definition)
    assert result["value"] == 90.0
    assert result["status"] == "NORMAL"
    assert result["difference"] == 0.0
    assert result["achievement_pct"] == 100.0


def test_achievement_pct_lower_is_better():
    d = IndicatorDirection.LOWER_IS_BETTER
    assert achievement_pct(0, 2.0, d) == 100.0  # zero cases = perfect
    assert achievement_pct(4.0, 2.0, d) == 50.0
    assert achievement_pct(None, 2.0, d) is None


def test_aggregation_sums_not_averages():
    """Two facilities: 90/100 + 10/100 -> 50%, NOT avg(90%,10%)=50% trap demo.

    Use asymmetric denominators to prove: 90/100 + 0/900 -> 9%, not 45%.
    """
    from app.models.health_record import HealthRecord

    r1 = HealthRecord(
        facility_id=1, period=date(2026, 1, 1),
        total_infants=100, fully_immunized_infants=90,
    )
    r2 = HealthRecord(
        facility_id=2, period=date(2026, 1, 1),
        total_infants=900, fully_immunized_infants=0,
    )
    definition = get_definition("FULL_IMMUNIZATION")
    result = aggregate_for_records([r1, r2], definition)
    assert result["numerator"] == 90.0
    assert result["denominator"] == 1000.0
    assert result["value"] == 9.0  # correct pooled rate, not 45% average


def test_health_score_weighted_and_capped():
    # All perfect -> 100, NORMAL
    assert compute_health_score({
        "FULL_IMMUNIZATION": 90, "ANC_COVERAGE": 90,
        "TB_SUCCESS": 90, "INST_DELIVERY": 90}) == 90.0
    # Over-achievement capped at 100 per component
    assert compute_health_score({
        "FULL_IMMUNIZATION": 150, "ANC_COVERAGE": 150,
        "TB_SUCCESS": 150, "INST_DELIVERY": 150}) == 100.0
    # Missing data counts as 0 (does not hide silently — lowers score)
    assert compute_health_score({
        "FULL_IMMUNIZATION": 90, "ANC_COVERAGE": None,
        "TB_SUCCESS": 90, "INST_DELIVERY": 90}) == 67.5
    assert score_band(85) == "NORMAL"
    assert score_band(70) == "WARNING"
    assert score_band(50) == "CRITICAL"


def test_trend_series_shape():
    series = build_monthly_series("Full Immunization Coverage", [
        (date(2026, 2, 1), 80.0), (date(2026, 1, 1), 81.2),
    ])
    assert series == {
        "indicator": "Full Immunization Coverage",
        "period": "monthly",
        "data": [
            {"month": "2026-01", "value": 81.2},
            {"month": "2026-02", "value": 80.0},
        ],
    }


def test_persistent_underperformance():
    # 3 consecutive months below target -> True
    bad = [("2026-01", 80.0), ("2026-02", 75.0), ("2026-03", 70.0)]
    assert is_persistently_underperforming(
        bad, 90.0, 70.0, IndicatorDirection.HIGHER_IS_BETTER) is True
    # Recovery in last month -> False
    recovering = [("2026-01", 80.0), ("2026-02", 75.0), ("2026-03", 92.0)]
    assert is_persistently_underperforming(
        recovering, 90.0, 70.0, IndicatorDirection.HIGHER_IS_BETTER) is False
    # Fewer months than window -> False
    assert is_persistently_underperforming(
        bad[:2], 90.0, 70.0, IndicatorDirection.HIGHER_IS_BETTER) is False
    # Streak finder reports the window
    streaks = find_persistent_streaks(
        bad, 90.0, 70.0, IndicatorDirection.HIGHER_IS_BETTER)
    assert len(streaks) == 1
    assert streaks[0]["start_month"] == "2026-01"


def test_registry_has_all_indicators():
    codes = {d["code"] for d in INDICATOR_DEFINITIONS}
    assert {"ANC_COVERAGE", "INST_DELIVERY", "FULL_IMMUNIZATION",
            "TB_SUCCESS", "MALARIA_INCIDENCE", "OPD_UTILIZATION",
            "HW_AVAILABILITY"} <= codes


def test_recompute_writes_three_levels(db_session):
    """Seed two facilities in one block, recompute, check FACILITY/BLOCK/DISTRICT."""
    from app.models.health_record import HealthRecord
    from app.models.indicator import Indicator, IndicatorValue
    from app.models.location import Block, District, Facility
    from app.utils.seed import seed_indicators

    seed_indicators(db_session)
    district = District(name="D1", code="D1")
    db_session.add(district)
    db_session.flush()
    block = Block(name="B1", code="B1", district_id=district.id)
    db_session.add(block)
    db_session.flush()
    f1 = Facility(name="F1", facility_type="PHC", block_id=block.id)
    f2 = Facility(name="F2", facility_type="PHC", block_id=block.id)
    db_session.add_all([f1, f2])
    db_session.flush()
    for fac in (f1, f2):
        db_session.add(HealthRecord(
            facility_id=fac.id, period=date(2026, 1, 1),
            total_infants=100, fully_immunized_infants=80,
            total_pregnant_women=100, anc_4_visits=90,
            total_deliveries=50, institutional_deliveries=45,
            total_tb_patients=10, tb_treatment_success=9,
            population=5000, malaria_cases=5,
            opd_visits=400, opd_expected=500,
            sanctioned_health_workers=10, positioned_health_workers=9,
            live_births=50, infant_deaths=1,
        ))
    db_session.commit()

    count = recompute_indicator_values(db_session)
    assert count > 0
    levels = {r.level for r in db_session.query(IndicatorValue).all()}
    assert AggregationLevel.FACILITY in levels
    assert AggregationLevel.BLOCK in levels
    assert AggregationLevel.DISTRICT in levels
    # Block pooled immunization = 160/200 = 80%
    imm = db_session.query(Indicator).filter_by(code="FULL_IMMUNIZATION").first()
    block_row = db_session.query(IndicatorValue).filter_by(
        indicator_id=imm.id, level=AggregationLevel.BLOCK).first()
    assert block_row.value == 80.0
    assert block_row.numerator == 160.0
