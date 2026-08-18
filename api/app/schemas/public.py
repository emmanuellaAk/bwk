import uuid
from pydantic import BaseModel, field_validator, model_validator
from app.models.appointment import AppointmentStatus
from datetime import datetime


class PublicBookingRequest(BaseModel):
    salon_id: uuid.UUID
    client_name: str
    client_phone: str
    service_name: str
    date: str        # "YYYY-MM-DD"
    time: str        # "9:00 AM"
    color_hex: str = "#6E1B3A"
    total_price: float
    deposit: float

    @field_validator("client_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v

    @field_validator("client_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 6:
            raise ValueError("Phone number is too short")
        return v

    @field_validator("total_price", "deposit")
    @classmethod
    def non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Price values cannot be negative")
        return round(v, 2)

    @model_validator(mode="after")
    def deposit_not_above_total(self) -> "PublicBookingRequest":
        if self.deposit > self.total_price:
            raise ValueError("Deposit cannot exceed total price")
        return self


class PublicBookingResponse(BaseModel):
    id: uuid.UUID
    status: AppointmentStatus
    client_name: str
    service_name: str
    starts_at: datetime
    message: str = "Booking request received. No payment has been charged. Kez will confirm the deposit details shortly."
