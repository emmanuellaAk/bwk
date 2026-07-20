import re
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator

_E164 = re.compile(r"^\+\d{10,15}$")


def _normalise_phone(v: str | None) -> str | None:
    if not v:
        return None
    v = v.strip().replace(" ", "").replace("-", "")
    if v.startswith("0") and len(v) == 10:
        v = f"+233{v[1:]}"
    if not _E164.match(v):
        raise ValueError("Phone must be in E.164 format, e.g. +233271234567 or a local 10-digit number starting with 0")
    return v


class ClientCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    notes: Optional[str] = None
    color_hex: str = "#6E1B3A"

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        return _normalise_phone(v)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("color_hex")
    @classmethod
    def validate_color(cls, v: str) -> str:
        if not re.match(r"^#[0-9a-fA-F]{6}$", v):
            raise ValueError("color_hex must be a valid hex colour e.g. #6E1B3A")
        return v


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    color_hex: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        return _normalise_phone(v)

    @field_validator("color_hex")
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v and not re.match(r"^#[0-9a-fA-F]{6}$", v):
            raise ValueError("color_hex must be a valid hex colour e.g. #6E1B3A")
        return v


class ClientResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    salon_id: uuid.UUID
    name: str
    phone: Optional[str]
    notes: Optional[str]
    color_hex: str
    created_at: datetime
    updated_at: datetime


class ClientPage(BaseModel):
    items: list[ClientResponse]
    next_cursor: Optional[str]
