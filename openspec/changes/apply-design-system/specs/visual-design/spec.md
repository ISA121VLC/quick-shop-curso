# Spec Delta

## Purpose

Define el aspecto visual del frontend de QuickShop a partir de los tokens y reglas de `DESIGN.md`, para que todas las pantallas sean coherentes, sobrias y accesibles.

## ADDED Requirements

### Requirement: Tokens de diseño centralizados
El frontend SHALL definir los colores, la tipografía, el radio, los espacios y el ancho máximo de `DESIGN.md` en un único lugar y MUST NOT usar valores de color, radio o sombra ajenos a esos tokens en las pantallas.

#### Scenario: Colores de la guía
- **WHEN** se renderiza cualquier pantalla
- **THEN** los colores de texto, fondo y borde provienen de los tokens de `DESIGN.md`

#### Scenario: Sin valores ajenos
- **WHEN** se revisan las clases de estilo de los componentes
- **THEN** no aparecen las paletas por defecto `indigo`, `slate`, `red`, `green` ni `amber`, ni clases `rounded*` distintas de radio 0, ni `shadow*`

### Requirement: Forma sobria
El frontend SHALL mostrar esquinas rectas en botones, campos, tarjetas y avisos, sin sombras ni degradados, separando zonas con `--color-surface-alt` o con un borde de 1px `--color-border`.

#### Scenario: Botón y campo
- **WHEN** se renderiza un botón o un campo de formulario
- **THEN** su radio de esquina calculado es 0 y no tiene sombra

### Requirement: Tipografía de la guía
El frontend SHALL usar la pila `Helvetica Neue, Helvetica, Arial, sans-serif` con titulares ligeros (peso 300 en H1 y H2), cuerpo de 16px y botones y etiquetas de 14px.

#### Scenario: Titular principal
- **WHEN** se muestra el H1 de una página
- **THEN** usa peso 300, 32px y color `--color-heading`

### Requirement: Botones, enlaces y campos
El frontend SHALL aplicar el estilo de la guía a los controles: botón primario con fondo `--color-accent` y texto `--color-ink`, botón secundario con borde `--color-heading`, enlaces en `--color-accent-text` en negrita y campos con borde `--color-border` y borde de foco de 2px `--color-accent-text`.

#### Scenario: Botón primario
- **WHEN** se muestra un botón primario
- **THEN** tiene fondo `--color-accent` y texto `--color-ink`, y en hover fondo `--color-accent-text` con texto blanco

#### Scenario: Campo con error
- **WHEN** un campo de formulario muestra un error de validación
- **THEN** su borde y su mensaje usan `--color-accent-text`

### Requirement: Uso moderado del acento
El frontend MUST NOT usar `--color-accent` como color de texto ni como fondo de áreas grandes, y SHALL limitar el botón primario a uno por pantalla.

#### Scenario: Texto naranja
- **WHEN** un texto o enlace es de color naranja
- **THEN** usa `--color-accent-text`, no `--color-accent`

### Requirement: Foco visible
Todo elemento interactivo SHALL mostrar un contorno de 2px `--color-accent-text` con desplazamiento de 2px al recibir foco con el teclado.

#### Scenario: Navegación con teclado
- **WHEN** el usuario pulsa Tab hasta un enlace o botón
- **THEN** el elemento muestra el contorno de foco definido

### Requirement: Contraste accesible
Las combinaciones de texto y fondo utilizadas SHALL cumplir WCAG AA: relación mínima 4,5:1 para texto normal y 3:1 para texto grande.

#### Scenario: Verificación de pares
- **WHEN** se comprueban los pares de color de texto y fondo declarados como tokens
- **THEN** todos alcanzan la relación mínima exigida para su tamaño de texto

### Requirement: Cabecera y pie
El frontend SHALL mostrar una cabecera con fondo blanco y navegación en negrita, y un pie con fondo `--color-slate` y texto blanco en todas las páginas del layout.

#### Scenario: Pie de página
- **WHEN** se carga cualquier página con el layout principal
- **THEN** se muestra un pie con fondo `--color-slate` y texto blanco

### Requirement: Estilos base reutilizables
El frontend SHALL ofrecer componentes compartidos para aviso de error, estado vacío e insignia de estado de pedido, con los colores definidos en la sección "Aplicación a QuickShop" de `DESIGN.md`.

#### Scenario: Aviso de error
- **WHEN** se muestra un mensaje de error de operación
- **THEN** tiene fondo `--color-accent-tint`, borde izquierdo de 4px `--color-accent` y texto `--color-accent-text`

#### Scenario: Insignia de estado
- **WHEN** se muestra un estado de pedido
- **THEN** la insignia usa la combinación de fondo y texto definida para ese estado

### Requirement: Diseño adaptable y sin cambios funcionales
La aplicación de los estilos MUST conservar el comportamiento, las rutas, los textos y la adaptación a móvil (16px de margen lateral, sin desbordamiento horizontal) de las pantallas existentes.

#### Scenario: Pantalla móvil
- **WHEN** se muestra una pantalla con ancho de 375px
- **THEN** no hay desplazamiento horizontal y el margen lateral es de 16px

#### Scenario: Tests existentes
- **WHEN** se ejecutan los tests unitarios y de Playwright previos
- **THEN** pasan sin modificar sus expectativas funcionales
