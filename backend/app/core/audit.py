from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User


def create_audit_log(
    db: Session,
    user: User,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    details: str | None = None,
):
    audit_log = AuditLog(
        user_id=user.id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )

    db.add(audit_log)
    return audit_log