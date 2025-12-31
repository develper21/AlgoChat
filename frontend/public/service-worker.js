/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'algonive-chat-cache-v1';
const APP_SHELL = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      cache.addAll(APP_SHELL);
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  const title = payload.title || 'Algonive Chat';
  const options = {
    body: payload.body,
    data: payload.data,
    icon: '/favicon.ico',
    badge: '/favicon.ico'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const roomId = event.notification?.data?.roomId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const client = clientsArr.find((c) => c.visibilityState === 'visible');
      if (client) {
        client.postMessage({ type: 'OPEN_ROOM', roomId });
        return client.focus();
      }
      return self.clients.openWindow(roomId ? `/?room=${roomId}` : '/');
    })
  );
});
