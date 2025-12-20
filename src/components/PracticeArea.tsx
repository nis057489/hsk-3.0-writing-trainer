import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DrawingPad } from "./DrawingPad";

interface PracticeAreaProps {
    text: string;
    tracingMode: boolean;
    showHoverIndicator?: boolean;
    padSizeChoice: "xs" | "small" | "medium" | "large";
}

export function PracticeArea({ text, tracingMode, padSizeChoice, showHoverIndicator = false }: PracticeAreaProps) {
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

    const padSize = useMemo(() => {
        const baseSizes = {
            xs: 90,
            small: 110,
            medium: 150,
            large: 190
        } as const;
        const scale = compact ? 0.9 : 1;
        return Math.round(baseSizes[padSizeChoice] * scale);
    }, [compact, padSizeChoice]);

    const gridTemplate = useMemo(() => {
        const col = padSize + 12; // pad plus a small gutter
        return `repeat(auto-fit, minmax(${col}px, ${col}px))`;
    }, [padSize]);

    return (
        <div className={`practice-shell${compact ? " compact" : ""}`}>
            <div className="practice-header">
                <div>
                    <div className="practice-kicker">{t("practice.header")}</div>
                    <div className="practice-title">{text}</div>
                </div>
                <div className="practice-count">{characters.length} {t("practice.chars")}</div>
            </div>

            <div className="trace-grid" style={{ gridTemplateColumns: gridTemplate, gap: 8, justifyContent: "flex-start" }}>
                {characters.map((char, index) => (
                    <div key={`${char}-${index}`} className="trace-cell">
                        <div className="trace-label">{t("practice.charLabel", { index: index + 1 })}</div>
                        <div className="trace-pad" style={{ width: `${padSize}px`, height: `${padSize}px`, maxWidth: "100%" }}>
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
