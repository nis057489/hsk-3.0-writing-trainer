export type MeaningMap = Record<string, string>;

const MEANINGS_OPT_IN_KEY = "prefs.meanings.optIn";

export function setMeaningTranslationsOptIn(): void {
  try {
    localStorage.setItem(MEANINGS_OPT_IN_KEY, "1");
  } catch {
    // ignore storage errors
  }
}

export function hasMeaningTranslationsOptIn(): boolean {
  try {
    return localStorage.getItem(MEANINGS_OPT_IN_KEY) === "1";
  } catch {
    return false;
  }
}

const meaningFiles = import.meta.glob<{ default: MeaningMap }>(
  "/src/data/meanings/*.json",
  { eager: false }
);

const loadersByLocale = new Map<string, () => Promise<{ default: MeaningMap }>>(
  Object.entries(meaningFiles).flatMap(([filePath, loader]) => {
    const fileName = filePath.split("/").pop() || "";
    const locale = fileName.endsWith(".json") ? fileName.slice(0, -".json".length) : "";
    return locale ? ([[locale, loader]] as const) : [];
  })
);

const mapCache = new Map<string, Promise<MeaningMap | null>>();

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

async function loadMeaningMap(language: string): Promise<MeaningMap | null> {
  const candidates = candidatesForLanguage(language);

  for (const candidate of candidates) {
    const cacheKey = candidate;
    const cached = mapCache.get(cacheKey);
    if (cached) {
      const resolved = await cached;
      if (resolved) return resolved;
      continue;
    }

    const loader = loadersByLocale.get(candidate);
    if (!loader) {
      mapCache.set(cacheKey, Promise.resolve(null));
      continue;
    }
    const promise = loader()
      .then((m) => m.default)
      .catch(() => null);

    mapCache.set(cacheKey, promise);
    const resolved = await promise;
    if (resolved) return resolved;
  }

  return null;
}

export async function getLocalizedMeaning(params: {
  id: string;
  defaultMeaning: string;
  language: string;
}): Promise<string> {
  const { id, defaultMeaning, language } = params;

  const map = await loadMeaningMap(language);
  const candidate = map ? map[id] : undefined;

  if (typeof candidate === "string" && candidate.trim().length > 0) {
    return candidate;
  }

  return defaultMeaning;
}
