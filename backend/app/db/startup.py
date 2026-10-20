from pathlib import Path

from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.orm import Session

from alembic import command
from app.core.config import Settings
from app.db.seed import run_seed
from app.db.session import get_engine

ALEMBIC_INI = Path(__file__).resolve().parents[2] / "alembic.ini"
STARTUP_LOCK_ID = 7_410_001


def run_migrations() -> None:
    command.upgrade(Config(str(ALEMBIC_INI)), "head")


def init_database(settings: Settings) -> None:
    """Migra y siembra bajo un advisory lock para evitar carreras entre instancias."""
    engine = get_engine()
    with engine.connect() as lock_conn:
        lock_conn.execute(text("SELECT pg_advisory_lock(:id)"), {"id": STARTUP_LOCK_ID})
        try:
            run_migrations()
            with Session(engine) as db:
                run_seed(db, settings)
        finally:
            lock_conn.execute(text("SELECT pg_advisory_unlock(:id)"), {"id": STARTUP_LOCK_ID})
            lock_conn.commit()
