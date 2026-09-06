export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3010/api/v1'
    }
  },
  app: {
    head: {
      title: 'Ms Chole TOEIC — Học có nhịp, tiến có dấu',
      meta: [
        { name: 'description', content: 'Nền tảng luyện TOEIC rõ ràng, có nhịp học và phản hồi.' },
        { name: 'theme-color', content: '#263238' }
      ],
      link: [
        // The SVG is the sharp one; the .ico covers browsers that still ask for /favicon.ico.
        { rel: 'icon', type: 'image/svg+xml', href: '/brand/mark-dark.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icon-32.png' },
        { rel: 'alternate icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
    }
  }
});
