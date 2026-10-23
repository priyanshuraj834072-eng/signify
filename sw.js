// Singify service worker: makes the app installable and keeps the app shell available offline.
// Bump V (and the ?v= on the icon links) whenever the icons or app shell change.
const V = 'singify-v3';
const SHELL = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png?v=3', '/icons/icon-512.png?v=3', '/icons/icon-maskable-512.png?v=3', '/icons/apple-touch-icon.png?v=3', '/icons/favicon.png?v=3'];
self.addEventListener('install', e => {
  // cache:'reload' skips the browser HTTP cache so the shell is always fetched fresh
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => fetch(new Request(u, { cache: 'reload' })).then(r => r.ok && c.put(u, r)).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // only remove old shell caches, never the downloaded songs cache
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('singify-') && x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(
    // network first, but always revalidate with the server so stale browser-cached files are not reused
    fetch(e.request, { cache: 'no-cache' })
      .then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
  );
});
