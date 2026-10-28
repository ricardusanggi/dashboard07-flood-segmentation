#backend/app/utils/dataset_utils.py

from pathlib import Path
from PIL import Image
import imagehash
import shutil

from .time_utils import generate_ts
from .common_utils import IMAGE_EXT
import uuid

def find_duplicate_images(dataset_dir: Path):
    """
    Mendeteksi gambar duplikat dalam dataset classification.
    Menggunakan perceptual hash (pHash).
    """

    hash_map = {}
    duplicates = [] 

    for class_dir in dataset_dir.iterdir():

        if not class_dir.is_dir():
            continue

        for img in class_dir.rglob("*"):

            if img.suffix.lower() not in IMAGE_EXT:
                continue

            try:
                with Image.open(img) as image:
                    h = str(imagehash.phash(image))
            except Exception:
                continue

            if h in hash_map:
                duplicates.append({
                    "original": str(hash_map[h]),
                    "duplicate": str(img)
                })
            else:
                hash_map[h] = img

    return duplicates

def save_true_dataset(src_path: str, label: str, base_dir: str):

    src = Path(src_path)

    # folder label
    label_dir = Path(base_dir) / label
    label_dir.mkdir(parents=True, exist_ok=True)

    # ambil ekstensi file
    ext = src.suffix

    # buat nama file unik
    filename = f"{uuid.uuid4().hex}{ext}"

    dst = label_dir / filename

    # copy file asli (bukan stream)
    shutil.copy(src, dst)

    return str(dst)