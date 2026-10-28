# path : backend/app/learn/utils_split.py
from sklearn.model_selection import train_test_split

def stratified_split(X, y, val_ratio=0.2):
    return train_test_split(
        X,
        y,
        test_size=val_ratio,
        stratify=y,
        random_state=42
    )
