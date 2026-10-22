# DESIGN.md — Guía de estilo inspirada en APM Terminals

> **Origen y límites.** Valores extraídos el 22/10/2026 de los estilos calculados de la web pública
> apmterminals.com. Es una aproximación, **no** el manual de marca oficial. Para un producto real de
> la empresa, el manual del equipo de marca manda sobre este archivo. El logotipo y la tipografía
> Maersk Text son propiedad de A.P. Moller - Maersk: no los copies ni los embebas sin licencia.

## Instrucciones para el agente

- Usa **solo** los tokens de este archivo. No inventes colores, radios ni sombras.
- Cambia el aspecto con CSS. No toques el HTML que comprueban los tests.
- Comprueba contraste WCAG AA (4,5:1 texto normal, 3:1 texto ≥ 24px o negrita ≥ 18,66px).
- Si un caso no está cubierto aquí, elige la opción más sobria y avísame.

## Personalidad

Industrial, corporativa y limpia. Mucho blanco, grises neutros, un único acento naranja usado con
moderación. Ángulos rectos, sin adornos. Titulares ligeros (Light), texto cómodo de leer.

## Color

```css
:root {
  /* Marca */
  --color-accent:        #FF6441; /* naranja APM: botones, iconos, detalles */
  --color-accent-text:   #B83A1C; /* naranja oscurecido para texto y enlaces (5,7:1 sobre blanco) */
  --color-accent-tint:   #FFEFEC; /* fondos suaves, avisos, fila seleccionada */

  /* Neutros */
  --color-heading:       #3C3C46; /* títulos (10,9:1) */
  --color-text:          #454545; /* texto principal (9,6:1) */
  --color-text-muted:    #737373; /* texto secundario, metadatos (4,7:1) */
  --color-ink:           #2F2F2F; /* texto sobre fondo naranja */
  --color-border:        #DDDBDD; /* separadores y bordes de campos */
  --color-surface:       #FFFFFF; /* fondo principal */
  --color-surface-alt:   #F5F7FA; /* bandas, tarjetas, zonas de formulario */

  /* Secundarios */
  --color-slate:         #5A6E7D; /* pie de página y bloques oscuros, texto blanco encima (5,3:1) */
  --color-slate-light:   #7A8591; /* iconos inactivos, bordes de foco secundarios */
  --color-teal:          #0A6E80; /* información/estado neutro (5,9:1) */
}
```

### Reglas de uso

- **El naranja `#FF6441` no pasa AA como color de texto sobre blanco (2,9:1)**, ni con texto blanco encima.
  - Texto y enlaces naranjas → `--color-accent-text`.
  - Botón primario → fondo `--color-accent` con texto `--color-ink` (4,6:1), o fondo `--color-accent-text` con texto blanco.
- El naranja ocupa poco espacio: un botón principal por pantalla, iconos y detalles. Nunca fondos grandes.
- La web original no tiene modo oscuro; no lo inventes salvo que se pida.

## Tipografía

| Rol | Familia | Tamaño / interlínea | Color |
|---|---|---|---|
| H1 | Light | 32px / 38px | `--color-heading` |
| H2 | Light | 22px / 34px | `--color-text` |
| H3 | Regular | 22px / 28px | `--color-heading` |
| Cuerpo | Regular | 16px / 24px | `--color-text` |
| Enlace, navegación | Bold | 16px / 24px | `--color-accent-text` |
| Botón, etiqueta | Regular | 14px | según botón |

```css
:root {
  /* La web usa Maersk Text (propietaria). Sin licencia, usa la pila de respaldo. */
  --font-sans: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --weight-light: 300;
  --weight-regular: 400;
  --weight-bold: 700;
}
```

- Sin mayúsculas forzadas ni espaciado de letras.
- La jerarquía la marcan el tamaño y el peso Light de los titulares, no el color.

## Forma y espacio

```css
:root {
  --radius: 0;           /* esquinas rectas en todo: botones, campos, tarjetas */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 40px;
  --space-6: 64px;
  --max-width: 1200px;
}
```

- Sin sombras ni degradados. Las zonas se separan con `--color-surface-alt` o con un borde de 1px `--color-border`.
- Márgenes generosos; en móvil, 16px laterales.

## Componentes

- **Botón primario:** fondo `--color-accent`, texto `--color-ink`, 14px, padding `12px 24px`, radio 0. Hover: fondo `--color-accent-text` y texto blanco.
- **Botón secundario:** fondo transparente, borde 1px `--color-heading`, texto `--color-heading`. Hover: fondo `--color-surface-alt`.
- **Enlace:** `--color-accent-text`, Bold, sin subrayado; subrayado en hover y foco.
- **Campo de formulario:** fondo blanco, borde 1px `--color-border`, radio 0, padding `10px 12px`. Foco: borde 2px `--color-accent-text`. Error: borde y mensaje en `--color-accent-text`.
- **Tarjeta / fila de lista:** fondo blanco, borde inferior 1px `--color-border`. Seleccionada o destacada: fondo `--color-accent-tint`.
- **Cabecera:** fondo blanco, navegación en Bold.
- **Pie:** fondo `--color-slate`, texto blanco.
- **Foco visible siempre:** `outline: 2px solid var(--color-accent-text); outline-offset: 2px;`

## Aplicación a QuickShop

- Estado de pedido (insignia rectangular, texto 14px, sin color de relleno fuerte):
  - `pending`: fondo `--color-accent-tint`, texto `--color-accent-text`.
  - `confirmed`: fondo `--color-surface-alt`, texto `--color-teal`.
  - `shipped`: fondo `--color-teal`, texto blanco.
  - `delivered`: fondo `--color-slate`, texto blanco.
  - `cancelled`: fondo `--color-surface-alt`, texto `--color-text`.
- Producto sin stock o ítem no disponible: texto `--color-text-muted` y etiqueta "Sin stock" / "No disponible"; el botón de añadir queda deshabilitado.
- Filtro activo (catálogo, pedidos): texto `--color-heading` con subrayado de 2px `--color-accent`.
- Fila de pedido o de ítem seleccionada o destacada: fondo `--color-accent-tint`.
- Aviso de error (por ejemplo stock superado): fondo `--color-accent-tint`, borde izquierdo de 4px `--color-accent`, texto `--color-accent-text`.
- Estados vacíos ("Tu carrito está vacío", "No hay pedidos"): fondo `--color-surface-alt`, texto `--color-text`, centrado, con enlace al catálogo cuando proceda.
- `--color-text-muted` solo sobre `--color-surface` (4,7:1); sobre `--color-surface-alt` queda en 4,4:1 y no pasa AA, por eso se usa `--color-text` en ese fondo.
- Contador del carrito en la cabecera: texto `--color-ink` sobre fondo `--color-accent`.
