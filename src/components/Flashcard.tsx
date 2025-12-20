import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../lib/types";

export function Flashcard(props: {
    card: Card;
    reveal: boolean;
    onToggleReveal: () => void;
}) {
    const { card, reveal } = props;
    const { t } = useTranslation();

    return (
        <div className="card">
            <div className="hanzi">{card.hanzi}</div>

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
