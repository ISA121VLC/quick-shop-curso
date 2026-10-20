from typing import Annotated

from fastapi import APIRouter, Query, Response, status

from app.core.deps import AdminUser, CurrentUser, DbSession
from app.schemas.common import Page
from app.schemas.product import ProductCreate, ProductOut, ProductPatch
from app.services import products as products_service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=Page[ProductOut])
def list_products(
    user: CurrentUser,
    db: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 12,
    q: str | None = None,
    in_stock: bool | None = None,
    include_inactive: bool = False,
):
    items, total = products_service.list_products(
        db, user, page, page_size, q, in_stock, include_inactive
    )
    return Page[ProductOut](items=items, total=total, page=page, page_size=page_size)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, user: CurrentUser, db: DbSession):
    return products_service.get_product(db, user, product_id)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductCreate, _admin: AdminUser, db: DbSession):
    return products_service.create_product(db, data)


@router.put("/{product_id}", response_model=ProductOut)
def replace_product(product_id: int, data: ProductCreate, _admin: AdminUser, db: DbSession):
    return products_service.replace_product(db, product_id, data)


@router.patch("/{product_id}", response_model=ProductOut)
def patch_product(product_id: int, data: ProductPatch, _admin: AdminUser, db: DbSession):
    return products_service.patch_product(db, product_id, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, _admin: AdminUser, db: DbSession):
    products_service.deactivate_product(db, product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
