import React, { useEffect, useMemo, useRef, useState } from "react";

type Point = { x: number; y: number };
type Stroke = Point[];

export function DrawingPad(props: { size?: number; showGrid?: boolean; tracingMode?: boolean; character?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [canvasSize, setCanvasSize] = useState(props.size || 300);

    // Strokes are stored in normalized coordinates (0-1)
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [isDown, setIsDown] = useState(false);
    const isDownRef = useRef(false);

    const currentStroke = useRef<Stroke>([]);
    const dpr = useMemo(() => window.devicePixelRatio || 1, []);

    useEffect(() => {
        setStrokes([]);
    }, [props.character]);

    // Handle resizing
    useEffect(() => {
        if (props.size) {
            setCanvasSize(props.size);
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
    }, [props.size]);

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
        if (props.showGrid !== false) {
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
        if (props.tracingMode && props.character) {
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
            ctx.fillText(props.character, cx, cy);
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
    }, [canvasSize, dpr, strokes, props.tracingMode, props.character]);

    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;

        const onPointerDown = (e: PointerEvent) => {
            e.preventDefault();
            c.setPointerCapture(e.pointerId);
            setIsDown(true);
            isDownRef.current = true;
            currentStroke.current = [getPos(e, c)];

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
            if (!isDownRef.current) return;
            e.preventDefault();
            const newPt = getPos(e, c);
            currentStroke.current.push(newPt);

            // quick draw without state churn:
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

        const onPointerLeave = (e: PointerEvent) => onPointerUp(e);

        c.addEventListener("pointerdown", onPointerDown, { passive: false });
        c.addEventListener("pointermove", onPointerMove, { passive: false });
        c.addEventListener("pointerup", onPointerUp, { passive: false });
        c.addEventListener("pointercancel", onPointerUp, { passive: false });
        c.addEventListener("pointerleave", onPointerLeave, { passive: false });

        return () => {
            c.removeEventListener("pointerdown", onPointerDown);
            c.removeEventListener("pointermove", onPointerMove);
            c.removeEventListener("pointerup", onPointerUp);
            c.removeEventListener("pointercancel", onPointerUp);
            c.removeEventListener("pointerleave", onPointerLeave);
        };
    }, [dpr, canvasSize]);

    const clear = () => setStrokes([]);
    const undo = () => setStrokes((prev: Stroke[]) => prev.slice(0, -1));

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const blockScroll = (e: Event) => {
            // Prevent the page from scrolling while writing
            e.preventDefault();
        };

        const blockPinch = (e: TouchEvent) => {
            // Stop pinch-zoom/resize gestures inside the pad
            if (e.touches.length > 1) e.preventDefault();
        };

        const blockGesture = (e: Event) => {
            // Safari emits gesturestart/gesturechange for pinch
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
        <div
            ref={containerRef}
            style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", touchAction: "none" }}
        >
            <div style={{ position: "relative", touchAction: "none" }}>
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
            </div>
            <div style={{ display: "flex", gap: 8 }}>
                <button onClick={undo} disabled={strokes.length === 0}>Undo</button>
                <button onClick={clear} disabled={strokes.length === 0}>Clear</button>
            </div>
        </div>
    );
}
