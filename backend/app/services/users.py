"""Shared user-scope validation (used by auth register + admin update).

Keeps role->scope rules identical everywhere: ADMIN has no scope,
DHO needs district only, BLOCK needs a block (district must match).
"""

from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.location import Block


def validate_user_scope(
    db: Session, role: UserRole, district_id: int | None, block_id: int | None
) -> str | None:
    """Return an error message for inconsistent scope, else None."""
    if role == UserRole.ADMIN:
        if district_id is not None or block_id is not None:
            return "ADMIN must not have district/block scope"
    elif role == UserRole.DISTRICT_HEALTH_OFFICER:
        if district_id is None:
            return "District officer requires district_id"
        if block_id is not None:
            return "District officer must not have block_id"
    else:  # BLOCK_OFFICER
        if block_id is None:
            return "Block officer requires block_id"
        block = db.query(Block).filter(Block.id == block_id).first()
        if not block:
            return "Unknown block_id"
        if district_id is not None and district_id != block.district_id:
            return "district_id does not match block's district"
    return None
