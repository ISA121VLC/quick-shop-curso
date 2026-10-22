from fastapi import APIRouter, status

from app.core.deps import CustomerUser, DbSession
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartOut
from app.services import cart as cart_service

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=CartOut)
def get_cart(user: CustomerUser, db: DbSession):
    return cart_service.get_cart(db, user)


@router.post("/items", response_model=CartOut, status_code=status.HTTP_201_CREATED)
def add_item(data: CartItemCreate, user: CustomerUser, db: DbSession):
    return cart_service.add_item(db, user, data.product_id, data.quantity)


@router.patch("/items/{item_id}", response_model=CartOut)
def update_item(item_id: int, data: CartItemUpdate, user: CustomerUser, db: DbSession):
    return cart_service.update_item(db, user, item_id, data.quantity)


@router.delete("/items/{item_id}", response_model=CartOut)
def remove_item(item_id: int, user: CustomerUser, db: DbSession):
    return cart_service.remove_item(db, user, item_id)


@router.delete("", response_model=CartOut)
def clear_cart(user: CustomerUser, db: DbSession):
    return cart_service.clear_cart(db, user)
