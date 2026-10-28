#path : backend/app/learn/utils_dataset.py
from pathlib import Path
from sklearn.model_selection import train_test_split

from ..utils.common_utils import IMAGE_EXT
# =====================================================
# AUTO DETECT CLASSES
# =====================================================
def detect_classes(train_dir: str):
    root = Path(train_dir)

    classes = sorted([
        d.name for d in root.iterdir()
        if d.is_dir()
    ])

    if not classes:
        raise ValueError("No class folders found in training dataset")

    class_to_idx = {cls: i for i, cls in enumerate(classes)}
    idx_to_class = {i: cls for cls, i in class_to_idx.items()}

    return classes, class_to_idx, idx_to_class


# =====================================================
# CLASS DISTRIBUTION (IMBALANCE CHECK)
# =====================================================
def compute_class_distribution(train_dir: str):
    root = Path(train_dir)
    stats = {}

    for d in root.iterdir():
        if not d.is_dir():
            continue

        stats[d.name] = len([
            f for f in d.iterdir()
            if f.is_file() and f.suffix.lower() in IMAGE_EXT
        ])

    return stats


# =====================================================
# STRATIFIED TRAIN / VAL SPLIT
# =====================================================
def stratified_split(image_paths, labels, val_ratio=0.2):
    return train_test_split(
        image_paths,
        labels,
        test_size=val_ratio,
        stratify=labels,
        random_state=42
    )
