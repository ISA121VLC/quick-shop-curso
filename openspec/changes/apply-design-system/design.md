# Design

## Context

El frontend usa Tailwind 3 con PostCSS inline en `vite.config.js` y un `tailwind.config.js` sin extensiones. Los estilos compartidos viven como constantes de clases en `components/ui.jsx` (`inputCls`, `primaryBtn`, `secondaryBtn`) y como componentes (`StateMessage`, `Field`, `FormError`, `Pagination`); once archivos `.jsx` usan clases `indigo`, `slate`, `red`, `green` o `amber`, con `rounded-*` y `shadow-sm`. Existen tests unitarios (Vitest) y Playwright (`e2e/`, incluido `responsive.spec.js`). La guía es `DESIGN.md`; ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Tokens declarados una sola vez y consumidos por clases semánticas de Tailwind.
- Migración mecánica sin cambios de comportamiento ni de estructura HTML relevante para los tests.
- Verificación automática de que no quedan colores, radios ni sombras fuera de la guía y de que los pares de color cumplen AA.

**Non-Goals:**
- Modo oscuro, tipografía propietaria, rediseño de maquetación, pantallas de carrito y pedidos.

## Decisions

1. **Tokens como variables CSS en `:root` y mapeo en Tailwind.** `src/index.css` copia el bloque `:root` de `DESIGN.md` (colores, fuente, pesos, radio, espacios) y `tailwind.config.js` define `theme.colors` y `fontFamily` apuntando a `var(--color-*)`. Se sustituye (no se extiende) `theme.colors` y `borderRadius`/`boxShadow`, de modo que usar `indigo-600`, `rounded-md` o `shadow-sm` deja de compilar y el error es visible. Alternativa: solo `extend` con nombres nuevos; descartada porque permitiría seguir usando la paleta por defecto sin aviso.

2. **Nombres de utilidades semánticos.** `bg-accent`, `text-accent-text`, `bg-accent-tint`, `text-heading`, `text-body`, `text-muted`, `text-ink`, `border-line`, `bg-surface`, `bg-surface-alt`, `bg-slate-brand`, `bg-teal-brand`. Se evita `slate` y `teal` a secas para no confundirse con la paleta de Tailwind.

3. **Radio 0 global.** `borderRadius: { none: '0', DEFAULT: '0' }`; las clases `rounded*` existentes se eliminan del código en lugar de dejarlas inertes. `boxShadow: {}` y sin degradados.

4. **Estilos base en `index.css` con `@layer base`.** `body` (fuente, color de texto, fondo `surface`), `h1`/`h2`/`h3` con tamaños y pesos de la guía, `a` en negrita con subrayado en hover/foco y `:focus-visible` con contorno de 2px `accent-text`. Así las páginas heredan sin repetir clases. Alternativa: clases por elemento; descartada por repetición y por ser más fácil olvidarlas en pantallas nuevas.

5. **Componentes compartidos como única fuente de estilo de controles.** `ui.jsx` conserva sus exportaciones (mismo nombre y firma) y cambia solo las clases. Se añaden `Badge` (con mapa de estado de pedido a clases), `Notice`/`FormError` con el estilo de aviso de error y `EmptyState` (variante de `StateMessage`). No se cambia la firma de `StateMessage` para no tocar a sus consumidores.

6. **Botón primario.** Fondo `accent`, texto `ink`, hover fondo `accent-text` con texto blanco; los deshabilitados usan `surface-alt` con texto `muted` y borde `line` (la guía no define estado deshabilitado: opción sobria, anotada en la spec de tareas para revisión).

7. **Pie de página.** Se añade `<footer>` al `Layout` con fondo `slate-brand` y texto blanco, con el nombre del producto; no incluye enlaces ni textos nuevos relevantes para los tests.

8. **Verificación de tokens.** Un test Vitest escanea los `.jsx` de `src/` y falla si encuentra clases `rounded*`, `shadow*` o colores de la paleta por defecto (`indigo|slate|red|green|amber|gray|blue`-número), y otro calcula la relación de contraste de los pares declarados en una tabla de pares (texto/fondo/tamaño) y exige AA. Es más barato y estable que pruebas visuales.

9. **Fuentes.** Solo la pila de respaldo del sistema; no se añaden fuentes web ni dependencias.

## Risks / Trade-offs

- [Sustituir `theme.colors` rompe cualquier clase no migrada] → Es intencionado; la build/tests lo detectan y el escáner del test lista los archivos pendientes.
- [Tests que dependen de texto o roles se rompen por cambios de marcado] → Cambiar solo clases; el único marcado nuevo es el `<footer>`. Ejecutar la suite tras cada grupo.
- [Estado deshabilitado no definido en la guía] → Opción sobria documentada; revisar con el responsable de diseño.
- [Pila Helvetica varía por sistema operativo] → Aceptado: la guía lo prevé al no haber licencia de Maersk Text.
- [Fila destacada en `accent-tint` junto a bordes `border` puede dar poco contraste visual] → La guía lo define así; se verifica visualmente en las pantallas existentes.
