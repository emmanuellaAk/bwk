import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from app.models.transaction import TransactionKind


class FinanceSummary(BaseModel):
    period: str
    revenue: float
    expenses: float
    profit: float


class MonthlyPoint(BaseModel):
    month: str   # "Jan", "Feb", …
    year: int
    revenue: float


class TopService(BaseModel):
    service_name: str
    bookings: int
    revenue: float


class TransactionCreate(BaseModel):
    kind: TransactionKind
    amount: float
    description: str
    appointment_id: Optional[uuid.UUID] = None
    occurred_at: datetime

    @field_validator("amount")
    @classmethod
    def positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be positive")
        return round(v, 2)


class TransactionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    kind: TransactionKind
    amount: float
    description: str
    appointment_id: Optional[uuid.UUID]
    occurred_at: datetime
    created_at: datetime


class OutstandingRecord(BaseModel):
    appointment_id: uuid.UUID
    client_name: Optional[str]
    service_name: Optional[str]
    total_price: float
    deposit_paid: float
    balance_due: float
    starts_at: datetime
