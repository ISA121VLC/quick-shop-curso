from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.cart import Cart
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import Role, User

ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.SHIPPED, OrderStatus.CANCELLED},
    OrderStatus.SHIPPED: {OrderStatus.DELIVERED, OrderStatus.CANCELLED},
    OrderStatus.DELIVERED: set(),
    OrderStatus.CANCELLED: set(),
}
# Estados desde los que cancelar restituye el stock (en pending aún no se había descontado)
RESTOCK_ON_CANCEL = {OrderStatus.CONFIRMED, OrderStatus.SHIPPED}


def _lock_products(db: Session, product_ids: list[int]) -> dict[int, Product]:
    """Bloquea las filas en orden de id para que transacciones concurrentes no se interbloqueen."""
    rows = db.scalars(
        select(Product).where(Product.id.in_(product_ids)).order_by(Product.id).with_for_update()
    )
    return {p.id: p for p in rows}


def create_order(db: Session, user: User) -> Order:
    cart = db.scalar(select(Cart).where(Cart.user_id == user.id))
    if cart is None or not cart.items:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "El carrito está vacío")
    products = _lock_products(db, [item.product_id for item in cart.items])

    problems = []
    for item in cart.items:
        product = products[item.product_id]
        if not product.is_active:
            problems.append(f"'{product.name}' ya no está disponible")
        elif item.quantity > product.stock:
            problems.append(
                f"'{product.name}': stock insuficiente, solo hay {product.stock} "
                f"unidades disponibles y hay {item.quantity} en el carrito"
            )
    if problems:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "; ".join(problems))

    order = Order(user_id=user.id, total=Decimal("0.00"))
    for item in cart.items:
        product = products[item.product_id]
        order.items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                unit_price=product.price,
                quantity=item.quantity,
            )
        )
    order.total = sum((i.unit_price * i.quantity for i in order.items), Decimal("0.00")).quantize(
        Decimal("0.01")
    )
    db.add(order)
    cart.items.clear()
    db.commit()
    db.refresh(order)
    return order


def list_orders(
    db: Session,
    user: User,
    page: int,
    page_size: int,
    status_filter: OrderStatus | None,
    user_id: int | None,
) -> tuple[list[Order], int]:
    stmt = select(Order)
    if user.role == Role.ADMIN:
        if user_id is not None:
            stmt = stmt.where(Order.user_id == user_id)
    else:
        stmt = stmt.where(Order.user_id == user.id)
    if status_filter is not None:
        stmt = stmt.where(Order.status == status_filter)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(
        stmt.order_by(Order.created_at.desc(), Order.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return list(items), total


def get_order(db: Session, user: User, order_id: int) -> Order:
    order = db.get(Order, order_id)
    if order is None or (user.role != Role.ADMIN and order.user_id != user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no encontrado")
    return order


def cancel_own_order(db: Session, user: User, order_id: int) -> Order:
    return _transition(db, order_id, OrderStatus.CANCELLED, owner_id=user.id)


def change_status(db: Session, order_id: int, new_status: OrderStatus) -> Order:
    return _transition(db, order_id, new_status)


def _transition(
    db: Session, order_id: int, new_status: OrderStatus, owner_id: int | None = None
) -> Order:
    # Se bloquea el pedido antes de leer su estado: dos cambios simultáneos se serializan
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if order is None or (owner_id is not None and order.user_id != owner_id):
        db.rollback()
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no encontrado")
    if owner_id is not None and order.status != OrderStatus.PENDING:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Solo se puede cancelar un pedido en estado pending"
        )
    if new_status not in ALLOWED_TRANSITIONS[order.status]:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Transición no permitida: {order.status.value} -> {new_status.value}",
        )

    if order.status == OrderStatus.PENDING and new_status == OrderStatus.CONFIRMED:
        _reserve_stock(db, order)
    elif new_status == OrderStatus.CANCELLED and order.status in RESTOCK_ON_CANCEL:
        _restore_stock(db, order)

    order.status = new_status
    db.commit()
    db.refresh(order)
    return order


def _reserve_stock(db: Session, order: Order) -> None:
    products = _lock_products(db, [i.product_id for i in order.items])
    problems = [
        f"'{i.product_name}': stock insuficiente, solo hay {products[i.product_id].stock} "
        f"unidades y el pedido necesita {i.quantity}"
        for i in order.items
        if products[i.product_id].stock < i.quantity
    ]
    if problems:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "; ".join(problems))
    for item in order.items:
        products[item.product_id].stock -= item.quantity


def _restore_stock(db: Session, order: Order) -> None:
    products = _lock_products(db, [i.product_id for i in order.items])
    for item in order.items:
        products[item.product_id].stock += item.quantity
