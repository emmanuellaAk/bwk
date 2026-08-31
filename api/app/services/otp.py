import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Protocol

import httpx

from app.config import settings
from app.errors import AppError
from app.logger import log

_API_BASE = "https://api.tryzend.com"
_DEV_CODE_TTL = timedelta(minutes=10)

# phone -> (code, expires_at) — dev-mode only, replaces real SMS delivery
_dev_codes: dict[str, tuple[str, datetime]] = {}


class OtpHolder(Protocol):
    """Anything that can hold a Zend OTP id between send and verify —
    a User (existing-account flows) or a PendingRegistration (signup flow)."""
    zend_otp_id: Optional[str]


async def send_otp(phone: str, holder: Optional[OtpHolder]) -> None:
    # Use the real provider whenever it's configured — independent of ENV — so
    # local dev can exercise real SMS delivery; fall back to a logged fake code
    # only when no key is set (e.g. a fresh checkout with no Zend account yet).
    if not settings.zend_api_key:
        if settings.is_production:
            raise AppError(503, "OTP_NOT_CONFIGURED", "OTP service is not configured — add ZEND_API_KEY to your .env")
        code = f"{secrets.randbelow(1_000_000):06d}"
        _dev_codes[phone] = (code, datetime.now(timezone.utc) + _DEV_CODE_TTL)
        log.info("otp_dev_code", phone=phone, code=code)
        return

    if holder is None:
        return  # caller already checked existence where it matters; no-op otherwise

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

    holder.zend_otp_id = resp.json()["id"]


async def check_otp(phone: str, code: str, holder: Optional[OtpHolder]) -> tuple[bool, Optional[int]]:
    """Returns (approved, attempts_remaining). attempts_remaining is None when
    the provider doesn't report it (dev mode, or the OTP wasn't found)."""
    if not settings.zend_api_key:
        if settings.is_production:
            raise AppError(503, "OTP_NOT_CONFIGURED", "OTP service is not configured — add ZEND_API_KEY to your .env")
        entry = _dev_codes.get(phone)
        if not entry:
            return False, None
        stored_code, expires_at = entry
        if datetime.now(timezone.utc) > expires_at:
            del _dev_codes[phone]
            return False, None
        approved = secrets.compare_digest(stored_code, code)
        if approved:
            del _dev_codes[phone]
        return approved, None

    if holder is None or not holder.zend_otp_id:
        return False, None

    try:
        async with httpx.AsyncClient(timeout=10) as http:
            resp = await http.post(
                f"{_API_BASE}/otp/{holder.zend_otp_id}/verify",
                headers={"x-api-key": settings.zend_api_key},
                json={"code": code},
            )
    except httpx.RequestError:
        log.error("otp_provider_unreachable")
        raise AppError(503, "OTP_UNAVAILABLE", "OTP service is temporarily unavailable")
    if resp.status_code == 404:
        return False, None
    if resp.status_code not in (200, 201):
        log.error("otp_check_failed", status=resp.status_code)
        raise AppError(502, "OTP_CHECK_FAILED", "OTP verification failed")

    body = resp.json()
    approved = body.get("success") is True
    if approved:
        holder.zend_otp_id = None
    return approved, body.get("attempts_remaining")
