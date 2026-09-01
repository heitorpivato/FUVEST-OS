const CACHE = 'fuvest-v13-o-plano';
// index.html nunca entra no cache — sempre busca da rede pra garantir versão nova
const STATIC = ['/FUVEST-OS/manifest.json', '/FUVEST-OS/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(wins => Promise.all(wins.map(w => w.navigate(w.url))))  // força reload em todas as abas abertas
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  // index.html e raiz: sempre rede, sem cache
  if (url.includes('index.html') || url.match(/\/FUVEST-OS\/?$/)) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // resto: rede primeiro, cache como fallback
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(d.title || 'FUVEST OS', {
    body: d.body || 'Hora de estudar!',
    icon: '/FUVEST-OS/icon.svg',
    badge: '/FUVEST-OS/icon.svg',
    vibrate: [200, 100, 200],
    tag: d.tag || 'fuvest-daily',
    requireInteraction: d.require || false,
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
