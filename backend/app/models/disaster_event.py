from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class DisasterEvent(Base):
    __tablename__ = "disaster_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    name: Mapped[str] = mapped_column(
        String(200), nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    disaster_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )

    severity: Mapped[str] = mapped_column(
        String(20), nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20), default="ACTIVE", nullable=False
    )

    center_lat: Mapped[float] = mapped_column(
        Float, nullable=False
    )

    center_lng: Mapped[float] = mapped_column(
        Float, nullable=False
    )

    area_name: Mapped[str] = mapped_column(
        String(150), nullable=False
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    emergency_requests = relationship(
        "EmergencyRequest",
        back_populates="disaster_event"
    )