# backend/app/utils/model_manager.py
#
# Singleton manager untuk model segmentasi (U-Net atau DeepLab).
# Arsitektur dideteksi otomatis dari class_mapping.json di direktori model.

import json
import torch
from threading import Lock
from pathlib import Path
from sqlalchemy.orm import Session

from ..config import settings
from ..services.inference_service import load_unet_from_path, load_deeplab_from_path, load_unet_resnet_from_path


class ModelManager:
    """
    Cache model U-Net aktif sehingga tidak di-load ulang
    setiap request inferensi.
    """

    def __init__(self):
        self.model: torch.nn.Module | None = None
        self.model_path: str | None = None
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )
        self.lock = Lock()

    def get_device(self):
        return self.device

    # =====================================================
    # LOAD MODEL (DARI PATH) — deteksi arsitektur otomatis
    # =====================================================
    def load_model(self, model_path: str):
        model_path = str(Path(model_path))

        with self.lock:
            if self.model_path == model_path and self.model is not None:
                return self.model, {}

            # Baca arsitektur dari class_mapping.json
            dir_path = Path(model_path)
            if dir_path.is_file():
                dir_path = dir_path.parent

            arch = "unet"
            mapping_file = dir_path / "class_mapping.json"
            if mapping_file.exists():
                with open(mapping_file) as f:
                    arch = json.load(f).get("architecture", "unet").lower()

            print(f"[MODEL MANAGER] Loading {arch.upper()} from {model_path}")

            if arch.startswith("deeplab"):
                model = load_deeplab_from_path(str(dir_path), self.device)
            elif arch.startswith("unet_"):
                model = load_unet_resnet_from_path(str(dir_path), self.device, arch)
            else:
                model = load_unet_from_path(str(dir_path), self.device)

            self.model      = model
            self.model_path = model_path

            return self.model, {}

    # =====================================================
    # GET ACTIVE (UNTUK INFERENSI PUBLIK)
    # =====================================================
    def get_active(self, db: Session):
        predict_dir = Path(settings.PREDICT_MODEL_DIR)

        if not predict_dir.exists():
            raise RuntimeError(f"Folder model tidak ditemukan: {predict_dir}")

        return self.load_model(str(predict_dir))

    # =====================================================
    # LOAD MODEL SPESIFIK (USER TERDAFTAR)
    # =====================================================
    def load_specific(self, model_path: str):
        return self.load_model(model_path)

    # =====================================================
    # RELOAD JIKA MODEL AKTIF BERUBAH
    # =====================================================
    def reload_if_changed(self, db: Session):
        from ..services.model_service import get_active_model_or_filesystem

        model_record = get_active_model_or_filesystem(db)
        if not model_record:
            return

        new_path = str(Path(model_record.path))
        if new_path != self.model_path:
            print("[MODEL MANAGER] Reloading U-Net model")
            self.clear_cache()
            self.load_model(new_path)

    # =====================================================
    # CLEAR CACHE
    # =====================================================
    def clear_cache(self):
        with self.lock:
            self.model      = None
            self.model_path = None
        print("[MODEL MANAGER] Cache cleared")


model_manager = ModelManager()
