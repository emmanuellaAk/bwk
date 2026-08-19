import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.errors import AppError
from app.models.stock_item import StockItem
from app.models.stock_purchase import StockPurchase
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.inventory import (
    RestockRequest,
    StockItemCreate,
    StockItemResponse,
    StockItemUpdate,
    PurchaseHistoryResponse,
    compute_status,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])


def _to_response(item: StockItem) -> StockItemResponse:
    return StockItemResponse(
        id=item.id,
        color=item.color,
        length=item.length,
        packs=item.packs,
        max_packs=item.max_packs,
        price_per_pack=float(item.price_per_pack),
        status=compute_status(item.packs),
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


async def _get_or_404(item_id: uuid.UUID, user: User, db: AsyncSession) -> StockItem:
    result = await db.execute(
        select(StockItem).where(
            StockItem.id == item_id,
            StockItem.salon_id == user.salon_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise AppError(404, "NOT_FOUND", "Stock item not found")
    return item


@router.get("", response_model=list[StockItemResponse])
async def list_stock(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[StockItemResponse]:
    result = await db.execute(
        select(StockItem)
        .where(StockItem.salon_id == user.salon_id)
        .order_by(StockItem.color, StockItem.length)
    )
    return [_to_response(i) for i in result.scalars().all()]


@router.get("/purchases", response_model=list[PurchaseHistoryResponse])
async def list_purchases(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PurchaseHistoryResponse]:
    result = await db.execute(
        select(StockPurchase, StockItem.color, StockItem.length, Supplier.name.label("supplier_name"))
        .outerjoin(StockItem, StockPurchase.stock_item_id == StockItem.id)
        .outerjoin(Supplier, StockPurchase.supplier_id == Supplier.id)
        .where(StockPurchase.salon_id == user.salon_id)
        .order_by(StockPurchase.occurred_at.desc())
        .limit(20)
    )
    return [
        PurchaseHistoryResponse(
            id=row.StockPurchase.id,
            stock_item_id=row.StockPurchase.stock_item_id,
            color=row.color,
            length=row.length,
            supplier_name=row.supplier_name,
            quantity=row.StockPurchase.quantity,
            price_per_pack=float(row.StockPurchase.price_per_pack),
            total=row.StockPurchase.quantity * float(row.StockPurchase.price_per_pack),
            occurred_at=row.StockPurchase.occurred_at,
        )
        for row in result.all()
    ]


@router.post("", response_model=StockItemResponse, status_code=201)
async def create_stock_item(
    body: StockItemCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StockItemResponse:
    # Enforce uniqueness (color + length per salon)
    existing = await db.execute(
        select(StockItem).where(
            StockItem.salon_id == user.salon_id,
            StockItem.color == body.color,
            StockItem.length == body.length,
        )
    )
    if existing.scalar_one_or_none():
        raise AppError(409, "DUPLICATE", f"{body.color} {body.length} already exists")

    item = StockItem(
        salon_id=user.salon_id,
        color=body.color,
        length=body.length,
        packs=body.packs,
        max_packs=body.max_packs,
        price_per_pack=body.price_per_pack,
    )
    db.add(item)
    await db.flush()
    return _to_response(item)


@router.patch("/{item_id}", response_model=StockItemResponse)
async def update_stock_item(
    item_id: uuid.UUID,
    body: StockItemUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StockItemResponse:
    item = await _get_or_404(item_id, user, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    item.updated_at = datetime.now(timezone.utc)
    return _to_response(item)


@router.post("/{item_id}/restock", response_model=StockItemResponse)
async def restock_item(
    item_id: uuid.UUID,
    body: RestockRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StockItemResponse:
    item = await _get_or_404(item_id, user, db)
    if body.supplier_id:
        supplier = await db.get(Supplier, body.supplier_id)
        if not supplier or supplier.salon_id != user.salon_id:
            raise AppError(404, "NOT_FOUND", "Supplier not found")
    item.packs += body.quantity

    purchase = StockPurchase(
        salon_id=user.salon_id,
        supplier_id=body.supplier_id,
        stock_item_id=item.id,
        quantity=body.quantity,
        price_per_pack=body.price_per_pack if body.price_per_pack is not None else float(item.price_per_pack),
        occurred_at=datetime.now(timezone.utc),
    )
    db.add(purchase)
    await db.flush()
    return _to_response(item)


@router.delete("/{item_id}", status_code=204)
async def delete_stock_item(
    item_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    item = await _get_or_404(item_id, user, db)
    await db.delete(item)
