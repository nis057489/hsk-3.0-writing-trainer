/*
  Simple runtime caching service worker.
  Goal: keep hashed /assets/* resources cached long-term even when hosting
  (e.g. GitHub Pages) uses short Cache-Control TTLs.
*/

const CACHE_VERSION = "v4";
const ASSET_CACHE = `assets-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Support hosting under a sub-path (e.g. GitHub Pages via Vite base).
const SCOPE_PATH = (() => {
    try {
        const p = new URL(self.registration.scope).pathname;
        return p.endsWith("/") ? p : `${p}/`;
    } catch {
        return "/";
    }
})();

self.addEventListener("install", (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((k) => k !== ASSET_CACHE && k !== RUNTIME_CACHE)
                    .map((k) => caches.delete(k))
            );
            await self.clients.claim();
        })()
    );
});

function isSameOrigin(url) {
    return url.origin === self.location.origin;
}

function isHashedAssetPath(pathname) {
    // Vite outputs hashed assets like <base>/assets/index-XXXX.js and <base>/assets/index-XXXX.css
    return pathname.startsWith(`${SCOPE_PATH}assets/`);
}

function isFontPath(pathname) {
    return pathname.startsWith(`${SCOPE_PATH}fonts/`);
}

function isManifestPath(pathname) {
    return pathname.endsWith("manifest.json");
}

function isIconPath(pathname) {
    return pathname.endsWith("icon.svg");
}

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;

    const url = new URL(req.url);

    // Network-first for navigation (HTML)
    if (req.mode === "navigate") {
        event.respondWith(
            (async () => {
                try {
                    const networkResponse = await fetch(req);
                    const cache = await caches.open(RUNTIME_CACHE);
                    cache.put(req, networkResponse.clone());
                    return networkResponse;
                } catch (error) {
                    const cache = await caches.open(RUNTIME_CACHE);
                    const cachedResponse = await cache.match(req);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    throw error;
                }
            })()
        );
        return;
    }

    // Cache-first for same-origin static assets.
    if (isSameOrigin(url) && (isHashedAssetPath(url.pathname) || isFontPath(url.pathname) || isManifestPath(url.pathname) || isIconPath(url.pathname))) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(ASSET_CACHE);
                const cached = await cache.match(req);
                if (cached) return cached;

                const res = await fetch(req);
                // Cache opaque/basic/cors responses.
                if (res && (res.status === 200 || res.type === "opaque")) {
                    cache.put(req, res.clone());
                }
                return res;
            })()
        );
        return;
    }
});
