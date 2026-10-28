# backend/app/services/dataset_service.py

import os
import zipfile
import shutil
import json
import re
from datetime import datetime
from pathlib import Path

from fastapi import HTTPException
from PIL import Image
from sqlalchemy.orm import Session

from ..config import settings
from ..utils.common_utils import IMAGE_EXT, JUNK_FILES
from ..utils.file_utils import to_relative_app_path
from ..utils.time_utils import generate_ts
from ..models import models_database

PENDING_DATASET_DIR = settings.PENDING_DATASET_DIR


# ============================================================
# CLEAN JUNK FILES
# ============================================================
def clean_extracted_folder(folder: str):

    for root, dirs, files in os.walk(folder):

        for d in list(dirs):
            if d.lower() in JUNK_FILES:
                shutil.rmtree(os.path.join(root, d), ignore_errors=True)

        for f in files:

            lower_f = f.lower()

            if lower_f in JUNK_FILES or lower_f.startswith("._"):
                try:
                    os.remove(os.path.join(root, f))
                except Exception:
                    pass


# ============================================================
# NORMALIZE LABEL
# ============================================================
def normalize_label(label: str) -> str:

    label = label.strip().lower()
    label = label.replace(" ", "_")
    label = re.sub(r"[^a-z0-9_]", "", label)
    label = re.sub(r"_+", "_", label)

    if not label:
        raise HTTPException(400, "Invalid label name after normalization")

    return label


# ============================================================
# VALIDATE DATASET SEGMENTASI
# ============================================================
def _find_subdir_ci(root: Path, name: str) -> Path | None:
    """Cari subfolder dengan nama case-insensitive."""
    try:
        for d in root.iterdir():
            if d.is_dir() and d.name.lower() == name.lower():
                return d
    except Exception:
        pass
    return None


def validate_segmentation_dataset(root: Path) -> int:
    """
    Memvalidasi dataset segmentasi.
    Struktur yang diharapkan:
        root/
            images/  ← citra asli  (case-insensitive)
            masks/   ← mask biner  (case-insensitive)
    Mengembalikan jumlah pasangan (image, mask) yang valid.
    """
    if not root.exists():
        raise HTTPException(400, "Folder dataset tidak ditemukan")

    img_dir  = _find_subdir_ci(root, "images")
    mask_dir = _find_subdir_ci(root, "masks")

    if img_dir is None:
        raise HTTPException(400, "Folder 'images' tidak ada di dalam ZIP")

    if mask_dir is None:
        raise HTTPException(400, "Folder 'masks' tidak ada di dalam ZIP")

    images = [
        f for f in img_dir.iterdir()
        if f.is_file() and f.suffix.lower() in IMAGE_EXT
    ]

    if not images:
        raise HTTPException(400, "Folder 'images' kosong")

    matched = 0
    for img_path in images:
        stem = img_path.stem
        if any((mask_dir / (stem + ext)).exists() for ext in IMAGE_EXT):
            matched += 1

    if matched == 0:
        raise HTTPException(
            400,
            "Tidak ada pasangan citra-mask yang cocok. "
            "Pastikan nama file mask sama dengan nama file citra."
        )

    return matched


# ============================================================
# DATASET LOG
# ============================================================
def ensure_no_blocking_upload(db: Session, user_id: int):

    exists = db.query(models_database.DatasetUploadLog).filter(
        models_database.DatasetUploadLog.user_id == user_id,
        models_database.DatasetUploadLog.status == "pending"
    ).first()

    if exists:
        raise HTTPException(
            status_code=409,
            detail="You still have a dataset pending review"
        )


def get_user_upload_number(db: Session, user_id: int):

    total = db.query(models_database.DatasetUploadLog).filter(
        models_database.DatasetUploadLog.user_id == user_id
    ).count()

    return total + 1


def log_dataset_upload(
    db: Session,
    user_id: int,
    upload_number: int,
    total_images: int,
    folder: str,
    num_classes: int,
    class_names: list[str]
):

    entry = models_database.DatasetUploadLog(
        user_id=user_id,
        upload_number=upload_number,
        total_images=total_images,
        dataset_folder=to_relative_app_path(folder),
        status="pending",
        reviewed_by=None,
        num_classes=num_classes,
        class_names=class_names
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry


# ============================================================
# FIND DATASET ROOT
# ============================================================
def find_dataset_root(folder: Path) -> Path:
    """
    Cari folder root yang berisi 'images/' dan 'masks/'.
    Menelusuri hingga 4 level untuk menangani wrapper folder dari ZIP.
    """
    current = folder

    for _ in range(4):
        try:
            items = list(current.iterdir())
        except Exception:
            break

        subdirs = {d.name.lower(): d for d in items if d.is_dir()}

        if "images" in subdirs and "masks" in subdirs:
            return current

        if len(subdirs) == 1:
            current = list(subdirs.values())[0]
            continue

        # Lebih dari 1 subdir tapi tidak ada images/masks → cari rekursif
        for sub in subdirs.values():
            sub_subdirs = {d.name.lower() for d in sub.iterdir() if d.is_dir()}
            if "images" in sub_subdirs and "masks" in sub_subdirs:
                return sub

        break

    return folder


# ============================================================
# MAIN FUNCTION
# ============================================================
def save_and_extract_dataset(
    db: Session,
    file_path: str,
    owner_id: int,
    dataset_name: str
):

    ensure_no_blocking_upload(db, owner_id)

    upload_number = get_user_upload_number(db, owner_id)
    dataset_folder = os.path.join(
        PENDING_DATASET_DIR,
        f"{dataset_name}_{upload_number}_{generate_ts()}"
    )

    os.makedirs(dataset_folder, exist_ok=True)

    try:

        with zipfile.ZipFile(file_path, "r") as z:

            base_path = Path(dataset_folder).resolve()

            for member in z.infolist():

                normalized_name = member.filename.replace("\\", "/")

                if not normalized_name.strip():
                    continue

                target_path = (base_path / normalized_name).resolve()

                try:
                    target_path.relative_to(base_path)
                except ValueError:
                    raise HTTPException(400, "Invalid ZIP structure detected (path traversal)")

                if member.is_dir():
                    target_path.mkdir(parents=True, exist_ok=True)
                    continue

                target_path.parent.mkdir(parents=True, exist_ok=True)

                with z.open(member) as source, open(target_path, "wb") as target:
                    shutil.copyfileobj(source, target)

    except HTTPException:
        shutil.rmtree(dataset_folder, ignore_errors=True)
        raise

    except zipfile.BadZipFile:
        shutil.rmtree(dataset_folder, ignore_errors=True)
        raise HTTPException(400, "File yang diunggah bukan ZIP yang valid")

    except Exception as e:
        shutil.rmtree(dataset_folder, ignore_errors=True)
        raise HTTPException(400, f"Gagal membaca ZIP: {str(e)}")

    clean_extracted_folder(dataset_folder)

    root = find_dataset_root(Path(dataset_folder))

    total_pairs = validate_segmentation_dataset(root)

    log = log_dataset_upload(
        db=db,
        user_id=owner_id,
        upload_number=upload_number,
        total_images=total_pairs,
        folder=str(root),
        num_classes=2,
        class_names=["background", "flood"],
    )

    return {
        "detail": "Dataset segmentasi berhasil diunggah (menunggu review)",
        "folder": str(root.resolve()),
        "upload_id": log.id,
        "total_pairs": total_pairs,
        "task": "segmentation",
    }