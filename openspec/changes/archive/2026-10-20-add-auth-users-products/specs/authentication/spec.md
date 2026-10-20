# Spec Delta

## Purpose

Define el registro público de clientes, el inicio y cierre de sesión mediante cookie `HttpOnly` y la identificación del usuario actual, de modo que el resto de módulos puedan restringir el acceso por rol.

## ADDED Requirements

### Requirement: Registro público de clientes
El sistema SHALL permitir a un visitante registrarse con email, contraseña y nombre completo, creando siempre un usuario con rol `customer` sin iniciar sesión.

#### Scenario: Registro correcto
- **WHEN** un visitante envía `POST /api/auth/register` con email válido, contraseña que cumple las reglas y nombre de 1 a 120 caracteres
- **THEN** el sistema responde `201` con el usuario (`id`, `email`, `full_name`, `role` = `customer`, `is_active`, `created_at`) y no establece cookie de sesión

#### Scenario: Email duplicado sin distinguir mayúsculas
- **WHEN** se registra un email que ya existe con otra combinación de mayúsculas y minúsculas
- **THEN** el sistema responde `409`

#### Scenario: Contraseña débil
- **WHEN** la contraseña tiene menos de 8 caracteres o carece de mayúscula, minúscula, dígito o símbolo
- **THEN** el sistema responde `422`

#### Scenario: Intento de elegir rol
- **WHEN** la petición de registro incluye un campo `role` con valor `admin`
- **THEN** el usuario creado tiene rol `customer`

### Requirement: Inicio de sesión con cookie HttpOnly
El sistema SHALL autenticar con email y contraseña y entregar el access token solo en una cookie `HttpOnly` con `SameSite=Lax` y `Max-Age=7200`.

#### Scenario: Login correcto
- **WHEN** un usuario activo envía `POST /api/auth/login` con credenciales válidas
- **THEN** el sistema responde `200` con el usuario, establece la cookie `HttpOnly` y el cuerpo no contiene el token

#### Scenario: Credenciales inválidas
- **WHEN** el email no existe o la contraseña es incorrecta
- **THEN** el sistema responde `401` con el mismo mensaje en ambos casos

#### Scenario: Usuario inactivo
- **WHEN** un usuario con `is_active = false` inicia sesión con credenciales correctas
- **THEN** el sistema responde `403`

### Requirement: Cierre de sesión idempotente
El sistema SHALL invalidar la cookie de sesión en `POST /api/auth/logout` con independencia de que exista sesión.

#### Scenario: Logout con sesión
- **WHEN** un usuario autenticado envía `POST /api/auth/logout`
- **THEN** el sistema responde `204`, expira la cookie y `GET /api/auth/me` posterior responde `401`

#### Scenario: Logout sin sesión
- **WHEN** un visitante sin cookie envía `POST /api/auth/logout`
- **THEN** el sistema responde `204`

### Requirement: Identificación del usuario actual
El sistema SHALL devolver el usuario autenticado en `GET /api/auth/me` a partir de la cookie de sesión.

#### Scenario: Sesión válida
- **WHEN** se solicita `GET /api/auth/me` con una cookie válida
- **THEN** el sistema responde `200` con el usuario autenticado

#### Scenario: Token ausente, manipulado o expirado
- **WHEN** la cookie falta, está alterada o tiene más de 2 horas
- **THEN** el sistema responde `401`

#### Scenario: Usuario desactivado con token vigente
- **WHEN** el usuario del token tiene `is_active = false`
- **THEN** el sistema responde `403`

### Requirement: Contenido y vigencia del token
El token SHALL contener el identificador del usuario, su rol, la fecha de emisión y una expiración de 2 horas, firmado con un secreto leído de la configuración.

#### Scenario: Expiración
- **WHEN** transcurren más de 2 horas desde la emisión
- **THEN** cualquier endpoint protegido responde `401`

### Requirement: Contraseñas protegidas
El sistema SHALL almacenar las contraseñas únicamente como hash bcrypt y MUST NOT devolverlas en ninguna respuesta.

#### Scenario: Almacenamiento
- **WHEN** se registra un usuario
- **THEN** la base de datos contiene un hash bcrypt y ninguna respuesta de la API incluye la contraseña ni su hash

### Requirement: Autorización por rol
El sistema SHALL rechazar con `401` las peticiones sin sesión y con `403` las de un rol no permitido en endpoints restringidos por rol.

#### Scenario: Cliente en endpoint de administrador
- **WHEN** un cliente autenticado invoca un endpoint exclusivo de administrador
- **THEN** el sistema responde `403`

#### Scenario: Administrador en endpoint de cliente
- **WHEN** el administrador invoca un endpoint exclusivo de cliente
- **THEN** el sistema responde `403`

### Requirement: CORS con credenciales y configuración externa
El sistema SHALL aceptar peticiones con credenciales solo desde los orígenes configurados y MUST NOT contener secretos hardcodeados.

#### Scenario: Origen permitido
- **WHEN** una petición llega con un `Origin` incluido en la configuración de orígenes
- **THEN** la respuesta permite credenciales para ese origen

#### Scenario: Origen no permitido
- **WHEN** una petición llega desde un origen no configurado
- **THEN** la respuesta no incluye cabeceras CORS que lo autoricen

### Requirement: Sesión y rutas protegidas en el frontend
El frontend SHALL restaurar la sesión al arrancar consultando `GET /api/auth/me`, enviar siempre credenciales y MUST NOT guardar el token en `localStorage` ni `sessionStorage`.

#### Scenario: Ruta protegida sin sesión
- **WHEN** un visitante abre una ruta protegida
- **THEN** es redirigido a `/login`

#### Scenario: Rol incorrecto
- **WHEN** un cliente abre una ruta de administrador
- **THEN** ve una pantalla 403

#### Scenario: Redirección tras login
- **WHEN** un usuario inicia sesión correctamente
- **THEN** un cliente va a `/` y el administrador a `/admin/productos`

#### Scenario: Registro desde la interfaz
- **WHEN** el visitante completa `/registro` con confirmación de contraseña coincidente
- **THEN** se crea la cuenta y se le dirige a `/login`; si las contraseñas no coinciden se muestra un error en línea sin llamar a la API
