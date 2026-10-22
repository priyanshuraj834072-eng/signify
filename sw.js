// Singify service worker: makes the app installable and keeps the app shell available offline.
const V = 'singify-v2';
const SHELL = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // only remove old shell caches, never the downloaded songs cache
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('singify-') && x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
  );
});
