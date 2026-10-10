"""Admin endpoints: users, indicator thresholds, audit logs (ADMIN only)."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.enums import IndicatorDirection, UserRole
from app.models.indicator import Indicator
from app.models.operational import AuditLog
from app.models.user import User
from app.schemas.auth import UserOut
from app.schemas.ops import AuditLogOut, ThresholdUpdate, UserAdminUpdate
from app.services.audit import log_action
from app.services.users import validate_user_scope

router = APIRouter(prefix="/api", tags=["admin"])


def _require_admin(current: User) -> None:
    if current.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only ADMIN can access")


@router.get("/admin/users", response_model=list[UserOut], summary="List users")
def list_users(
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db), current: User = Depends(get_current_user),
) -> list[User]:
    _require_admin(current)
    return db.query(User).order_by(User.id).offset(skip).limit(limit).all()


@router.patch("/admin/users/{user_id}", response_model=UserOut,
              summary="Change role/scope or activate/deactivate a user")
def update_user(
    user_id: int, payload: UserAdminUpdate,
    db: Session = Depends(get_db), current: User = Depends(get_current_user),
) -> User:
    _require_admin(current)
    if user_id == current.id and (
        payload.role is not None or payload.is_active is False
    ):
        raise HTTPException(
            status_code=400, detail="Cannot change your own role or deactivate yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    role = UserRole(payload.role) if payload.role else user.role
    if payload.role and payload.role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=400, detail="Invalid role")
    district_id = payload.district_id if payload.district_id is not None else user.district_id
    block_id = payload.block_id if payload.block_id is not None else user.block_id
    # Explicit nulls: allow clearing scope when switching to ADMIN.
    if role == UserRole.ADMIN:
        district_id, block_id = None, None
    error = validate_user_scope(db, role, district_id, block_id)
    if error:
        raise HTTPException(status_code=400, detail=error)
    changes = []
    if payload.role and role != user.role:
        changes.append(f"role {user.role.value}->{role.value}")
        user.role = role
    if district_id != user.district_id or block_id != user.block_id:
        changes.append(f"scope d={user.district_id}/b={user.block_id}"
                       f" -> d={district_id}/b={block_id}")
        user.district_id, user.block_id = district_id, block_id
    if payload.is_active is not None and payload.is_active != user.is_active:
        changes.append(f"active {user.is_active}->{payload.is_active}")
        user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    log_action(db, current.id, "USER_UPDATE", f"user:{user.email}",
               "; ".join(changes) or "no changes")
    return user


@router.patch("/admin/indicators/{code}", summary="Update indicator thresholds (audited)")
def update_thresholds(
    code: str, payload: ThresholdUpdate,
    db: Session = Depends(get_db), current: User = Depends(get_current_user),
) -> dict:
    _require_admin(current)
    indicator = db.query(Indicator).filter(Indicator.code == code).first()
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")
    target = payload.target if payload.target is not None else indicator.target
    warning = (payload.warning_threshold if payload.warning_threshold is not None
               else indicator.warning_threshold)
    critical = (payload.critical_threshold if payload.critical_threshold is not None
                else indicator.critical_threshold)
    for value in (target, warning, critical):
        if value < 0:
            raise HTTPException(status_code=400, detail="Thresholds must be >= 0")
    direction = IndicatorDirection(indicator.direction)
    if direction.value == "HIGHER_IS_BETTER" and critical > target:
        raise HTTPException(
            status_code=400, detail="critical must be <= target (higher-is-better)")
    if direction.value == "LOWER_IS_BETTER" and critical < target:
        raise HTTPException(
            status_code=400, detail="critical must be >= target (lower-is-better)")
    before = f"t={indicator.target}/w={indicator.warning_threshold}/c={indicator.critical_threshold}"
    indicator.target, indicator.warning_threshold, indicator.critical_threshold = (
        target, warning, critical)
    db.commit()
    log_action(db, current.id, "INDICATOR_UPDATE", f"indicator:{code}",
               f"{before} -> t={target}/w={warning}/c={critical}")
    return {"code": code, "target": target, "warning_threshold": warning,
            "critical_threshold": critical}


@router.get("/audit-logs", response_model=list[AuditLogOut],
            summary="Audit trail (ADMIN only)")
def list_audit_logs(
    action: str | None = None, user_id: int | None = None,
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db), current: User = Depends(get_current_user),
) -> list[AuditLog]:
    _require_admin(current)
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id is not None:
        query = query.filter(AuditLog.user_id == user_id)
    return query.offset(skip).limit(limit).all()
