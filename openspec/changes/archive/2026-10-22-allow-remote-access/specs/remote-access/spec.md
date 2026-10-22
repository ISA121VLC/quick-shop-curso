# Spec Delta

## Purpose

Permitir usar QuickShop desde cualquier equipo que alcance al servidor, con una única URL de acceso y sin configurar la IP ni el dominio en la compilación del frontend ni en CORS.

## ADDED Requirements

### Requirement: Origen único para web y API
El sistema SHALL servir la interfaz y exponer la API bajo el mismo origen, de modo que las peticiones `/api/*` hechas desde el navegador lleguen al backend a través del servidor del frontend.

#### Scenario: Petición a la API desde otro equipo
- **WHEN** un navegador abre la web usando la IP o el dominio del servidor y solicita `/api/products`
- **THEN** la petición llega al backend y recibe su respuesta (por ejemplo `401` sin sesión), sin error de red ni de CORS

#### Scenario: Cambio de IP o dominio sin recompilar
- **WHEN** el servidor se accede con una IP o dominio distintos a los usados en el despliegue anterior
- **THEN** la aplicación funciona sin reconstruir la imagen del frontend ni modificar `CORS_ORIGINS`

### Requirement: Inicio de sesión desde un origen remoto
El sistema SHALL permitir iniciar sesión y mantener la sesión por cookie `HttpOnly` cuando la web se carga desde un origen distinto de `localhost`.

#### Scenario: Login desde otro equipo
- **WHEN** un usuario con credenciales válidas envía `POST /api/auth/login` desde la web cargada por la IP del servidor
- **THEN** el sistema responde `200`, establece la cookie `HttpOnly` y las peticiones posteriores a `/api/auth/me` devuelven al usuario

#### Scenario: Acceso por HTTPS mediante túnel
- **WHEN** la web se publica detrás de un túnel o proxy inverso con HTTPS y `COOKIE_SECURE` es `true`
- **THEN** la cookie de sesión se emite con el atributo `Secure` y el login funciona

### Requirement: URL de API configurable solo para origen distinto
El sistema SHALL usar rutas relativas `/api` cuando `VITE_API_URL` está vacío y SHALL usar el valor de `VITE_API_URL` como prefijo cuando se indica.

#### Scenario: Variable vacía
- **WHEN** `VITE_API_URL` está vacío en el build del frontend
- **THEN** el navegador llama a `<origen-de-la-web>/api/...`

#### Scenario: API en otro origen
- **WHEN** `VITE_API_URL` contiene la URL de una API externa y su origen está en `CORS_ORIGINS`
- **THEN** el navegador llama a esa URL con credenciales y el backend la admite por CORS

### Requirement: Backend no expuesto a la red
El sistema SHALL publicar el puerto del backend en el host solo en la interfaz de loopback.

#### Scenario: Acceso directo al backend desde otro equipo
- **WHEN** un equipo remoto intenta conectar con el puerto del backend del servidor
- **THEN** la conexión es rechazada y la API solo es alcanzable a través del frontend

#### Scenario: Depuración local
- **WHEN** se accede a `http://127.0.0.1:<BACKEND_PORT>/docs` desde el servidor
- **THEN** se muestra la documentación de la API
