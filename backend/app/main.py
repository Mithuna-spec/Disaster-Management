from fastapi import FastAPI
from sqlalchemy import text


from app.db.database import engine
from app.models import (
    User,
    Volunteer,
    Beneficiary,
    DisasterEvent,
    EmergencyRequest,
    Task,
    TaskVolunteer,
    Resource,
    InventoryLog,
    Notification,
    AuditLog,
)

from app.api.auth import router as auth_router
from fastapi import Depends
from app.core.dependencies import get_current_user
from app.api.disasters import router as disasters_router
from app.api.emergency_requests import router as emergency_requests_router
from app.api.tasks import router as tasks_router
from app.api.volunteers import router as volunteers_router
from app.api.resources import router as resources_router
from app.api.notifications import router as notifications_router
from app.api.audit_logs import router as audit_logs_router



app = FastAPI(
    title="NGO Disaster Response Platform",
    description="AI-powered disaster response and volunteer coordination backend",
    version="1.0.0",
)


app.include_router(auth_router)
app.include_router(disasters_router)
app.include_router(emergency_requests_router)
app.include_router(tasks_router)
app.include_router(volunteers_router)
app.include_router(resources_router)
app.include_router(notifications_router)
app.include_router(audit_logs_router)

@app.get("/")
def root():
    return {
        "message": "NGO Disaster Response API is running"
    }


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


@app.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
    }