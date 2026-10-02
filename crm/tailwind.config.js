/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Valores em src/index.css (:root): uma só definição de cor para CSS e utilitários.
      colors: {
        navy: 'rgb(var(--navy-rgb) / <alpha-value>)',
        'navy-dark': 'rgb(var(--navy-dark-rgb) / <alpha-value>)',
        sand: 'rgb(var(--canvas-rgb) / <alpha-value>)',
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',

        border: 'rgb(var(--border-rgb) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong-rgb) / <alpha-value>)',
        muted: 'rgb(var(--muted-rgb) / <alpha-value>)',
        'muted-soft': 'var(--muted-soft)',

        success: { DEFAULT: 'var(--success)', bg: 'var(--success-bg)', text: 'var(--success-text)' },
        warning: { DEFAULT: 'var(--warning)', bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
        danger: { DEFAULT: 'rgb(var(--danger-rgb) / <alpha-value>)', bg: 'var(--danger-bg)', text: 'var(--danger-text)', hover: 'var(--danger-hover)' },
        info: { DEFAULT: 'var(--info)', bg: 'var(--info-bg)', text: 'var(--info-text)' },
      },
      // Mesma escala de texto do index.css (--fs-*): text-meta, text-small, text-body, text-panel.
      fontSize: {
        meta: 'var(--fs-meta)',
        small: 'var(--fs-small)',
        body: 'var(--fs-body)',
        panel: 'var(--fs-panel)',
      },
      fontFamily: {
        display: ['Inter', 'Segoe UI', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
