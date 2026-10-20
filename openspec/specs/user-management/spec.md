# user-management Specification

## Purpose

Define la entidad de usuario con sus roles, el seed inicial, la gestión del perfil propio y la consulta de usuarios por parte del administrador.

## Requirements

### Requirement: Seed idempotente de usuarios
El sistema SHALL crear al arrancar, solo si la base de datos está vacía, un administrador y dos clientes con credenciales tomadas de la configuración.

#### Scenario: Primer arranque
- **WHEN** el backend arranca con la base de datos vacía
- **THEN** existen exactamente 1 usuario `admin` (`admin@quickshop.com`) y 2 usuarios `customer`

#### Scenario: Rearranque
- **WHEN** el backend arranca con datos existentes
- **THEN** no se crean usuarios duplicados

### Requirement: Unicidad de email sin distinguir mayúsculas
El sistema SHALL garantizar a nivel de base de datos que no existan dos usuarios con el mismo email ignorando mayúsculas.

#### Scenario: Colisión por mayúsculas
- **WHEN** se intenta insertar `Ana@x.com` existiendo `ana@x.com`
- **THEN** la operación falla por unicidad

### Requirement: Administrador único y no creable públicamente
El sistema MUST NOT ofrecer ningún endpoint para crear administradores.

#### Scenario: Tras el seed
- **WHEN** se consulta el total de usuarios con rol `admin`
- **THEN** el resultado es exactamente 1

### Requirement: Consulta del perfil propio
El sistema SHALL devolver el perfil del usuario autenticado en `GET /api/users/me` sin incluir `password_hash`.

#### Scenario: Perfil propio
- **WHEN** un usuario autenticado solicita `GET /api/users/me`
- **THEN** recibe `200` con sus datos y sin hash de contraseña

#### Scenario: Sin sesión
- **WHEN** se solicita sin autenticar
- **THEN** responde `401`

### Requirement: Edición del nombre
El sistema SHALL permitir al usuario modificar únicamente su `full_name` (1 a 120 caracteres) mediante `PATCH /api/users/me`.

#### Scenario: Actualización correcta
- **WHEN** envía un nombre válido
- **THEN** responde `200` con el usuario actualizado y `updated_at` renovado

#### Scenario: Intento de cambiar email o rol
- **WHEN** envía `email` o `role` en el cuerpo
- **THEN** esos valores no se modifican

#### Scenario: Nombre inválido
- **WHEN** envía un nombre vacío o de más de 120 caracteres
- **THEN** responde `422`

### Requirement: Cambio de contraseña
El sistema SHALL exigir la contraseña actual para cambiar la contraseña mediante `POST /api/users/me/password` y almacenar la nueva como hash bcrypt.

#### Scenario: Cambio correcto
- **WHEN** envía la contraseña actual correcta y una nueva que cumple las reglas
- **THEN** responde `204` y el siguiente login solo funciona con la nueva contraseña

#### Scenario: Contraseña actual incorrecta
- **WHEN** la contraseña actual no coincide
- **THEN** responde `400`

#### Scenario: Nueva contraseña débil
- **WHEN** la nueva contraseña incumple las reglas
- **THEN** responde `422`

### Requirement: Consulta de usuarios por el administrador
El sistema SHALL permitir solo al administrador listar usuarios con paginación, filtro por rol y búsqueda por email o nombre, y consultar un usuario por id.

#### Scenario: Listado paginado
- **WHEN** el administrador solicita `GET /api/users?page=1&page_size=20`
- **THEN** responde `200` con `items`, `total`, `page` y `page_size`

#### Scenario: Filtros
- **WHEN** indica `role=customer` y `q` con un fragmento de email o nombre
- **THEN** solo se devuelven clientes que coinciden

#### Scenario: Tamaño de página excesivo
- **WHEN** `page_size` es mayor que 100
- **THEN** responde `422`

#### Scenario: Usuario inexistente
- **WHEN** el administrador solicita `GET /api/users/{id}` de un id inexistente
- **THEN** responde `404`

#### Scenario: Cliente sin permiso
- **WHEN** un cliente solicita `GET /api/users` o `GET /api/users/{id}`
- **THEN** responde `403`

### Requirement: Pantallas de usuario
El frontend SHALL ofrecer `/perfil` para ver el perfil (email de solo lectura), editar el nombre y cambiar la contraseña, y `/admin/usuarios` con tabla paginada de solo lectura para el administrador.

#### Scenario: Edición de nombre desde el perfil
- **WHEN** el cliente guarda un nombre nuevo en `/perfil`
- **THEN** la interfaz muestra el nombre actualizado, también en el header

#### Scenario: Error al cambiar contraseña
- **WHEN** la contraseña actual es incorrecta
- **THEN** se muestra el error en el formulario
