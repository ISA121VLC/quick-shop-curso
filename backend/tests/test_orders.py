from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.order import OrderItemOut, OrderStatusUpdate
from app.services.orders import ALLOWED_TRANSITIONS
from tests.conftest import CUSTOMER_PASSWORD, login, make_user, new_client
from tests.test_products import make_product

TARGETS = ["confirmed", "shipped", "delivered", "cancelled"]


def add_to_cart(client, product, quantity=1):
    response = client.post("/api/cart/items", json={"product_id": product.id, "quantity": quantity})
    assert response.status_code == 201, response.text


def place_order(client, *lines):
    """lines: (producto, cantidad). Devuelve la respuesta de POST /api/orders."""
    for product, quantity in lines:
        add_to_cart(client, product, quantity)
    return client.post("/api/orders")


def make_order(db, user, product, quantity=2, status=OrderStatus.PENDING):
    order = Order(
        user_id=user.id,
        status=status,
        total=(product.price * quantity).quantize(Decimal("0.01")),
        items=[
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                unit_price=product.price,
                quantity=quantity,
            )
        ],
    )
    db.add(order)
    db.commit()
    return order


def stock(db, product):
    db.expire_all()
    return db.get(Product, product.id).stock


def set_status(client, order_id, value):
    return client.patch(f"/api/orders/{order_id}/status", json={"status": value})


def other_client(db, email="otro@test.com"):
    user = make_user(db, email)
    client = new_client(db)
    login(client, user.email, CUSTOMER_PASSWORD)
    return user, client


# --- esquemas ---


def test_order_status_update_rejects_pending_and_unknown():
    with pytest.raises(ValidationError):
        OrderStatusUpdate(status="pending")
    with pytest.raises(ValidationError):
        OrderStatusUpdate(status="lost")
    assert OrderStatusUpdate(status="confirmed").status == OrderStatus.CONFIRMED


def test_order_item_serializes_amounts_with_two_decimals():
    item = OrderItemOut(product_id=1, product_name="X", unit_price=Decimal("2.5"), quantity=3)
    data = item.model_dump(mode="json")
    assert data["unit_price"] == "2.50" and data["subtotal"] == "7.50"


# --- creación ---


def test_create_requires_auth_and_customer(client, admin_client):
    assert client.post("/api/orders").status_code == 401
    assert admin_client.post("/api/orders").status_code == 403


def test_create_order_from_cart(customer_client, customer, db):
    a = make_product(db, name="A", price="10.50", stock=10)
    b = make_product(db, name="B", price="3.25", stock=10)
    response = place_order(customer_client, (a, 2), (b, 1))
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending" and body["user_id"] == customer.id
    assert body["total"] == "24.25"
    assert [
        (i["product_name"], i["unit_price"], i["quantity"], i["subtotal"]) for i in body["items"]
    ] == [
        ("A", "10.50", 2, "21.00"),
        ("B", "3.25", 1, "3.25"),
    ]
    assert customer_client.get("/api/cart").json()["items"] == []


def test_create_with_empty_cart_is_400(customer_client):
    assert customer_client.post("/api/orders").status_code == 400
    customer_client.get("/api/cart")
    assert customer_client.post("/api/orders").status_code == 400
    assert customer_client.get("/api/orders").json()["total"] == 0


def test_create_does_not_change_stock(customer_client, db):
    product = make_product(db, stock=5)
    place_order(customer_client, (product, 2))
    assert stock(db, product) == 5


def test_create_with_insufficient_stock_is_409_and_keeps_everything(customer_client, db):
    ok = make_product(db, name="Disponible", stock=10)
    short = make_product(db, name="Escaso", stock=5)
    add_to_cart(customer_client, ok, 2)
    add_to_cart(customer_client, short, 4)
    short.stock = 1
    db.commit()
    response = customer_client.post("/api/orders")
    assert response.status_code == 409
    detail = response.json()["detail"]
    assert "Escaso" in detail and "1 unidades" in detail and "Disponible" not in detail
    assert len(customer_client.get("/api/cart").json()["items"]) == 2
    assert customer_client.get("/api/orders").json()["total"] == 0
    assert (stock(db, ok), stock(db, short)) == (10, 1)


def test_create_with_inactive_product_is_409(customer_client, db):
    product = make_product(db, name="Retirado")
    add_to_cart(customer_client, product)
    product.is_active = False
    db.commit()
    response = customer_client.post("/api/orders")
    assert response.status_code == 409 and "Retirado" in response.json()["detail"]
    assert len(customer_client.get("/api/cart").json()["items"]) == 1


def test_order_prices_are_a_snapshot(customer_client, admin_client, db):
    product = make_product(db, name="Original", price="10.00", stock=5)
    order_id = place_order(customer_client, (product, 2)).json()["id"]
    product.price = Decimal("99.00")
    product.name = "Renombrado"
    db.commit()
    body = customer_client.get(f"/api/orders/{order_id}").json()
    assert body["total"] == "20.00"
    assert body["items"][0]["product_name"] == "Original"
    assert body["items"][0]["unit_price"] == "10.00"


# --- consulta ---


def test_list_and_get_require_auth(client):
    assert client.get("/api/orders").status_code == 401
    assert client.get("/api/orders/1").status_code == 401


def test_customer_lists_only_own_orders_even_with_user_id(customer_client, customer, db):
    product = make_product(db, stock=20)
    mine = place_order(customer_client, (product, 1)).json()["id"]
    other, other_c = other_client(db)
    make_order(db, other, product)
    body = customer_client.get("/api/orders", params={"user_id": other.id}).json()
    assert [o["id"] for o in body["items"]] == [mine] and body["total"] == 1


def test_admin_lists_all_and_filters(admin_client, customer, db):
    product = make_product(db, stock=20)
    other, _ = other_client(db)
    a = make_order(db, customer, product, status=OrderStatus.PENDING)
    b = make_order(db, other, product, status=OrderStatus.PENDING)
    c = make_order(db, other, product, status=OrderStatus.CONFIRMED)

    def ids(**params):
        items = admin_client.get("/api/orders", params=params).json()["items"]
        return {o["id"] for o in items}

    assert ids() == {a.id, b.id, c.id}
    assert ids(status="pending", user_id=other.id) == {b.id}
    assert ids(status="confirmed") == {c.id}


def test_list_is_ordered_newest_first_and_paginated(customer_client, customer, db):
    product = make_product(db, stock=50)
    created = [make_order(db, customer, product).id for _ in range(5)]
    body = customer_client.get("/api/orders", params={"page_size": 2}).json()
    assert body["total"] == 5 and body["page"] == 1 and body["page_size"] == 2
    assert [o["id"] for o in body["items"]] == created[::-1][:2]
    page3 = customer_client.get("/api/orders", params={"page_size": 2, "page": 3}).json()
    assert [o["id"] for o in page3["items"]] == [created[0]]


def test_list_rejects_invalid_params(customer_client):
    assert customer_client.get("/api/orders", params={"page_size": 101}).status_code == 422
    assert customer_client.get("/api/orders", params={"page": 0}).status_code == 422
    assert customer_client.get("/api/orders", params={"status": "lost"}).status_code == 422


def test_get_order_visibility(customer_client, admin_client, db):
    product = make_product(db, stock=5)
    other, _ = other_client(db)
    foreign = make_order(db, other, product)
    assert customer_client.get(f"/api/orders/{foreign.id}").status_code == 404
    assert customer_client.get("/api/orders/999999").status_code == 404
    assert admin_client.get(f"/api/orders/{foreign.id}").status_code == 200
    assert admin_client.get("/api/orders/999999").status_code == 404


# --- cancelación del cliente ---


def test_customer_cancels_own_pending_without_touching_stock(customer_client, db):
    product = make_product(db, stock=5)
    order_id = place_order(customer_client, (product, 2)).json()["id"]
    response = customer_client.post(f"/api/orders/{order_id}/cancel")
    assert response.status_code == 200 and response.json()["status"] == "cancelled"
    assert stock(db, product) == 5


@pytest.mark.parametrize("current", ["confirmed", "shipped", "delivered", "cancelled"])
def test_customer_cannot_cancel_non_pending(customer_client, customer, db, current):
    product = make_product(db, stock=5)
    order = make_order(db, customer, product, status=OrderStatus(current))
    assert customer_client.post(f"/api/orders/{order.id}/cancel").status_code == 409
    db.refresh(order)
    assert order.status == current


def test_cancel_permissions(customer_client, admin_client, db):
    product = make_product(db, stock=5)
    other, _ = other_client(db)
    foreign = make_order(db, other, product)
    assert customer_client.post(f"/api/orders/{foreign.id}/cancel").status_code == 404
    assert customer_client.post("/api/orders/999999/cancel").status_code == 404
    assert admin_client.post(f"/api/orders/{foreign.id}/cancel").status_code == 403
    assert new_client(db).post(f"/api/orders/{foreign.id}/cancel").status_code == 401


# --- estados y stock ---


def test_status_endpoint_permissions_and_validation(customer_client, admin_client, customer, db):
    product = make_product(db, stock=5)
    order = make_order(db, customer, product)
    assert set_status(customer_client, order.id, "confirmed").status_code == 403
    assert (
        new_client(db)
        .patch(f"/api/orders/{order.id}/status", json={"status": "confirmed"})
        .status_code
        == 401
    )
    assert set_status(admin_client, order.id, "lost").status_code == 422
    assert set_status(admin_client, order.id, "pending").status_code == 422
    assert admin_client.patch(f"/api/orders/{order.id}/status", json={}).status_code == 422
    assert set_status(admin_client, 999999, "confirmed").status_code == 404


@pytest.mark.parametrize("current", [s.value for s in OrderStatus])
@pytest.mark.parametrize("target", TARGETS)
def test_transition_matrix(admin_client, customer, db, current, target):
    product = make_product(db, stock=100)
    order = make_order(db, customer, product, status=OrderStatus(current))
    response = set_status(admin_client, order.id, target)
    if OrderStatus(target) in ALLOWED_TRANSITIONS[OrderStatus(current)]:
        assert response.status_code == 200 and response.json()["status"] == target
    else:
        assert response.status_code == 409
        db.refresh(order)
        assert order.status == current


def test_confirm_deducts_stock(admin_client, customer, db):
    a = make_product(db, stock=10)
    b = make_product(db, stock=4)
    order = make_order(db, customer, a, quantity=3)
    db.add(
        OrderItem(
            order_id=order.id, product_id=b.id, product_name="B", unit_price=b.price, quantity=4
        )
    )
    db.commit()
    assert set_status(admin_client, order.id, "confirmed").status_code == 200
    assert (stock(db, a), stock(db, b)) == (7, 0)


def test_confirm_with_insufficient_stock_changes_nothing(admin_client, customer, db):
    a = make_product(db, stock=10)
    b = make_product(db, stock=1)
    order = make_order(db, customer, a, quantity=3)
    db.add(
        OrderItem(
            order_id=order.id, product_id=b.id, product_name="B", unit_price=b.price, quantity=2
        )
    )
    db.commit()
    response = set_status(admin_client, order.id, "confirmed")
    assert response.status_code == 409 and "'B'" in response.json()["detail"]
    assert (stock(db, a), stock(db, b)) == (10, 1)
    db.refresh(order)
    assert order.status == OrderStatus.PENDING


@pytest.mark.parametrize("current", ["confirmed", "shipped"])
def test_cancel_restores_stock(admin_client, customer, db, current):
    product = make_product(db, stock=10)
    order = make_order(db, customer, product, quantity=3, status=OrderStatus(current))
    assert set_status(admin_client, order.id, "cancelled").status_code == 200
    assert stock(db, product) == 13


def test_cancel_pending_does_not_change_stock(admin_client, customer, db):
    product = make_product(db, stock=10)
    order = make_order(db, customer, product, quantity=3)
    assert set_status(admin_client, order.id, "cancelled").status_code == 200
    assert stock(db, product) == 10


def test_full_lifecycle_moves_stock_once(customer_client, admin_client, db):
    product = make_product(db, stock=10)
    order_id = place_order(customer_client, (product, 4)).json()["id"]
    assert stock(db, product) == 10
    for target, expected in [("confirmed", 6), ("shipped", 6), ("delivered", 6)]:
        assert set_status(admin_client, order_id, target).status_code == 200
        assert stock(db, product) == expected
    assert set_status(admin_client, order_id, "cancelled").status_code == 409
    assert stock(db, product) == 6
