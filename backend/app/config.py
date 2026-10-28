# backend/app/config.py

from pathlib import Path
from pydantic_settings import BaseSettings


# ============================================================
# BASE DIRECTORY
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BACKEND_DIR / ".env"


# ============================================================
# SETTINGS CLASS
# ============================================================

class Settings(BaseSettings):

    # ===============================
    # DATABASE
    # ===============================
    DATABASE_URL: str

    # ===============================
    # CORS
    # ===============================
    ALLOWED_ORIGINS: str = ""

    # ===============================
    # AUTH
    # ===============================
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    ALGORITHM: str = "HS256"

    # ===============================
    # DATASET STORAGE
    # ===============================
    TRAIN_DATASET_DIR: str
    PENDING_DATASET_DIR: str
    REJECT_DATASET_DIR: str
    TEST_DATASET_DIR: str
    TEST_TRUE_DIR: str

    # ===============================
    # MODEL STORAGE
    # ===============================
    TRAIN_MODEL_DIR: str
    UPLOAD_MODEL_DIR: str
    PREDICT_MODEL_DIR: str
    REJECT_MODEL_DIR: str

    # ===============================
    # LOGGING
    # ===============================
    LOG_DIR: str | None = None

    # ===============================
    # ML CONFIG
    # ===============================
    CASE_DATASET: str
    ML_TASK: str = "segmentation"

    # ===============================
    # SEGMENTASI
    # ===============================
    SEGMENTATION_METHOD: str = "otsu"
    DEEPLAB_PRETRAINED_BACKBONE: bool = True
    SEGMENT_THRESHOLD: float = 0.5
    SEGMENT_KMEANS_K: int = 3
    SEGMENT_ADAPTIVE_BLOCK: int = 11
    SEGMENT_ADAPTIVE_C: int = 2
    SEGMENT_MORPH_KERNEL: int = 3
    SEGMENT_MORPH_ITERATIONS: int = 1
    SEGMENT_WATERSHED_MARKERS: int = 20
    SEGMENT_WATERSHED_COMPACTNESS: float = 0.001

    # ===============================
    # DEFAULT ADMIN
    # ===============================
    DEFAULT_ADMIN_USERNAME: str
    DEFAULT_ADMIN_PASSWORD: str
    DEFAULT_ADMIN_FULLNAME: str
    DEFAULT_ADMIN_EMAIL: str
    DEFAULT_ADMIN_ROLE: str = "admin"
    DEFAULT_ADMIN_IS_ACTIVE: bool = True
    DEFAULT_ADMIN_IS_SUPERUSER: bool = True

    # ===============================
    # PREDICTION CONFIG
    # ===============================
    PREDICT_BATCH_SIZE: int = 1
    PREDICT_IMG_SIZE: int = 256
    PREDICT_THRESHOLD: float = 0.5
    PREDICT_AUGMENTATION: bool = False
    PREDICT_SLIDE_WINDOW_SIZE: int = 256
    PREDICT_SLIDE_WINDOW_STRIDE: int = 128

    class Config:
        env_file = ENV_FILE
        extra = "ignore"


# ============================================================
# LOAD SETTINGS
# ============================================================

settings = Settings()


# ============================================================
# VALIDATE CRITICAL ENV
# ============================================================

if not settings.DATABASE_URL:
    raise ValueError("DATABASE_URL must be set in .env")

if not settings.SECRET_KEY:
    raise ValueError("SECRET_KEY must be set in .env")


# ============================================================
# PATH RESOLVER
# ============================================================

def resolve_path(path_str: str | None) -> str:

    if not path_str:
        raise ValueError("Path config cannot be empty")

    p = Path(path_str)

    if p.is_absolute():
        return str(p)

    return str((BACKEND_DIR / p).resolve())


# ============================================================
# PARSE CORS ORIGINS
# ============================================================

def get_allowed_origins() -> list[str]:

    if not settings.ALLOWED_ORIGINS:
        return []

    return [
        origin.strip()
        for origin in settings.ALLOWED_ORIGINS.split(",")
        if origin.strip()
    ]


# ============================================================
# FIX SQLITE DATABASE PATH
# ============================================================

if settings.DATABASE_URL.startswith("sqlite:///"):

    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    resolved_db_path = resolve_path(db_path)

    settings.DATABASE_URL = f"sqlite:///{resolved_db_path}"

    db_file = Path(resolved_db_path)
    db_file.parent.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOG DIR FALLBACK
# ============================================================

if not settings.LOG_DIR:
    settings.LOG_DIR = str(BACKEND_DIR / "logs")


# ============================================================
# RESOLVE STORAGE PATHS
# ============================================================

settings.TRAIN_DATASET_DIR = resolve_path(settings.TRAIN_DATASET_DIR)
settings.PENDING_DATASET_DIR = resolve_path(settings.PENDING_DATASET_DIR)
settings.REJECT_DATASET_DIR = resolve_path(settings.REJECT_DATASET_DIR)
settings.TEST_DATASET_DIR = resolve_path(settings.TEST_DATASET_DIR)
settings.TEST_TRUE_DIR = resolve_path(settings.TEST_TRUE_DIR)

settings.TRAIN_MODEL_DIR = resolve_path(settings.TRAIN_MODEL_DIR)
settings.UPLOAD_MODEL_DIR = resolve_path(settings.UPLOAD_MODEL_DIR)
settings.PREDICT_MODEL_DIR = resolve_path(settings.PREDICT_MODEL_DIR)
settings.REJECT_MODEL_DIR = resolve_path(settings.REJECT_MODEL_DIR)

settings.LOG_DIR = resolve_path(settings.LOG_DIR)


# ============================================================
# ENSURE REQUIRED FOLDERS EXIST
# ============================================================

required_folders = [
    settings.TRAIN_DATASET_DIR,
    settings.PENDING_DATASET_DIR,
    settings.REJECT_DATASET_DIR,
    settings.TEST_DATASET_DIR,
    settings.TEST_TRUE_DIR,
    settings.TRAIN_MODEL_DIR,
    settings.UPLOAD_MODEL_DIR,
    settings.PREDICT_MODEL_DIR,
    settings.REJECT_MODEL_DIR,
    settings.LOG_DIR,
]

for folder in required_folders:

    if not folder:
        raise ValueError("Folder config cannot be empty")

    try:
        Path(folder).mkdir(parents=True, exist_ok=True)
    except Exception as e:
        raise RuntimeError(f"Cannot create folder: {folder}") from e
