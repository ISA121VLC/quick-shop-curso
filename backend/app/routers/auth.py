from fastapi import APIRouter, Response, status

from app.core.config import get_settings
from app.core.deps import COOKIE_NAME, CurrentUser, DbSession
from app.core.security import create_access_token
from app.schemas.user import LoginIn, RegisterIn, UserOut
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterIn, db: DbSession):
    return auth_service.register_customer(db, data)


@router.post("/login", response_model=UserOut)
def login(data: LoginIn, response: Response, db: DbSession):
    settings = get_settings()
    user = auth_service.authenticate(db, data.email, data.password)
    response.set_cookie(
        COOKIE_NAME,
        create_access_token(user.id, user.role.value),
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        path="/",
    )
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    response.delete_cookie(
        COOKIE_NAME,
        httponly=True,
        samesite="lax",
        secure=get_settings().COOKIE_SECURE,
        path="/",
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user
