# backend/app/services/predict_service.py

import os
import shutil
import base64
import io
from pathlib import Path
from datetime import datetime

from PIL import Image
from sqlalchemy.orm import Session

from ..models.models_database import PredictionLog, TestingUploadLog
from ..utils.file_utils import to_relative_app_path
from ..utils.time_utils import generate_ts
from ..config import settings


# ============================================================
# FOLDER USER: datasets_test/<user>/
# ============================================================

def get_user_dir(user_id: int | None) -> Path:
    base   = Path(settings.TEST_DATASET_DIR)
    folder = f"user_{user_id}" if user_id else "public"
    full   = base / folder
    full.mkdir(parents=True, exist_ok=True)
    return full


# ============================================================
# SAVE FILE UPLOAD → path relatif
# ============================================================

def save_test_file(
    db: Session,
    src_path: str,
    filename: str,
    subfolder: str = "inputs",
    user_id: int | None = None,
) -> str:
    user_dir  = get_user_dir(user_id)
    dest_dir  = user_dir / subfolder
    dest_dir.mkdir(parents=True, exist_ok=True)

    ts        = generate_ts()
    dest_name = f"{subfolder}_{ts}{Path(filename).suffix}"
    dest_path = dest_dir / dest_name

    shutil.copy(src_path, dest_path)
    rel_path = to_relative_app_path(dest_path)

    if user_id and subfolder == "inputs":
        log = TestingUploadLog(
            user_id=user_id,
            filename=dest_name,
            saved_path=rel_path,
        )
        db.add(log)
        db.commit()
        db.refresh(log)

    return rel_path


# ============================================================
# LOG PREDIKSI
# ============================================================

def log_prediction(
    db: Session,
    user_id: int,
    model_record,
    input_filename: str,
    saved_input_path: str,
    saved_output_path: str | None,
    metrics: dict | None,
    flood_percentage: float | None = None,
) -> int:
    """Simpan log prediksi segmentasi ke DB, kembalikan log_id."""
    iou  = metrics.get("iou")  if metrics else None
    dice = metrics.get("dice") if metrics else None

    log = PredictionLog(
        user_id=user_id,
        model_id=model_record.id if model_record else None,
        input_filename=input_filename,
        input_path=saved_input_path,
        output_filename=saved_output_path or "segmented.png",
        output_path=saved_output_path,
        confidence=iou,
        true_label=f"dice={dice:.4f}" if dice is not None else None,
        flood_percentage=flood_percentage,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log.id
