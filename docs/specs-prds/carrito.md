# Módulo: Carrito

## Descripción

Cada cliente tiene un único carrito persistente en base de datos. Operaciones: añadir ítem, modificar cantidad, eliminar ítem y vaciar. Reglas:

- El administrador no tiene carrito: todos los endpoints devuelven `403` para el rol `admin`.
- No se puede tener en el carrito más cantidad que el stock disponible del producto.
- No se pueden añadir productos con stock 0 ni inactivos.
- El carrito se crea de forma perezosa en la primera operación del cliente.
- El carrito no reserva stock; el stock solo se valida al operar y al crear el pedido.

## Modelo de datos

Tabla `carts`:

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | integer | PK |
| `user_id` | integer | NOT NULL, UNIQUE, FK -> `users.id` ON DELETE CASCADE |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

Tabla `cart_items`:

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | integer | PK |
| `cart_id` | integer | NOT NULL, FK -> `carts.id` ON DELETE CASCADE |
| `product_id` | integer | NOT NULL, FK -> `products.id` |
| `quantity` | integer | NOT NULL, CHECK `quantity >= 1` |
| `created_at` | timestamptz | NOT NULL, default `now()` |

Restricción adicional: UNIQUE (`cart_id`, `product_id`). Añadir un producto ya presente suma cantidad.

## Endpoints

Prefijo base: `/api/cart`. Todos requieren rol `customer`.

`CartOut`: `{ "id": int, "items": [CartItemOut], "total": Decimal, "item_count": int }`.
`CartItemOut`: `{ "id": int, "product": ProductOut, "quantity": int, "subtotal": Decimal, "available": bool }`. `available` es `false` cuando el producto está inactivo; `total` y `subtotal` se serializan como cadena con 2 decimales.

### GET /api/cart

- Response `200`: `CartOut` (vacío si no existe).
- Errores: `401`; `403`.

### POST /api/cart/items

- Request: `{ "product_id": int, "quantity": int (>=1, default 1) }`
- Response `201`: `CartOut`. Si el producto ya estaba, suma la cantidad.
- Errores: `401`; `403`; `404` producto inexistente o inactivo; `409` cantidad resultante mayor que el stock o stock 0; `422`.

### PATCH /api/cart/items/{item_id}

- Request: `{ "quantity": int (>=1) }`
- Response `200`: `CartOut`.
- Errores: `401`; `403`; `404` ítem no encontrado o de otro usuario; `409` supera el stock; `422`.

### DELETE /api/cart/items/{item_id}

- Response `200`: `CartOut` actualizado.
- Errores: `401`; `403`; `404`.

### DELETE /api/cart

- Vacía el carrito.
- Response `200`: `CartOut` vacío.
- Errores: `401`; `403`.

## Criterios de aceptación

- Un cliente solo ve y modifica su propio carrito.
- El administrador recibe `403` en todos los endpoints del carrito.
- No es posible superar el stock disponible al añadir ni al modificar cantidad (`409` con mensaje claro indicando el stock disponible).
- Añadir dos veces el mismo producto resulta en un solo ítem con cantidades sumadas.
- `total` y `subtotal` se calculan con `Decimal` y 2 decimales.
- Vaciar el carrito elimina todos los ítems pero conserva el carrito.
- Los ítems de productos que pasan a inactivos se señalan como no disponibles y bloquean la creación del pedido hasta eliminarlos.

## Pantallas en el frontend

- **Carrito** (`/carrito`): lista de ítems con imagen, nombre, precio unitario, selector de cantidad (tope = stock), subtotal y botón eliminar; botón "Vaciar carrito"; resumen con total y botón "Realizar pedido". Estado vacío con enlace al catálogo.
- **Header**: icono de carrito con contador de ítems (solo clientes).
- **Notificaciones**: mensajes de error cuando se supera el stock.
