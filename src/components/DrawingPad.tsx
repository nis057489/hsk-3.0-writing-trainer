import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Point = { x: number; y: number };
type Stroke = Point[];

export function DrawingPad({ size, showGrid, tracingMode, character, showHoverIndicator = false, onUndoClick, onClearClick }: { size?: number; showGrid?: boolean; tracingMode?: boolean; character?: string; showHoverIndicator?: boolean; onUndoClick?: (undo: () => void, hasStrokes: boolean) => void; onClearClick?: (clear: () => void, hasStrokes: boolean) => void }) {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [canvasSize, setCanvasSize] = useState(size || 300);
    const [hoverPoint, setHoverPoint] = useState<Point | null>(null);

    // Strokes are stored in normalized coordinates (0-1)
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [isDown, setIsDown] = useState(false);
    const isDownRef = useRef(false);

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
                const size = Math.min(width, height || width);
                setCanvasSize(size);
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, [size]);

    function getPos(e: PointerEvent, el: HTMLCanvasElement): Point {
        const r = el.getBoundingClientRect();
        return {
            x: (e.clientX - r.left) / r.width,
            y: (e.clientY - r.top) / r.height
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

        // Optional grid
        if (showGrid !== false) {
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.lineWidth = 1 * dpr;
            ctx.strokeStyle = "#000";

            // border
            ctx.strokeRect(0, 0, s, s);

            // mid lines
            ctx.beginPath();
            ctx.moveTo(s / 2, 0); ctx.lineTo(s / 2, s);
            ctx.moveTo(0, s / 2); ctx.lineTo(s, s / 2);

            // diagonals
            ctx.moveTo(0, 0); ctx.lineTo(s, s);
            ctx.moveTo(s, 0); ctx.lineTo(0, s);
            ctx.stroke();
            ctx.restore();
        }

        // Tracing mode
        if (tracingMode && character) {
            ctx.save();
            ctx.globalAlpha = 0.15;
            const fontSize = s * 0.65;
            ctx.font = `${fontSize}px "KaiTi", "Kaiti SC", "STKaiti", "AR PL UKai CN", "AR PL UKai HK", "AR PL UKai TW", "AR PL UKai MO", "AR PL KaitiM GB", "KaiTi_GB2312", "DFKai-SB", "TW-Kai", serif`;
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
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#111";
        ctx.lineWidth = (canvasSize / 30) * dpr;

        for (const stroke of strokes) {
            if (stroke.length < 2) continue;
            ctx.beginPath();
            ctx.moveTo(stroke[0].x * s, stroke[0].y * s);
            for (let i = 1; i < stroke.length; i++) {
                ctx.lineTo(stroke[i].x * s, stroke[i].y * s);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

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
    }, [canvasSize, dpr, strokes, tracingMode, character]);

    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;

        const onPointerDown = (e: PointerEvent) => {
            e.preventDefault();
            c.setPointerCapture(e.pointerId);
            setIsDown(true);
            isDownRef.current = true;
            currentStroke.current = [getPos(e, c)];
            setHoverPoint(null);

            // Draw dot
            const ctx = c.getContext("2d");
            if (!ctx) return;
            const s = canvasSize * dpr;
            const pt = currentStroke.current[0];
            ctx.save();
            ctx.fillStyle = "#111";
            ctx.beginPath();
            ctx.arc(pt.x * s, pt.y * s, (canvasSize / 60) * dpr, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!isDownRef.current) {
                if (e.pointerType === "pen" && e.buttons === 0) {
                    if (showHoverIndicator) setHoverPoint(getPos(e, c));
                }
                return;
            }
            e.preventDefault();
            const newPt = getPos(e, c);
            currentStroke.current.push(newPt);

            const ctx = c.getContext("2d");
            if (!ctx) return;
            const pts = currentStroke.current;
            if (pts.length < 2) return;
            const a = pts[pts.length - 2];
            const b = pts[pts.length - 1];
            const s = canvasSize * dpr;

            ctx.save();
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = "#111";
            ctx.lineWidth = (canvasSize / 30) * dpr;
            ctx.beginPath();
            ctx.moveTo(a.x * s, a.y * s);
            ctx.lineTo(b.x * s, b.y * s);
            ctx.stroke();
            ctx.restore();
        };

        const onPointerUp = (e: PointerEvent) => {
            if (!isDownRef.current) return;
            e.preventDefault();
            setIsDown(false);
            isDownRef.current = false;
            const done = currentStroke.current;
            currentStroke.current = [];
            if (done.length > 0) setStrokes((prev: Stroke[]) => [...prev, done]);
            else redraw(); // Clear the dot if it was just a click without move? No, dot is fine.
            // Actually if we just clicked, we have 1 point.
            // If we have 1 point, we should probably store it as a dot.
            // But my loop requires length >= 2.
            // Let's just redraw to be clean.
            redraw();
        };

        const onPointerOver = (e: PointerEvent) => {
            if (showHoverIndicator && e.pointerType === "pen" && e.buttons === 0) {
                setHoverPoint(getPos(e, c));
            }
        };

        const onPointerLeave = (e: PointerEvent) => {
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
            c.removeEventListener("pointerdown", onPointerDown);
            c.removeEventListener("pointermove", onPointerMove);
            c.removeEventListener("pointerup", onPointerUp);
            c.removeEventListener("pointercancel", onPointerUp);
            c.removeEventListener("pointerover", onPointerOver);
            c.removeEventListener("pointerleave", onPointerLeave);
        };
    }, [dpr, canvasSize, showHoverIndicator]);

    const clear = () => setStrokes([]);
    const undo = () => setStrokes((prev: Stroke[]) => prev.slice(0, -1));

    useEffect(() => {
        if (onUndoClick) onUndoClick(undo, strokes.length > 0);
        if (onClearClick) onClearClick(clear, strokes.length > 0);
    }, [strokes.length, onUndoClick, onClearClick]);

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
                <canvas
                    ref={canvasRef}
                    style={{
                        background: "white",
                        borderRadius: 12,
                        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
                        touchAction: "none",
                        width: "100%",
                        height: "auto",
                        display: "block",
                        objectFit: "contain"
                    }}
                />
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
            </div>
        </div>
    );
}
