import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.errors import AppError
from app.lib.pagination import Page, decode_cursor, encode_cursor
from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientCreate, ClientPage, ClientResponse, ClientUpdate

router = APIRouter(prefix="/clients", tags=["clients"])


async def _get_or_404(client_id: uuid.UUID, user: User, db: AsyncSession) -> Client:
    """Fetch a client that belongs to this salon — 404 if missing or wrong salon."""
    result = await db.execute(
        select(Client).where(
            Client.id == client_id,
            Client.salon_id == user.salon_id,  # ownership check
            Client.deleted_at.is_(None),
        )
    )
    client = result.scalar_one_or_none()
    if not client:
        raise AppError(404, "NOT_FOUND", "Client not found")
    return client


@router.get("", response_model=ClientPage)
async def list_clients(
    search: Optional[str] = Query(None, description="Search by name or phone"),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ClientPage:
    conditions = [
        Client.salon_id == user.salon_id,
        Client.deleted_at.is_(None),
    ]

    if search:
        term = f"%{search.strip()}%"
        conditions.append(or_(Client.name.ilike(term), Client.phone.ilike(term)))

    if cursor:
        after_ts, after_id = decode_cursor(cursor)
        conditions.append(
            or_(
                Client.created_at > after_ts,
                and_(Client.created_at == after_ts, Client.id > after_id),
            )
        )

    result = await db.execute(
        select(Client)
        .where(*conditions)
        .order_by(Client.created_at.asc(), Client.id.asc())
        .limit(limit + 1)  # fetch one extra to know if there's a next page
    )
    rows = list(result.scalars())

    has_more = len(rows) > limit
    items = rows[:limit]
    next_cursor = encode_cursor(items[-1].created_at, items[-1].id) if has_more else None

    return ClientPage(
        items=[ClientResponse.model_validate(c) for c in items],
        next_cursor=next_cursor,
    )


@router.post("", response_model=ClientResponse, status_code=201)
async def create_client(
    body: ClientCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ClientResponse:
    client = Client(
        salon_id=user.salon_id,
        name=body.name,
        phone=body.phone,
        notes=body.notes,
        color_hex=body.color_hex,
    )
    db.add(client)
    await db.flush()
    return ClientResponse.model_validate(client)


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ClientResponse:
    client = await _get_or_404(client_id, user, db)
    return ClientResponse.model_validate(client)


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: uuid.UUID,
    body: ClientUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ClientResponse:
    client = await _get_or_404(client_id, user, db)

    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(client, field, value)
    client.updated_at = datetime.now(timezone.utc)

    return ClientResponse.model_validate(client)


@router.delete("/{client_id}", status_code=204)
async def delete_client(
    client_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    client = await _get_or_404(client_id, user, db)
    client.deleted_at = datetime.now(timezone.utc)  # soft delete
