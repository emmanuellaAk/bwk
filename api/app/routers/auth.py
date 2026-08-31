from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.errors import AppError
from app.models.pending_registration import PendingRegistration
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    SendOtpRequest,
    TokenResponse,
    VerifyPhoneRequest,
)
from app.services import otp as otp_service
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

_COOKIE_KEY = "refresh_token"
_COOKIE_PATH = "/v1/auth"
_COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 days


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_COOKIE_KEY,
        value=token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=_COOKIE_MAX_AGE,
        path=_COOKIE_PATH,
    )


def _invalid_otp_error(attempts_remaining: int | None) -> AppError:
    details = {"attempts_remaining": attempts_remaining} if attempts_remaining is not None else None
    return AppError(400, "INVALID_OTP", "Code is incorrect or has expired — request a new one", details)


@router.post("/register", status_code=204)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> None:
    # No account exists yet — this only stages the signup. The real user +
    # salon are created in verify-phone, once the code is confirmed.
    await AuthService(db).start_registration(body)


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    tokens = await AuthService(db).login(body.phone, body.password)
    _set_refresh_cookie(response, tokens.refresh_token)
    return TokenResponse(
        access_token=tokens.access_token,
        is_phone_verified=tokens.is_phone_verified,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    raw_token = request.cookies.get(_COOKIE_KEY)
    if not raw_token:
        raise AppError(401, "NO_REFRESH_TOKEN", "No refresh token provided")
    tokens = await AuthService(db).rotate_refresh_token(raw_token)
    _set_refresh_cookie(response, tokens.refresh_token)
    return TokenResponse(
        access_token=tokens.access_token,
        is_phone_verified=tokens.is_phone_verified,
    )


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> None:
    raw_token = request.cookies.get(_COOKIE_KEY)
    if raw_token:
        await AuthService(db).revoke_refresh_token(raw_token)
    response.delete_cookie(_COOKIE_KEY, path=_COOKIE_PATH)


@router.post("/send-otp", status_code=204)
async def send_otp(
    body: SendOtpRequest,
    db: AsyncSession = Depends(get_db),
) -> None:
    if body.purpose == "reset":
        result = await db.execute(select(User).where(User.phone == body.phone))
        holder = result.scalar_one_or_none()
        if not holder:
            return  # don't reveal whether number exists
    else:
        # verify purpose: either an existing-but-unverified user (legacy accounts
        # created before the pending-registration flow) or a fresh signup.
        result = await db.execute(select(User).where(User.phone == body.phone))
        holder = result.scalar_one_or_none()
        if not holder:
            pending_result = await db.execute(select(PendingRegistration).where(PendingRegistration.phone == body.phone))
            holder = pending_result.scalar_one_or_none()
        if not holder:
            return  # nothing pending for this number — no-op, same privacy stance as reset
    await otp_service.send_otp(body.phone, holder)


@router.post("/verify-phone", response_model=TokenResponse, status_code=201)
async def verify_phone(
    body: VerifyPhoneRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    auth = AuthService(db)

    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()
    if user:
        approved, attempts_remaining = await otp_service.check_otp(body.phone, body.code, user)
        if not approved:
            raise _invalid_otp_error(attempts_remaining)
        tokens = await auth.mark_phone_verified(body.phone)
    else:
        pending_result = await db.execute(select(PendingRegistration).where(PendingRegistration.phone == body.phone))
        pending = pending_result.scalar_one_or_none()
        if not pending:
            raise _invalid_otp_error(None)
        approved, attempts_remaining = await otp_service.check_otp(body.phone, body.code, pending)
        if not approved:
            raise _invalid_otp_error(attempts_remaining)
        tokens = await auth.finish_registration(pending)

    _set_refresh_cookie(response, tokens.refresh_token)
    return TokenResponse(
        access_token=tokens.access_token,
        is_phone_verified=tokens.is_phone_verified,
    )


@router.post("/reset-password", status_code=204)
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()
    approved, attempts_remaining = await otp_service.check_otp(body.phone, body.code, user)
    if not approved:
        raise _invalid_otp_error(attempts_remaining)
    await AuthService(db).reset_password(body.phone, body.new_password)
