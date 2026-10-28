# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
import os
import torch
from pathlib import Path
import logging

from slowapi import Limiter
from slowapi.util import get_remote_address

from .database import init_db, SessionLocal
from .config import settings, get_allowed_origins

# routers
from .routes import (
    auth_routes,
    dataset_routes_admin,
    model_routes,
    training_routes,
    user_routes,
    dataset_routes,
    admin_routes,
    predict_routes,
    system_routes,
    public_routes,
    system_routes_admin,
    admin_dashboard_routes
)

from .models import models_database
from .utils.auth import get_password_hash


# ============================================================
# TORCH CONFIG
# ============================================================

torch.set_num_threads(2)
torch.backends.nnpack.enabled = False


# ============================================================
# LOGGING CONFIG
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)

logger = logging.getLogger("backend")


# ============================================================
# RATE LIMITER
# ============================================================

limiter = Limiter(key_func=get_remote_address)


# ============================================================
# CREATE DEFAULT ADMIN
# ============================================================

def create_default_admin_if_missing():

    db = SessionLocal()

    try:

        username = settings.DEFAULT_ADMIN_USERNAME
        password = settings.DEFAULT_ADMIN_PASSWORD
        fullname = settings.DEFAULT_ADMIN_FULLNAME
        email = settings.DEFAULT_ADMIN_EMAIL

        if not username or not password:
            logger.warning("Default admin credentials missing in .env")
            return

        exists = (
            db.query(models_database.User)
            .filter(models_database.User.username == username)
            .first()
        )

        if exists:
            logger.info("Default admin already exists")
            return

        admin = models_database.User(
            username=username,
            email=email,
            full_name=fullname,
            hashed_password=get_password_hash(password),
            role="admin"
        )

        db.add(admin)
        db.commit()

        logger.info(f"Default admin created: {username}")

    except Exception as e:
        logger.error(f"Failed creating default admin: {e}")

    finally:
        db.close()
        
# ============================================================
# RECOVER MODEL IF DATABASE EMPTY
# ============================================================

def recover_model_if_missing(db):

    model_exists = db.query(models_database.Model).first()

    if model_exists:
        return

    predict_dir = Path(settings.PREDICT_MODEL_DIR)

    if not predict_dir.exists():
        logger.warning("Predict model directory not found")
        return

    model_file = predict_dir / "model.pth"
    mapping_file = predict_dir / "class_mapping.json"

    if not model_file.exists():
        logger.warning("model.pth not found, skipping recovery")
        return

    if not mapping_file.exists():
        logger.warning("class_mapping.json not found, skipping recovery")
        return

    try:
        torch.load(model_file, map_location="cpu")
    except Exception as e:
        logger.error(f"Model corrupted: {e}")
        return

    logger.info("Recovering model from models_predict folder")

    model = models_database.Model(
        name="Recovered Model",
        path=str(predict_dir),
        is_active=True,
        version=1
    )

    db.add(model)
    db.commit()


# ============================================================
# LIFESPAN (STARTUP + SHUTDOWN)
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("Starting backend...")

    # ------------------------------------------------
    # DATABASE FOLDER (SQLite)
    # ------------------------------------------------

    if settings.DATABASE_URL.startswith("sqlite"):

        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        db_folder = os.path.dirname(db_path)

        if db_folder:
            os.makedirs(db_folder, exist_ok=True)

    # ------------------------------------------------
    # INIT DATABASE
    # ------------------------------------------------

    init_db()

    logger.info("Database initialized")

    # ------------------------------------------------
    # CREATE DEFAULT ADMIN
    # ------------------------------------------------

    create_default_admin_if_missing()

    # ------------------------------------------------
    # RESET STUCK TRAINING JOBS
    # Jika backend restart saat training berjalan,
    # status 'running' di DB tidak pernah dibersihkan.
    # Reset ke 'failed' agar sistem tidak terkunci.
    # ------------------------------------------------

    try:
        db = SessionLocal()
        try:
            stuck = db.query(models_database.TrainingJob).filter(
                models_database.TrainingJob.review_status == "running"
            ).all()
            for job in stuck:
                job.review_status = "failed"
                job.reject_reason = "Terminated: backend restarted unexpectedly"
                from datetime import datetime
                job.updated_at = datetime.utcnow()
                logger.warning(f"Training job {job.id} reset to failed (was stuck as running)")
            if stuck:
                db.commit()
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Failed to reset stuck training jobs: {e}")

    # ------------------------------------------------
    # MODEL RECOVERY + WARMUP
    # ------------------------------------------------

    try:

        from .utils.model_manager import model_manager

        db = SessionLocal()

        try:

            recover_model_if_missing(db)

            model_manager.reload_if_changed(db)

            logger.info("Model warmed up")

        finally:

            db.close()

    except Exception as e:

        logger.warning(f"Model warmup skipped: {e}")

    logger.info("Backend started successfully")

    yield

    logger.info("Backend shutting down...")


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Classification Dashboard Backend",
    lifespan=lifespan
)

app.state.limiter = limiter


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTES
# ============================================================

PREDICT_ONLY = os.getenv("PREDICT_ONLY", "false").lower() == "true"

# Route yang selalu aktif
app.include_router(public_routes.router)
app.include_router(predict_routes.router)

if not PREDICT_ONLY:
    app.include_router(auth_routes.router)
    app.include_router(user_routes.router)
    app.include_router(dataset_routes.router)
    app.include_router(admin_routes.router)
    app.include_router(dataset_routes_admin.router)
    app.include_router(system_routes_admin.router)
    app.include_router(training_routes.router)
    app.include_router(model_routes.router)
    app.include_router(system_routes.router)
    app.include_router(admin_dashboard_routes.router)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():

    status = {
        "status": "ok",
        "database": "unknown",
        "model_loaded": False,
        "device": "cpu"
    }

    try:

        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()

        status["database"] = "connected"

    except Exception:

        status["database"] = "disconnected"

    try:

        from .utils.model_manager import model_manager

        status["model_loaded"] = model_manager.model is not None
        status["device"] = str(model_manager.device)

    except Exception:

        pass

    return status