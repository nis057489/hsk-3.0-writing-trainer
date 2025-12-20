import React, { useMemo, useState, useEffect } from "react";
import { DrawingPad } from "./components/DrawingPad";
import { Flashcard } from "./components/Flashcard";
import { Toolbar } from "./components/Toolbar";
import { Drawer } from "./components/Drawer";
import vocab from "./data/hsk.json";
import { Card, Grade } from "./lib/types";
import { ensureState, loadProgress, nextState, saveProgress } from "./lib/scheduler";

const LEVELS = [
    { id: "new-1", label: "HSK 1" },
    { id: "new-2", label: "HSK 2" },
    { id: "new-3", label: "HSK 3" },
    { id: "new-4", label: "HSK 4" },
    { id: "new-5", label: "HSK 5" },
    { id: "new-6", label: "HSK 6" },
    { id: "new-7+", label: "HSK 7-9" },
];

const POS_GROUPS = [
    { id: "n", label: "Nouns" },
    { id: "v", label: "Verbs" },
    { id: "a", label: "Adjectives" },
    { id: "d", label: "Adverbs" },
    { id: "r", label: "Pronouns" },
    { id: "c", label: "Conjunctions" },
    { id: "i", label: "Idioms" },
    { id: "l", label: "Phrases" },
];

function pickDue(cards: Card[], progressMap: Record<string, any>) {
    const now = Date.now();
    const due = cards.filter(c => ensureState(c.id, progressMap).due <= now);
    return due.length ? due : cards;
}

export default function App() {
    const allCards = vocab as Card[];

    const [progress, setProgress] = useState(() => loadProgress());

    // Filters
    const [selectedLevels, setSelectedLevels] = useState<string[]>(["new-1"]);
    const [selectedPos, setSelectedPos] = useState<string[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [characterMode, setCharacterMode] = useState<'simplified' | 'traditional'>('simplified');

    // Filtered pool
    const filteredCards = useMemo(() => {
        return allCards.filter(card => {
            const levelMatch = selectedLevels.length === 0 || (card.level && card.level.some(l => selectedLevels.includes(l)));
            const posMatch = selectedPos.length === 0 || (card.pos && card.pos.some(p => selectedPos.includes(p)));
            return levelMatch && posMatch;
        });
    }, [selectedLevels, selectedPos]);

    const [queue, setQueue] = useState<Card[]>([]);
    const [idx, setIdx] = useState(0);
    const [reveal, setReveal] = useState(false);
    const [tracingMode, setTracingMode] = useState(false);
    const [mode, setMode] = useState<'flashcard' | 'sentence'>('flashcard');
    const [sentenceText, setSentenceText] = useState("");

    // Initialize queue when filters change
    useEffect(() => {
        setQueue(pickDue(filteredCards, progress));
        setIdx(0);
        setReveal(false);
    }, [filteredCards, progress]);

    const card = queue[idx % queue.length];
    const remaining = queue.length;

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

        if (g === "again") {
            setQueue((q) => {
                const copy = q.slice();
                const [removed] = copy.splice(idx % copy.length, 1);
                const insertAt = Math.min(copy.length, (idx % copy.length) + 3);
                copy.splice(insertAt, 0, removed);
                return copy;
            });
        } else {
            advance();
        }
    };

    const toggleLevel = (id: string) => {
        setSelectedLevels(prev =>
            prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
        );
    };

    const togglePos = (id: string) => {
        setSelectedPos(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    return (
        <div className="app">
            <header className="header">
                <div>
                    <h1>HSK Writing Trainer</h1>
                    <p>Master Chinese characters with spaced repetition and stroke practice.</p>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            className={mode === 'flashcard' ? 'active' : ''}
                            onClick={() => setMode('flashcard')}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "20px",
                                border: "none",
                                background: mode === 'flashcard' ? "var(--primary-red)" : "#eee",
                                color: mode === 'flashcard' ? "white" : "#666",
                                cursor: "pointer",
                                fontWeight: "bold"
                            }}
                        >
                            Flashcards
                        </button>
                        <button
                            className={mode === 'sentence' ? 'active' : ''}
                            onClick={() => setMode('sentence')}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "20px",
                                border: "none",
                                background: mode === 'sentence' ? "var(--primary-red)" : "#eee",
                                color: mode === 'sentence' ? "white" : "#666",
                                cursor: "pointer",
                                fontWeight: "bold"
                            }}
                        >
                            Sentence Mode
                        </button>
                    </div>
                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        style={{
                            background: "none",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "#333"
                        }}
                    >
                        Settings
                    </button>
                </div>
            </header>

            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Settings">
                <div className="filter-section">
                    <h3>Levels</h3>
                    <div className="filter-group">
                        {LEVELS.map(l => (
                            <div
                                key={l.id}
                                className={`filter-chip ${selectedLevels.includes(l.id) ? 'active' : ''}`}
                                onClick={() => toggleLevel(l.id)}
                            >
                                {l.label}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="filter-section">
                    <h3>Parts of Speech</h3>
                    <div className="filter-group">
                        {POS_GROUPS.map(p => (
                            <div
                                key={p.id}
                                className={`filter-chip ${selectedPos.includes(p.id) ? 'active' : ''}`}
                                onClick={() => togglePos(p.id)}
                            >
                                {p.label}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="filter-section">
                    <h3>Options</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={tracingMode}
                                onChange={(e) => setTracingMode(e.target.checked)}
                            />
                            Tracing Mode
                        </label>

                        <div style={{ display: "flex", gap: 8, background: "#eee", padding: 4, borderRadius: 8 }}>
                            <button
                                onClick={() => setCharacterMode('simplified')}
                                style={{
                                    flex: 1,
                                    border: "none",
                                    background: characterMode === 'simplified' ? "white" : "transparent",
                                    boxShadow: characterMode === 'simplified' ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                    borderRadius: 6,
                                    padding: "6px 0",
                                    fontSize: 13,
                                    cursor: "pointer",
                                    fontWeight: characterMode === 'simplified' ? "bold" : "normal"
                                }}
                            >
                                Simplified
                            </button>
                            <button
                                onClick={() => setCharacterMode('traditional')}
                                style={{
                                    flex: 1,
                                    border: "none",
                                    background: characterMode === 'traditional' ? "white" : "transparent",
                                    boxShadow: characterMode === 'traditional' ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                    borderRadius: 6,
                                    padding: "6px 0",
                                    fontSize: 13,
                                    cursor: "pointer",
                                    fontWeight: characterMode === 'traditional' ? "bold" : "normal"
                                }}
                            >
                                Traditional
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 24, fontSize: 13, color: "#999" }}>
                    {filteredCards.length} words available
                </div>
            </Drawer>

            {mode === 'flashcard' ? (
                <div className="grid">
                    <main style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 24 }}>
                        {card ? (
                            <>
                                <div>
                                    <Flashcard
                                        card={{
                                            ...card,
                                            hanzi: characterMode === 'traditional' ? (card.traditional || card.hanzi) : card.hanzi
                                        }}
                                        reveal={reveal}
                                        onToggleReveal={() => setReveal((r) => !r)}
                                    />
                                    <Toolbar onGrade={grade} onNext={advance} remaining={remaining} />
                                </div>

                                <div className="card" style={{ display: "flex", flexDirection: "column" }}>
                                    <h3 style={{ marginTop: 0, color: "#888", fontSize: 14, textTransform: "uppercase" }}>Practice Area</h3>
                                    <div style={{ flex: 1, minHeight: 300 }}>
                                        <DrawingPad
                                            tracingMode={tracingMode}
                                            character={characterMode === 'traditional' ? (card.traditional || card.hanzi) : card.hanzi}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="card" style={{ textAlign: "center", padding: 40, gridColumn: "1 / -1" }}>
                                <h3>No cards found</h3>
                                <p>Try adjusting your filters in Settings to see more words.</p>
                            </div>
                        )}
                    </main>
                </div>
            ) : (
                <div style={{ maxWidth: 900, margin: "0 auto" }}>
                    <div className="card" style={{ marginBottom: 24 }}>
                        <input
                            value={sentenceText}
                            onChange={(e) => setSentenceText(e.target.value)}
                            placeholder="Type a phrase or sentence here (e.g. 你好吗)..."
                            style={{
                                width: "100%",
                                padding: 16,
                                fontSize: 20,
                                borderRadius: 8,
                                border: "2px solid #eee",
                                outline: "none"
                            }}
                        />
                    </div>

                    {sentenceText.length === 0 ? (
                        <div style={{ textAlign: "center", color: "#999", padding: 40 }}>
                            Type some Chinese characters above to practice writing them.
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
                            {sentenceText.split("").map((char, i) => (
                                <div key={i} className="card" style={{ padding: 12, aspectRatio: "1/1" }}>
                                    <DrawingPad tracingMode={tracingMode} character={char} />
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
