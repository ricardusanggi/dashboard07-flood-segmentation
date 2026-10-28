# backend/app/services/public_service.py


from pathlib import Path
import json
from ..config import settings


def get_model_metrics():
    """
    Mengambil seluruh informasi model dari training_artifact.json
    yang berada di folder models_predict
    """

    artifact_file = Path(settings.PREDICT_MODEL_DIR) / "training_artifact.json"

    if not artifact_file.exists():
        return None

    try:
        with open(artifact_file) as f:
            artifact = json.load(f)

        return {
            "metrics": artifact.get("metrics"),
            "training": artifact.get("training"),
            "dataset": artifact.get("dataset"),
            "trained_at": artifact.get("trained_at")
        }

    except Exception as e:
        print("Failed reading training artifact:", e)
        return None

    
def get_model_info():
    artifact_file = Path(settings.PREDICT_MODEL_DIR) / "training_artifact.json"

    if not artifact_file.exists():
        raise __import__("fastapi").HTTPException(
            status_code=409,
            detail="Model belum tersedia"
        )

    with open(artifact_file) as f:
        return json.load(f)