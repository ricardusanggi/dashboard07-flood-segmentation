# path: backend/app/routes/system_routes_admin.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pathlib import Path
import shutil
from datetime import datetime

from ..database import get_db
from ..models.models_database import (
    Model,
    TrainingJob,
    DatasetUploadLog,
    TestingUploadLog,
    PredictionLog,
    SystemLock,
)

from ..config import settings
from ..services.auth_service import get_current_admin_user
from ..utils.schemas import SystemResetRequest


router = APIRouter(prefix="/admin/system", tags=["Admin System"])


# ==========================================================
# RESET PREVIEW
# ==========================================================

@router.get("/reset-preview")
def reset_preview(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user),
):

    if admin.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required"
        )

    storage_root = Path(settings.TRAIN_DATASET_DIR).resolve().parent
    predict_dir = Path(settings.PREDICT_MODEL_DIR).resolve()
    database_dir = Path(settings.DATABASE_URL.replace("sqlite:///", "")).resolve().parent
    backup_dir = (Path(settings.LOG_DIR) / "db_backups").resolve()

    files = 0
    dirs = 0

    if not storage_root.exists():
        return {
            "storage_root": str(storage_root),
            "files_to_delete": 0,
            "directories_to_delete": 0,
            "preserved": ["database", "models_predict", "db_backups"]
        }

    for item in storage_root.rglob("*"):

        resolved = item.resolve()

        if predict_dir in resolved.parents:
            continue

        if database_dir in resolved.parents:
            continue

        if backup_dir in resolved.parents:
            continue

        if item.is_dir():
            dirs += 1
        else:
            files += 1

    return {
        "storage_root": str(storage_root),
        "files_to_delete": files,
        "directories_to_delete": dirs,
        "preserved": [
            "database",
            "models_predict",
            "db_backups"
        ]
    }


# ==========================================================
# SYSTEM RESET
# ==========================================================

@router.post("/reset")
def reset_system(
    payload: SystemResetRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user),
):

    if payload.confirm_text != "RESET SYSTEM":
        raise HTTPException(
            status_code=400,
            detail="Confirmation text mismatch"
        )

    if admin.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can reset the system"
        )

    running_training = db.query(TrainingJob).filter(
        TrainingJob.review_status == "running"
    ).first()

    if running_training:
        raise HTTPException(
            status_code=400,
            detail="Training currently running"
        )

    # =====================================================
    # DATABASE BACKUP
    # =====================================================

    backup_file_path = None

    if settings.DATABASE_URL.startswith("sqlite:///"):

        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        db_file = Path(db_path)

        backup_dir = Path(settings.LOG_DIR) / "db_backups"
        backup_dir.mkdir(parents=True, exist_ok=True)
        
        from ..utils.time_utils import generate_ts
        backup_file_path = backup_dir / f"traclassy_backup_{generate_ts()}.db"

        if db_file.exists():
            shutil.copy(db_file, backup_file_path)

    # =====================================================
    # AUDIT LOG
    # =====================================================

    log_file = Path(settings.LOG_DIR) / "system_reset.log"

    try:
        with open(log_file, "a") as f:
            f.write(
                f"{datetime.utcnow()} - SYSTEM RESET BY {admin.username}\n"
            )
    except Exception:
        pass

    # =====================================================
    # DELETE DATABASE TABLE DATA
    # =====================================================

    db.query(PredictionLog).delete()
    db.query(TestingUploadLog).delete()
    db.query(DatasetUploadLog).delete()
    db.query(TrainingJob).delete()
    db.query(Model).delete()
    db.query(SystemLock).delete()

    db.commit()

    # =====================================================
    # STORAGE CLEANUP
    # =====================================================

    storage_root = Path(settings.TRAIN_DATASET_DIR).resolve().parent
    predict_dir = Path(settings.PREDICT_MODEL_DIR).resolve()
    database_dir = Path(settings.DATABASE_URL.replace("sqlite:///", "")).resolve().parent
    backup_dir = (Path(settings.LOG_DIR) / "db_backups").resolve()

    deleted_files = 0
    deleted_dirs = 0

    if not storage_root.exists():
        return {
            "status": "error",
            "message": "Storage root not found"
        }

    for item in storage_root.iterdir():

        try:

            resolved = item.resolve()

            # Skip protected folders
            if resolved in [predict_dir, database_dir, backup_dir]:
                continue

            if item.is_dir():
                shutil.rmtree(item)
                deleted_dirs += 1
            else:
                item.unlink()
                deleted_files += 1

        except Exception as e:

            try:
                with open(log_file, "a") as f:
                    f.write(
                        f"{datetime.utcnow()} - DELETE ERROR {resolved}: {str(e)}\n"
                    )
            except Exception:
                pass

    return {
        "status": "success",
        "message": "System reset completed",
        "deleted_files": deleted_files,
        "deleted_directories": deleted_dirs,
        "backup_database": str(backup_file_path) if backup_file_path else None,
        "preserved": [
            "users",
            "database",
            "models_predict",
            "db_backups"
        ]
    }