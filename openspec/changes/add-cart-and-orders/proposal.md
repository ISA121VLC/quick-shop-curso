# Proposal

## Why

QuickShop ya tiene autenticación, usuarios y catálogo, pero un cliente todavía no puede comprar: el botón "Añadir al carrito" no hace nada y no existe el flujo de pedidos. Carrito y pedidos son los dos últimos módulos de los cinco previstos y cierran el flujo principal de negocio (elegir productos, pedir, y que el administrador gestione el estado).

## What Changes

- Backend, carrito: modelos `carts` y `cart_items` con migración Alembic, creación perezosa del carrito, y endpoints `GET /api/cart`, `POST /api/cart/items`, `PATCH`/`DELETE /api/cart/items/{item_id}` y `DELETE /api/cart`, solo para clientes (`403` al admin).
- Backend, pedidos: modelos `orders` y `order_items` (con snapshot de nombre y precio) con migración, creación de pedido desde el carrito en una única transacción, listado paginado con filtros, detalle, cancelación por el cliente dueño y cambio de estado por el admin con máquina de estados.
- Reglas de stock: el carrito no reserva stock; crear el pedido solo valida disponibilidad; confirmar descuenta; cancelar un pedido `confirmed` o `shipped` restituye; todo con `SELECT ... FOR UPDATE` y en orden determinista de producto para evitar condiciones de carrera e interbloqueos.
- Frontend, carrito: contexto de carrito, contador en el header (solo clientes), botón "Añadir al carrito" operativo en catálogo y detalle, y pantalla `/carrito`. Las pantallas nuevas siguen `DESIGN.md` y reutilizan los componentes compartidos de `apply-design-system` (`Badge`, `EmptyState`, aviso de error).
- Frontend, pedidos: confirmación desde el carrito, `/pedidos`, `/pedidos/:id`, y para el admin `/admin/pedidos` y `/admin/pedidos/:id`.
- Tests: pytest contra PostgreSQL (permisos, límites de carrito, transiciones, movimientos de stock, concurrencia), tests unitarios de frontend y Playwright para los flujos críticos de compra, cancelación y gestión admin.
- Documentación: README y `.env.example` solo si cambian; las specs de `docs/specs-prds/` se actualizan si el contrato se precisa (campo `available`, ver design).
- Fuera de alcance: pagos, direcciones de envío, reserva de stock al añadir al carrito, notificaciones por email, paginación del carrito.

## Capabilities

### New Capabilities

- `shopping-cart`: carrito persistente por cliente con alta, cambio de cantidad, baja y vaciado de ítems, validación contra stock y productos inactivos, y exclusión del rol admin.
- `order-management`: creación de pedidos desde el carrito con snapshot de precios, historial y detalle con visibilidad por rol, cancelación por el cliente, máquina de estados gestionada por el admin y reglas de movimiento de stock.

### Modified Capabilities

<!-- Ninguna: no cambian requisitos de authentication, user-management ni product-catalog. -->

## Impact

- Código nuevo: `backend/app/models/{cart,order}.py`, `schemas/{cart,order}.py`, `services/{cart,orders}.py`, `routers/{cart,orders}.py`, una migración en `backend/alembic/versions/`, tests en `backend/tests/`.
- Código modificado: `backend/app/models/__init__.py`, `main.py` (registro de routers), `frontend/src/App.jsx`, `layouts/Layout.jsx`, `pages/products/*` (botón de añadir), más `frontend/src/api/{cart,orders}.js`, `context/CartContext.jsx` y páginas nuevas.
- API nueva bajo `/api/cart` y `/api/orders`. Sin dependencias nuevas.
- Orden de aplicación: esta change se aplica después de `apply-design-system`, que aporta los tokens y componentes visuales.
- Dependencia con `product-catalog`: los ítems y pedidos referencian `products`; la baja lógica de un producto afecta al carrito (ítem no disponible) pero no a pedidos ya creados.
