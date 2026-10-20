from typing import Annotated

from fastapi import APIRouter, Query, Response, status

from app.core.deps import AdminUser, CurrentUser, DbSession
from app.models.user import Role
from app.schemas.common import Page
from app.schemas.user import PasswordChangeIn, UserOut, UserUpdate
from app.services import users as users_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(user: CurrentUser):
    return user


@router.patch("/me", response_model=UserOut)
def update_me(data: UserUpdate, user: CurrentUser, db: DbSession):
    return users_service.update_profile(db, user, data)


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_my_password(data: PasswordChangeIn, user: CurrentUser, db: DbSession):
    users_service.change_password(db, user, data)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("", response_model=Page[UserOut])
def list_users(
    _admin: AdminUser,
    db: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    role: Role | None = None,
    q: str | None = None,
):
    items, total = users_service.list_users(db, page, page_size, role, q)
    return Page[UserOut](items=items, total=total, page=page, page_size=page_size)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, _admin: AdminUser, db: DbSession):
    return users_service.get_user(db, user_id)
