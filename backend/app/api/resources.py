from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.resource import Resource
from app.models.inventory_log import InventoryLog
from app.models.task import Task
from app.models.user import User
from app.models.notification import Notification
from app.core.audit import create_audit_log

router = APIRouter(
    prefix="/resources",
    tags=["Resources"],
)



@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
)
def create_resource(
    name: str,
    resource_type: str,
    quantity: float,
    unit: str,
    minimum_threshold: float = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    if quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity cannot be negative",
        )

    if minimum_threshold < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum threshold cannot be negative",
        )

    resource = Resource(
        name=name,
        resource_type=resource_type,
        quantity=quantity,
        unit=unit,
        minimum_threshold=minimum_threshold,
    )

    db.add(resource)
    db.flush()

    create_audit_log(
        db=db,
        user=current_user,
        action="CREATE",
        entity_type="RESOURCE",
        entity_id=resource.id,
        details=f"Created resource: {resource.name}",
    )

    db.commit()
    db.refresh(resource)

    return resource


@router.get("/")
def get_resources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Resource).all()


@router.get("/{resource_id}")
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = (
        db.query(Resource)
        .filter(Resource.id == resource_id)
        .first()
    )

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    return resource


@router.patch("/{resource_id}/inventory")
def update_inventory(
    resource_id: int,
    change_type: str,
    quantity: float,
    task_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    resource = (
        db.query(Resource)
        .filter(Resource.id == resource_id)
        .first()
    )

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than zero",
        )

    if change_type not in ["RESTOCK", "ISSUE", "ADJUSTMENT"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid change type",
        )

    if task_id is not None:
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

    previous_quantity = resource.quantity

    if change_type == "RESTOCK":
        new_quantity = previous_quantity + quantity

    elif change_type == "ISSUE":
        new_quantity = previous_quantity - quantity

        if new_quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient inventory",
            )

    else:
        new_quantity = quantity

    resource.quantity = new_quantity
    resource.updated_at = datetime.utcnow()

    # Create low-stock notifications when inventory crosses the threshold
    if (
        previous_quantity > resource.minimum_threshold
        and new_quantity <= resource.minimum_threshold
    ):
        admins = (
            db.query(User)
            .filter(
                User.role == "ADMIN",
                User.is_active == True,
            )
            .all()
        )

        for admin in admins:
            notification = Notification(
                user_id=admin.id,
                type="LOW_STOCK",
                title="Low Stock Alert",
                message=(
                    f"{resource.name} is low on stock. "
                    f"Current quantity: {new_quantity} {resource.unit}. "
                    f"Minimum threshold: {resource.minimum_threshold} {resource.unit}."
                ),
                channel="IN_APP",
                status="PENDING",
            )

            db.add(notification)

    inventory_log = InventoryLog(
        resource_id=resource.id,
        task_id=task_id,
        change_type=change_type,
        quantity=quantity,
        previous_quantity=previous_quantity,
        new_quantity=new_quantity,
    )

    db.add(inventory_log)
    db.flush()

    create_audit_log(
        db=db,
        user=current_user,
        action="INVENTORY_UPDATE",
        entity_type="RESOURCE",
        entity_id=resource.id,
        details=(
            f"{change_type}: {quantity} {resource.unit}; "
            f"quantity changed from {previous_quantity} "
            f"to {new_quantity}"
        ),
    )

    db.commit()
    db.refresh(resource)

    return resource


@router.get("/{resource_id}/logs")
def get_inventory_logs(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = (
        db.query(Resource)
        .filter(Resource.id == resource_id)
        .first()
    )

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    return (
        db.query(InventoryLog)
        .filter(InventoryLog.resource_id == resource_id)
        .all()
    )


@router.delete("/{resource_id}")
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    resource = (
        db.query(Resource)
        .filter(Resource.id == resource_id)
        .first()
    )

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    create_audit_log(
    db=db,
    user=current_user,
    action="DELETE",
    entity_type="RESOURCE",
    entity_id=resource.id,
    details=f"Deleted resource: {resource.name}",
)
    db.delete(resource)
    db.commit()

    return {
        "message": "Resource deleted successfully"
    }