const CACHE = 'shift-happens-v3';

// Only cache the shell — never cache JS files so updates are instant
const CACHE_ASSETS = [
  './index.html',
  './icon-192.png',
  './icon-512.png',
  './manifest.json',
  './history.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CACHE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Always fetch JS files fresh from network
  if (url.pathname.endsWith('.js')) {
    e.respondWith(fetch(e.request));
    return;
  }
  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'Shift Happens', body: 'Shift reminder' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'Shift Happens', {
      body: data.body || 'Shift reminder',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: 'shift-reminder',
      vibrate: [200, 100, 200]
    })
  );
});
