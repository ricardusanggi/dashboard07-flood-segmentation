#backend/app/utils/api_dependencies.py

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db

# ==========================================================
# TRAINING LOCK
# ==========================================================
def block_when_training(db: Session = Depends(get_db)):
    """
    Block request ketika training sedang berjalan.
    Digunakan untuk endpoint yang tidak boleh berjalan
    saat training aktif.
    """

    from ..services.training_service import is_training_running

    if is_training_running(db):
        raise HTTPException(
            status_code=423,
            detail="System locked: training in progress"
        )