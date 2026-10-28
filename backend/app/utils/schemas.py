# backend/app/utils/schemas.py

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import re


# ============================================================
# PASSWORD VALIDATION
# ============================================================

def validate_password_strength(password: str) -> str:

    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")

    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain uppercase letter")

    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain lowercase letter")

    if not re.search(r"[0-9]", password):
        raise ValueError("Password must contain number")

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValueError("Password must contain special character")

    return password


# ============================================================
# AUTH
# ============================================================

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    sub: Optional[int] = None


# ============================================================
# USER
# ============================================================

class UserRole(str, Enum):
    public = "public"
    registered = "registered"
    admin = "admin"


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    password: str

    @field_validator("password")
    def validate_password(cls, v):
        return validate_password_strength(v)


class UserOut(BaseModel):

    id: int
    username: str
    email: EmailStr
    full_name: Optional[str]
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserSelfUpdate(BaseModel):

    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

    @field_validator("password")
    def validate_password(cls, v):
        if v is None:
            return v
        return validate_password_strength(v)


class UserAdminUpdate(BaseModel):

    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    username: Optional[str] = None
    role: Optional[UserRole] = None

    @field_validator("password")
    def validate_password(cls, v):
        if v is None:
            return v
        return validate_password_strength(v)

    model_config = {"from_attributes": True}


# ============================================================
# DATASET
# ============================================================

class DatasetUploadOut(BaseModel):

    id: int
    user_id: int
    upload_number: int
    total_images: int
    dataset_folder: str
    num_classes: Optional[int]
    class_names: Optional[List[str]]
    status: str
    upload_time: datetime

    model_config = {"from_attributes": True}


# ============================================================
# MODEL
# ============================================================

class ModelOut(BaseModel):

    id: int
    name: str
    path: str
    uploaded_by: Optional[int]
    created_at: datetime

    is_active: bool
    is_archived: bool
    version: int

    model_config = {"from_attributes": True}


# ============================================================
# TRAINING
# ============================================================

class TrainingCreate(BaseModel):

    training_params: Optional[Dict[str, Any]] = None


class TrainingOut(BaseModel):

    id: int
    started_by: int
    model_id: Optional[int]

    architecture: str
    epochs: int
    batch_size: int
    learning_rate: float
    optimizer: str
    loss_function: str
    augmentation: bool
    val_split: float

    use_pso: bool
    pso_population: Optional[int]
    pso_iters: Optional[int]

    accuracy: Optional[float]
    precision: Optional[float]
    recall: Optional[float]
    f1: Optional[float]

    review_status: str
    reject_reason: Optional[str]

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ============================================================
# SYSTEM
# ============================================================

class SystemResetRequest(BaseModel):
    confirm_text: str