from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class TaskVolunteer(Base):
    __tablename__ = "task_volunteers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id"),
        nullable=False
    )

    volunteer_id: Mapped[int] = mapped_column(
        ForeignKey("volunteers.id"),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="PENDING",
        nullable=False
    )

    assigned_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    task = relationship(
        "Task",
        back_populates="volunteer_assignments"
    )

    volunteer = relationship(
        "Volunteer",
        back_populates="task_assignments"
    )


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    emergency_request_id: Mapped[int] = mapped_column(
        ForeignKey("emergency_requests.id"),
        nullable=False
    )

    task_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="PENDING_ACCEPTANCE",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    assigned_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    emergency_request = relationship(
        "EmergencyRequest",
        back_populates="tasks"
    )

    volunteer_assignments = relationship(
        "TaskVolunteer",
        back_populates="task"
    )

    inventory_logs = relationship(
        "InventoryLog",
        back_populates="task"
    )