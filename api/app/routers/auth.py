from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.errors import AppError
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


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    tokens = await AuthService(db).register(body)
    _set_refresh_cookie(response, tokens.refresh_token)
    return TokenResponse(
        access_token=tokens.access_token,
        is_phone_verified=tokens.is_phone_verified,
    )


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
        if not result.scalar_one_or_none():
            return  # don't reveal whether number exists
    await otp_service.send_otp(db, body.phone)


@router.post("/verify-phone", status_code=204)
async def verify_phone(
    body: VerifyPhoneRequest,
    db: AsyncSession = Depends(get_db),
) -> None:
    approved, attempts_remaining = await otp_service.check_otp(db, body.phone, body.code)
    if not approved:
        details = {"attempts_remaining": attempts_remaining} if attempts_remaining is not None else None
        raise AppError(400, "INVALID_OTP", "Code is incorrect or has expired — request a new one", details)
    await AuthService(db).mark_phone_verified(body.phone)


@router.post("/reset-password", status_code=204)
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> None:
    approved, attempts_remaining = await otp_service.check_otp(db, body.phone, body.code)
    if not approved:
        details = {"attempts_remaining": attempts_remaining} if attempts_remaining is not None else None
        raise AppError(400, "INVALID_OTP", "Code is incorrect or has expired — request a new one", details)
    await AuthService(db).reset_password(body.phone, body.new_password)
