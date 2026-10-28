# backend/app/services/inference_service.py
#
# Inferensi segmentasi: metode klasik (OpenCV) ATAU U-Net (PyTorch).

import json
import base64
import numpy as np
import torch
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageOps

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models.models_database import Model
from ..learn.model_unet import UNet, UNetResNet
from ..learn.model_deeplab import build_deeplab
from ..learn.segmentation_methods import apply_segmentation, overlay_mask_on_image
from ..learn.metrics import iou_score, dice_score, pixel_accuracy
from ..utils.file_utils import to_absolute_app_path
from ..config import settings


# ============================================================
# METODE AKTIF
# ============================================================

def get_segmentation_method() -> str:
    return settings.SEGMENTATION_METHOD.lower()


def get_segmentation_params() -> dict:
    return {
        "threshold":           settings.PREDICT_THRESHOLD,
        "kmeans_k":            settings.SEGMENT_KMEANS_K,
        "adaptive_block":      settings.SEGMENT_ADAPTIVE_BLOCK,
        "adaptive_c":          settings.SEGMENT_ADAPTIVE_C,
        "morph_kernel":        settings.SEGMENT_MORPH_KERNEL,
        "morph_iterations":    settings.SEGMENT_MORPH_ITERATIONS,
        "watershed_markers":   settings.SEGMENT_WATERSHED_MARKERS,
        "watershed_compact":   settings.SEGMENT_WATERSHED_COMPACTNESS,
    }


# ============================================================
# LOAD / AKSES MODEL AKTIF
# ============================================================

def get_active_model_record(db: Session) -> Model:
    active = (
        db.query(Model)
        .filter(Model.is_active == True)
        .order_by(Model.created_at.desc())
        .first()
    )
    if active:
        return active

    latest = db.query(Model).order_by(Model.created_at.desc()).first()
    if not latest:
        raise HTTPException(404, "Tidak ada model tersedia")
    return latest


def _load_checkpoint_state(model_file: Path, device) -> dict:
    """Muat checkpoint dan normalisasi ke state_dict."""
    checkpoint = torch.load(model_file, map_location=device, weights_only=False)
    state_dict = (
        checkpoint.get("model_state_dict", checkpoint)
        if isinstance(checkpoint, dict)
        else checkpoint
    )
    if any(k.startswith("module.") for k in state_dict):
        state_dict = {k.replace("module.", ""): v for k, v in state_dict.items()}
    return state_dict


def load_unet_from_path(model_dir: str, device):
    """Memuat model U-Net dari direktori hasil training."""
    model_dir = Path(model_dir)
    if model_dir.is_file():
        model_dir = model_dir.parent

    model_file = model_dir / "model.pth"
    if not model_file.exists():
        raise RuntimeError(f"model.pth tidak ditemukan: {model_file}")

    model = UNet(in_channels=3, out_channels=1)
    model.load_state_dict(_load_checkpoint_state(model_file, device), strict=False)
    model.to(device)
    model.eval()

    print(f"[UNET LOAD] success from {model_file}")
    return model


def load_unet_resnet_from_path(model_dir: str, device, arch: str = "unet_resnet34"):
    """Memuat UNetResNet (unet_resnet18/34/50/101) dari direktori hasil training."""
    model_dir = Path(model_dir)
    if model_dir.is_file():
        model_dir = model_dir.parent

    model_file = model_dir / "model.pth"
    if not model_file.exists():
        raise RuntimeError(f"model.pth tidak ditemukan: {model_file}")

    backbone = arch[len("unet_"):]  # "unet_resnet34" → "resnet34"
    model = UNetResNet(backbone=backbone, pretrained=False, out_channels=1)
    model.load_state_dict(_load_checkpoint_state(model_file, device), strict=False)
    model.to(device)
    model.eval()

    print(f"[UNET-RESNET LOAD] {arch} from {model_file}")
    return model


def load_deeplab_from_path(model_dir: str, device):
    """Memuat model DeepLabV3+ dari direktori hasil training."""
    model_dir = Path(model_dir)
    if model_dir.is_file():
        model_dir = model_dir.parent

    model_file = model_dir / "model.pth"
    if not model_file.exists():
        raise RuntimeError(f"model.pth tidak ditemukan: {model_file}")

    # pretrained_backbone=False: kita load weights dari .pth, bukan ImageNet
    model = build_deeplab(out_channels=1, pretrained_backbone=False)
    model.load_state_dict(_load_checkpoint_state(model_file, device), strict=False)
    model.to(device)
    model.eval()

    print(f"[DEEPLAB LOAD] success from {model_file}")
    return model


def load_segmentation_model(model_dir: str, device):
    """
    Load U-Net atau DeepLab berdasarkan class_mapping.json di model_dir.
    """
    import json

    dir_path = Path(model_dir)
    if dir_path.is_file():
        dir_path = dir_path.parent

    mapping_file = dir_path / "class_mapping.json"
    arch = "unet"
    if mapping_file.exists():
        with open(mapping_file) as f:
            arch = json.load(f).get("architecture", "unet").lower()

    if arch.startswith("deeplab"):
        return load_deeplab_from_path(str(dir_path), device)
    if arch.startswith("unet_"):
        return load_unet_resnet_from_path(str(dir_path), device, arch)
    return load_unet_from_path(str(dir_path), device)


# ============================================================
# PREPROCESS: gambar → numpy array RGB
# ============================================================

def load_image_rgb(image_path: str, img_size: tuple[int, int]) -> np.ndarray:
    img = Image.open(image_path)
    img = ImageOps.exif_transpose(img)
    img = img.convert("RGB")
    img = img.resize(img_size, Image.BILINEAR)
    return np.array(img, dtype=np.uint8)


def load_mask_binary(mask_path: str, img_size: tuple[int, int]) -> np.ndarray:
    """Muat mask GT dan konversi ke binary 0/255."""
    mask = Image.open(mask_path).convert("L")
    mask = mask.resize(img_size, Image.NEAREST)
    arr = np.array(mask, dtype=np.uint8)
    return (arr > 127).astype(np.uint8) * 255


def image_to_tensor(image_rgb: np.ndarray) -> torch.Tensor:
    """(H,W,3) uint8 → (1,3,H,W) float tensor (normalized)."""
    arr = image_rgb.astype("float32") / 255.0
    mean = np.array([0.485, 0.456, 0.406])
    std  = np.array([0.229, 0.224, 0.225])
    arr = (arr - mean) / std
    return torch.from_numpy(arr.transpose(2, 0, 1)).unsqueeze(0).float()


# ============================================================
# HELPER: gambar / mask → base64 PNG
# ============================================================

def _np_to_base64(arr: np.ndarray, mode: str = "RGB") -> str:
    pil = Image.fromarray(arr, mode=mode)
    buf = BytesIO()
    pil.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


# ============================================================
# COMPUTE METRICS vs GT MASK
# ============================================================

def compute_segmentation_metrics(
    pred_mask: np.ndarray,
    gt_mask: np.ndarray,
) -> dict:
    """
    pred_mask, gt_mask : (H,W) uint8 nilai 0/255
    """
    pred_t = torch.from_numpy((pred_mask > 127).astype("float32")).unsqueeze(0).unsqueeze(0)
    gt_t   = torch.from_numpy((gt_mask  > 127).astype("float32")).unsqueeze(0).unsqueeze(0)

    # simulasikan logit agar _binarize() di metrics.py bekerja:
    # sigmoid(5)≈1, sigmoid(-5)≈0
    logit = torch.where(pred_t > 0.5, torch.tensor(5.0), torch.tensor(-5.0))

    return {
        "iou":        round(iou_score(logit, gt_t),       4),
        "dice":       round(dice_score(logit, gt_t),      4),
        "pixel_acc":  round(pixel_accuracy(logit, gt_t),  4),
    }


# ============================================================
# SEGMENTASI KLASIK
# ============================================================

def run_classical_segmentation(
    image_path: str,
    method: str,
    params: dict,
    img_size: tuple[int, int],
    gt_mask_path: str | None = None,
) -> dict:
    """
    Jalankan segmentasi klasik dan kembalikan hasil sebagai base64.
    """
    img_rgb = load_image_rgb(image_path, img_size)
    pred_mask = apply_segmentation(img_rgb, method, params)

    overlay = overlay_mask_on_image(img_rgb, pred_mask, color=(0, 200, 100), alpha=0.4)

    flood_pct = round(float(np.sum(pred_mask > 127) / pred_mask.size * 100), 2)

    result = {
        "method":            method,
        "segmented_image":   _np_to_base64(pred_mask, mode="L"),
        "overlay_image":     _np_to_base64(overlay,   mode="RGB"),
        "original_image":    _np_to_base64(img_rgb,   mode="RGB"),
        "flood_percentage":  flood_pct,
    }

    if gt_mask_path:
        gt_mask = load_mask_binary(gt_mask_path, img_size)
        result["metrics"] = compute_segmentation_metrics(pred_mask, gt_mask)

    return result


# ============================================================
# SEGMENTASI U-NET
# ============================================================

def run_unet_segmentation(
    image_path: str,
    model,
    device,
    params: dict,
    img_size: tuple[int, int],
    gt_mask_path: str | None = None,
) -> dict:
    """
    Jalankan segmentasi U-Net dan kembalikan hasil sebagai base64.
    """
    img_rgb = load_image_rgb(image_path, img_size)
    tensor  = image_to_tensor(img_rgb).to(device)

    threshold = params.get("threshold", 0.5)

    with torch.no_grad():
        logit = model(tensor)
        prob  = torch.sigmoid(logit).squeeze().cpu().numpy()

    pred_mask = ((prob >= threshold) * 255).astype(np.uint8)
    overlay   = overlay_mask_on_image(img_rgb, pred_mask, color=(0, 200, 100), alpha=0.4)

    flood_pct = round(float(np.sum(pred_mask > 127) / pred_mask.size * 100), 2)

    result = {
        "method":           "unet",
        "segmented_image":  _np_to_base64(pred_mask, mode="L"),
        "overlay_image":    _np_to_base64(overlay,   mode="RGB"),
        "original_image":   _np_to_base64(img_rgb,   mode="RGB"),
        "flood_percentage": flood_pct,
    }

    if gt_mask_path:
        gt_mask = load_mask_binary(gt_mask_path, img_size)
        result["metrics"] = compute_segmentation_metrics(pred_mask, gt_mask)

    return result


# ============================================================
# SEGMENTASI DEEPLAB
# ============================================================

def run_deeplab_segmentation(
    image_path: str,
    model,
    device,
    params: dict,
    img_size: tuple[int, int],
    gt_mask_path: str | None = None,
) -> dict:
    """
    Jalankan segmentasi DeepLabV3+ dan kembalikan hasil sebagai base64.
    API identik dengan run_unet_segmentation sehingga bisa dipanggil
    secara polimorfik dari route handler.
    """
    img_rgb = load_image_rgb(image_path, img_size)
    tensor  = image_to_tensor(img_rgb).to(device)

    threshold = params.get("threshold", 0.5)

    with torch.no_grad():
        logit = model(tensor)
        prob  = torch.sigmoid(logit).squeeze().cpu().numpy()

    pred_mask = ((prob >= threshold) * 255).astype(np.uint8)
    overlay   = overlay_mask_on_image(img_rgb, pred_mask, color=(0, 160, 255), alpha=0.4)

    flood_pct = round(float(np.sum(pred_mask > 127) / pred_mask.size * 100), 2)

    result = {
        "method":           "deeplab",
        "segmented_image":  _np_to_base64(pred_mask, mode="L"),
        "overlay_image":    _np_to_base64(overlay,   mode="RGB"),
        "original_image":   _np_to_base64(img_rgb,   mode="RGB"),
        "flood_percentage": flood_pct,
    }

    if gt_mask_path:
        gt_mask = load_mask_binary(gt_mask_path, img_size)
        result["metrics"] = compute_segmentation_metrics(pred_mask, gt_mask)

    return result
