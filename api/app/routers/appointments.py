import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.errors import AppError
from app.models.appointment import Appointment, AppointmentStatus
from app.models.client import Client
from app.models.service import Service
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    StatusUpdate,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])

# Valid status transitions — anything not listed is rejected
_TRANSITIONS: dict[AppointmentStatus, set[AppointmentStatus]] = {
    AppointmentStatus.pending:   {AppointmentStatus.confirmed, AppointmentStatus.cancelled},
    AppointmentStatus.confirmed: {AppointmentStatus.completed, AppointmentStatus.cancelled},
    AppointmentStatus.completed: set(),
    AppointmentStatus.cancelled: set(),
}


async def _get_or_404(appt_id: uuid.UUID, user: User, db: AsyncSession) -> Appointment:
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appt_id,
            Appointment.salon_id == user.salon_id,
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise AppError(404, "NOT_FOUND", "Appointment not found")
    return appt


async def _check_overlap(
    db: AsyncSession,
    salon_id: uuid.UUID,
    starts_at: datetime,
    ends_at: datetime,
    exclude_id: Optional[uuid.UUID] = None,
) -> None:
    """Reject if the time window overlaps any non-cancelled appointment for this salon."""
    conditions = [
        Appointment.salon_id == salon_id,
        Appointment.status != AppointmentStatus.cancelled,
        Appointment.starts_at < ends_at,   # existing starts before new one ends
        Appointment.ends_at > starts_at,   # existing ends after new one starts
    ]
    if exclude_id:
        conditions.append(Appointment.id != exclude_id)

    result = await db.execute(
        select(func.count()).select_from(Appointment).where(*conditions)
    )
    if (result.scalar() or 0) > 0:
        raise AppError(409, "TIME_SLOT_TAKEN", "This time slot overlaps with an existing appointment")


def _build_response(appt: Appointment, client_name: Optional[str], service_name: Optional[str]) -> AppointmentResponse:
    return AppointmentResponse(
        id=appt.id,
        salon_id=appt.salon_id,
        client_id=appt.client_id,
        service_id=appt.service_id,
        starts_at=appt.starts_at,
        ends_at=appt.ends_at,
        status=appt.status,
        color_hex=appt.color_hex,
        notes=appt.notes,
        deposit_paid=float(appt.deposit_paid),
        total_price=float(appt.total_price),
        client_name=client_name,
        service_name=service_name,
        created_at=appt.created_at,
        updated_at=appt.updated_at,
    )


@router.get("", response_model=list[AppointmentResponse])
async def list_appointments(
    from_dt: datetime = Query(..., alias="from", description="Range start (ISO 8601)"),
    to_dt:   datetime = Query(..., alias="to",   description="Range end   (ISO 8601)"),
    status:  Optional[AppointmentStatus] = Query(None, description="Filter by status"),
    user: User = Depends(get_current_user),
    db:   AsyncSession = Depends(get_db),
) -> list[AppointmentResponse]:
    conditions = [
        Appointment.salon_id == user.salon_id,
        Appointment.starts_at >= from_dt,
        Appointment.starts_at <  to_dt,
    ]
    if status:
        conditions.append(Appointment.status == status)

    result = await db.execute(
        select(
            Appointment,
            Client.name.label("client_name"),
            Service.name.label("service_name"),
        )
        .outerjoin(Client,  Appointment.client_id  == Client.id)
        .outerjoin(Service, Appointment.service_id == Service.id)
        .where(*conditions)
        .order_by(Appointment.starts_at.asc())
    )
    return [_build_response(row.Appointment, row.client_name, row.service_name) for row in result.all()]


@router.post("", response_model=AppointmentResponse, status_code=201)
async def create_appointment(
    body: AppointmentCreate,
    user: User = Depends(get_current_user),
    db:   AsyncSession = Depends(get_db),
) -> AppointmentResponse:
    # Verify client belongs to this salon
    client_result = await db.execute(
        select(Client.name).where(Client.id == body.client_id, Client.salon_id == user.salon_id, Client.deleted_at.is_(None))
    )
    client_name = client_result.scalar_one_or_none()
    if client_name is None:
        raise AppError(404, "NOT_FOUND", "Client not found")

    # Verify service if provided
    service_name: Optional[str] = None
    if body.service_id:
        svc_result = await db.execute(
            select(Service.name).where(Service.id == body.service_id, Service.salon_id == user.salon_id, Service.deleted_at.is_(None))
        )
        service_name = svc_result.scalar_one_or_none()
        if service_name is None:
            raise AppError(404, "NOT_FOUND", "Service not found")

    await _check_overlap(db, user.salon_id, body.starts_at, body.ends_at)

    appt = Appointment(
        salon_id=user.salon_id,
        client_id=body.client_id,
        service_id=body.service_id,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        status=AppointmentStatus.pending,
        color_hex=body.color_hex,
        notes=body.notes,
        deposit_paid=body.deposit_paid,
        total_price=body.total_price,
    )
    db.add(appt)
    await db.flush()
    return _build_response(appt, client_name, service_name)


@router.get("/{appt_id}", response_model=AppointmentResponse)
async def get_appointment(
    appt_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db:   AsyncSession = Depends(get_db),
) -> AppointmentResponse:
    result = await db.execute(
        select(
            Appointment,
            Client.name.label("client_name"),
            Service.name.label("service_name"),
        )
        .outerjoin(Client,  Appointment.client_id  == Client.id)
        .outerjoin(Service, Appointment.service_id == Service.id)
        .where(Appointment.id == appt_id, Appointment.salon_id == user.salon_id)
    )
    row = result.first()
    if not row:
        raise AppError(404, "NOT_FOUND", "Appointment not found")
    return _build_response(row.Appointment, row.client_name, row.service_name)


@router.patch("/{appt_id}", response_model=AppointmentResponse)
async def update_appointment(
    appt_id: uuid.UUID,
    body: AppointmentUpdate,
    user: User = Depends(get_current_user),
    db:   AsyncSession = Depends(get_db),
) -> AppointmentResponse:
    appt = await _get_or_404(appt_id, user, db)

    new_starts = body.starts_at or appt.starts_at
    new_ends   = body.ends_at   or appt.ends_at

    if body.starts_at or body.ends_at:
        await _check_overlap(db, user.salon_id, new_starts, new_ends, exclude_id=appt_id)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(appt, field, value)

    # Refetch names for response
    client_result = await db.execute(select(Client.name).where(Client.id == appt.client_id))
    client_name = client_result.scalar_one_or_none()
    service_name: Optional[str] = None
    if appt.service_id:
        svc_result = await db.execute(select(Service.name).where(Service.id == appt.service_id))
        service_name = svc_result.scalar_one_or_none()

    return _build_response(appt, client_name, service_name)


@router.patch("/{appt_id}/status", response_model=AppointmentResponse)
async def update_status(
    appt_id: uuid.UUID,
    body: StatusUpdate,
    user: User = Depends(get_current_user),
    db:   AsyncSession = Depends(get_db),
) -> AppointmentResponse:
    appt = await _get_or_404(appt_id, user, db)

    allowed = _TRANSITIONS[appt.status]
    if body.status not in allowed:
        raise AppError(
            422, "INVALID_TRANSITION",
            f"Cannot transition from '{appt.status}' to '{body.status}'. "
            f"Allowed: {[s.value for s in allowed] or 'none (terminal state)'}",
        )

    appt.status = body.status

    client_result = await db.execute(select(Client.name).where(Client.id == appt.client_id))
    client_name = client_result.scalar_one_or_none()
    service_name: Optional[str] = None
    if appt.service_id:
        svc_result = await db.execute(select(Service.name).where(Service.id == appt.service_id))
        service_name = svc_result.scalar_one_or_none()

    return _build_response(appt, client_name, service_name)


@router.delete("/{appt_id}", status_code=204)
async def cancel_appointment(
    appt_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db:   AsyncSession = Depends(get_db),
) -> None:
    appt = await _get_or_404(appt_id, user, db)
    if appt.status == AppointmentStatus.completed:
        raise AppError(422, "ALREADY_COMPLETED", "Cannot cancel a completed appointment")
    appt.status = AppointmentStatus.cancelled
    appt.updated_at = datetime.now(timezone.utc)
