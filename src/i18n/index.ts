import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

type TranslationMap = Record<string, string>;

// Build-time map of locale -> URL for the JSON asset.
// This keeps all translations downloadable/cachable without loading them into JS memory.
const translationUrlByFile = import.meta.glob("./*.json", {
  eager: true,
  query: "?url",
  import: "default"
}) as Record<string, string>;

const translationUrlByLocale = new Map<string, string>(
  Object.entries(translationUrlByFile).flatMap(([filePath, url]) => {
    const fileName = filePath.split("/").pop() || "";
    const locale = fileName.endsWith(".json") ? fileName.slice(0, -".json".length) : "";
    return locale ? ([[locale, url]] as const) : [];
  })
);

function candidatesForLanguage(language: string): string[] {
  const lang = (language || "").trim();
  if (!lang) return [];

  // Prefer exact match first, then progressively strip BCP-47 subtags.
  // Example: zh-Hant-TW -> zh-Hant-TW, zh-Hant, zh
  const parts = lang.split("-").filter(Boolean);
  const out: string[] = [];
  for (let i = parts.length; i >= 1; i--) {
    out.push(parts.slice(0, i).join("-"));
  }
  return Array.from(new Set(out));
}

async function fetchTranslationJson(url: string): Promise<TranslationMap | null> {
  try {
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) return null;
    const json = (await res.json()) as unknown;
    if (!json || typeof json !== "object") return null;
    return json as TranslationMap;
  } catch {
    return null;
  }
}

const loadedLocales = new Set<string>();

export async function ensureI18nLanguageLoaded(language: string): Promise<string> {
  const candidates = candidatesForLanguage(language);
  const locale = candidates.find((c) => translationUrlByLocale.has(c)) || "en";
  if (loadedLocales.has(locale)) return locale;

  const url = translationUrlByLocale.get(locale);
  if (!url) return "en";

  const map = await fetchTranslationJson(url);
  if (!map) return "en";

  i18n.addResourceBundle(locale, "translation", map, true, true);
  loadedLocales.add(locale);
  return locale;
}

export function prefetchAllI18nAssets(): void {
  const urls = Array.from(new Set(Array.from(translationUrlByLocale.values())));
  if (urls.length === 0) return;

  const schedule = (fn: () => void) => {
    const ric = (window as any).requestIdleCallback;
    if (typeof ric === "function") ric(fn, { timeout: 3000 });
    else window.setTimeout(fn, 0);
  };

  schedule(() => {
    const CONCURRENCY = 4;
    let index = 0;

    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (index < urls.length) {
        const url = urls[index++];
        try {
          const res = await fetch(url, { credentials: "same-origin" });
          if (!res.ok) continue;
          // Ensure the body is fully consumed so the browser/SW can cache it.
          await res.arrayBuffer();
        } catch {
          // ignore individual failures
        }
      }
    });

    void Promise.all(workers);
  });
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      // Keep a minimal resource so react-i18next doesn't suspend; we load real maps async.
      en: { translation: {} }
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    },
    detection: {
      // Rely on localStorage/session/cookie + navigator; no URL parsing needed
      order: ["localStorage", "sessionStorage", "cookie", "navigator"],
      caches: ["localStorage", "cookie"]
    }
  });

// Load the initial language (and always ensure English exists as a fallback).
// This keeps most translations out of memory until needed.
void (async () => {
  await ensureI18nLanguageLoaded("en");
  const initial = i18n.resolvedLanguage || i18n.language || "en";
  const loaded = await ensureI18nLanguageLoaded(initial);
  if (loaded !== initial) {
    try {
      await i18n.changeLanguage(loaded);
    } catch {
      // ignore
    }
  }
})();

export default i18n;
