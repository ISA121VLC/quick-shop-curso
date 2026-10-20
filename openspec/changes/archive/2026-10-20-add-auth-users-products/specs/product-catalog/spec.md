# Spec Delta

## Purpose

Define el catálogo de productos: su consulta por usuarios autenticados, la gestión por el administrador con baja lógica y las reglas de precio y stock.

## ADDED Requirements

### Requirement: Seed del catálogo
El sistema SHALL crear 20 productos a partir de `docs/products-images.json` cuando la base de datos está vacía, sin duplicarlos en rearranques.

#### Scenario: Primer arranque
- **WHEN** el backend arranca con la base de datos vacía
- **THEN** existen exactamente 20 productos con nombre, descripción, precio, stock e imagen del JSON

#### Scenario: Rearranque
- **WHEN** el backend arranca con productos existentes
- **THEN** el número de productos no cambia

### Requirement: Restricciones de precio y stock
El sistema SHALL exigir precio mayor que 0 con como máximo 2 decimales y stock entero mayor o igual a 0, tanto en la API como en la base de datos.

#### Scenario: Precio inválido
- **WHEN** se crea o actualiza un producto con precio menor o igual a 0 o con más de 2 decimales
- **THEN** responde `422`

#### Scenario: Stock negativo
- **WHEN** se envía un stock menor que 0
- **THEN** responde `422`

#### Scenario: Serialización del precio
- **WHEN** se devuelve un producto
- **THEN** `price` es una cadena con exactamente 2 decimales

### Requirement: Listado de productos
El sistema SHALL devolver `GET /api/products` paginado a cualquier usuario autenticado, con búsqueda por nombre y filtro de stock.

#### Scenario: Paginación por defecto
- **WHEN** un usuario autenticado solicita el listado sin parámetros
- **THEN** responde `200` con `items` (hasta 12), `total`, `page` y `page_size`

#### Scenario: Búsqueda y filtro
- **WHEN** indica `q` e `in_stock=true`
- **THEN** solo se devuelven productos cuyo nombre coincide y con stock mayor que 0, y `total` refleja el número filtrado

#### Scenario: Sin autenticar
- **WHEN** se solicita sin sesión
- **THEN** responde `401`

#### Scenario: Parámetros inválidos
- **WHEN** `page_size` supera 100 o `page` es menor que 1
- **THEN** responde `422`

### Requirement: Visibilidad de productos inactivos
El sistema SHALL ocultar a los clientes los productos con `is_active = false` y permitir al administrador verlos con `include_inactive=true`.

#### Scenario: Cliente
- **WHEN** un cliente lista productos, incluso con `include_inactive=true`
- **THEN** no aparecen productos inactivos

#### Scenario: Administrador
- **WHEN** el administrador lista con `include_inactive=true`
- **THEN** aparecen también los productos inactivos

#### Scenario: Detalle de inactivo
- **WHEN** un cliente solicita `GET /api/products/{id}` de un producto inactivo o inexistente
- **THEN** responde `404`

### Requirement: Productos sin stock visibles
El sistema SHALL listar los productos con stock 0 mostrando `stock: 0`.

#### Scenario: Producto agotado
- **WHEN** un producto tiene stock 0 y está activo
- **THEN** aparece en el listado con `stock: 0`

### Requirement: Gestión de productos por el administrador
El sistema SHALL permitir solo al administrador crear (`POST`), reemplazar (`PUT`), actualizar parcialmente (`PATCH`) y dar de baja (`DELETE`) productos.

#### Scenario: Creación
- **WHEN** el administrador envía un producto válido a `POST /api/products`
- **THEN** responde `201` con el producto creado

#### Scenario: Actualización
- **WHEN** el administrador usa `PUT` o `PATCH` sobre un producto existente con datos válidos
- **THEN** responde `200` con el producto actualizado

#### Scenario: Producto inexistente
- **WHEN** el administrador actualiza o elimina un id inexistente
- **THEN** responde `404`

#### Scenario: Cliente sin permiso
- **WHEN** un cliente intenta crear, editar o eliminar un producto
- **THEN** responde `403`

### Requirement: Baja lógica
El sistema SHALL implementar `DELETE /api/products/{id}` como baja lógica poniendo `is_active = false`, sin borrar la fila.

#### Scenario: Eliminación
- **WHEN** el administrador elimina un producto
- **THEN** responde `204`, el producto sigue existiendo en base de datos como inactivo y deja de verse para clientes

### Requirement: Pantallas de catálogo
El frontend SHALL ofrecer el catálogo en `/` con cuadrícula responsive, búsqueda, filtro "en stock" y paginación, y el detalle en `/productos/:id`.

#### Scenario: Producto sin stock
- **WHEN** un cliente ve un producto con stock 0
- **THEN** la tarjeta y el detalle muestran la etiqueta "Sin stock" y la acción de añadir al carrito está deshabilitada

#### Scenario: Administrador en el catálogo
- **WHEN** el administrador ve el catálogo
- **THEN** no se muestra ninguna acción de carrito

#### Scenario: Estados de carga, vacío y error
- **WHEN** el listado está cargando, no tiene resultados o falla la petición
- **THEN** se muestra un estado de carga, de vacío o de error respectivamente

### Requirement: Gestión de productos en el frontend
El frontend SHALL ofrecer a administradores `/admin/productos` con tabla que incluye inactivos y acciones de crear, editar y desactivar, y un formulario con validación de precio y stock en cliente.

#### Scenario: Creación desde el formulario
- **WHEN** el administrador completa `/admin/productos/nuevo` con datos válidos
- **THEN** el producto se crea y aparece en la tabla

#### Scenario: Validación en cliente
- **WHEN** el administrador introduce precio menor o igual a 0 o stock negativo
- **THEN** el formulario muestra el error y no envía la petición

#### Scenario: Desactivación
- **WHEN** el administrador desactiva un producto
- **THEN** la tabla lo muestra como inactivo
