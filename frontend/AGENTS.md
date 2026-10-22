# Frontend QuickShop

SPA con React 18, Vite, Tailwind CSS y React Router. Convenciones generales en `../AGENTS.md`; pantallas y contratos en `../docs/specs-prds/`. Se desarrolla después del backend.

## Comandos (pnpm)

```
pnpm install
pnpm dev          Servidor de desarrollo
pnpm build        Build de producción
pnpm test         Tests unitarios
pnpm test:e2e     Playwright
```

## Estructura

```
frontend/
  package.json / pnpm-lock.yaml / pnpm-workspace.yaml
  vite.config.js
  src/
    main.jsx / App.jsx      Entrada y rutas
    api/                    Cliente HTTP (fetch con credentials: "include") y funciones por módulo
    components/             Componentes reutilizables
    layouts/                Layout principal con header y área de contenido
    pages/                  Una carpeta por módulo (auth, products, cart, orders, admin)
    context/                Contexto de autenticación y de carrito
    routes/                 RequireAuth y RequireRole
  e2e/                      Tests Playwright
```

## Convenciones

- Tailwind CSS para todo el estilo, mobile-first. Toda pantalla debe ser responsive.
- Un `Layout` común con header (navegación, contador del carrito, sesión) que envuelve el contenido de cada página mediante `Outlet`.
- La URL de la API sale de una variable de entorno de Vite (`VITE_API_URL`); nunca hardcodeada. Vacía por defecto: el cliente usa rutas relativas `/api` y nginx las reenvía al backend, de modo que la web funciona desde cualquier IP o dominio.
- El token JWT no se guarda en `localStorage` ni `sessionStorage`: viaja en una cookie `HttpOnly`. El frontend usa `credentials: "include"` y restaura la sesión con `GET /api/auth/me`.
- Estados de carga, vacío y error en cada pantalla. Producto con stock 0: visible y con el botón de añadir deshabilitado. El administrador no ve carrito.
- Textos de interfaz en castellano. Sin emojis.

## Decisiones técnicas

- Sin PostCSS ni Autoprefixer externos: configurar PostCSS inline en `vite.config.js` solo con `tailwindcss()`, para evitar fallos de regex en Windows.
- Node.js: usar `node:22-alpine` en el Dockerfile (pnpm 11 requiere Node >= 22.13).

## pnpm 11 y Docker (importante)

En pnpm 11 las aprobaciones de build scripts se guardan en `pnpm-workspace.yaml` (clave `allowBuilds`), no en el lockfile; el Dockerfile debe copiarlo antes del install o fallará con `ERR_PNPM_IGNORED_BUILDS`.

Reglas derivadas:

- Declarar `allowBuilds` en `pnpm-workspace.yaml` para que los builds no sean interactivos (agentes y CI no pueden aprobar prompts).
- En el Dockerfile, copiar `pnpm-workspace.yaml` junto a `package.json` y `pnpm-lock.yaml` antes de `pnpm install`.
- `.dockerignore` obligatorio: excluir `node_modules` y directorios temporales (`dist`, `test-results`, `playwright-report`) para evitar errores de symlinks en Windows.

## Tests

- Unitarios para contextos y utilidades; Playwright para flujos críticos (registro, login, añadir al carrito, crear pedido, cancelar, gestión admin).
