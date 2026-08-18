from typing import Literal
from pydantic import BaseModel, field_validator, model_validator


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, v: list[ChatMessage]) -> list[ChatMessage]:
        if not v:
            raise ValueError("at least one message required")
        if v[-1].role != "user":
            raise ValueError("last message must be from user")
        return v


class BookingDraft(BaseModel):
    name: str
    style: str
    date: str
    time: str
    color: str
    price: float
    deposit: float
    notes: str = ""

    @field_validator("price", "deposit")
    @classmethod
    def non_negative(cls, value: float) -> float:
        if value < 0:
            raise ValueError("Price values cannot be negative")
        return round(value, 2)

    @model_validator(mode="after")
    def deposit_not_above_price(self) -> "BookingDraft":
        if self.deposit > self.price:
            raise ValueError("Deposit cannot exceed price")
        return self


class ConfirmBookingRequest(BaseModel):
    booking_id: str
    draft: BookingDraft
