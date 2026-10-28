#backend/app/utils/common_utils.py
from fastapi import HTTPException
from pathlib import Path

JUNK_FILES = {"__macosx", ".ds_store", "thumbs.db", ".ipynb_checkpoints"}

IMAGE_EXT = (".jpg",".jpeg",".png",".bmp",".webp")


def get_or_404(query, message="Not found"):

    obj = query.first()

    if obj is None:
        raise HTTPException(
            status_code=404,
            detail=message
        )

    return obj


def ensure_folder_exists(path: Path, message="Folder does not exist"):

    if not path.exists() or not path.is_dir():
        raise HTTPException(
            status_code=404,
            detail=message
        )


def ensure_nonempty_folder(path: Path, message="Folder empty"):

    if not path.exists() or not path.is_dir():
        raise HTTPException(
            status_code=404,
            detail=message
        )

    if not any(path.iterdir()):
        raise HTTPException(
            status_code=400,
            detail=message
        )