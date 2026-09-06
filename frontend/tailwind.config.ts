import type { Config } from 'tailwindcss';

export default {
  content: ['./components/**/*.{vue,js,ts}', './layouts/**/*.vue', './pages/**/*.vue', './app.vue'],
  theme: {
    extend: {
      colors: {
        ink: '#263238',
        iris: '#1CB0F6',
        bean: '#F4B942',
        leaf: '#62C7A5',
        grass: '#58CC02',
        mint: '#EAF8EF',
        sun: '#FFF7D6',
        azure: '#E8F7FF',
        blush: '#FFE6E2',
        field: '#F5F6F7',
        paper: '#FFFFFF',
        line: '#DCECDF'
      },
      boxShadow: {
        float: '0 18px 48px rgba(38, 50, 56, 0.12)',
        soft: '0 8px 24px rgba(38, 50, 56, 0.07)',
        press: '0 3px 0 #46A900',
        'press-sky': '0 3px 0 #1288C8'
      }
    }
  },
  plugins: []
} satisfies Config;
