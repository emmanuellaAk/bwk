import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator, model_validator
from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    client_id: uuid.UUID
    service_id: Optional[uuid.UUID] = None
    starts_at: datetime
    ends_at: datetime
    color_hex: str = "#6E1B3A"
    notes: Optional[str] = None
    deposit_paid: float = 0
    total_price: float

    @model_validator(mode="after")
    def ends_after_starts(self) -> "AppointmentCreate":
        if self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be after starts_at")
        return self

    @field_validator("total_price", "deposit_paid")
    @classmethod
    def non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Price values cannot be negative")
        return round(v, 2)


class AppointmentUpdate(BaseModel):
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    color_hex: Optional[str] = None
    notes: Optional[str] = None
    deposit_paid: Optional[float] = None
    total_price: Optional[float] = None

    @model_validator(mode="after")
    def ends_after_starts(self) -> "AppointmentUpdate":
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be after starts_at")
        return self


class StatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    salon_id: uuid.UUID
    client_id: uuid.UUID
    service_id: Optional[uuid.UUID]
    starts_at: datetime
    ends_at: datetime
    status: AppointmentStatus
    color_hex: str
    notes: Optional[str]
    deposit_paid: float
    total_price: float
    # Eagerly joined — avoids N+1 on list views
    client_name: Optional[str] = None
    service_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
