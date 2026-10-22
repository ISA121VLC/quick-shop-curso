# Proposal

## Why

La web solo se podía usar desde el propio servidor: el frontend se compilaba con `VITE_API_URL=http://localhost:8000`, de modo que el navegador de otro equipo llamaba a su propio `localhost` y el login fallaba con "Failed to fetch". Hay que poder abrir QuickShop desde cualquier equipo de la red (y, con un túnel o reenvío de puertos, desde fuera) usando una única URL, sin recompilar la imagen para cada IP o dominio.

## What Changes

- El frontend se sirve con nginx y este reenvía `/api/` al backend (`http://backend:8000`); el navegador solo habla con el origen del frontend.
- `VITE_API_URL` pasa a estar vacío por defecto (rutas relativas `/api`); solo se rellena si la API vive en otro origen. Ya implementado en `frontend/nginx.conf` y `.env.example` (commit `7c17aad`).
- Se documenta en el README cómo acceder desde otro equipo de la red, qué hacer con un túnel (HTTPS, `COOKIE_SECURE=true`) y los riesgos de exponer las credenciales del seed.
- Se añade una verificación automática de que el login funciona a través del proxy de nginx (mismo origen, sin CORS).
- El puerto del backend deja de ser necesario para el navegador; se publica solo en el loopback del host (`127.0.0.1`) para depuración. **BREAKING** para quien accediera a la API directamente por `http://<ip>:8000` desde otro equipo.

## Capabilities

### New Capabilities
- `remote-access`: acceso a la aplicación desde cualquier host o dominio a través de un único origen (frontend con proxy `/api`), con sesión por cookie `HttpOnly` funcionando sin configuración de IP ni CORS.

### Modified Capabilities

## Impact

- `frontend/nginx.conf`, `frontend/Dockerfile` (sin cambios de comportamiento), `docker-compose.yml` (puerto del backend), `.env.example` y `README.md`.
- Tests: comprobación de humo del proxy (`/api/health` y login por el puerto del frontend) y E2E existentes de Playwright, que ya usan la URL del frontend.
- Sin cambios en endpoints, modelo de datos ni dependencias. CORS sigue configurado para el caso de API en otro origen.
- Seguridad: al exponer la web fuera de `localhost` las credenciales del seed pasan a ser un riesgo real; se documenta cambiarlas y activar `COOKIE_SECURE` bajo HTTPS.
