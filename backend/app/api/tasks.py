from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.task import Task, TaskVolunteer
from app.models.volunteer import Volunteer
from app.models.emergency_request import EmergencyRequest
from app.models.user import User
from app.core.audit import create_audit_log

router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    emergency_request_id: int,
    task_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    emergency_request = (
        db.query(EmergencyRequest)
        .filter(EmergencyRequest.id == emergency_request_id)
        .first()
    )

    if not emergency_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency request not found",
        )

    task = Task(
        emergency_request_id=emergency_request_id,
        task_type=task_type,
        status="PENDING_ACCEPTANCE",
    )

    db.add(task)
    db.flush()

    create_audit_log(
        db=db,
        user=current_user,
        action="CREATE",
        entity_type="TASK",
        entity_id=task.id,
        details=f"Created task: {task.task_type}",
    )

    db.commit()
    db.refresh(task)

    return task

@router.post("/{task_id}/assign")
def assign_volunteer(
    task_id: int,
    volunteer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    volunteer = (
        db.query(Volunteer)
        .filter(Volunteer.id == volunteer_id)
        .first()
    )

    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer not found",
        )

    if not volunteer.availability:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Volunteer is not available",
        )

    existing_assignment = (
        db.query(TaskVolunteer)
        .filter(
            TaskVolunteer.task_id == task_id,
            TaskVolunteer.volunteer_id == volunteer_id,
        )
        .first()
    )

    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Volunteer is already assigned to this task",
        )

    assignment = TaskVolunteer(
        task_id=task_id,
        volunteer_id=volunteer_id,
        status="PENDING",
    )

    db.add(assignment)

    task.status = "ASSIGNED"
    task.assigned_at = datetime.utcnow()

    db.flush()

    create_audit_log(
        db=db,
        user=current_user,
        action="ASSIGN_VOLUNTEER",
        entity_type="TASK",
        entity_id=task.id,
        details=f"Assigned volunteer {volunteer.id} to task {task.id}",
    )

    db.commit()
    db.refresh(assignment)

    return assignment


@router.post("/{task_id}/accept")
def accept_task(
    task_id: int,
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

    assignment = (
        db.query(TaskVolunteer)
        .filter(
            TaskVolunteer.task_id == task_id,
            TaskVolunteer.volunteer_id == volunteer.id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task assignment not found",
        )

    if assignment.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is not pending acceptance",
        )

    assignment.status = "ACCEPTED"
    assignment.accepted_at = datetime.utcnow()

    create_audit_log(
        db=db,
        user=current_user,
        action="ACCEPT_TASK",
        entity_type="TASK",
        entity_id=task_id,
        details=f"Volunteer {volunteer.id} accepted task {task_id}",
    )

    db.commit()
    db.refresh(assignment)

    return assignment


@router.post("/{task_id}/reject")
def reject_task(
    task_id: int,
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

    assignment = (
        db.query(TaskVolunteer)
        .filter(
            TaskVolunteer.task_id == task_id,
            TaskVolunteer.volunteer_id == volunteer.id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task assignment not found",
        )

    if assignment.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is not pending acceptance",
        )

    assignment.status = "REJECTED"

    create_audit_log(
        db=db,
        user=current_user,
        action="REJECT_TASK",
        entity_type="TASK",
        entity_id=task_id,
        details=f"Volunteer {volunteer.id} rejected task {task_id}",
    )

    db.commit()
    db.refresh(assignment)

    return assignment


@router.get("/")
def get_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Task).all()


@router.get("/{task_id}")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return task


@router.patch("/{task_id}/status")
def update_task_status(
    task_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    old_status = task.status
    task.status = new_status


    if new_status == "ASSIGNED":
        task.assigned_at = datetime.utcnow()

    elif new_status == "IN_PROGRESS":
        task.started_at = datetime.utcnow()

    elif new_status == "COMPLETED":
        task.completed_at = datetime.utcnow()

    create_audit_log(
        db=db,
        user=current_user,
        action="UPDATE_STATUS",
        entity_type="TASK",
        entity_id=task.id,
        details=f"Status changed from {old_status} to {new_status}",
    )

    db.commit()
    db.refresh(task)

    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    create_audit_log(
    db=db,
    user=current_user,
    action="DELETE",
    entity_type="TASK",
    entity_id=task.id,
    details=f"Deleted task: {task.task_type}",
)
    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully"
    }