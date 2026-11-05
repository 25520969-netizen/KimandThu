/**
 * Service worker: precaches the app shell so the timeline opens offline, and serves
 * same-origin files stale-while-revalidate. Backend and map APIs are never cached
 * (they are cross-origin and carry private data).
 */
const CACHE_VERSION = "4.8";
const CACHE_NAME = `kimthu-shell-${CACHE_VERSION}`;
const SHELL_FILES = [
  "./",
  "index.html",
  "styles.css",
  "src/styles/app_shell.css",
  "src/styles/redesign.css",
  "app.js",
  "manifest.json",
  "assets/app-icon.jpg",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/images/memory1.jpg",
  "assets/images/memory2.jpg",
  "assets/images/memory3.jpg",
  "src/utils/safe_url.js",
  "src/utils/local_date.js",
  "src/utils/drive_image.js",
  "src/services/period_cycle.js",
  "src/services/sync_merge.js",
  "src/services/sync_policy.js",
  "src/services/sync_engine.js",
  "src/services/spaced_queue.js",
  "src/services/geo_policy.js",
  "src/services/period_history.js",
  "src/services/milestones.js",
  "src/adapters/outbox_store.js",
  "src/ui/app_shell.js",
  "src/ui/register_service_worker.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isCacheable(request) {
  const url = new URL(request.url);
  return request.method === "GET" && url.origin === self.location.origin;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (!isCacheable(request)) return;
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached || cache.match("index.html"));
      return cached || network;
    })
  );
});
