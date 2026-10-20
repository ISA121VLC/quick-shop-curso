# Design

## Context

El repositorio contiene solo Dockerfiles, `docker-compose.yml`, `.env.example` y las specs de `docs/specs-prds/`; `backend/` y `frontend/` no tienen código. Las convenciones de stack están en `AGENTS.md`, `backend/AGENTS.md` y `frontend/AGENTS.md`. El orden es backend primero y frontend después. Motivación y alcance en `proposal.md`; requisitos en `specs/`.

## Goals / Non-Goals

**Goals:**
- Dejar una base reutilizable por carrito y pedidos: dependencias de rol, sesión, migraciones, seed, fixtures de test y cliente HTTP del frontend.
- Que `docker compose up --build` arranque BD, backend (migra y siembra) y frontend funcionales.

**Non-Goals:**
- Refresh tokens, recuperación de contraseña, verificación de email o rate limiting.
- Tablas de carrito y pedidos (la migración inicial solo crea `users` y `products`; las siguientes migraciones las añadirán).
- Subida de imágenes: `image_url` es solo una URL.

## Decisions

1. **Capas del backend**: `routers` finos que delegan en `services`, que reciben la `Session` de SQLAlchemy; esquemas Pydantic separados de modelos. Alternativa descartada: lógica en routers, por contradecir `backend/AGENTS.md`.
2. **Driver y sesión**: `psycopg` (v3) síncrono con SQLAlchemy 2.0, coherente con `DATABASE_URL=postgresql+psycopg://`. Endpoints `def` síncronos; `bcrypt` es bloqueante y así FastAPI los ejecuta en su threadpool. Alternativa: async, descartada por complejidad sin necesidad.
3. **JWT**: `PyJWT` con HS256, claims `sub`, `role`, `iat`, `exp`. El rol del token es informativo; `get_current_user` recarga el usuario de BD para comprobar `is_active` y usar el rol vigente en `require_admin`/`require_customer`.
4. **Cookie**: nombre `access_token`, `HttpOnly`, `SameSite=Lax`, `Secure` desde `COOKIE_SECURE`, `Max-Age` derivado de `ACCESS_TOKEN_EXPIRE_MINUTES`, `path=/`. Sin protección CSRF adicional: `SameSite=Lax` más CORS con orígenes explícitos; las mutaciones usan JSON y métodos no GET. Se documenta como riesgo aceptado.
5. **Email único insensible a mayúsculas**: índice único funcional sobre `lower(email)` creado en la migración; el servicio normaliza a minúsculas al guardar y busca con `lower()`. Se captura `IntegrityError` en el registro para resolver carreras y devolver `409`.
6. **Migraciones y seed**: en el `lifespan`, `alembic upgrade head` programático y después el seed. Idempotencia: el seed se ejecuta solo si `users` y `products` están vacías, dentro de una transacción. Para evitar carreras con varias réplicas se toma un `pg_advisory_lock` alrededor de migración y seed. Las contraseñas y el email del admin salen de `SEED_*`.
7. **Productos**: `Numeric(10,2)` con `CheckConstraint`; en Pydantic, `Decimal` con `max_digits=10`, `decimal_places=2`, `gt=0`, serializado como string con 2 decimales. `PUT` usa el esquema de creación y `PATCH` uno con campos opcionales (`model_dump(exclude_unset=True)`). `updated_at` con `onupdate`.
8. **Visibilidad**: el servicio de productos recibe el rol del solicitante y aplica el filtro `is_active` en un único punto; `include_inactive` se ignora para clientes.
9. **Tests de backend**: base PostgreSQL de test (URL por `TEST_DATABASE_URL`), esquema creado con Alembic una vez por sesión y limpieza por test mediante transacción con rollback. Fixtures para cliente, admin y `TestClient` autenticado. Alternativa descartada: SQLite, prohibida por `backend/AGENTS.md`.
10. **Frontend**: `api/client.js` con `fetch` y `credentials: "include"`, URL de `import.meta.env.VITE_API_URL`; un `AuthContext` restaura sesión con `/api/auth/me` y expone `login`, `logout`, `register`, `user`, `loading`. `RequireAuth` y `RequireRole` usan `Outlet`; un `Layout` común envuelve las páginas. Estilo solo con Tailwind y PostCSS inline en `vite.config.js` según `frontend/AGENTS.md`.
11. **Botón de carrito**: en este cambio se renderiza deshabilitado/inerte hasta el módulo de carrito; la regla de "Sin stock" y el ocultarlo al admin sí se implementan.
12. **Tests de frontend**: Vitest para `AuthContext` y utilidades de validación; Playwright para registro, login/logout, protección de rutas y CRUD de productos de admin contra el stack real.

## Risks / Trade-offs

- [Sin protección CSRF explícita] → `SameSite=Lax`, orígenes CORS explícitos y ninguna mutación por GET; revisar si se sirve frontend y API en dominios distintos con `SameSite=None`.
- [Migración y seed al arrancar con varias réplicas] → advisory lock de PostgreSQL.
- [Cuentas de seed con contraseñas conocidas] → solo para desarrollo; las contraseñas vienen de variables de entorno y deben cambiarse en producción.
- [Token válido tras desactivar usuario] → `get_current_user` consulta BD en cada petición, con un coste de consulta aceptable.
- [Imágenes remotas de Unsplash pueden fallar] → el frontend muestra un marcador de posición si la imagen no carga.
