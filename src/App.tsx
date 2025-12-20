import React, { useMemo, useState, useEffect } from "react";
import { DrawingPad } from "./components/DrawingPad";
import { Flashcard } from "./components/Flashcard";
import { Toolbar } from "./components/Toolbar";
import { Drawer } from "./components/Drawer";
import { PracticeArea } from "./components/PracticeArea";
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
    const [leftHanded, setLeftHanded] = useState(false);
    const [drawerView, setDrawerView] = useState<'menu' | 'help'>('menu');

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
    const displayHanzi = card ? (characterMode === 'traditional' ? (card.traditional || card.hanzi) : card.hanzi) : "";

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
            <div style={{ position: "fixed", top: 20, right: 20, zIndex: 100 }}>
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    style={{
                        background: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "48px",
                        height: "48px",
                        cursor: "pointer",
                        color: "#333",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px"
                    }}
                >
                    ☰
                </button>
            </div>

            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={drawerView === 'menu' ? "Menu" : "Stroke Order"}>
                {drawerView === 'menu' ? (
                    <>
                        <div style={{ marginBottom: 24 }}>
                            <h2 style={{ margin: "0 0 8px 0", color: "var(--primary-red)", fontSize: 20 }}>HSK Writing Trainer</h2>
                            <p style={{ margin: 0, fontSize: 14, opacity: 0.6 }}>Master Chinese characters.</p>
                        </div>

                        <div className="filter-section">
                            <h3>Mode</h3>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={() => { setMode('flashcard'); setIsDrawerOpen(false); }}
                                    style={{
                                        flex: 1,
                                        padding: "8px",
                                        borderRadius: "8px",
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
                                    onClick={() => { setMode('sentence'); setIsDrawerOpen(false); }}
                                    style={{
                                        flex: 1,
                                        padding: "8px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: mode === 'sentence' ? "var(--primary-red)" : "#eee",
                                        color: mode === 'sentence' ? "white" : "#666",
                                        cursor: "pointer",
                                        fontWeight: "bold"
                                    }}
                                >
                                    Sentence
                                </button>
                            </div>
                        </div>

                        <div className="filter-section">
                            <h3>Layout</h3>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={leftHanded}
                                    onChange={(e) => setLeftHanded(e.target.checked)}
                                />
                                Left Handed Mode
                            </label>
                        </div>

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

                        <div className="filter-section">
                            <h3>Help</h3>
                            <button
                                onClick={() => setDrawerView('help')}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid #eee",
                                    background: "white",
                                    color: "#333",
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontSize: "14px"
                                }}
                            >
                                <span>Stroke Order Guide</span>
                                <span>→</span>
                            </button>
                        </div>

                        <div style={{ marginTop: 24, fontSize: 13, color: "#999" }}>
                            {filteredCards.length} words available
                        </div>
                    </>
                ) : (
                    <div>
                        <button
                            onClick={() => setDrawerView('menu')}
                            style={{
                                background: "none",
                                border: "none",
                                padding: "0 0 16px 0",
                                color: "#666",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px"
                            }}
                        >
                            ← Back to Menu
                        </button>

                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            <section>
                                <h3 style={{ margin: "0 0 8px 0", color: "var(--primary-red)" }}>General Rules</h3>
                                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#555" }}>
                                    Chinese characters are written following a specific stroke order. Following these rules helps write characters faster and more beautifully.
                                </p>
                            </section>

                            <section>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: 15 }}>1. Top to Bottom</h4>
                                <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, fontSize: 14 }}>
                                    Example: <span style={{ fontWeight: "bold" }}>三</span> (Three)
                                    <br />
                                    Write the top stroke first, then the middle, then the bottom.
                                </div>
                            </section>

                            <section>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: 15 }}>2. Left to Right</h4>
                                <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, fontSize: 14 }}>
                                    Example: <span style={{ fontWeight: "bold" }}>川</span> (River)
                                    <br />
                                    Write the left vertical stroke, then the middle, then the right.
                                </div>
                            </section>

                            <section>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: 15 }}>3. Horizontal before Vertical</h4>
                                <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, fontSize: 14 }}>
                                    Example: <span style={{ fontWeight: "bold" }}>十</span> (Ten)
                                    <br />
                                    Write the horizontal stroke (一) first, then the vertical stroke (丨).
                                </div>
                            </section>

                            <section>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: 15 }}>4. Outside before Inside</h4>
                                <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, fontSize: 14 }}>
                                    Example: <span style={{ fontWeight: "bold" }}>月</span> (Moon)
                                    <br />
                                    Write the outside frame first, then the strokes inside.
                                </div>
                            </section>

                            <section>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: 15 }}>5. Inside before Closing</h4>
                                <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, fontSize: 14 }}>
                                    Example: <span style={{ fontWeight: "bold" }}>日</span> (Sun)
                                    <br />
                                    Write the frame, then the inside stroke, then close the bottom.
                                </div>
                            </section>

                            <section>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: 15 }}>6. Center before Sides</h4>
                                <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, fontSize: 14 }}>
                                    Example: <span style={{ fontWeight: "bold" }}>小</span> (Small)
                                    <br />
                                    Write the center hook first, then the left dot, then the right dot.
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </Drawer>

            {mode === 'flashcard' ? (
                <div className="practice-container" style={{
                    display: "flex",
                    flexDirection: leftHanded ? "row-reverse" : "row",
                    flexWrap: "wrap",
                    gap: 24,
                    alignItems: "start"
                }}>
                    {card ? (
                        <>
                            <div style={{ flex: "1 1 300px" }}>
                                <Flashcard
                                    card={{
                                        ...card,
                                        hanzi: displayHanzi
                                    }}
                                    reveal={reveal}
                                    onToggleReveal={() => setReveal((r) => !r)}
                                />
                                <Toolbar onGrade={grade} onNext={advance} remaining={remaining} />
                            </div>

                            <div className="card" style={{ flex: "1 1 300px", display: "flex", flexDirection: "column" }}>
                                <PracticeArea text={displayHanzi} tracingMode={tracingMode} />
                            </div>
                        </>
                    ) : (
                        <div className="card" style={{ textAlign: "center", padding: 40, width: "100%" }}>
                            <h3>No cards found</h3>
                            <p>Try adjusting your filters in Settings to see more words.</p>
                        </div>
                    )}
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
                                <div key={i} className="card" style={{ padding: 12 }}>
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
