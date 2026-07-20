from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.appointment import Appointment, AppointmentStatus
from app.models.client import Client
from app.models.service import Service
from app.models.transaction import Transaction, TransactionKind
from app.models.user import User
from app.schemas.finance import (
    DayCount,
    FinanceSummary,
    MonthlyPoint,
    OutstandingRecord,
    TopService,
    TransactionCreate,
    TransactionResponse,
)

router = APIRouter(prefix="/finance", tags=["finance"])

_INCOME_STATUSES = (AppointmentStatus.confirmed, AppointmentStatus.completed)


def _period_range(period: str) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    if period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    return start, now


def _prev_period_range(period: str) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    if period == "week":
        end   = now - timedelta(days=7)
        start = end - timedelta(days=7)
    elif period == "month":
        end   = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        prev  = end - timedelta(days=1)
        start = prev.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        end   = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        start = end.replace(year=end.year - 1)
    return start, end


@router.get("/summary", response_model=FinanceSummary)
async def get_summary(
    period: Literal["week", "month", "year"] = Query("month"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FinanceSummary:
    start, end = _period_range(period)

    # Revenue: sum of total_price for confirmed/completed appointments in range
    rev_result = await db.execute(
        select(func.coalesce(func.sum(Appointment.total_price), 0))
        .where(
            Appointment.salon_id == user.salon_id,
            Appointment.status.in_(_INCOME_STATUSES),
            Appointment.starts_at >= start,
            Appointment.starts_at < end,
        )
    )
    revenue = float(rev_result.scalar() or 0)

    # Expenses: sum of expense transactions in range
    exp_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .where(
            Transaction.salon_id == user.salon_id,
            Transaction.kind == TransactionKind.expense,
            Transaction.occurred_at >= start,
            Transaction.occurred_at < end,
        )
    )
    expenses = float(exp_result.scalar() or 0)

    # Previous period revenue for delta
    prev_start, prev_end = _prev_period_range(period)
    prev_result = await db.execute(
        select(func.coalesce(func.sum(Appointment.total_price), 0))
        .where(
            Appointment.salon_id == user.salon_id,
            Appointment.status.in_(_INCOME_STATUSES),
            Appointment.starts_at >= prev_start,
            Appointment.starts_at < prev_end,
        )
    )
    prev_revenue = float(prev_result.scalar() or 0)
    delta_pct = round((revenue - prev_revenue) / prev_revenue * 100, 1) if prev_revenue > 0 else None

    return FinanceSummary(
        period=period,
        revenue=round(revenue, 2),
        expenses=round(expenses, 2),
        profit=round(revenue - expenses, 2),
        delta_pct=delta_pct,
    )


@router.get("/monthly", response_model=list[MonthlyPoint])
async def get_monthly(
    months: int = Query(6, ge=1, le=24),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MonthlyPoint]:
    since = datetime.now(timezone.utc) - timedelta(days=months * 31)

    result = await db.execute(
        select(
            func.date_trunc("month", Appointment.starts_at).label("month_start"),
            func.coalesce(func.sum(Appointment.total_price), 0).label("revenue"),
        )
        .where(
            Appointment.salon_id == user.salon_id,
            Appointment.status.in_(_INCOME_STATUSES),
            Appointment.starts_at >= since,
        )
        .group_by(func.date_trunc("month", Appointment.starts_at))
        .order_by(func.date_trunc("month", Appointment.starts_at).asc())
    )

    _MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return [
        MonthlyPoint(
            month=_MONTH_ABBR[row.month_start.month - 1],
            year=row.month_start.year,
            revenue=float(row.revenue),
        )
        for row in result.all()
    ]


@router.get("/top-services", response_model=list[TopService])
async def get_top_services(
    limit: int = Query(5, ge=1, le=20),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TopService]:
    result = await db.execute(
        select(
            Service.name.label("service_name"),
            func.count(Appointment.id).label("bookings"),
            func.coalesce(func.sum(Appointment.total_price), 0).label("revenue"),
        )
        .join(Service, Appointment.service_id == Service.id)
        .where(
            Appointment.salon_id == user.salon_id,
            Appointment.status.in_(_INCOME_STATUSES),
            Appointment.service_id.isnot(None),
        )
        .group_by(Service.name)
        .order_by(func.sum(Appointment.total_price).desc())
        .limit(limit)
    )

    return [
        TopService(
            service_name=row.service_name,
            bookings=row.bookings,
            revenue=float(row.revenue),
        )
        for row in result.all()
    ]


@router.get("/transactions", response_model=list[TransactionResponse])
async def list_transactions(
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TransactionResponse]:
    result = await db.execute(
        select(Transaction)
        .where(Transaction.salon_id == user.salon_id)
        .order_by(Transaction.occurred_at.desc())
        .limit(limit)
    )
    rows = result.scalars().all()
    return [
        TransactionResponse(
            id=t.id,
            kind=t.kind,
            amount=float(t.amount),
            description=t.description,
            appointment_id=t.appointment_id,
            occurred_at=t.occurred_at,
            created_at=t.created_at,
        )
        for t in rows
    ]


@router.post("/transactions", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    body: TransactionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TransactionResponse:
    txn = Transaction(
        salon_id=user.salon_id,
        kind=body.kind,
        amount=body.amount,
        description=body.description,
        appointment_id=body.appointment_id,
        occurred_at=body.occurred_at,
    )
    db.add(txn)
    await db.flush()
    return TransactionResponse(
        id=txn.id,
        kind=txn.kind,
        amount=float(txn.amount),
        description=txn.description,
        appointment_id=txn.appointment_id,
        occurred_at=txn.occurred_at,
        created_at=txn.created_at,
    )


@router.get("/busiest-days", response_model=list[DayCount])
async def get_busiest_days(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[DayCount]:
    since = datetime.now(timezone.utc) - timedelta(days=90)

    result = await db.execute(
        select(
            func.extract("dow", Appointment.starts_at).label("dow"),
            func.count().label("count"),
        )
        .where(
            Appointment.salon_id == user.salon_id,
            Appointment.status != AppointmentStatus.cancelled,
            Appointment.starts_at >= since,
        )
        .group_by(func.extract("dow", Appointment.starts_at))
        .order_by(func.extract("dow", Appointment.starts_at))
    )

    # PostgreSQL DOW: 0=Sun, 1=Mon … 6=Sat — return Mon–Sat only
    _LABELS = {1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat"}
    counts = {int(row.dow): row.count for row in result.all()}
    return [DayCount(day=_LABELS[d], count=counts.get(d, 0)) for d in range(1, 7)]


@router.get("/outstanding", response_model=list[OutstandingRecord])
async def get_outstanding(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[OutstandingRecord]:
    result = await db.execute(
        select(
            Appointment.id.label("appointment_id"),
            Client.name.label("client_name"),
            Service.name.label("service_name"),
            Appointment.total_price,
            Appointment.deposit_paid,
            Appointment.starts_at,
        )
        .outerjoin(Client,  Appointment.client_id  == Client.id)
        .outerjoin(Service, Appointment.service_id == Service.id)
        .where(
            Appointment.salon_id == user.salon_id,
            Appointment.status.in_([AppointmentStatus.pending, AppointmentStatus.confirmed]),
            Appointment.deposit_paid < Appointment.total_price,
        )
        .order_by(Appointment.starts_at.asc())
    )

    return [
        OutstandingRecord(
            appointment_id=row.appointment_id,
            client_name=row.client_name,
            service_name=row.service_name,
            total_price=float(row.total_price),
            deposit_paid=float(row.deposit_paid),
            balance_due=round(float(row.total_price) - float(row.deposit_paid), 2),
            starts_at=row.starts_at,
        )
        for row in result.all()
    ]
