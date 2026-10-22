from decimal import Decimal

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem, OrderStatus
from tests.conftest import make_user
from tests.test_products import make_product


def make_cart_item(db, cart, product, quantity=1):
    item = CartItem(cart_id=cart.id, product_id=product.id, quantity=quantity)
    db.add(item)
    db.commit()
    return item


@pytest.fixture
def cart(db, customer):
    cart = Cart(user_id=customer.id)
    db.add(cart)
    db.commit()
    return cart


def test_cart_item_rejects_zero_quantity(db, cart):
    product = make_product(db)
    with pytest.raises(IntegrityError):
        make_cart_item(db, cart, product, quantity=0)
    db.rollback()


def test_cart_item_unique_per_product(db, cart):
    product = make_product(db)
    make_cart_item(db, cart, product)
    with pytest.raises(IntegrityError):
        make_cart_item(db, cart, product)
    db.rollback()


def test_cart_unique_per_user(db, customer, cart):
    db.add(Cart(user_id=customer.id))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_deleting_user_cascades_to_cart(db, cart):
    product = make_product(db)
    make_cart_item(db, cart, product)
    user = make_user(db, "otro@test.com")
    other = Cart(user_id=user.id)
    db.add(other)
    db.commit()
    other_id = other.id
    db.delete(user)
    db.commit()
    db.expire_all()
    assert db.query(Cart).filter_by(id=other_id).count() == 0
    assert db.query(Cart).filter_by(id=cart.id).count() == 1


def make_order(db, user, total="10.00"):
    order = Order(user_id=user.id, total=Decimal(total))
    db.add(order)
    db.commit()
    return order


def test_order_defaults_to_pending(db, customer):
    order = make_order(db, customer)
    db.refresh(order)
    assert order.status == OrderStatus.PENDING


def test_order_rejects_negative_total(db, customer):
    with pytest.raises(IntegrityError):
        make_order(db, customer, total="-1")
    db.rollback()


def add_order_item(db, order, product, unit_price="5.00", quantity=1):
    db.add(
        OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            unit_price=Decimal(unit_price),
            quantity=quantity,
        )
    )
    db.commit()


def test_order_item_rejects_non_positive_price_and_quantity(db, customer):
    order = make_order(db, customer)
    product = make_product(db)
    with pytest.raises(IntegrityError):
        add_order_item(db, order, product, unit_price="0")
    db.rollback()
    with pytest.raises(IntegrityError):
        add_order_item(db, order, product, quantity=0)
    db.rollback()


def test_order_items_cascade_on_order_delete(db, customer):
    order = make_order(db, customer)
    product = make_product(db)
    add_order_item(db, order, product)
    order_id = order.id
    db.delete(order)
    db.commit()
    assert db.query(OrderItem).filter_by(order_id=order_id).count() == 0
