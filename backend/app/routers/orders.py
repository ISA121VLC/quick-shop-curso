from typing import Annotated

from fastapi import APIRouter, Query, status

from app.core.deps import AdminUser, CurrentUser, CustomerUser, DbSession
from app.models.order import OrderStatus
from app.schemas.common import Page
from app.schemas.order import OrderOut, OrderStatusUpdate
from app.services import orders as orders_service

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(user: CustomerUser, db: DbSession):
    return orders_service.create_order(db, user)


@router.get("", response_model=Page[OrderOut])
def list_orders(
    user: CurrentUser,
    db: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 12,
    status: OrderStatus | None = None,
    user_id: int | None = None,
):
    items, total = orders_service.list_orders(db, user, page, page_size, status, user_id)
    return Page[OrderOut](items=items, total=total, page=page, page_size=page_size)


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, user: CurrentUser, db: DbSession):
    return orders_service.get_order(db, user, order_id)


@router.post("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(order_id: int, user: CustomerUser, db: DbSession):
    return orders_service.cancel_own_order(db, user, order_id)


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_status(order_id: int, data: OrderStatusUpdate, _admin: AdminUser, db: DbSession):
    return orders_service.change_status(db, order_id, data.status)
