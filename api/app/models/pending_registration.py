import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class PendingRegistration(Base):
    """A signup that hasn't completed phone verification yet.

    Registration data lives here — not in `users` — until the OTP is
    confirmed. This means a mistyped phone number, an abandoned signup, or
    a code that never arrives costs nothing: there's no real account to
    clean up, and resubmitting the form with a corrected number just
    overwrites this row.
    """

    __tablename__ = "pending_registrations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    salon_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    zend_otp_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
