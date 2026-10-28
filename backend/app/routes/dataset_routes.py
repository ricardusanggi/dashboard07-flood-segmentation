# backend/app/routes/dataset_routes.py

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pathlib import Path
import tempfile
import shutil

from ..utils.api_dependencies import block_when_training
from ..database import get_db
from ..services.auth_service import require_admin, get_current_user, require_registered_or_admin
from ..services.dataset_service import save_and_extract_dataset
from ..models.models_database import DatasetUploadLog, User
from ..config import settings

router = APIRouter(
    prefix="/users/datasets",
    tags=["datasets"]
)

# ============================================================
# UPLOAD DATASET (CLASSIFICATION)
# ZIP → folder label → citra
# hanya admin + registered user
# ============================================================
@router.post(
    "/upload",
    dependencies=[
        Depends(require_registered_or_admin),
        Depends(block_when_training)
    ]
)
def upload_dataset(
    file: UploadFile = File(...),
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    # =====================================================
    # CEK DATASET PENDING USER
    # =====================================================

    pending_count = db.query(DatasetUploadLog).filter(
        DatasetUploadLog.user_id == current_user.id,
        DatasetUploadLog.status == "pending"
    ).count()

    if pending_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Dataset sebelumnya masih menunggu review admin"
        )
    # ----------------------------
    # VALIDASI FILE DASAR
    # ----------------------------
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Dataset must be a .zip file"
        )
    # =============================
    # VALIDASI UKURAN FILE (MAX 1GB)
    # =============================
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > 10240 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10GB)")

    dataset_name = f"{current_user.username}_{current_user.id}"

    # -------------------------------------------------------
    # SIMPAN LANGSUNG KE STORAGE (BUKAN TEMP DIR)
    # -------------------------------------------------------
    raw_upload_dir = Path(settings.PENDING_DATASET_DIR) / "raw_uploads"
    raw_upload_dir.mkdir(parents=True, exist_ok=True)
    
    safe_name = Path(file.filename).name
    tmp_path = raw_upload_dir / safe_name

    try:
        # STREAMING WRITE (AMAN UNTUK FILE BESAR)
        with open(tmp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # DELEGASI KE SERVICE (extract + validate + log)
        result = save_and_extract_dataset(
            db=db,
            file_path=str(tmp_path),
            owner_id=current_user.id,
            dataset_name=dataset_name
        )

        # HAPUS ZIP ASLI SETELAH BERHASIL EXTRACT
        if tmp_path.exists():
            tmp_path.unlink()

    except HTTPException as e:
        print(f"[UPLOAD 400] user={current_user.id} | {e.detail}")
        if tmp_path.exists():
            tmp_path.unlink()
        raise

    except Exception as e:
        print(f"[UPLOAD 500] user={current_user.id} | {type(e).__name__}: {e}")
        if tmp_path.exists():
            tmp_path.unlink()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process upload: {str(e)}"
        )

    finally:
        file.file.close()

    return result


# ============================================================
# LIST USER PENDING DATASETS
# ============================================================
@router.get(
    "/pending",
    dependencies=[Depends(require_registered_or_admin)]
)
def list_user_pending(
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    entries = (
        db.query(DatasetUploadLog)
        .filter(
            DatasetUploadLog.user_id == current_user.id,
            DatasetUploadLog.status == "pending"
        )
        .order_by(DatasetUploadLog.upload_time.desc())
        .all()
    )

    result = []
    for e in entries:
        uploader_name = current_user.full_name or current_user.username

        reviewer_name = None
        if e.reviewed_by:
            admin = db.query(User).filter(User.id == e.reviewed_by).first()
            if admin:
                reviewer_name = admin.full_name or admin.username

        result.append({
            "id": e.id,
            "status": e.status,
            "folder": e.dataset_folder,
            "total_images": e.total_images,
            "upload_number": e.upload_number,
            "num_classes": e.num_classes,
            "class_names": e.class_names,
            "upload_time": e.upload_time,
            "uploader_name": uploader_name,
            "reviewer_name": reviewer_name,
        })

    return result


# ============================================================
# USER DATASET HISTORY (PAGINATED)
# GET /users/datasets/history?page=1&limit=10&status=pending
# ============================================================
@router.get("/history")
def list_user_history(
    page: int = 1,
    limit: int = 10,
    status: str | None = None,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(DatasetUploadLog).filter(
        DatasetUploadLog.user_id == current_user.id
    )

    if status:
        query = query.filter(DatasetUploadLog.status == status)

    total = query.count()

    rows = (
        query.order_by(DatasetUploadLog.upload_time.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    result = []
    for e in rows:
        reviewer = None
        if e.reviewed_by:
            u = db.query(User).filter(User.id == e.reviewed_by).first()
            reviewer = u.full_name or u.username

        result.append({
            "id": e.id,
            "status": e.status,
            "dataset_folder": e.dataset_folder,
            "total_images": e.total_images,
            "upload_number": e.upload_number,
            "num_classes": e.num_classes,
            "class_names": e.class_names,
            "upload_time": e.upload_time,
            "reviewer_name": reviewer,
            "uploader_name": current_user.full_name or current_user.username,
        })

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit,
        "data": result
    }
