import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./en.json";
import zh from "./zh.json";
import zhHant from "./zh-Hant.json";
import es from "./es.json";
import fr from "./fr.json";
import vi from "./vi.json";
import fil from "./fil.json";
import ko from "./ko.json";
import ar from "./ar.json";
import ru from "./ru.json";
import tr from "./tr.json";
import hi from "./hi.json";
import fa from "./fa.json";
import pt from "./pt.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
      "zh-Hant": { translation: zhHant },
      es: { translation: es },
      fr: { translation: fr },
      vi: { translation: vi },
      fil: { translation: fil },
      ko: { translation: ko },
      ar: { translation: ar },
      ru: { translation: ru },
      tr: { translation: tr },
      hi: { translation: hi },
      fa: { translation: fa },
      pt: { translation: pt }
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    },
    detection: {
      // Rely on localStorage/session/cookie + navigator; no URL parsing needed
      order: ["localStorage", "sessionStorage", "cookie", "navigator"],
      caches: ["localStorage", "cookie"]
    }
  });

export default i18n;
