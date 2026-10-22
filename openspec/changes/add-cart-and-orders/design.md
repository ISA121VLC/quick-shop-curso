# Design

## Context

Backend FastAPI con servicios por módulo (`services/`), routers finos y dependencias `CustomerUser`/`AdminUser` ya existentes en `core/deps.py`. Hay una migración (`0001_users_and_products`) y los tests corren contra PostgreSQL real. El frontend tiene `api/client.js` (`request`), `AuthContext`, `RequireAuth`/`RequireRole` y el catálogo con el botón de añadir sin funcionalidad. Las specs de `docs/specs-prds/carrito.md` y `pedidos.md` son la fuente de verdad del contrato; ver `proposal.md` para la motivación. La guía visual es `DESIGN.md`; esta change depende de `apply-design-system` (tokens y componentes compartidos de `ui.jsx`).

## Goals / Non-Goals

**Goals:**
- Que ningún camino de código deje stock negativo ni descuente o restituya stock dos veces.
- Mantener la lógica de estados y stock en un único servicio, testeable sin HTTP.
- Reutilizar el cliente HTTP y los patrones de página existentes en el frontend.

**Non-Goals:**
- Reserva de stock, pagos, envío, emails, historial de cambios de estado (auditoría).

## Decisions

1. **Descuento de stock en la confirmación, no en la creación.** Es la decisión ya recogida en `pedidos.md`: evita doble descuento y la restitución solo aplica a `confirmed`/`shipped`. Alternativa: reservar al crear; descartada porque obligaría a restituir también al cancelar `pending` y a gestionar reservas de pedidos abandonados. La nota de la spec pide revisarlo con el responsable del producto; este cambio la mantiene tal cual.

2. **Máquina de estados como tabla de transiciones.** Un diccionario `ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]]` en `services/orders.py` y una función `change_status(db, order, new_status, actor)`. Los efectos de stock se derivan del par (origen, destino): `pending->confirmed` descuenta; `confirmed|shipped->cancelled` restituye. El endpoint de cancelación del cliente reutiliza `change_status` tras comprobar propiedad y estado `pending`. Alternativa: lógica por endpoint; descartada por duplicar reglas.

3. **Bloqueo de filas y orden determinista.** Las operaciones de stock cargan los productos con `select(Product).where(id.in_(...)).order_by(Product.id).with_for_update()`. Ordenar por id evita interbloqueos entre transacciones concurrentes que tocan los mismos productos. En la confirmación se bloquea además el pedido (`FOR UPDATE`) antes de leer su estado, para que dos cambios de estado simultáneos del mismo pedido se serialicen y la segunda vea el estado ya cambiado (`409`).

4. **Una transacción por operación.** El servicio hace todas las validaciones y escrituras y un único `commit` al final; ante `HTTPException` se hace `rollback` (la sesión por petición lo garantiza al cerrarse). La creación del pedido bloquea los productos del carrito, valida, inserta `orders`/`order_items` y borra los `cart_items` en la misma transacción.

5. **Carrito perezoso con `get_or_create`.** Se crea con `INSERT ... ON CONFLICT DO NOTHING` sobre `user_id` único y se vuelve a leer, para tolerar dos primeras peticiones simultáneas. `POST /cart/items` bloquea el producto (`FOR UPDATE`) al comprobar el stock para que la validación y la escritura sean coherentes; la restricción `UNIQUE (cart_id, product_id)` cubre la suma concurrente del mismo producto (en conflicto se reintenta como incremento).

6. **Campo `available` en `CartItemOut`.** La spec exige señalar los ítems de productos inactivos, pero `CartItemOut` no define cómo. Se añade `available: bool` (`product.is_active`). Es una ampliación aditiva del contrato y se documenta en `docs/specs-prds/carrito.md`. El `product` embebido reutiliza `ProductOut`. Un producto con stock 0 pero activo se muestra con `available: true`; el aviso de stock se resuelve al operar o al crear el pedido (`409`).

7. **Importes.** `Decimal` con `quantize(Decimal("0.01"))` en esquemas (`subtotal`, `total`) y `Numeric(10,2)` / `Numeric(12,2)` en BD; el JSON los serializa como cadena, igual que el precio de producto. `product_id` en `order_items` es FK sin `ON DELETE` (los productos solo se desactivan).

8. **Enumeración de estado.** `OrderStatus` como `enum.StrEnum` mapeado con `sqlalchemy.Enum(..., native_enum=True)` en PostgreSQL; la migración crea el tipo. Índices `orders(user_id, created_at DESC)` y `orders(status)` según la spec.

9. **Filtros del listado.** `user_id` solo se aplica al admin; para un cliente se ignora y se fuerza su propio id (no se devuelve error, para no revelar nada). `status` se valida con el enum (`422`).

10. **Frontend: `CartContext`.** Mantiene el carrito y `item_count` para el header; solo carga si el usuario es `customer`. Expone `addItem`, `updateItem`, `removeItem`, `clear` y `refresh`, y tras crear un pedido se refresca (queda vacío). Los errores `409` se muestran con el mensaje del backend en un aviso. Rutas nuevas bajo `RequireAuth`; `/carrito` y `/pedidos*` con `RequireRole roles={['customer']}`, `/admin/pedidos*` con `['admin']`. El detalle `/pedidos/:id` lo usan solo clientes; el admin usa `/admin/pedidos/:id`, ambos sobre `GET /api/orders/{id}`.

11. **Selector de estado del admin.** Se limita en cliente a las transiciones válidas desde el estado actual (misma tabla duplicada como constante en el frontend); el backend sigue siendo la autoridad y devuelve `409`.

12. **Estilo visual.** Las páginas de carrito y pedidos usan solo los tokens y componentes compartidos de `apply-design-system`: `Badge` para el estado del pedido (colores de "Aplicación a QuickShop" en `DESIGN.md`), el aviso de error para los `409` (stock superado), `EmptyState` para carrito y listados vacíos, y el contador del header con fondo `accent` y texto `ink`. Un solo botón primario por pantalla ("Realizar pedido" en el carrito, "Confirmar pedido" en la confirmación). No se definen estilos nuevos fuera de la guía.

## Risks / Trade-offs

- [Stock insuficiente aparece al confirmar y no al crear] → El pedido `pending` puede no ser confirmable; el admin recibe `409` con el detalle y puede cancelarlo. Es consecuencia de la decisión 1.
- [Interbloqueos en confirmaciones concurrentes] → Orden determinista por `product.id` en los bloqueos (decisión 3) y test de concurrencia con dos hilos.
- [Tabla de transiciones duplicada en frontend y backend] → El frontend solo la usa para la UI; test del backend como autoridad. Aceptado por simplicidad.
- [`available` cambia el contrato del carrito] → Cambio aditivo; se actualiza `carrito.md`.
- [Test de concurrencia con sesiones reales] → Usar sesiones independientes en el test (no la transacción con rollback por test), aislando sus datos y limpiándolos al final.
- [Aplicar esta change antes que `apply-design-system`] → Las pantallas nuevas tendrían que migrarse después; se evita respetando el orden de aplicación.

## Migration Plan

Una migración Alembic `0002_cart_and_orders` crea `carts`, `cart_items`, el tipo enum `order_status`, `orders`, `order_items` e índices. Se ejecuta automáticamente al arrancar. Rollback: `downgrade` elimina las tablas y el tipo enum; no hay datos previos que migrar ni seed nuevo.
