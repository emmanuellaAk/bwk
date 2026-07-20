import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.errors import AppError
from app.models.service import Service
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate

router = APIRouter(prefix="/services", tags=["services"])


async def _get_or_404(service_id: uuid.UUID, user: User, db: AsyncSession) -> Service:
    result = await db.execute(
        select(Service).where(
            Service.id == service_id,
            Service.salon_id == user.salon_id,  # ownership check
            Service.deleted_at.is_(None),
        )
    )
    service = result.scalar_one_or_none()
    if not service:
        raise AppError(404, "NOT_FOUND", "Service not found")
    return service


@router.get("", response_model=list[ServiceResponse])
async def list_services(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ServiceResponse]:
    result = await db.execute(
        select(Service)
        .where(Service.salon_id == user.salon_id, Service.deleted_at.is_(None))
        .order_by(Service.name.asc())
    )
    return [ServiceResponse.model_validate(s) for s in result.scalars()]


@router.post("", response_model=ServiceResponse, status_code=201)
async def create_service(
    body: ServiceCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ServiceResponse:
    service = Service(
        salon_id=user.salon_id,
        name=body.name,
        duration_minutes=body.duration_minutes,
        price=body.price,
        deposit_pct=body.deposit_pct,
    )
    db.add(service)
    await db.flush()
    return ServiceResponse.model_validate(service)


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ServiceResponse:
    service = await _get_or_404(service_id, user, db)
    return ServiceResponse.model_validate(service)


@router.patch("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: uuid.UUID,
    body: ServiceUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ServiceResponse:
    service = await _get_or_404(service_id, user, db)

    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(service, field, value)
    service.updated_at = datetime.now(timezone.utc)

    return ServiceResponse.model_validate(service)


@router.delete("/{service_id}", status_code=204)
async def delete_service(
    service_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    service = await _get_or_404(service_id, user, db)
    service.deleted_at = datetime.now(timezone.utc)
