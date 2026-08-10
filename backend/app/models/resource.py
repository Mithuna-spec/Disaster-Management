from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    name: Mapped[str] = mapped_column(
        String(150), nullable=False
    )

    resource_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )

    quantity: Mapped[float] = mapped_column(
        Float, default=0, nullable=False
    )

    unit: Mapped[str] = mapped_column(
        String(30), nullable=False
    )

    minimum_threshold: Mapped[float] = mapped_column(
        Float, default=0, nullable=False
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

    inventory_logs = relationship(
        "InventoryLog",
        back_populates="resource"
    )