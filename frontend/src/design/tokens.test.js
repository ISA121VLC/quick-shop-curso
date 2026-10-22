import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync('src/index.css', 'utf-8')

const sources = import.meta.glob('/src/**/*.jsx', { query: '?raw', import: 'default', eager: true })

const FORBIDDEN = [
  { name: 'radio o sombra', re: /(?<=[\s"'`])(rounded|shadow)(-[\w/[\]]+)*(?=[\s"'`])/g },
  {
    name: 'paleta por defecto de Tailwind',
    re: /(?<=[\s"'`:])(bg|text|border|ring|divide|fill|stroke|from|to|via|outline|placeholder|accent|caret)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/g,
  },
]

describe('tokens de DESIGN.md', () => {
  it('no hay clases de radio, sombra ni paleta por defecto en los componentes', () => {
    const found = []
    for (const [file, src] of Object.entries(sources)) {
      for (const { name, re } of FORBIDDEN) {
        for (const m of src.matchAll(re)) found.push(`${file}: ${m[0]} (${name})`)
      }
    }
    expect(found).toEqual([])
  })
})

function token(name) {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`Falta el token --${name}`)
  return m[1]
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const WHITE = '#ffffff'

// [texto, fondo, uso]: texto normal exige 4,5:1.
const PAIRS = [
  ['color-heading', 'color-surface', 'titulares'],
  ['color-text', 'color-surface', 'cuerpo'],
  ['color-text-muted', 'color-surface', 'texto secundario'],
  ['color-text', 'color-surface-alt', 'estado vacio e insignia cancelled'],
  ['color-accent-text', 'color-surface', 'enlaces'],
  ['color-accent-text', 'color-surface-alt', 'enlaces sobre banda'],
  ['color-accent-text', 'color-accent-tint', 'aviso de error e insignia pending'],
  ['color-ink', 'color-accent', 'boton primario'],
  [WHITE, 'color-accent-text', 'boton primario en hover'],
  [WHITE, 'color-slate', 'pie e insignia delivered'],
  [WHITE, 'color-teal', 'insignia shipped'],
  ['color-teal', 'color-surface-alt', 'insignia confirmed'],
]

describe('contraste WCAG AA', () => {
  it.each(PAIRS)('%s sobre %s (%s)', (fg, bg) => {
    const f = fg.startsWith('#') ? fg : token(fg)
    const b = bg.startsWith('#') ? bg : token(bg)
    expect(contrast(f, b)).toBeGreaterThanOrEqual(4.5)
  })
})
