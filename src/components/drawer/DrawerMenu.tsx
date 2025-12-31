import { useTranslation } from "react-i18next";
import { Grade } from "../../lib/types";
import { setMeaningTranslationsOptIn } from "../../lib/meaningTranslations";

type ThemeChoice = "light" | "dark" | "contrast" | "system";
type PadSizeChoice = "xs" | "small" | "medium" | "large";
type TraceFontChoice = "handwritten" | "kai" | "yshi" | "system";
type PromptFontChoice = "handwritten" | "kai" | "yshi" | "system";
type GridStyleChoice = "rice" | "field" | "none";
type BrushType = "pencil" | "fountain" | "brush";

interface DrawerMenuProps {
    mode: 'flashcard' | 'sentence';
    setMode: (mode: 'flashcard' | 'sentence') => void;
    randomizeNext: boolean;
    setRandomizeNext: (value: boolean) => void;
    orderByFrequency: boolean;
    setOrderByFrequency: (value: boolean) => void;
    reviewGrades: Grade[];
    setReviewGrades: (value: Grade[]) => void;
    includeNewCards: boolean;
    setIncludeNewCards: (value: boolean) => void;
    leftHanded: boolean;
    setLeftHanded: (value: boolean) => void;
    levels: Array<{ id: string; label: string }>;
    selectedLevels: string[];
    toggleLevel: (id: string) => void;
    posGroups: Array<{ id: string; label: string }>;
    selectedPos: string[];
    togglePos: (id: string) => void;
    advancedPosFilter: boolean;
    setAdvancedPosFilter: (value: boolean) => void;
    tracingMode: boolean;
    setTracingMode: (value: boolean) => void;
    showHoverIndicator: boolean;
    setShowHoverIndicator: (value: boolean) => void;
    showDetailsDefault: boolean;
    setShowDetailsDefault: (value: boolean) => void;
    padSizeChoice: PadSizeChoice;
    setPadSizeChoice: (value: PadSizeChoice) => void;
    traceFont: TraceFontChoice;
    setTraceFont: (value: TraceFontChoice) => void;
    promptFont: PromptFontChoice;
    setPromptFont: (value: PromptFontChoice) => void;
    gridStyle: GridStyleChoice;
    setGridStyle: (value: GridStyleChoice) => void;
    gridVerticalShift: boolean;
    setGridVerticalShift: (value: boolean) => void;
    brushType: BrushType;
    setBrushType: (value: BrushType) => void;
    strokeColor: string;
    setStrokeColor: (value: string) => void;
    characterMode: 'simplified' | 'traditional';
    setCharacterMode: (value: 'simplified' | 'traditional') => void;
    language: string;
    setLanguage: (value: string) => void;
    theme: ThemeChoice;
    setTheme: (value: ThemeChoice) => void;
    subsetDrillingEnabled: boolean;
    setSubsetDrillingEnabled: (value: boolean) => void;
    subsetDrillingCount: number;
    setSubsetDrillingCount: (value: number) => void;
    filteredCardsCount: number;
    onNavigate: (view: 'help' | 'tips' | 'pos-help' | 'licenses') => void;
    onClose: () => void;
}

export function DrawerMenu(props: DrawerMenuProps) {
    const { t } = useTranslation();

    const toggleGrade = (g: Grade) => {
        if (props.reviewGrades.includes(g)) {
            props.setReviewGrades(props.reviewGrades.filter(x => x !== g));
        } else {
            props.setReviewGrades([...props.reviewGrades, g]);
        }
    };

    const padSizeOptions: { value: PadSizeChoice; label: string }[] = [
        { value: "xs", label: t("options.padSizeXs") },
        { value: "small", label: t("options.padSizeSmall") },
        { value: "medium", label: t("options.padSizeMedium") },
        { value: "large", label: t("options.padSizeLarge") }
    ];

    const brushOptions: { value: BrushType; label: string }[] = [
        { value: "pencil", label: t("options.brushPencil") },
        { value: "fountain", label: t("options.brushFountain") },
        { value: "brush", label: t("options.brushCalligraphy") }
    ];

    const traceFontOptions: { value: TraceFontChoice; label: string }[] = [
        { value: "handwritten", label: t("options.traceFontHandwritten") },
        { value: "kai", label: t("options.traceFontKai") },
        { value: "yshi", label: t("options.traceFontYShi") },
        { value: "system", label: t("options.traceFontSystem") }
    ];

    const promptFontOptions: { value: PromptFontChoice; label: string }[] = [
        { value: "handwritten", label: t("options.traceFontHandwritten") },
        { value: "kai", label: t("options.traceFontKai") },
        { value: "yshi", label: t("options.traceFontYShi") },
        { value: "system", label: t("options.traceFontSystem") }
    ];

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
        { value: "pt", label: "Português" },
        { value: "de", label: "Deutsch" },
        { value: "it", label: "Italiano" },
        { value: "ja", label: "日本語" },
        { value: "id", label: "Bahasa Indonesia" },
        { value: "ms", label: "Bahasa Melayu" },
        { value: "th", label: "ไทย" },
        { value: "nl", label: "Nederlands" },
        { value: "pl", label: "Polski" },
        { value: "uk", label: "Українська" },
        { value: "sv", label: "Svenska" },
        { value: "he", label: "עברית" },
        { value: "bn", label: "বাংলা" },
        { value: "ur", label: "اردو" },
        { value: "ug", label: "ئۇيغۇرچە" },
        { value: "mn", label: "Монгол" },
        { value: "bo", label: "བོད་ཡིག" }
    ];

    return (
        <>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: "0 0 8px 0", color: "var(--accent)", fontSize: 20, display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" style={{ width: 32, height: 32 }} />
                    {t("app.title")}
                </h2>
                <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>{t("app.subtitle")}</p>
            </div>

            <div className="filter-section">
                <h3>{t("mode.title")}</h3>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => { props.setMode('flashcard'); props.onClose(); }}
                        aria-pressed={props.mode === 'flashcard'}
                        style={{
                            flex: 1,
                            padding: "8px",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            background: props.mode === 'flashcard' ? "var(--accent)" : "var(--surface-strong)",
                            color: props.mode === 'flashcard' ? "var(--accent-contrast)" : "var(--muted)",
                            cursor: "pointer",
                            fontWeight: 700
                        }}
                    >
                        {t("mode.flashcard")}
                    </button>
                    <button
                        onClick={() => { props.setMode('sentence'); props.onClose(); }}
                        aria-pressed={props.mode === 'sentence'}
                        style={{
                            flex: 1,
                            padding: "8px",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            background: props.mode === 'sentence' ? "var(--accent)" : "var(--surface-strong)",
                            color: props.mode === 'sentence' ? "var(--accent-contrast)" : "var(--muted)",
                            cursor: "pointer",
                            fontWeight: 700
                        }}
                    >
                        {t("mode.sentence")}
                    </button>
                </div>
            </div>

            <div className="filter-section">

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={props.subsetDrillingEnabled}
                        onChange={(e) => props.setSubsetDrillingEnabled(e.target.checked)}
                    />
                    {t("options.subsetDrilling")}
                </label>

                {props.subsetDrillingEnabled && (
                    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, paddingLeft: 28 }}>
                        <span style={{ color: "var(--muted)" }}>{t("options.subsetDrillingCount")}</span>
                        <input
                            type="number"
                            value={props.subsetDrillingCount}
                            onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                props.setSubsetDrillingCount(val);
                            }}
                            min="1"
                            max="999"
                            style={{
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "1px solid var(--border)",
                                background: "var(--surface)",
                                color: "var(--text)",
                                fontSize: 14
                            }}
                            aria-label={t("options.subsetDrillingCount")}
                        />
                    </label>
                )}
            </div>

            <div className="filter-section">
                <h3>{t("levels.title")}</h3>
                <div className="filter-group" role="list">
                    {props.levels.map(l => (
                        <div
                            key={l.id}
                            role="button"
                            tabIndex={0}
                            aria-pressed={props.selectedLevels.includes(l.id)}
                            className={`filter-chip ${props.selectedLevels.includes(l.id) ? 'active' : ''}`}
                            onClick={() => props.toggleLevel(l.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') props.toggleLevel(l.id); }}
                        >
                            {l.label}
                        </div>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <h3>{t("pos.title")}</h3>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", marginBottom: 12 }}>
                    <input
                        type="checkbox"
                        checked={props.advancedPosFilter}
                        onChange={(e) => props.setAdvancedPosFilter(e.target.checked)}
                    />
                    {t("options.advancedPosFilter")}
                </label>
                <div className="filter-group" role="list">
                    {props.posGroups.map(p => (
                        <div
                            key={p.id}
                            role="button"
                            tabIndex={0}
                            aria-pressed={props.selectedPos.includes(p.id)}
                            className={`filter-chip ${props.selectedPos.includes(p.id) ? 'active' : ''}`}
                            onClick={() => props.togglePos(p.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') props.togglePos(p.id); }}
                        >
                            {p.label}
                        </div>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <h3>{t("options.reviewGrades")}</h3>
                <div className="filter-group" role="list">
                    <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={props.includeNewCards}
                        className={`filter-chip ${props.includeNewCards ? 'active' : ''}`}
                        onClick={() => props.setIncludeNewCards(!props.includeNewCards)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') props.setIncludeNewCards(!props.includeNewCards); }}
                    >
                        {t("options.includeNewCards")}
                    </div>
                    {(["again", "hard", "good", "easy"] as Grade[]).map(g => (
                        <div
                            key={g}
                            role="button"
                            tabIndex={0}
                            aria-pressed={props.reviewGrades.includes(g)}
                            className={`filter-chip ${props.reviewGrades.includes(g) ? 'active' : ''}`}
                            onClick={() => toggleGrade(g)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleGrade(g); }}
                        >
                            {t(`toolbar.${g}`)}
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
                            checked={props.randomizeNext}
                            onChange={(e) => props.setRandomizeNext(e.target.checked)}
                        />
                        {t("options.randomizeNext")}
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={props.orderByFrequency}
                            onChange={(e) => props.setOrderByFrequency(e.target.checked)}
                        />
                        {t("options.orderByFrequency")}
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={props.tracingMode}
                            onChange={(e) => props.setTracingMode(e.target.checked)}
                        />
                        {t("options.tracing")}
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={props.showHoverIndicator}
                            onChange={(e) => props.setShowHoverIndicator(e.target.checked)}
                        />
                        {t("options.hoverIndicator")}
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={props.showDetailsDefault}
                            onChange={(e) => props.setShowDetailsDefault(e.target.checked)}
                        />
                        {t("options.showDetailsDefault")}
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                        <span style={{ color: "var(--muted)" }}>{t("options.brushType")}</span>
                        <select
                            value={props.brushType}
                            onChange={(e) => props.setBrushType(e.target.value as BrushType)}
                            style={{
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "1px solid var(--border)",
                                background: "var(--surface)",
                                color: "var(--text)",
                                fontSize: 14
                            }}
                            aria-label={t("options.brushType")}
                        >
                            {brushOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                        <span style={{ color: "var(--muted)" }}>{t("options.strokeColor")}</span>
                        <div className="color-picker" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            {[
                                { color: "#161718", label: t("colors.ink") },
                                { color: "#A63D40", label: t("colors.maroon") },
                                { color: "#2B7A41", label: t("colors.jade") },
                                { color: "#446CCF", label: t("colors.hanBlue") }
                            ].map(c => (
                                <button
                                    key={c.color}
                                    onClick={() => props.setStrokeColor(c.color)}
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: "50%",
                                        backgroundColor: c.color,
                                        border: props.strokeColor === c.color ? "2px solid var(--text)" : "1px solid var(--border)",
                                        cursor: "pointer",
                                        padding: 0,
                                        boxShadow: props.strokeColor === c.color ? "0 0 0 2px var(--surface)" : "none",
                                        transition: "transform 0.1s"
                                    }}
                                    title={c.label}
                                    aria-label={c.label}
                                />
                            ))}
                            <div style={{ position: "relative", width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: "1px solid var(--border)", cursor: "pointer" }} title={t("colors.custom")}>
                                <input
                                    type="color"
                                    value={props.strokeColor}
                                    onChange={(e) => props.setStrokeColor(e.target.value)}
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        width: "150%",
                                        height: "150%",
                                        padding: 0,
                                        border: "none",
                                        background: "none",
                                        cursor: "pointer"
                                    }}
                                />
                            </div>
                        </div>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                        <span style={{ color: "var(--muted)" }}>{t("options.padSize")}</span>
                        <select
                            value={props.padSizeChoice}
                            onChange={(e) => props.setPadSizeChoice(e.target.value as PadSizeChoice)}
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
                        <span style={{ color: "var(--muted)" }}>{t("options.promptFont")}</span>
                        <select
                            value={props.promptFont}
                            onChange={(e) => props.setPromptFont(e.target.value as PromptFontChoice)}
                            style={{
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "1px solid var(--border)",
                                background: "var(--surface)",
                                color: "var(--text)",
                                fontSize: 14
                            }}
                            aria-label={t("options.promptFont")}
                        >
                            {promptFontOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                        <span style={{ color: "var(--muted)" }}>{t("options.traceFont")}</span>
                        <select
                            value={props.traceFont}
                            onChange={(e) => props.setTraceFont(e.target.value as TraceFontChoice)}
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

                    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                        <span style={{ color: "var(--muted)" }}>{t("options.gridStyle")}</span>
                        <select
                            value={props.gridStyle}
                            onChange={(e) => props.setGridStyle(e.target.value as GridStyleChoice)}
                            style={{
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "1px solid var(--border)",
                                background: "var(--surface)",
                                color: "var(--text)",
                                fontSize: 14
                            }}
                            aria-label={t("options.gridStyle")}
                        >
                            <option value="rice">{t("options.gridStyleRice")}</option>
                            <option value="field">{t("options.gridStyleField")}</option>
                            <option value="none">{t("options.gridStyleNone")}</option>
                        </select>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                        <input
                            type="checkbox"
                            checked={props.gridVerticalShift}
                            onChange={(e) => props.setGridVerticalShift(e.target.checked)}
                        />
                        {t("options.gridVerticalShift")}
                    </label>

                    <div style={{ display: "flex", gap: 8, background: "var(--surface-strong)", padding: 4, borderRadius: 8, border: "1px solid var(--border)" }}>
                        <button
                            onClick={() => props.setCharacterMode('simplified')}
                            aria-pressed={props.characterMode === 'simplified'}
                            style={{
                                flex: 1,
                                border: "none",
                                background: props.characterMode === 'simplified' ? "var(--surface)" : "transparent",
                                boxShadow: props.characterMode === 'simplified' ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                borderRadius: 6,
                                padding: "6px 0",
                                fontSize: 13,
                                cursor: "pointer",
                                fontWeight: props.characterMode === 'simplified' ? "bold" : "normal",
                                color: props.characterMode === 'simplified' ? "var(--accent)" : "var(--text)"
                            }}
                        >
                            {t("options.simplified")}
                        </button>
                        <button
                            onClick={() => props.setCharacterMode('traditional')}
                            aria-pressed={props.characterMode === 'traditional'}
                            style={{
                                flex: 1,
                                border: "none",
                                background: props.characterMode === 'traditional' ? "var(--surface)" : "transparent",
                                boxShadow: props.characterMode === 'traditional' ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                borderRadius: 6,
                                padding: "6px 0",
                                fontSize: 13,
                                cursor: "pointer",
                                fontWeight: props.characterMode === 'traditional' ? "bold" : "normal",
                                color: props.characterMode === 'traditional' ? "var(--accent)" : "var(--text)"
                            }}
                        >
                            {t("options.traditional")}
                        </button>
                    </div>

                    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                        <span style={{ color: "var(--muted)" }}>{t("options.language")}</span>
                        <select
                            value={props.language}
                            onChange={(e) => {
                                // Only download optional meaning translations after the user
                                // explicitly chooses a language (not just auto-detection).
                                setMeaningTranslationsOptIn();
                                props.setLanguage(e.target.value);
                            }}
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
                            value={props.theme}
                            onChange={(e) => props.setTheme(e.target.value as ThemeChoice)}
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
                </div >
            </div >

            <div className="filter-section">
                <h3>{t("layout.title")}</h3>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={props.leftHanded}
                        onChange={(e) => props.setLeftHanded(e.target.checked)}
                    />
                    {t("layout.leftHanded")}
                </label>
            </div>

            <div className="filter-section">
                <h3>{t("help.title")}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                        onClick={() => props.onNavigate('help')}
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
                        onClick={() => props.onNavigate('tips')}
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
                    <button
                        onClick={() => props.onNavigate('pos-help')}
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
                        <span>{t("help.posAbbrev")}</span>
                        <span>→</span>
                    </button>
                    <button
                        onClick={() => props.onNavigate('licenses')}
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
                        <span>{t("app.licenses")}</span>
                        <span>→</span>
                    </button>
                </div>
            </div>

            <div style={{ marginTop: 24, fontSize: 13, color: "var(--muted)" }}>
                {t("stats.available", { count: props.filteredCardsCount })}
            </div>
        </>
    );
}
