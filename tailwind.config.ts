import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#514030',
          text: '#161718',
          'btn-dark': '#161718',
          'btn-light': '#DCDCDC',
          hover: '#7A614A',
          muted: '#C8C8C8',
          bg: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
