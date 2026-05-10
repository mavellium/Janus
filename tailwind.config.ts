import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          text: 'var(--brand-text)',
          'btn-dark': 'var(--brand-btn-dark)',
          'btn-light': 'var(--brand-btn-light)',
          hover: 'var(--brand-hover)',
          muted: 'var(--brand-muted)',
          bg: 'var(--brand-bg)',
        },
        sidebar: {
          bg: 'var(--sidebar-bg)',
          icon: 'var(--sidebar-icon)',
          'hover-bg': 'var(--sidebar-hover-bg)',
          'hover-text': 'var(--sidebar-hover-text)',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
