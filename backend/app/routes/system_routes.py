# backend/app/routes/system_routes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pathlib import Path

from ..database import get_db
from ..services.training_service import (
    is_training_running,
    get_training_status_service
)
from ..services.system_service import reset_system_service
from ..config import settings

router = APIRouter(prefix="/system", tags=["system"])


# ==========================================================
# SYSTEM STATUS
# ==========================================================
@router.get("/status")
def system_status(db: Session = Depends(get_db)):

    training_running = is_training_running(db)

    return {
        "training_running": training_running,
        "system_locked": training_running
    }


# ==========================================================
# TRAINING STATUS (dipakai frontend polling)
# ==========================================================
@router.get("/training-status")
def training_status(db: Session = Depends(get_db)):
    return get_training_status_service(db)


# ==========================================================
# SYSTEM RESET
# ==========================================================
@router.post("/reset")
def reset_system(db: Session = Depends(get_db)):

    if is_training_running(db):
        raise HTTPException(400, "Cannot reset while training is running")

    result = reset_system_service(db)

    return {
        "detail": "System reset completed",
        "result": result
    }


# ==========================================================
# RESET PREVIEW
# ==========================================================
@router.get("/reset-preview")
def reset_preview(db: Session = Depends(get_db)):

    folders = [
        settings.TRAIN_DATASET_DIR,
        settings.PENDING_DATASET_DIR,
        settings.REJECT_DATASET_DIR,
        settings.TEST_DATASET_DIR,
        settings.TEST_TRUE_DIR,
        settings.TRAIN_MODEL_DIR,
        settings.UPLOAD_MODEL_DIR,
        settings.REJECT_MODEL_DIR,
        settings.LOG_DIR,
    ]

    files = 0
    directories = 0

    for folder in folders:

        p = Path(folder)

        if not p.exists():
            continue

        for item in p.iterdir():
            if item.is_dir():
                directories += 1
            else:
                files += 1

    return {
        "files_to_delete": files,
        "directories_to_delete": directories
    }