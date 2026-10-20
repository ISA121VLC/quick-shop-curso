# Módulo: Pedidos

## Descripción

Los clientes crean pedidos a partir de su carrito, consultan su historial y pueden cancelar un pedido propio solo si está en estado `pending`. El administrador gestiona el estado de los pedidos de cualquier cliente.

### Estados y transiciones

Estados: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`.

| Desde | Hacia | Quién |
|-------|-------|-------|
| `pending` | `confirmed` | admin |
| `pending` | `cancelled` | admin, o el cliente dueño |
| `confirmed` | `shipped` | admin |
| `confirmed` | `cancelled` | admin |
| `shipped` | `delivered` | admin |
| `shipped` | `cancelled` | admin |

Cualquier otra transición devuelve `409`. `delivered` y `cancelled` son estados finales.

### Reglas de stock

- Crear un pedido a partir del carrito: valida que haya stock suficiente de cada producto, copia los ítems al pedido (snapshot de nombre y precio), vacía el carrito y deja el pedido en `pending`. Todo en una única transacción.
- Confirmar un pedido (`pending` -> `confirmed`): descuenta el stock de cada producto. Si algún producto no tiene stock suficiente, la operación falla con `409` y no se modifica nada.
- Cancelar un pedido en `confirmed` o `shipped`: restituye el stock de cada producto.
- Cancelar un pedido en `pending`: no modifica el stock (aún no se había descontado).

Decisión de diseño: el enunciado indica a la vez que crear el pedido "descuenta stock" y que confirmar lo descuenta. Para que el stock nunca se descuente dos veces y sea coherente con la restitución solo en `confirmed`/`shipped`, el descuento se hace en la confirmación y en la creación solo se valida la disponibilidad. Revisar con el responsable del producto si se prefiere reservar al crear.

Las operaciones de stock usan bloqueo de filas (`SELECT ... FOR UPDATE`) para evitar condiciones de carrera.

## Modelo de datos

Tabla `orders`:

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | integer | PK |
| `user_id` | integer | NOT NULL, FK -> `users.id` |
| `status` | enum(`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`) | NOT NULL, default `pending` |
| `total` | numeric(12,2) | NOT NULL, CHECK `total >= 0` |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

Tabla `order_items`:

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | integer | PK |
| `order_id` | integer | NOT NULL, FK -> `orders.id` ON DELETE CASCADE |
| `product_id` | integer | NOT NULL, FK -> `products.id` |
| `product_name` | varchar(200) | NOT NULL (snapshot) |
| `unit_price` | numeric(10,2) | NOT NULL, CHECK `unit_price > 0` (snapshot) |
| `quantity` | integer | NOT NULL, CHECK `quantity >= 1` |

Índices: `orders(user_id, created_at DESC)`, `orders(status)`.

## Endpoints

Prefijo base: `/api/orders`.

`OrderOut`: `{ "id", "user_id", "status", "total", "items": [{ "product_id", "product_name", "unit_price", "quantity", "subtotal" }], "created_at", "updated_at" }`.

### POST /api/orders (cliente)

- Request: sin cuerpo (usa el carrito del usuario).
- Response `201`: `OrderOut` en estado `pending`.
- Errores: `401`; `403` admin; `400` carrito vacío; `409` stock insuficiente o producto no disponible (detalle por producto).

### GET /api/orders

- Cliente: sus pedidos. Admin: todos los pedidos.
- Query: `page`, `page_size` (máx. 100), `status?`, `user_id?` (solo admin).
- Response `200`: `{ "items": [OrderOut], "total", "page", "page_size" }`, orden por fecha descendente.
- Errores: `401`; `422`.

### GET /api/orders/{id}

- Response `200`: `OrderOut`.
- Errores: `401`; `404` (si no existe o es de otro cliente, para no filtrar existencia).

### POST /api/orders/{id}/cancel (cliente dueño)

- Cancela un pedido propio en `pending`.
- Response `200`: `OrderOut` en `cancelled`.
- Errores: `401`; `403` admin (debe usar el endpoint de estado); `404`; `409` el pedido no está en `pending`.

### PATCH /api/orders/{id}/status (solo admin)

- Request: `{ "status": "confirmed" | "shipped" | "delivered" | "cancelled" }`
- Response `200`: `OrderOut`. Aplica las reglas de stock descritas.
- Errores: `401`; `403`; `404`; `409` transición no permitida o stock insuficiente al confirmar; `422`.

## Criterios de aceptación

- Crear un pedido deja el carrito vacío y el pedido en `pending`, con total igual a la suma de subtotales.
- Si falla cualquier validación al crear, no se modifica el carrito ni el stock.
- Los precios del pedido no cambian si el producto se edita después.
- Confirmar descuenta el stock; cancelar un pedido `confirmed` o `shipped` lo restituye; cancelar uno `pending` no lo toca.
- Un cliente solo puede cancelar su propio pedido y únicamente si está `pending`.
- Un cliente no puede cambiar ningún otro estado (`403`).
- Un cliente no puede ver pedidos de otros (`404`).
- Las transiciones no permitidas devuelven `409`.
- Dos confirmaciones concurrentes no dejan stock negativo.

## Pantallas en el frontend

- **Confirmación de pedido**: desde el carrito, resumen y botón de confirmar; tras crear redirige al detalle.
- **Mis pedidos** (`/pedidos`): historial paginado con fecha, estado (insignia de color) y total; filtro por estado.
- **Detalle de pedido** (`/pedidos/:id`): ítems, totales, estado y botón "Cancelar pedido" visible solo si está `pending`.
- **Gestión de pedidos (admin)** (`/admin/pedidos`): tabla de todos los pedidos con filtros por estado y cliente; selector de nuevo estado limitado a transiciones válidas.
- **Detalle de pedido (admin)** (`/admin/pedidos/:id`): datos del cliente y acciones de cambio de estado.
