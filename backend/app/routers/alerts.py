"""Alert endpoints: list (filtered, scoped) + acknowledge/resolve (audited)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    assert_block_access,
    assert_district_access,
    get_current_user,
)
from app.database import get_db
from app.models.alert import Alert
from app.models.enums import AlertSeverity, AlertStatus, UserRole
from app.models.indicator import Indicator
from app.models.location import Block, District
from app.models.user import User
from app.schemas.ops import AlertOut, AlertStatusUpdate
from app.services.alert_service import evaluate_alerts
from app.services.audit import log_action

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

ALLOWED_TRANSITIONS = {
    AlertStatus.ACTIVE: {AlertStatus.ACKNOWLEDGED, AlertStatus.RESOLVED},
    AlertStatus.ACKNOWLEDGED: {AlertStatus.RESOLVED},
    AlertStatus.RESOLVED: set(),
}


def _to_out(db: Session, alert: Alert) -> dict:
    indicator = (db.query(Indicator)
                 .filter(Indicator.id == alert.indicator_id).first()
                 if alert.indicator_id else None)
    district = (db.query(District).filter(District.id == alert.district_id).first()
                if alert.district_id else None)
    block = (db.query(Block).filter(Block.id == alert.block_id).first()
             if alert.block_id else None)
    return {
        "id": alert.id, "indicator_id": alert.indicator_id,
        "indicator_code": indicator.code if indicator else None,
        "indicator_name": indicator.name if indicator else None,
        "district_id": alert.district_id,
        "district_name": district.name if district else None,
        "block_id": alert.block_id,
        "block_name": block.name if block else None,
        "severity": alert.severity.value, "status": alert.status.value,
        "message": alert.message, "current_value": alert.current_value,
        "threshold": alert.threshold,
        "period": alert.period.strftime("%Y-%m") if alert.period else None,
        "created_at": alert.created_at,
    }


def _scope_filter(query, current: User):
    """Restrict alerts to the user's area (ADMIN sees all)."""
    if current.role == UserRole.ADMIN:
        return query
    if current.role == UserRole.DISTRICT_HEALTH_OFFICER:
        return query.filter(Alert.district_id == current.district_id)
    blocks = [current.block_id] if current.block_id else []
    return query.filter(Alert.block_id.in_(blocks))


@router.get("", response_model=list[AlertOut], summary="List alerts (filtered)")
def list_alerts(
    severity: AlertSeverity | None = None,
    status: AlertStatus | None = None,
    district_id: int | None = None,
    block_id: int | None = None,
    indicator_id: int | None = None,
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> list[dict]:
    if district_id is not None:
        assert_district_access(db, district_id, current)
    if block_id is not None:
        assert_block_access(db, block_id, current)
    query = db.query(Alert).order_by(Alert.created_at.desc())
    query = _scope_filter(query, current)
    if severity:
        query = query.filter(Alert.severity == severity)
    if status:
        query = query.filter(Alert.status == status)
    if district_id is not None:
        query = query.filter(Alert.district_id == district_id)
    if block_id is not None:
        query = query.filter(Alert.block_id == block_id)
    if indicator_id is not None:
        query = query.filter(Alert.indicator_id == indicator_id)
    return [_to_out(db, a) for a in query.offset(skip).limit(limit).all()]


@router.post("/evaluate", summary="Re-evaluate alerts now (ADMIN only)")
def evaluate_now(
    db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> dict:
    if current.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only ADMIN can re-evaluate")
    result = evaluate_alerts(db)
    log_action(db, current.id, "ALERT_EVALUATE", "alerts", str(result))
    return result


@router.patch("/{alert_id}", response_model=AlertOut,
              summary="Acknowledge or resolve an alert")
def update_alert(
    alert_id: int, payload: AlertStatusUpdate,
    db: Session = Depends(get_db), current: User = Depends(get_current_user),
) -> dict:
    try:
        target = AlertStatus(payload.status)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="status must be ACKNOWLEDGED or RESOLVED") from None
    if target == AlertStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Cannot reopen alerts")
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.block_id is not None:
        assert_block_access(db, alert.block_id, current)
    elif alert.district_id is not None:
        assert_district_access(db, alert.district_id, current)
    elif current.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Outside your scope")
    if target not in ALLOWED_TRANSITIONS[alert.status]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move {alert.status.value} -> {target.value}")
    now = datetime.now(timezone.utc)
    alert.status = target
    if target == AlertStatus.ACKNOWLEDGED:
        alert.acknowledged_at = now
        log_action(db, current.id, "ALERT_ACKNOWLEDGED",
                   f"alert:{alert.id}", alert.message[:200])
    else:
        alert.resolved_at = now
        log_action(db, current.id, "ALERT_RESOLVED",
                   f"alert:{alert.id}", alert.message[:200])
    db.commit()
    db.refresh(alert)
    return _to_out(db, alert)
