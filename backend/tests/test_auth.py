from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.core.security import create_access_token
from app.models.user import Role, User
from tests.conftest import CUSTOMER_PASSWORD, login, make_user, new_client

REGISTER = {"email": "nuevo@test.com", "password": "Valida123!", "full_name": "Nuevo Usuario"}


def test_register_creates_customer_without_session(client, db):
    response = client.post("/api/auth/register", json=REGISTER)
    assert response.status_code == 201
    body = response.json()
    assert body["role"] == "customer"
    assert body["email"] == "nuevo@test.com"
    assert "password" not in body and "password_hash" not in body
    assert "set-cookie" not in response.headers
    assert client.get("/api/auth/me").status_code == 401
    stored = db.scalar(select(User).where(User.email == "nuevo@test.com"))
    assert stored.password_hash.startswith("$2")


def test_register_ignores_role_field(client, db):
    response = client.post("/api/auth/register", json={**REGISTER, "role": "admin"})
    assert response.status_code == 201
    assert response.json()["role"] == "customer"


def test_register_duplicate_email_case_insensitive(client):
    assert client.post("/api/auth/register", json=REGISTER).status_code == 201
    duplicate = {**REGISTER, "email": "NUEVO@Test.com"}
    assert client.post("/api/auth/register", json=duplicate).status_code == 409


def test_register_validation_errors(client):
    invalid = [
        {"password": "debil"},
        {"email": "no-es-email"},
        {"full_name": ""},
        {"full_name": "x" * 121},
    ]
    for override in invalid:
        response = client.post("/api/auth/register", json={**REGISTER, **override})
        assert response.status_code == 422, override


def test_login_sets_httponly_cookie_and_hides_token(client, customer):
    response = client.post(
        "/api/auth/login", json={"email": customer.email, "password": CUSTOMER_PASSWORD}
    )
    assert response.status_code == 200
    cookie = response.headers["set-cookie"]
    assert "access_token=" in cookie
    assert "HttpOnly" in cookie
    assert "Max-Age=7200" in cookie
    assert "SameSite=lax" in cookie
    token = client.cookies.get("access_token")
    assert token not in response.text
    assert response.json()["email"] == customer.email


def test_login_same_error_for_unknown_email_and_wrong_password(client, customer):
    wrong_password = client.post(
        "/api/auth/login", json={"email": customer.email, "password": "Incorrecta1!"}
    )
    unknown = client.post(
        "/api/auth/login", json={"email": "nadie@test.com", "password": "Incorrecta1!"}
    )
    assert wrong_password.status_code == unknown.status_code == 401
    assert wrong_password.json() == unknown.json()


def test_login_email_is_case_insensitive(client, customer):
    response = client.post(
        "/api/auth/login", json={"email": customer.email.upper(), "password": CUSTOMER_PASSWORD}
    )
    assert response.status_code == 200


def test_login_inactive_user_forbidden(client, db):
    make_user(db, "inactivo@test.com", is_active=False)
    response = client.post(
        "/api/auth/login", json={"email": "inactivo@test.com", "password": CUSTOMER_PASSWORD}
    )
    assert response.status_code == 403


def test_login_validation_error(client):
    assert client.post("/api/auth/login", json={"email": "x"}).status_code == 422


def test_me_returns_current_user(customer_client, customer):
    response = customer_client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["id"] == customer.id


def test_me_without_token_is_401(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_expired_token_is_401(client, customer):
    token = create_access_token(
        customer.id, "customer", now=datetime.now(UTC) - timedelta(hours=2, minutes=1)
    )
    client.cookies.set("access_token", token)
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_tampered_token_is_401(client, customer):
    client.cookies.set("access_token", create_access_token(customer.id, "customer") + "x")
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_deactivated_user_is_403(customer_client, customer, db):
    customer.is_active = False
    db.commit()
    assert customer_client.get("/api/auth/me").status_code == 403


def test_role_comes_from_database_not_token(client, customer):
    token = create_access_token(customer.id, "admin")
    client.cookies.set("access_token", token)
    assert client.get("/api/users").status_code == 403


def test_logout_invalidates_session(customer_client):
    response = customer_client.post("/api/auth/logout")
    assert response.status_code == 204
    assert "Max-Age=0" in response.headers["set-cookie"]
    assert customer_client.get("/api/auth/me").status_code == 401


def test_logout_without_session_is_204(client):
    assert client.post("/api/auth/logout").status_code == 204


def test_customer_cannot_use_admin_endpoint(customer_client):
    assert customer_client.get("/api/users").status_code == 403


def test_unauthenticated_admin_endpoint_is_401(client):
    assert client.get("/api/users").status_code == 401


def test_require_customer_and_admin_dependencies(db, admin, customer):
    import pytest
    from fastapi import HTTPException

    from app.core.deps import require_admin, require_customer

    assert require_admin(admin) is admin
    assert require_customer(customer) is customer
    with pytest.raises(HTTPException) as exc:
        require_customer(admin)
    assert exc.value.status_code == 403
    with pytest.raises(HTTPException) as exc:
        require_admin(customer)
    assert exc.value.status_code == 403
    assert admin.role == Role.ADMIN


def test_two_sessions_are_independent(db, customer, admin):
    c1 = new_client(db)
    c2 = new_client(db)
    login(c1, customer.email, CUSTOMER_PASSWORD)
    assert c1.get("/api/auth/me").status_code == 200
    assert c2.get("/api/auth/me").status_code == 401
