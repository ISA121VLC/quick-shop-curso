from decimal import Decimal

from sqlalchemy import func, select

from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.schemas.cart import CartItemOut, CartOut
from app.schemas.product import ProductOut
from tests.conftest import CUSTOMER_PASSWORD, login, make_user, new_client
from tests.test_products import make_product


def add(client, product, quantity=None):
    body = {"product_id": product.id}
    if quantity is not None:
        body["quantity"] = quantity
    return client.post("/api/cart/items", json=body)


def test_cart_out_serializes_amounts_with_two_decimals(db):
    product = ProductOut.model_validate(make_product(db, price="10.5"))
    item = CartItemOut(id=1, product=product, quantity=2, subtotal=Decimal("21"), available=True)
    data = CartOut(id=1, items=[item], total=Decimal("21"), item_count=2).model_dump(mode="json")
    assert data["total"] == "21.00"
    assert data["items"][0]["subtotal"] == "21.00"


def test_requires_auth(client, db):
    product = make_product(db)
    assert client.get("/api/cart").status_code == 401
    assert client.post("/api/cart/items", json={"product_id": product.id}).status_code == 401
    assert client.patch("/api/cart/items/1", json={"quantity": 1}).status_code == 401
    assert client.delete("/api/cart/items/1").status_code == 401
    assert client.delete("/api/cart").status_code == 401


def test_admin_forbidden_everywhere(admin_client, db):
    product = make_product(db)
    assert admin_client.get("/api/cart").status_code == 403
    assert add(admin_client, product).status_code == 403
    assert admin_client.patch("/api/cart/items/1", json={"quantity": 1}).status_code == 403
    assert admin_client.delete("/api/cart/items/1").status_code == 403
    assert admin_client.delete("/api/cart").status_code == 403


def test_first_get_creates_empty_cart(customer_client, db, customer):
    body = customer_client.get("/api/cart").json()
    assert body["items"] == [] and body["total"] == "0.00" and body["item_count"] == 0
    assert db.scalar(select(func.count()).select_from(Cart).where(Cart.user_id == customer.id)) == 1
    assert customer_client.get("/api/cart").json()["id"] == body["id"]


def test_add_item_returns_201_and_totals(customer_client, db):
    a = make_product(db, price="10.50", stock=10)
    b = make_product(db, price="3.25", stock=10)
    assert add(customer_client, a, 2).status_code == 201
    response = add(customer_client, b, 1)
    assert response.status_code == 201
    body = response.json()
    assert [i["subtotal"] for i in body["items"]] == ["21.00", "3.25"]
    assert body["total"] == "24.25" and body["item_count"] == 3
    assert body["items"][0]["product"]["id"] == a.id
    assert body["items"][0]["available"] is True


def test_add_default_quantity_is_one(customer_client, db):
    product = make_product(db)
    assert add(customer_client, product).json()["item_count"] == 1


def test_add_same_product_sums_quantity(customer_client, db):
    product = make_product(db, stock=10)
    add(customer_client, product, 2)
    body = add(customer_client, product, 3).json()
    assert len(body["items"]) == 1 and body["items"][0]["quantity"] == 5


def test_add_validation_errors(customer_client, db):
    product = make_product(db)
    assert add(customer_client, product, 0).status_code == 422
    assert add(customer_client, product, -1).status_code == 422
    assert (
        customer_client.post(
            "/api/cart/items", json={"product_id": product.id, "quantity": 1.5}
        ).status_code
        == 422
    )
    assert customer_client.post("/api/cart/items", json={}).status_code == 422


def test_add_unknown_or_inactive_product_is_404(customer_client, db):
    inactive = make_product(db, is_active=False)
    assert customer_client.post("/api/cart/items", json={"product_id": 999999}).status_code == 404
    assert add(customer_client, inactive).status_code == 404


def test_add_out_of_stock_is_409(customer_client, db):
    product = make_product(db, stock=0)
    response = add(customer_client, product)
    assert response.status_code == 409
    assert "Sin stock" in response.json()["detail"]


def test_add_over_stock_is_409_and_cart_unchanged(customer_client, db):
    product = make_product(db, stock=3)
    add(customer_client, product, 2)
    response = add(customer_client, product, 2)
    assert response.status_code == 409
    assert "3 unidades disponibles" in response.json()["detail"]
    assert customer_client.get("/api/cart").json()["item_count"] == 2


def test_update_quantity(customer_client, db):
    product = make_product(db, price="2.00", stock=10)
    item_id = add(customer_client, product, 1).json()["items"][0]["id"]
    response = customer_client.patch(f"/api/cart/items/{item_id}", json={"quantity": 4})
    assert response.status_code == 200
    body = response.json()
    assert body["items"][0]["quantity"] == 4 and body["total"] == "8.00"


def test_update_validation_and_stock_limit(customer_client, db):
    product = make_product(db, stock=3)
    item_id = add(customer_client, product, 1).json()["items"][0]["id"]
    assert (
        customer_client.patch(f"/api/cart/items/{item_id}", json={"quantity": 0}).status_code == 422
    )
    response = customer_client.patch(f"/api/cart/items/{item_id}", json={"quantity": 4})
    assert response.status_code == 409
    assert "3 unidades disponibles" in response.json()["detail"]
    assert customer_client.get("/api/cart").json()["items"][0]["quantity"] == 1


def test_update_and_delete_unknown_item_is_404(customer_client):
    assert customer_client.patch("/api/cart/items/999999", json={"quantity": 1}).status_code == 404
    assert customer_client.delete("/api/cart/items/999999").status_code == 404


def test_remove_item(customer_client, db):
    a = make_product(db)
    b = make_product(db)
    item_id = add(customer_client, a).json()["items"][0]["id"]
    add(customer_client, b)
    response = customer_client.delete(f"/api/cart/items/{item_id}")
    assert response.status_code == 200
    assert [i["product"]["id"] for i in response.json()["items"]] == [b.id]


def test_clear_cart_keeps_cart(customer_client, db):
    product = make_product(db)
    add(customer_client, product, 2)
    cart_id = customer_client.get("/api/cart").json()["id"]
    response = customer_client.delete("/api/cart")
    assert response.status_code == 200 and response.json()["items"] == []
    assert response.json()["total"] == "0.00"
    assert customer_client.get("/api/cart").json()["id"] == cart_id


def test_customers_only_touch_their_own_cart(customer_client, db):
    product = make_product(db, stock=10)
    other = make_user(db, "otro@test.com")
    other_client = new_client(db)
    login(other_client, other.email, CUSTOMER_PASSWORD)
    other_item = add(other_client, product, 1).json()["items"][0]["id"]
    # los clientes comparten la sesión de test: se vuelve a autenticar al cliente original
    mine = new_client(db)
    login(mine, "cliente@test.com", CUSTOMER_PASSWORD)
    assert mine.patch(f"/api/cart/items/{other_item}", json={"quantity": 2}).status_code == 404
    assert mine.delete(f"/api/cart/items/{other_item}").status_code == 404
    assert mine.get("/api/cart").json()["items"] == []
    assert db.get(CartItem, other_item).quantity == 1


def test_cart_persists_across_sessions(customer_client, db, customer):
    product = make_product(db)
    add(customer_client, product, 2)
    customer_client.post("/api/auth/logout")
    fresh = new_client(db)
    login(fresh, customer.email, CUSTOMER_PASSWORD)
    items = fresh.get("/api/cart").json()["items"]
    assert len(items) == 1 and items[0]["quantity"] == 2


def test_cart_does_not_reserve_stock(customer_client, db):
    product = make_product(db, stock=5)
    add(customer_client, product, 2)
    db.refresh(product)
    assert product.stock == 5


def test_deactivated_product_is_flagged_and_removable(customer_client, admin_client, db):
    product = make_product(db, stock=5)
    item_id = add(customer_client, product, 1).json()["items"][0]["id"]
    db.get(Product, product.id).is_active = False
    db.commit()
    body = customer_client.get("/api/cart").json()
    assert body["items"][0]["available"] is False
    assert customer_client.delete(f"/api/cart/items/{item_id}").json()["items"] == []
