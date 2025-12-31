import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import cssText from "./index.css?inline";
import "./i18n";
import { prefetchAllI18nAssets } from "./i18n";

const styleEl = document.createElement("style");
styleEl.textContent = cssText;
document.head.appendChild(styleEl);

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(() => {
            const schedule = (fn: () => void) => {
                const ric = (window as any).requestIdleCallback;
                if (typeof ric === "function") ric(fn, { timeout: 3000 });
                else window.setTimeout(fn, 0);
            };

            const whenControlled = async () => {
                if (navigator.serviceWorker.controller) return;
                await new Promise<void>((resolve) => {
                    const onChange = () => {
                        navigator.serviceWorker.removeEventListener("controllerchange", onChange);
                        resolve();
                    };
                    navigator.serviceWorker.addEventListener("controllerchange", onChange);
                });
            };

            // Prefetch all locales for offline switching, but only once the SW controls the page
            // so the responses land in the SW asset cache.
            schedule(() => {
                void whenControlled().then(() => prefetchAllI18nAssets());
            });
        }).catch(() => {
            // Ignore registration failures (e.g., in unsupported contexts)
        });
    });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
