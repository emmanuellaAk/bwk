import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.errors import AppError
from app.models.appointment import Appointment, AppointmentStatus
from app.models.client import Client
from app.models.nudge import NudgeState
from app.models.service import Service
from app.models.stock_item import StockItem
from app.models.user import User
from app.routers.appointments import send_reminder
from app.schemas.nudge import NudgeResponse

router = APIRouter(prefix="/nudges", tags=["nudges"])


async def _states(db: AsyncSession, salon_id) -> dict[str, NudgeState]:
    result = await db.execute(select(NudgeState).where(NudgeState.salon_id == salon_id))
    return {state.nudge_key: state for state in result.scalars().all()}


@router.get("", response_model=list[NudgeResponse])
async def list_nudges(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[NudgeResponse]:
    now = datetime.now(timezone.utc)
    tomorrow_start = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_end = tomorrow_start + timedelta(days=1)
    states = await _states(db, user.salon_id)
    nudges: list[NudgeResponse] = []

    appointments = (await db.execute(
        select(Appointment, Client.name.label("client_name"), Service.name.label("service_name"))
        .outerjoin(Client, Appointment.client_id == Client.id)
        .outerjoin(Service, Appointment.service_id == Service.id)
        .where(Appointment.salon_id == user.salon_id, Appointment.starts_at >= tomorrow_start, Appointment.starts_at < tomorrow_end, Appointment.status.in_([AppointmentStatus.pending, AppointmentStatus.confirmed]))
        .order_by(Appointment.starts_at.asc())
    )).all()
    for row in appointments:
        key = f"reminder:{row.Appointment.id}"
        state = states.get(key)
        if state and (state.dismissed or state.acted):
            continue
        time = row.Appointment.starts_at.strftime("%-I:%M %p")
        nudges.append(NudgeResponse(id=key, type="reminder", title="Appointment reminder due", body=f"{row.client_name or 'Client'}'s {row.service_name or 'appointment'} is tomorrow at {time}.", primary_label="Send reminder", accent="#6E1B3A", tint="#F6E7EC", done_text="Reminder sent ✓", dismissed=False, acted=False))

    stock = (await db.execute(select(StockItem).where(StockItem.salon_id == user.salon_id, StockItem.packs <= 2))).scalars().all()
    for item in stock:
        key = f"reorder:{item.id}"
        state = states.get(key)
        if state and (state.dismissed or state.acted):
            continue
        nudges.append(NudgeResponse(id=key, type="reorder", title=f"Low stock: {item.color} {item.length}", body=f"Only {item.packs} pack{'s' if item.packs != 1 else ''} left. Review your inventory and place a reorder.", primary_label="Review reorder", accent="#B5762A", tint="#FBEFDD", done_text="Reorder review noted ✓", dismissed=False, acted=False))
    return nudges


async def _get_state(nudge_id: str, user: User, db: AsyncSession) -> NudgeState:
    result = await db.execute(select(NudgeState).where(NudgeState.salon_id == user.salon_id, NudgeState.nudge_key == nudge_id))
    state = result.scalar_one_or_none()
    if state:
        return state
    if not (nudge_id.startswith("reminder:") or nudge_id.startswith("reorder:")):
        raise AppError(404, "NOT_FOUND", "Nudge not found")
    state = NudgeState(salon_id=user.salon_id, nudge_key=nudge_id)
    db.add(state)
    await db.flush()
    return state


@router.post("/{nudge_id}/dismiss", status_code=204)
async def dismiss_nudge(nudge_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    (await _get_state(nudge_id, user, db)).dismissed = True


@router.post("/{nudge_id}/act", status_code=204)
async def act_on_nudge(nudge_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    if nudge_id.startswith("reminder:"):
        try:
            appointment_id = uuid.UUID(nudge_id.split(":", 1)[1])
        except ValueError:
            raise AppError(404, "NOT_FOUND", "Nudge not found")
        await send_reminder(appointment_id, user, db)
    (await _get_state(nudge_id, user, db)).acted = True
