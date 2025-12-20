import React, { useMemo, useState } from "react";
import { DrawingPad } from "./components/DrawingPad";
import { Flashcard } from "./components/Flashcard";
import { Toolbar } from "./components/Toolbar";
import vocab from "./data/hsk3.sample.json";
import { Card, Grade } from "./lib/types";
import { ensureState, loadProgress, nextState, saveProgress } from "./lib/scheduler";

function pickDue(cards: Card[], progressMap: Record<string, any>) {
  const now = Date.now();
  const due = cards.filter(c => ensureState(c.id, progressMap).due <= now);
  // If nothing due, just return all (keeps practice flowing)
  return due.length ? due : cards;
}

export default function App() {
  const cards = vocab as Card[];

  const [progress, setProgress] = useState(() => loadProgress());
  const [queue, setQueue] = useState<Card[]>(() => pickDue(cards, progress));
  const [idx, setIdx] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [tracingMode, setTracingMode] = useState(false);
  const card = queue[idx % queue.length];

  const remaining = useMemo(() => queue.length, [queue.length]);

  const advance = () => {
    setReveal(false);
    setIdx((i) => (i + 1) % queue.length);
  };

  const grade = (g: Grade) => {
    if (!card) return;

    const cur = ensureState(card.id, progress);
    const updated = nextState(cur, g);

    const nextMap = { ...progress, [card.id]: updated };
    setProgress(nextMap);
    saveProgress(nextMap);

    // If "again", push it a bit later in the session
    if (g === "again") {
      setQueue((q) => {
        const copy = q.slice();
        const [removed] = copy.splice(idx, 1);
        const insertAt = Math.min(copy.length, idx + 3);
        copy.splice(insertAt, 0, removed);
        return copy;
      });
    } else {
      advance();
    }
  };

  const resetProgress = () => {
    localStorage.removeItem("hsk3.progress");
    setProgress({});
    setQueue(cards);
    setIdx(0);
    setReveal(false);
  };

  if (!card) return <div style={{ padding: 24 }}>No cards loaded.</div>;

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>HSK 3 Writing Trainer</h1>
          <p>Draw the character. Reveal pinyin/meaning only after you attempt it.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <button onClick={resetProgress}>Reset progress</button>
          <label style={{ fontSize: "0.9rem" }}>
            <input
              type="checkbox"
              checked={tracingMode}
              onChange={(e) => setTracingMode(e.target.checked)}
            />{" "}
            Tracing Mode
          </label>
        </div>
      </header>

      <div className="grid">
        <div>
          <Flashcard
            card={card}
            reveal={reveal}
            onToggleReveal={() => setReveal((r) => !r)}
          />
          <Toolbar onGrade={grade} onNext={advance} remaining={remaining} />
        </div>

        <div>
          <h3 style={{ marginTop: 0 }}>Write here</h3>
          <DrawingPad tracingMode={tracingMode} character={card.hanzi} />
          <div className="tip">
            Tip: try writing the character <b>big</b>, centered, and in one smooth stroke per stroke.
          </div>
        </div>
      </div>

      <footer className="footer">
        <span>
          Replace <code>src/data/hsk3.sample.json</code> with your own list for the new HSK 3.
        </span>
      </footer>
    </div>
  );
}
