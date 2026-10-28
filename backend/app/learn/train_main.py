# backend/app/learn/train_main.py

from .run_config import run_config


def run_training_job(
    job_id,
    dataset_path,
    output_dir,
    params,
    update_callback,
):
    """
    Entry point training segmentasi (U-Net).
    """

    params = params.copy()

    # =====================================================
    # RUN TRAINING
    # =====================================================
    result = run_config(
        run_id=job_id,
        dataset_dir=dataset_path,
        output_dir=output_dir,
        cfg=params,
        update_callback=update_callback,
    )

    if not result:
        raise RuntimeError("run_config() tidak mengembalikan hasil")

    model_path = result.get("model_path")
    if not model_path:
        raise RuntimeError("model_path tidak ditemukan dari hasil training")

    metrics = result.get("metrics", {})

    def _safe_float(v, fallback=None):
        try:
            return float(v)
        except (TypeError, ValueError):
            return fallback

    return {
        "model_path": model_path,
        "metrics": {
            # Segmentasi metrics
            "iou":       _safe_float(metrics.get("iou")),
            "dice":      _safe_float(metrics.get("dice")),
            "pixel_acc": _safe_float(metrics.get("pixel_acc")),

            # Loss
            "best_train_loss": _safe_float(metrics.get("best_train_loss"), 0.0),
            "best_val_loss":   _safe_float(metrics.get("best_val_loss"),   0.0),
        },
    }
