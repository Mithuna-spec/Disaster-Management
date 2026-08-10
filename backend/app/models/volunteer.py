from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Volunteer(Base):
    __tablename__ = "volunteers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    skills: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    interests: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)

    vehicle_available: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    vehicle_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )

    medical_training: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    location_lat: Mapped[float] = mapped_column(Float, nullable=False)
    location_lng: Mapped[float] = mapped_column(Float, nullable=False)

    location_name: Mapped[str] = mapped_column(
        String(150), nullable=False
    )

    availability: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    user = relationship("User", back_populates="volunteer")

    task_assignments = relationship(
        "TaskVolunteer",
        back_populates="volunteer"
    )