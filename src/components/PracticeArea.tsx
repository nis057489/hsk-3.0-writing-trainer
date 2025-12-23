import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DrawingPad } from "./DrawingPad";

interface PracticeAreaProps {
    text: string;
    tracingMode: boolean;
    showHoverIndicator?: boolean;
    padSizeChoice: "xs" | "small" | "medium" | "large";
    traceFont?: "handwritten" | "kai" | "yshi" | "system";
    gridStyle?: "rice" | "field" | "none";
    gridVerticalShift?: boolean;
    alignRight?: boolean;
}

export function PracticeArea({ text, tracingMode, padSizeChoice, showHoverIndicator = false, traceFont = "handwritten", gridStyle = "rice", gridVerticalShift = false, alignRight = false }: PracticeAreaProps) {
    const { t } = useTranslation();
    const [compact, setCompact] = useState(false);

    type PadHandlerState = { undo?: () => void; clear?: () => void; hasStrokes: boolean };

    const TraceCell = useMemo(() => {
        return React.memo(function TraceCell(props: {
            char: string;
            index: number;
            padSize: number;
            tracingMode: boolean;
            showHoverIndicator: boolean;
            traceFont: PracticeAreaProps["traceFont"];
            gridStyle: PracticeAreaProps["gridStyle"];
            gridVerticalShift: boolean;
        }) {
            const { t } = useTranslation();
            const [handler, setHandler] = useState<PadHandlerState>({ hasStrokes: false });

            const getFontFamily = () => {
                if (props.traceFont === "handwritten") {
                    return '"Ma Shan Zheng", "ZCOOL KuaiLe", cursive';
                } else if (props.traceFont === "kai") {
                    return '"Kaiti SC", "Kaiti TC", "STKaiti", "KaiTi", "BiauKai", "DFKai-SB", "TW-Kai", "AR PL UKai CN", "AR PL UKai HK", "AR PL UKai TW", "Ma Shan Zheng", "ZCOOL KuaiLe", serif';
                } else if (props.traceFont === "yshi") {
                    return '"YShi-Written SC", "YShi-Written TC", "写意体SC", "写意体TC", "Kaiti SC", "Kaiti TC", "STKaiti", "KaiTi", "BiauKai", "DFKai-SB", "TW-Kai", "AR PL UKai CN", "AR PL UKai HK", "AR PL UKai TW", "Ma Shan Zheng", "ZCOOL KuaiLe", serif';
                }
                return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans CJK SC", "Noto Sans SC", "Noto Sans CJK", "Noto Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "WenQuanYi Micro Hei", "Droid Sans Fallback", "SimSun", sans-serif';
            };

            return (
                <div className="trace-cell">
                    <div className="trace-label">{t("practice.charLabel", { index: props.index + 1 })}</div>
                    <div className="trace-pad" style={{ width: `${props.padSize}px`, height: `${props.padSize}px`, maxWidth: "100%" }}>
                        <DrawingPad
                            size={props.padSize}
                            tracingMode={props.tracingMode}
                            character={props.char}
                            showHoverIndicator={props.showHoverIndicator}
                            traceFont={props.traceFont}
                            gridStyle={props.gridStyle}
                            gridVerticalShift={props.gridVerticalShift}
                            onUndoClick={(undo, hasStrokes) => {
                                setHandler((prev: PadHandlerState) => {
                                    if (prev.undo === undo && prev.hasStrokes === hasStrokes) return prev;
                                    return { ...prev, undo, hasStrokes };
                                });
                            }}
                            onClearClick={(clear, hasStrokes) => {
                                setHandler((prev: PadHandlerState) => {
                                    if (prev.clear === clear && prev.hasStrokes === hasStrokes) return prev;
                                    return { ...prev, clear, hasStrokes };
                                });
                            }}
                        />
                    </div>
                    <div className="trace-char" style={{ fontFamily: getFontFamily() }}>{props.char}</div>
                    <div className="pad-controls">
                        <button
                            onClick={() => handler.undo?.()}
                            disabled={!handler.hasStrokes}
                            aria-label={t("controls.undo")}
                            title={t("controls.undo")}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 7v6h6" />
                                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handler.clear?.()}
                            disabled={!handler.hasStrokes}
                            aria-label={t("controls.clear")}
                            title={t("controls.clear")}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
            );
        });
    }, []);

    useEffect(() => {
        const byHeight = window.matchMedia("(max-height: 900px)");
        const byWidth = window.matchMedia("(max-width: 1100px)");

        const recompute = () => {
            setCompact((prev: boolean) => {
                const next = byHeight.matches || byWidth.matches;
                return prev === next ? prev : next;
            });
        };

        recompute();
        // Safari compatibility: older versions use addListener/removeListener.
        if (typeof byHeight.addEventListener === "function") {
            byHeight.addEventListener("change", recompute);
            byWidth.addEventListener("change", recompute);
        } else {
            (byHeight as any).addListener(recompute);
            (byWidth as any).addListener(recompute);
        }

        return () => {
            if (typeof byHeight.removeEventListener === "function") {
                byHeight.removeEventListener("change", recompute);
                byWidth.removeEventListener("change", recompute);
            } else {
                (byHeight as any).removeListener(recompute);
                (byWidth as any).removeListener(recompute);
            }
        };
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

    return (
        <div className={`practice-shell${compact ? " compact" : ""}`}>
            <div className="practice-header">
                <div className="practice-kicker">{t("practice.header")}</div>
                <div className="practice-count">{characters.length} {t("practice.chars")}</div>
            </div>

            {/* key={text} ensures all drawing pads remount when word changes, clearing previous strokes */}
            <div key={text} className={`trace-grid${alignRight ? " align-right" : ""}`}>
                {characters.map((char: string, index: number) => {
                    const key = `${char}-${index}`;

                    return (
                        <TraceCell
                            key={key}
                            char={char}
                            index={index}
                            padSize={padSize}
                            tracingMode={tracingMode}
                            showHoverIndicator={showHoverIndicator}
                            traceFont={traceFont}
                            gridStyle={gridStyle}
                            gridVerticalShift={gridVerticalShift}
                        />
                    );
                })}
            </div>
        </div>
    );
}
