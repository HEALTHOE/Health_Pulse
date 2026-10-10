"""Dashboard business logic (routers only orchestrate).

WHY: score assembly + period resolution live here so routers stay thin
and the logic is unit-testable without HTTP.
"""

from datetime import date, datetime

from sqlalchemy.orm import Session

from app.analytics.indicator_engine import evaluate_status
from app.analytics.scoring import compute_health_score, score_band
from app.models.enums import AggregationLevel
from app.models.indicator import Indicator, IndicatorValue

SCORE_CODES = ("FULL_IMMUNIZATION", "ANC_COVERAGE", "TB_SUCCESS", "INST_DELIVERY")


def parse_month(raw: str | None) -> date | None:
    """Parse 'YYYY-MM' (or 'YYYY-MM-DD') to first-of-month; None if blank."""
    if not raw:
        return None
    text = raw.strip()
    for fmt in ("%Y-%m-%d", "%Y-%m"):
        try:
            parsed = datetime.strptime(text[: len(fmt)], fmt)
            return date(parsed.year, parsed.month, 1)
        except ValueError:
            continue
    return None


def latest_period(db: Session) -> date | None:
    """Most recent reporting month present in indicator_values (or records)."""
    row = db.query(IndicatorValue.period).order_by(IndicatorValue.period.desc()).first()
    if row:
        return row[0]
    from app.models.health_record import HealthRecord

    rec = db.query(HealthRecord.period).order_by(HealthRecord.period.desc()).first()
    return rec[0] if rec else None


def _values_map(
    db: Session, level: AggregationLevel, period: date,
    district_id: int | None = None, block_id: int | None = None,
) -> dict[str, IndicatorValue]:
    query = db.query(IndicatorValue).filter(
        IndicatorValue.level == level, IndicatorValue.period == period
    )
    if district_id is not None:
        query = query.filter(IndicatorValue.district_id == district_id)
    if block_id is not None:
        query = query.filter(IndicatorValue.block_id == block_id)
    rows = query.all()
    indicators = {i.id: i for i in db.query(Indicator).all()}
    out: dict[str, IndicatorValue] = {}
    for row in rows:
        indicator = indicators.get(row.indicator_id)
        if indicator:
            out[indicator.code] = row
    return out


def district_snapshot(db: Session, district_id: int, period: date) -> dict:
    """Score + per-indicator values/statuses for a district + month."""
    indicators = {i.code: i for i in db.query(Indicator).all()}
    values = _values_map(db, AggregationLevel.DISTRICT, period, district_id, None)
    components: dict[str, float | None] = {}
    items: dict[str, dict] = {}
    for code, indicator in indicators.items():
        row = values.get(code)
        value = row.value if row else None
        items[code] = {
            "value": value,
            "status": evaluate_status(
                value, indicator.target, indicator.critical_threshold,
                indicator.direction,
            ),
        }
        if code in SCORE_CODES:
            components[code] = value
    score = compute_health_score(components)
    return {"score": score, "status": score_band(score),
            "components": components, "items": items}


def block_snapshot(db: Session, block_id: int, district_id: int, period: date) -> dict:
    """Same as district_snapshot but at block level."""
    indicators = {i.code: i for i in db.query(Indicator).all()}
    query = db.query(IndicatorValue).filter(
        IndicatorValue.level == AggregationLevel.BLOCK,
        IndicatorValue.period == period,
        IndicatorValue.block_id == block_id,
    )
    rows = {r.indicator_id: r for r in query.all()}
    by_code: dict[str, IndicatorValue] = {}
    for indicator in indicators.values():
        for row in rows.values():
            if row.indicator_id == indicator.id:
                by_code[indicator.code] = row
    components: dict[str, float | None] = {}
    items: dict[str, dict] = {}
    for code, indicator in indicators.items():
        row = by_code.get(code)
        value = row.value if row else None
        items[code] = {
            "value": value,
            "status": evaluate_status(
                value, indicator.target, indicator.critical_threshold,
                indicator.direction,
            ),
        }
        if code in SCORE_CODES:
            components[code] = value
    score = compute_health_score(components)
    return {"score": score, "status": score_band(score),
            "components": components, "items": items,
            "district_id": district_id}


def performance_counts(items: dict[str, dict]) -> dict[str, int]:
    counts = {"normal": 0, "warning": 0, "critical": 0}
    for item in items.values():
        key = str(item["status"]).lower()
        if key in counts:
            counts[key] += 1
    return counts


def critical_alerts_count(db: Session, district_id: int, period: date) -> int:
    """ACTIVE CRITICAL alerts for the district+month (0 until Phase 7 fills)."""
    from app.models.alert import Alert
    from app.models.enums import AlertSeverity, AlertStatus

    return (
        db.query(Alert)
        .filter(
            Alert.district_id == district_id,
            Alert.severity == AlertSeverity.CRITICAL,
            Alert.status == AlertStatus.ACTIVE,
        )
        .count()
    )
