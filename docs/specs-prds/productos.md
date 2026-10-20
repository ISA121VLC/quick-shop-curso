# Módulo: Productos

## Descripción

Catálogo de productos. Los clientes lo consultan; el administrador realiza el CRUD. Un producto con stock 0 sigue siendo visible, pero no se puede añadir al carrito. Un producto con `is_active = false` (baja lógica) no aparece para los clientes.

El seed crea 20 productos a partir de `docs/products-images.json`, con el mapeo:

| JSON | Columna |
|------|---------|
| `producto` | `name` |
| `descripcion` | `description` |
| `precio` | `price` |
| `stock` | `stock` |
| `imagen` | `image_url` |

## Modelo de datos

Tabla `products`:

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | integer | PK, autoincremental |
| `name` | varchar(200) | NOT NULL |
| `description` | text | NOT NULL, default `''` |
| `price` | numeric(10,2) | NOT NULL, CHECK `price > 0` |
| `stock` | integer | NOT NULL, CHECK `stock >= 0` |
| `image_url` | varchar(500) | NULL permitido |
| `is_active` | boolean | NOT NULL, default `true` |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

Notas: `price` se maneja como `Decimal` en Python (nunca `float`) y se serializa como string con 2 decimales. El borrado es lógico (`is_active = false`) para no romper pedidos históricos.

## Endpoints

Prefijo base: `/api/products`.

### GET /api/products

- Público para usuarios autenticados (cualquier rol).
- Query: `page` (default 1), `page_size` (default 12, máx. 100), `q?` (búsqueda por nombre), `in_stock?` (bool), `include_inactive?` (solo admin; ignorado para clientes).
- Response `200`: `{ "items": [ProductOut], "total": int, "page": int, "page_size": int }`.
- Errores: `401`; `422`.

### GET /api/products/{id}

- Response `200`: `ProductOut` (`id`, `name`, `description`, `price`, `stock`, `image_url`, `is_active`, `created_at`, `updated_at`).
- Errores: `401`; `404` (también para productos inactivos si el solicitante es cliente).

### POST /api/products (solo admin)

- Request: `{ "name": string, "description"?: string, "price": Decimal (>0, 2 decimales), "stock": int (>=0), "image_url"?: string, "is_active"?: bool }`
- Response `201`: `ProductOut`.
- Errores: `401`; `403`; `422`.

### PUT /api/products/{id} (solo admin)

- Request: igual que la creación (reemplazo completo).
- Response `200`: `ProductOut`.
- Errores: `401`; `403`; `404`; `422`.

### PATCH /api/products/{id} (solo admin)

- Request: cualquier subconjunto de campos de la creación.
- Response `200`: `ProductOut`.
- Errores: `401`; `403`; `404`; `422`.

### DELETE /api/products/{id} (solo admin)

- Baja lógica: pone `is_active = false`.
- Response `204`.
- Errores: `401`; `403`; `404`.

## Criterios de aceptación

- Tras el seed existen exactamente 20 productos con los datos del JSON.
- No se puede crear ni actualizar un producto con precio <= 0, más de 2 decimales o stock negativo (`422`).
- Los clientes no pueden crear, editar ni eliminar productos (`403`).
- Los productos con stock 0 aparecen en el listado con `stock: 0` y el frontend deshabilita el botón de añadir.
- Los productos inactivos no se muestran a clientes ni se pueden añadir al carrito.
- Eliminar un producto con pedidos asociados no rompe los pedidos existentes (baja lógica y snapshot en `order_items`).
- La paginación y la búsqueda por nombre funcionan y devuelven `total` correcto.

## Pantallas en el frontend

- **Catálogo** (`/`): cuadrícula responsive de tarjetas (imagen, nombre, precio, stock). Búsqueda, filtro "en stock" y paginación. Botón "Añadir al carrito" deshabilitado con etiqueta "Sin stock" cuando `stock = 0` (oculto para el administrador).
- **Detalle de producto** (`/productos/:id`): imagen grande, descripción, precio, selector de cantidad limitado por stock.
- **Gestión de productos (admin)** (`/admin/productos`): tabla con acciones crear, editar y desactivar; incluye productos inactivos.
- **Formulario de producto (admin)** (`/admin/productos/nuevo`, `/admin/productos/:id/editar`): validación de precio y stock en cliente.
