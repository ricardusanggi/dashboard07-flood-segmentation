# backend/app/routes/auth_routes.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..utils.api_dependencies import block_when_training
from ..database import get_db
from ..services import auth_service
from ..utils.schemas import Token, UserCreate, UserOut
from ..services.user_service import get_user_by_username
from ..utils import auth as auth_utils


router = APIRouter(prefix="/auth", tags=["auth"])


# ==========================================================
# REGISTER
# ==========================================================
@router.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):

    existing = get_user_by_username(db, user_in.username)

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )

    user_data = user_in.dict()
    user_data["role"] = "public"

    user = auth_service.create_user(db, user_data)

    return user

# ==========================================================
# LOGIN
# ==========================================================
@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    user = auth_service.authenticate_user(
        db,
        form_data.username,
        form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    access_token = auth_utils.create_access_token(
        {"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
