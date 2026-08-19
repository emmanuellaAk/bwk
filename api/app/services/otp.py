import base64
import secrets
from datetime import datetime, timedelta, timezone

import httpx

from app.config import settings
from app.errors import AppError
from app.logger import log

_VERIFY_BASE = "https://verify.twilio.com/v2"
_DEV_CODE_TTL = timedelta(minutes=10)

# phone -> (code, expires_at) — dev-mode only, replaces real SMS delivery
_dev_codes: dict[str, tuple[str, datetime]] = {}


def _auth() -> str:
    return "Basic " + base64.b64encode(
        f"{settings.twilio_account_sid}:{settings.twilio_auth_token}".encode()
    ).decode()


async def send_otp(phone: str) -> None:
    if not settings.is_production:
        code = f"{secrets.randbelow(1_000_000):06d}"
        _dev_codes[phone] = (code, datetime.now(timezone.utc) + _DEV_CODE_TTL)
        log.info("otp_dev_code", phone=phone, code=code)
        return

    if not settings.twilio_verify_service_sid:
        raise AppError(503, "OTP_NOT_CONFIGURED", "OTP service is not configured — add TWILIO_VERIFY_SERVICE_SID to your .env")
    try:
        async with httpx.AsyncClient(timeout=10) as http:
            resp = await http.post(
                f"{_VERIFY_BASE}/Services/{settings.twilio_verify_service_sid}/Verifications",
                headers={"Authorization": _auth()},
                data={"To": phone, "Channel": "sms"},
            )
    except httpx.RequestError:
        log.error("otp_provider_unreachable")
        raise AppError(503, "OTP_UNAVAILABLE", "OTP service is temporarily unavailable")
    if resp.status_code not in (200, 201):
        log.error("otp_send_failed", status=resp.status_code)
        raise AppError(502, "OTP_SEND_FAILED", "Could not send OTP")


async def check_otp(phone: str, code: str) -> bool:
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

    if not settings.twilio_verify_service_sid:
        raise AppError(503, "OTP_NOT_CONFIGURED", "OTP service is not configured — add TWILIO_VERIFY_SERVICE_SID to your .env")
    try:
        async with httpx.AsyncClient(timeout=10) as http:
            resp = await http.post(
                f"{_VERIFY_BASE}/Services/{settings.twilio_verify_service_sid}/VerificationCheck",
                headers={"Authorization": _auth()},
                data={"To": phone, "Code": code},
            )
    except httpx.RequestError:
        log.error("otp_provider_unreachable")
        raise AppError(503, "OTP_UNAVAILABLE", "OTP service is temporarily unavailable")
    if resp.status_code == 404:
        return False
    if resp.status_code not in (200, 201):
        log.error("otp_check_failed", status=resp.status_code)
        raise AppError(502, "OTP_CHECK_FAILED", "OTP verification failed")
    return resp.json().get("status") == "approved"
