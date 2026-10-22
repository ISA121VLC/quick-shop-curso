# QuickShop

Mini plataforma de e-commerce. Objetivo: aplicación moderna, funcional y estable.

## Stack

- Frontend: React 18 + Vite + Tailwind CSS + React Router
- Backend: Python 3.11 + FastAPI + SQLAlchemy 2.0 + Alembic
- Base de datos: PostgreSQL 15
- Despliegue: Docker + docker-compose
- Gestores de dependencias: pnpm (frontend) y uv (backend)

Instrucciones específicas: `backend/AGENTS.md` y `frontend/AGENTS.md`.

## Módulos

Exactamente cinco: autenticación, usuarios, productos, carrito, pedidos. Las especificaciones están en `docs/specs-prds/<modulo>.md` y son la fuente de verdad de modelo de datos, endpoints, criterios de aceptación y pantallas:

- `docs/specs-prds/autenticacion.md`
- `docs/specs-prds/usuarios.md`
- `docs/specs-prds/productos.md`
- `docs/specs-prds/carrito.md`
- `docs/specs-prds/pedidos.md`

Los datos del seed de productos salen de `docs/products-images.json`.

## Orden de desarrollo

1. Backend primero: modelos, migración Alembic, esquemas, servicios, routers y tests de cada módulo.
2. Frontend después, consumiendo la API ya implementada.
3. Orden recomendado de módulos: autenticación, usuarios, productos, carrito, pedidos.
4. Un módulo se considera terminado cuando cumple sus criterios de aceptación y tiene tests.

## Estructura de carpetas

```
quick-shop-curso/
  AGENTS.md / CLAUDE.md      Convenciones generales (CLAUDE.md solo referencia a AGENTS.md)
  README.md
  docker-compose.yml
  .env.example               Variables para docker-compose (el .env real no se versiona)
  DESIGN.md                  Guía de estilo visual del frontend (tokens de color, tipografía, forma y componentes)
  docs/
    products-images.json     Datos del seed de productos
    specs-prds/              Una especificación por módulo
  backend/                   API FastAPI (ver backend/AGENTS.md)
  frontend/                  SPA React (ver frontend/AGENTS.md)
  openspec/                  Flujo spec-driven de OpenSpec
```

## Reglas funcionales clave

- Roles: `customer` y `admin`. El admin se crea solo por seed y no tiene carrito.
- Precio: Decimal con 2 decimales y mayor que 0. Stock: entero mayor o igual a 0.
- Producto con stock 0: visible, pero no se puede añadir al carrito.
- Pedidos: solo el admin cambia el estado, salvo que el cliente puede cancelar su propio pedido si está `pending`.
- Seed idempotente al arrancar si la base de datos está vacía: 1 admin (`admin@quickshop.com`), 2 clientes y 20 productos.

## Diseño visual

`DESIGN.md` es la fuente de verdad del aspecto del frontend. Toda pantalla o componente nuevo debe usar solo sus tokens (colores, tipografía, radios, espacios) y sus reglas de contraste WCAG AA; no inventar colores, radios ni sombras. Los cambios de aspecto se hacen con CSS/Tailwind sin alterar el HTML que comprueban los tests. Si un caso no está cubierto, elegir la opción más sobria y avisar.

## Seguridad y configuración

- JWT con access token de 2 horas. No guardarlo en `localStorage` ni `sessionStorage`: se entrega en cookie `HttpOnly`.
- Contraseñas con `bcrypt` directo (sin `passlib`).
- Ningún secreto, contraseña o URL hardcodeado en el código. Todo por variables de entorno.
- `.env` fuera de git (ya en `.gitignore`); `.env.example` versionado y siempre actualizado.
- CORS configurado en el backend con el origen del frontend leído de variables de entorno.
- Las migraciones Alembic se ejecutan automáticamente al arrancar el backend, antes del seed.

## Convenciones generales

- Idioma: documentación (CLAUDE.md, AGENTS.md, specs, README) en castellano. Identificadores de código, rutas y nombres de columnas en inglés.
- Sin emojis en ningún archivo del proyecto.
- Commits con Conventional Commits (`feat`, `fix`, `docs`, `test`, `chore`, `refactor`).
- Cambios pequeños y enfocados; no introducir dependencias sin necesidad.
- Todo cambio de comportamiento debe ir acompañado de tests y, si afecta a un contrato, de la actualización de la spec correspondiente.
- API REST bajo el prefijo `/api`, JSON, códigos HTTP semánticos (`401` no autenticado, `403` sin permiso, `404`, `409` conflicto de negocio, `422` validación).

## Docker

- `docker compose up --build` levanta base de datos, backend y frontend.
- El `.env` de la raíz alimenta docker-compose; copiar desde `.env.example`.
- Cada servicio con build propio necesita su `.dockerignore`.
