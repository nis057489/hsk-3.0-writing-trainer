import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../lib/types";

type PromptFontChoice = "handwritten" | "kai" | "system";

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
            return '"KaiTi", "Kaiti SC", "STKaiti", "BiauKai", "DFKai-SB", "TW-Kai", "AR PL UKai CN", "AR PL UKai HK", "AR PL UKai TW", serif';
        } else {
            return 'system-ui, -apple-system, sans-serif';
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
