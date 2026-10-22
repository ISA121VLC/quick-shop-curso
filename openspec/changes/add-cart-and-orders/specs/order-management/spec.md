# Spec Delta

## Purpose

Define los pedidos: creación desde el carrito con snapshot de precios, consulta con visibilidad por rol, cancelación por el cliente, máquina de estados gestionada por el administrador y reglas de movimiento de stock.

## ADDED Requirements

### Requirement: Crear pedido desde el carrito
El sistema SHALL crear con `POST /api/orders` (sin cuerpo) un pedido en estado `pending` a partir del carrito del cliente, copiando cada ítem con `product_id`, `product_name`, `unit_price` y `quantity`, calculando `total` como suma de subtotales y vaciando el carrito, todo en una única transacción. Responde `201` con `OrderOut`.

#### Scenario: Pedido correcto
- **WHEN** un cliente con ítems válidos invoca `POST /api/orders`
- **THEN** responde `201` con estado `pending`, `total` igual a la suma de subtotales y el carrito queda vacío

#### Scenario: Carrito vacío
- **WHEN** el cliente no tiene ítems
- **THEN** responde `400` y no se crea ningún pedido

#### Scenario: Solo clientes
- **WHEN** el admin invoca `POST /api/orders`
- **THEN** responde `403`

### Requirement: Validación atómica al crear el pedido
El sistema SHALL validar al crear el pedido que cada producto esté activo y tenga stock suficiente; si alguna validación falla, MUST responder `409` con el detalle por producto sin modificar carrito, stock ni pedidos.

#### Scenario: Stock insuficiente
- **WHEN** un ítem del carrito supera el stock actual de su producto
- **THEN** responde `409` indicando el producto afectado y el stock disponible, y el carrito conserva todos sus ítems

#### Scenario: Producto inactivo
- **WHEN** el carrito contiene un producto inactivo
- **THEN** responde `409` indicando el producto no disponible y no se crea el pedido

### Requirement: Crear el pedido no descuenta stock
El sistema MUST NOT modificar el stock al crear un pedido; solo valida la disponibilidad.

#### Scenario: Stock tras crear
- **WHEN** se crea un pedido con 2 unidades de un producto con stock 5
- **THEN** el stock del producto sigue siendo 5

### Requirement: Snapshot inmutable de precios
El sistema SHALL conservar en cada línea del pedido el nombre y el precio unitario del producto en el momento de la creación.

#### Scenario: Edición posterior del producto
- **WHEN** el admin cambia el precio o el nombre de un producto con pedidos existentes
- **THEN** los pedidos anteriores mantienen el nombre, el precio unitario y el total originales

### Requirement: Listado de pedidos con visibilidad por rol
El sistema SHALL devolver en `GET /api/orders` una página `{ items, total, page, page_size }` ordenada por fecha descendente, con `page_size` máximo 100 y filtro `status`. Un cliente MUST ver solo sus pedidos; el admin ve todos y puede filtrar por `user_id`.

#### Scenario: Cliente
- **WHEN** un cliente lista pedidos
- **THEN** solo recibe los suyos, aunque indique `user_id` de otro usuario

#### Scenario: Administrador
- **WHEN** el admin lista pedidos con `status=pending` y `user_id=X`
- **THEN** recibe los pedidos pendientes del usuario X

#### Scenario: Parámetros inválidos
- **WHEN** `page_size` es mayor que 100 o `status` no es un estado válido
- **THEN** responde `422`

### Requirement: Detalle de pedido sin filtrar existencia
El sistema SHALL devolver `OrderOut` en `GET /api/orders/{id}`; un cliente que solicite un pedido ajeno o inexistente MUST recibir `404`.

#### Scenario: Pedido ajeno
- **WHEN** un cliente solicita el pedido de otro cliente
- **THEN** responde `404`

#### Scenario: Administrador
- **WHEN** el admin solicita cualquier pedido existente
- **THEN** responde `200`

### Requirement: Cancelación del cliente
El sistema SHALL permitir con `POST /api/orders/{id}/cancel` que el cliente dueño cancele su pedido solo si está `pending`, sin modificar el stock.

#### Scenario: Cancelación válida
- **WHEN** el cliente dueño cancela un pedido `pending`
- **THEN** responde `200` con estado `cancelled` y el stock no cambia

#### Scenario: Pedido no pendiente
- **WHEN** el cliente cancela un pedido `confirmed`, `shipped`, `delivered` o `cancelled`
- **THEN** responde `409`

#### Scenario: Admin en el endpoint del cliente
- **WHEN** el admin invoca `POST /api/orders/{id}/cancel`
- **THEN** responde `403`

### Requirement: Transiciones de estado controladas por el admin
El sistema SHALL permitir con `PATCH /api/orders/{id}/status` (solo admin) las transiciones `pending`->`confirmed`, `pending`->`cancelled`, `confirmed`->`shipped`, `confirmed`->`cancelled`, `shipped`->`delivered` y `shipped`->`cancelled`; cualquier otra MUST responder `409`. `delivered` y `cancelled` son estados finales.

#### Scenario: Transición válida
- **WHEN** el admin cambia un pedido `confirmed` a `shipped`
- **THEN** responde `200` con el nuevo estado

#### Scenario: Transición no permitida
- **WHEN** el admin intenta pasar de `pending` a `delivered` o desde un estado final
- **THEN** responde `409` y el estado no cambia

#### Scenario: Cliente
- **WHEN** un cliente invoca `PATCH /api/orders/{id}/status`
- **THEN** responde `403`

#### Scenario: Estado inválido
- **WHEN** el cuerpo trae un estado fuera de `confirmed`, `shipped`, `delivered`, `cancelled`
- **THEN** responde `422`

### Requirement: Confirmar descuenta stock
El sistema SHALL descontar de cada producto la cantidad del pedido al pasar de `pending` a `confirmed`. Si algún producto no tiene stock suficiente, MUST responder `409` sin modificar el stock ni el estado.

#### Scenario: Confirmación correcta
- **WHEN** el admin confirma un pedido con stock suficiente
- **THEN** el stock de cada producto disminuye en la cantidad pedida

#### Scenario: Stock insuficiente al confirmar
- **WHEN** un producto del pedido tiene menos stock que la cantidad pedida
- **THEN** responde `409` y ningún stock ni el estado cambian

#### Scenario: Confirmaciones concurrentes
- **WHEN** dos pedidos que juntos superan el stock se confirman a la vez
- **THEN** exactamente uno se confirma, el otro recibe `409` y el stock nunca es negativo

### Requirement: Cancelar restituye stock según el estado
El sistema SHALL restituir el stock de cada producto al cancelar un pedido en `confirmed` o `shipped`, y MUST NOT modificarlo al cancelar uno en `pending`.

#### Scenario: Cancelar un pedido confirmado
- **WHEN** el admin cancela un pedido `confirmed`
- **THEN** el stock de cada producto aumenta en la cantidad pedida

#### Scenario: Cancelar un pedido pendiente
- **WHEN** se cancela un pedido `pending`
- **THEN** el stock no cambia

### Requirement: Representación del pedido
El sistema SHALL devolver `OrderOut` con `id`, `user_id`, `status`, `total`, `items` (`product_id`, `product_name`, `unit_price`, `quantity`, `subtotal`), `created_at` y `updated_at`, con importes como cadena de 2 decimales.

#### Scenario: Subtotales
- **WHEN** se consulta un pedido con 3 unidades a `2.50`
- **THEN** la línea muestra `unit_price` `"2.50"` y `subtotal` `"7.50"`
