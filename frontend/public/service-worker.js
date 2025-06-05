// Simple service worker - increment version when deploying
const CACHE_VERSION = 'v1.0.3';
const CACHE_NAME = `fire-dynamics-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  console.log('Service Worker installing version:', CACHE_VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Simple fetch - don't cache for now
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});