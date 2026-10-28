#path: backend/app/services/training_service.py
from sqlalchemy.orm import Session
from datetime import datetime
from threading import Lock
from pathlib import Path
import traceback
import json

from fastapi import HTTPException

from ..database import SessionLocal
from ..learn.train_main import run_training_job
from ..config import settings
from ..utils.common_utils import IMAGE_EXT
from ..models import models_database
from ..utils.file_utils import to_relative_app_path
from ..utils.file_utils import to_base64

from sqlalchemy import func


training_global_lock = Lock()


def _find_dir_ci(root: Path, name: str) -> Path | None:
    """Cari subdirektori dengan nama case-insensitive."""
    try:
        for d in root.iterdir():
            if d.is_dir() and d.name.lower() == name.lower():
                return d
    except Exception:
        pass
    return None


def ensure_segmentation_training_data(train_dir: str):
    """
    Validasi dataset segmentasi (case-insensitive untuk images/ dan masks/).
    """
    root = Path(train_dir)

    if not root.exists():
        raise HTTPException(400, "Folder dataset training tidak ditemukan")

    img_dir  = _find_dir_ci(root, "images")
    mask_dir = _find_dir_ci(root, "masks")

    if img_dir is None:
        raise HTTPException(400, "Folder 'images' tidak ditemukan di dataset")

    if mask_dir is None:
        raise HTTPException(400, "Folder 'masks' tidak ditemukan di dataset")

    images = [
        f for f in img_dir.iterdir()
        if f.is_file() and f.suffix.lower() in IMAGE_EXT
    ]

    if not images:
        raise HTTPException(400, "Folder 'images' tidak berisi gambar")

    return {
        "total_images": len(images),
        "img_dir": str(img_dir),
        "mask_dir": str(mask_dir),
        "task": "segmentation",
    }


def get_last_training_job(db: Session):
    return (
        db.query(models_database.TrainingJob)
        .order_by(models_database.TrainingJob.created_at.desc())
        .first()
    )


def serialize_job(job: models_database.TrainingJob | None):
    if not job:
        return None

    return {
        "id": job.id,
        "started_by": job.started_by,

        # ===============================
        # TRAINING PARAMETERS
        # ===============================
        "architecture": job.architecture,   # ← TAMBAHAN
        "epochs": job.epochs,
        "batch_size": job.batch_size,
        "learning_rate": job.learning_rate,
        "optimizer": job.optimizer,
        "loss_function": job.loss_function,
        "augmentation": job.augmentation,
        "val_split": job.val_split,

        # ===============================
        # PSO CONFIG
        # ===============================
        "use_pso": job.use_pso,
        "pso_population": job.pso_population,
        "pso_iters": job.pso_iters,

        # ===============================
        # PSO RESULT
        # ===============================
        "pso_best_score": job.pso_best_score,
        "pso_best_params": job.pso_best_params,

        # ===============================
        # TRAINING METRICS (SEGMENTASI)
        # ===============================
        "best_train_loss": job.best_train_loss,
        "best_val_loss": job.best_val_loss,
        "iou":        job.accuracy,   # reuse kolom accuracy → IoU
        "dice":       job.precision,  # reuse kolom precision → Dice
        "pixel_acc":  job.recall,     # reuse kolom recall → Pixel Acc

        # ===============================
        # MODEL RELATION
        # ===============================
        "model_id": job.model_id,

        # ===============================
        # REVIEW STATUS
        # ===============================
        "review_status": job.review_status,
        "reviewed_by": job.reviewed_by,
        "reviewed_at": job.reviewed_at,

        # ===============================
        # TIMESTAMPS
        # ===============================
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None,
    }


def is_training_running(db: Session) -> bool:
    try:
        job = (
            db.query(models_database.TrainingJob)
            .filter(models_database.TrainingJob.review_status == "running")
            .first()
        )
        return job is not None
    except Exception as e:
        print("TRAIN STATUS ERROR:", e)
        return False


def start_training(db: Session, started_by: int, params: dict):
    # =====================================
    # CEK TRAINING YANG BELUM DIREVIEW
    # =====================================

    pending_job = (
        db.query(models_database.TrainingJob)
        .filter(models_database.TrainingJob.review_status.in_(["running","pending"]))
        .first()
    )

    if pending_job:
        raise HTTPException(
            status_code=409,
            detail="Previous training has not been reviewed yet"
        )

    job = models_database.TrainingJob(
        started_by=started_by,
        architecture=params["architecture"],
        epochs=params["epochs"],
        batch_size=params["batch_size"],
        learning_rate=params["learning_rate"],
        optimizer=params["optimizer"],
        loss_function=params["loss_function"],
        augmentation=params["augmentation"],
        val_split=params["val_split"],
        review_status="running",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job



def finish_training(db: Session, job_id: int, results: dict, model_path: str):

    job = db.query(models_database.TrainingJob).filter_by(id=job_id).first()

    if not job:
        print(f"[ERROR] TrainingJob {job_id} not found")
        return None

    try:

        job.best_train_loss = results.get("best_train_loss")
        job.best_val_loss   = results.get("best_val_loss")
        # simpan segmentasi metrics ke kolom yang ada
        job.accuracy  = results.get("iou")
        job.precision = results.get("dice")
        job.recall    = results.get("pixel_acc")
        job.f1        = None

        job.updated_at = datetime.utcnow()

        run_dir = Path(model_path)

        if run_dir.is_file():
            run_dir = run_dir.parent

        required_files = ["model.pth"]

        for fname in required_files:
            if not (run_dir / fname).exists():
                raise RuntimeError(f"{fname} missing in {run_dir}")

        # ======================================
        # BUAT RECORD MODEL
        # ======================================

        model_record = models_database.Model(
            name=f"trained_model_{job_id}",
            path=to_relative_app_path(run_dir),
            uploaded_by=job.started_by,
            is_active=False,
            version=0
        )

        db.add(model_record)
        db.flush()

        job.model_id = model_record.id
        job.review_status = "pending"

        db.commit()
        db.refresh(model_record)
        print(f"[TRAIN] Model {model_record.id} created (pending review)")
        return job

    except Exception:
        db.rollback()
        traceback.print_exc()
        return None


def training_task(job_id: int, dataset_path: str, output_path: str, params: dict):

    if not training_global_lock.acquire(blocking=False):
         print("[TRAIN] Another training is running")
         return

    # print(f"[TRAIN] Lock acquired for job {job_id}")

    db = SessionLocal()

    try:
        print(f"[TRAIN] Starting training job {job_id}")

        result = run_training_job(
            job_id=job_id,
            dataset_path=dataset_path,
            output_dir=output_path,
            params=params,
            update_callback=lambda m: print(f"[TRAIN LOG] {m}")
        )

        if not result:
            raise RuntimeError("Training returned empty result")

        if "model_path" not in result:
            raise RuntimeError("Training result missing model_path")

        metrics = result.get("metrics", {})

        finish_training(
            db=db,
            job_id=job_id,
            results=metrics,
            model_path=result["model_path"]
        )

    except Exception:
        traceback.print_exc()

        fail_db = None

        # =====================================
        # FAIL SAFE STATUS UPDATE
        # =====================================
        try:
            fail_db = SessionLocal()

            job = (
                fail_db.query(models_database.TrainingJob)
                .filter_by(id=job_id)
                .first()
            )

            if job:
                job.review_status = "failed"
                job.reject_reason = "Training crashed"
                job.updated_at = datetime.utcnow()

                fail_db.commit()

        except Exception:
            traceback.print_exc()

        finally:
            if fail_db:
                fail_db.close()

    finally:
        db.close()

        if training_global_lock.locked():
            training_global_lock.release()


def preview_training_job_service(job_id: int, sample_count: int, db: Session):

    job = db.query(models_database.TrainingJob).filter_by(id=job_id).first()

    if not job:
        raise HTTPException(404, "Training job not found")

    if not job.model_id:
        raise HTTPException(404, "Training belum menghasilkan model")

    run_dir = Path(settings.TRAIN_MODEL_DIR) / f"run_{job_id}"

    preview_json = run_dir / "preview_samples.json"
    confusion_png = run_dir / "confusion_matrix.png"

    if not preview_json.exists():
        raise HTTPException(404, "Preview belum tersedia")

    with open(preview_json) as f:
        samples = json.load(f)

    training_plot = run_dir / "training_plot.png"

    return {
        "job_id": job.id,
        "summary": {
            "train_loss": job.best_train_loss,
            "val_loss":   job.best_val_loss,
            "iou":        job.accuracy,
            "dice":       job.precision,
            "pixel_acc":  job.recall,
        },
        "samples": samples[:sample_count],
        "training_plot": (
            to_base64(training_plot) if training_plot.exists() else None
        ),
    }


def training_metrics_service(job_id: int):

    run_dir = Path(settings.TRAIN_MODEL_DIR) / f"run_{job_id}"
    file = run_dir / "metrics_history.json"

    if not file.exists():
        raise HTTPException(404, "Metrics history not found")

    with open(file) as f:
        return json.load(f)

def is_previous_training_incomplete(job):
    if not job:
        return False

    if job.review_status in ["running", "pending"]:
        return True

    return False


def review_training_approve_service(job_id: int, db: Session, user_id: int):

    job = db.query(models_database.TrainingJob).filter_by(id=job_id).first()

    if not job:
        raise HTTPException(404, "Training job not found")

    if job.review_status != "pending":
        raise HTTPException(400, "Training already reviewed")

    # ===============================
    # UPDATE STATUS REVIEW
    # ===============================

    job.review_status = "approved"
    job.reviewed_by = user_id
    job.reviewed_at = datetime.utcnow()

    # ===============================
    # SET MODEL VERSION
    # ===============================

    model = job.model

    if not model:
        raise HTTPException(400, "Training job has no associated model")

    # cari version tertinggi yang sudah ada
    max_version = db.query(func.max(models_database.Model.version)).scalar()

    next_version = 1 if max_version is None else max_version + 1

    model.version = next_version

    db.commit()

    return {
        "detail": "Training approved",
        "model_id": job.model_id,
        "version": model.version
    }

def review_training_reject_service(
    job_id: int,
    reason: str | None,
    db: Session,
    user_id: int
):

    job = db.query(models_database.TrainingJob).filter_by(id=job_id).first()

    if not job:
        raise HTTPException(404, "Training job not found")

    if job.review_status != "pending":
        raise HTTPException(400, "Training sudah direview")

    job.review_status = "rejected"
    job.reject_reason = reason or "Failed by admin"
    job.reviewed_by = user_id
    job.reviewed_at = datetime.utcnow()

    if job.model_id:
        model = db.query(models_database.Model).filter_by(id=job.model_id).first()

        if model:
            model.is_archived = True
            model.is_active = False

    db.commit()

    return {"detail": "Training rejected & model archived"}

def get_training_status_service(db: Session):

    job = get_last_training_job(db)

    running = (
        training_global_lock.locked()
        or is_training_running(db)
    )

    return {
        "running": running,
        "job": serialize_job(job) if job else None
    }