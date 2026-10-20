import os
from pathlib import Path

TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://quickshop:testpass@localhost:55432/quickshop_test",
)
os.environ["DATABASE_URL"] = TEST_DB_URL
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-pytest-only-0123456789")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
os.environ["SEED_PRODUCTS_FILE"] = str(
    Path(__file__).resolve().parents[2] / "docs" / "products-images.json"
)
os.environ.setdefault("SEED_ADMIN_EMAIL", "admin@quickshop.com")
os.environ.setdefault("SEED_ADMIN_PASSWORD", "Admin1234!")
os.environ.setdefault("SEED_CUSTOMER_PASSWORD", "Cliente1234!")

import pytest  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from alembic import command  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.db.session import get_db, get_engine  # noqa: E402
from app.db.startup import ALEMBIC_INI  # noqa: E402
from app.main import app  # noqa: E402
from app.models.user import Role, User  # noqa: E402

CUSTOMER_PASSWORD = "Cliente1234!"
ADMIN_PASSWORD = "Admin1234!"


@pytest.fixture(scope="session", autouse=True)
def _migrated_database():
    engine = get_engine()
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    command.upgrade(Config(str(ALEMBIC_INI)), "head")
    yield
    engine.dispose()


@pytest.fixture
def db():
    """Sesión dentro de una transacción externa que se revierte al terminar el test."""
    connection = get_engine().connect()
    outer = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    yield session
    session.close()
    outer.rollback()
    connection.close()


@pytest.fixture
def settings():
    return get_settings()


def make_user(db, email, role=Role.CUSTOMER, password=CUSTOMER_PASSWORD, **extra):
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=extra.pop("full_name", "Usuario Test"),
        role=role,
        **extra,
    )
    db.add(user)
    db.commit()
    return user


def new_client(db):
    # Sin "with": no se ejecuta el lifespan (migraciones y seed) en los tests
    app.dependency_overrides[get_db] = lambda: db
    return TestClient(app)


def login(client, email, password):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response


@pytest.fixture
def client(db):
    yield new_client(db)
    app.dependency_overrides.clear()


@pytest.fixture
def customer(db):
    return make_user(db, "cliente@test.com")


@pytest.fixture
def admin(db):
    return make_user(db, "admin@test.com", role=Role.ADMIN, password=ADMIN_PASSWORD)


@pytest.fixture
def customer_client(db, customer):
    c = new_client(db)
    login(c, customer.email, CUSTOMER_PASSWORD)
    yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_client(db, admin):
    c = new_client(db)
    login(c, admin.email, ADMIN_PASSWORD)
    yield c
    app.dependency_overrides.clear()
