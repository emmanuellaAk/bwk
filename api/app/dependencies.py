from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.errors import AppError
from app.models.user import User

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    _invalid = AppError(401, "INVALID_TOKEN", "Access token is invalid or expired")

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=["HS256"],
        )
    except JWTError:
        raise _invalid

    if payload.get("type") != "access":
        raise _invalid

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise _invalid

    user = await db.get(User, user_id)
    if not user:
        raise _invalid

    return user
