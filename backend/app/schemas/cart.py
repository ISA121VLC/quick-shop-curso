from decimal import Decimal

from pydantic import BaseModel, Field, field_serializer

from app.schemas.product import ProductOut


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemOut(BaseModel):
    id: int
    product: ProductOut
    quantity: int
    subtotal: Decimal
    available: bool

    @field_serializer("subtotal")
    def serialize_subtotal(self, value: Decimal) -> str:
        return f"{value:.2f}"


class CartOut(BaseModel):
    id: int
    items: list[CartItemOut]
    total: Decimal
    item_count: int

    @field_serializer("total")
    def serialize_total(self, value: Decimal) -> str:
        return f"{value:.2f}"
