# path: backend/app/services/system_service.py

from sqlalchemy.orm import Session
from pathlib import Path
import shutil

from ..models import models_database
from ..utils.model_manager import model_manager
from ..config import settings


# ==========================================================
# CLEAR DIRECTORY
# ==========================================================
def _clear_directory(folder_path: str):
    """
    Menghapus semua isi folder tanpa menghapus foldernya
    """

    folder = Path(folder_path)

    if not folder.exists():
        return

    for item in folder.iterdir():
        try:
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
        except Exception:
            pass


# ==========================================================
# SYSTEM RESET
# ==========================================================
def reset_system_service(db: Session):

    # ==========================
    # DELETE DATABASE DATA
    # ==========================
    training_deleted = db.query(models_database.TrainingJob).delete()
    models_deleted = db.query(models_database.Model).delete()
    prediction_deleted = db.query(models_database.PredictionLog).delete()
    testing_deleted = db.query(models_database.TestingUploadLog).delete()
    dataset_deleted = db.query(models_database.DatasetUploadLog).delete()

    db.commit()

    # ==========================
    # CLEAR MODEL CACHE
    # ==========================
    if hasattr(model_manager, "clear_cache"):
        model_manager.clear_cache()

    # ==========================
    # CLEAN STORAGE
    # ==========================
    cleaned_folders = []

    folders_to_clean = [
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

    for folder in folders_to_clean:
        _clear_directory(folder)
        cleaned_folders.append(folder)

    return {
        "training_deleted": training_deleted,
        "models_deleted": models_deleted,
        "prediction_deleted": prediction_deleted,
        "testing_deleted": testing_deleted,
        "dataset_deleted": dataset_deleted,
        "cleaned_folders": cleaned_folders
    }