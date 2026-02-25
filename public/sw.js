const CACHE_NAME = 'fluxgrid-v6';

// Install — skip pre-caching
self.addEventListener('install', () => {
  console.log('SW: Installing v5...');
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating v5 and cleaning old caches...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — handle assets and ignore extension requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Ignore non-http(s) schemes (like chrome-extension://)
  // This is the CRITICAL fix for the console errors
  if (!request.url.startsWith('http')) return;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        // Only cache valid http(s) responses
        if (response && response.status === 200 && response.type === 'basic' && request.url.startsWith('http')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request.url, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
