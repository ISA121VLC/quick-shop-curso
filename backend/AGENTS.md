# Backend QuickShop

API REST con Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic y PostgreSQL 15. Convenciones generales en `../AGENTS.md`; contratos en `../docs/specs-prds/`.

## Comandos (uv)

```
uv sync                                   Instalar dependencias
uv run uvicorn app.main:app --reload      Servidor de desarrollo
uv run alembic revision --autogenerate -m "mensaje"
uv run alembic upgrade head
uv run pytest                             Tests
uv run ruff check . && uv run ruff format .
```

## Estructura

```
backend/
  pyproject.toml / uv.lock
  alembic.ini
  alembic/versions/
  app/
    main.py            Crea la app, CORS, routers y lifespan (migraciones + seed)
    core/              config (pydantic-settings), seguridad (JWT, bcrypt), dependencias
    db/                engine, sesión, Base, seed
    models/            Modelos SQLAlchemy 2.0 (Mapped / mapped_column)
    schemas/           Esquemas Pydantic (entrada y salida)
    services/          Lógica de negocio (stock, transiciones de pedido)
    routers/           auth, users, products, cart, orders
  tests/
```

Un router por módulo, con servicio y esquemas propios. La lógica de negocio va en `services/`, no en los routers.

## Decisiones técnicas

- Sin `passlib`: usar `bcrypt` directamente (`bcrypt.hashpw` / `bcrypt.checkpw`) por incompatibilidades.
- Añadir `email-validator>=2.1.0` explícitamente en las dependencias para `EmailStr` de Pydantic.
- Configuración con `pydantic-settings` leyendo variables de entorno; nada hardcodeado (URL de BD, secreto JWT, orígenes CORS, credenciales de seed).
- Precios con `Decimal` y `Numeric(10, 2)`; nunca `float`.
- Restricciones también en BD (`CHECK price > 0`, `CHECK stock >= 0`, unicidad) además de en Pydantic.
- Operaciones de stock en una transacción con `SELECT ... FOR UPDATE`.
- JWT firmado con `JWT_SECRET`, expiración de 2 horas, entregado en cookie `HttpOnly`. CORS con `allow_credentials=True` y orígenes explícitos (nunca `*`).

## Arranque

Al iniciar la aplicación (lifespan o entrypoint), en este orden:

1. Ejecutar `alembic upgrade head` automáticamente.
2. Ejecutar el seed solo si la base de datos está vacía (idempotente): 1 admin, 2 clientes y 20 productos desde `../docs/products-images.json`. En Docker el fichero se monta o copia dentro de la imagen y su ruta se configura por variable de entorno.

## Tests

- `pytest` con `httpx` / `TestClient`, contra una base PostgreSQL de test (no SQLite, por los tipos y bloqueos).
- Cubrir como mínimo: permisos por rol, validaciones de precio/stock, límites de carrito, transiciones de pedido y movimientos de stock.
- Cada endpoint nuevo debe tener tests de caso feliz y de errores (`401`, `403`, `404`, `409`, `422`).

## Estilo

- Tipado completo; `ruff` para lint y formato.
- Dependencias de FastAPI (`Depends`) para sesión y usuario actual; `require_admin` y `require_customer` para roles.
- Errores de negocio con `HTTPException` y mensajes claros en castellano.
