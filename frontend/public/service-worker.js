const CACHE_NAME = 'fire-dynamics-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/index.css',
  // Add paths to your calculator components
  '/src/components/calculators/HeatReleaseCalculator.jsx',
  '/src/components/calculators/FlameHeightCalculator.jsx',
  '/src/components/calculators/PointSourceCalculator.jsx',
  '/src/components/calculators/FlashoverCalculator.jsx',
  '/src/components/reference/ReferenceGuide.jsx'
];

// Install phase: cache required resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch phase: serve from cache first, then network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch new
      return response || fetch(event.request).then((fetchResponse) => {
        // Cache the fetched response
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});