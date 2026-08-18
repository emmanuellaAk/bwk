import re
from typing import Literal, Optional

from pydantic import BaseModel, field_validator

_E164 = re.compile(r"^\+\d{10,15}$")


def _normalise_phone(v: str) -> str:
    v = v.strip().replace(" ", "").replace("-", "")
    if v.startswith("0") and len(v) == 10:
        v = f"+233{v[1:]}"
    if not _E164.match(v):
        raise ValueError("Phone must be in E.164 format, e.g. +233271234567 or a local 10-digit number starting with 0")
    return v


def _phone_validator(cls: object, v: str) -> str:  # noqa: ARG001
    return _normalise_phone(v)


class RegisterRequest(BaseModel):
    phone: str
    password: str
    salon_name: str
    email: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _normalise_phone(v)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("salon_name")
    @classmethod
    def validate_salon_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Salon name cannot be empty")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v:
            v = v.strip().lower()
            if "@" not in v or "." not in v.split("@")[-1]:
                raise ValueError("Enter a valid email address")
        return v or None


class LoginRequest(BaseModel):
    phone: str
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _normalise_phone(v)


class SendOtpRequest(BaseModel):
    phone: str
    purpose: Literal["verify", "reset"] = "verify"

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _normalise_phone(v)


class VerifyPhoneRequest(BaseModel):
    phone: str
    code: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _normalise_phone(v)


class ResetPasswordRequest(BaseModel):
    phone: str
    code: str
    new_password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _normalise_phone(v)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_phone_verified: bool = True
