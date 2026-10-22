"""Concurrencia: sesiones independientes con datos confirmados (sin el rollback por test)."""

import threading
from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import get_engine
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.services.orders import change_status


@pytest.fixture
def committed():
    """Crea usuario y producto reales y los elimina al terminar."""
    created = {"orders": [], "product": None, "user": None}
    with Session(get_engine()) as s:
        user = User(email="concurrente@test.com", password_hash=hash_password("x"), full_name="C")
        s.add(user)
        s.commit()
        created["user"] = user.id

    def make_product(stock):
        with Session(get_engine()) as s:
            product = Product(
                name="Concurrente", description="", price=Decimal("5.00"), stock=stock
            )
            s.add(product)
            s.commit()
            created["product"] = product.id
            return product.id

    def make_order(product_id, quantity):
        with Session(get_engine()) as s:
            order = Order(
                user_id=created["user"],
                total=Decimal("5.00") * quantity,
                items=[
                    OrderItem(
                        product_id=product_id,
                        product_name="Concurrente",
                        unit_price=Decimal("5.00"),
                        quantity=quantity,
                    )
                ],
            )
            s.add(order)
            s.commit()
            created["orders"].append(order.id)
            return order.id

    def stock_of(product_id):
        with Session(get_engine()) as s:
            return s.get(Product, product_id).stock

    yield make_product, make_order, stock_of

    with Session(get_engine()) as s:
        if created["orders"]:
            s.execute(delete(Order).where(Order.id.in_(created["orders"])))
        if created["product"]:
            s.execute(delete(Product).where(Product.id == created["product"]))
        s.execute(delete(User).where(User.id == created["user"]))
        s.commit()


def run_parallel(jobs):
    barrier = threading.Barrier(len(jobs))
    results = [None] * len(jobs)

    def worker(index, order_id, target):
        with Session(get_engine()) as s:
            barrier.wait()
            try:
                results[index] = change_status(s, order_id, target).status
            except HTTPException as exc:
                results[index] = exc.status_code

    threads = [threading.Thread(target=worker, args=(i, *job)) for i, job in enumerate(jobs)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=30)
    assert not any(t.is_alive() for t in threads), "posible interbloqueo"
    return results


@pytest.mark.parametrize("round_", range(3))
def test_concurrent_confirmations_never_oversell(committed, round_):
    make_product, make_order, stock_of = committed
    product_id = make_product(stock=5)
    first = make_order(product_id, 3)
    second = make_order(product_id, 3)
    results = run_parallel([(first, OrderStatus.CONFIRMED), (second, OrderStatus.CONFIRMED)])
    assert sorted(map(str, results)) == ["409", "confirmed"]
    assert stock_of(product_id) == 2


@pytest.mark.parametrize("round_", range(3))
def test_concurrent_status_changes_of_same_order_apply_stock_once(committed, round_):
    make_product, make_order, stock_of = committed
    product_id = make_product(stock=10)
    order_id = make_order(product_id, 3)
    results = run_parallel([(order_id, OrderStatus.CONFIRMED)] * 2)
    assert sorted(map(str, results)) == ["409", "confirmed"]
    assert stock_of(product_id) == 7
