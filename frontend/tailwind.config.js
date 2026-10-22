/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // Se sustituyen (no se extienden) para que solo existan los tokens de DESIGN.md.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      accent: 'var(--color-accent)',
      'accent-text': 'var(--color-accent-text)',
      'accent-tint': 'var(--color-accent-tint)',
      heading: 'var(--color-heading)',
      body: 'var(--color-text)',
      muted: 'var(--color-text-muted)',
      ink: 'var(--color-ink)',
      line: 'var(--color-border)',
      surface: 'var(--color-surface)',
      'surface-alt': 'var(--color-surface-alt)',
      'slate-brand': 'var(--color-slate)',
      'slate-light': 'var(--color-slate-light)',
      'teal-brand': 'var(--color-teal)',
    },
    borderRadius: { none: '0', DEFAULT: '0' },
    boxShadow: { none: 'none' },
    fontFamily: { sans: ['var(--font-sans)'] },
    extend: {
      maxWidth: { page: 'var(--max-width)' },
    },
  },
  plugins: [],
}
