#path: backend/app/routes/admin_dashboard_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pathlib import Path


from ..utils.api_dependencies import block_when_training
from ..database import get_db
from ..services.auth_service import get_current_user, require_admin
from ..models import models_database
from ..config import settings
from ..utils.common_utils import IMAGE_EXT

router = APIRouter(
    prefix="/admin/dashboard",
    tags=["admin-dashboard"],
    dependencies=[Depends(require_admin)]
)


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):

    # ===============================
    # ACTIVE MODEL
    # ===============================
    active_model = (
        db.query(models_database.Model)
        .filter(models_database.Model.is_active == True)
        .first()
    )

    # ===============================
    # BASIC COUNTS
    # ===============================
    from ..services.dashboard_service import (
        get_total_users,
        get_total_models,
        get_total_trainings
    )

    total_users = get_total_users(db)
    total_models = get_total_models(db)
    total_trainings = get_total_trainings(db)
    
    # ===============================
    # DATASET STATS (FOLDER BASED)
    # ===============================
    dataset_dir = Path(settings.TRAIN_DATASET_DIR)

    total_images = 0
    per_class = {}

    if dataset_dir.exists():

        for class_folder in dataset_dir.iterdir():

            if not class_folder.is_dir():
                continue

            count = 0

            for file in class_folder.iterdir():
                if file.is_file() and file.suffix.lower() in IMAGE_EXT:
                    count += 1

            per_class[class_folder.name] = count
            total_images += count

    num_classes = len(per_class)

    # dataset siap training jika ada minimal 1 gambar
    ready_for_training = num_classes if total_images > 0 else 0

    return {
        "pending_datasets": 0,  # karena dataset tidak pakai DB
        "active_model": active_model.name if active_model else None,
        "total_users": total_users,
        "total_models": total_models,
        "total_trainings": total_trainings,

        "total_images": total_images,
        "num_classes": num_classes,
        "ready_for_training": ready_for_training,
        "per_class": per_class
    }