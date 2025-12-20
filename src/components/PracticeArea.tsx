import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DrawingPad } from "./DrawingPad";

interface PracticeAreaProps {
    text: string;
    tracingMode: boolean;
    showHoverIndicator?: boolean;
}

export function PracticeArea({ text, tracingMode, showHoverIndicator = false }: PracticeAreaProps) {
    const { t } = useTranslation();
    const [compact, setCompact] = useState(false);

    useEffect(() => {
        const update = () => {
            const h = window.innerHeight;
            const w = window.innerWidth;
            setCompact(h <= 900 || w <= 1100);
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const characters = useMemo(() => {
        return Array.from(text).filter(ch => ch.trim().length > 0);
    }, [text]);

    if (characters.length === 0) {
        return (
            <div className="practice-empty">
                {t("practice.empty")}
            </div>
        );
    }

    const padSize = compact
        ? (characters.length === 1 ? 150 : 180)
        : (characters.length === 1 ? 180 : 220);

    return (
        <div className={`practice-shell${compact ? " compact" : ""}`}>
            <div className="practice-header">
                <div>
                    <div className="practice-kicker">{t("practice.header")}</div>
                    <div className="practice-title">{text}</div>
                </div>
                <div className="practice-count">{characters.length} {t("practice.chars")}</div>
            </div>

            <div className="trace-grid">
                {characters.map((char, index) => (
                    <div key={`${char}-${index}`} className="trace-cell">
                        <div className="trace-label">{t("practice.charLabel", { index: index + 1 })}</div>
                        <div className="trace-pad">
                            <DrawingPad
                                size={padSize}
                                tracingMode={tracingMode}
                                character={char}
                                showHoverIndicator={showHoverIndicator}
                            />
                        </div>
                        <div className="trace-char">{char}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
