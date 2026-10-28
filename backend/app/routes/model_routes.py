#backend/app/routes/model_routes.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from pathlib import Path
import os
import tempfile
import shutil
import json
import zipfile
from datetime import datetime

from ..database import get_db
from ..services.auth_service import require_admin, get_current_user
from ..utils.common_utils import get_or_404, ensure_folder_exists
from ..utils.file_utils import to_base64
from ..utils.file_utils import to_relative_app_path, to_absolute_app_path

from ..services.model_service import (
    get_latest_version,
    set_active_model,
    rollback_to_previous_model,
)

from ..config import settings
from ..models import models_database


router = APIRouter(
    prefix="/admin/models",
    tags=["admin-models"],
    dependencies=[Depends(require_admin)],
)
from ..utils.time_utils import generate_ts

# ============================================================
# LIST ALL MODELS
# ============================================================

@router.get("/lists")
def api_list_models(db: Session = Depends(get_db)):

    from ..services.model_service import list_models_with_training
    models_list = list_models_with_training(db)

    return [
        {
            "id": m.id,
            "name": m.name,
            "version": m.version,
            "path": m.path,
            "is_active": m.is_active,
            "created_at": m.created_at,
            "review_status": m.review_status,
            "architecture": m.training_job.architecture if m.training_job else None,
            "accuracy": m.training_job.accuracy if m.training_job else None,
            "precision": m.training_job.precision if m.training_job else None,
            "recall": m.training_job.recall if m.training_job else None,
            "f1": m.training_job.f1 if m.training_job else None,
        }
        for m in models_list
    ]


# ============================================================
# GET ACTIVE MODEL
# ============================================================

@router.get("/active")
def api_get_active_model(db: Session = Depends(get_db)):

    m = (
        db.query(models_database.Model)
        .outerjoin(models_database.TrainingJob)
        .filter(models_database.Model.is_active == True)
        .order_by(models_database.Model.version.desc())
        .first()
    )

    if not m:
        return {"active": None}

    return {
        "id": m.id,
        "name": m.name,
        "version": m.version,
        "path": m.path,
        "is_active": m.is_active,
        "review_status": m.review_status,
        "accuracy": m.training_job.accuracy if m.training_job else None,
        "precision": m.training_job.precision if m.training_job else None,
        "recall": m.training_job.recall if m.training_job else None,
        "f1": m.training_job.f1 if m.training_job else None,
    }


# ============================================================
# PREVIEW MODEL
# ============================================================

@router.get("/preview/{model_id}")
def preview_model(model_id: int, db: Session = Depends(get_db)):

    model = get_or_404(
        db.query(models_database.Model).filter_by(id=model_id),
        "Model not found"
    )

    model_path = Path(to_absolute_app_path(model.path))

    if model_path.is_file():
        model_path = model_path.parent

    ensure_folder_exists(model_path, f"Model folder not found: {model_path}")

    metrics_file = model_path / "metrics.json"
    preview_file = model_path / "preview.png"

    metrics_data = None

    if metrics_file.exists():
        try:
            with open(metrics_file) as f:
                metrics_data = json.load(f)
        except Exception:
            metrics_data = None

    preview_base64 = to_base64(preview_file) if preview_file.exists() else None

    return {
        "model_id": model.id,
        "metrics": metrics_data,
        "preview_image": preview_base64,
    }


# ============================================================
# UPLOAD MODEL
# ============================================================

@router.post("/upload")
def upload_model(
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(400, "File harus dalam format .zip")

    # cek ukuran file (max 1GB)
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > 1024 * 1024 * 1024:
        raise HTTPException(400, "Model file too large (max 1GB)")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    final_dir = None

    try:

        folder_name = f"{name}_{current_user.id}_{generate_ts()}"
        final_dir = Path(settings.UPLOAD_MODEL_DIR) / folder_name
        final_dir.mkdir(parents=True, exist_ok=True)

        try:
            with zipfile.ZipFile(tmp_path, "r") as zip_ref:
                zip_ref.extractall(final_dir)
        except zipfile.BadZipFile:
            raise HTTPException(400, "Invalid ZIP file")

        required_files = ["model.pth", "class_mapping.json"]

        for fname in required_files:
            if not (final_dir / fname).exists():
                raise HTTPException(400, f"{fname} tidak ditemukan di dalam ZIP")

        try:
            with open(final_dir / "class_mapping.json") as f:
                mapping = json.load(f)

            if not isinstance(mapping, dict):
                raise HTTPException(400, "class_mapping.json tidak valid")

        except Exception:
            raise HTTPException(400, "class_mapping.json rusak")

        model = models_database.Model(
            name=name,
            path=to_relative_app_path(final_dir),
            uploaded_by=current_user.id,
            is_active=False,
            version=get_latest_version(db) + 1
        )

        db.add(model)
        db.commit()
        db.refresh(model)

        return {
            "detail": "Model uploaded successfully",
            "model_id": model.id,
        }

    finally:

        if os.path.exists(tmp_path):
            os.remove(tmp_path)

        if final_dir and final_dir.exists():
            if not any(final_dir.iterdir()):
                shutil.rmtree(final_dir, ignore_errors=True)


# ============================================================
# SET ACTIVE MODEL
# ============================================================

@router.post("/set-active/{model_id}")
def api_set_active_model(model_id: int, db: Session = Depends(get_db)):

    model = get_or_404(
        db.query(models_database.Model).filter_by(id=model_id),
        "Model not found"
    )

    updated = set_active_model(db, model)

    return {
        "message": "Active model updated",
        "active_model": updated.id,
        "version": updated.version,
    }


# ============================================================
# ROLLBACK MODEL
# ============================================================

@router.post("/rollback")
def api_rollback_model(db: Session = Depends(get_db)):

    model, msg = rollback_to_previous_model(db)

    if not model:
        raise HTTPException(400, msg)

    return {
        "message": msg,
        "active_model": model.id,
        "version": model.version,
    }


# ============================================================
# CHECK ROLLBACK AVAILABILITY
# ============================================================

@router.get("/rollback-available")
def api_rollback_available(db: Session = Depends(get_db)):

    approved_models = (
        db.query(models_database.Model)
        .join(models_database.TrainingJob)
        .filter(
            models_database.TrainingJob.review_status == "approved",
            models_database.Model.is_archived == False,
            models_database.Model.is_active == False,
        )
        .order_by(models_database.Model.version.desc())
        .all()
    )

    return {"available": len(approved_models) >= 1}


# ============================================================
# RANKED MODELS
# ============================================================

@router.get("/ranked")
def api_ranked_models(db: Session = Depends(get_db)):

    ranked = (
        db.query(models_database.Model)
        .join(models_database.TrainingJob)
        .filter(models_database.TrainingJob.review_status == "approved")
        .order_by(
            models_database.TrainingJob.f1.desc().nullslast(),
            models_database.TrainingJob.accuracy.desc().nullslast(),
            models_database.Model.version.desc(),
        )
        .all()
    )

    return [
        {
            "id": m.id,
            "name": m.name,
            "version": m.version,
            "is_active": m.is_active,
            "accuracy": m.training_job.accuracy,
            "precision": m.training_job.precision,
            "recall": m.training_job.recall,
            "f1": m.training_job.f1,
        }
        for m in ranked
    ]