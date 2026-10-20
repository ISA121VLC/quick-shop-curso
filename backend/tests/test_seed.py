import json

from sqlalchemy import func, select

from app.core.security import verify_password
from app.db.seed import run_seed
from app.models.product import Product
from app.models.user import Role, User


def test_seed_creates_users_and_products(db, settings):
    run_seed(db, settings)
    admins = db.scalars(select(User).where(User.role == Role.ADMIN)).all()
    customers = db.scalars(select(User).where(User.role == Role.CUSTOMER)).all()
    assert [a.email for a in admins] == ["admin@quickshop.com"]
    assert sorted(c.email for c in customers) == [
        "cliente1@quickshop.com",
        "cliente2@quickshop.com",
    ]
    assert verify_password(settings.SEED_ADMIN_PASSWORD, admins[0].password_hash)
    assert db.scalar(select(func.count()).select_from(Product)) == 20


def test_seed_products_match_json(db, settings):
    run_seed(db, settings)
    data = json.loads(open(settings.SEED_PRODUCTS_FILE, encoding="utf-8").read())
    assert len(data) == 20
    first = db.scalars(select(Product).order_by(Product.id)).first()
    assert first.name == data[0]["producto"]
    assert first.description == data[0]["descripcion"]
    assert str(first.price) == data[0]["precio"]
    assert first.stock == data[0]["stock"]
    assert first.image_url == data[0]["imagen"]


def test_seed_is_idempotent(db, settings):
    run_seed(db, settings)
    run_seed(db, settings)
    assert db.scalar(select(func.count()).select_from(User)) == 3
    assert db.scalar(select(func.count()).select_from(Product)) == 20
