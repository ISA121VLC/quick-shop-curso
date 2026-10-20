# Tasks

## 1. Backend: base del proyecto

- [x] 1.1 Crear `backend/pyproject.toml` (uv) con fastapi, uvicorn, sqlalchemy, alembic, psycopg, pydantic-settings, email-validator, bcrypt, pyjwt y dev: pytest, httpx, ruff; verificar con `uv sync` y `uv run ruff check .`
- [x] 1.2 Implementar `app/core/config.py` (pydantic-settings con `DATABASE_URL`, JWT, cookie, CORS, `SEED_*`, `SEED_PRODUCTS_FILE`) y `app/db` (engine, sesión, `Base`); verificar que la app no contiene secretos hardcodeados con `grep` y que arranca con las variables del `.env.example`
- [x] 1.3 Crear `app/main.py` con CORS (`allow_credentials=True`, orígenes de config), prefijo `/api` y `lifespan`; verificar con `GET /api/health` y un test de CORS (origen permitido y no permitido)
- [x] 1.4 Configurar Alembic y ejecución programática de `upgrade head` en el lifespan con advisory lock; verificar arrancando contra PostgreSQL con base vacía
- [x] 1.5 Preparar `tests/conftest.py` con `TEST_DATABASE_URL` en PostgreSQL, migraciones por sesión, rollback por test y fixtures de cliente, admin y `TestClient`; verificar con un test de humo en `uv run pytest`

## 2. Backend: usuarios y autenticación

- [x] 2.1 Modelo `User` (enum de rol, `is_active`, timestamps) y migración inicial con índice único sobre `lower(email)`; verificar con test que dos emails que difieren en mayúsculas colisionan
- [x] 2.2 `core/security.py` (hash y verificación bcrypt directos, creación y decodificación de JWT con 2 horas) y esquemas `UserOut`, `RegisterIn`, `LoginIn` con validación de contraseña; verificar con tests unitarios de hash, expiración y token manipulado
- [x] 2.3 Servicio y router `auth`: register, login (cookie `HttpOnly`), logout, me; verificar con tests de `201`, `409`, `422`, `401` uniforme, `403` inactivo, cuerpo sin token y `401` tras logout
- [x] 2.4 Dependencias `get_current_user`, `require_admin`, `require_customer`; verificar con tests de `401`, `403` y token expirado
- [x] 2.5 Servicio y router `users`: `GET/PATCH /me`, `POST /me/password`, `GET /users` paginado con filtros y `GET /users/{id}`; verificar con tests de permisos, paginación, `page_size > 100`, `400` contraseña actual errónea y ausencia de `password_hash`
- [x] 2.6 Seed de usuarios idempotente desde `SEED_*`; verificar con test que dos ejecuciones dejan 1 admin y 2 clientes

## 3. Backend: productos

- [x] 3.1 Modelo `Product` con `CHECK price > 0` y `CHECK stock >= 0` y migración; verificar con test que la BD rechaza precio 0 y stock negativo
- [x] 3.2 Esquemas `ProductCreate`, `ProductPatch`, `ProductOut` con `Decimal` de 2 decimales serializado como string; verificar con tests de precio inválido, más de 2 decimales y serialización
- [x] 3.3 Servicio y router `products`: listado paginado con `q`, `in_stock`, `include_inactive`, detalle, `POST`, `PUT`, `PATCH`, `DELETE` lógico; verificar con tests de `401`, `403`, `404`, `422`, visibilidad de inactivos para cliente y admin, `total` correcto y stock 0 visible
- [x] 3.4 Seed de 20 productos desde `SEED_PRODUCTS_FILE` (`docs/products-images.json`); verificar con test de 20 productos con datos del JSON y de idempotencia
- [x] 3.5 Ejecutar `uv run pytest` y `uv run ruff check . && uv run ruff format --check .` completos; verificar que pasan sin errores

## 4. Frontend: base y autenticación

- [x] 4.1 Inicializar `frontend` (Vite, React 18, Tailwind con PostCSS inline, React Router, Vitest, `pnpm-workspace.yaml` con `allowBuilds`); verificar con `pnpm install && pnpm build`
- [x] 4.2 Cliente HTTP `api/client.js` (`credentials: "include"`, `VITE_API_URL`) y funciones de `auth`, `users` y `products`; verificar con tests unitarios que mockean `fetch` y comprueban las opciones y el manejo de errores
- [x] 4.3 `AuthContext` (restaurar sesión con `/api/auth/me`, login, logout, register), `RequireAuth`, `RequireRole` y `Layout` con header; verificar con tests Vitest de sesión restaurada, redirección a `/login` y pantalla 403, y que no se usa `localStorage` ni `sessionStorage` (`grep`)
- [x] 4.4 Páginas `/login` y `/registro` con validación y errores en línea y redirección por rol; verificar con tests de componente y Playwright de registro y login de cliente y de admin

## 5. Frontend: usuarios y productos

- [x] 5.1 Página `/perfil` (nombre, cambio de contraseña) y `/admin/usuarios` (tabla paginada con búsqueda y filtro por rol); verificar con tests de componente y un Playwright de edición de nombre
- [x] 5.2 Catálogo `/` y detalle `/productos/:id` con búsqueda, filtro en stock, paginación, estados de carga, vacío y error, "Sin stock", acción de carrito deshabilitada y oculta al admin; verificar con tests de componente y Playwright de listado y búsqueda
- [x] 5.3 Gestión admin `/admin/productos`, `/admin/productos/nuevo` y `/admin/productos/:id/editar` con validación de precio y stock; verificar con Playwright de crear, editar y desactivar
- [x] 5.4 Revisar que todas las pantallas son responsive (mobile-first) con textos en castellano y sin emojis; verificar con `pnpm test`, `pnpm test:e2e` y `pnpm build`

## 6. Integración

- [x] 6.1 Ajustar `.env.example`, `docker-compose.yml` y Dockerfiles si hace falta, y documentar en `README.md` el arranque y las credenciales de seed; verificar con `docker compose up --build` que el login de admin y el catálogo de 20 productos funcionan en el navegador
- [x] 6.2 Contrastar la implementación con `docs/specs-prds/autenticacion.md`, `usuarios.md` y `productos.md` y con los criterios de aceptación; verificar que no hay discrepancias o que la spec se ha actualizado

## Workflow follow-up

- Archivar el cambio tras la revisión (`/opsx:verify` y `/opsx:archive`).
