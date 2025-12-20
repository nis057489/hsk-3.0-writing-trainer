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
    const [padHandlers, setPadHandlers] = useState<Record<string, { undo: () => void; clear: () => void; hasStrokes: boolean }>>({});

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
                <div className="practice-kicker">{t("practice.header")}</div>
                <div className="practice-count">{characters.length} {t("practice.chars")}</div>
            </div>

            <div className="trace-grid" style={{ gridTemplateColumns: gridTemplate, gap: 8, justifyContent: "flex-start" }}>
                {characters.map((char, index) => {
                    const key = `${char}-${index}`;
                    const handler = padHandlers[key];
                    return (
                        <div key={key} className="trace-cell">
                            <div className="trace-label">{t("practice.charLabel", { index: index + 1 })}</div>
                            <div className="trace-pad" style={{ width: `${padSize}px`, height: `${padSize}px`, maxWidth: "100%" }}>
                                <DrawingPad
                                    size={padSize}
                                    tracingMode={tracingMode}
                                    character={char}
                                    showHoverIndicator={showHoverIndicator}
                                    onUndoClick={(undo, hasStrokes) => {
                                        setPadHandlers(prev => ({ ...prev, [key]: { ...prev[key], undo, hasStrokes } }));
                                    }}
                                    onClearClick={(clear, hasStrokes) => {
                                        setPadHandlers(prev => ({ ...prev, [key]: { ...prev[key], clear, hasStrokes } }));
                                    }}
                                />
                            </div>
                            <div className="trace-char">{char}</div>
                            <div className="pad-controls">
                                <button
                                    onClick={() => handler?.undo()}
                                    disabled={!handler?.hasStrokes}
                                    aria-label={t("controls.undo")}
                                    title={t("controls.undo")}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 7v6h6"/>
                                        <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handler?.clear()}
                                    disabled={!handler?.hasStrokes}
                                    aria-label={t("controls.clear")}
                                    title={t("controls.clear")}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
