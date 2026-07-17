import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class SettingsUpdate(BaseModel):
    salon_name: Optional[str] = None
    owner_name: Optional[str] = None
    hours_open: Optional[str] = None   # "HH:MM"
    hours_close: Optional[str] = None  # "HH:MM"
    default_deposit_pct: Optional[int] = None

    @field_validator("salon_name")
    @classmethod
    def validate_salon_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Salon name cannot be empty")
        return v

    @field_validator("default_deposit_pct")
    @classmethod
    def validate_deposit(cls, v: int | None) -> int | None:
        if v is not None and not (0 <= v <= 100):
            raise ValueError("deposit_pct must be between 0 and 100")
        return v


class SettingsResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    salon_name: str
    owner_name: str | None
    hours_open: str | None
    hours_close: str | None
    default_deposit_pct: int
    updated_at: datetime
