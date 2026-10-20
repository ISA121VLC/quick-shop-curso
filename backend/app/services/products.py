from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.user import Role, User
from app.schemas.product import ProductCreate, ProductPatch
from app.services.users import like_pattern


def list_products(
    db: Session,
    user: User,
    page: int,
    page_size: int,
    q: str | None,
    in_stock: bool | None,
    include_inactive: bool,
) -> tuple[list[Product], int]:
    stmt = select(Product)
    if not (include_inactive and user.role == Role.ADMIN):
        stmt = stmt.where(Product.is_active.is_(True))
    if q:
        stmt = stmt.where(Product.name.ilike(like_pattern(q.strip()), escape="\\"))
    if in_stock:
        stmt = stmt.where(Product.stock > 0)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(
        stmt.order_by(Product.id).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return list(items), total


def get_product(db: Session, user: User, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None or (not product.is_active and user.role != Role.ADMIN):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Producto no encontrado")
    return product


def create_product(db: Session, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def replace_product(db: Session, product_id: int, data: ProductCreate) -> Product:
    product = _get_any(db, product_id)
    for field, value in data.model_dump().items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def patch_product(db: Session, product_id: int, data: ProductPatch) -> Product:
    product = _get_any(db, product_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def deactivate_product(db: Session, product_id: int) -> None:
    product = _get_any(db, product_id)
    product.is_active = False
    db.commit()


def _get_any(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Producto no encontrado")
    return product
