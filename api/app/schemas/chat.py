from typing import Literal
from pydantic import BaseModel, field_validator


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
