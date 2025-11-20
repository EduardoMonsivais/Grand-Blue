const VERSION = '0.1';
const CACHE_NAME = `cache-${VERSION}`;

const appshell = [
  '/index.html',
  '/register.html',
  '/dashboard.html',
  '/inicio.html',
  '/styles.css',
  '/register.css',
  '/dashboard.css',
  '/inicio.css',
  '/script.js',
  '/register.js',
  '/dashboard.js'
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const fallos = [];

      for (const url of appshell) {
        try {
          await cache.add(url);
          console.log(`✅ Cacheado: ${url}`);
        } catch (err) {
          console.error(`❌ Falló al cachear: ${url}`, err);
          fallos.push(url);
        }
      }

      if (fallos.length > 0) {
        console.warn("⚠️ Algunos archivos no se pudieron cachear:", fallos);
      } else {
        console.log("✅ Todos los archivos cacheados correctamente");
      }

      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => {
      console.log("🔄 Service Worker activado y cachés antiguas eliminadas");
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => caches.match(event.request))
  );
});