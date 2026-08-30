import secrets
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.errors import AppError
from app.logger import log
from app.models.user import User

_API_BASE = "https://api.tryzend.com"
_DEV_CODE_TTL = timedelta(minutes=10)

# phone -> (code, expires_at) — dev-mode only, replaces real SMS delivery
_dev_codes: dict[str, tuple[str, datetime]] = {}


async def send_otp(db: AsyncSession, phone: str) -> None:
    if not settings.is_production:
        code = f"{secrets.randbelow(1_000_000):06d}"
        _dev_codes[phone] = (code, datetime.now(timezone.utc) + _DEV_CODE_TTL)
        log.info("otp_dev_code", phone=phone, code=code)
        return

    if not settings.zend_api_key:
        raise AppError(503, "OTP_NOT_CONFIGURED", "OTP service is not configured — add ZEND_API_KEY to your .env")

    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()
    if not user:
        return  # caller already checked existence where it matters (reset); no-op otherwise

    try:
        async with httpx.AsyncClient(timeout=10) as http:
            resp = await http.post(
                f"{_API_BASE}/otp/send",
                headers={"x-api-key": settings.zend_api_key},
                json={"phone_number": phone, "app": "bwk", "channel": "sms"},
            )
    except httpx.RequestError:
        log.error("otp_provider_unreachable")
        raise AppError(503, "OTP_UNAVAILABLE", "OTP service is temporarily unavailable")
    if resp.status_code not in (200, 201):
        log.error("otp_send_failed", status=resp.status_code)
        raise AppError(502, "OTP_SEND_FAILED", "Could not send OTP")

    user.zend_otp_id = resp.json()["id"]


async def check_otp(db: AsyncSession, phone: str, code: str) -> bool:
    if not settings.is_production:
        entry = _dev_codes.get(phone)
        if not entry:
            return False
        stored_code, expires_at = entry
        if datetime.now(timezone.utc) > expires_at:
            del _dev_codes[phone]
            return False
        approved = secrets.compare_digest(stored_code, code)
        if approved:
            del _dev_codes[phone]
        return approved

    if not settings.zend_api_key:
        raise AppError(503, "OTP_NOT_CONFIGURED", "OTP service is not configured — add ZEND_API_KEY to your .env")

    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()
    if not user or not user.zend_otp_id:
        return False

    try:
        async with httpx.AsyncClient(timeout=10) as http:
            resp = await http.post(
                f"{_API_BASE}/otp/{user.zend_otp_id}/verify",
                headers={"x-api-key": settings.zend_api_key},
                json={"code": code},
            )
    except httpx.RequestError:
        log.error("otp_provider_unreachable")
        raise AppError(503, "OTP_UNAVAILABLE", "OTP service is temporarily unavailable")
    if resp.status_code == 404:
        return False
    if resp.status_code not in (200, 201):
        log.error("otp_check_failed", status=resp.status_code)
        raise AppError(502, "OTP_CHECK_FAILED", "OTP verification failed")

    approved = resp.json().get("success") is True
    if approved:
        user.zend_otp_id = None
    return approved
