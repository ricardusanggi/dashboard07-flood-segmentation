# backend/app/services/user_service.py

from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from fastapi import HTTPException

from ..models import models_database
from ..utils.auth import get_password_hash

from ..models.models_database import PredictionLog

# ============================================================
# GET USER BY USERNAME
# ============================================================
def get_user_by_username(db: Session, username: str):
    return (
        db.query(models_database.User)
        .filter(func.lower(models_database.User.username) == username.lower())
        .first()
    )


# ============================================================
# GET USER BY EMAIL
# ============================================================
def get_user_by_email(db: Session, email: str):
    return (
        db.query(models_database.User)
        .filter(func.lower(models_database.User.email) == email.lower())
        .first()
    )


# ============================================================
# GET USER BY ID
# ============================================================
def get_user(db: Session, user_id: int):
    return (
        db.query(models_database.User)
        .filter(models_database.User.id == user_id)
        .first()
    )

# ============================================================
# LIST USERS
# ============================================================
def list_users(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[models_database.User]:

    return (
        db.query(models_database.User)
        .offset(skip)
        .limit(limit)
        .all()
    )


# ============================================================
# UPDATE USER
# ============================================================
def update_user(
    db: Session,
    user_id: int,
    data: dict,
    is_admin: bool = False
):

    user = get_user(db, user_id)

    if not user:
        return None

    allowed_user_fields = {"email", "full_name", "password"}
    allowed_admin_fields = {"email", "full_name", "password", "username", "role"}

    for key, value in data.items():

        # ====================================================
        # FIELD PERMISSION
        # ====================================================
        if is_admin:
            if key not in allowed_admin_fields:
                continue
        else:
            if key not in allowed_user_fields:
                continue

        # ====================================================
        # PASSWORD UPDATE
        # ====================================================
        if key == "password":

            if not value or len(value) < 8:
                raise HTTPException(
                    status_code=400,
                    detail="Password minimal 8 karakter"
                )

            user.hashed_password = get_password_hash(value)
            continue

        # ====================================================
        # EMAIL VALIDATION
        # ====================================================
        if key == "email":

            existing = (
                db.query(models_database.User)
                .filter(func.lower(models_database.User.email) == value.lower())
                .first()
            )

            if existing and existing.id != user_id:
                raise HTTPException(400, "Email already used")

        # ====================================================
        # USERNAME VALIDATION (ADMIN ONLY)
        # ====================================================
        if key == "username":

            existing = (
                db.query(models_database.User)
                .filter(func.lower(models_database.User.username) == value.lower())
                .first()
            )

            if existing and existing.id != user_id:
                raise HTTPException(400, "Username already used")

        setattr(user, key, value)

    try:
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    return user


# ============================================================
# DELETE USER
# ============================================================
def delete_user(db: Session, user_id: int):

    user = get_user(db, user_id)

    if not user:
        return False

    try:
        db.delete(user)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return True



def get_user_prediction_history(db: Session, user_id: int, limit: int = 20):

    return (
        db.query(PredictionLog)
        .filter(PredictionLog.user_id == user_id)
        .order_by(PredictionLog.predicted_at.desc())
        .limit(limit)
        .all()
    )
    