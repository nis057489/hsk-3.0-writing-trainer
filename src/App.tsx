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
  const [mode, setMode] = useState<'flashcard' | 'sentence'>('flashcard');
  const [sentenceText, setSentenceText] = useState("");
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
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setMode('flashcard')}
              disabled={mode === 'flashcard'}
              style={{ opacity: mode === 'flashcard' ? 1 : 0.6 }}
            >
              Flashcards
            </button>
            <button
              onClick={() => setMode('sentence')}
              disabled={mode === 'sentence'}
              style={{ opacity: mode === 'sentence' ? 1 : 0.6 }}
            >
              Sentence Mode
            </button>
          </div>
          {mode === 'flashcard' && <button onClick={resetProgress}>Reset progress</button>}
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

      {mode === 'flashcard' ? (
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
      ) : (
        <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
          <div style={{ marginBottom: 24 }}>
            <input
              value={sentenceText}
              onChange={(e) => setSentenceText(e.target.value)}
              placeholder="Type a phrase or sentence here (e.g. 你好吗)..."
              style={{
                width: "100%",
                padding: 12,
                fontSize: 18,
                borderRadius: 8,
                border: "1px solid #ccc"
              }}
            />
          </div>

          {sentenceText.length === 0 ? (
            <div style={{ textAlign: "center", color: "#666", padding: 40 }}>
              Type some Chinese characters above to practice writing them.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
              {sentenceText.split("").map((char, i) => (
                <div key={i}>
                  <DrawingPad tracingMode={tracingMode} character={char} size={180} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <footer className="footer">
      </footer>
    </div>
  );
}
