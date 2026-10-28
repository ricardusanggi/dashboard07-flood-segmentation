# backend/app/learn/dataset.py
#
# Dataset segmentasi: pasangan (citra asli, mask biner).
# Struktur folder:
#   dataset_dir/
#     images/  → file citra (.jpg, .png, ...)
#     masks/   → file mask biner (.png, .jpg, ...) nama sama dengan citra

import random
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torch.utils.data import Dataset
from sklearn.model_selection import train_test_split
import torchvision.transforms.functional as TF


# ============================================================
# KONSTANTA
# ============================================================

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}


# ============================================================
# DATASET CLASS
# ============================================================

class SegmentationDataset(Dataset):

    def __init__(
        self,
        image_paths: list[str],
        mask_paths: list[str],
        img_size: tuple[int, int] = (256, 256),
        augment: bool = False,
    ):
        assert len(image_paths) == len(mask_paths)
        self.image_paths = image_paths
        self.mask_paths = mask_paths
        self.img_size = img_size
        self.augment = augment

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img = Image.open(self.image_paths[idx]).convert("RGB")
        mask = Image.open(self.mask_paths[idx]).convert("L")

        img = img.resize(self.img_size, Image.BILINEAR)
        mask = mask.resize(self.img_size, Image.NEAREST)

        if self.augment:
            img, mask = self._augment(img, mask)

        img_tensor = self._to_tensor_image(img)
        mask_tensor = self._to_tensor_mask(mask)

        return img_tensor, mask_tensor

    # ===========================
    # AUGMENTASI SINKRON
    # ===========================
    def _augment(self, img: Image.Image, mask: Image.Image):

        if random.random() > 0.5:
            img = TF.hflip(img)
            mask = TF.hflip(mask)

        if random.random() > 0.5:
            img = TF.vflip(img)
            mask = TF.vflip(mask)

        if random.random() > 0.5:
            angle = random.uniform(-15, 15)
            img = TF.rotate(img, angle)
            mask = TF.rotate(mask, angle)

        if random.random() > 0.5:
            brightness = random.uniform(0.8, 1.2)
            contrast = random.uniform(0.8, 1.2)
            img = TF.adjust_brightness(img, brightness)
            img = TF.adjust_contrast(img, contrast)

        return img, mask

    # ===========================
    # TENSOR HELPERS
    # ===========================
    def _to_tensor_image(self, img: Image.Image) -> torch.Tensor:
        arr = np.array(img).astype("float32") / 255.0
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        arr = (arr - mean) / std
        return torch.from_numpy(arr.transpose(2, 0, 1)).float()

    def _to_tensor_mask(self, mask: Image.Image) -> torch.Tensor:
        arr = np.array(mask).astype("float32")
        arr = (arr > 127).astype("float32")
        return torch.from_numpy(arr).unsqueeze(0).float()


# ============================================================
# BUILD DATASETS
# ============================================================

def build_datasets(
    dataset_dir: str,
    img_size: tuple[int, int] = (256, 256),
    val_split: float = 0.2,
    augment: bool = True,
):
    """
    Membangun train & val dataset dari folder segmentasi.

    Struktur yang diharapkan:
        dataset_dir/
            images/  ← citra asli
            masks/   ← mask biner (nama file sama dengan citra)

    Returns
    -------
    train_ds, val_ds
    """
    root = Path(dataset_dir)

    def _find_ci(name: str) -> Path:
        for d in root.iterdir():
            if d.is_dir() and d.name.lower() == name.lower():
                return d
        raise FileNotFoundError(f"Folder '{name}' tidak ditemukan di {root}")

    img_dir  = _find_ci("images")
    mask_dir = _find_ci("masks")

    image_paths = sorted([
        str(p) for p in img_dir.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXT
    ])

    if not image_paths:
        raise RuntimeError(f"Tidak ada gambar di {img_dir}")

    all_mask_files = sorted([
        p for p in mask_dir.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXT
    ])

    if not all_mask_files:
        raise RuntimeError(f"Tidak ada mask di {mask_dir}")

    # -------------------------------------------------------
    # Strategi 1: matching by stem (nama file sama)
    # -------------------------------------------------------
    mask_by_stem = {p.stem.lower(): str(p) for p in all_mask_files}

    stem_matched = []
    for img_path in image_paths:
        stem = Path(img_path).stem.lower()
        if stem in mask_by_stem:
            stem_matched.append(mask_by_stem[stem])

    if len(stem_matched) == len(image_paths):
        # semua cocok by stem
        mask_paths = stem_matched

    # -------------------------------------------------------
    # Strategi 2: pairing by sorted order (nama berbeda)
    # -------------------------------------------------------
    elif len(all_mask_files) == len(image_paths):
        mask_paths = [str(p) for p in all_mask_files]

    else:
        raise RuntimeError(
            f"Jumlah gambar ({len(image_paths)}) tidak sama dengan jumlah mask "
            f"({len(all_mask_files)}) dan nama file tidak cocok. "
            f"Pastikan setiap gambar memiliki mask dengan nama yang sama."
        )

    # split train / val
    indices = list(range(len(image_paths)))
    train_idx, val_idx = train_test_split(
        indices,
        test_size=val_split,
        random_state=42,
    )

    train_ds = SegmentationDataset(
        [image_paths[i] for i in train_idx],
        [mask_paths[i] for i in train_idx],
        img_size=img_size,
        augment=augment,
    )

    val_ds = SegmentationDataset(
        [image_paths[i] for i in val_idx],
        [mask_paths[i] for i in val_idx],
        img_size=img_size,
        augment=False,
    )

    return train_ds, val_ds
