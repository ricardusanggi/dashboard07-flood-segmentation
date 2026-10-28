# backend/app/routes/predict_routes.py

import json
import tempfile
import shutil
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.auth_service import get_current_user_optional
from ..models.models_database import Model

from ..services.model_service import get_active_model_or_filesystem
from ..services.inference_service import (
    get_segmentation_method,
    get_segmentation_params,
    run_classical_segmentation,
    run_unet_segmentation,
    run_deeplab_segmentation,
    load_unet_from_path,
)
from ..services.predict_service import (
    save_test_file,
    log_prediction,
)
from ..utils.model_manager import model_manager
from ..config import settings


# ============================================================
# HELPER: baca arsitektur dari class_mapping.json model aktif
# ============================================================

def _read_model_arch(model_path: str) -> str:
    """Baca architecture dari class_mapping.json di direktori model."""
    p = Path(model_path)
    if p.is_file():
        p = p.parent
    mapping = p / "class_mapping.json"
    if mapping.exists():
        with open(mapping) as f:
            return json.load(f).get("architecture", "unet").lower()
    return "unet"


_CLASSICAL_METHODS = {"otsu", "adaptive", "watershed", "kmeans", "canny"}

router = APIRouter(prefix="/predict", tags=["predict"])

VALID_EXT = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}
MAX_SIZE   = 20 * 1024 * 1024  # 20 MB


# ============================================================
# HELPER: validasi & simpan upload ke tempfile
# ============================================================

def _save_upload_to_temp(upload: UploadFile) -> Path:
    ext = Path(upload.filename).suffix.lower()
    if ext not in VALID_EXT:
        raise HTTPException(400, f"Format file tidak valid: {ext}")

    upload.file.seek(0, 2)
    size = upload.file.tell()
    upload.file.seek(0)

    if size > MAX_SIZE:
        raise HTTPException(400, "Ukuran file terlalu besar (maks 20 MB)")

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(upload.file, tmp)
        return Path(tmp.name)


# ============================================================
# INFO METODE SEGMENTASI AKTIF
# ============================================================

@router.get("/method-info")
def get_method_info(db: Session = Depends(get_db)):
    import json as _json
    method = get_segmentation_method()
    params = get_segmentation_params()

    info = {
        "method": method,
        "params": params,
        "model_active": False,
        "model_name": None,
        "model_version": None,
        "architecture": None,
    }

    if method not in _CLASSICAL_METHODS:
        model_record = get_active_model_or_filesystem(db)

        if model_record:
            actual_arch = _read_model_arch(model_record.path)
            info["model_active"]  = True
            info["model_name"]    = model_record.name
            info["model_version"] = model_record.version
            info["method"]        = actual_arch
            info["architecture"]  = actual_arch
        else:
            # Fallback: baca model_info.json dari models_predict
            # Digunakan saat predict service jalan tanpa akses DB (worker node)
            model_info_file = Path(settings.PREDICT_MODEL_DIR) / "model_info.json"
            model_pth = Path(settings.PREDICT_MODEL_DIR) / "model.pth"
            if model_info_file.exists() and model_pth.exists():
                with open(model_info_file) as f:
                    mi = _json.load(f)
                arch = mi.get("architecture", "unet")
                info["model_active"]  = True
                info["model_name"]    = mi.get("name")
                info["model_version"] = mi.get("version")
                info["method"]        = arch
                info["architecture"]  = arch

    return info


# ============================================================
# SEGMENTASI GAMBAR
# Input : file (citra asli) + mask (opsional, untuk evaluasi)
# ============================================================

@router.post("/upload-image-testing")
async def upload_image_testing(
    file: UploadFile = File(..., description="Citra asli"),
    mask: UploadFile | None = File(None, description="Mask ground-truth (opsional)"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    method = get_segmentation_method()
    params = get_segmentation_params()
    img_size = (settings.PREDICT_IMG_SIZE, settings.PREDICT_IMG_SIZE)

    tmp_image: Path | None = None
    tmp_mask:  Path | None = None

    try:
        # ================================
        # SIMPAN FILE UPLOAD KE TEMPFILE
        # ================================
        tmp_image = _save_upload_to_temp(file)

        if mask and mask.filename:
            tmp_mask = _save_upload_to_temp(mask)

        # ================================
        # JALANKAN SEGMENTASI
        # ================================
        if method in _CLASSICAL_METHODS:
            # Metode klasik (OpenCV)
            model_record = None
            seg_result = await run_in_threadpool(
                run_classical_segmentation,
                str(tmp_image),
                method,
                params,
                img_size,
                str(tmp_mask) if tmp_mask else None,
            )
        else:
            # Metode deep learning — deteksi arsitektur dari model aktif
            model_record = get_active_model_or_filesystem(db)
            if not model_record:
                raise HTTPException(409, "Belum ada model aktif. Aktifkan model terlebih dahulu di halaman admin.")

            model_manager.reload_if_changed(db)
            dl_model, _ = model_manager.get_active(db)
            device = model_manager.get_device()

            # Baca arsitektur aktual dari class_mapping.json
            actual_arch = _read_model_arch(model_record.path)
            run_fn = run_deeplab_segmentation if actual_arch.startswith("deeplab") else run_unet_segmentation

            seg_result = await run_in_threadpool(
                run_fn,
                str(tmp_image),
                dl_model,
                device,
                params,
                img_size,
                str(tmp_mask) if tmp_mask else None,
            )
            # Timpa method di response dengan arsitektur aktual
            seg_result["method"] = actual_arch

        # ================================
        # SIMPAN INPUT & LOG (JIKA LOGIN)
        # ================================
        prediction_id = None

        if current_user:
            saved_input = save_test_file(
                db=db,
                src_path=str(tmp_image),
                filename=file.filename,
                subfolder="inputs",
                user_id=current_user.id,
            )

            prediction_id = log_prediction(
                db=db,
                user_id=current_user.id,
                model_record=model_record,
                input_filename=file.filename,
                saved_input_path=saved_input,
                saved_output_path=None,
                metrics=seg_result.get("metrics"),
                flood_percentage=seg_result.get("flood_percentage"),
            )

        # ================================
        # RESPONSE
        # ================================
        return {
            "message":          "Segmentasi berhasil",
            "prediction_id":    prediction_id,
            "method":           seg_result["method"],
            "segmented_image":  seg_result["segmented_image"],
            "overlay_image":    seg_result["overlay_image"],
            "original_image":   seg_result["original_image"],
            "flood_percentage": seg_result.get("flood_percentage"),
            "metrics":          seg_result.get("metrics"),
            "user": current_user.username if current_user else "public",
        }

    finally:
        if tmp_image and tmp_image.exists():
            tmp_image.unlink(missing_ok=True)
        if tmp_mask and tmp_mask.exists():
            tmp_mask.unlink(missing_ok=True)
