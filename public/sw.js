const CACHE_NAME = 'fluxgrid-v10';

// Install — skip pre-caching
self.addEventListener('install', () => {
  console.log('SW: Installing v10...');
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating v10 and cleaning old caches...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — improved cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Ignore non-http(s) schemes (like chrome-extension://)
  if (!request.url.startsWith('http')) return;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      // Network-first for HTML, cache-first for assets
      const isHtml = request.url.endsWith('.html') || request.url.endsWith('/');
      
      if (isHtml) {
        // Network-first for HTML
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request.url, clone));
            }
            return response;
          })
          .catch(() => cached || new Response('Offline', { status: 503 }));
      } else {
        // Cache-first for assets
        if (cached) return cached;
        
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request.url, clone));
            }
            return response;
          })
          .catch(() => new Response('Asset not available', { status: 404 }));
      }
    })
  );
});
