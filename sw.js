// Singify service worker. DO NOT EDIT AGAIN: updates are controlled by version.json.
// App shell (index.html, songs.js, native.js, manifest) is served from cache and is only
// refreshed when the user taps "Update" in the app. Everything else is network-first.
const V = 'singify-v7';
const SHELL = ['/', '/index.html', '/songs.js', '/native.js', '/manifest.json'];
const MORE = ['/icons/icon-192.png?v=3', '/icons/icon-512.png?v=3', '/icons/icon-maskable-512.png?v=3', '/icons/apple-touch-icon.png?v=3', '/icons/favicon.png?v=3'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.concat(MORE).map(u => fetch(new Request(u, { cache: 'reload' })).then(r => r.ok && c.put(u, r)).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // remove old shell caches, never the downloaded songs cache (sg-audio)
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('singify-') && x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname === '/version.json' || u.pathname === '/sw.js') return;
  if (SHELL.includes(u.pathname)) {
    // cache first: the user keeps the current version until they press Update
    e.respondWith(caches.open(V).then(c => c.match(u.pathname).then(r => r || fetch(e.request).then(n => { if (n.ok) c.put(u.pathname, n.clone()); return n; }))));
    return;
  }
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
  );
});
