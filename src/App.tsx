import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DrawingPad } from "./components/DrawingPad";
import { Flashcard } from "./components/Flashcard";
import { Toolbar } from "./components/Toolbar";
import { Drawer } from "./components/Drawer";
import { PracticeArea } from "./components/PracticeArea";
import { DrawerMenu } from "./components/drawer/DrawerMenu";
import { DrawerHelp } from "./components/drawer/DrawerHelp";
import { DrawerTips } from "./components/drawer/DrawerTips";
import { DrawerPosHelp } from "./components/drawer/DrawerPosHelp";
import vocab from "./data/hsk.json";
import { Card, Grade } from "./lib/types";
import { ensureState, loadProgress, nextState, saveProgress } from "./lib/scheduler";

type ThemeChoice = "light" | "dark" | "contrast" | "system";

type PadSizeChoice = "xs" | "small" | "medium" | "large";

type TraceFontChoice = "handwritten" | "kai" | "system" | "cursive";
type PromptFontChoice = "handwritten" | "kai" | "system" | "cursive";

type Prefs = {
    selectedLevels: string[];
    selectedPos: string[];
    characterMode: 'simplified' | 'traditional';
    leftHanded: boolean;
    tracingMode: boolean;
    mode: 'flashcard' | 'sentence';
    language: string;
    showHoverIndicator: boolean;
    padSizeChoice: PadSizeChoice;
    showDetailsDefault: boolean;
    traceFont: TraceFontChoice;
    promptFont: PromptFontChoice;
    advancedPosFilter: boolean;
};

function readPrefs<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return { ...fallback, ...parsed };
    } catch {
        return fallback;
    }
}

function pickDue(cards: Card[], progressMap: Record<string, any>) {
    const now = Date.now();
    const due = cards.filter(c => ensureState(c.id, progressMap).due <= now);
    return due.length ? due : cards;
}

const allCards = vocab as Card[];

export default function App() {
    const { t, i18n } = useTranslation();

    const prefDefaults: Prefs = {
        selectedLevels: ["new-1"],
        selectedPos: [],
        characterMode: 'simplified',
        leftHanded: true,
        tracingMode: false,
        mode: 'flashcard',
        language: i18n.resolvedLanguage || "en",
        showHoverIndicator: false,
        padSizeChoice: "small",
        showDetailsDefault: false,
        traceFont: "handwritten",
        promptFont: "handwritten",
        advancedPosFilter: false
    };

    const storedPrefs = readPrefs<Prefs>("prefs.state", prefDefaults);

    const [progress, setProgress] = useState(() => loadProgress());

    // Filters
    const [selectedLevels, setSelectedLevels] = useState<string[]>(storedPrefs.selectedLevels || ["new-1"]);
    const [selectedPos, setSelectedPos] = useState<string[]>(storedPrefs.selectedPos || []);
    const [advancedPosFilter, setAdvancedPosFilter] = useState<boolean>(storedPrefs.advancedPosFilter ?? false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [characterMode, setCharacterMode] = useState<'simplified' | 'traditional'>(storedPrefs.characterMode || 'simplified');
    const [leftHanded, setLeftHanded] = useState(storedPrefs.leftHanded ?? true);
    const [drawerView, setDrawerView] = useState<'menu' | 'help' | 'tips' | 'pos-help'>('menu');
    const [theme, setTheme] = useState<ThemeChoice>(() => (localStorage.getItem("theme") as ThemeChoice) || "system");
    const [language, setLanguage] = useState<string>(storedPrefs.language || i18n.resolvedLanguage || "en");

    // Map detailed POS codes to simple categories
    const posMapping: Record<string, string[]> = {
        "n": ["n", "ng", "nr", "ns", "nt", "nx", "nz"],
        "v": ["v", "vd", "vg", "vn"],
        "a": ["a", "ad", "ag", "an", "b"],
        "d": ["d", "dg"],
        "r": ["r", "rg"],
        "c": ["c"],
        "i": ["i", "j"],
        "l": ["l"],
        "m": ["m", "mg"],
        "t": ["t", "tg"],
        "e": ["e"],
        "f": ["f"],
        "g": ["g"],
        "h": ["h"],
        "k": ["k"],
        "o": ["o"],
        "p": ["p"],
        "q": ["q"],
        "s": ["s"],
        "u": ["u"],
        "w": ["w"],
        "x": ["x"],
        "y": ["y"],
        "z": ["z"]
    };

    // Filtered pool
    const filteredCards = useMemo(() => {
        return allCards.filter(card => {
            const levelMatch = selectedLevels.length === 0 || (card.level && card.level.some(l => selectedLevels.includes(l)));

            // POS filtering with simple/advanced mode
            let posMatch = true;
            if (selectedPos.length > 0 && card.pos) {
                if (advancedPosFilter) {
                    // Advanced mode: exact match
                    posMatch = card.pos.some(p => selectedPos.includes(p));
                } else {
                    // Simple mode: match any detailed code that maps to selected simple category
                    posMatch = card.pos.some(cardPosTag => {
                        return selectedPos.some(selectedSimple => {
                            const mappedCodes = posMapping[selectedSimple] || [selectedSimple];
                            return mappedCodes.includes(cardPosTag);
                        });
                    });
                }
            }

            return levelMatch && posMatch;
        });
    }, [selectedLevels, selectedPos, advancedPosFilter]);

    const levels = useMemo(() => ([
        { id: "new-1", label: t("levels.hsk1") },
        { id: "new-2", label: t("levels.hsk2") },
        { id: "new-3", label: t("levels.hsk3") },
        { id: "new-4", label: t("levels.hsk4") },
        { id: "new-5", label: t("levels.hsk5") },
        { id: "new-6", label: t("levels.hsk6") },
        { id: "new-7+", label: t("levels.hsk7") }
    ]), [t]);

    const simplePosGroups = useMemo(() => ([
        { id: "n", label: t("pos.n") },
        { id: "v", label: t("pos.v") },
        { id: "a", label: t("pos.a") },
        { id: "d", label: t("pos.d") },
        { id: "r", label: t("pos.r") },
        { id: "c", label: t("pos.c") },
        { id: "i", label: t("pos.i") },
        { id: "l", label: t("pos.l") },
        { id: "m", label: t("pos.m") },
        { id: "t", label: t("pos.t") },
        { id: "p", label: t("pos.p") },
        { id: "q", label: t("pos.q") },
        { id: "e", label: t("pos.e") },
        { id: "u", label: t("pos.u") },
        { id: "y", label: t("pos.y") }
    ]), [t]);

    const advancedPosGroups = useMemo(() => ([
        { id: "a", label: t("pos.a") },
        { id: "ad", label: t("pos.ad") },
        { id: "ag", label: t("pos.ag") },
        { id: "an", label: t("pos.an") },
        { id: "b", label: t("pos.b") },
        { id: "c", label: t("pos.c") },
        { id: "d", label: t("pos.d") },
        { id: "dg", label: t("pos.dg") },
        { id: "e", label: t("pos.e") },
        { id: "f", label: t("pos.f") },
        { id: "g", label: t("pos.g") },
        { id: "h", label: t("pos.h") },
        { id: "i", label: t("pos.i") },
        { id: "j", label: t("pos.j") },
        { id: "k", label: t("pos.k") },
        { id: "l", label: t("pos.l") },
        { id: "m", label: t("pos.m") },
        { id: "mg", label: t("pos.mg") },
        { id: "n", label: t("pos.n") },
        { id: "ng", label: t("pos.ng") },
        { id: "nr", label: t("pos.nr") },
        { id: "ns", label: t("pos.ns") },
        { id: "nt", label: t("pos.nt") },
        { id: "nx", label: t("pos.nx") },
        { id: "nz", label: t("pos.nz") },
        { id: "o", label: t("pos.o") },
        { id: "p", label: t("pos.p") },
        { id: "q", label: t("pos.q") },
        { id: "r", label: t("pos.r") },
        { id: "rg", label: t("pos.rg") },
        { id: "s", label: t("pos.s") },
        { id: "t", label: t("pos.t") },
        { id: "tg", label: t("pos.tg") },
        { id: "u", label: t("pos.u") },
        { id: "v", label: t("pos.v") },
        { id: "vd", label: t("pos.vd") },
        { id: "vg", label: t("pos.vg") },
        { id: "vn", label: t("pos.vn") },
        { id: "w", label: t("pos.w") },
        { id: "x", label: t("pos.x") },
        { id: "y", label: t("pos.y") },
        { id: "z", label: t("pos.z") }
    ]), [t]);

    // Filter POS groups to only show categories with available cards
    const posGroups = useMemo(() => {
        const groups = advancedPosFilter ? advancedPosGroups : simplePosGroups;

        // Count cards for each POS category (considering current level filter)
        const levelFilteredCards = allCards.filter(card =>
            selectedLevels.length === 0 || (card.level && card.level.some(l => selectedLevels.includes(l)))
        );

        return groups.filter(group => {
            // Check if any cards match this POS category
            return levelFilteredCards.some(card => {
                if (!card.pos) return false;

                if (advancedPosFilter) {
                    // Advanced mode: exact match
                    return card.pos.includes(group.id);
                } else {
                    // Simple mode: check if any card POS maps to this simple category
                    const mappedCodes = posMapping[group.id] || [group.id];
                    return card.pos.some(p => mappedCodes.includes(p));
                }
            });
        });
    }, [advancedPosFilter, advancedPosGroups, simplePosGroups, selectedLevels, allCards, posMapping]);

    const [queue, setQueue] = useState<Card[]>([]);
    const [idx, setIdx] = useState(0);
    const [tracingMode, setTracingMode] = useState(storedPrefs.tracingMode ?? false);
    const [showHoverIndicator, setShowHoverIndicator] = useState(storedPrefs.showHoverIndicator ?? false);
    const [mode, setMode] = useState<'flashcard' | 'sentence'>(storedPrefs.mode || 'flashcard');
    const [sentenceText, setSentenceText] = useState("");
    const [padSizeChoice, setPadSizeChoice] = useState<PadSizeChoice>(storedPrefs.padSizeChoice || "small");
    const [showDetailsDefault, setShowDetailsDefault] = useState<boolean>(storedPrefs.showDetailsDefault ?? false);
    const [traceFont, setTraceFont] = useState<TraceFontChoice>(storedPrefs.traceFont || "handwritten");
    const [promptFont, setPromptFont] = useState<PromptFontChoice>(storedPrefs.promptFont || "handwritten");
    const [reveal, setReveal] = useState(showDetailsDefault);

    // Initialize queue when filters change
    useEffect(() => {
        setQueue(pickDue(filteredCards, progress));
        setIdx(0);
        setReveal(showDetailsDefault);
    }, [filteredCards, progress, showDetailsDefault]);

    useEffect(() => {
        setReveal(showDetailsDefault);
    }, [showDetailsDefault]);

    // Theme application
    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const resolveTheme = () => theme === "system" ? (media.matches ? "dark" : "light") : theme;
        const finalTheme = resolveTheme();
        document.body.dataset.theme = finalTheme;
        localStorage.setItem("theme", theme);
        const listener = () => {
            if (theme === "system") {
                const next = resolveTheme();
                document.body.dataset.theme = next;
            }
        };
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [theme]);

    // Language application
    useEffect(() => {
        i18n.changeLanguage(language);
    }, [language, i18n]);

    // Persist user preferences
    useEffect(() => {
        const payload: Prefs = {
            selectedLevels,
            selectedPos,
            characterMode,
            leftHanded,
            tracingMode,
            showHoverIndicator,
            mode,
            language,
            padSizeChoice,
            showDetailsDefault,
            traceFont,
            promptFont,
            advancedPosFilter
        };
        localStorage.setItem("prefs.state", JSON.stringify(payload));
    }, [selectedLevels, selectedPos, characterMode, leftHanded, tracingMode, showHoverIndicator, mode, language, padSizeChoice, showDetailsDefault, traceFont, promptFont]);

    const basePadSize = padSizeChoice === "xs"
        ? 90
        : padSizeChoice === "small"
            ? 110
            : padSizeChoice === "large"
                ? 190
                : 150;

    const card = queue[idx % Math.max(queue.length, 1)];
    const remaining = queue.length;
    const displayHanzi = card ? (characterMode === 'traditional' ? (card.traditional || card.hanzi) : card.hanzi) : "";

    const advance = () => {
        setReveal(showDetailsDefault);
        setIdx(i => (i + 1) % queue.length);
    };

    const grade = (g: Grade) => {
        if (!card) return;

        const cur = ensureState(card.id, progress);
        const updated = nextState(cur, g);

        const nextMap = { ...progress, [card.id]: updated };
        setProgress(nextMap);
        saveProgress(nextMap);

        if (g === "again") {
            setQueue((q: Card[]) => {
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

    const getDrawerTitle = () => {
        switch (drawerView) {
            case 'menu': return t("app.menu");
            case 'help': return t("app.strokeGuide");
            case 'tips': return t("app.deviceTips");
            case 'pos-help': return t("app.posGuide");
        }
    };

    return (
        <div className="app">
            <div style={{ position: "fixed", bottom: 20, left: 20, zIndex: 100 }}>
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    aria-label={t("app.menu")}
                    style={{
                        background: "var(--surface-strong)",
                        border: "1px solid var(--border)",
                        borderRadius: "50%",
                        width: "48px",
                        height: "48px",
                        cursor: "pointer",
                        color: "var(--text)",
                        boxShadow: "var(--shadow-strong)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px"
                    }}
                >
                    ☰
                </button>
            </div>

            <Drawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title={getDrawerTitle()}
            >
                {drawerView === 'menu' && (
                    <DrawerMenu
                        mode={mode}
                        setMode={setMode}
                        leftHanded={leftHanded}
                        setLeftHanded={setLeftHanded}
                        levels={levels}
                        selectedLevels={selectedLevels}
                        toggleLevel={toggleLevel}
                        posGroups={posGroups}
                        selectedPos={selectedPos}
                        togglePos={togglePos}
                        advancedPosFilter={advancedPosFilter}
                        setAdvancedPosFilter={setAdvancedPosFilter}
                        tracingMode={tracingMode}
                        setTracingMode={setTracingMode}
                        showHoverIndicator={showHoverIndicator}
                        setShowHoverIndicator={setShowHoverIndicator}
                        showDetailsDefault={showDetailsDefault}
                        setShowDetailsDefault={setShowDetailsDefault}
                        padSizeChoice={padSizeChoice}
                        setPadSizeChoice={setPadSizeChoice}
                        traceFont={traceFont}
                        setTraceFont={setTraceFont}
                        promptFont={promptFont}
                        setPromptFont={setPromptFont}
                        characterMode={characterMode}
                        setCharacterMode={setCharacterMode}
                        language={language}
                        setLanguage={setLanguage}
                        theme={theme}
                        setTheme={setTheme}
                        filteredCardsCount={filteredCards.length}
                        onNavigate={setDrawerView}
                        onClose={() => setIsDrawerOpen(false)}
                    />
                )}
                {drawerView === 'help' && <DrawerHelp onBack={() => setDrawerView('menu')} />}
                {drawerView === 'tips' && <DrawerTips onBack={() => setDrawerView('menu')} />}
                {drawerView === 'pos-help' && <DrawerPosHelp onBack={() => setDrawerView('menu')} />}
            </Drawer>

            {mode === 'flashcard' ? (
                <div className="practice-container writing-first">
                    {card ? (
                        <>
                            <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", justifyContent: "space-between" }}>
                                <div style={{ flex: "1 1 320px", minWidth: 280, maxWidth: 640 }}>
                                    <Flashcard
                                        card={{
                                            ...card,
                                            hanzi: displayHanzi
                                        }}
                                        reveal={reveal}
                                        onToggleReveal={() => setReveal(r => !r)}
                                        promptFont={promptFont}
                                    />
                                </div>
                                <div style={{ flex: "0 0 auto", minWidth: 220 }}>
                                    <Toolbar onGrade={grade} onNext={advance} remaining={remaining} />
                                </div>
                            </div>

                            <div className="card" style={{ padding: 16 }}>
                                <PracticeArea
                                    text={displayHanzi}
                                    tracingMode={tracingMode}
                                    padSizeChoice={padSizeChoice}
                                    showHoverIndicator={showHoverIndicator}
                                    traceFont={traceFont}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="card" style={{ textAlign: "center", padding: 40, width: "100%" }}>
                            <h3>{t("nocards.title")}</h3>
                            <p>{t("nocards.desc")}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ maxWidth: 900, margin: "0 auto" }}>
                    <div className="card" style={{ marginBottom: 24 }}>
                        <input
                            value={sentenceText}
                            onChange={(e) => setSentenceText(e.target.value)}
                            placeholder={t("sentence.placeholder")}
                            style={{
                                width: "100%",
                                padding: 16,
                                fontSize: 20,
                                borderRadius: 8,
                                border: "2px solid var(--border)",
                                outline: "none",
                                background: "var(--surface)",
                                color: "var(--text)"
                            }}
                        />
                    </div>

                    {sentenceText.length === 0 ? (
                        <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>
                            {t("sentence.empty")}
                        </div>
                    ) : (
                        <PracticeArea
                            text={sentenceText}
                            tracingMode={tracingMode}
                            showHoverIndicator={showHoverIndicator}
                            padSizeChoice={padSizeChoice}
                            traceFont={traceFont}
                        />
                    )}
                </div>
            )}

            <footer className="footer">
            </footer>
        </div>
    );
}
