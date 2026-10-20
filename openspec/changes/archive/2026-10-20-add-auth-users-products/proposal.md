# Proposal

## Why

QuickShop solo tiene las especificaciones y el andamiaje (Dockerfiles, docker-compose); aún no existe código de backend ni de frontend. Autenticación, usuarios y productos son la base del resto de módulos: carrito y pedidos dependen de la identidad, los roles y el catálogo. Implementarlos primero permite validar el stack completo (FastAPI, SQLAlchemy, Alembic, PostgreSQL, React) de extremo a extremo.

## What Changes

- Backend: proyecto FastAPI con `uv`, configuración por variables de entorno, conexión a PostgreSQL, migración Alembic automática al arrancar y seed idempotente (1 admin, 2 clientes, 20 productos desde `docs/products-images.json`).
- Autenticación: registro de clientes, login con JWT (2 horas) en cookie `HttpOnly`, logout, `GET /api/auth/me`, hash con `bcrypt` directo y dependencias `get_current_user`, `require_admin` y `require_customer`.
- Usuarios: modelo `users`, perfil propio (consulta, edición de nombre, cambio de contraseña) y consulta paginada de usuarios solo para admin.
- Productos: modelo `products` con restricciones en BD, listado paginado con búsqueda y filtro de stock, detalle, y CRUD con baja lógica solo para admin.
- Frontend: proyecto React 18 + Vite + Tailwind con cliente HTTP (`credentials: "include"`), contexto de sesión, `RequireAuth`/`RequireRole`, layout con header, y pantallas de login, registro, perfil, catálogo, detalle de producto, gestión de productos (admin) y listado de usuarios (admin, opcional).
- Tests: pytest contra PostgreSQL real para backend; tests unitarios y Playwright para los flujos de registro, login y gestión de productos.
- Se revisa `.env.example` (ya incluye las variables de JWT, cookie, CORS y seed) y se documenta el arranque en el README.
- Fuera de alcance: carrito y pedidos (el botón "Añadir al carrito" queda como acción deshabilitada o pendiente hasta ese módulo).

## Capabilities

### New Capabilities

- `authentication`: registro público de clientes, login/logout con cookie `HttpOnly`, identificación del usuario actual, expiración del token y dependencias de autorización por rol.
- `user-management`: entidad de usuario con roles, seed de usuarios, perfil propio, cambio de contraseña y consulta de usuarios por el administrador.
- `product-catalog`: entidad de producto, seed del catálogo, listado/detalle con visibilidad por rol, CRUD y baja lógica para admin, y reglas de precio y stock.

### Modified Capabilities

<!-- Ninguna: openspec/specs está vacío. -->

## Impact

- Código nuevo: `backend/app/**`, `backend/alembic/**`, `backend/tests/**`, `backend/pyproject.toml`; `frontend/src/**`, `frontend/e2e/**`, `frontend/package.json`, `vite.config.js`.
- API nueva bajo `/api/auth`, `/api/users` y `/api/products`.
- Dependencias backend: fastapi, uvicorn, sqlalchemy, alembic, psycopg, pydantic-settings, email-validator, bcrypt, pyjwt, pytest, httpx, ruff. Frontend: react, react-router-dom, tailwindcss, vite, playwright, vitest.
- Configuración: `.env.example` y `docker-compose.yml` (variables JWT, cookie, CORS, rutas de seed, URL de la API).
- Las specs de `docs/specs-prds/` siguen siendo la fuente de verdad; este cambio no modifica contratos.
