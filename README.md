# quick-shop-curso
Repositorio para el curso Desarrollo con IA: De escribir prompts al desarrollo con agentes

El repositorio no tiene codigo, el codigo se irá generando durante el curso con agentes de codigo, en especial Claude Code y OpenCode. 

La rama main solo tiene las carpetas iniciales necesarias a modo de scaffolding para poder clonar el proyecto y empezar a trabajar en el con los principales agentes de codigo.

La demo del curso se hará sobre la rama demp_curso y las PRs se haran a la rama "dev" from "demo_curso"

## Arranque con Docker

```
cp .env.example .env     # ajustar JWT_SECRET y contraseñas
docker compose up --build
```

- Frontend: http://localhost:5173 (`FRONTEND_PORT`)
- API: http://localhost:8000/api (`BACKEND_PORT`), documentación en `/docs`

Al arrancar, el backend ejecuta las migraciones de Alembic y, si la base de datos está vacía, el seed: 1 administrador, 2 clientes y 20 productos de `docs/products-images.json`.

## Credenciales de seed (solo desarrollo)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@quickshop.com` | valor de `SEED_ADMIN_PASSWORD` (`Admin1234!` en `.env.example`) |
| Cliente | `cliente1@quickshop.com`, `cliente2@quickshop.com` | valor de `SEED_CUSTOMER_PASSWORD` (`Cliente1234!` en `.env.example`) |

## Tests

```
# Backend (requiere PostgreSQL de test; URL en TEST_DATABASE_URL)
cd backend && uv run pytest

# Frontend
cd frontend && pnpm test

# E2E (requiere el stack levantado con docker compose)
cd frontend && pnpm test:e2e
```
