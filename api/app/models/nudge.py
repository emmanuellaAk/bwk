import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class NudgeState(Base):
    __tablename__ = "nudge_states"
    __table_args__ = (UniqueConstraint("salon_id", "nudge_key", name="uq_nudge_salon_key"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    salon_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("salons.id", ondelete="CASCADE"), nullable=False, index=True)
    nudge_key: Mapped[str] = mapped_column(String(255), nullable=False)
    dismissed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    acted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
