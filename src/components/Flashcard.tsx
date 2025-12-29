import { useTranslation } from "react-i18next";
import { Card } from "../lib/types";
import { getLocalizedMeaning, hasMeaningTranslationsOptIn } from "../lib/meaningTranslations";
import { useEffect, useState } from "react";

type PromptFontChoice = "handwritten" | "kai" | "yshi" | "system";

export function Flashcard(props: {
    card: Card;
    reveal: boolean;
    onToggleReveal: () => void;
    promptFont?: PromptFontChoice;
}) {
    const { card, reveal, promptFont = "handwritten" } = props;
    const { t, i18n } = useTranslation();
    const [meaningText, setMeaningText] = useState<string>(card.meaning);

    const getFontFamily = () => {
        if (promptFont === "handwritten") {
            return '"Ma Shan Zheng", "ZCOOL KuaiLe", cursive';
        } else if (promptFont === "kai") {
            // iOS/iPadOS tends to support "Kaiti SC"/"Kaiti TC" when available.
            // If no Kai-style system font exists, fall back to our loaded handwriting fonts
            // (still CJK-capable) before generic serif.
            return '"TW-Kai", "Kaiti SC", "Kaiti TC", "STKaiti", "KaiTi", "BiauKai", "DFKai-SB", "AR PL UKai CN", "AR PL UKai HK", "AR PL UKai TW", "Ma Shan Zheng", "ZCOOL KuaiLe", serif';
        } else if (promptFont === "yshi") {
            // System font (Apple platforms) — falls back gracefully elsewhere.
            return '"YShi-Written SC", "YShi-Written TC", "写意体SC", "写意体TC", "TW-Kai", "Kaiti SC", "Kaiti TC", "STKaiti", "KaiTi", "BiauKai", "DFKai-SB", "AR PL UKai CN", "AR PL UKai HK", "AR PL UKai TW", "Ma Shan Zheng", "ZCOOL KuaiLe", serif';
        } else {
            // System UI fonts + common built-in CJK sans fallbacks.
            // - Apple: PingFang SC, Hiragino Sans GB
            // - Windows: Microsoft YaHei UI/YaHei, SimSun
            // - Android: Roboto, Noto Sans CJK
            // - Linux: Noto Sans CJK / Noto Sans SC, WenQuanYi Micro Hei
            return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans CJK SC", "Noto Sans SC", "Noto Sans CJK", "Noto Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "WenQuanYi Micro Hei", "Droid Sans Fallback", "SimSun", sans-serif';
        }
    };

    useEffect(() => {
        if (!reveal) {
            setMeaningText(card.meaning);
            return;
        }

        // Only download optional meaning translations after the user explicitly
        // selects a UI language from the settings (not just auto-detection).
        if (!hasMeaningTranslationsOptIn()) {
            setMeaningText(card.meaning);
            return;
        }

        let cancelled = false;

        const run = async () => {
            const language = i18n.resolvedLanguage || i18n.language || "en";

            // Never download meaning maps for English.
            if (language === "en") {
                setMeaningText(card.meaning);
                return;
            }

            const localized = await getLocalizedMeaning({
                id: card.id,
                defaultMeaning: card.meaning,
                language
            });
            if (!cancelled) setMeaningText(localized);
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [reveal, card.id, card.meaning, i18n.language, i18n.resolvedLanguage]);

    return (
        <div className="card">
            <div className="hanzi" style={{ fontFamily: getFontFamily() }}>{card.hanzi}</div>

            <div className="meta">
                <button onClick={props.onToggleReveal}>
                    {reveal ? t("flashcard.hide") : t("flashcard.reveal")}
                </button>
            </div>

            {reveal && (
                <div className="reveal">
                    <div className="pinyin">{card.pinyin}</div>
                    <div className="meaning">
                        {card.pos && card.pos.length > 0 && (
                            <span style={{ fontStyle: "italic", opacity: 0.7, marginRight: 8 }}>
                                {card.pos.join(", ")}
                            </span>
                        )}
                        {meaningText}
                    </div>
                </div>
            )}
        </div>
    );
}
