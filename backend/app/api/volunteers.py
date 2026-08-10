from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.user import User
from app.models.volunteer import Volunteer

router = APIRouter(
    prefix="/volunteers",
    tags=["Volunteers"],
)


@router.post(
    "/profile",
    status_code=status.HTTP_201_CREATED,
)
def create_volunteer_profile(
    skills: list[str],
    interests: list[str],
    vehicle_available: bool = False,
    vehicle_type: str | None = None,
    medical_training: bool = False,
    location_lat: float = 0,
    location_lng: float = 0,
    location_name: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("VOLUNTEER")),
):
    existing = (
        db.query(Volunteer)
        .filter(Volunteer.user_id == current_user.id)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Volunteer profile already exists",
        )

    volunteer = Volunteer(
        user_id=current_user.id,
        skills=skills,
        interests=interests,
        vehicle_available=vehicle_available,
        vehicle_type=vehicle_type,
        medical_training=medical_training,
        location_lat=location_lat,
        location_lng=location_lng,
        location_name=location_name,
        availability=True,
    )

    db.add(volunteer)
    db.commit()
    db.refresh(volunteer)

    return volunteer


@router.get("/")
def get_volunteers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    return db.query(Volunteer).all()


@router.get("/me")
def get_my_volunteer_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("VOLUNTEER")),
):
    volunteer = (
        db.query(Volunteer)
        .filter(Volunteer.user_id == current_user.id)
        .first()
    )

    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer profile not found",
        )

    return volunteer