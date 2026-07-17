from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.errors import AppError
from app.models.salon import Salon
from app.models.user import User
from app.schemas.settings import SettingsResponse, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


async def _get_salon(user: User, db: AsyncSession) -> Salon:
    result = await db.execute(select(Salon).where(Salon.id == user.salon_id))
    salon = result.scalar_one_or_none()
    if not salon:
        raise AppError(404, "NOT_FOUND", "Salon not found")
    return salon


def _to_response(salon: Salon) -> SettingsResponse:
    return SettingsResponse(
        id=salon.id,
        salon_name=salon.name,
        owner_name=salon.owner_name,
        hours_open=salon.hours_open,
        hours_close=salon.hours_close,
        default_deposit_pct=salon.default_deposit_pct,
        updated_at=salon.updated_at,
    )


@router.get("", response_model=SettingsResponse)
async def get_settings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SettingsResponse:
    salon = await _get_salon(user, db)
    return _to_response(salon)


@router.patch("", response_model=SettingsResponse)
async def update_settings(
    body: SettingsUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SettingsResponse:
    salon = await _get_salon(user, db)

    if body.salon_name is not None:
        salon.name = body.salon_name
    if body.owner_name is not None:
        salon.owner_name = body.owner_name or None  # empty string → null
    if body.hours_open is not None:
        salon.hours_open = body.hours_open
    if body.hours_close is not None:
        salon.hours_close = body.hours_close
    if body.default_deposit_pct is not None:
        salon.default_deposit_pct = body.default_deposit_pct

    await db.flush()
    return _to_response(salon)
