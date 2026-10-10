"""Alert engine: threshold breaches + persistent streaks + big swings.

WHY: turns analytics into action. Runs after every data load (seed/upload)
and on demand (POST /api/alerts/evaluate). Rules:
- Latest-period value below target -> WARNING (threshold = target);
  below critical -> CRITICAL (threshold = critical_threshold).
- Below target for `window` (default 3) consecutive months ending at the
  latest period -> extra "[Persistent]" alert.
- Month-over-month swing >= 15pp (% indicators) or >= 50% relative
  (per_1000) at district level -> INFO "[Change]" alert.
- No duplicate ACTIVE alerts for the same indicator+area+period+kind.
- Auto-resolve ACTIVE WARNING/CRITICAL alerts when the scope recovers
  to NORMAL at the latest period. No email (future enhancement).
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.analytics.indicator_engine import evaluate_status
from app.analytics.performance import find_persistent_streaks
from app.models.alert import Alert
from app.models.enums import (
    AggregationLevel,
    AlertSeverity,
    AlertStatus,
)
from app.models.indicator import Indicator, IndicatorValue
from app.models.location import Block, District

THRESHOLD = "THRESHOLD"
PERSISTENT = "PERSISTENT"
CHANGE = "CHANGE"


def _kind_of(message: str) -> str:
    if message.startswith("[Persistent]"):
        return PERSISTENT
    if message.startswith("[Change]"):
        return CHANGE
    return THRESHOLD


def _area_names(
    db: Session, district_id: int | None, block_id: int | None
) -> tuple[str, int | None]:
    """Human-readable area label + its district id for messages."""
    if block_id is not None:
        block = db.query(Block).filter(Block.id == block_id).first()
        district = (
            db.query(District).filter(District.id == block.district_id).first()
            if block else None
        )
        label = f"{block.name} block ({district.name})" if block and district else "Unknown block"
        return label, block.district_id if block else None
    district = db.query(District).filter(District.id == district_id).first()
    return (f"{district.name} district" if district else "Unknown district"), district_id


def _create_unique(
    db: Session,
    indicator: Indicator,
    district_id: int | None,
    block_id: int | None,
    severity: AlertSeverity,
    message: str,
    current_value: float | None,
    threshold: float | None,
    period,
) -> bool:
    """Insert unless an ACTIVE alert for the same key already exists."""
    kind = _kind_of(message)
    candidates = (
        db.query(Alert)
        .filter(
            Alert.indicator_id == indicator.id,
            Alert.district_id == district_id,
            Alert.block_id == block_id,
            Alert.period == period,
            Alert.severity == severity,
            Alert.status == AlertStatus.ACTIVE,
        )
        .all()
    )
    if any(_kind_of(a.message) == kind for a in candidates):
        return False
    db.add(Alert(
        indicator_id=indicator.id, district_id=district_id, block_id=block_id,
        severity=severity, status=AlertStatus.ACTIVE, message=message,
        current_value=current_value, threshold=threshold, period=period,
    ))
    return True


def _scope_series(
    db: Session, indicator_id: int, level: AggregationLevel,
    district_id: int | None, block_id: int | None,
) -> list[tuple[str, float | None]]:
    query = db.query(IndicatorValue).filter(
        IndicatorValue.indicator_id == indicator_id,
        IndicatorValue.level == level,
    )
    if district_id is not None:
        query = query.filter(IndicatorValue.district_id == district_id)
    if block_id is not None:
        query = query.filter(IndicatorValue.block_id == block_id)
    rows = query.order_by(IndicatorValue.period).all()
    return [(r.period.strftime("%Y-%m"), r.value) for r in rows]


def _is_big_swing(indicator: Indicator, prev: float | None, cur: float | None) -> bool:
    if prev is None or cur is None:
        return False
    if indicator.unit == "%":
        return abs(cur - prev) >= 15.0
    if prev == 0:
        return cur != 0
    return abs(cur - prev) / abs(prev) >= 0.5


def evaluate_alerts(db: Session, window: int = 3) -> dict:
    """Evaluate all district/block scopes; create + auto-resolve alerts."""
    created = 0
    period_rows = db.query(IndicatorValue.period).distinct().all()
    periods = sorted(p for (p,) in period_rows)
    if not periods:
        return {"created": 0, "resolved": 0, "latest_period": None}
    latest, prev = periods[-1], periods[-2] if len(periods) > 1 else None

    indicators = db.query(Indicator).all()
    districts = db.query(District).all()
    blocks = db.query(Block).all()

    def latest_row(indicator_id: int, level: AggregationLevel,
                   district_id: int | None, block_id: int | None):
        query = db.query(IndicatorValue).filter(
            IndicatorValue.indicator_id == indicator_id,
            IndicatorValue.level == level, IndicatorValue.period == latest,
        )
        if district_id is not None:
            query = query.filter(IndicatorValue.district_id == district_id)
        if block_id is not None:
            query = query.filter(IndicatorValue.block_id == block_id)
        return query.first()

    scopes = ([(AggregationLevel.DISTRICT, d.id, None) for d in districts]
              + [(AggregationLevel.BLOCK, None, b.id) for b in blocks])

    for indicator in indicators:
        for level, district_id, block_id in scopes:
            area_district_id = district_id
            if block_id is not None:
                area_district_id = next(
                    (b.district_id for b in blocks if b.id == block_id), None)
            label, _ = _area_names(db, area_district_id, block_id)
            row = latest_row(indicator.id, level, district_id, block_id)
            if not row:
                continue
            status = evaluate_status(row.value, indicator.target,
                                     indicator.critical_threshold,
                                     indicator.direction)
            month = latest.strftime("%Y-%m")
            # 1. Threshold breach at latest period.
            if status == AlertSeverity.CRITICAL.value:
                if _create_unique(
                    db, indicator, area_district_id, block_id, AlertSeverity.CRITICAL,
                    f"{indicator.name} critical in {label}: "
                    f"{row.value}{indicator.unit} vs critical "
                    f"{indicator.critical_threshold}{indicator.unit} ({month})",
                    row.value, indicator.critical_threshold, latest,
                ):
                    created += 1
            elif status == AlertSeverity.WARNING.value:
                if _create_unique(
                    db, indicator, area_district_id, block_id, AlertSeverity.WARNING,
                    f"{indicator.name} below target in {label}: "
                    f"{row.value}{indicator.unit} vs target "
                    f"{indicator.target}{indicator.unit} ({month})",
                    row.value, indicator.target, latest,
                ):
                    created += 1
            # 2. Persistent streak ending at latest period.
            series = _scope_series(db, indicator.id, level, district_id, block_id)
            streaks = find_persistent_streaks(
                series, indicator.target, indicator.critical_threshold,
                indicator.direction, window)
            current_streaks = [s for s in streaks if s["end_month"] == month]
            if current_streaks:
                sev = (AlertSeverity.CRITICAL if status == "CRITICAL"
                       else AlertSeverity.WARNING)
                threshold = (indicator.critical_threshold if sev == AlertSeverity.CRITICAL
                             else indicator.target)
                if _create_unique(
                    db, indicator, area_district_id, block_id, sev,
                    f"[Persistent] {indicator.name} below target for {window} "
                    f"consecutive months in {label} "
                    f"(latest {row.value}{indicator.unit} vs target "
                    f"{indicator.target}{indicator.unit})",
                    row.value, threshold, latest,
                ):
                    created += 1
        # 3. INFO swings at district level (latest vs previous month).
        if prev is not None:
            for district in districts:
                cur = latest_row(indicator.id, AggregationLevel.DISTRICT,
                                 district.id, None)
                old = db.query(IndicatorValue).filter(
                    IndicatorValue.indicator_id == indicator.id,
                    IndicatorValue.level == AggregationLevel.DISTRICT,
                    IndicatorValue.period == prev,
                    IndicatorValue.district_id == district.id,
                ).first()
                if cur and old and _is_big_swing(indicator, old.value, cur.value):
                    label, _ = _area_names(db, district.id, None)
                    delta = round(cur.value - old.value, 2)
                    if _create_unique(
                        db, indicator, district.id, None, AlertSeverity.INFO,
                        f"[Change] {indicator.name} in {label} moved "
                        f"{delta:+}{indicator.unit} month-over-month "
                        f"({old.value} -> {cur.value})",
                        cur.value, indicator.target, latest,
                    ):
                        created += 1

    # 4. Auto-resolve: scopes back to NORMAL at latest period.
    resolved = 0
    now = datetime.now(timezone.utc)
    for indicator in indicators:
        for level, district_id, block_id in scopes:
            row = latest_row(indicator.id, level, district_id, block_id)
            if not row:
                continue
            if evaluate_status(row.value, indicator.target,
                               indicator.critical_threshold,
                               indicator.direction) != "NORMAL":
                continue
            area_id = district_id
            if block_id is not None:
                area_id = next((b.district_id for b in blocks if b.id == block_id), None)
            actives = db.query(Alert).filter(
                Alert.indicator_id == indicator.id,
                Alert.district_id == area_id,
                Alert.block_id == block_id,
                Alert.status == AlertStatus.ACTIVE,
                Alert.severity.in_([AlertSeverity.WARNING, AlertSeverity.CRITICAL]),
            ).all()
            for alert in actives:
                alert.status = AlertStatus.RESOLVED
                alert.resolved_at = now
                resolved += 1
    db.commit()
    return {"created": created, "resolved": resolved,
            "latest_period": latest.strftime("%Y-%m")}
