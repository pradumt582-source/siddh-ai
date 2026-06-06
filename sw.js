// SIDDH-AI Service Worker v1.0
const CACHE_NAME = 'siddh-ai-v1';

// Sirf yeh files cache hongi (offline ke liye)
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install — cache static files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_FILES);
    })
  );
  self.skipWaiting();
});

// Activate — purana cache saaf karo
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — pehle cache dekho, nahi mila toh network se lo
self.addEventListener('fetch', event => {
  // API calls ko cache mat karo (Claude API)
  if (event.request.url.includes('api.anthropic.com')) {
    return; // Network se seedha lo
  }

  // Google Fonts bhi network se lo
  if (event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('fonts.gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Sirf valid responses cache karo
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, toCache);
        });
        return response;
      }).catch(() => {
        // Offline fallback
        return caches.match('/index.html');
      });
    })
  );
});
