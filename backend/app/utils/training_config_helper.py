#backend/app/utils/training_config_helper.py
from copy import deepcopy
from fastapi import HTTPException

from ..config_training import (
    DEFAULT_TRAINING_PARAMS,
    validate_training_params
)


def build_training_config(override: dict | None) -> dict:
    """
    Merge DEFAULT_TRAINING_PARAMS dengan override dari frontend
    """

    # ============================
    # BASE CONFIG (DEFAULT)
    # ============================
    cfg = deepcopy(DEFAULT_TRAINING_PARAMS)

    # ============================
    # MERGE OVERRIDE
    # ============================
    if isinstance(override, dict):
        for k, v in override.items():
            if v is not None:
                cfg[k] = v

    # ============================
    # VALIDATE VIA CENTRAL CONFIG
    # ============================
    try:
        validate_training_params(cfg)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    return cfg