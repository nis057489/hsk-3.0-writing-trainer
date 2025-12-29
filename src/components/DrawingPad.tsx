import React, { useEffect, useMemo, useRef, useState } from "react";

type Point = { x: number; y: number; pressure: number; time: number };
type Stroke = Point[];
type BrushType = "pencil" | "fountain" | "brush";

interface DrawingPadProps {
    size?: number;
    showGrid?: boolean;
    tracingMode?: boolean;
    character?: string;
    showHoverIndicator?: boolean;
    traceFont?: "handwritten" | "kai" | "yshi" | "system";
    gridStyle?: "rice" | "field" | "none";
    gridVerticalShift?: boolean;
    brushType?: BrushType;
    strokeColor?: string;
    onUndoClick?: (undo: () => void, hasStrokes: boolean) => void;
    onClearClick?: (clear: () => void, hasStrokes: boolean) => void;
}

export function DrawingPad({ size, showGrid, tracingMode, character, showHoverIndicator = false, traceFont = "handwritten", gridStyle = "rice", gridVerticalShift = false, brushType = "pencil", strokeColor = "#111", onUndoClick, onClearClick }: DrawingPadProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [canvasSize, setCanvasSize] = useState(size || 300);
    const [hoverPoint, setHoverPoint] = useState<Point | null>(null);

    // Strokes are stored in normalized coordinates (0-1)
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const isDownRef = useRef(false);

    const hoverRafIdRef = useRef<number | null>(null);
    const pendingHoverRef = useRef<Point | null>(null);

    const drawRafIdRef = useRef<number | null>(null);
    const lastDrawnIndexRef = useRef(0);
    const lastWidthRef = useRef<number>(0);

    // Avoid effect → parent setState → rerender loops caused by callback identity changes.
    const onUndoClickRef = useRef(onUndoClick);
    const onClearClickRef = useRef(onClearClick);

    useEffect(() => {
        onUndoClickRef.current = onUndoClick;
    }, [onUndoClick]);

    useEffect(() => {
        onClearClickRef.current = onClearClick;
    }, [onClearClick]);

    const currentStroke = useRef<Stroke>([]);
    const dpr = useMemo(() => window.devicePixelRatio || 1, []);

    useEffect(() => {
        setStrokes([]);
    }, [character]);

    // Handle resizing
    useEffect(() => {
        if (size) {
            setCanvasSize(size);
            return;
        }

        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                // Use the smaller dimension to keep it square and fitting
                const nextSize = Math.round(Math.min(width, height || width));
                setCanvasSize((prev: number) => (prev === nextSize ? prev : nextSize));
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, [size]);

    function getPos(e: PointerEvent, el: HTMLCanvasElement): Point {
        const r = el.getBoundingClientRect();
        return {
            x: (e.clientX - r.left) / r.width,
            y: (e.clientY - r.top) / r.height,
            pressure: e.pressure,
            time: Date.now()
        };
    }

    function redraw() {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext("2d");
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, c.width, c.height);

        const s = canvasSize * dpr;

        // Tracing mode
        if (tracingMode && character) {
            ctx.save();
            ctx.globalAlpha = 0.15;
            const fontSize = s * 0.65;

            let fontStack: string;
            if (traceFont === "handwritten") {
                fontStack = '"Ma Shan Zheng", "ZCOOL KuaiLe", cursive';
            } else if (traceFont === "kai") {
                fontStack = '"TW-Kai", "Kaiti SC", "Kaiti TC", "STKaiti", "KaiTi", "BiauKai", "DFKai-SB", "AR PL UKai CN", "AR PL UKai HK", "AR PL UKai TW", "Ma Shan Zheng", "ZCOOL KuaiLe", serif';
            } else if (traceFont === "yshi") {
                fontStack = '"YShi-Written SC", "YShi-Written TC", "写意体SC", "写意体TC", "TW-Kai", "Kaiti SC", "Kaiti TC", "STKaiti", "KaiTi", "BiauKai", "DFKai-SB", "AR PL UKai CN", "AR PL UKai HK", "AR PL UKai TW", "Ma Shan Zheng", "ZCOOL KuaiLe", serif';
            } else {
                fontStack = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans CJK SC", "Noto Sans SC", "Noto Sans CJK", "Noto Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "WenQuanYi Micro Hei", "Droid Sans Fallback", "SimSun", sans-serif';
            }

            ctx.font = `${fontSize}px ${fontStack}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#000";
            // Center of the canvas
            const cx = s / 2;
            const cy = s / 2;
            // Adjust vertical alignment slightly if needed
            ctx.fillText(character, cx, cy);
            ctx.restore();
        }

        // Draw strokes
        const baseWidth = (canvasSize / 30) * dpr;

        for (const stroke of strokes) {
            if (stroke.length < 2) continue;

            if (brushType === "pencil") {
                ctx.save();
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = baseWidth;
                ctx.beginPath();
                ctx.moveTo(stroke[0].x * s, stroke[0].y * s);
                for (let i = 1; i < stroke.length; i++) {
                    ctx.lineTo(stroke[i].x * s, stroke[i].y * s);
                }
                ctx.stroke();
                ctx.restore();
            } else {
                // Variable width
                const points = stroke.map(p => ({ x: p.x * s, y: p.y * s, pressure: p.pressure, time: p.time }));
                const widths: number[] = [];

                for (let i = 0; i < points.length; i++) {
                    const p = points[i];
                    const prev = i > 0 ? points[i - 1] : p;

                    let w = baseWidth;
                    if (brushType === "fountain") {
                        const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
                        const time = Math.max(1, p.time - prev.time);
                        const v = dist / time; // pixels / ms
                        const factor = Math.max(0.2, 1 - v * 0.5);
                        w = baseWidth * factor;
                    } else if (brushType === "brush") {
                        let pressure = p.pressure;
                        // Fallback for mouse (usually 0.5)
                        if (pressure === 0.5) {
                            const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
                            const time = Math.max(1, p.time - prev.time);
                            const v = dist / time;
                            // Slower = thicker
                            pressure = Math.min(1, Math.max(0, 0.5 + (1 - v) * 0.5));
                        }
                        w = baseWidth * (0.2 + pressure * 1.8);
                    }

                    if (i > 0) {
                        w = widths[i - 1] * 0.6 + w * 0.4;
                    }
                    widths.push(w);
                }

                ctx.fillStyle = strokeColor;
                for (let i = 0; i < points.length - 1; i++) {
                    const p1 = points[i];
                    const p2 = points[i + 1];
                    const w1 = widths[i];
                    const w2 = widths[i + 1];

                    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);

                    ctx.beginPath();
                    ctx.moveTo(p1.x + sin * w1 / 2, p1.y - cos * w1 / 2);
                    ctx.lineTo(p2.x + sin * w2 / 2, p2.y - cos * w2 / 2);
                    ctx.lineTo(p2.x - sin * w2 / 2, p2.y + cos * w2 / 2);
                    ctx.lineTo(p1.x - sin * w1 / 2, p1.y + cos * w1 / 2);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(p1.x, p1.y, w1 / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Last cap
                if (points.length > 0) {
                    const last = points[points.length - 1];
                    const lastW = widths[widths.length - 1];
                    ctx.beginPath();
                    ctx.arc(last.x, last.y, lastW / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    // If web fonts load after initial render, the canvas may have already drawn with a fallback font.
    // Redraw once fonts are ready so iPadOS shows the intended glyphs.
    useEffect(() => {
        if (!tracingMode || !character) return;
        const fontSet = (document as any).fonts;
        if (!fontSet || !fontSet.ready || typeof fontSet.ready.then !== "function") return;

        let cancelled = false;
        fontSet.ready.then(() => {
            if (cancelled) return;
            redraw();
        });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tracingMode, character, traceFont]);

    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;

        c.width = canvasSize * dpr;
        c.height = canvasSize * dpr;
        // We don't set style width/height here because CSS handles it (width: 100%)
        // But we need to ensure aspect ratio is maintained if we want square.
        // Actually, if we use width: 100%, height: auto, canvas uses its aspect ratio.
        // So setting width/height attributes is enough for aspect ratio.
        // But to be safe and explicit:
        c.style.width = "100%";
        c.style.height = "auto";
        c.style.aspectRatio = "1 / 1";

        redraw();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasSize, dpr]);

    useEffect(() => {
        redraw();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [strokes, tracingMode, character, traceFont, brushType]);

    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;

        const flushDraw = () => {
            drawRafIdRef.current = null;
            if (!isDownRef.current) return;

            const ctx = c.getContext("2d");
            if (!ctx) return;

            const pts = currentStroke.current;
            if (pts.length < 2) return;

            const s = canvasSize * dpr;
            const startIndex = Math.max(1, lastDrawnIndexRef.current);
            const endIndex = pts.length - 1;
            if (startIndex > endIndex) return;

            const baseWidth = (canvasSize / 30) * dpr;

            if (brushType === "pencil") {
                ctx.save();
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = baseWidth;
                ctx.beginPath();

                const first = pts[startIndex - 1];
                ctx.moveTo(first.x * s, first.y * s);
                for (let i = startIndex; i <= endIndex; i++) {
                    const p = pts[i];
                    ctx.lineTo(p.x * s, p.y * s);
                }

                ctx.stroke();
                ctx.restore();
            } else {
                // Variable width incremental
                ctx.fillStyle = strokeColor;

                for (let i = startIndex; i <= endIndex; i++) {
                    const p = pts[i];
                    const prev = pts[i - 1];

                    let w = baseWidth;
                    if (brushType === "fountain") {
                        const dist = Math.hypot((p.x - prev.x) * s, (p.y - prev.y) * s);
                        const time = Math.max(1, p.time - prev.time);
                        const v = dist / time;
                        const factor = Math.max(0.2, 1 - v * 0.5);
                        w = baseWidth * factor;
                    } else if (brushType === "brush") {
                        let pressure = p.pressure;
                        if (pressure === 0.5) {
                            const dist = Math.hypot((p.x - prev.x) * s, (p.y - prev.y) * s);
                            const time = Math.max(1, p.time - prev.time);
                            const v = dist / time;
                            pressure = Math.min(1, Math.max(0, 0.5 + (1 - v) * 0.5));
                        }
                        w = baseWidth * (0.2 + pressure * 1.8);
                    }

                    if (i === 1) {
                        lastWidthRef.current = w;
                    } else {
                        w = lastWidthRef.current * 0.6 + w * 0.4;
                    }

                    const prevW = lastWidthRef.current;
                    lastWidthRef.current = w;

                    const p1 = { x: prev.x * s, y: prev.y * s };
                    const p2 = { x: p.x * s, y: p.y * s };

                    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);

                    ctx.beginPath();
                    ctx.moveTo(p1.x + sin * prevW / 2, p1.y - cos * prevW / 2);
                    ctx.lineTo(p2.x + sin * w / 2, p2.y - cos * w / 2);
                    ctx.lineTo(p2.x - sin * w / 2, p2.y + cos * w / 2);
                    ctx.lineTo(p1.x - sin * prevW / 2, p1.y + cos * prevW / 2);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(p1.x, p1.y, prevW / 2, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(p2.x, p2.y, w / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            lastDrawnIndexRef.current = pts.length - 1;
        };

        const onPointerDown = (e: PointerEvent) => {
            e.preventDefault();
            c.setPointerCapture(e.pointerId);
            isDownRef.current = true;
            currentStroke.current = [getPos(e, c)];
            lastDrawnIndexRef.current = 0;
            lastWidthRef.current = (canvasSize / 30) * dpr;
            setHoverPoint(null);

            // Draw dot
            const ctx = c.getContext("2d");
            if (!ctx) return;
            const s = canvasSize * dpr;
            const pt = currentStroke.current[0];

            let w = (canvasSize / 30) * dpr;
            if (brushType === "brush") {
                let pressure = pt.pressure;
                if (pressure === 0.5) pressure = 0.5;
                w = w * (0.2 + pressure * 1.8);
            }
            lastWidthRef.current = w;

            ctx.save();
            ctx.fillStyle = strokeColor;
            ctx.beginPath();
            ctx.arc(pt.x * s, pt.y * s, w / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!isDownRef.current) {
                if (e.pointerType === "pen" && e.buttons === 0) {
                    if (showHoverIndicator) {
                        pendingHoverRef.current = getPos(e, c);
                        if (hoverRafIdRef.current == null) {
                            hoverRafIdRef.current = window.requestAnimationFrame(() => {
                                hoverRafIdRef.current = null;
                                setHoverPoint(pendingHoverRef.current);
                            });
                        }
                    }
                }
                return;
            }
            e.preventDefault();
            const newPt = getPos(e, c);
            currentStroke.current.push(newPt);

            if (drawRafIdRef.current == null) {
                drawRafIdRef.current = window.requestAnimationFrame(flushDraw);
            }
        };

        const onPointerUp = (e: PointerEvent) => {
            if (!isDownRef.current) return;
            e.preventDefault();
            isDownRef.current = false;

            if (drawRafIdRef.current != null) {
                window.cancelAnimationFrame(drawRafIdRef.current);
                drawRafIdRef.current = null;
            }

            // Ensure the last segment is flushed before we commit the stroke.
            flushDraw();

            const done = currentStroke.current;
            currentStroke.current = [];
            if (done.length > 0) {
                setStrokes((prev: Stroke[]) => [...prev, done]);
            } else {
                redraw();
            }
        };

        const onPointerOver = (e: PointerEvent) => {
            if (showHoverIndicator && e.pointerType === "pen" && e.buttons === 0) {
                pendingHoverRef.current = getPos(e, c);
                if (hoverRafIdRef.current == null) {
                    hoverRafIdRef.current = window.requestAnimationFrame(() => {
                        hoverRafIdRef.current = null;
                        setHoverPoint(pendingHoverRef.current);
                    });
                }
            }
        };

        const onPointerLeave = (e: PointerEvent) => {
            if (hoverRafIdRef.current != null) {
                window.cancelAnimationFrame(hoverRafIdRef.current);
                hoverRafIdRef.current = null;
            }
            pendingHoverRef.current = null;

            if (drawRafIdRef.current != null) {
                window.cancelAnimationFrame(drawRafIdRef.current);
                drawRafIdRef.current = null;
            }

            setHoverPoint(null);
            onPointerUp(e);
        };

        c.addEventListener("pointerdown", onPointerDown, { passive: false });
        c.addEventListener("pointermove", onPointerMove, { passive: false });
        c.addEventListener("pointerup", onPointerUp, { passive: false });
        c.addEventListener("pointercancel", onPointerUp, { passive: false });
        c.addEventListener("pointerover", onPointerOver, { passive: true });
        c.addEventListener("pointerleave", onPointerLeave, { passive: false });

        return () => {
            if (hoverRafIdRef.current != null) {
                window.cancelAnimationFrame(hoverRafIdRef.current);
                hoverRafIdRef.current = null;
            }
            if (drawRafIdRef.current != null) {
                window.cancelAnimationFrame(drawRafIdRef.current);
                drawRafIdRef.current = null;
            }
            c.removeEventListener("pointerdown", onPointerDown);
            c.removeEventListener("pointermove", onPointerMove);
            c.removeEventListener("pointerup", onPointerUp);
            c.removeEventListener("pointercancel", onPointerUp);
            c.removeEventListener("pointerover", onPointerOver);
            c.removeEventListener("pointerleave", onPointerLeave);
        };
    }, [dpr, canvasSize, showHoverIndicator, brushType, strokeColor]);

    const clear = React.useCallback(() => setStrokes([]), []);
    const undo = React.useCallback(() => setStrokes((prev: Stroke[]) => prev.slice(0, -1)), []);

    useEffect(() => {
        const hasStrokes = strokes.length > 0;
        onUndoClickRef.current?.(undo, hasStrokes);
        onClearClickRef.current?.(clear, hasStrokes);
    }, [strokes.length, undo, clear]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const isControlTarget = (target: EventTarget | null) => {
            return target instanceof HTMLElement && target.closest("button, select, option, input, label");
        };

        const blockScroll = (e: Event) => {
            if (isControlTarget(e.target)) return;
            e.preventDefault();
        };

        const blockPinch = (e: TouchEvent) => {
            if (isControlTarget(e.target)) return;
            if (e.touches.length > 1) e.preventDefault();
        };

        const blockGesture = (e: Event) => {
            if (isControlTarget(e.target)) return;
            e.preventDefault();
        };

        container.addEventListener("touchstart", blockPinch, { passive: false });
        container.addEventListener("touchmove", blockPinch, { passive: false });
        container.addEventListener("touchmove", blockScroll, { passive: false });
        container.addEventListener("wheel", blockScroll, { passive: false });

        window.addEventListener("gesturestart", blockGesture, { passive: false } as any);
        window.addEventListener("gesturechange", blockGesture, { passive: false } as any);
        window.addEventListener("gestureend", blockGesture, { passive: false } as any);

        return () => {
            container.removeEventListener("touchstart", blockPinch);
            container.removeEventListener("touchmove", blockPinch);
            container.removeEventListener("touchmove", blockScroll);
            container.removeEventListener("wheel", blockScroll);
            window.removeEventListener("gesturestart", blockGesture as any);
            window.removeEventListener("gesturechange", blockGesture as any);
            window.removeEventListener("gestureend", blockGesture as any);
        };
    }, []);

    return (
        <div ref={containerRef} className="pad-shell" style={{ touchAction: "none" }}>
            <div className="pad-surface">
                <div
                    style={{
                        background: "white",
                        borderRadius: 12,
                        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
                        overflow: "hidden"
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        style={{
                            background: "transparent",
                            touchAction: "none",
                            width: "100%",
                            height: "auto",
                            display: "block",
                            objectFit: "contain"
                        }}
                    />
                </div>
                {showHoverIndicator && hoverPoint && (
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            left: `${hoverPoint.x * 100}%`,
                            top: `${hoverPoint.y * 100}%`,
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            border: "2px solid var(--accent, #2563eb)",
                            background: "rgba(37,99,235,0.08)",
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "none",
                            boxShadow: "0 0 0 1px rgba(37,99,235,0.05)"
                        }}
                    />
                )}
                {/* CSS-based grid overlay; hide entirely when gridStyle is none */}
                {gridStyle !== "none" && (
                    <div
                        className={`practice-grid practice-grid-${gridStyle}${gridVerticalShift ? ' practice-grid-shifted' : ''}`}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 1,
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </div>
        </div>
    );
}
