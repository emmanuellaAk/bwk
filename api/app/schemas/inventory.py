import uuid
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, field_validator


StockStatus = Literal["low", "ok", "good"]


def compute_status(packs: int) -> StockStatus:
    if packs <= 2:
        return "low"
    if packs <= 6:
        return "ok"
    return "good"


class StockItemCreate(BaseModel):
    color: str
    length: str
    packs: int = 0
    max_packs: int = 20
    price_per_pack: float

    @field_validator("color", "length")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Cannot be empty")
        return v

    @field_validator("price_per_pack")
    @classmethod
    def non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Cannot be negative")
        return round(v, 2)

    @field_validator("packs", "max_packs")
    @classmethod
    def non_negative_int(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Cannot be negative")
        return v


class StockItemUpdate(BaseModel):
    packs: Optional[int] = None
    max_packs: Optional[int] = None
    price_per_pack: Optional[float] = None


class RestockRequest(BaseModel):
    quantity: int
    supplier_id: Optional[uuid.UUID] = None
    price_per_pack: Optional[float] = None  # overrides item's price if provided

    @field_validator("quantity")
    @classmethod
    def positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be positive")
        return v


class StockItemResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    color: str
    length: str
    packs: int
    max_packs: int
    price_per_pack: float
    status: StockStatus
    created_at: datetime
    updated_at: datetime
