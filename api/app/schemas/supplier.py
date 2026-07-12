import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class SupplierCreate(BaseModel):
    name: str
    location: Optional[str] = None
    contact_phone: Optional[str] = None

    @field_validator("name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v


class PurchaseLineCreate(BaseModel):
    stock_item_id: uuid.UUID
    quantity: int
    price_per_pack: float

    @field_validator("quantity")
    @classmethod
    def positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be positive")
        return v

    @field_validator("price_per_pack")
    @classmethod
    def non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Cannot be negative")
        return round(v, 2)


class OrderCreate(BaseModel):
    items: list[PurchaseLineCreate]
    occurred_at: Optional[datetime] = None  # defaults to now

    @field_validator("items")
    @classmethod
    def non_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("Order must have at least one item")
        return v


class PurchaseLineResponse(BaseModel):
    id: uuid.UUID
    stock_item_id: Optional[uuid.UUID]
    color: Optional[str]
    length: Optional[str]
    quantity: int
    price_per_pack: float
    total: float
    occurred_at: datetime


class SupplierSummary(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    location: Optional[str]
    contact_phone: Optional[str]
    total_spent: float
    order_count: int
    last_order_at: Optional[datetime]
    created_at: datetime


class SupplierDetail(SupplierSummary):
    purchases: list[PurchaseLineResponse]
