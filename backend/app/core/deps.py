from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import Role, User

COOKIE_NAME = "access_token"

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    access_token: Annotated[str | None, Cookie(alias=COOKIE_NAME)] = None,
) -> User:
    unauthorized = HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado")
    if not access_token:
        raise unauthorized
    payload = decode_access_token(access_token)
    if payload is None:
        raise unauthorized
    try:
        user_id = int(payload["sub"])
    except (KeyError, ValueError):
        raise unauthorized from None
    user = db.get(User, user_id)
    if user is None:
        raise unauthorized
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Usuario inactivo")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_admin(user: CurrentUser) -> User:
    if user.role != Role.ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Se requiere rol de administrador")
    return user


def require_customer(user: CurrentUser) -> User:
    if user.role != Role.CUSTOMER:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Se requiere rol de cliente")
    return user


AdminUser = Annotated[User, Depends(require_admin)]
CustomerUser = Annotated[User, Depends(require_customer)]
