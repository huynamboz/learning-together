import type { Config } from 'tailwindcss';

export default {
  content: ['./components/**/*.{vue,js,ts}', './layouts/**/*.vue', './pages/**/*.vue', './app.vue'],
  theme: {
    extend: {
      colors: {
        ink: '#17213F',
        iris: '#1CB0F6',
        bean: '#F4B942',
        leaf: '#62C7A5',
        paper: '#FFFFFF',
        line: '#E3E7F0'
      },
      boxShadow: {
        float: '0 18px 48px rgba(23, 33, 63, 0.12)',
        soft: '0 8px 24px rgba(23, 33, 63, 0.07)'
      }
    }
  },
  plugins: []
} satisfies Config;
