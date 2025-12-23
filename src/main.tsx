import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import cssText from "./index.css?inline";
import "./i18n";

const styleEl = document.createElement("style");
styleEl.textContent = cssText;
document.head.appendChild(styleEl);

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(() => {
            const warm = async () => {
                try {
                    const cssUrl = "https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=ZCOOL+KuaiLe&display=block";
                    const res = await fetch(cssUrl, { mode: "cors" });
                    const cssText = await res.text();
                    const controller = navigator.serviceWorker.controller;
                    if (controller) {
                        controller.postMessage({ type: "WARM_GOOGLE_FONTS_CSS", cssText });
                    }
                } catch {
                    // Ignore; SW runtime caching still works.
                }
            };

            const schedule = (fn: () => void) => {
                const ric = (window as any).requestIdleCallback;
                if (typeof ric === "function") ric(fn, { timeout: 2000 });
                else window.setTimeout(fn, 0);
            };

            // If the page isn't yet controlled (first load), wait for controllerchange.
            if (!navigator.serviceWorker.controller) {
                const onChange = () => {
                    navigator.serviceWorker.removeEventListener("controllerchange", onChange);
                    schedule(() => void warm());
                };
                navigator.serviceWorker.addEventListener("controllerchange", onChange);
            } else {
                schedule(() => void warm());
            }
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
