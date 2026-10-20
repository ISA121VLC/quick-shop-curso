from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, StringConstraints

from app.core.security import validate_password_strength
from app.models.user import Role

FullName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
StrongPassword = Annotated[str, AfterValidator(validate_password_strength)]


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: Role
    is_active: bool
    created_at: datetime


class RegisterIn(BaseModel):
    email: EmailStr
    password: StrongPassword
    full_name: FullName


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: FullName | None = None


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: StrongPassword
