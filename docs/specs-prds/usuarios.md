# Módulo: Usuarios

## Descripción

Define la entidad de usuario y su gestión. Hay dos roles:

- `customer` (cliente): se registra, consulta el catálogo, gestiona su carrito, crea pedidos, ve su historial y cancela sus pedidos pendientes.
- `admin` (administrador): creado por seed; gestiona productos y el estado de los pedidos de cualquier cliente. No tiene carrito.

El alcance de este módulo es el perfil propio y la consulta de usuarios por parte del administrador. El alta pública está en [autenticacion.md](autenticacion.md).

## Modelo de datos

Tabla `users`:

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | integer | PK, autoincremental |
| `email` | varchar(255) | NOT NULL, UNIQUE (índice sobre `lower(email)`) |
| `password_hash` | varchar(255) | NOT NULL, hash bcrypt |
| `full_name` | varchar(120) | NOT NULL |
| `role` | enum(`customer`, `admin`) | NOT NULL, default `customer` |
| `is_active` | boolean | NOT NULL, default `true` |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()`, se actualiza en cada cambio |

Seed (idempotente, solo si la base de datos está vacía): 1 administrador y 2 clientes (credenciales en [autenticacion.md](autenticacion.md)). Las contraseñas de seed se leen de variables de entorno o de constantes de la configuración de seed, nunca del código de dominio.

## Endpoints

Prefijo base: `/api/users`.

### GET /api/users/me

- Response `200`: `UserOut`.
- Errores: `401`.

### PATCH /api/users/me

- Request: `{ "full_name"?: string (1..120) }` (el email y el rol no se modifican).
- Response `200`: `UserOut` actualizado.
- Errores: `401`; `422`.

### POST /api/users/me/password

- Request: `{ "current_password": string, "new_password": string }` (mismas reglas que el registro).
- Response `204`.
- Errores: `401`; `400` contraseña actual incorrecta; `422`.

### GET /api/users (solo admin)

- Query: `page` (default 1), `page_size` (default 20, máx. 100), `role?`, `q?` (búsqueda por email o nombre).
- Response `200`: `{ "items": [UserOut], "total": int, "page": int, "page_size": int }`.
- Errores: `401`; `403`.

### GET /api/users/{id} (solo admin)

- Response `200`: `UserOut`.
- Errores: `401`; `403`; `404`.

## Criterios de aceptación

- Existe exactamente un administrador tras el seed y no hay endpoint público para crear otro.
- Un cliente solo ve y edita su propio perfil.
- Un cliente no puede listar usuarios ni consultar otros usuarios (`403`).
- Ninguna respuesta incluye `password_hash`.
- El cambio de contraseña exige la contraseña actual y re-hashea con bcrypt.
- El seed se ejecuta una sola vez: reiniciar el backend con datos existentes no duplica usuarios.
- El email es único sin distinguir mayúsculas.

## Pantallas en el frontend

- **Perfil** (`/perfil`): datos del usuario (email de solo lectura), edición del nombre y formulario de cambio de contraseña.
- **Usuarios (admin)** (`/admin/usuarios`): tabla paginada con búsqueda y filtro por rol (solo lectura). Es opcional para el MVP, pero el endpoint queda disponible.
