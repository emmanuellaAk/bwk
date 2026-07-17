import uuid
from datetime import datetime
from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Salon(Base):
    __tablename__ = "salons"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    owner_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    hours_open: Mapped[str | None] = mapped_column(String(5), nullable=True)
    hours_close: Mapped[str | None] = mapped_column(String(5), nullable=True)
    default_deposit_pct: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="30"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
