// HoopLab PWA service worker (karar 0058): yalnız Web Push. Sayfa önbelleği ve `fetch` dinleyicisi yok;
// güncellemeler service worker'a takılmaz (karar 0054). Yükte başlık, metin ve açılacak ekran var; sağlık değeri yok.

const ROUTES = ['/', '/checkin', '/me/google-health'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = typeof data.title === 'string' ? data.title : 'HoopLab';
  const route = ROUTES.includes(data.route) ? data.route : '/';
  // iOS her push için görünür bir bildirim bekler (userVisibleOnly); yük bozuksa da gösterilir.
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === 'string' ? data.body : '',
      tag: typeof data.tag === 'string' ? data.tag : undefined,
      icon: '/icons/icon-192.png',
      data: { route },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = ROUTES.includes(event.notification.data?.route) ? event.notification.data.route : '/';
  const target = new URL(route, self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          await client.focus();
          if ('navigate' in client) await client.navigate(target);
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
