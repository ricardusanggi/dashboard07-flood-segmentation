# backend/app/routes/user_routes.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..services.auth_service  import require_admin, get_current_user
from ..services.user_service import list_users, get_user, update_user, delete_user
from ..utils.schemas import UserOut, UserSelfUpdate
from ..models.models_database import PredictionLog, DatasetUploadLog, User
from pathlib import Path
from ..config import settings
from ..services.user_service import get_user_prediction_history

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserOut)
def read_current_user(current_user = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=List[UserOut]) 
def read_users(
    db: Session = Depends(get_db),
    _: None = Depends(require_admin)
):
    users = list_users(db)
    return users

@router.put("/me", response_model=UserOut)
def update_my_profile(
    payload: UserSelfUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    allowed_fields = {"email", "full_name", "password"}
    update_data = {}

    for key, value in payload.dict().items():
        if value is not None and key in allowed_fields:
            update_data[key] = value

    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    updated = update_user(db, current_user.id, update_data, is_admin=False)
    return updated

@router.get("/check-username")
def check_username(username: str, db: Session = Depends(get_db)):
    from ..services.user_service import get_user_by_username
    exists = get_user_by_username(db, username)
    return {"exists": bool(exists)}

@router.get("/check-email")
def check_email(email: str, db: Session = Depends(get_db)):
    from ..services.user_service import get_user_by_email
    exists = get_user_by_email(db, email)
    return {"exists": bool(exists)}

@router.get("/predictions/history")
def get_my_prediction_history(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    logs = get_user_prediction_history(db, current_user.id)

    return {
        "data": [
            {
                "id":               log.id,
                "input_filename":   log.input_filename,
                "method":           log.model.name if log.model else None,
                "model_version":    log.model.version if log.model else None,
                "flood_percentage": log.flood_percentage,
                "predicted_at":     log.predicted_at,
            }
            for log in logs
        ]
    }

@router.get("/dashboard-stats")
def get_user_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    base_query = db.query(DatasetUploadLog).filter(
        DatasetUploadLog.user_id == current_user.id,
        DatasetUploadLog.status == "approved"
    )

    total_uploads = base_query.count()

    total_images = (
        db.query(func.coalesce(func.sum(DatasetUploadLog.total_images), 0))
        .filter(
            DatasetUploadLog.user_id == current_user.id,
            DatasetUploadLog.status == "approved"
        )
        .scalar()
    )

    logs = base_query.all()

    unique_classes = set()
    distribution = {}

    for log in logs:
        if log.class_names:
            unique_classes.update(log.class_names)

            for cls in log.class_names:
                distribution.setdefault(cls, 0)

    total_labels = len(unique_classes)

    total_predictions = (
        db.query(func.count(PredictionLog.id))
        .filter(PredictionLog.user_id == current_user.id)
        .scalar()
    )

    return {
        "total_uploads": total_uploads,
        "total_images": total_images,
        "total_labels": total_labels,
        "total_predictions": total_predictions,
        "distribution": distribution
    }
    


@router.get("/my-datasets-overview")
def get_user_dataset_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Statistik dataset milik user:
    - Total citra dari database (approved milik user)
    - Total label unik dari database
    - Total citra dari TRAIN_DATASET_DIR (global)
    - Cek konsistensi total citra
    """

    # ==================================================
    # 1️⃣ DATA DARI DATABASE (USER)
    # ==================================================

    logs = db.query(DatasetUploadLog).filter(
        DatasetUploadLog.user_id == current_user.id,
        DatasetUploadLog.status == "approved"
    ).all()

    # 🔥 TOTAL CITRA USER (DATABASE)
    total_images_db = db.query(
        func.coalesce(func.sum(DatasetUploadLog.total_images), 0)
    ).filter(
        DatasetUploadLog.user_id == current_user.id,
        DatasetUploadLog.status == "approved"
    ).scalar()

    # 🔥 LABEL UNIK USER
    unique_labels = set()
    for log in logs:
        if log.class_names:
            unique_labels.update(log.class_names)

    total_labels_db = len(unique_labels)

    # ==================================================
    # 2️⃣ BACA TRAIN_DATASET_DIR (GLOBAL)
    # ==================================================

    train_dir = Path(settings.TRAIN_DATASET_DIR).resolve()

    total_images_train = 0
    total_classes_train = 0

    if train_dir.exists():
        for class_folder in train_dir.iterdir():
            if class_folder.is_dir():
                total_classes_train += 1

                image_files = [
                    f for f in class_folder.iterdir()
                    if f.is_file()
                ]

                total_images_train += len(image_files)

    # ==================================================
    # 3️⃣ CEK KONSISTENSI (HANYA TOTAL CITRA)
    # ==================================================

    images_match = total_images_db == total_images_train
    is_consistent = images_match

    # ==================================================
    # 4️⃣ RESPONSE (SUDAH DISESUAIKAN FRONTEND)
    # ==================================================

    return {
        "database_summary": {
            "total_images": total_images_db,
            "total_labels": total_labels_db,
        },
        "train_folder_summary": {
            "total_images": total_images_train,
            "total_classes": total_classes_train,
        },
        "consistency_check": {
            "images_match": images_match,
        },
        "is_consistent": is_consistent,
    }