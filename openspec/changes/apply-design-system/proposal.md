# Proposal

## Why

El frontend actual usa la paleta por defecto de Tailwind (indigo, slate, rojo) con bordes redondeados y sombras, y no sigue la guía visual del proyecto, ahora recogida en `DESIGN.md` y enlazada desde `AGENTS.md`. Conviene alinear las pantallas existentes con esa guía antes de construir carrito y pedidos (`add-cart-and-orders`), para que las pantallas nuevas nazcan ya con los tokens correctos y no haya que rehacerlas.

## What Changes

- Declarar los tokens de `DESIGN.md` (colores, tipografía, radio, espacios, ancho máximo) una sola vez: variables CSS en `src/index.css` y extensión de `tailwind.config.js` que los expone como utilidades.
- Sustituir en las pantallas y componentes existentes (`Layout`, `ui.jsx`, `ProductCard`, autenticación, perfil, catálogo, detalle de producto, administración de productos y usuarios, `Forbidden`, `NotFound`) las clases de color, radio y sombra por los tokens; esquinas rectas, sin sombras ni degradados.
- Botones, enlaces, campos, tarjetas/filas, cabecera, pie, foco visible, mensajes de error y estados vacíos según la sección Componentes de `DESIGN.md`.
- Añadir un pie de página con fondo `--color-slate` al `Layout`.
- Definir en el código compartido (`ui.jsx`) los estilos reutilizables que `add-cart-and-orders` necesitará: insignia de estado de pedido, aviso de error y estado vacío, según "Aplicación a QuickShop" de `DESIGN.md`.
- Comprobar el contraste WCAG AA de las combinaciones usadas.
- Sin cambios de comportamiento, de rutas ni de contratos de API. No se modifica el HTML que comprueban los tests salvo lo imprescindible (por ejemplo el pie nuevo); los tests existentes deben seguir pasando.
- Fuera de alcance: modo oscuro, logotipo o tipografía propietaria (se usa la pila de respaldo), cambios de maquetación o de textos, pantallas de carrito y pedidos.

## Capabilities

### New Capabilities

- `visual-design`: reglas observables de aspecto del frontend: tokens de color, tipografía, forma y espacio, estilo de componentes base, foco visible y contraste mínimo, tomados de `DESIGN.md`.

### Modified Capabilities

<!-- Ninguna: no cambian requisitos funcionales de las capacidades existentes. -->

## Impact

- Código modificado: `frontend/src/index.css`, `frontend/tailwind.config.js`, `frontend/index.html` (clases del `body`), `frontend/src/components/*`, `frontend/src/layouts/Layout.jsx` y las páginas de `frontend/src/pages/**`.
- Sin dependencias nuevas, sin fuentes externas (pila `Helvetica Neue, Helvetica, Arial, sans-serif`).
- Tests: unitarios y Playwright existentes deben seguir pasando; se añade una comprobación automatizada de tokens y contraste.
- Relación con `add-cart-and-orders`: esa change debe aplicarse después y usar los componentes y tokens definidos aquí.
