# backend/app/database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import settings

# ===============================================
# DATABASE URL
# ===============================================

DATABASE_URL = settings.DATABASE_URL


# ===============================================
# SQLITE CONFIG
# ===============================================

connect_args = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

    # pastikan folder database ada
    db_path = DATABASE_URL.replace("sqlite:///", "")
    db_folder = os.path.dirname(db_path)

    if db_folder:
        os.makedirs(db_folder, exist_ok=True)


# ===============================================
# ENGINE
# ===============================================

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)


# ===============================================
# SESSION
# ===============================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ===============================================
# BASE MODEL
# ===============================================

Base = declarative_base()


# ===============================================
# DB DEPENDENCY
# ===============================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ===============================================
# INITIALIZE DATABASE
# ===============================================

def init_db():
    from .models import models_database  # register models
    Base.metadata.create_all(bind=engine)
    _migrate_columns()


def _migrate_columns():
    """Tambahkan kolom baru ke tabel existing (idempotent)."""
    migrations = [
        ("prediction_logs", "flood_percentage", "REAL"),
    ]
    with engine.connect() as conn:
        for table, col, col_type in migrations:
            try:
                conn.execute(
                    __import__("sqlalchemy").text(
                        f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"
                    )
                )
                conn.commit()
            except Exception:
                pass  # kolom sudah ada