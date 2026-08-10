from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.beneficiary import Beneficiary
from app.models.emergency_request import EmergencyRequest
from app.models.volunteer import Volunteer
from app.models.user import User
from app.core.audit import create_audit_log
from app.services.volunteer_matching import rank_volunteers


router = APIRouter(
    prefix="/emergency-requests",
    tags=["Emergency Requests"],
)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
)
def create_emergency_request(
    description: str,
    location_lat: float,
    location_lng: float,
    location_name: str,
    category: str | None = None,
    priority: str | None = None,
    people_affected: int = 1,
    injured: bool = False,
    urgency_reason: str | None = None,
    disaster_event_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("BENEFICIARY")),
):
    beneficiary = (
        db.query(Beneficiary)
        .filter(Beneficiary.user_id == current_user.id)
        .first()
    )

    if not beneficiary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary profile not found",
        )

    emergency_request = EmergencyRequest(
        beneficiary_id=beneficiary.id,
        disaster_event_id=disaster_event_id,
        description=description,
        category=category,
        priority=priority,
        people_affected=people_affected,
        injured=injured,
        location_lat=location_lat,
        location_lng=location_lng,
        location_name=location_name,
        urgency_reason=urgency_reason,
        status="PENDING",
    )

    db.add(emergency_request)
    db.flush()

    create_audit_log(
        db=db,
        user=current_user,
        action="CREATE",
        entity_type="EMERGENCY_REQUEST",
        entity_id=emergency_request.id,
        details=(
            f"Created emergency request: "
            f"{emergency_request.description}"
        ),
    )

    db.commit()
    db.refresh(emergency_request)

    return emergency_request


@router.get("/")
def get_emergency_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(EmergencyRequest).all()


@router.get("/{request_id}")
def get_emergency_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emergency_request = (
        db.query(EmergencyRequest)
        .filter(EmergencyRequest.id == request_id)
        .first()
    )

    if not emergency_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency request not found",
        )

    return emergency_request


@router.get("/{request_id}/recommended-volunteers")
def get_recommended_volunteers(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    emergency_request = (
        db.query(EmergencyRequest)
        .filter(EmergencyRequest.id == request_id)
        .first()
    )

    if not emergency_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency request not found",
        )

    volunteers = (
        db.query(Volunteer)
        .filter(Volunteer.availability == True)
        .all()
    )

    recommendations = rank_volunteers(
        emergency_request,
        volunteers,
    )

    create_audit_log(
        db=db,
        user=current_user,
        action="AI_VOLUNTEER_MATCH",
        entity_type="EMERGENCY_REQUEST",
        entity_id=emergency_request.id,
        details=(
            f"Generated volunteer recommendations: "
            f"{len(recommendations)} candidate(s)"
        ),
    )

    db.commit()

    return {
        "emergency_request_id": emergency_request.id,
        "recommendations": recommendations,
    }


@router.patch("/{request_id}/status")
def update_emergency_request_status(
    request_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    emergency_request = (
        db.query(EmergencyRequest)
        .filter(EmergencyRequest.id == request_id)
        .first()
    )

    if not emergency_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency request not found",
        )

    old_status = emergency_request.status

    if old_status == new_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Emergency request is already in this status",
        )

    emergency_request.status = new_status

    create_audit_log(
        db=db,
        user=current_user,
        action="UPDATE_STATUS",
        entity_type="EMERGENCY_REQUEST",
        entity_id=emergency_request.id,
        details=(
            f"Status changed from "
            f"{old_status} to {new_status}"
        ),
    )

    db.commit()
    db.refresh(emergency_request)

    return emergency_request


@router.delete("/{request_id}")
def delete_emergency_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    emergency_request = (
        db.query(EmergencyRequest)
        .filter(EmergencyRequest.id == request_id)
        .first()
    )

    if not emergency_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency request not found",
        )

    create_audit_log(
        db=db,
        user=current_user,
        action="DELETE",
        entity_type="EMERGENCY_REQUEST",
        entity_id=emergency_request.id,
        details="Deleted emergency request",
    )

    db.delete(emergency_request)
    db.commit()

    return {
        "message": "Emergency request deleted successfully"
    }