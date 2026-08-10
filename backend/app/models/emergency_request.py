from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    beneficiary_id: Mapped[int] = mapped_column(
        ForeignKey("beneficiaries.id"),
        nullable=False
    )

    disaster_event_id: Mapped[int | None] = mapped_column(
        ForeignKey("disaster_events.id"),
        nullable=True
    )

    description: Mapped[str] = mapped_column(
        Text, nullable=False
    )

    category: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )

    priority: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30), default="PENDING", nullable=False
    )

    people_affected: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )

    injured: Mapped[bool] = mapped_column(
        default=False, nullable=False
    )

    location_lat: Mapped[float] = mapped_column(
        Float, nullable=False
    )

    location_lng: Mapped[float] = mapped_column(
        Float, nullable=False
    )

    location_name: Mapped[str] = mapped_column(
        String(150), nullable=False
    )

    urgency_reason: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    recommended_action: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    beneficiary = relationship(
        "Beneficiary",
        back_populates="emergency_requests"
    )

    disaster_event = relationship(
        "DisasterEvent",
        back_populates="emergency_requests"
    )

    tasks = relationship(
        "Task",
        back_populates="emergency_request"
    )