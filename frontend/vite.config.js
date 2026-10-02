import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// package.json is the single source of the app version (shown in the footer
// and written to the web app manifest).
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
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
        version,
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
  test: {
    include: ['src/**/*.test.js'],
    environment: 'node',
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor';
          if (/node_modules\/(@chakra-ui|@emotion|framer-motion)\//.test(id)) return 'ui';
          return undefined;
        },
      }
    }
  }
});