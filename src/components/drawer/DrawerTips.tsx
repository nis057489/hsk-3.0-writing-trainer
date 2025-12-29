import { useTranslation } from "react-i18next";

interface DrawerTipsProps {
    onBack: () => void;
}

export function DrawerTips({ onBack }: DrawerTipsProps) {
    const { t } = useTranslation();

    return (
        <div className="drawer-page">
            <div className="drawer-page-header">
                <button onClick={onBack} className="back-button">
                    ← {t("app.back")}
                </button>
                <h3>{t("help.deviceTitle")}</h3>
            </div>

            <div className="drawer-page-content">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, color: "var(--text)" }}>
                        <li>{t("help.tip1")}</li>
                        <li>{t("help.tip2")}</li>
                        <li>{t("help.tip3")}</li>
                        <li>{t("help.tip4")}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
