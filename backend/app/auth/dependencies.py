"""RBAC dependencies + scope enforcement (used by EVERY endpoint).

WHY: ADMIN sees everything; DISTRICT_HEALTH_OFFICER only their district;
BLOCK_OFFICER only their block. Central helpers keep the rule identical
across routers — a 403 for anything outside scope.
"""

from collections.abc import Callable

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.jwt import decode_token
from app.database import get_db
from app.models.enums import UserRole
from app.models.location import Block, District, Facility
from app.models.user import User

_bearer = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """Validate Bearer JWT and return the active user (401 otherwise)."""
    try:
        payload = decode_token(credentials.credentials)
        user_id = int(payload.get("sub", 0))
    except (ValueError, TypeError, AttributeError) as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


def require_roles(*roles: UserRole) -> Callable[[User], User]:
    """Dependency factory: allow only the given roles (403 otherwise)."""

    def checker(current: User = Depends(get_current_user)) -> User:
        if current.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current

    return checker


def _block_district_id(db: Session, block_id: int) -> int | None:
    block = db.query(Block).filter(Block.id == block_id).first()
    return block.district_id if block else None


def assert_district_access(db: Session, district_id: int, user: User) -> None:
    """Raise 403 unless the user may see this district."""
    if user.role == UserRole.ADMIN:
        return
    if user.role == UserRole.DISTRICT_HEALTH_OFFICER:
        if user.district_id == district_id:
            return
        raise HTTPException(status_code=403, detail="Outside your district scope")
    # BLOCK_OFFICER: own block's district only
    if user.block_id is not None:
        if _block_district_id(db, user.block_id) == district_id:
            return
    raise HTTPException(status_code=403, detail="Outside your block scope")


def assert_block_access(db: Session, block_id: int, user: User) -> None:
    """Raise 403 unless the user may see this block."""
    if user.role == UserRole.ADMIN:
        return
    block = db.query(Block).filter(Block.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    if user.role == UserRole.DISTRICT_HEALTH_OFFICER:
        if block.district_id == user.district_id:
            return
        raise HTTPException(status_code=403, detail="Outside your district scope")
    if user.block_id == block_id:
        return
    raise HTTPException(status_code=403, detail="Outside your block scope")


def assert_facility_access(db: Session, facility_id: int, user: User) -> None:
    """Raise 403 unless the user may see this facility."""
    if user.role == UserRole.ADMIN:
        return
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    assert_block_access(db, facility.block_id, user)


def district_exists_or_404(db: Session, district_id: int) -> District:
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    return district
