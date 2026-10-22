# Tasks

## 1. Tokens y estilos base

- [x] 1.1 Declarar en `src/index.css` las variables `:root` de `DESIGN.md` (color, fuente, pesos, radio, espacios, ancho máximo) y los estilos base (`body`, `h1`-`h3`, enlaces, `:focus-visible`); verificar con `pnpm build` y revisando en `pnpm dev` que el foco por teclado muestra el contorno de 2px
- [x] 1.2 Reescribir `tailwind.config.js` sustituyendo `colors`, `borderRadius`, `boxShadow` y `fontFamily` por los tokens semánticos (decisiones 1-3); verificar con `pnpm build` y comprobando que una clase de la paleta por defecto deja de compilar
- [x] 1.3 Añadir tests Vitest de tokens: escáner de clases prohibidas (`rounded*`, `shadow*`, paletas por defecto) y comprobación AA de los pares texto/fondo de la guía; verificar con `pnpm test` (el escáner fallará listando los archivos pendientes hasta completar el grupo 3)

## 2. Componentes compartidos y layout

- [x] 2.1 Migrar `components/ui.jsx` (`inputCls`, `primaryBtn`, `secondaryBtn`, `StateMessage`, `Field`, `FormError`, `Pagination`) a los tokens manteniendo exportaciones y firmas; verificar con los tests unitarios existentes
- [x] 2.2 Añadir a `ui.jsx` `Badge` (mapa de estados de pedido), el estilo de aviso de error y `EmptyState` según "Aplicación a QuickShop"; verificar con tests de componente que cada estado aplica sus clases
- [x] 2.3 Migrar `layouts/Layout.jsx` (cabecera blanca con navegación en negrita, enlace activo con subrayado de 2px `accent`) y añadir el pie con fondo `slate-brand`; verificar con un test de que el pie se renderiza y con `pnpm test`
- [x] 2.4 Ajustar `index.html` (clases del `body`) y `ProductCard.jsx` (tarjeta con borde inferior, stock 0 en `muted` con etiqueta "Sin stock"); verificar con los tests de catálogo existentes

## 3. Migración de pantallas

- [x] 3.1 Migrar `pages/auth/Login.jsx`, `Register.jsx`, `Forbidden.jsx` y `NotFound.jsx`; verificar con `pnpm test` y revisión visual a 375px y 1280px
- [x] 3.2 Migrar `pages/profile/Profile.jsx` y `pages/products/ProductDetail.jsx` (y `Catalog.jsx` si usa clases propias); verificar con `pnpm test` y revisión visual a 375px y 1280px
- [x] 3.3 Migrar `pages/admin/AdminProducts.jsx`, `AdminUsers.jsx` y `ProductForm.jsx` (tablas con borde inferior y fila destacada en `accent-tint`); verificar con `pnpm test` y revisión visual a 375px y 1280px
- [x] 3.4 Confirmar que el escáner de clases prohibidas de 1.3 pasa sin excepciones; verificar con `pnpm test`

## 4. Verificación integral

- [x] 4.1 Ejecutar `pnpm test`, `pnpm build` y `pnpm test:e2e` (incluido `responsive.spec.js` sin desbordamiento horizontal a 375px) contra `docker compose up --build`; verificar que todo pasa sin cambiar expectativas funcionales
- [x] 4.2 Revisar capturas de las pantallas existentes contra `DESIGN.md` (un solo botón primario por pantalla, naranja solo en detalles, sin sombras) y anotar desviaciones; verificar con una lista corta en la descripción de la PR
- [x] 4.3 Actualizar `frontend/AGENTS.md` si cambian los nombres de utilidades o la ubicación de los tokens; verificar que describe lo implementado

## Workflow follow-up

- Aplicar esta change antes de `add-cart-and-orders` y, al archivarla, actualizar la change de carrito y pedidos para que cite los componentes `Badge`, `EmptyState` y el aviso de error.
- Archivar tras la revisión (`/opsx:archive`).
