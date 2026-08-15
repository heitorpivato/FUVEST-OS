const CACHE = 'fuvest-v1';
const URLS = ['/FUVEST-OS/', '/FUVEST-OS/index.html', '/FUVEST-OS/manifest.json', '/FUVEST-OS/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/FUVEST-OS/'));
    })
  );
});

self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(d.title || 'FUVEST OS', {
    body: d.body || 'Hora de estudar!',
    icon: '/FUVEST-OS/icon.svg',
    badge: '/FUVEST-OS/icon.svg',
    vibrate: [200, 100, 200],
    tag: 'fuvest-daily',
    data: { url: '/FUVEST-OS/' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const open = wins.find(w => w.url.includes('/FUVEST-OS/'));
      return open ? open.focus() : clients.openWindow('/FUVEST-OS/');
    })
  );
});
