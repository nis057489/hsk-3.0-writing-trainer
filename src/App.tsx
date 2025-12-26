import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
import { DrawerLicenses } from "./components/drawer/DrawerLicenses";
import vocab from "./data/hsk.json";
import { Card, CardState, Grade } from "./lib/types";
import { ensureState, loadProgress, nextState, saveProgress } from "./lib/scheduler";

// Map detailed POS codes to simple categories (module-level to avoid recreating each render)
const POS_MAPPING: Record<string, string[]> = {
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
    "z": ["z"],
};

// Reverse mapping for simple POS mode.
// Example: "nz" -> "n" so we can compute availability in one pass.
const DETAILED_TO_SIMPLE_POS: Record<string, string> = (() => {
    const out: Record<string, string> = {};
    for (const simple of Object.keys(POS_MAPPING)) {
        for (const detailed of POS_MAPPING[simple] ?? []) {
            out[detailed] = simple;
        }
    }
    return out;
})();

type ThemeChoice = "light" | "dark" | "contrast" | "system";

type PadSizeChoice = "xs" | "small" | "medium" | "large";

type TraceFontChoice = "handwritten" | "kai" | "yshi" | "system";
type PromptFontChoice = "handwritten" | "kai" | "yshi" | "system";
type GridStyleChoice = "rice" | "field" | "none";

type Prefs = {
    selectedLevels: string[];
    selectedPos: string[];
    characterMode: 'simplified' | 'traditional';
    leftHanded: boolean;
    tracingMode: boolean;
    mode: 'flashcard' | 'sentence';
    randomizeNext: boolean;
    reviewGrades: Grade[];
    includeNewCards: boolean;
    language: string;
    showHoverIndicator: boolean;
    padSizeChoice: PadSizeChoice;
    showDetailsDefault: boolean;
    traceFont: TraceFontChoice;
    promptFont: PromptFontChoice;
    advancedPosFilter: boolean;
    gridStyle: GridStyleChoice;
    gridVerticalShift: boolean;
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

    // Prevent pinch-to-zoom / gesture zoom (iOS Safari / PWA). Keep this minimal and global
    // so the UI doesn't unexpectedly zoom while practicing.
    useEffect(() => {
        const blockGesture = (e: Event) => {
            e.preventDefault();
        };

        const blockMultiTouch = (e: TouchEvent) => {
            if (e.touches.length > 1) e.preventDefault();
        };

        // iOS Safari gesture events
        window.addEventListener("gesturestart", blockGesture as any, { passive: false } as any);
        window.addEventListener("gesturechange", blockGesture as any, { passive: false } as any);
        window.addEventListener("gestureend", blockGesture as any, { passive: false } as any);

        // Multi-touch (pinch) usually begins with touchstart/touchmove
        document.addEventListener("touchstart", blockMultiTouch, { passive: false });
        document.addEventListener("touchmove", blockMultiTouch, { passive: false });

        return () => {
            window.removeEventListener("gesturestart", blockGesture as any);
            window.removeEventListener("gesturechange", blockGesture as any);
            window.removeEventListener("gestureend", blockGesture as any);
            document.removeEventListener("touchstart", blockMultiTouch);
            document.removeEventListener("touchmove", blockMultiTouch);
        };
    }, []);

    // Optional, data-driven performance logging. Enable via ?perf=1.
    // This is intentionally off by default to avoid adding background work.
    useEffect(() => {
        const enabled = (() => {
            try {
                const params = new URLSearchParams(window.location.search);
                return params.get("perf") === "1";
            } catch {
                return false;
            }
        })();
        if (!enabled) return;

        let longTaskCount = 0;
        let observer: PerformanceObserver | null = null;

        if (typeof PerformanceObserver !== "undefined") {
            try {
                observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        // longtask duration is in ms
                        if (entry.duration >= 50) longTaskCount++;
                    }
                });
                // @ts-ignore - longtask is supported in most modern browsers; harmless if unsupported.
                observer.observe({ entryTypes: ["longtask"] });
            } catch {
                observer = null;
            }
        }

        const id = window.setInterval(() => {
            // Keep the output tiny so it doesn't flood logs.
            // If this stays non-zero while idle, we still have background work.
            // eslint-disable-next-line no-console
            console.log(`[perf] longtasks>=50ms in last 5s: ${longTaskCount}`);
            longTaskCount = 0;
        }, 5000);

        // eslint-disable-next-line no-console
        console.log("[perf] enabled (?perf=1)");

        return () => {
            window.clearInterval(id);
            observer?.disconnect();
        };
    }, []);

    const prefDefaults: Prefs = {
        selectedLevels: ["new-1"],
        selectedPos: [],
        characterMode: 'simplified',
        leftHanded: false,
        tracingMode: false,
        mode: 'flashcard',
        randomizeNext: false,
        reviewGrades: [],
        includeNewCards: false,
        language: i18n.resolvedLanguage || "en",
        showHoverIndicator: false,
        padSizeChoice: "small",
        showDetailsDefault: false,
        traceFont: "system",
        promptFont: "system",
        advancedPosFilter: false,
        gridStyle: "rice",
        gridVerticalShift: false
    };

    const storedPrefsRaw = readPrefs<Prefs>("prefs.state", prefDefaults);

    // Migrate old/invalid font choices (e.g. removed "cursive") to a supported value.
    const normalizeFontChoice = (v: any): TraceFontChoice => {
        switch (v) {
            case "handwritten":
            case "kai":
            case "yshi":
            case "system":
                return v;
            case "cursive":
                return "handwritten";
            default:
                return "system";
        }
    };

    const storedPrefs: Prefs = {
        ...storedPrefsRaw,
        traceFont: normalizeFontChoice((storedPrefsRaw as any).traceFont),
        promptFont: normalizeFontChoice((storedPrefsRaw as any).promptFont)
    };

    // Keep progress in a ref to avoid forcing global re-renders on each grade.
    // We only trigger recomputation when a UI feature actually depends on progress.
    const progressRef = useRef<Record<string, CardState>>(loadProgress());
    const [progressVersion, setProgressVersion] = useState(0);

    // Filters
    const [selectedLevels, setSelectedLevels] = useState<string[]>(storedPrefs.selectedLevels || ["new-1"]);
    const [selectedPos, setSelectedPos] = useState<string[]>(storedPrefs.selectedPos || []);
    const [advancedPosFilter, setAdvancedPosFilter] = useState<boolean>(storedPrefs.advancedPosFilter ?? false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [characterMode, setCharacterMode] = useState<'simplified' | 'traditional'>(storedPrefs.characterMode || 'simplified');
    const [leftHanded, setLeftHanded] = useState(storedPrefs.leftHanded ?? true);
    const [drawerView, setDrawerView] = useState<'menu' | 'help' | 'tips' | 'pos-help' | 'licenses'>('menu');
    const [theme, setTheme] = useState<ThemeChoice>(() => (localStorage.getItem("theme") as ThemeChoice) || "system");
    const [language, setLanguage] = useState<string>(storedPrefs.language || i18n.resolvedLanguage || "en");

    // Flashcard filtering by last review result (Anki-like grades)
    const [reviewGrades, setReviewGrades] = useState<Grade[]>(storedPrefs.reviewGrades || []);
    const [includeNewCards, setIncludeNewCards] = useState<boolean>(storedPrefs.includeNewCards ?? false);

    const reviewFilteringActive = reviewGrades.length > 0;

    const selectedLevelsSet = useMemo(() => new Set(selectedLevels), [selectedLevels]);
    const selectedPosSet = useMemo(() => new Set(selectedPos), [selectedPos]);
    const reviewGradesSet = useMemo(() => new Set(reviewGrades), [reviewGrades]);

    const levelFilteredCards = useMemo(() => {
        if (selectedLevels.length === 0) return allCards;
        return allCards.filter((card) =>
            !!card.level && card.level.some((l) => selectedLevelsSet.has(l))
        );
    }, [selectedLevels.length, selectedLevelsSet]);

    // In simple POS mode, build a set of allowed detailed tags (union of the selected categories).
    const allowedDetailedPosSet = useMemo(() => {
        if (selectedPos.length === 0) return null;
        if (advancedPosFilter) return null;
        const set = new Set<string>();
        for (const simple of selectedPos) {
            const mapped = POS_MAPPING[simple] || [simple];
            for (const detailed of mapped) set.add(detailed);
        }
        return set;
    }, [selectedPos, advancedPosFilter]);

    // Filtered pool
    const filteredCards = useMemo(() => {
        const progressMap = progressRef.current;

        return levelFilteredCards.filter((card) => {
            // POS filtering with simple/advanced mode
            let posMatch = true;
            if (selectedPos.length > 0 && card.pos) {
                if (advancedPosFilter) {
                    posMatch = card.pos.some((p) => selectedPosSet.has(p));
                } else if (allowedDetailedPosSet) {
                    posMatch = card.pos.some((p) => allowedDetailedPosSet.has(p));
                }
            }

            let reviewMatch = true;
            if (reviewFilteringActive) {
                const state = ensureState(card.id, progressMap);
                const isNew = !state.lastGrade;
                reviewMatch =
                    (includeNewCards && isNew) ||
                    (!!state.lastGrade && reviewGradesSet.has(state.lastGrade));
            }

            return posMatch && reviewMatch;
        });
    }, [
        levelFilteredCards,
        selectedPos.length,
        advancedPosFilter,
        selectedPosSet,
        allowedDetailedPosSet,
        reviewFilteringActive,
        includeNewCards,
        reviewGradesSet,
        progressVersion
    ]);

    const levels = useMemo(() => ([
        { id: "radical", label: t("levels.radical") },
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
    // (one pass over levelFilteredCards instead of nested some() loops)
    const availablePosSet = useMemo(() => {
        const set = new Set<string>();
        for (const card of levelFilteredCards) {
            if (!card.pos) continue;
            for (const tag of card.pos) {
                if (advancedPosFilter) {
                    set.add(tag);
                } else {
                    set.add(DETAILED_TO_SIMPLE_POS[tag] || tag);
                }
            }
        }
        return set;
    }, [levelFilteredCards, advancedPosFilter]);

    const posGroups = useMemo(() => {
        const groups = advancedPosFilter ? advancedPosGroups : simplePosGroups;
        return groups.filter((g: { id: string }) => availablePosSet.has(g.id));
    }, [advancedPosFilter, advancedPosGroups, simplePosGroups, availablePosSet]);

    const [queue, setQueue] = useState<Card[]>([]);
    const [idx, setIdx] = useState(0);
    const [tracingMode, setTracingMode] = useState(storedPrefs.tracingMode ?? false);
    const [showHoverIndicator, setShowHoverIndicator] = useState(storedPrefs.showHoverIndicator ?? false);
    const [mode, setMode] = useState<'flashcard' | 'sentence'>(storedPrefs.mode || 'flashcard');
    const [randomizeNext, setRandomizeNext] = useState<boolean>(storedPrefs.randomizeNext ?? false);
    const [sentenceText, setSentenceText] = useState("");
    const [padSizeChoice, setPadSizeChoice] = useState<PadSizeChoice>(storedPrefs.padSizeChoice || "small");
    const [showDetailsDefault, setShowDetailsDefault] = useState<boolean>(storedPrefs.showDetailsDefault ?? false);
    const [traceFont, setTraceFont] = useState<TraceFontChoice>(storedPrefs.traceFont || "handwritten");
    const [promptFont, setPromptFont] = useState<PromptFontChoice>(storedPrefs.promptFont || "handwritten");
    const normalizeGridStyle = (value: string | undefined): GridStyleChoice => {
        if (value === "field" || value === "rice" || value === "none") return value;
        if (value === "cross") return "field";
        return "rice";
    };

    const [gridStyle, setGridStyle] = useState<GridStyleChoice>(normalizeGridStyle(storedPrefs.gridStyle));
    const [gridVerticalShift, setGridVerticalShift] = useState<boolean>(storedPrefs.gridVerticalShift ?? false);
    const [reveal, setReveal] = useState(showDetailsDefault);

    // Initialize queue when filters change
    useEffect(() => {
        setQueue(pickDue(filteredCards, progressRef.current));
        setIdx(0);
        setReveal(showDetailsDefault);
    }, [filteredCards, showDetailsDefault]);

    // If the session queue is exhausted, refill it from the currently filtered pool.
    // This keeps the behavior Anki-like within a session, while still allowing continued practice.
    useEffect(() => {
        if (mode !== 'flashcard') return;
        if (queue.length !== 0) return;
        if (filteredCards.length === 0) return;
        setQueue(pickDue(filteredCards, progressRef.current));
        setIdx(0);
        setReveal(showDetailsDefault);
    }, [mode, queue.length, filteredCards, showDetailsDefault]);

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
            randomizeNext,
            reviewGrades,
            includeNewCards,
            language,
            padSizeChoice,
            showDetailsDefault,
            traceFont,
            promptFont,
            advancedPosFilter,
            gridStyle,
            gridVerticalShift
        };
        localStorage.setItem("prefs.state", JSON.stringify(payload));
    }, [selectedLevels, selectedPos, characterMode, leftHanded, tracingMode, showHoverIndicator, mode, randomizeNext, reviewGrades, includeNewCards, language, padSizeChoice, showDetailsDefault, traceFont, promptFont, gridStyle, gridVerticalShift]);

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

    const pickRandomIndex = (len: number, avoid: number) => {
        if (len <= 1) return 0;
        const base = Math.floor(Math.random() * len);
        return base === avoid ? (base + 1) % len : base;
    };

    const advance = useCallback(() => {
        setReveal(showDetailsDefault);
        setIdx((i: number) => (i + 1) % queue.length);
    }, [queue.length, showDetailsDefault]);

    const advanceRandom = useCallback(() => {
        setReveal(showDetailsDefault);
        setIdx((i: number) => pickRandomIndex(queue.length, i % Math.max(queue.length, 1)));
    }, [queue.length, showDetailsDefault]);

    const advanceNext = useCallback(() => {
        if (randomizeNext) {
            advanceRandom();
        } else {
            advance();
        }
    }, [randomizeNext, advanceRandom, advance]);

    const grade = useCallback((g: Grade) => {
        if (!card) return;

        const cur = ensureState(card.id, progressRef.current);
        const updated = nextState(cur, g);

        // Mutate the progress map in-place to avoid allocating/copying on every grade.
        const map = progressRef.current;
        map[card.id] = updated;
        saveProgress(map);

        // Only trigger a global recompute when the active filters depend on progress.
        if (reviewFilteringActive) setProgressVersion((v) => v + 1);

        setReveal(showDetailsDefault);

        if (g === "again") {
            setQueue((q: Card[]) => {
                if (q.length <= 1) {
                    setIdx(0);
                    return q;
                }

                const currentIndex = idx % q.length;
                const copy = q.slice();
                const [removed] = copy.splice(currentIndex, 1);
                const insertAt = Math.min(copy.length, currentIndex + 3);
                copy.splice(insertAt, 0, removed);

                if (randomizeNext) {
                    setIdx(() => pickRandomIndex(copy.length, Math.min(currentIndex, copy.length - 1)));
                } else {
                    // Keep the next card in the same visual position.
                    setIdx(() => Math.min(currentIndex, copy.length - 1));
                }

                return copy;
            });
            return;
        }

        // hard/good/easy: card is scheduled into the future, so remove it from the current session queue.
        setQueue((q: Card[]) => {
            if (q.length === 0) return q;

            const currentIndex = idx % q.length;
            const copy = q.slice();
            copy.splice(currentIndex, 1);

            if (copy.length === 0) {
                setIdx(0);
            } else if (randomizeNext) {
                setIdx(() => pickRandomIndex(copy.length, Math.min(currentIndex, copy.length - 1)));
            } else {
                setIdx(() => Math.min(currentIndex, copy.length - 1));
            }

            return copy;
        });
    }, [card, idx, randomizeNext, showDetailsDefault, reviewFilteringActive]);

    const toggleLevel = (id: string) => {
        setSelectedLevels((prev: string[]) =>
            prev.includes(id) ? prev.filter((l: string) => l !== id) : [...prev, id]
        );
    };

    const togglePos = (id: string) => {
        setSelectedPos((prev: string[]) =>
            prev.includes(id) ? prev.filter((p: string) => p !== id) : [...prev, id]
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
        <div className={`app ${mode === 'flashcard' ? 'app--noscroll' : 'app--scroll'}`}>
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
                        randomizeNext={randomizeNext}
                        setRandomizeNext={setRandomizeNext}
                        reviewGrades={reviewGrades}
                        setReviewGrades={setReviewGrades}
                        includeNewCards={includeNewCards}
                        setIncludeNewCards={setIncludeNewCards}
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
                        gridStyle={gridStyle}
                        setGridStyle={setGridStyle}
                        gridVerticalShift={gridVerticalShift}
                        setGridVerticalShift={setGridVerticalShift}
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
                {drawerView === 'licenses' && <DrawerLicenses onBack={() => setDrawerView('menu')} />}
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
                                        onToggleReveal={() => setReveal((r: boolean) => !r)}
                                        promptFont={promptFont}
                                    />
                                </div>
                                <div style={{ flex: "0 0 auto", minWidth: 220 }}>
                                    <Toolbar onGrade={grade} onNext={advanceNext} remaining={remaining} />
                                </div>
                            </div>

                            <div className="card" style={{ padding: 16 }}>
                                <PracticeArea
                                    text={displayHanzi}
                                    tracingMode={tracingMode}
                                    padSizeChoice={padSizeChoice}
                                    showHoverIndicator={showHoverIndicator}
                                    traceFont={traceFont}
                                    gridStyle={gridStyle}
                                    gridVerticalShift={gridVerticalShift}
                                    alignRight={leftHanded}
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setSentenceText(e.target.value)
                            }
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
                            gridStyle={gridStyle}
                            gridVerticalShift={gridVerticalShift}
                            alignRight={leftHanded}
                        />
                    )}
                </div>
            )}

        </div>
    );
}
