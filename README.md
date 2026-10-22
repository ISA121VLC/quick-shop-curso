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

## Acceso desde otro equipo

La web y la API comparten origen: nginx sirve el frontend y reenvía `/api/` al backend. Basta abrir `http://<ip-del-servidor>:5173` desde cualquier equipo de la red, sin tocar `CORS_ORIGINS` ni reconstruir la imagen al cambiar de IP o dominio.

- `VITE_API_URL` debe quedar vacío (el navegador usa rutas relativas `/api`). Solo se rellena si la API está en otro origen; en ese caso ese origen debe estar en `CORS_ORIGINS`.
- El puerto del backend (`BACKEND_PORT`) solo se publica en `127.0.0.1` del servidor, para depuración y `/docs`. Desde otros equipos la API es accesible únicamente por `http://<ip-del-servidor>:5173/api`.
- Con HTTP en la red local, `COOKIE_SECURE` debe ser `false`. Si se publica detrás de un túnel o proxy con HTTPS, ponerlo en `true`.
- Si tras actualizar aparece "Failed to fetch" en el login, el navegador conserva el JavaScript antiguo: forzar la recarga con `Ctrl+Shift+R`.

Antes de exponer la web fuera de `localhost`, cambiar `SEED_ADMIN_PASSWORD`, `SEED_CUSTOMER_PASSWORD` y `JWT_SECRET` en el `.env`: las credenciales por defecto están publicadas en este README. El seed solo se aplica con la base de datos vacía, así que para que los cambios surtan efecto sobre los usuarios hay que recrear el volumen (`docker compose down -v`, que borra todos los datos).

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
