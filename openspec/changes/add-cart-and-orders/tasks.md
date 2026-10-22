# Tasks

## 1. Backend: modelos y migración

- [x] 1.1 Crear modelos `Cart`, `CartItem` (`UNIQUE(cart_id, product_id)`, `CHECK quantity >= 1`, cascada desde `users`) y registrarlos en `models/__init__.py`; verificar con tests que la BD rechaza cantidad 0 y un ítem duplicado
- [x] 1.2 Crear modelos `Order`, `OrderItem` y enum `OrderStatus` (`CHECK total >= 0`, `CHECK unit_price > 0`, `CHECK quantity >= 1`, índices `orders(user_id, created_at DESC)` y `orders(status)`); verificar con tests de las restricciones
- [x] 1.3 Escribir la migración `0002_cart_and_orders` (tablas, tipo enum, índices) con `downgrade`; verificar con `uv run alembic upgrade head`, `downgrade -1` y `upgrade head` sobre una base vacía, y que `alembic check` no detecta diferencias con los modelos

## 2. Backend: carrito

- [x] 2.1 Esquemas `CartOut`, `CartItemOut` (con `available`), `CartItemCreate` y `CartItemUpdate` con importes `Decimal` a 2 decimales como cadena; verificar con tests unitarios de cálculo de `subtotal`, `total` e `item_count`
- [x] 2.2 Servicio `services/cart.py`: `get_or_create_cart` tolerante a concurrencia, añadir (suma de cantidades), cambiar cantidad, eliminar, vaciar, con validación de producto activo, stock 0 y tope por stock con mensaje que indica el stock disponible; verificar con tests de servicio de cada rama
- [x] 2.3 Router `routers/cart.py` bajo `/api/cart` con `CustomerUser` y registro en `main.py`; verificar con tests de integración de caso feliz y de `401`, `403` (admin), `404` (producto inexistente/inactivo e ítem ajeno), `409` (stock 0 y superación de stock) y `422`
- [x] 2.4 Tests de reglas del carrito: aislamiento entre clientes, persistencia entre sesiones, vaciar conserva el `id`, el carrito no modifica el stock y los ítems de productos desactivados salen con `available: false` y son eliminables; verificar con `uv run pytest backend/tests/test_cart.py`
- [x] 2.5 Actualizar `docs/specs-prds/carrito.md` con el campo `available` de `CartItemOut`; verificar releyendo que el contrato coincide con los esquemas

## 3. Backend: pedidos

- [x] 3.1 Esquemas `OrderOut`, `OrderItemOut`, `OrderStatusUpdate` (solo `confirmed|shipped|delivered|cancelled`) y reutilizar `Page`; verificar con tests de serialización de importes y de rechazo de `pending` o estados desconocidos (`422`)
- [x] 3.2 Servicio `services/orders.py`: creación desde el carrito en una transacción con bloqueo ordenado de productos, validación de stock y productos inactivos (`409` con detalle por producto), snapshot de nombre y precio y vaciado del carrito; verificar con tests de pedido correcto, carrito vacío (`400`), stock insuficiente, producto inactivo y que ante error carrito y stock quedan intactos
- [x] 3.3 Tabla `ALLOWED_TRANSITIONS` y `change_status` con efectos de stock (confirmar descuenta con `409` si no alcanza; cancelar desde `confirmed`/`shipped` restituye; desde `pending` no toca); verificar con un test parametrizado de todas las combinaciones origen/destino y de los movimientos de stock
- [x] 3.4 Router `routers/orders.py`: `POST /api/orders`, `GET /api/orders` (paginado, `status`, `user_id` solo admin), `GET /api/orders/{id}` (`404` para ajenos), `POST /api/orders/{id}/cancel` (cliente dueño, `403` admin) y `PATCH /api/orders/{id}/status` (solo admin); registro en `main.py`; verificar con tests de integración de `401`, `403`, `404`, `409`, `422` y caso feliz de cada endpoint
- [x] 3.5 Tests de reglas de negocio: precios del pedido inmutables tras editar el producto, un cliente no ve ni cancela pedidos ajenos, el listado de cliente ignora `user_id`, orden descendente y paginación con `page_size > 100` rechazado; verificar con `uv run pytest backend/tests/test_orders.py`
- [x] 3.6 Test de concurrencia con sesiones independientes: dos confirmaciones simultáneas que superan el stock dejan una confirmada, una `409` y stock no negativo; dos cambios de estado simultáneos del mismo pedido no duplican el movimiento de stock; verificar ejecutándolo varias veces seguidas sin fallos
- [x] 3.7 Ejecutar `uv run pytest` y `uv run ruff check . && uv run ruff format --check .` completos; verificar que pasan sin errores

## 4. Frontend: carrito

- [x] 4.1 Crear `api/cart.js` y `context/CartContext.jsx` (carga solo para `customer`, `addItem`, `updateItem`, `removeItem`, `clear`, `refresh`, `item_count`) y envolver la app; verificar con tests unitarios del contexto (cliente carga, admin no hace peticiones, errores `409` propagan el mensaje)
- [x] 4.2 Activar el botón "Añadir al carrito" en catálogo y detalle de producto (deshabilitado con stock 0 y para admin) con aviso de éxito/error; verificar con tests de componente de ambos casos y del mensaje de stock superado
- [x] 4.3 Contador de ítems en el header solo para clientes, con fondo `accent` y texto `ink`; verificar con test de que aparece para `customer`, se actualiza al añadir y no aparece para `admin`, y con el escáner de tokens en `pnpm test`
- [x] 4.4 Página `/carrito` con imagen, nombre, precio, selector de cantidad con tope de stock, subtotal, eliminar, "Vaciar carrito", ítems no disponibles señalados (`text-muted` y etiqueta "No disponible"), resumen con total, estado vacío con `EmptyState` y enlace al catálogo y estados de carga/error con el aviso de error; verificar con tests de componente, `pnpm test` (escáner de tokens sin clases fuera de la guía) y comprobación visual responsive con `pnpm dev`

## 5. Frontend: pedidos

- [x] 5.1 Crear `api/orders.js` y flujo de confirmación desde `/carrito` ("Realizar pedido": resumen, confirmar, redirigir a `/pedidos/:id`, refrescar carrito, mostrar `409` por producto con el aviso de error); verificar con test de componente del flujo feliz y del error de stock, y con el escáner de tokens en `pnpm test`
- [x] 5.2 Páginas de cliente `/pedidos` (paginado, filtro por estado, estado con `Badge`, vacío con `EmptyState`) y `/pedidos/:id` (ítems, totales, `Badge`, "Cancelar pedido" solo en `pending`); verificar con tests de componente de listado, filtro, detalle y visibilidad del botón, y con el escáner de tokens en `pnpm test`
- [x] 5.3 Páginas admin `/admin/pedidos` (tabla con filtros por estado y cliente) y `/admin/pedidos/:id` (datos del cliente y selector limitado a transiciones válidas, estado con `Badge` y error `409` visible); verificar con tests de componente de filtros y de las transiciones ofrecidas por estado, y con el escáner de tokens en `pnpm test`
- [x] 5.4 Rutas en `App.jsx` con `RequireRole` (`customer` para `/carrito` y `/pedidos*`, `admin` para `/admin/pedidos*`) y enlaces en el header; verificar con tests de redirección `403` por rol incorrecto

## 6. Verificación integral

- [x] 6.1 Tests Playwright en `frontend/e2e/`: cliente añade al carrito, supera stock (error), crea pedido, lo cancela; admin confirma, envía y entrega otro pedido y se comprueba el cambio de stock y que el `Badge` muestra el estado esperado tras cada transición; verificar con `pnpm test:e2e` contra `docker compose up --build`
- [x] 6.2 Ejecutar `pnpm test`, `pnpm build` y la suite completa del backend; verificar que todo pasa
- [x] 6.3 Actualizar el README con los endpoints y pantallas nuevos y confirmar que `.env.example` no necesita variables nuevas; verificar que el README describe los flujos como funcionan

## Workflow follow-up

- Aplicar esta change después de `apply-design-system`.
- Archivar el cambio tras la revisión (`/opsx:archive`).
