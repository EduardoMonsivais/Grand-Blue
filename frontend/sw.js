const VERSION = '0.5'; // 👈 sube versión cuando cambies archivos
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

      return self.skipWaiting(); // activa inmediatamente
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
      return self.clients.claim(); // toma control inmediato
    })
  );
});

// 📌 Estrategia de fetch: network-first
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 🚫 No interceptar APIs dinámicas ni SSE
  if (
    url.pathname.startsWith('/api/') ||
    event.request.headers.get('accept') === 'text/event-stream'
  ) {
    return; // dejar que el navegador lo maneje directamente
  }

  // Solo manejar GET
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si la red responde, actualiza cache
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Si falla la red, usa cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          // Fallback solo para HTML
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match('/index.html');
          }
        });
      })
  );
});
