from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    type: Mapped[str] = mapped_column(
        String(40), nullable=False
    )

    title: Mapped[str] = mapped_column(
        String(200), nullable=False
    )

    message: Mapped[str] = mapped_column(
        Text, nullable=False
    )

    channel: Mapped[str] = mapped_column(
        String(20), nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="PENDING",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    user = relationship(
        "User",
        back_populates="notifications"
    )