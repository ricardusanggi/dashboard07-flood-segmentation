#path: backend/app/routes/training_routes.py
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Body
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..services.auth_service import require_admin, get_current_user
from ..models import models_database
from ..utils.training_config_helper import build_training_config

from ..services.training_service import (
    is_previous_training_incomplete,
    is_training_running,
    start_training,
    training_task,
    ensure_segmentation_training_data,
    get_last_training_job,
    serialize_job,
    preview_training_job_service,
    training_metrics_service,
    review_training_approve_service,
    review_training_reject_service,
    training_global_lock,
    get_training_status_service,
)

from ..config_training import DEFAULT_TRAINING_PARAMS, ALLOWED_OPTIMIZERS, ALLOWED_LOSS

router = APIRouter(
    prefix="/admin",
    tags=["admin-training"],
    dependencies=[Depends(require_admin)],
)

# ==========================================================
# START TRAINING
# ==========================================================
@router.post("/train")
def api_start_training(
    background_tasks: BackgroundTasks,
    params: dict | None = Body(default=None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):

    if is_training_running(db):
        raise HTTPException(409, "Training masih berjalan")

    last_job = get_last_training_job(db)

    if last_job and is_previous_training_incomplete(last_job):
        raise HTTPException(
            status_code=409,
            detail=f"Training sebelumnya belum selesai (status={last_job.review_status})",
        )

    dataset_path = Path(settings.TRAIN_DATASET_DIR)

    dataset_info = ensure_segmentation_training_data(str(dataset_path))

    output_dir = Path(settings.TRAIN_MODEL_DIR)
    output_dir.mkdir(parents=True, exist_ok=True)

    merged_params = build_training_config(params)

    job = start_training(
        db=db,
        started_by=current_user.id,
        params=merged_params,
    )

    background_tasks.add_task(
        training_task,
        job_id=job.id,
        dataset_path=str(dataset_path),
        output_path=str(output_dir),
        params=merged_params,
    )

    return {
        "detail": "Training dimulai",
        "job_id": job.id,
        "dataset": dataset_info,
        "config": merged_params,
    }


# ==========================================================
# LIST TRAINING JOBS
# ==========================================================
@router.get("/training/jobs")
def api_training_jobs(db: Session = Depends(get_db)):

    jobs = (
        db.query(models_database.TrainingJob)
        .order_by(models_database.TrainingJob.created_at.desc())
        .all()
    )

    return [serialize_job(j) for j in jobs]


# ==========================================================
# APPROVE TRAINING
# ==========================================================
@router.post("/review-approve/{job_id}")
def review_training_approve(
    job_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return review_training_approve_service(
        job_id=job_id,
        db=db,
        user_id=current_user.id,
    )


# ==========================================================
# REJECT TRAINING
# ==========================================================
@router.post("/review-reject/{job_id}")
def review_training_reject(
    job_id: int,
    payload: dict | None = Body(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    reason = payload.get("reason") if isinstance(payload, dict) else None

    return review_training_reject_service(
        job_id=job_id,
        reason=reason,
        db=db,
        user_id=current_user.id,
    )


# ==========================================================
# PREVIEW TRAINING
# ==========================================================
@router.get("/training/preview/{job_id}")
def preview_training_job(
    job_id: int,
    sample_count: int = 6,
    db: Session = Depends(get_db),
):
    return preview_training_job_service(
        job_id=job_id,
        sample_count=sample_count,
        db=db,
    )


# ==========================================================
# TRAINING METRICS
# ==========================================================
@router.get("/training/metrics/{job_id}")
def training_metrics(job_id: int):
    return training_metrics_service(job_id)