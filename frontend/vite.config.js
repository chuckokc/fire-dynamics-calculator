import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Shows update prompt instead of auto-updating
      includeAssets: ['icons/*.png'], // Include all icons
      manifest: {
        name: 'Fire Dynamics Calculator',
        short_name: 'FireCalc',
        description: 'Professional fire investigation tools based on NUREG-1805 methodology',
        theme_color: '#3182CE',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
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
        // Don't cache during development
        navigateFallback: null,
        // Clean old caches
        cleanupOutdatedCaches: true,
        // Skip waiting - activate new service worker immediately
        skipWaiting: false, // false = user controls updates
        clientsClaim: true,
        // What to cache
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff,woff2}'],
        // Runtime caching for external resources
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
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