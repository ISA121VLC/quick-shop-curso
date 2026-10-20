from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import Role, User
from app.schemas.user import PasswordChangeIn, UserUpdate


def like_pattern(term: str) -> str:
    escaped = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def update_profile(db: Session, user: User, data: UserUpdate) -> User:
    if data.full_name is not None and data.full_name != user.full_name:
        user.full_name = data.full_name
        db.commit()
        db.refresh(user)
    return user


def change_password(db: Session, user: User, data: PasswordChangeIn) -> None:
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La contraseña actual es incorrecta")
    user.password_hash = hash_password(data.new_password)
    db.commit()


def list_users(
    db: Session, page: int, page_size: int, role: Role | None, q: str | None
) -> tuple[list[User], int]:
    stmt = select(User)
    if role is not None:
        stmt = stmt.where(User.role == role)
    if q:
        pattern = like_pattern(q.strip())
        stmt = stmt.where(
            or_(User.email.ilike(pattern, escape="\\"), User.full_name.ilike(pattern, escape="\\"))
        )
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(stmt.order_by(User.id).offset((page - 1) * page_size).limit(page_size)).all()
    return list(items), total


def get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
    return user
