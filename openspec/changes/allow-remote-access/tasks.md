# Tasks

## 1. Proxy de la API en nginx (ya implementado en 7c17aad)

- [x] 1.1 Añadir `location /api/` con `proxy_pass http://backend:8000` y cabeceras `Host`, `X-Real-IP`, `X-Forwarded-For` y `X-Forwarded-Proto` en `frontend/nginx.conf`; verificar con `curl -X POST http://localhost:5173/api/auth/login` que responde `200` con la cookie
- [x] 1.2 Dejar `VITE_API_URL` vacío en `.env.example` con el comentario explicativo; verificar que el bundle servido no contiene `localhost:8000`

## 2. Backend no expuesto a la red

- [x] 2.1 Publicar el backend como `"127.0.0.1:${BACKEND_PORT}:8000"` en `docker-compose.yml`; verificar con `docker compose up -d` que `curl http://127.0.0.1:8000/api/health` responde `200` y que desde otro equipo `http://<ip>:8000` es rechazado
- [x] 2.2 Añadir un healthcheck a `backend` (`/api/health`) y hacer que `frontend` dependa de `service_healthy`; verificar que tras `docker compose up --build -d` el login por el 5173 no devuelve `502`

## 3. Verificación automática del acceso remoto

- [x] 3.1 Añadir una prueba de humo en `frontend/e2e/` (por ejemplo `remote-access.spec.js`) que, contra `E2E_BASE_URL`, compruebe que `GET /api/health` responde `200` por el origen del frontend y que el login del admin del seed establece la sesión (`GET /api/auth/me` devuelve el usuario); verificar con `pnpm test:e2e -- remote-access`
- [x] 3.2 Ejecutar la prueba apuntando `E2E_BASE_URL` a la IP de la LAN del servidor y comprobar que pasa sin cambiar `CORS_ORIGINS`

## 4. Documentación

- [x] 4.1 Documentar en `README.md` el acceso desde otro equipo (`http://<ip-del-servidor>:5173`), el significado de `VITE_API_URL` vacío, el uso de `COOKIE_SECURE=true` con HTTPS o túnel y el refresco forzado del navegador tras actualizar; verificar siguiendo los pasos tal como están escritos
- [x] 4.2 Añadir en el README la advertencia de cambiar `SEED_ADMIN_PASSWORD`, `SEED_CUSTOMER_PASSWORD` y `JWT_SECRET` antes de exponer la web y la necesidad de recrear el volumen de la base de datos para que el seed los aplique; verificar que la sección es coherente con `.env.example`
- [x] 4.3 Actualizar `frontend/AGENTS.md` (convención de `VITE_API_URL` vacío con proxy) y revisar `.env.example`; verificar con `grep -rn VITE_API_URL` que no quedan referencias contradictorias

## 5. Integración

- [x] 5.1 Levantar el stack con `docker compose up --build -d` (sin `down -v`, para conservar los datos), abrir la web desde un segundo equipo de la red e iniciar sesión; verificar que no aparece "Failed to fetch" y que `openspec validate allow-remote-access` pasa

## Workflow follow-up

- Archivar la change cuando la revisión esté aprobada y verificar que `openspec/specs/remote-access/spec.md` se crea con su Purpose.
