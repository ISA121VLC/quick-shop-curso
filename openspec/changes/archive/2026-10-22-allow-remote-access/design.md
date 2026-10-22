# Design

## Context

El frontend es una SPA servida por nginx (`frontend/nginx.conf`) y el cliente HTTP (`frontend/src/api/client.js`) ya compone la URL como `${VITE_API_URL}/api/...` resuelta contra `window.location.origin`, de modo que con la variable vacía usa rutas relativas. La variable se incrusta en el build, por lo que cualquier IP distinta de la compilada rompía el login. El backend lee `CORS_ORIGINS` y emite la cookie con `SameSite=Lax` y `Secure` según `COOKIE_SECURE`. Ver proposal.md para la motivación.

Estado ya implementado en `7c17aad`: `location /api/` con `proxy_pass http://backend:8000` y `VITE_API_URL` vacío en `.env.example`. Esta change formaliza el contrato y completa lo que falta (puerto del backend, documentación, verificación).

## Goals / Non-Goals

**Goals:**
- Una sola URL de acceso, válida para cualquier IP o dominio, sin recompilar.
- La cookie `HttpOnly` funciona por ser mismo origen, sin depender de CORS.
- Reducir la superficie expuesta: solo el puerto del frontend es público.

**Non-Goals:**
- Terminar TLS en el stack (se delega a un túnel o proxy inverso externo).
- Endurecer cabeceras, límites de peticiones o autenticación del seed.
- Eliminar el soporte de `VITE_API_URL` con otro origen ni quitar CORS del backend.

## Decisions

1. **Proxy inverso `/api` en nginx, no IP en el build.** Un único origen evita CORS, cookies de terceros y recompilar por entorno. Alternativas: poner la IP del servidor en `VITE_API_URL` y `CORS_ORIGINS` (frágil, requiere rebuild por cada IP, y la cookie `SameSite=Lax` entre puertos distintos de la misma IP funciona, pero no con túneles) y `CORS_ORIGINS=*` (incompatible con `credentials`).
2. **`VITE_API_URL` vacío por defecto, conservado como opción.** Mantiene el contrato de `frontend/AGENTS.md` (la URL sale de variable de entorno) y permite desplegar la API en otro origen.
3. **Cabeceras `Host`, `X-Forwarded-For` y `X-Forwarded-Proto` hacia el backend.** Preserva información del cliente real; el backend no las usa hoy, pero los logs y un futuro uso de la IP dependen de ellas.
4. **Backend publicado solo en `127.0.0.1`.** `"127.0.0.1:${BACKEND_PORT}:8000"` en `docker-compose.yml`: conserva `/docs` y la depuración local y evita que la API sea alcanzable sin pasar por el frontend. Alternativa: eliminar `ports` por completo (más estricto, pero pierde la depuración y rompe el flujo documentado de `uv run` contra el contenedor).
5. **`COOKIE_SECURE` sigue siendo configuración, no automática.** Con HTTP en LAN debe ser `false` o el navegador descarta la cookie; con HTTPS (túnel) debe ser `true`. Se documenta en el README en lugar de inferirlo.
6. **Verificación con un test de humo contra el stack levantado**, junto a los E2E de Playwright (que ya usan `E2E_BASE_URL`): comprueba `/api/health` y el login a través del puerto del frontend. Los tests unitarios del backend no cubren nginx.

## Risks / Trade-offs

- [El navegador conserva un bundle antiguo con `localhost:8000` y falla con "Failed to fetch"] → Documentar el refresco forzado tras actualizar; los assets llevan hash, solo el `index.html` puede quedar en caché.
- [Exponer la web con las credenciales públicas del seed] → Advertir en el README y exigir cambiar `SEED_*` y `JWT_SECRET` antes de publicar; el seed solo se aplica con la base vacía, así que cambiarlo exige recrear el volumen.
- [Quien usaba `http://<ip>:8000` desde otro equipo deja de poder] → Es **BREAKING** y está indicado en el proposal; la API sigue en `<origen-web>/api`.
- [nginx devuelve `502` mientras el backend migra al arrancar] → Aceptable y transitorio; `depends_on` no espera a la salud del backend. Se puede mitigar con un healthcheck si molesta.
- [Sin TLS propio, el tráfico en LAN va en claro] → Fuera de alcance; usar un túnel o proxy con HTTPS para acceso desde internet.
