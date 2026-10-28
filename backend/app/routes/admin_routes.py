# backend/app/routes/admin_routes.py

from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from fastapi import HTTPException

from ..utils.api_dependencies import block_when_training
from ..database import get_db

from ..services.user_service import list_users, update_user, delete_user
from ..utils.schemas import UserOut, UserAdminUpdate
from ..services.auth_service import get_current_user, require_admin

# === Helper yang baru kita buat ===
from ..utils.common_utils import get_or_404
from ..utils.user_helpers import forbid_modify_other_admin, forbid_delete_self
from ..models.models_database import User  # untuk query


# ============================================================
# ROUTER — Semua endpoint admin otomatis aman
# ============================================================
router = APIRouter(
    prefix="/admin",
    tags=["admin-user"],
    dependencies=[Depends(require_admin)]
)

# ============================================================
# LIST USERS
# ============================================================
@router.get("/users", response_model=List[UserOut])
def api_list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return list_users(db, skip=skip, limit=limit)


# ============================================================
# VERIFY USER (PUBLIC → REGISTERED)
# ============================================================
@router.post("/verify-user/{user_id}", dependencies=[Depends(block_when_training)])
def verify_user(
    user_id: int,
    db: Session = Depends(get_db)
):

    # Gunakan helper untuk ambil user atau error 404
    user = get_or_404(
        db.query(User).filter(User.id == user_id),
        "User not found"
    )

    if user.role == "registered":
        return {"detail": "User already registered", "user_id": user_id}

    if user.role == "admin":
        return {"detail": "Admin cannot be verified"}

    updated = update_user(
        db, user_id,
        {"role": "registered"},
        is_admin=True
    )

    return {
        "detail": "User verified successfully",
        "user_id": updated.id,
        "new_role": updated.role
    }


# ============================================================
# UPDATE USER (Admin Only)
# ============================================================
@router.put("/{user_id}", response_model=UserOut, dependencies=[Depends(block_when_training)])
def api_update_user(
    user_id: int,
    payload: UserAdminUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # Ambil user menggunakan helper
    user = get_or_404(
        db.query(User).filter(User.id == user_id),
        "User not found"
    )

    # Gunakan helper larangan modifikasi admin lain
    forbid_modify_other_admin(user, payload.dict())

    # Filter field yang dikirim
    update_data = {k: v for k, v in payload.dict().items() if v is not None}

    updated_user = update_user(
        db, user_id,
        update_data,
        is_admin=True
    )

    return updated_user


# ============================================================
# DELETE USER
# ============================================================
@router.delete("/{user_id}", dependencies=[Depends(block_when_training)])
def api_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # Larangan delete akun sendiri
    forbid_delete_self(user_id, current_user)

    # Coba delete, kalau hasil False → user tidak ditemukan
    ok = delete_user(db, user_id)
    if not ok:
        raise HTTPException(404, "User not found")

    return {"detail": "deleted"}
