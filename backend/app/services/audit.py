"""Audit logging helper (one line per sensitive action).

WHY: evaluators can prove who did what (login, upload, user changes,
threshold changes, alert ACK/resolve). Fields: user, action, resource,
timestamp (+ details).
"""

from sqlalchemy.orm import Session

from app.models.operational import AuditLog


def log_action(
    db: Session,
    user_id: int | None,
    action: str,
    resource: str = "",
    details: str = "",
) -> AuditLog:
    entry = AuditLog(
        user_id=user_id, action=action, resource=resource, details=details
    )
    db.add(entry)
    db.commit()
    return entry
