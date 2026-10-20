from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import Role, User
from app.schemas.user import RegisterIn

# Hash de relleno para igualar el coste cuando el email no existe
_DUMMY_HASH = hash_password("Relleno-1234!")


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.email) == email.lower()))


def register_customer(db: Session, data: RegisterIn) -> User:
    if get_user_by_email(db, data.email) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "El email ya está registrado")
    user = User(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=Role.CUSTOMER,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "El email ya está registrado") from None
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if user is None:
        verify_password(password, _DUMMY_HASH)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales inválidas")
    if not verify_password(password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales inválidas")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Usuario inactivo")
    return user
