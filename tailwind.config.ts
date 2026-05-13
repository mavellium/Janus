import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          cta: 'var(--brand-cta)',
          'cta-hover': 'var(--brand-cta-hover)',
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
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
    },
  },
  plugins: [],
} satisfies Config
