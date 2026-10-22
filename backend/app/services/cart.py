from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartItemOut, CartOut, ProductOut

CENT = Decimal("0.01")


def get_or_create_cart(db: Session, user: User) -> Cart:
    cart = db.scalar(select(Cart).where(Cart.user_id == user.id))
    if cart is None:
        # Tolera dos primeras peticiones simultáneas gracias a UNIQUE(user_id)
        db.execute(pg_insert(Cart).values(user_id=user.id).on_conflict_do_nothing())
        db.commit()
        cart = db.scalars(select(Cart).where(Cart.user_id == user.id)).one()
    return cart


def to_out(cart: Cart) -> CartOut:
    items = [
        CartItemOut(
            id=item.id,
            product=ProductOut.model_validate(item.product),
            quantity=item.quantity,
            subtotal=(item.product.price * item.quantity).quantize(CENT),
            available=item.product.is_active,
        )
        for item in cart.items
    ]
    return CartOut(
        id=cart.id,
        items=items,
        total=sum((i.subtotal for i in items), Decimal("0.00")).quantize(CENT),
        item_count=sum(i.quantity for i in items),
    )


def _finish(db: Session, cart: Cart) -> CartOut:
    db.commit()
    db.expire(cart)
    return to_out(cart)


def _lock_product(db: Session, product_id: int) -> Product | None:
    return db.scalar(select(Product).where(Product.id == product_id).with_for_update())


def _check_stock(product: Product, quantity: int) -> None:
    if product.stock == 0:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Sin stock de '{product.name}'")
    if quantity > product.stock:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Stock insuficiente de '{product.name}': "
            f"solo hay {product.stock} unidades disponibles",
        )


def _get_item(db: Session, user: User, item_id: int) -> CartItem:
    item = db.scalar(
        select(CartItem)
        .join(Cart, Cart.id == CartItem.cart_id)
        .where(CartItem.id == item_id, Cart.user_id == user.id)
    )
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ítem no encontrado")
    return item


def get_cart(db: Session, user: User) -> CartOut:
    return to_out(get_or_create_cart(db, user))


def add_item(db: Session, user: User, product_id: int, quantity: int) -> CartOut:
    cart = get_or_create_cart(db, user)
    product = _lock_product(db, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Producto no encontrado")
    item = db.scalar(
        select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product_id)
    )
    _check_stock(product, quantity + (item.quantity if item else 0))
    if item is None:
        db.add(CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity))
    else:
        item.quantity += quantity
    return _finish(db, cart)


def update_item(db: Session, user: User, item_id: int, quantity: int) -> CartOut:
    item = _get_item(db, user, item_id)
    product = _lock_product(db, item.product_id)
    _check_stock(product, quantity)
    item.quantity = quantity
    return _finish(db, db.get(Cart, item.cart_id))


def remove_item(db: Session, user: User, item_id: int) -> CartOut:
    item = _get_item(db, user, item_id)
    cart = db.get(Cart, item.cart_id)
    db.delete(item)
    return _finish(db, cart)


def clear_cart(db: Session, user: User) -> CartOut:
    cart = get_or_create_cart(db, user)
    for item in list(cart.items):
        db.delete(item)
    return _finish(db, cart)
