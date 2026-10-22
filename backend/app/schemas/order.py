from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, computed_field, field_serializer, field_validator

from app.models.order import OrderStatus

CENT = Decimal("0.01")


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    product_name: str
    unit_price: Decimal
    quantity: int

    @computed_field
    @property
    def subtotal(self) -> Decimal:
        return (self.unit_price * self.quantity).quantize(CENT)

    @field_serializer("unit_price", "subtotal")
    def serialize_amount(self, value: Decimal) -> str:
        return f"{value:.2f}"


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: OrderStatus
    total: Decimal
    items: list[OrderItemOut]
    created_at: datetime
    updated_at: datetime

    @field_serializer("total")
    def serialize_total(self, value: Decimal) -> str:
        return f"{value:.2f}"


class OrderStatusUpdate(BaseModel):
    status: OrderStatus

    @field_validator("status")
    @classmethod
    def reject_pending(cls, value: OrderStatus) -> OrderStatus:
        if value == OrderStatus.PENDING:
            raise ValueError("El estado debe ser confirmed, shipped, delivered o cancelled")
        return value
