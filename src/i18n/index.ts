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
import ug from "./ug.json";
import mn from "./mn.json";
import bo from "./bo.json";
import de from "./de.json";
import it from "./it.json";
import ja from "./ja.json";
import id from "./id.json";
import th from "./th.json";
import nl from "./nl.json";
import pl from "./pl.json";
import uk from "./uk.json";
import sv from "./sv.json";
import ms from "./ms.json";
import he from "./he.json";
import bn from "./bn.json";
import ur from "./ur.json";

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
      pt: { translation: pt },
      ug: { translation: ug },
      mn: { translation: mn },
      bo: { translation: bo },
      de: { translation: de },
      it: { translation: it },
      ja: { translation: ja },
      id: { translation: id },
      th: { translation: th },
      nl: { translation: nl },
      pl: { translation: pl },
      uk: { translation: uk },
      sv: { translation: sv },
      ms: { translation: ms },
      he: { translation: he },
      bn: { translation: bn },
      ur: { translation: ur }
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
