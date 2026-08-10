from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.disaster_event import DisasterEvent
from app.models.user import User
from app.core.audit import create_audit_log

router = APIRouter(
    prefix="/disasters",
    tags=["Disasters"],
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_disaster(
    name: str,
    description: str | None = None,
    disaster_type: str = "OTHER",
    severity: str = "MEDIUM",
    status_value: str = "ACTIVE",
    center_lat: float = 0.0,
    center_lng: float = 0.0,
    area_name: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    disaster = DisasterEvent(
        name=name,
        description=description,
        disaster_type=disaster_type,
        severity=severity,
        status=status_value,
        center_lat=center_lat,
        center_lng=center_lng,
        area_name=area_name,
    )

    db.add(disaster)
    db.flush()

    create_audit_log(
        db=db,
        user=current_user,
        action="CREATE",
        entity_type="DISASTER_EVENT",
        entity_id=disaster.id,
        details=f"Created disaster event: {disaster.name}",
    )

    db.commit()
    db.refresh(disaster)

    return disaster


@router.get("/")
def get_disasters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(DisasterEvent).all()


@router.get("/{disaster_id}")
def get_disaster(
    disaster_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    disaster = (
        db.query(DisasterEvent)
        .filter(DisasterEvent.id == disaster_id)
        .first()
    )

    if not disaster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disaster event not found",
        )

    return disaster


@router.delete("/{disaster_id}")
def delete_disaster(
    disaster_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    disaster = (
        db.query(DisasterEvent)
        .filter(DisasterEvent.id == disaster_id)
        .first()
    )

    if not disaster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disaster event not found",
        )

    create_audit_log(
    db=db,
    user=current_user,
    action="DELETE",
    entity_type="DISASTER_EVENT",
    entity_id=disaster.id,
    details=f"Deleted disaster event: {disaster.name}",
)

    db.delete(disaster)
    db.commit()

    return {
        "message": "Disaster event deleted successfully"
    }