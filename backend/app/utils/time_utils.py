#backend/app/utils/time_utils.py
from datetime import datetime

def generate_ts():
    return datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")