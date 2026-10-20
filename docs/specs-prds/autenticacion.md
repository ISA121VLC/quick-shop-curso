# Módulo: Autenticación

## Descripción

Gestiona el registro de clientes, el inicio y cierre de sesión y la identificación del usuario actual. La autenticación se basa en JWT con un access token que expira a las 2 horas.

Reglas clave:

- El token NO se guarda en `localStorage` ni `sessionStorage`. El backend lo entrega en una cookie `HttpOnly` (`SameSite=Lax`, `Secure` configurable por entorno) y el frontend nunca lo lee desde JavaScript.
- Las contraseñas se hashean con `bcrypt` (uso directo de `bcrypt.hashpw` / `bcrypt.checkpw`, sin `passlib`).
- El único registro público crea usuarios con rol `customer`. El administrador se crea por seed.
- Credenciales de seed: `admin@quickshop.com` / `Admin1234!`, `cliente1@quickshop.com` y `cliente2@quickshop.com` / `Cliente1234!`.

## Modelo de datos

La identidad vive en la tabla `users` (ver [usuarios.md](usuarios.md)). Este módulo no añade tablas propias.

Claims del JWT:

| Claim | Tipo | Descripción |
|-------|------|-------------|
| `sub` | string | ID del usuario |
| `role` | string | `customer` o `admin` |
| `iat` | int | Fecha de emisión (epoch) |
| `exp` | int | Expiración: `iat` + 2 horas |

Configuración (variables de entorno, ver `.env.example`): `JWT_SECRET`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES=120`, `COOKIE_SECURE`, `CORS_ORIGINS`.

## Endpoints

Prefijo base: `/api/auth`.

### POST /api/auth/register

- Request: `{ "email": EmailStr, "password": string (min 8, con mayúscula, minúscula, dígito y símbolo), "full_name": string (1..120) }`
- Response `201`: `UserOut` (`id`, `email`, `full_name`, `role`, `is_active`, `created_at`). No inicia sesión.
- Errores: `409` email ya registrado; `422` validación.

### POST /api/auth/login

- Request: `{ "email": EmailStr, "password": string }`
- Response `200`: `UserOut` y cabecera `Set-Cookie` con el access token (`HttpOnly`, `Max-Age=7200`).
- Errores: `401` credenciales inválidas (mensaje genérico, sin revelar si el email existe); `403` usuario inactivo; `422` validación.

### POST /api/auth/logout

- Request: sin cuerpo.
- Response `204`: la cookie se invalida (`Max-Age=0`).
- Errores: ninguno relevante (idempotente).

### GET /api/auth/me

- Request: cookie de sesión.
- Response `200`: `UserOut` del usuario autenticado.
- Errores: `401` token ausente, inválido o expirado; `403` usuario inactivo.

### Dependencias reutilizables

- `get_current_user`: resuelve el usuario desde la cookie; lanza `401`.
- `require_admin`: exige rol `admin`; lanza `403`.
- `require_customer`: exige rol `customer`; lanza `403` (usado en carrito y creación de pedidos).

## Criterios de aceptación

- Un visitante puede registrarse con email y contraseña válidos y queda con rol `customer`.
- No se puede registrar un email duplicado (comparación sin distinguir mayúsculas).
- Login correcto devuelve cookie `HttpOnly`; el cuerpo de la respuesta no contiene el token.
- Login con credenciales erróneas devuelve `401` con el mismo mensaje para email inexistente y contraseña incorrecta.
- Un token expirado (más de 2 horas) o manipulado devuelve `401`.
- La contraseña nunca se almacena ni se devuelve en claro; en base de datos solo hay hash bcrypt.
- Tras logout, `GET /api/auth/me` devuelve `401`.
- Un cliente no puede acceder a endpoints de administrador (`403`).
- El backend acepta peticiones con credenciales solo desde los orígenes de `CORS_ORIGINS`.
- No existe ningún secreto hardcodeado; todo viene de variables de entorno.

## Pantallas en el frontend

- **Login** (`/login`): formulario email y contraseña, errores en línea, enlace a registro. Tras login redirige a `/` (cliente) o `/admin/productos` (administrador).
- **Registro** (`/registro`): nombre completo, email, contraseña y confirmación; validación en cliente y servidor.
- **Header**: muestra enlaces de acceso/registro si no hay sesión; nombre del usuario y botón de cerrar sesión si la hay.
- **Rutas protegidas**: `RequireAuth` y `RequireRole` redirigen a `/login` (sin sesión) o a una pantalla 403 (rol incorrecto).
- Al arrancar, el frontend llama a `GET /api/auth/me` para restaurar la sesión; todas las peticiones usan `credentials: "include"`.
