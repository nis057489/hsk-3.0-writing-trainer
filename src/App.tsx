import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DrawingPad } from "./components/DrawingPad";
import { Flashcard } from "./components/Flashcard";
import { Toolbar } from "./components/Toolbar";
import { Drawer } from "./components/Drawer";
import { PracticeArea } from "./components/PracticeArea";
import vocab from "./data/hsk.json";
import { Card, Grade } from "./lib/types";
import { ensureState, loadProgress, nextState, saveProgress } from "./lib/scheduler";

type ThemeChoice = "light" | "dark" | "contrast" | "system";

type PadSizeChoice = "xs" | "small" | "medium" | "large";

type TraceFontChoice = "handwritten" | "kai" | "system";

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
        traceFont: "handwritten"
    };

    const storedPrefs = readPrefs<Prefs>("prefs.state", prefDefaults);

    const [progress, setProgress] = useState(() => loadProgress());

    // Filters
    const [selectedLevels, setSelectedLevels] = useState<string[]>(storedPrefs.selectedLevels || ["new-1"]);
    const [selectedPos, setSelectedPos] = useState<string[]>(storedPrefs.selectedPos || []);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [characterMode, setCharacterMode] = useState<'simplified' | 'traditional'>(storedPrefs.characterMode || 'simplified');
    const [leftHanded, setLeftHanded] = useState(storedPrefs.leftHanded ?? true);
    const [drawerView, setDrawerView] = useState<'menu' | 'help' | 'tips'>('menu');
    const [theme, setTheme] = useState<ThemeChoice>(() => (localStorage.getItem("theme") as ThemeChoice) || "system");
    const [language, setLanguage] = useState<string>(storedPrefs.language || i18n.resolvedLanguage || "en");

    // Filtered pool
    const filteredCards = useMemo(() => {
        return allCards.filter(card => {
            const levelMatch = selectedLevels.length === 0 || (card.level && card.level.some(l => selectedLevels.includes(l)));
            const posMatch = selectedPos.length === 0 || (card.pos && card.pos.some(p => selectedPos.includes(p)));
            return levelMatch && posMatch;
        });
    }, [selectedLevels, selectedPos]);

    const levels = useMemo(() => ([
        { id: "new-1", label: t("levels.hsk1") },
        { id: "new-2", label: t("levels.hsk2") },
        { id: "new-3", label: t("levels.hsk3") },
        { id: "new-4", label: t("levels.hsk4") },
        { id: "new-5", label: t("levels.hsk5") },
        { id: "new-6", label: t("levels.hsk6") },
        { id: "new-7+", label: t("levels.hsk7") }
    ]), [t]);

    const posGroups = useMemo(() => ([
        { id: "n", label: t("pos.n") },
        { id: "v", label: t("pos.v") },
        { id: "a", label: t("pos.a") },
        { id: "d", label: t("pos.d") },
        { id: "r", label: t("pos.r") },
        { id: "c", label: t("pos.c") },
        { id: "i", label: t("pos.i") },
        { id: "l", label: t("pos.l") }
    ]), [t]);

    const [queue, setQueue] = useState<Card[]>([]);
    const [idx, setIdx] = useState(0);
    const [tracingMode, setTracingMode] = useState(storedPrefs.tracingMode ?? false);
    const [showHoverIndicator, setShowHoverIndicator] = useState(storedPrefs.showHoverIndicator ?? false);
    const [mode, setMode] = useState<'flashcard' | 'sentence'>(storedPrefs.mode || 'flashcard');
    const [sentenceText, setSentenceText] = useState("");
    const [padSizeChoice, setPadSizeChoice] = useState<PadSizeChoice>(storedPrefs.padSizeChoice || "small");
    const [showDetailsDefault, setShowDetailsDefault] = useState<boolean>(storedPrefs.showDetailsDefault ?? false);
    const [traceFont, setTraceFont] = useState<TraceFontChoice>(storedPrefs.traceFont || "handwritten");
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
            traceFont
        };
        localStorage.setItem("prefs.state", JSON.stringify(payload));
    }, [selectedLevels, selectedPos, characterMode, leftHanded, tracingMode, showHoverIndicator, mode, language, padSizeChoice, showDetailsDefault, traceFont]);

    const padSizeOptions: { value: PadSizeChoice; label: string }[] = [
        { value: "xs", label: t("options.padSizeXs") },
        { value: "small", label: t("options.padSizeSmall") },
        { value: "medium", label: t("options.padSizeMedium") },
        { value: "large", label: t("options.padSizeLarge") }
    ];

    const traceFontOptions: { value: TraceFontChoice; label: string }[] = [
        { value: "handwritten", label: t("options.traceFontHandwritten") },
        { value: "kai", label: t("options.traceFontKai") },
        { value: "system", label: t("options.traceFontSystem") }
    ];

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

    const themeOptions: { value: ThemeChoice; label: string }[] = [
        { value: "light", label: t("options.themeLight") },
        { value: "dark", label: t("options.themeDark") },
        { value: "contrast", label: t("options.themeContrast") },
        { value: "system", label: t("options.themeSystem") }
    ];

    const languageOptions = [
        { value: "en", label: "English" },
        { value: "zh", label: "中文" },
        { value: "zh-Hant", label: "繁體中文" },
        { value: "es", label: "Español" },
        { value: "fr", label: "Français" },
        { value: "vi", label: "Tiếng Việt" },
        { value: "fil", label: "Filipino" },
        { value: "ko", label: "한국어" },
        { value: "ar", label: "العربية" },
        { value: "ru", label: "Русский" },
        { value: "tr", label: "Türkçe" },
        { value: "hi", label: "हिन्दी" },
        { value: "fa", label: "فارسی" },
        { value: "pt", label: "Português" }
    ];

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
                title={drawerView === 'menu' ? t("app.menu") : drawerView === 'help' ? t("app.strokeGuide") : t("app.deviceTips")}
            >
                {drawerView === 'menu' ? (
                    <>
                        <div style={{ marginBottom: 24 }}>
                            <h2 style={{ margin: "0 0 8px 0", color: "var(--accent)", fontSize: 20 }}>{t("app.title")}</h2>
                            <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>{t("app.subtitle")}</p>
                        </div>

                        <div className="filter-section">
                            <h3>{t("mode.title")}</h3>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={() => { setMode('flashcard'); setIsDrawerOpen(false); }}
                                    aria-pressed={mode === 'flashcard'}
                                    style={{
                                        flex: 1,
                                        padding: "8px",
                                        borderRadius: "8px",
                                        border: "1px solid var(--border)",
                                        background: mode === 'flashcard' ? "var(--accent)" : "var(--surface-strong)",
                                        color: mode === 'flashcard' ? "var(--accent-contrast)" : "var(--muted)",
                                        cursor: "pointer",
                                        fontWeight: 700
                                    }}
                                >
                                    {t("mode.flashcard")}
                                </button>
                                <button
                                    onClick={() => { setMode('sentence'); setIsDrawerOpen(false); }}
                                    aria-pressed={mode === 'sentence'}
                                    style={{
                                        flex: 1,
                                        padding: "8px",
                                        borderRadius: "8px",
                                        border: "1px solid var(--border)",
                                        background: mode === 'sentence' ? "var(--accent)" : "var(--surface-strong)",
                                        color: mode === 'sentence' ? "var(--accent-contrast)" : "var(--muted)",
                                        cursor: "pointer",
                                        fontWeight: 700
                                    }}
                                >
                                    {t("mode.sentence")}
                                </button>
                            </div>
                        </div>

                        <div className="filter-section">
                            <h3>{t("layout.title")}</h3>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={leftHanded}
                                    onChange={(e) => setLeftHanded(e.target.checked)}
                                />
                                {t("layout.leftHanded")}
                            </label>
                        </div>

                        <div className="filter-section">
                            <h3>{t("levels.title")}</h3>
                            <div className="filter-group" role="list">
                                {levels.map(l => (
                                    <div
                                        key={l.id}
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={selectedLevels.includes(l.id)}
                                        className={`filter-chip ${selectedLevels.includes(l.id) ? 'active' : ''}`}
                                        onClick={() => toggleLevel(l.id)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleLevel(l.id); }}
                                    >
                                        {l.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="filter-section">
                            <h3>{t("pos.title")}</h3>
                            <div className="filter-group" role="list">
                                {posGroups.map(p => (
                                    <div
                                        key={p.id}
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={selectedPos.includes(p.id)}
                                        className={`filter-chip ${selectedPos.includes(p.id) ? 'active' : ''}`}
                                        onClick={() => togglePos(p.id)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') togglePos(p.id); }}
                                    >
                                        {p.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="filter-section">
                            <h3>{t("options.title")}</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={tracingMode}
                                        onChange={(e) => setTracingMode(e.target.checked)}
                                    />
                                    {t("options.tracing")}
                                </label>

                                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={showHoverIndicator}
                                        onChange={(e) => setShowHoverIndicator(e.target.checked)}
                                    />
                                    {t("options.hoverIndicator")}
                                </label>

                                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={showDetailsDefault}
                                        onChange={(e) => setShowDetailsDefault(e.target.checked)}
                                    />
                                    {t("options.showDetailsDefault")}
                                </label>

                                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                                    <span style={{ color: "var(--muted)" }}>{t("options.padSize")}</span>
                                    <select
                                        value={padSizeChoice}
                                        onChange={(e) => setPadSizeChoice(e.target.value as PadSizeChoice)}
                                        style={{
                                            padding: "8px 10px",
                                            borderRadius: 8,
                                            border: "1px solid var(--border)",
                                            background: "var(--surface)",
                                            color: "var(--text)",
                                            fontSize: 14
                                        }}
                                        aria-label={t("options.padSize")}
                                    >
                                        {padSizeOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                                    <span style={{ color: "var(--muted)" }}>{t("options.traceFont")}</span>
                                    <select
                                        value={traceFont}
                                        onChange={(e) => setTraceFont(e.target.value as TraceFontChoice)}
                                        style={{
                                            padding: "8px 10px",
                                            borderRadius: 8,
                                            border: "1px solid var(--border)",
                                            background: "var(--surface)",
                                            color: "var(--text)",
                                            fontSize: 14
                                        }}
                                        aria-label={t("options.traceFont")}
                                    >
                                        {traceFontOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <div style={{ display: "flex", gap: 8, background: "var(--surface-strong)", padding: 4, borderRadius: 8, border: "1px solid var(--border)" }}>
                                    <button
                                        onClick={() => setCharacterMode('simplified')}
                                        aria-pressed={characterMode === 'simplified'}
                                        style={{
                                            flex: 1,
                                            border: "none",
                                            background: characterMode === 'simplified' ? "var(--surface)" : "transparent",
                                            boxShadow: characterMode === 'simplified' ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                            borderRadius: 6,
                                            padding: "6px 0",
                                            fontSize: 13,
                                            cursor: "pointer",
                                            fontWeight: characterMode === 'simplified' ? "bold" : "normal",
                                            color: characterMode === 'simplified' ? "var(--accent)" : "var(--text)"
                                        }}
                                    >
                                        {t("options.simplified")}
                                    </button>
                                    <button
                                        onClick={() => setCharacterMode('traditional')}
                                        aria-pressed={characterMode === 'traditional'}
                                        style={{
                                            flex: 1,
                                            border: "none",
                                            background: characterMode === 'traditional' ? "var(--surface)" : "transparent",
                                            boxShadow: characterMode === 'traditional' ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                            borderRadius: 6,
                                            padding: "6px 0",
                                            fontSize: 13,
                                            cursor: "pointer",
                                            fontWeight: characterMode === 'traditional' ? "bold" : "normal",
                                            color: characterMode === 'traditional' ? "var(--accent)" : "var(--text)"
                                        }}
                                    >
                                        {t("options.traditional")}
                                    </button>
                                </div>

                                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                                    <span style={{ color: "var(--muted)" }}>{t("options.language")}</span>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        style={{
                                            padding: "8px 10px",
                                            borderRadius: 8,
                                            border: "1px solid var(--border)",
                                            background: "var(--surface)",
                                            color: "var(--text)",
                                            fontSize: 14
                                        }}
                                        aria-label={t("options.language")}
                                    >
                                        {languageOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                                    <span style={{ color: "var(--muted)" }}>{t("options.theme")}</span>
                                    <select
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value as ThemeChoice)}
                                        style={{
                                            padding: "8px 10px",
                                            borderRadius: 8,
                                            border: "1px solid var(--border)",
                                            background: "var(--surface)",
                                            color: "var(--text)",
                                            fontSize: 14
                                        }}
                                        aria-label={t("options.theme")}
                                    >
                                        {themeOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </div>

                        <div className="filter-section">
                            <h3>{t("help.title")}</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <button
                                    onClick={() => setDrawerView('help')}
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid var(--border)",
                                        background: "var(--surface)",
                                        color: "var(--text)",
                                        cursor: "pointer",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        fontSize: "14px"
                                    }}
                                >
                                    <span>{t("help.stroke")}</span>
                                    <span>→</span>
                                </button>
                                <button
                                    onClick={() => setDrawerView('tips')}
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid var(--border)",
                                        background: "var(--surface)",
                                        color: "var(--text)",
                                        cursor: "pointer",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        fontSize: "14px"
                                    }}
                                >
                                    <span>{t("help.tips")}</span>
                                    <span>→</span>
                                </button>
                            </div>
                        </div>

                        <div style={{ marginTop: 24, fontSize: 13, color: "var(--muted)" }}>
                            {t("stats.available", { count: filteredCards.length })}
                        </div>
                    </>
                ) : drawerView === 'help' ? (
                    <div>
                        <button
                            onClick={() => setDrawerView('menu')}
                            style={{
                                background: "none",
                                border: "none",
                                padding: "0 0 16px 0",
                                color: "var(--muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px"
                            }}
                        >
                            ← {t("app.back")}
                        </button>

                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            <section>
                                <h3 style={{ margin: "0 0 8px 0", color: "var(--accent)" }}>{t("help.generalRules")}</h3>
                                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--text)" }}>
                                    {t("app.subtitle")}
                                </p>
                            </section>

                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                <section key={n}>
                                    <h4 style={{ margin: "0 0 8px 0", fontSize: 15 }}>{n}. {t(`help.rule${n}` as const)}</h4>
                                    <div style={{ background: "var(--surface-strong)", padding: 12, borderRadius: 8, fontSize: 14, border: "1px solid var(--border)" }}>
                                        {t(`help.rule${n}Desc` as const)}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <button
                            onClick={() => setDrawerView('menu')}
                            style={{
                                background: "none",
                                border: "none",
                                padding: "0 0 16px 0",
                                color: "var(--muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px"
                            }}
                        >
                            ← {t("app.back")}
                        </button>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <h3 style={{ margin: 0, color: "var(--accent)" }}>{t("help.deviceTitle")}</h3>
                            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, color: "var(--text)" }}>
                                <li>{t("help.tip1")}</li>
                                <li>{t("help.tip2")}</li>
                                <li>{t("help.tip3")}</li>
                                <li>{t("help.tip4")}</li>
                            </ul>
                        </div>
                    </div>
                )}
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
