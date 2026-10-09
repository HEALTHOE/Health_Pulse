"""Indicator engine: compute value + status from numerators/denominators.

WHY: every dashboard number and alert flows through here, so the whole
product agrees on what "good" means. Aggregation sums raw counts first
(never averages percentages), handles lower-is-better correctly, and is
safe on divide-by-zero (returns value=None, status="NO_DATA").
"""

from datetime import date

from sqlalchemy.orm import Session

from app.models.enums import AggregationLevel, IndicatorDirection
from app.models.health_record import HealthRecord
from app.models.indicator import Indicator, IndicatorValue

StatusStr = str  # "NORMAL" | "WARNING" | "CRITICAL" | "NO_DATA"


def compute_value(
    numerator: float | None, denominator: float | None, scale: float = 100.0
) -> float | None:
    """Scale a numerator/denominator pair; None when not computable."""
    if numerator is None or denominator is None:
        return None
    if denominator == 0:
        return None
    return round(float(numerator) / float(denominator) * scale, 2)


def evaluate_status(
    value: float | None,
    target: float,
    critical_threshold: float,
    direction: IndicatorDirection | str,
) -> StatusStr:
    """Map a value to NORMAL / WARNING / CRITICAL (or NO_DATA).

    Higher-is-better: value >= target -> NORMAL;
        value >= critical -> WARNING; else CRITICAL.
    Lower-is-better (inverted): value <= target -> NORMAL;
        value <= critical -> WARNING; else CRITICAL.
    """
    if value is None:
        return "NO_DATA"
    direction = IndicatorDirection(direction)
    if direction == IndicatorDirection.HIGHER_IS_BETTER:
        if value >= target:
            return "NORMAL"
        if value >= critical_threshold:
            return "WARNING"
        return "CRITICAL"
    # LOWER_IS_BETTER
    if value <= target:
        return "NORMAL"
    if value <= critical_threshold:
        return "WARNING"
    return "CRITICAL"


def achievement_pct(
    value: float | None,
    target: float,
    direction: IndicatorDirection | str,
) -> float | None:
    """% achievement vs target, capped at 100 for readability."""
    if value is None or target == 0:
        return None
    direction = IndicatorDirection(direction)
    if direction == IndicatorDirection.HIGHER_IS_BETTER:
        return round(min(value / target * 100.0, 100.0), 2)
    if value == 0:
        return 100.0  # zero cases/deaths when lower-is-better = perfect
    return round(min(float(target) / float(value) * 100.0, 100.0), 2)


def evaluate_indicator(
    numerator: float | None,
    denominator: float | None,
    definition: dict,
) -> dict:
    """Full result for one indicator: value, target, diff, achievement, status."""
    value = compute_value(numerator, denominator, definition.get("scale", 100.0))
    status = evaluate_status(
        value,
        definition["target"],
        definition["critical_threshold"],
        definition["direction"],
    )
    diff = None if value is None else round(value - definition["target"], 2)
    return {
        "code": definition["code"],
        "name": definition["name"],
        "value": value,
        "target": definition["target"],
        "difference": diff,
        "achievement_pct": achievement_pct(
            value, definition["target"], definition["direction"]
        ),
        "status": status,
    }


def _sum_fields(
    records: list[HealthRecord], numerator_field: str, denominator_field: str
) -> tuple[float, float]:
    numerator = sum(float(getattr(r, numerator_field) or 0) for r in records)
    denominator = sum(float(getattr(r, denominator_field) or 0) for r in records)
    return numerator, denominator


def aggregate_for_records(
    records: list[HealthRecord], definition: dict
) -> dict:
    """Aggregate raw counts across records, then evaluate (never avg of %)."""
    num, den = _sum_fields(
        records, definition["numerator_field"], definition["denominator_field"]
    )
    result = evaluate_indicator(num, den, definition)
    result["numerator"] = num
    result["denominator"] = den
    return result


def upsert_indicator_value(
    db: Session,
    indicator: Indicator,
    period: date,
    level: AggregationLevel,
    numerator: float,
    denominator: float,
    value: float | None,
    district_id: int | None = None,
    block_id: int | None = None,
    facility_id: int | None = None,
) -> IndicatorValue:
    """Idempotent write: update the existing row for the same scope+period."""
    existing = (
        db.query(IndicatorValue)
        .filter(
            IndicatorValue.indicator_id == indicator.id,
            IndicatorValue.period == period,
            IndicatorValue.level == level,
            IndicatorValue.district_id == district_id,
            IndicatorValue.block_id == block_id,
            IndicatorValue.facility_id == facility_id,
        )
        .first()
    )
    if existing:
        existing.numerator = numerator
        existing.denominator = denominator
        existing.value = value
        return existing
    row = IndicatorValue(
        indicator_id=indicator.id,
        period=period,
        level=level,
        district_id=district_id,
        block_id=block_id,
        facility_id=facility_id,
        numerator=numerator,
        denominator=denominator,
        value=value,
    )
    db.add(row)
    return row


def recompute_indicator_values(db: Session) -> int:
    """Recompute IndicatorValue rows for all periods/levels. Returns row count.

    Reads every HealthRecord, aggregates facility -> block -> district per
    month using summed numerators/denominators. Idempotent (upserts).
    """
    from app.analytics.registry import INDICATOR_DEFINITIONS
    from app.models.location import Block, Facility

    indicators = {i.code: i for i in db.query(Indicator).all()}
    if not indicators:
        return 0

    records = db.query(HealthRecord).all()
    facilities = {f.id: f for f in db.query(Facility).all()}
    blocks = {b.id: b for b in db.query(Block).all()}

    # period -> facility_id -> records
    by_period_facility: dict[tuple[date, int], list[HealthRecord]] = {}
    for record in records:
        by_period_facility.setdefault((record.period, record.facility_id), []).append(
            record
        )

    count = 0
    # period -> block_id -> records, period -> district_id -> records
    for (period, facility_id), recs in by_period_facility.items():
        facility = facilities.get(facility_id)
        if not facility:
            continue
        block = blocks.get(facility.block_id)
        district_id = block.district_id if block else None
        for definition in INDICATOR_DEFINITIONS:
            code = definition["code"]
            indicator = indicators.get(code)
            if not indicator:
                continue
            num, den = _sum_fields(
                recs, definition["numerator_field"], definition["denominator_field"]
            )
            value = compute_value(num, den, definition.get("scale", 100.0))
            upsert_indicator_value(
                db, indicator, period, AggregationLevel.FACILITY,
                num, den, value, district_id, facility.block_id, facility_id,
            )
            count += 1

    # Block + district rollups per period
    periods = sorted({r.period for r in records})
    for period in periods:
        period_recs = [r for r in records if r.period == period]
        # block level
        block_groups: dict[int, list[HealthRecord]] = {}
        for r in period_recs:
            fac = facilities.get(r.facility_id)
            if fac:
                block_groups.setdefault(fac.block_id, []).append(r)
        for block_id, recs in block_groups.items():
            block = blocks.get(block_id)
            for definition in INDICATOR_DEFINITIONS:
                indicator = indicators.get(definition["code"])
                if not indicator:
                    continue
                num, den = _sum_fields(
                    recs, definition["numerator_field"],
                    definition["denominator_field"],
                )
                value = compute_value(num, den, definition.get("scale", 100.0))
                upsert_indicator_value(
                    db, indicator, period, AggregationLevel.BLOCK,
                    num, den, value,
                    block.district_id if block else None, block_id, None,
                )
                count += 1
        # district level
        district_groups: dict[int, list[HealthRecord]] = {}
        for r in period_recs:
            fac = facilities.get(r.facility_id)
            blk = blocks.get(fac.block_id) if fac else None
            if blk:
                district_groups.setdefault(blk.district_id, []).append(r)
        for district_id, recs in district_groups.items():
            for definition in INDICATOR_DEFINITIONS:
                indicator = indicators.get(definition["code"])
                if not indicator:
                    continue
                num, den = _sum_fields(
                    recs, definition["numerator_field"],
                    definition["denominator_field"],
                )
                value = compute_value(num, den, definition.get("scale", 100.0))
                upsert_indicator_value(
                    db, indicator, period, AggregationLevel.DISTRICT,
                    num, den, value, district_id, None, None,
                )
                count += 1
    db.commit()
    return count
