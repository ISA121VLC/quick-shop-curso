from decimal import Decimal

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.product import Product

VALID = {"name": "Lámpara", "description": "LED", "price": "19.90", "stock": 5}


def make_product(db, name="Producto", price="10.00", stock=3, is_active=True):
    product = Product(
        name=name, description="", price=Decimal(price), stock=stock, is_active=is_active
    )
    db.add(product)
    db.commit()
    return product


def test_db_rejects_zero_price_and_negative_stock(db):
    with pytest.raises(IntegrityError):
        make_product(db, price="0")
    db.rollback()
    with pytest.raises(IntegrityError):
        make_product(db, stock=-1)
    db.rollback()


def test_requires_auth(client):
    assert client.get("/api/products").status_code == 401
    assert client.get("/api/products/1").status_code == 401
    assert client.post("/api/products", json=VALID).status_code == 401


def test_list_defaults_and_serialization(customer_client, db):
    make_product(db, price="1299.9")
    body = customer_client.get("/api/products").json()
    assert body["page"] == 1 and body["page_size"] == 12 and body["total"] == 1
    assert body["items"][0]["price"] == "1299.90"


def test_list_pagination(customer_client, db):
    for i in range(15):
        make_product(db, name=f"P{i}")
    body = customer_client.get("/api/products").json()
    assert len(body["items"]) == 12 and body["total"] == 15
    body = customer_client.get("/api/products", params={"page": 2}).json()
    assert len(body["items"]) == 3


def test_list_search_and_in_stock(customer_client, db):
    make_product(db, name="Laptop Pro", stock=2)
    make_product(db, name="Laptop Vieja", stock=0)
    make_product(db, name="Ratón", stock=9)
    body = customer_client.get("/api/products", params={"q": "laptop"}).json()
    assert body["total"] == 2
    body = customer_client.get("/api/products", params={"q": "laptop", "in_stock": True}).json()
    assert body["total"] == 1
    assert body["items"][0]["name"] == "Laptop Pro"


def test_out_of_stock_product_is_listed(customer_client, db):
    make_product(db, stock=0)
    items = customer_client.get("/api/products").json()["items"]
    assert items[0]["stock"] == 0


def test_list_invalid_params(customer_client):
    assert customer_client.get("/api/products", params={"page_size": 101}).status_code == 422
    assert customer_client.get("/api/products", params={"page": 0}).status_code == 422


def test_inactive_hidden_from_customer_even_with_flag(customer_client, db):
    make_product(db, name="Activo")
    inactive = make_product(db, name="Inactivo", is_active=False)
    body = customer_client.get("/api/products", params={"include_inactive": True}).json()
    assert [p["name"] for p in body["items"]] == ["Activo"]
    assert customer_client.get(f"/api/products/{inactive.id}").status_code == 404


def test_admin_sees_inactive_with_flag(admin_client, db):
    make_product(db, name="Activo")
    inactive = make_product(db, name="Inactivo", is_active=False)
    assert admin_client.get("/api/products").json()["total"] == 1
    body = admin_client.get("/api/products", params={"include_inactive": True}).json()
    assert body["total"] == 2
    assert admin_client.get(f"/api/products/{inactive.id}").status_code == 200


def test_get_product_detail_and_404(customer_client, db):
    product = make_product(db, name="Detalle")
    body = customer_client.get(f"/api/products/{product.id}").json()
    assert body["name"] == "Detalle"
    assert {"created_at", "updated_at", "is_active", "image_url"} <= body.keys()
    assert customer_client.get("/api/products/999999").status_code == 404


def test_create_product(admin_client):
    response = admin_client.post("/api/products", json=VALID)
    assert response.status_code == 201
    body = response.json()
    assert body["price"] == "19.90" and body["is_active"] is True and body["image_url"] is None


@pytest.mark.parametrize(
    "override",
    [
        {"price": "0"},
        {"price": "-1"},
        {"price": "10.999"},
        {"price": 12.345},
        {"price": "abc"},
        {"price": "99999999999.00"},
        {"stock": -1},
        {"stock": 1.5},
        {"name": ""},
    ],
)
def test_create_validation(admin_client, override):
    assert admin_client.post("/api/products", json={**VALID, **override}).status_code == 422


def test_create_missing_fields(admin_client):
    assert admin_client.post("/api/products", json={"name": "x"}).status_code == 422


def test_customer_cannot_write(customer_client, db):
    product = make_product(db)
    assert customer_client.post("/api/products", json=VALID).status_code == 403
    assert customer_client.put(f"/api/products/{product.id}", json=VALID).status_code == 403
    assert (
        customer_client.patch(f"/api/products/{product.id}", json={"stock": 1}).status_code == 403
    )
    assert customer_client.delete(f"/api/products/{product.id}").status_code == 403


def test_put_replaces_all(admin_client, db):
    product = make_product(db, name="Viejo", stock=1)
    response = admin_client.put(f"/api/products/{product.id}", json=VALID)
    assert response.status_code == 200
    assert response.json()["name"] == "Lámpara" and response.json()["stock"] == 5
    assert admin_client.put("/api/products/999999", json=VALID).status_code == 404
    assert (
        admin_client.put(f"/api/products/{product.id}", json={**VALID, "price": "0"}).status_code
        == 422
    )


def test_patch_subset(admin_client, db):
    product = make_product(db, name="Parcial", price="10.00", stock=4)
    response = admin_client.patch(f"/api/products/{product.id}", json={"stock": 0})
    assert response.status_code == 200
    body = response.json()
    assert body["stock"] == 0 and body["name"] == "Parcial" and body["price"] == "10.00"
    assert admin_client.patch("/api/products/999999", json={"stock": 1}).status_code == 404


def test_patch_validation(admin_client, db):
    product = make_product(db)
    url = f"/api/products/{product.id}"
    assert admin_client.patch(url, json={"price": "0"}).status_code == 422
    assert admin_client.patch(url, json={"stock": -1}).status_code == 422
    assert admin_client.patch(url, json={"price": None}).status_code == 422
    assert admin_client.patch(url, json={"image_url": None}).status_code == 200


def test_delete_is_logical(admin_client, customer_client, db):
    product = make_product(db)
    assert admin_client.delete(f"/api/products/{product.id}").status_code == 204
    db.refresh(product)
    assert product.is_active is False
    assert customer_client.get(f"/api/products/{product.id}").status_code == 404
    assert admin_client.delete("/api/products/999999").status_code == 404
