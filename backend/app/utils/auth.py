# backend/app/utils/auth.py

from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer

from ..config import settings


SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES


# ============================================================
# OAUTH2 SCHEME
# ============================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/token",
    auto_error=False
)

# ============================================================
# PASSWORD HASHING
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        #print(f"[AUTH ERROR] password verify failed: {e}")
        return False

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ============================================================
# CREATE ACCESS TOKEN
# ============================================================

def create_access_token(data: dict, expires_delta: timedelta | int | None = None):

    to_encode = data.copy()

    if isinstance(expires_delta, int):
        expires_delta = timedelta(minutes=expires_delta)

    expire = (
        datetime.now(timezone.utc) + expires_delta
        if expires_delta
        else datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ============================================================
# DECODE TOKEN
# ============================================================

def decode_token(token: str):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        if "sub" not in payload:
            return None

        return payload

    except JWTError as e:

        print(f"[AUTH] JWT decode error: {e}")

        return None