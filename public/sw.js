/*
  Simple runtime caching service worker.
  Goal: keep hashed /assets/* resources cached long-term even when hosting
  (e.g. GitHub Pages) uses short Cache-Control TTLs.
*/

const CACHE_VERSION = "v5";
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
    event.waitUntil(
        (async () => {
            // Precache the app shell (and its hashed assets) so an installed PWA can start offline
            // without requiring a second online launch.
            const assetCache = await caches.open(ASSET_CACHE);
            const runtimeCache = await caches.open(RUNTIME_CACHE);

            const indexPath = `${SCOPE_PATH}index.html`;
            const rootPath = SCOPE_PATH;

            // Fetch index.html from the network once, then store it under both / and /index.html
            // so navigation requests can be satisfied regardless of how start_url resolves.
            let indexResponse = null;
            try {
                indexResponse = await fetch(indexPath, { cache: "reload" });
            } catch {
                // ignore; install can still succeed and runtime caching may populate later
            }

            if (indexResponse && indexResponse.ok) {
                await runtimeCache.put(indexPath, indexResponse.clone());
                await runtimeCache.put(rootPath, indexResponse.clone());

                // Parse index.html to discover hashed assets produced by Vite.
                // This avoids needing a build-time manifest.
                let html = "";
                try {
                    html = await indexResponse.clone().text();
                } catch {
                    html = "";
                }

                const urls = new Set([
                    rootPath,
                    indexPath,
                    `${SCOPE_PATH}manifest.json`,
                    `${SCOPE_PATH}icon.svg`
                ]);

                // Match src/href attributes that point at our scoped assets.
                // Examples: /base/assets/index-xxxx.js, /base/assets/index-xxxx.css
                const assetRe = /\b(?:src|href)\s*=\s*["']([^"']+)["']/g;
                for (const m of html.matchAll(assetRe)) {
                    const raw = m[1];
                    if (!raw) continue;
                    if (raw.startsWith("http:")) continue;
                    if (raw.startsWith("https:")) continue;

                    // Normalize relative URLs against the scope.
                    const normalized = raw.startsWith("/") ? raw : new URL(raw, new URL(rootPath, self.location.origin)).pathname;

                    if (normalized.startsWith(`${SCOPE_PATH}assets/`)) {
                        urls.add(normalized);
                    }
                }

                // Cache app shell dependencies. Use addAll on Requests for correctness.
                await Promise.all(
                    Array.from(urls).map(async (p) => {
                        const req = new Request(p, { credentials: "same-origin" });
                        // Store HTML in runtime, everything else in asset cache.
                        if (p === rootPath || p === indexPath) return;
                        try {
                            await assetCache.add(req);
                        } catch {
                            // ignore individual failures
                        }
                    })
                );
            } else {
                // Still cache manifest/icon when possible.
                try {
                    await assetCache.addAll([
                        new Request(`${SCOPE_PATH}manifest.json`, { credentials: "same-origin" }),
                        new Request(`${SCOPE_PATH}icon.svg`, { credentials: "same-origin" })
                    ]);
                } catch {
                    // ignore
                }
            }

            await self.skipWaiting();
        })()
    );
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
                    // Prefer a direct match first.
                    const direct = await cache.match(req);
                    if (direct) return direct;

                    // Fall back to the cached app shell.
                    const shell =
                        (await cache.match(`${SCOPE_PATH}index.html`)) ||
                        (await cache.match(SCOPE_PATH));
                    if (shell) return shell;

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
