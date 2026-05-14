/* ================================================================
   ELITE SLEEP — Service Worker v1.0
   Strategy:
   • Static assets  → Cache-First (app shell, fonts, icons)
   • Google Fonts   → Stale-While-Revalidate (fresh when online)
   • Everything else → Network-First with offline fallback
================================================================ */

const CACHE_VERSION  = 'v1';
const STATIC_CACHE   = `elite-sleep-static-${CACHE_VERSION}`;
const FONT_CACHE     = `elite-sleep-fonts-${CACHE_VERSION}`;
const RUNTIME_CACHE  = `elite-sleep-runtime-${CACHE_VERSION}`;

// CORRIGIDO: caminhos absolutos com base /Sono-monitor/
const BASE = '/Sono-monitor';

const STATIC_ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/manifest.json`,
  `${BASE}/icons/icon-192x192.png`,
  `${BASE}/icons/icon-512x512.png`,
  `${BASE}/icons/icon-maskable-192x192.png`,
  `${BASE}/icons/icon-maskable-512x512.png`,
  `${BASE}/icons/shortcut-sestas.png`,
  `${BASE}/icons/shortcut-treino.png`,
];

// ── INSTALL ────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => {
        console.warn('[SW] Precache partial failure:', err.message);
        return self.skipWaiting();
      })
  );
});

// ── ACTIVATE ───────────────────────────────────────────────────
self.addEventListener('activate', event => {
  const ACTIVE_CACHES = [STATIC_CACHE, FONT_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(name => !ACTIVE_CACHES.includes(name))
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── FETCH ──────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // ── Google Fonts → Stale-While-Revalidate ──────────────────
  if (url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(FONT_CACHE, request));
    return;
  }

  // ── Same-origin static assets → Cache-First ────────────────
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(STATIC_CACHE, request));
    return;
  }

  // ── Everything else → Network-First ────────────────────────
  event.respondWith(networkFirst(RUNTIME_CACHE, request));
});

// ── STRATEGIES ─────────────────────────────────────────────────

async function cacheFirst(cacheName, request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (request.mode === 'navigate') {
      return caches.match(`${BASE}/index.html`);
    }
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || fetchPromise || new Response('', { status: 503 });
}

async function networkFirst(cacheName, request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      return caches.match(`${BASE}/index.html`);
    }
    return new Response('Offline', { status: 503 });
  }
}

// ── PUSH NOTIFICATIONS ─────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(
      data.title || '🌙 Hora de dormir craque',
      {
        body:    data.body    || 'Recuperação começa agora.',
        icon:    `${BASE}/icons/icon-192x192.png`,
        badge:   `${BASE}/icons/icon-96x96.png`,
        vibrate: [200, 100, 200],
        tag:     'bedtime',
        renotify: true,
        data:    { url: `${BASE}/` },
      }
    )
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        if (clientList.length) return clientList[0].focus();
        return clients.openWindow(`${BASE}/`);
      })
  );
});
