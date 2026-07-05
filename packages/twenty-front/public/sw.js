// FORK: Voka CRM — Fase 22: Service Worker — cache-first + push notifications
const CACHE_NAME = 'voka-crm-v1';
const PRECACHE_URLS = ['/'];

// ── Install: pre-cache shell ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for assets ──────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept non-GET or cross-origin
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Network-first for API calls
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/metadata') || url.pathname.startsWith('/graphql')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request)),
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    }),
  );
});

// ── Push: show notification ───────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Voka CRM', body: 'Você tem uma nova notificação.', url: '/' };

  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {
    // ignore parse error
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/images/icons/android/android-launchericon-192-192.png',
      badge: '/images/icons/android/android-launchericon-72-72.png',
      data: { url: data.url },
    }),
  );
});

// ── Notification click: focus or open window ─────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    }),
  );
});
