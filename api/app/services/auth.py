import hashlib
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.errors import AppError
from app.models.refresh_token import RefreshToken
from app.models.salon import Salon
from app.models.user import User
from app.schemas.auth import RegisterRequest

_ph = PasswordHasher()

_ALGORITHM = "HS256"
_ACCESS_EXPIRE_MINUTES = 15
_REFRESH_EXPIRE_DAYS = 30


@dataclass
class TokenPair:
    access_token: str
    refresh_token: str  # raw — sent to client; never stored


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def register(self, data: RegisterRequest) -> TokenPair:
        existing = await self.db.execute(select(User).where(User.phone == data.phone))
        if existing.scalar_one_or_none():
            raise AppError(409, "PHONE_TAKEN", "An account with this phone number already exists")

        salon = Salon(name=data.salon_name)
        self.db.add(salon)
        await self.db.flush()  # get salon.id without committing yet

        user = User(
            salon_id=salon.id,
            phone=data.phone,
            password_hash=_ph.hash(data.password),
        )
        self.db.add(user)
        await self.db.flush()

        return await self._issue_tokens(user)

    async def login(self, phone: str, password: str) -> TokenPair:
        result = await self.db.execute(select(User).where(User.phone == phone))
        user = result.scalar_one_or_none()

        # Use same error for wrong phone OR wrong password — prevents user enumeration
        _invalid = AppError(401, "INVALID_CREDENTIALS", "Phone number or password is incorrect")

        if not user:
            # Run a dummy hash to prevent timing attacks that reveal valid phones
            _ph.hash("dummy-to-equalise-timing")
            raise _invalid

        try:
            _ph.verify(user.password_hash, password)
        except VerifyMismatchError:
            raise _invalid

        # Transparently upgrade hash if argon2 params have been tightened
        if _ph.check_needs_rehash(user.password_hash):
            user.password_hash = _ph.hash(password)

        return await self._issue_tokens(user)

    async def rotate_refresh_token(self, raw_token: str) -> TokenPair:
        token_hash = _hash(raw_token)
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )
        stored = result.scalar_one_or_none()
        if not stored:
            raise AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired")

        stored.revoked_at = datetime.now(timezone.utc)  # revoke immediately (rotation)

        user = await self.db.get(User, stored.user_id)
        if not user:
            raise AppError(401, "INVALID_REFRESH_TOKEN", "User not found")

        return await self._issue_tokens(user)

    async def revoke_refresh_token(self, raw_token: str) -> None:
        token_hash = _hash(raw_token)
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        stored = result.scalar_one_or_none()
        if stored:
            stored.revoked_at = datetime.now(timezone.utc)

    async def _issue_tokens(self, user: User) -> TokenPair:
        access = _create_access_token(str(user.id), str(user.salon_id))
        raw_refresh, hashed_refresh = _generate_refresh_token()

        self.db.add(
            RefreshToken(
                user_id=user.id,
                token_hash=hashed_refresh,
                expires_at=datetime.now(timezone.utc) + timedelta(days=_REFRESH_EXPIRE_DAYS),
            )
        )
        return TokenPair(access_token=access, refresh_token=raw_refresh)


# ── helpers ───────────────────────────────────────────────────────────────────

def _create_access_token(user_id: str, salon_id: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": user_id,
            "salon_id": salon_id,
            "type": "access",
            "iat": now,
            "exp": now + timedelta(minutes=_ACCESS_EXPIRE_MINUTES),
        },
        settings.jwt_secret,
        algorithm=_ALGORITHM,
    )


def _generate_refresh_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    return raw, _hash(raw)


def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
