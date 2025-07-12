// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  
  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],

  // Runtime config for API
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:8000/api'
    }
  },

  // App config
  app: {
    head: {
      title: 'School ERP SaaS',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Modern School ERP SaaS Platform' }
      ]
    }
  },

  // CSS
  css: ['~/assets/css/main.css'],

  // Build
  build: {
    transpile: ['vue-toastification']
  },

  // Vite configuration
  vite: {
    define: {
      global: 'globalThis',
    },
    resolve: {
      alias: {
        'form-data': 'formdata-polyfill'
      }
    }
  }
})
