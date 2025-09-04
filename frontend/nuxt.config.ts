// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  
  // Development mode configuration
  devServer: {
    port: 3000,
    host: 'localhost'
  },
  
  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],

  // Runtime config for API
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api'
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
    },
    // HMR configuration for better hot reload
    server: {
      hmr: {
        overlay: true
      }
    },
    // Optimize for development
    optimizeDeps: {
      include: ['vue', 'vue-router']
    },
    // 🚀 Remove console + debugger in production builds
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    }
  },

  // Alias configuration
  alias: {
    '@': './'
  },

  // Tailwind CSS configuration
  tailwindcss: {
    config: {
      darkMode: 'class',
      theme: {
        extend: {
          animation: {
            'gradient': 'gradient 8s ease infinite',
            'float': 'float 6s ease-in-out infinite',
            'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          },
          backdropBlur: {
            xs: '2px',
          }
        }
      }
    }
  }
})
