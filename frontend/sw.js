const VERSION = '0.4';
const CACHE_NAME = `cache-${VERSION}`;

const appshell = [
  '/index.html',
  '/register.html',
  '/inicio.html',
  '/styles.css',
  '/register.css',
  '/dashboard.css',
  '/inicio.css',
  '/script.js',
  '/register.js',
  '/dashboard.js',
  '/images/Health.png'
];

// 📌 Instalar y cachear recursos estáticos
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

// 📌 Activar y limpiar cachés viejas
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

// 📌 Estrategia de fetch
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 🚫 No interceptar APIs dinámicas ni SSE ni dashboard.html
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname === '/dashboard.html' ||
    event.request.headers.get('accept') === 'text/event-stream'
  ) {
    return; // dejar que el navegador lo maneje directamente
  }

  // Solo manejar GET
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Fallback solo para HTML
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match('/index.html');
          }
        });
    })
  );
});
