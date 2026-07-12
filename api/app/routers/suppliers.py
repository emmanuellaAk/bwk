import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.errors import AppError
from app.models.stock_item import StockItem
from app.models.stock_purchase import StockPurchase
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.supplier import (
    OrderCreate,
    PurchaseLineResponse,
    SupplierCreate,
    SupplierDetail,
    SupplierSummary,
)

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


async def _summary(sup: Supplier, db: AsyncSession) -> SupplierSummary:
    agg = await db.execute(
        select(
            func.coalesce(func.sum(StockPurchase.quantity * StockPurchase.price_per_pack), 0).label("total_spent"),
            func.count(StockPurchase.id).label("order_count"),
            func.max(StockPurchase.occurred_at).label("last_order_at"),
        ).where(StockPurchase.supplier_id == sup.id)
    )
    row = agg.one()
    return SupplierSummary(
        id=sup.id,
        name=sup.name,
        location=sup.location,
        contact_phone=sup.contact_phone,
        total_spent=float(row.total_spent),
        order_count=row.order_count,
        last_order_at=row.last_order_at,
        created_at=sup.created_at,
    )


async def _get_or_404(supplier_id: uuid.UUID, user: User, db: AsyncSession) -> Supplier:
    result = await db.execute(
        select(Supplier).where(
            Supplier.id == supplier_id,
            Supplier.salon_id == user.salon_id,
        )
    )
    sup = result.scalar_one_or_none()
    if not sup:
        raise AppError(404, "NOT_FOUND", "Supplier not found")
    return sup


@router.get("", response_model=list[SupplierSummary])
async def list_suppliers(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SupplierSummary]:
    result = await db.execute(
        select(Supplier)
        .where(Supplier.salon_id == user.salon_id)
        .order_by(Supplier.name)
    )
    suppliers = result.scalars().all()
    return [await _summary(s, db) for s in suppliers]


@router.post("", response_model=SupplierSummary, status_code=201)
async def create_supplier(
    body: SupplierCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SupplierSummary:
    sup = Supplier(
        salon_id=user.salon_id,
        name=body.name,
        location=body.location,
        contact_phone=body.contact_phone,
    )
    db.add(sup)
    await db.flush()
    return await _summary(sup, db)


@router.get("/{supplier_id}", response_model=SupplierDetail)
async def get_supplier(
    supplier_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SupplierDetail:
    sup = await _get_or_404(supplier_id, user, db)
    summary = await _summary(sup, db)

    purchases_result = await db.execute(
        select(
            StockPurchase,
            StockItem.color.label("color"),
            StockItem.length.label("length"),
        )
        .outerjoin(StockItem, StockPurchase.stock_item_id == StockItem.id)
        .where(StockPurchase.supplier_id == sup.id)
        .order_by(StockPurchase.occurred_at.desc())
    )

    purchase_lines = [
        PurchaseLineResponse(
            id=row.StockPurchase.id,
            stock_item_id=row.StockPurchase.stock_item_id,
            color=row.color,
            length=row.length,
            quantity=row.StockPurchase.quantity,
            price_per_pack=float(row.StockPurchase.price_per_pack),
            total=row.StockPurchase.quantity * float(row.StockPurchase.price_per_pack),
            occurred_at=row.StockPurchase.occurred_at,
        )
        for row in purchases_result.all()
    ]

    return SupplierDetail(**summary.model_dump(), purchases=purchase_lines)


@router.post("/{supplier_id}/orders", response_model=list[PurchaseLineResponse], status_code=201)
async def place_order(
    supplier_id: uuid.UUID,
    body: OrderCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PurchaseLineResponse]:
    sup = await _get_or_404(supplier_id, user, db)
    occurred_at = body.occurred_at or datetime.now(timezone.utc)
    lines: list[PurchaseLineResponse] = []

    for line in body.items:
        # Verify stock item belongs to this salon
        item_result = await db.execute(
            select(StockItem).where(
                StockItem.id == line.stock_item_id,
                StockItem.salon_id == user.salon_id,
            )
        )
        item = item_result.scalar_one_or_none()
        if not item:
            raise AppError(404, "NOT_FOUND", f"Stock item {line.stock_item_id} not found")

        item.packs += line.quantity

        purchase = StockPurchase(
            salon_id=user.salon_id,
            supplier_id=sup.id,
            stock_item_id=item.id,
            quantity=line.quantity,
            price_per_pack=line.price_per_pack,
            occurred_at=occurred_at,
        )
        db.add(purchase)
        await db.flush()

        lines.append(PurchaseLineResponse(
            id=purchase.id,
            stock_item_id=item.id,
            color=item.color,
            length=item.length,
            quantity=line.quantity,
            price_per_pack=line.price_per_pack,
            total=line.quantity * line.price_per_pack,
            occurred_at=occurred_at,
        ))

    return lines
