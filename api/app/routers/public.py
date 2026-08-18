from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.errors import AppError
from app.models.appointment import Appointment, AppointmentStatus
from app.models.client import Client
from app.models.salon import Salon
from app.models.service import Service
from app.routers.appointments import _check_overlap
from app.schemas.public import PublicBookingRequest, PublicBookingResponse

router = APIRouter(prefix="/public", tags=["public"])

_TIME_FMTS = ["%I:%M %p", "%I %p"]


def _parse_starts_at(date_str: str, time_str: str) -> datetime:
    for fmt in _TIME_FMTS:
        try:
            naive = datetime.strptime(f"{date_str} {time_str.upper()}", f"%Y-%m-%d {fmt}")
            return naive.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    raise AppError(422, "INVALID_DATETIME", f"Cannot parse time: {time_str!r}")


@router.post("/bookings", response_model=PublicBookingResponse, status_code=201)
async def create_public_booking(
    body: PublicBookingRequest,
    db: AsyncSession = Depends(get_db),
) -> PublicBookingResponse:
    # Verify salon exists
    salon = await db.get(Salon, body.salon_id)
    if not salon:
        raise AppError(404, "NOT_FOUND", "Salon not found")

    # Find or create client by phone within this salon
    result = await db.execute(
        select(Client).where(
            Client.salon_id == body.salon_id,
            Client.phone == body.client_phone,
            Client.deleted_at.is_(None),
        )
    )
    client = result.scalar_one_or_none()
    if not client:
        client = Client(
            salon_id=body.salon_id,
            name=body.client_name,
            phone=body.client_phone,
            color_hex=body.color_hex,
        )
        db.add(client)
        await db.flush()

    # Try to find matching service by name in this salon
    svc_result = await db.execute(
        select(Service).where(
            Service.salon_id == body.salon_id,
            Service.name == body.service_name,
            Service.deleted_at.is_(None),
        )
    )
    service = svc_result.scalar_one_or_none()
    service_id = service.id if service else None
    service_name = service.name if service else body.service_name

    starts_at = _parse_starts_at(body.date, body.time)
    duration_minutes = service.duration_minutes if service else 180
    ends_at = starts_at + timedelta(minutes=duration_minutes)

    if salon.hours_open and salon.hours_close:
        try:
            opening = datetime.strptime(salon.hours_open, "%H:%M").time()
            closing = datetime.strptime(salon.hours_close, "%H:%M").time()
        except ValueError:
            raise AppError(500, "INVALID_SALON_HOURS", "Salon hours are misconfigured")
        if starts_at.time() < opening or ends_at.time() > closing:
            raise AppError(409, "OUTSIDE_SALON_HOURS", "This appointment is outside salon hours")

    await _check_overlap(db, body.salon_id, starts_at, ends_at)

    appt = Appointment(
        salon_id=body.salon_id,
        client_id=client.id,
        service_id=service_id,
        starts_at=starts_at,
        ends_at=ends_at,
        status=AppointmentStatus.pending,
        color_hex=body.color_hex,
        notes=body.service_name if not service_id else None,
        # The public flow has no payment provider yet, so never mark money as paid.
        deposit_paid=0,
        total_price=body.total_price,
    )
    db.add(appt)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise AppError(409, "TIME_SLOT_TAKEN", "This time slot was just booked by someone else")

    return PublicBookingResponse(
        id=appt.id,
        status=appt.status,
        client_name=client.name,
        service_name=service_name,
        starts_at=starts_at,
    )
