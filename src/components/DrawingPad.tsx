import React, { useEffect, useMemo, useRef, useState } from "react";

type Point = { x: number; y: number };
type Stroke = Point[];

function getPos(e: PointerEvent, el: HTMLCanvasElement) {
  const r = el.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

export function DrawingPad(props: { size?: number; showGrid?: boolean; tracingMode?: boolean; character?: string }) {
  const size = props.size ?? 360;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDown, setIsDown] = useState(false);

  const currentStroke = useRef<Stroke>([]);

  const dpr = useMemo(() => window.devicePixelRatio || 1, []);

  function redraw() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, c.width, c.height);

    // Optional grid
    if (props.showGrid !== false) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 1 * dpr;
      ctx.strokeStyle = "#000";
      const s = size * dpr;

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
      ctx.font = `${size * dpr * 0.8}px "KaiTi", "Kaiti SC", "STKaiti", "AR PL UKai CN", "AR PL UKai HK", "AR PL UKai TW", "AR PL UKai MO", "AR PL KaitiM GB", "KaiTi_GB2312", "DFKai-SB", "TW-Kai", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000";
      // Center of the canvas
      const cx = (size * dpr) / 2;
      const cy = (size * dpr) / 2;
      // Adjust vertical alignment slightly if needed, but middle baseline usually works well for single chars
      ctx.fillText(props.character, cx, cy);
      ctx.restore();
    }

    // Draw strokes
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 10 * dpr;

    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * dpr, stroke[0].y * dpr);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x * dpr, stroke[i].y * dpr);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    c.width = size * dpr;
    c.height = size * dpr;
    c.style.width = `${size}px`;
    c.style.height = `${size}px`;

    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, dpr, strokes, props.tracingMode, props.character]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      setIsDown(true);
      currentStroke.current = [getPos(e, c)];
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      e.preventDefault();
      currentStroke.current.push(getPos(e, c));

      // quick draw without state churn:
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const pts = currentStroke.current;
      if (pts.length < 2) return;
      const a = pts[pts.length - 2];
      const b = pts[pts.length - 1];
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 10 * dpr;
      ctx.beginPath();
      ctx.moveTo(a.x * dpr, a.y * dpr);
      ctx.lineTo(b.x * dpr, b.y * dpr);
      ctx.stroke();
      ctx.restore();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDown) return;
      e.preventDefault();
      setIsDown(false);
      const done = currentStroke.current;
      currentStroke.current = [];
      if (done.length > 1) setStrokes((prev) => [...prev, done]);
    };

    c.addEventListener("pointerdown", onPointerDown, { passive: false });
    c.addEventListener("pointermove", onPointerMove, { passive: false });
    c.addEventListener("pointerup", onPointerUp, { passive: false });
    c.addEventListener("pointercancel", onPointerUp, { passive: false });

    return () => {
      c.removeEventListener("pointerdown", onPointerDown);
      c.removeEventListener("pointermove", onPointerMove);
      c.removeEventListener("pointerup", onPointerUp);
      c.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isDown, dpr]);

  const clear = () => setStrokes([]);
  const undo = () => setStrokes((prev) => prev.slice(0, -1));

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <canvas
        ref={canvasRef}
        style={{
          background: "white",
          borderRadius: 12,
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
          touchAction: "none"
        }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={undo} disabled={strokes.length === 0}>Undo</button>
        <button onClick={clear} disabled={strokes.length === 0}>Clear</button>
      </div>
    </div>
  );
}
