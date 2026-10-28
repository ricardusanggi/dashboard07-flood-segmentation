# backend/app/routes/dataset_routes_admin.py

from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.responses import FileResponse
from pathlib import Path
from urllib.parse import unquote
import os
import shutil
import random
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..utils.api_dependencies import block_when_training
from ..database import get_db
from ..config import settings
from ..models.models_database import DatasetUploadLog, User
from collections import defaultdict
from ..services.auth_service import require_admin, get_current_user
from ..services.dataset_service import get_user_upload_number
from ..utils.common_utils import get_or_404, ensure_folder_exists
from ..utils.file_utils import to_base64
from ..utils.dataset_utils import find_duplicate_images
from ..utils.common_utils import IMAGE_EXT
from ..services.user_service import get_user

router = APIRouter(
    prefix="/admin/datasets",
    tags=["admin-datasets"],
    dependencies=[Depends(require_admin)]
)


# =====================================================================
# 1. LIST PENDING DATASETS
# =====================================================================
@router.get("/pending")
def list_pending_datasets(db=Depends(get_db)):

    pending = db.query(DatasetUploadLog).filter(
        DatasetUploadLog.status == "pending"
    ).all()

    result = []
    for item in pending:
        uploader = get_user(db, item.user_id)
        reviewer = (
            db.query(User).filter(User.id == item.reviewed_by).first()
            if item.reviewed_by else None
        )
        uploader_name = "Unknown"
        if uploader:
            uploader_name = uploader.full_name or uploader.username
        
        reviewer_name = None
        if reviewer:
            reviewer_name = reviewer.full_name or reviewer.username
            
        result.append({
            "log_id": item.id,
            "user_id": item.user_id,
            "uploader_name": uploader_name,
            "reviewer_name": reviewer_name,
            "upload_number": item.upload_number,
            "total_images": item.total_images,
            "dataset_folder": item.dataset_folder,
            "status": item.status,
            "num_classes": item.num_classes,
            "class_names": item.class_names,
            "upload_time": item.upload_time,
        })

    return result

# =====================================================================
# 2. APPROVE DATASET
# =====================================================================
@router.post("/approve/{log_id}", dependencies=[Depends(block_when_training)])
def approve_dataset(
    log_id: int,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    entry = get_or_404(
        db.query(DatasetUploadLog).filter_by(id=log_id),
        "Dataset upload log not found."
    )

    if entry.status != "pending":
        raise HTTPException(400, "Dataset already reviewed.")

    src_root = Path(entry.dataset_folder)
    ensure_folder_exists(src_root, "Dataset folder not found")

    train_root = Path(settings.TRAIN_DATASET_DIR)
    train_root.mkdir(parents=True, exist_ok=True)

    images_src = _find_folder_ci(src_root, "images")
    masks_src  = _find_folder_ci(src_root, "masks")

    if images_src and masks_src:
        # =====================================================
        # SEGMENTASI: pindahkan berpasangan dengan nama yang sama
        # =====================================================
        img_dst  = train_root / images_src.name   # pertahankan "Images" atau "images"
        mask_dst = train_root / masks_src.name
        img_dst.mkdir(parents=True, exist_ok=True)
        mask_dst.mkdir(parents=True, exist_ok=True)

        image_files = sorted(
            f for f in images_src.iterdir()
            if f.is_file() and f.suffix.lower() in IMAGE_EXT
        )

        total_moved = 0
        for img_file in image_files:
            mask_file = _find_mask(masks_src, img_file.stem)
            if not mask_file:
                continue  # lewati jika tidak ada mask yang cocok

            # Gunakan counter yang SAMA untuk image & mask → stem identik
            stem = f"u{entry.user_id}_n{entry.upload_number}_{total_moved:06d}"
            shutil.move(str(img_file),  img_dst  / (stem + img_file.suffix.lower()))
            shutil.move(str(mask_file), mask_dst / (stem + mask_file.suffix.lower()))
            total_moved += 1

        mode = "segmentation"

    else:
        # =====================================================
        # KLASIFIKASI: setiap subfolder = 1 class
        # =====================================================
        total_moved = 0
        for class_dir in sorted(src_root.iterdir()):
            if not class_dir.is_dir():
                continue
            dst_class_dir = train_root / class_dir.name
            dst_class_dir.mkdir(parents=True, exist_ok=True)
            for img in sorted(class_dir.iterdir()):
                if img.is_file() and img.suffix.lower() in IMAGE_EXT:
                    new_name = (
                        f"u{entry.user_id}_n{entry.upload_number}_"
                        f"{total_moved:06d}{img.suffix.lower()}"
                    )
                    shutil.move(str(img), dst_class_dir / new_name)
                    total_moved += 1

        mode = "classification"

    if total_moved == 0:
        raise HTTPException(400, "No valid images found in dataset")

    # =====================================================
    # HAPUS FOLDER PENDING
    # =====================================================
    pending_root = src_root
    pending_base = Path(settings.PENDING_DATASET_DIR).resolve()

    while pending_root.parent.resolve() != pending_base:
        pending_root = pending_root.parent

    shutil.rmtree(pending_root, ignore_errors=True)

    # =====================================================
    # UPDATE DB — perbarui total_images dengan jumlah pasang aktual
    # =====================================================
    entry.status      = "approved"
    entry.reviewed_by = current_user.id
    entry.total_images = total_moved
    if mode == "segmentation" and not entry.num_classes:
        entry.num_classes  = 2
        entry.class_names  = ["background", "flood"]
    db.commit()

    duplicates = find_duplicate_images(train_root)
    if duplicates:
        print("WARNING duplicate images:", len(duplicates))

    return {
        "detail": f"Dataset approved ({mode})",
        "total_pairs_added": total_moved,
    }


# =====================================================================
# 3. REJECT DATASET
# =====================================================================
@router.post("/reject/{log_id}", dependencies=[Depends(block_when_training)])
def reject_dataset(log_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):

    entry = get_or_404(
        db.query(DatasetUploadLog).filter_by(id=log_id),
        "Dataset upload log not found."
    )

    if entry.status != "pending":
        raise HTTPException(400, "Dataset already reviewed.")

    src = Path(entry.dataset_folder)
    dst = Path(settings.REJECT_DATASET_DIR) / src.name
    dst.parent.mkdir(parents=True, exist_ok=True)

    shutil.move(str(src), str(dst))

    entry.status = "rejected"
    entry.dataset_folder = str(dst)
    entry.reviewed_by = current_user.id
    db.commit()

    return {"detail": "Dataset rejected", "path": str(dst)}


# =====================================================================
# 4. CANCEL DATASET
# =====================================================================
@router.post("/cancel/{log_id}", dependencies=[Depends(block_when_training)])
def cancel_dataset(log_id: int, db=Depends(get_db)):

    entry = get_or_404(
        db.query(DatasetUploadLog).filter_by(id=log_id),
        "Dataset upload log not found."
    )

    if entry.status != "pending":
        raise HTTPException(400, "Dataset already reviewed — cannot cancel.")

    folder = Path(entry.dataset_folder)
    if folder.exists():
        shutil.rmtree(folder, ignore_errors=True)

    db.delete(entry)
    db.commit()

    return {"detail": "Dataset cancelled", "deleted_folder": str(folder)}

# =====================================================================
# 5. PREVIEW DATASET (CLASSIFICATION)
# =====================================================================
def _find_folder_ci(root: Path, name: str) -> Path | None:
    """Cari subfolder case-insensitive — cocok untuk Images, images, IMAGES, dll."""
    try:
        for d in root.iterdir():
            if d.is_dir() and d.name.lower() == name.lower():
                return d
    except Exception:
        pass
    return None


def _find_mask(masks_dir: Path, image_stem: str) -> Path | None:
    """Cari file mask yang namanya sama (stem) dengan image, abaikan ekstensi."""
    for ext in IMAGE_EXT:
        candidate = masks_dir / (image_stem + ext)
        if candidate.exists():
            return candidate
    return None


def _build_segmentation_preview(dataset_root: Path, sample_count: int) -> list[dict]:
    """
    Buat preview untuk dataset segmentasi (Images/ + Masks/ atau images/ + masks/).
    Sample diambil dari folder images, mask dicari berdasarkan nama file yang sama.
    Mengembalikan dua grup dengan urutan file yang identik.
    """
    images_dir = _find_folder_ci(dataset_root, "images")
    masks_dir  = _find_folder_ci(dataset_root, "masks")

    if not images_dir:
        return []

    image_files = sorted(
        f for f in images_dir.iterdir()
        if f.is_file() and f.suffix.lower() in IMAGE_EXT
    )

    if not image_files:
        return []

    sampled = random.sample(image_files, min(sample_count, len(image_files)))
    sampled = sorted(sampled, key=lambda f: f.name)

    img_entries  = []
    mask_entries = []

    for img_file in sampled:
        mask_file = _find_mask(masks_dir, img_file.stem) if masks_dir else None
        img_entries.append({
            "filename":     img_file.name,
            "image_base64": to_base64(img_file),
        })
        mask_entries.append({
            "filename":     mask_file.name if mask_file else img_file.name,
            "image_base64": to_base64(mask_file) if mask_file else "",
        })

    total = len(image_files)
    preview = []
    if img_entries:
        preview.append({"label": images_dir.name, "total_images": total, "images": img_entries})
    if mask_entries:
        label = masks_dir.name if masks_dir else "masks"
        preview.append({"label": label, "total_images": total, "images": mask_entries})
    return preview


@router.get("/preview/{log_id}")
def preview_dataset(
    log_id: int,
    sample_count: int = 2,
    db=Depends(get_db)
):
    entry = get_or_404(
        db.query(DatasetUploadLog).filter_by(id=log_id),
        "Dataset not found."
    )

    if entry.status not in ["pending", "approved"]:
        raise HTTPException(
            400,
            "Preview hanya tersedia untuk dataset pending dan approved."
        )

    dataset_root = (
        Path(entry.dataset_folder)
        if entry.status == "pending"
        else Path(settings.TRAIN_DATASET_DIR)
    )

    if not dataset_root.exists():
        raise HTTPException(400, "Dataset folder tidak ditemukan")

    if _find_folder_ci(dataset_root, "images") or _find_folder_ci(dataset_root, "masks"):
        # Dataset segmentasi
        preview = _build_segmentation_preview(dataset_root, sample_count)
    else:
        # Fallback klasifikasi multi-folder
        preview = []
        for cls_dir in sorted(dataset_root.iterdir()):
            if not cls_dir.is_dir():
                continue
            images = [
                f for f in cls_dir.iterdir()
                if f.is_file() and f.suffix.lower() in IMAGE_EXT
            ]
            if not images:
                continue
            sampled = random.sample(images, min(sample_count, len(images)))
            preview.append({
                "label": cls_dir.name,
                "total_images": len(images),
                "images": [
                    {"filename": img.name, "image_base64": to_base64(img)}
                    for img in sampled
                ]
            })

    return {
        "log_id": log_id,
        "num_classes": len(preview),
        "preview": preview,
    }

@router.get("/preview-train")
def preview_train_dataset(sample_count: int = 4):

    dataset_root = Path(settings.TRAIN_DATASET_DIR)

    if not dataset_root.exists():
        raise HTTPException(400, "Train dataset tidak ditemukan")

    if _find_folder_ci(dataset_root, "images") or _find_folder_ci(dataset_root, "masks"):
        # Dataset segmentasi
        preview = _build_segmentation_preview(dataset_root, sample_count)
    else:
        # Fallback klasifikasi multi-folder
        preview = []
        for cls_dir in sorted(dataset_root.iterdir()):
            if not cls_dir.is_dir():
                continue
            images = [
                f for f in cls_dir.iterdir()
                if f.is_file() and f.suffix.lower() in IMAGE_EXT
            ]
            if not images:
                continue
            sampled = random.sample(images, min(sample_count, len(images)))
            preview.append({
                "label": cls_dir.name,
                "total_images": len(images),
                "images": [
                    {"filename": img.name, "image_base64": to_base64(img)}
                    for img in sampled
                ]
            })

    return {
        "num_classes": len(preview),
        "preview": preview,
    }

# =====================================================================
# 6. STATIC FILE SERVER
# =====================================================================
@router.get("/file")
def get_file(path: str):
    base_dir = Path(settings.TRAIN_DATASET_DIR).resolve()
    requested = (base_dir / path).resolve()
    if base_dir not in requested.parents:
        raise HTTPException(403, "Access denied")
    
    if not requested.is_file():
        raise HTTPException(404, "File not found")

    return FileResponse(str(requested))

# =====================================================================
# 7. TRAINING DATASET STATS (CLASSIFICATION)
# =====================================================================
JUNK_FILES = {
    ".ds_store",
    "thumbs.db",
    "desktop.ini",
    "class_mapping.json",
}

def clean_dataset_folder(folder: Path):
    """
    Hapus file sampah seperti .DS_Store, Thumbs.db, dll
    """
    for root, dirs, files in os.walk(folder):
        for f in files:
            lower = f.lower()

            if lower in JUNK_FILES or lower.startswith("._"):
                try:
                    os.remove(os.path.join(root, f))
                except Exception:
                    pass


@router.get("/stats")
def get_admin_dataset_stats(
    db: Session = Depends(get_db)
):
    """
    Statistik dataset GLOBAL (Admin Dashboard)

    - total images dari database
    - total label unik dari database
    - total images dari folder train
    - distribusi per class
    - cek konsistensi database vs folder
    - dataset imbalance detection
    - missing class detection
    """

    train_dir = Path(settings.TRAIN_DATASET_DIR).resolve()

    # =====================================
    # 1️⃣ DATA DARI DATABASE
    # =====================================

    approved_logs = db.query(DatasetUploadLog).filter(
        DatasetUploadLog.status.in_(["approved", "merged"])
    ).all()

    db_total_images = sum(log.total_images for log in approved_logs)

    unique_labels = set()

    for log in approved_logs:
        if log.class_names:
            unique_labels.update(log.class_names)

    # =====================================
    # 2️⃣ DATA DARI FOLDER TRAIN
    # =====================================

    folder_total_images = 0
    per_class = {}

    imbalance_warning = False
    imbalance_ratio = 1.0
    missing_classes: list[str] = []

    if train_dir.exists():

        clean_dataset_folder(train_dir)

        images_dir = _find_folder_ci(train_dir, "images")
        masks_dir  = _find_folder_ci(train_dir, "masks")

        def _count_images(d: Path | None) -> int:
            if not d or not d.exists() or not d.is_dir():
                return 0
            return sum(
                1 for f in d.iterdir()
                if f.is_file() and f.suffix.lower() in IMAGE_EXT
            )

        if images_dir or masks_dir:
            # Segmentasi: hitung images/ dan masks/ secara terpisah
            images_count = _count_images(images_dir)
            masks_count  = _count_images(masks_dir)

            # Patokan jumlah pasangan = jumlah citra di folder images
            folder_total_images = images_count
            per_class = {
                (images_dir.name if images_dir else "images"): images_count,
                (masks_dir.name  if masks_dir  else "masks"):  masks_count,
            }

            # Peringatan ketidakseimbangan = ada file yang tidak berpasangan
            if images_count != masks_count:
                imbalance_warning = True
                imbalance_ratio = round(
                    max(images_count, masks_count) / max(min(images_count, masks_count), 1), 2
                )

            # Deteksi folder yang hilang
            if not images_dir:
                missing_classes.append("Images")
            if not masks_dir:
                missing_classes.append("Masks")

        else:
            # Fallback: struktur multi-folder (klasifikasi)
            for class_folder in train_dir.iterdir():
                if not class_folder.is_dir():
                    continue
                count = sum(
                    1 for f in class_folder.iterdir()
                    if f.is_file() and f.suffix.lower() in IMAGE_EXT
                )
                folder_total_images += count
                per_class[class_folder.name] = count

            if per_class:
                counts = list(per_class.values())
                max_c, min_c = max(counts), min(counts)
                if min_c > 0:
                    imbalance_ratio = round(max_c / min_c, 2)
                    if imbalance_ratio > 3:
                        imbalance_warning = True

            folder_classes = set(per_class.keys())
            missing_classes = sorted(list(unique_labels - folder_classes))

    # =====================================
    # 3️⃣ KONSISTENSI DATABASE VS FOLDER
    # =====================================

    is_synced = folder_total_images == db_total_images

    # =====================================
    # 6️⃣ RESPONSE (ADMIN DASHBOARD)
    # =====================================

    return {
        "total_images": folder_total_images,
        "num_classes": len(unique_labels),
        "class_names": sorted(list(unique_labels)),
        "per_class": per_class,

        "database_total": db_total_images,
        "folder_total": folder_total_images,

        "is_synced": is_synced,

        # dataset health
        "dataset_health": {
            "imbalance_warning": imbalance_warning,
            "imbalance_ratio": imbalance_ratio,
            "missing_classes": missing_classes
        }
    }
    
# =====================================================================
# 8. LIST ALL DATASET HISTORY
# =====================================================================
@router.get("/history")
def list_all_dataset_history(db=Depends(get_db)):

    logs = db.query(DatasetUploadLog)\
        .order_by(DatasetUploadLog.upload_time.desc())\
        .all()

    result = []
    for log in logs:
        uploader = db.query(User).filter(User.id == log.user_id).first()
        reviewer = (
            db.query(User).filter(User.id == log.reviewed_by).first()
            if log.reviewed_by else None
        )

        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "uploader_name": uploader.full_name if uploader else f"User {log.user_id}",
            "reviewer_name": reviewer.full_name if reviewer else "-",
            "dataset_folder": log.dataset_folder,
            "status": log.status,
            "total_images": log.total_images,
            "upload_number": log.upload_number,
            "num_classes": log.num_classes,
            "class_names": log.class_names,
            "upload_time": log.upload_time,
        })

    return result

# =====================================================================
# 9. Merge dataset test_true ke train dataset (CLASSIFICATION)
# =====================================================================
@router.post("/merge-test-true")
def merge_test_true(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    test_dir = Path(settings.TEST_TRUE_DIR)
    train_dir = Path(settings.TRAIN_DATASET_DIR)

    label_names = set()   # gunakan set agar tidak duplikat
    total_copied = 0

    if not test_dir.exists():
        return {
            "message": "Folder test_true tidak ditemukan",
            "total_images_copied": 0
        }

    # ================= COPY DATASET =================

    for label_dir in test_dir.iterdir():

        if not label_dir.is_dir():
            continue

        label_names.add(label_dir.name)

        train_label_dir = train_dir / label_dir.name
        train_label_dir.mkdir(parents=True, exist_ok=True)

        for img_file in label_dir.glob("*"):

            if img_file.is_file():

                from uuid import uuid4

                new_name = f"{uuid4().hex}{img_file.suffix}"

                shutil.copy(img_file, train_label_dir / new_name)

                total_copied += 1

    # ================= HAPUS TEST_TRUE =================

    for item in test_dir.iterdir():
        if item.is_dir():
            shutil.rmtree(item)

    if total_copied == 0:
        return {
            "message": "Tidak ada dataset test_true untuk digabungkan",
            "total_images_copied": 0
        }

    # ================= SIMPAN LOG DATABASE =================

    upload_number = get_user_upload_number(db, current_user.id)

    log = DatasetUploadLog(
        user_id=current_user.id,
        upload_number=upload_number,
        total_images=total_copied,

        dataset_folder="merge_test_true",

        status="merged",

        reviewed_by=current_user.id,

        num_classes=len(label_names),
        class_names=list(label_names)
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    # ================= RESPONSE =================

    return {
        "message": "Dataset berhasil digabung ke train",
        "total_images_copied": total_copied,
        "num_classes": len(label_names),
        "classes": list(label_names)
    }
    

# =====================================================================
# 10. Summary dataset test_true (CLASSIFICATION)
# =====================================================================
@router.get("/test-true-summary")
def get_test_true_summary():
    #print("==== DEBUG TEST TRUE SUMMARY ====")
    #print("PATH:", settings.TEST_TRUE_DIR)
    test_dir = Path(settings.TEST_TRUE_DIR)

    summary = []
    total = 0

    if not test_dir.exists():
        return {"total": 0, "details": []}

    for label_dir in test_dir.iterdir():
        #print("FOUND:", label_dir)
        if label_dir.is_dir():
            count = len(list(label_dir.glob("*")))
            total += count
            summary.append({
                "label": label_dir.name,
                "count": count
            })

    return {
        "total": total,
        "details": summary
    }
    
@router.get("/duplicate-check")
def check_duplicate_images():

    train_dir = Path(settings.TRAIN_DATASET_DIR)

    duplicates = find_duplicate_images(train_dir)

    return {
        "duplicate_count": len(duplicates),
        "duplicates": duplicates
    }