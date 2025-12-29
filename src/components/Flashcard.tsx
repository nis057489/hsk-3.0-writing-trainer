import { useTranslation } from "react-i18next";
import { Card } from "../lib/types";

type PromptFontChoice = "handwritten" | "kai" | "yshi" | "system";

export function Flashcard(props: {
    card: Card;
    reveal: boolean;
    onToggleReveal: () => void;
    promptFont?: PromptFontChoice;
}) {
    const { card, reveal, promptFont = "handwritten" } = props;
    const { t } = useTranslation();

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
                        {card.meaning}
                    </div>
                </div>
            )}
        </div>
    );
}
