# backend/app/utils/models_database.py
#
# SQLAlchemy models for users, models, training jobs,
# dataset uploads, testing logs, and prediction logs.
#
# KLASIFIKASI ONLY
#

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    ForeignKey,
    Float,
    Enum,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime

from ..database import Base


# ============================================================
# USER
# ============================================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    role = Column(String, default="public", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ===============================
    # RELATIONSHIPS
    # ===============================

    models = relationship(
        "Model",
        back_populates="uploader",
    )

    training_jobs = relationship(
        "TrainingJob",
        foreign_keys="TrainingJob.started_by",
        back_populates="starter",
    )

    reviewed_training_jobs = relationship(
        "TrainingJob",
        foreign_keys="TrainingJob.reviewed_by",
        back_populates="reviewer",
    )

    dataset_upload_logs = relationship(
        "DatasetUploadLog",
        foreign_keys="DatasetUploadLog.user_id",
        back_populates="user",
    )

    reviewed_datasets = relationship(
        "DatasetUploadLog",
        foreign_keys="DatasetUploadLog.reviewed_by",
        back_populates="reviewer",
    )

    testing_logs = relationship(
        "TestingUploadLog",
        foreign_keys="TestingUploadLog.user_id",
        back_populates="user",
    )


# ============================================================
# MODEL
# ============================================================
class Model(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    path = Column(String, nullable=False)

    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    is_active = Column(Boolean, default=False, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)

    version = Column(Integer, default=1, nullable=False)

    # ===============================
    # RELATIONSHIPS
    # ===============================
    uploader = relationship(
        "User",
        back_populates="models",
    )

    training_job = relationship(
        "TrainingJob",
        back_populates="model",
        uselist=False,
    )

    # ========================================================
    # REVIEW STATUS
    # ========================================================
    @hybrid_property
    def review_status(self):
        if self.training_job:
            return self.training_job.review_status
        return "approved"

    @hybrid_property
    def reviewed_by(self):
        return self.training_job.reviewed_by if self.training_job else None

    @hybrid_property
    def reviewed_at(self):
        return self.training_job.reviewed_at if self.training_job else None

    @hybrid_property
    def reject_reason(self):
        return self.training_job.reject_reason if self.training_job else None

    # ========================================================
    # MODEL ARCHITECTURE (PERBAIKAN)
    # ========================================================
    @hybrid_property
    def architecture(self):
        """
        Mengambil arsitektur model dari TrainingJob
        agar bisa ditampilkan pada API / frontend.
        """
        return self.training_job.architecture if self.training_job else None

    # ========================================================
    # METRICS (KLASIFIKASI)
    # ========================================================
    @hybrid_property
    def accuracy(self):
        return self.training_job.accuracy if self.training_job else None

    @hybrid_property
    def precision(self):
        return self.training_job.precision if self.training_job else None

    @hybrid_property
    def recall(self):
        return self.training_job.recall if self.training_job else None

    @hybrid_property
    def f1(self):
        return self.training_job.f1 if self.training_job else None


# ============================================================
# TRAINING JOB (ADMIN ONLY)
# ============================================================
class TrainingJob(Base):
    __tablename__ = "training_jobs"

    id = Column(Integer, primary_key=True, index=True)

    started_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # ===============================
    # TRAINING PARAMETERS
    # ===============================
    architecture = Column(String, nullable=False, default="resnet18")
    epochs = Column(Integer, nullable=False)
    batch_size = Column(Integer, nullable=False)
    learning_rate = Column(Float, nullable=False)
    optimizer = Column(String, nullable=False)
    loss_function = Column(String, nullable=False)
    augmentation = Column(Boolean, default=False, nullable=False)
    val_split = Column(Float, nullable=False)

    # ===============================
    # PSO HYPERPARAMETER SEARCH
    # ===============================
    use_pso = Column(Boolean, default=False, nullable=False)
    pso_population = Column(Integer, nullable=True)
    pso_iters = Column(Integer, nullable=True)
    pso_best_score = Column(Float, nullable=True)
    pso_best_params = Column(JSON, nullable=True)

    # ===============================
    # METRICS
    # ===============================
    best_train_loss = Column(Float, nullable=True)
    best_val_loss = Column(Float, nullable=True)

    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1 = Column(Float, nullable=True)

    # ===============================
    # MODEL RELATION
    # ===============================
    model_id = Column(
        Integer,
        ForeignKey("models.id"),
        nullable=True,
        unique=True,
    )

    # ===============================
    # REVIEW STATUS
    # ===============================
    review_status = Column(
        Enum("running","pending","approved","rejected","failed", name="training_review_status"),
        default="running",
        nullable=False,
    )

    reject_reason = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # ===============================
    # RELATIONSHIPS
    # ===============================
    starter = relationship(
        "User",
        foreign_keys=[started_by],
        back_populates="training_jobs",
    )

    reviewer = relationship(
        "User",
        foreign_keys=[reviewed_by],
        back_populates="reviewed_training_jobs",
    )

    model = relationship(
        "Model",
        back_populates="training_job",
    )


# ============================================================
# DATASET UPLOAD LOG
# ============================================================
class DatasetUploadLog(Base):
    __tablename__ = "dataset_upload_logs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    upload_number = Column(Integer, nullable=False)
    total_images = Column(Integer, nullable=False)
    dataset_folder = Column(String, nullable=False)
    
    num_classes = Column(Integer, nullable=True)
    class_names = Column(JSON, nullable=True)

    status = Column(String, default="pending", nullable=False)
    upload_time = Column(DateTime, default=datetime.utcnow, nullable=False)

    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="dataset_upload_logs",
    )

    reviewer = relationship(
        "User",
        foreign_keys=[reviewed_by],
        back_populates="reviewed_datasets",
    )


# ============================================================
# TESTING UPLOAD LOG
# ============================================================
class TestingUploadLog(Base):
    __tablename__ = "testing_upload_logs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    filename = Column(String, nullable=False)
    saved_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="testing_logs",
    )


# ============================================================
# PREDICTION LOG
# ============================================================
class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)

    input_filename = Column(String, nullable=False)
    input_path = Column(String, nullable=False)

    output_filename = Column(String, nullable=False)
    output_path = Column(String, nullable=True)

    confidence       = Column(Float, nullable=True)
    true_label       = Column(String, nullable=True)
    flood_percentage = Column(Float, nullable=True)

    predicted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="prediction_logs")
    model = relationship("Model", backref="prediction_logs")


# ============================================================
# SYSTEM LOCK
# ============================================================
class SystemLock(Base):
    __tablename__ = "system_locks"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

    is_locked = Column(Boolean, default=False)
    locked_at = Column(DateTime, nullable=True)