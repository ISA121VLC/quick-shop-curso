from sqlalchemy import select

from app.core.security import verify_password
from app.models.user import Role, User
from tests.conftest import ADMIN_PASSWORD, CUSTOMER_PASSWORD, make_user, new_client


def test_get_me(customer_client, customer):
    response = customer_client.get("/api/users/me")
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == customer.email
    assert "password_hash" not in body


def test_endpoints_require_auth(client):
    assert client.get("/api/users/me").status_code == 401
    assert client.patch("/api/users/me", json={"full_name": "X"}).status_code == 401
    assert client.post("/api/users/me/password", json={}).status_code == 401


def test_patch_me_updates_name_and_updated_at(customer_client, customer, db):
    before = customer.updated_at
    response = customer_client.patch("/api/users/me", json={"full_name": "  Nombre Nuevo "})
    assert response.status_code == 200
    assert response.json()["full_name"] == "Nombre Nuevo"
    db.refresh(customer)
    assert customer.updated_at > before


def test_patch_me_ignores_email_and_role(customer_client, customer, db):
    response = customer_client.patch(
        "/api/users/me", json={"full_name": "Otro", "email": "x@y.com", "role": "admin"}
    )
    assert response.status_code == 200
    db.refresh(customer)
    assert customer.email == "cliente@test.com"
    assert customer.role == Role.CUSTOMER


def test_patch_me_validation(customer_client):
    assert customer_client.patch("/api/users/me", json={"full_name": ""}).status_code == 422
    assert customer_client.patch("/api/users/me", json={"full_name": "x" * 121}).status_code == 422


def test_change_password_success(customer_client, customer, db):
    response = customer_client.post(
        "/api/users/me/password",
        json={"current_password": CUSTOMER_PASSWORD, "new_password": "Nueva1234!"},
    )
    assert response.status_code == 204
    db.refresh(customer)
    assert verify_password("Nueva1234!", customer.password_hash)
    assert customer.password_hash.startswith("$2")
    other = new_client(db)
    assert (
        other.post(
            "/api/auth/login", json={"email": customer.email, "password": CUSTOMER_PASSWORD}
        ).status_code
        == 401
    )
    assert (
        other.post(
            "/api/auth/login", json={"email": customer.email, "password": "Nueva1234!"}
        ).status_code
        == 200
    )


def test_change_password_wrong_current(customer_client):
    response = customer_client.post(
        "/api/users/me/password",
        json={"current_password": "Incorrecta1!", "new_password": "Nueva1234!"},
    )
    assert response.status_code == 400


def test_change_password_weak_new(customer_client):
    response = customer_client.post(
        "/api/users/me/password",
        json={"current_password": CUSTOMER_PASSWORD, "new_password": "debil"},
    )
    assert response.status_code == 422


def test_list_users_admin_paginated(admin_client, db):
    for i in range(5):
        make_user(db, f"c{i}@test.com", full_name=f"Cliente {i}")
    response = admin_client.get("/api/users", params={"page": 1, "page_size": 2})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 6
    assert body["page"] == 1 and body["page_size"] == 2
    assert len(body["items"]) == 2
    assert all("password_hash" not in item for item in body["items"])
    page3 = admin_client.get("/api/users", params={"page": 3, "page_size": 2}).json()
    assert len(page3["items"]) == 2


def test_list_users_filters(admin_client, db):
    make_user(db, "ana@mail.com", full_name="Ana Lopez")
    make_user(db, "luis@mail.com", full_name="Luis Perez")
    body = admin_client.get("/api/users", params={"role": "customer"}).json()
    assert body["total"] == 2
    assert {u["role"] for u in body["items"]} == {"customer"}
    body = admin_client.get("/api/users", params={"q": "lopez"}).json()
    assert [u["email"] for u in body["items"]] == ["ana@mail.com"]
    body = admin_client.get("/api/users", params={"q": "luis@"}).json()
    assert body["total"] == 1
    body = admin_client.get("/api/users", params={"q": "%"}).json()
    assert body["total"] == 0


def test_list_users_page_size_limit(admin_client):
    assert admin_client.get("/api/users", params={"page_size": 101}).status_code == 422
    assert admin_client.get("/api/users", params={"page": 0}).status_code == 422


def test_get_user_by_id(admin_client, customer):
    assert admin_client.get(f"/api/users/{customer.id}").json()["email"] == customer.email
    assert admin_client.get("/api/users/999999").status_code == 404


def test_customer_cannot_query_users(customer_client, admin):
    assert customer_client.get("/api/users").status_code == 403
    assert customer_client.get(f"/api/users/{admin.id}").status_code == 403


def test_email_unique_case_insensitive_in_db(db):
    import pytest
    from sqlalchemy.exc import IntegrityError

    make_user(db, "ana@x.com")
    with pytest.raises(IntegrityError):
        make_user(db, "Ana@x.com")
    db.rollback()


def test_no_public_endpoint_creates_admin(client, db):
    client.post(
        "/api/auth/register",
        json={"email": "a@b.com", "password": "Valida123!", "full_name": "A", "role": "admin"},
    )
    admins = db.scalars(select(User).where(User.role == Role.ADMIN)).all()
    assert admins == []
    assert ADMIN_PASSWORD
