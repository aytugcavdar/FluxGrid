const CACHE_NAME = 'fluxgrid-v11';

// Critical assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/FluxGrid/',
  '/FluxGrid/index.html',
  // BabylonJS is bundled with Vite, so it will be in the build output
  // We'll cache it on first fetch instead of pre-caching
];

// Install — pre-cache critical assets
self.addEventListener('install', (event) => {
  console.log('SW: Installing v11 with pre-caching...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching critical assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.error('SW: Pre-cache failed for some assets:', err);
        // Don't fail installation if some assets fail to cache
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating v11 and cleaning old caches...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('SW: Deleting old cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — improved cache strategy with offline fallback
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
          .catch(() => {
            if (cached) return cached;
            // Return offline page if available
            return caches.match('/FluxGrid/index.html').then((offlinePage) => {
              return offlinePage || new Response('Offline - Please check your connection', { 
                status: 503,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
          });
      } else {
        // Cache-first for assets (JS, CSS, images, fonts)
        if (cached) return cached;
        
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response && response.status === 200) {
              // Cache all successful responses, including CDN resources
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request.url, clone).catch((err) => {
                  console.warn('SW: Failed to cache:', request.url, err);
                });
              });
            }
            return response;
          })
          .catch((err) => {
            console.warn('SW: Fetch failed for:', request.url, err);
            // For critical game assets, return a meaningful error
            if (request.url.includes('.js') || request.url.includes('babylon')) {
              return new Response('// Asset not available offline', { 
                status: 503,
                headers: { 'Content-Type': 'application/javascript' }
              });
            }
            return new Response('Asset not available offline', { 
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      }
    })
  );
});
