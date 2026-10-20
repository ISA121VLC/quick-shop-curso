from datetime import datetime
from decimal import Decimal
from typing import Annotated, Self

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_serializer,
    model_validator,
)

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
Price = Annotated[Decimal, Field(gt=0, max_digits=10, decimal_places=2, allow_inf_nan=False)]


class ProductBase(BaseModel):
    name: Name
    description: str = ""
    price: Price
    stock: int = Field(ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductPatch(BaseModel):
    name: Name | None = None
    description: str | None = None
    price: Price | None = None
    stock: int | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None

    @model_validator(mode="after")
    def reject_null_required(self) -> Self:
        for field in ("name", "description", "price", "stock", "is_active"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} no admite null")
        return self


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    price: Decimal
    stock: int
    image_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer("price")
    def serialize_price(self, value: Decimal) -> str:
        return f"{value:.2f}"
