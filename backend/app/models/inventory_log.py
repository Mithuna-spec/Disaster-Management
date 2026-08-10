from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class InventoryLog(Base):
    __tablename__ = "inventory_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    resource_id: Mapped[int] = mapped_column(
        ForeignKey("resources.id"),
        nullable=False
    )

    task_id: Mapped[int | None] = mapped_column(
        ForeignKey("tasks.id"),
        nullable=True
    )

    change_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )

    quantity: Mapped[float] = mapped_column(
        Float, nullable=False
    )

    previous_quantity: Mapped[float] = mapped_column(
        Float, nullable=False
    )

    new_quantity: Mapped[float] = mapped_column(
        Float, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    resource = relationship(
        "Resource",
        back_populates="inventory_logs"
    )

    task = relationship(
        "Task",
        back_populates="inventory_logs"
    )