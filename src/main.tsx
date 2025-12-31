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
        navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
            // Ignore registration failures (e.g., in unsupported contexts)
        });
    });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
