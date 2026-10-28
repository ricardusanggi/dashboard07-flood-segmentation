#backend/app/utils/file_utils.py
from pathlib import Path
import base64

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent


def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)


def read_bytes_safe(path: Path):
    try:
        return path.read_bytes()
    except Exception:
        return None


def to_base64(path: Path):
    return base64.b64encode(path.read_bytes()).decode()


def to_relative_app_path(full_path: str | Path) -> str:

    full = Path(full_path).resolve()

    try:
        rel = full.relative_to(BACKEND_ROOT)
        return str(rel).replace("\\", "/")
    except ValueError:
        return full.name


def to_absolute_app_path(rel_path: str | Path) -> Path:

    rel = Path(rel_path)

    if rel.is_absolute():
        return rel

    return (BACKEND_ROOT / rel).resolve()