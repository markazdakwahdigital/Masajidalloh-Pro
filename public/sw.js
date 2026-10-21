/* MASAJIDALLOH PRO: offline fallback only; NEVER cache private tenant/user data. */
const CACHE_NAME = 'masajidalloh-offline-v1';
const OFFLINE_URL = '/offline.html';
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate' || event.request.method !== 'GET') return;
  // Network-first; no responses (including authentication/dashboard HTML) are stored.
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
