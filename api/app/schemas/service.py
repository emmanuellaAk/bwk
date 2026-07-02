import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class ServiceCreate(BaseModel):
    name: str
    duration_minutes: int
    price: float
    deposit_pct: int = 30

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("duration_minutes")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Duration must be greater than 0")
        return v

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Price cannot be negative")
        return round(v, 2)

    @field_validator("deposit_pct")
    @classmethod
    def validate_deposit(cls, v: int) -> int:
        if not (0 <= v <= 100):
            raise ValueError("deposit_pct must be between 0 and 100")
        return v


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    deposit_pct: Optional[int] = None

    @field_validator("duration_minutes")
    @classmethod
    def validate_duration(cls, v: int | None) -> int | None:
        if v is not None and v <= 0:
            raise ValueError("Duration must be greater than 0")
        return v

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: float | None) -> float | None:
        if v is not None:
            if v < 0:
                raise ValueError("Price cannot be negative")
            return round(v, 2)
        return v

    @field_validator("deposit_pct")
    @classmethod
    def validate_deposit(cls, v: int | None) -> int | None:
        if v is not None and not (0 <= v <= 100):
            raise ValueError("deposit_pct must be between 0 and 100")
        return v


class ServiceResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    salon_id: uuid.UUID
    name: str
    duration_minutes: int
    price: float
    deposit_pct: int
    created_at: datetime
    updated_at: datetime
