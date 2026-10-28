#backend/app/services/auth_service.py
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import models_database
from ..utils import auth
from ..services.user_service import get_user

# ==========================================================
# AUTHENTICATE USER
# ==========================================================
def authenticate_user(db: Session, identifier: str, password: str):

    if "@" in identifier:
        user = db.query(models_database.User).filter(
            func.lower(models_database.User.email) == identifier.lower()
        ).first()
    else:
        user = db.query(models_database.User).filter(
            func.lower(models_database.User.username) == identifier.lower()
        ).first()

    if not user:
        return None

    if not auth.verify_password(password, user.hashed_password):
        return None

    return user


# ==========================================================
# CREATE USER
# ==========================================================
def create_user(db: Session, user_data: dict):

    existing_user = db.query(models_database.User).filter(
        func.lower(models_database.User.username) == user_data["username"].lower()
    ).first()

    if existing_user:
        raise HTTPException(400, "Username already exists")

    existing_email = db.query(models_database.User).filter(
        func.lower(models_database.User.email) == user_data["email"].lower()
    ).first()

    if existing_email:
        raise HTTPException(400, "Email already exists")

    user = models_database.User(
        username=user_data["username"],
        email=user_data["email"],
        full_name=user_data.get("full_name"),
        hashed_password=auth.get_password_hash(user_data["password"]),
        role=user_data.get("role", "public"),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# ==========================================================
# GET CURRENT USER
# ==========================================================
def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(auth.oauth2_scheme),
):

    payload = auth.decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
        )

    user = get_user(db, user_id)


    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


# ==========================================================
# OPTIONAL USER (PUBLIC ENDPOINT)
# ==========================================================
def get_current_user_optional(
    db: Session = Depends(get_db),
    token: str | None = Depends(auth.oauth2_scheme),
):

    if not token:
        return None

    payload = auth.decode_token(token)

    if not payload:
        return None

    user_id = payload.get("sub")

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return None

    return db.query(models_database.User).filter(
        models_database.User.id == user_id
    ).first()


# ==========================================================
# REQUIRE ADMIN
# ==========================================================
def require_admin(
    current_user: models_database.User = Depends(get_current_user),
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )

    return current_user


# ==========================================================
# REQUIRE REGISTERED OR ADMIN
# ==========================================================
def require_registered_or_admin(
    current_user: models_database.User = Depends(get_current_user),
):

    if current_user.role not in ("registered", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registered or admin role required",
        )

    return current_user


# ==========================================================
# GET CURRENT ADMIN USER
# ==========================================================
def get_current_admin_user(
    current_user: models_database.User = Depends(get_current_user),
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )

    return current_user