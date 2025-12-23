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

// Google Fonts CSS URL used by the app.
// We warm the cache based on the *actual* CSS response the browser requests,
// because Google Fonts varies by UA/Accept/etc.
const GOOGLE_FONTS_CSS_URL = "https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=ZCOOL+KuaiLe&display=block";

// Allow the app to send the exact CSS text it received so we can warm deterministically.
self.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.type !== "WARM_GOOGLE_FONTS_CSS") return;
    if (typeof data.cssText !== "string" || data.cssText.length === 0) return;

    // ExtendableMessageEvent supports waitUntil.
    event.waitUntil(warmGoogleFontsFromCssText(data.cssText));
});

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

function extractCssUrls(cssText) {
    // Matches url(...) in @font-face rules.
    // Intentionally minimal to avoid heavy parsing.
    const urls = [];
    const re = /url\(([^)]+)\)/g;
    let m;
    while ((m = re.exec(cssText))) {
        let raw = m[1].trim();
        if ((raw.startsWith("\"") && raw.endsWith("\"")) || (raw.startsWith("'") && raw.endsWith("'"))) {
            raw = raw.slice(1, -1);
        }
        if (raw.startsWith("https://") || raw.startsWith("http://")) urls.push(raw);
    }
    return urls;
}

async function warmGoogleFontsFromCssText(cssText) {
    const cache = await caches.open(RUNTIME_CACHE);

    const urls = Array.from(new Set(extractCssUrls(cssText)));

    // Fetch and cache all referenced font files.
    // Keep concurrency modest to avoid spiking CPU/network.
    const CONCURRENCY = 6;
    let index = 0;

    const workers = Array.from({ length: CONCURRENCY }, async () => {
        while (index < urls.length) {
            const url = urls[index++];
            try {
                const req = new Request(url, { mode: "cors" });
                const cached = await cache.match(req);
                if (cached) continue;
                const res = await fetch(req);
                if (res && (res.status === 200 || res.type === "opaque")) {
                    await cache.put(req, res.clone());
                }
            } catch {
                // Ignore individual failures.
            }
        }
    });

    await Promise.all(workers);
}

async function warmGoogleFontsFromCssResponse(cssResponse) {
    try {
        const cssText = await cssResponse.text();
        await warmGoogleFontsFromCssText(cssText);
    } catch {
        // ignore
    }
}

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

    const isGoogleFontsCss = url.origin === "https://fonts.googleapis.com";
    const isGoogleFontsFile = url.origin === "https://fonts.gstatic.com";

    // Cache-first for Google Fonts binary files.
    if (isGoogleFontsFile) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(RUNTIME_CACHE);
                const cached = await cache.match(req);
                if (cached) return cached;

                const res = await fetch(req);
                if (res && (res.status === 200 || res.type === "opaque")) {
                    cache.put(req, res.clone());
                }
                return res;
            })()
        );
        return;
    }

    // Cache-first for Google Fonts CSS, and warm all referenced font files in the background.
    if (isGoogleFontsCss) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(RUNTIME_CACHE);
                const cached = await cache.match(req);
                if (cached) {
                    // Warm in the background using the cached CSS.
                    event.waitUntil(warmGoogleFontsFromCssResponse(cached.clone()));
                    return cached;
                }

                const res = await fetch(req);
                if (res && (res.status === 200 || res.type === "opaque")) {
                    // Put the CSS itself.
                    cache.put(req, res.clone());

                    // Warm font binaries in the background using the exact CSS response.
                    // (clone for text parsing)
                    event.waitUntil(warmGoogleFontsFromCssResponse(res.clone()));
                }
                return res;
            })()
        );
        return;
    }
});
