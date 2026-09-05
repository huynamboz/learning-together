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
      title: 'Đậu TOEIC — Học có nhịp, tiến có dấu',
      meta: [{ name: 'description', content: 'Nền tảng luyện TOEIC rõ ràng, có nhịp học và phản hồi.' }]
    }
  }
});
