import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Fire Dynamics Calculator',
        short_name: 'FireCalc',
        description: 'Professional fire investigation tools based on NUREG-1805 methodology',
        theme_color: '#3182CE',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        version: '1.3.6',  // Updated from 1.3.4
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/icons/maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
  navigateFallback: null,
  cleanupOutdatedCaches: true,
  skipWaiting: false,
  clientsClaim: true,
  globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff,woff2}'],
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  dontCacheBustURLsMatching: /\.\w{8}\./,
  // Add this to ignore chrome extension URLs
  navigateFallbackDenylist: [/^\/api/, /^chrome-extension:/, /^moz-extension:/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365
        }
      }
    },
    // Add this to explicitly exclude extension URLs
    {
      urlPattern: /^chrome-extension:/,
      handler: 'NetworkOnly'
    }
  ]
},
      // Add this section to show update UI
      devOptions: {
        enabled: false  // Set to true during development to test
      }
    })
  ],
  base: '/',
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['@chakra-ui/react', '@emotion/react', '@emotion/styled']
        }
      }
    }
  }
});