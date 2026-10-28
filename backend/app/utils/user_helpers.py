#backend/app/utils/user_helpers.py
from fastapi import HTTPException
from typing import Any


def forbid_modify_other_admin(target_user, update_data: dict[str, Any]):
    """
    Tidak boleh modify role dari user admin lain.
    """
    if target_user.role == "admin" and update_data.get("role") is not None:
        raise HTTPException(
            status_code=403,
            detail="Cannot modify role of another admin."
        )

def forbid_delete_self(user_id: int, current_user):
    """
    Admin tidak boleh menghapus dirinya sendiri.
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Admin cannot delete their own account."
        )