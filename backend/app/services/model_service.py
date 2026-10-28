# backend/app/services/model_service.py

import os
import shutil
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import HTTPException

from ..config import settings
from ..models import models_database
from ..utils.file_utils import to_relative_app_path, to_absolute_app_path
from ..utils.model_manager import model_manager


from sqlalchemy import func
from ..utils.time_utils import generate_ts


# ============================================================
# UTILITIES
# ============================================================

def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


# ============================================================
# GET LATEST VERSION
# ============================================================

def get_latest_version(db: Session) -> int:
    """
    Mengambil versi model terbaru dari database.
    Jika belum ada model → return 0
    """

    latest = (
        db.query(models_database.Model)
        .order_by(models_database.Model.version.desc())
        .first()
    )

    if not latest:
        return 0

    return latest.version


# ============================================================
# SAVE MODEL FILE (UPLOAD / TRAINING OUTPUT)
# ============================================================

def save_model_file(
    db: Session,
    user_id: int,
    src_path: str,
    name: str,
    dest_dir: str,
):

    ensure_dir(dest_dir)

    folder_name = f"{name}_{user_id}_{generate_ts()}"
    final_dir = Path(dest_dir) / folder_name
    ensure_dir(final_dir)

    # ========================================
    # SOURCE = TRAINING FOLDER
    # ========================================
    if os.path.isdir(src_path):

        shutil.copytree(src_path, final_dir, dirs_exist_ok=True)

        pth_files = list(final_dir.glob("*.pth"))

        if not pth_files:
            raise HTTPException(500, "Training output tidak memiliki file .pth")

        (final_dir / "model.pth").unlink(missing_ok=True)

        shutil.move(str(pth_files[0]), final_dir / "model.pth")

    # ========================================
    # SOURCE = MANUAL UPLOAD
    # ========================================
    else:

        if not src_path.lower().endswith(".pth"):
            raise HTTPException(400, "File model harus .pth")

        shutil.copy(src_path, final_dir / "model.pth")

    # ========================================
    # VERSIONING
    # ========================================

    version = get_latest_version(db) + 1

    # ========================================
    # SAVE DB
    # ========================================

    model = models_database.Model(
        name=name,
        path=to_relative_app_path(final_dir),
        uploaded_by=user_id,
        is_active=False,
        version=version,
    )

    db.add(model)
    db.commit()
    db.refresh(model)

    return model


# ============================================================
# LIST MODELS
# ============================================================

def list_models(db: Session):

    return (
        db.query(models_database.Model)
        .filter(models_database.Model.is_archived == False)
        .order_by(models_database.Model.created_at.desc())
        .all()
    )


def get_model(db: Session, model_id: int):

    return db.query(models_database.Model).filter_by(id=model_id).first()


def get_active_model(db: Session):

    return (
        db.query(models_database.Model)
        .filter(models_database.Model.is_active == True)
        .order_by(models_database.Model.version.desc())
        .first()
    )


# ============================================================
# SET ACTIVE MODEL
# ============================================================

def set_active_model(db: Session, model: models_database.Model):

    db.query(models_database.Model).update(
        {models_database.Model.is_active: False},
        synchronize_session=False
    )

    model.is_active = True

    db.commit()
    db.refresh(model)

    # =================================
    # COPY MODEL KE models_predict
    # =================================

    copy_model_to_predict_dir(model)

    # =================================
    # TULIS model_info.json
    # Dibaca predict service tanpa DB
    # =================================

    import json as _json
    dst_dir = Path(settings.PREDICT_MODEL_DIR)
    mapping_file = dst_dir / "class_mapping.json"
    arch = "unet"
    if mapping_file.exists():
        with open(mapping_file) as f:
            arch = _json.load(f).get("architecture", "unet")

    model_info = {
        "model_id":   model.id,
        "name":       model.name,
        "version":    model.version,
        "architecture": arch,
        "activated_at": datetime.utcnow().isoformat(),
    }
    with open(dst_dir / "model_info.json", "w") as f:
        _json.dump(model_info, f, indent=2)

    # reload cache
    model_manager.clear_cache()

    return model


# ============================================================
# COPY MODEL BUNDLE
# ============================================================
def copy_model_to_predict_dir(model: models_database.Model):
    import logging
    import subprocess
    log = logging.getLogger("backend")

    src_dir = Path(to_absolute_app_path(model.path))

    if src_dir.is_file():
        src_dir = src_dir.parent

    dst_dir = Path(settings.PREDICT_MODEL_DIR)
    dst_dir.mkdir(parents=True, exist_ok=True)

    # =============================
    # HAPUS MODEL LAMA
    # =============================

    for item in dst_dir.iterdir():
        if item.is_dir():
            shutil.rmtree(item)
        else:
            item.unlink()

    # =============================
    # COPY MODEL BARU
    # =============================

    for item in src_dir.iterdir():
        target = dst_dir / item.name
        if item.is_dir():
            shutil.copytree(item, target)
        else:
            shutil.copy2(item, target)

    # =============================
    # COPY training_artifact.json
    # dari folder run jika ada
    # =============================
    artifact_src = src_dir / "training_artifact.json"
    if artifact_src.exists():
        shutil.copy2(artifact_src, dst_dir / "training_artifact.json")
        log.info("training_artifact.json copied to models_predict")
    else:
        parent_artifact = src_dir.parent / "training_artifact.json"
        if parent_artifact.exists():
            shutil.copy2(parent_artifact, dst_dir / "training_artifact.json")
            log.info("training_artifact.json copied from parent to models_predict")

    # =============================
    # SYNC KE WORKER NODE (background)
    # Jalan di thread terpisah agar aktivasi model tidak tertunda
    # =============================
    sync_script = Path(__file__).resolve().parents[2] / "scripts" / "sync_model_to_worker.sh"
    if sync_script.exists():
        import threading

        def _sync():
            try:
                result = subprocess.run(
                    ["bash", str(sync_script)],
                    capture_output=True, text=True, timeout=300
                )
                if result.returncode == 0:
                    log.info("Model synced to worker node (background)")
                else:
                    log.warning(f"Sync to worker failed: {result.stderr[:200]}")
            except Exception as e:
                log.warning(f"Sync to worker error: {e}")

        threading.Thread(target=_sync, daemon=True).start()
        log.info("Worker sync started in background")


# ============================================================
# ROLLBACK
# ============================================================

def rollback_to_previous_model(db: Session):

    active = get_active_model(db)

    if not active:
        return None, "No active model"

    prev = (
        db.query(models_database.Model)
        .join(models_database.TrainingJob)
        .filter(
            models_database.Model.version < active.version,
            models_database.TrainingJob.review_status == "approved",
        )
        .order_by(models_database.Model.version.desc())
        .first()
    )

    if not prev:
        return None, "No previous approved model"

    set_active_model(db, prev)

    return prev, "Rollback successful"


# ============================================================
# FALLBACK MODEL (FILESYSTEM)
# ============================================================

def get_active_model_or_filesystem(db: Session):
    # Selalu utamakan model yang tercatat aktif di DB
    return get_active_model(db)


def activate_model_service(model_id: int, db: Session):

    model = db.query(models_database.Model).filter_by(id=model_id).first()

    if not model:
        raise HTTPException(404, "Model not found")

    if model.training_job:
        if model.training_job.review_status != "approved":
            raise HTTPException(
                400,
                "Training must be approved before activation"
            )

    return set_active_model(db, model)

def get_next_model_version(db: Session) -> int:
    """
    Mengambil nomor version berikutnya
    berdasarkan model yang sudah approved.
    """

    max_version = db.query(func.max(models_database.Model.version)).scalar()

    if not max_version:
        return 1

    return max_version + 1


def list_models_with_training(db: Session):

    return (
        db.query(models_database.Model)
        .outerjoin(models_database.TrainingJob)
        .filter(models_database.Model.is_archived == False)
        .order_by(models_database.Model.created_at.desc())
        .all()
    )