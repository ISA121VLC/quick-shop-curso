# Spec Delta

## Purpose

Define el carrito de compra persistente de cada cliente: alta, modificación, baja y vaciado de ítems, con validación contra el stock y exclusión del administrador.

## ADDED Requirements

### Requirement: Carrito exclusivo de clientes
El sistema SHALL permitir los endpoints de `/api/cart` solo al rol `customer`; el rol `admin` MUST recibir `403` en todos y un usuario sin sesión `401`.

#### Scenario: Administrador
- **WHEN** el admin invoca cualquier endpoint de `/api/cart`
- **THEN** responde `403`

#### Scenario: Sin sesión
- **WHEN** una petición sin cookie válida invoca `GET /api/cart`
- **THEN** responde `401`

### Requirement: Carrito único y persistente por cliente
El sistema SHALL mantener como máximo un carrito por cliente, almacenado en base de datos y creado en la primera operación del cliente. Un cliente MUST ver y modificar solo su propio carrito.

#### Scenario: Primera consulta
- **WHEN** un cliente sin carrito solicita `GET /api/cart`
- **THEN** responde `200` con `items` vacío, `total` `"0.00"` e `item_count` 0

#### Scenario: Persistencia entre sesiones
- **WHEN** un cliente añade un producto, cierra sesión y vuelve a iniciar sesión
- **THEN** `GET /api/cart` devuelve el mismo ítem

#### Scenario: Aislamiento entre clientes
- **WHEN** un cliente intenta modificar o eliminar un ítem del carrito de otro cliente
- **THEN** responde `404`

### Requirement: Añadir ítems al carrito
El sistema SHALL añadir un producto con `POST /api/cart/items` (`quantity` entero mayor o igual a 1, por defecto 1) y responder `201` con el carrito actualizado. Si el producto ya está en el carrito, MUST sumar la cantidad en el mismo ítem.

#### Scenario: Producto nuevo
- **WHEN** un cliente añade un producto con stock suficiente
- **THEN** responde `201` y el carrito contiene un ítem con esa cantidad

#### Scenario: Producto repetido
- **WHEN** un cliente añade dos veces el mismo producto
- **THEN** el carrito contiene un único ítem con la suma de las cantidades

#### Scenario: Cantidad inválida
- **WHEN** se envía `quantity` menor que 1 o no entera
- **THEN** responde `422`

### Requirement: Productos no añadibles
El sistema MUST NOT permitir añadir productos inexistentes, inactivos o con stock 0.

#### Scenario: Producto inexistente o inactivo
- **WHEN** se añade un `product_id` que no existe o está inactivo
- **THEN** responde `404`

#### Scenario: Stock 0
- **WHEN** se añade un producto con stock 0
- **THEN** responde `409` con un mensaje que indica que no hay stock

### Requirement: Límite de cantidad por stock
El sistema MUST NOT permitir que la cantidad de un producto en el carrito supere su stock actual, ni al añadir ni al modificar la cantidad.

#### Scenario: Suma que supera el stock
- **WHEN** un cliente añade un producto y la cantidad resultante en el carrito supera el stock
- **THEN** responde `409` con un mensaje que indica el stock disponible y el carrito no cambia

#### Scenario: Modificación que supera el stock
- **WHEN** un cliente hace `PATCH /api/cart/items/{item_id}` con una cantidad mayor que el stock
- **THEN** responde `409` con un mensaje que indica el stock disponible y la cantidad del ítem no cambia

### Requirement: Modificar y eliminar ítems
El sistema SHALL permitir cambiar la cantidad de un ítem propio con `PATCH /api/cart/items/{item_id}` y eliminarlo con `DELETE /api/cart/items/{item_id}`, respondiendo `200` con el carrito actualizado.

#### Scenario: Cambio de cantidad
- **WHEN** un cliente envía `quantity` válida y dentro del stock
- **THEN** responde `200` con la nueva cantidad y los totales recalculados

#### Scenario: Eliminación de un ítem
- **WHEN** un cliente elimina un ítem propio
- **THEN** responde `200` y el ítem ya no aparece en el carrito

#### Scenario: Ítem inexistente
- **WHEN** el `item_id` no existe
- **THEN** responde `404`

### Requirement: Vaciar el carrito
El sistema SHALL vaciar el carrito con `DELETE /api/cart` eliminando todos los ítems y conservando el carrito, y responder `200` con el carrito vacío.

#### Scenario: Vaciado
- **WHEN** un cliente con ítems invoca `DELETE /api/cart`
- **THEN** responde `200` con `items` vacío y un posterior `GET /api/cart` devuelve el mismo carrito (mismo `id`) vacío

### Requirement: Totales y representación del carrito
El sistema SHALL devolver `CartOut` con `id`, `items`, `total` e `item_count`, donde cada ítem incluye `product`, `quantity`, `subtotal` y `available`. `subtotal` y `total` MUST calcularse con `Decimal` a 2 decimales y serializarse como cadena; `item_count` es la suma de cantidades.

#### Scenario: Cálculo de totales
- **WHEN** el carrito tiene 2 unidades de un producto a `10.50` y 1 de otro a `3.25`
- **THEN** los subtotales son `"21.00"` y `"3.25"`, `total` es `"24.25"` e `item_count` es 3

### Requirement: Ítems de productos inactivos
El sistema SHALL señalar con `available: false` los ítems cuyo producto haya pasado a inactivo, y MUST permitir eliminarlos. Mientras exista alguno, la creación del pedido queda bloqueada (ver `order-management`).

#### Scenario: Producto desactivado tras añadirlo
- **WHEN** el admin desactiva un producto que está en un carrito y el cliente consulta su carrito
- **THEN** el ítem aparece con `available: false` y puede eliminarse con `DELETE /api/cart/items/{item_id}`

### Requirement: El carrito no reserva stock
El sistema MUST NOT modificar el stock de los productos al operar con el carrito.

#### Scenario: Añadir no descuenta stock
- **WHEN** un cliente añade 2 unidades de un producto con stock 5
- **THEN** el stock del producto sigue siendo 5
