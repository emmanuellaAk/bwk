import re
from pydantic import BaseModel, field_validator

_E164 = re.compile(r"^\+\d{10,15}$")


def _normalise_phone(v: str) -> str:
    """Strip spaces/dashes and validate E.164 format (+233271234567)."""
    v = v.strip().replace(" ", "").replace("-", "")
    if not _E164.match(v):
        raise ValueError("Phone must be in E.164 format, e.g. +233271234567")
    return v


class RegisterRequest(BaseModel):
    phone: str
    password: str
    salon_name: str

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


class LoginRequest(BaseModel):
    phone: str
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _normalise_phone(v)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
