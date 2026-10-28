# path: backend/app/routes/public_routes.py

from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path
import json

from ..config import settings
from ..services.public_service import get_model_info
from ..services.inference_service import get_segmentation_method, get_segmentation_params
from ..utils.common_utils import IMAGE_EXT

router = APIRouter(prefix="/public", tags=["public"])


# ==========================================================
# MODEL METRICS (SEGMENTASI)
# ==========================================================
@router.get("/model-metrics")
def get_model_metrics_public():
    metrics_path = Path(settings.PREDICT_MODEL_DIR) / "metrics.json"

    if not metrics_path.exists():
        return {"iou": None, "dice": None, "pixel_acc": None}

    try:
        with open(metrics_path) as f:
            return json.load(f)
    except Exception:
        return {"iou": None, "dice": None, "pixel_acc": None}


# ==========================================================
# INFO METODE SEGMENTASI (PUBLIK)
# ==========================================================
@router.get("/segmentation-info")
def get_segmentation_info_public():
    return {
        "method": get_segmentation_method(),
        "params": get_segmentation_params(),
    }


# ==========================================================
# PLOT TRAINING (U-NET ONLY)
# ==========================================================
@router.get("/training-plot")
def get_training_plot():
    plot_path = Path(settings.PREDICT_MODEL_DIR) / "training_plot.png"

    if not plot_path.exists():
        return {"image": None}

    return FileResponse(plot_path)


# ==========================================================
# DATASET SUMMARY (SEGMENTASI)
# ==========================================================
@router.get("/dataset-summary")
def get_dataset_summary():
    dataset_dir = Path(settings.TRAIN_DATASET_DIR)

    if not dataset_dir.exists():
        return {"total_images": 0, "task": "segmentation"}

    def _find_folder_ci(root: Path, name: str) -> Path | None:
        try:
            for d in root.iterdir():
                if d.is_dir() and d.name.lower() == name.lower():
                    return d
        except Exception:
            pass
        return None

    img_dir  = _find_folder_ci(dataset_dir, "images")
    mask_dir = _find_folder_ci(dataset_dir, "masks")

    total_images = 0
    total_masks  = 0

    if img_dir:
        total_images = sum(
            1 for f in img_dir.iterdir()
            if f.is_file() and f.suffix.lower() in IMAGE_EXT
        )

    if mask_dir:
        total_masks = sum(
            1 for f in mask_dir.iterdir()
            if f.is_file() and f.suffix.lower() in IMAGE_EXT
        )

    return {
        "total_images": total_images,
        "total_masks":  total_masks,
        "task":         "segmentation",
    }


# ==========================================================
# MODEL INFO
# ==========================================================
@router.get("/model-info")
def get_public_model_info():
    return get_model_info()
