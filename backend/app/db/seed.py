import json
from decimal import Decimal
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import hash_password
from app.models.product import Product
from app.models.user import Role, User

SEED_ADMIN_NAME = "Administrador"
SEED_CUSTOMERS = (
    ("cliente1@quickshop.com", "Cliente Uno"),
    ("cliente2@quickshop.com", "Cliente Dos"),
)


def seed_users(db: Session, settings: Settings) -> None:
    if db.scalar(select(User.id).limit(1)) is not None:
        return
    db.add(
        User(
            email=settings.SEED_ADMIN_EMAIL.lower(),
            password_hash=hash_password(settings.SEED_ADMIN_PASSWORD),
            full_name=SEED_ADMIN_NAME,
            role=Role.ADMIN,
        )
    )
    customer_hash = hash_password(settings.SEED_CUSTOMER_PASSWORD)
    for email, name in SEED_CUSTOMERS:
        db.add(User(email=email, password_hash=customer_hash, full_name=name, role=Role.CUSTOMER))
    db.commit()


def seed_products(db: Session, settings: Settings) -> None:
    if db.scalar(select(Product.id).limit(1)) is not None:
        return
    items = json.loads(Path(settings.SEED_PRODUCTS_FILE).read_text(encoding="utf-8"))
    for item in items:
        db.add(
            Product(
                name=item["producto"],
                description=item["descripcion"],
                price=Decimal(item["precio"]),
                stock=item["stock"],
                image_url=item["imagen"],
            )
        )
    db.commit()


def run_seed(db: Session, settings: Settings) -> None:
    seed_users(db, settings)
    seed_products(db, settings)
