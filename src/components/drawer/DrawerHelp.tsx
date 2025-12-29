import React from "react";
import { useTranslation } from "react-i18next";

interface DrawerHelpProps {
    onBack: () => void;
}

export function DrawerHelp({ onBack }: DrawerHelpProps) {
    const { t } = useTranslation();

    return (
        <div className="drawer-page">
            <div className="drawer-page-header">
                <button onClick={onBack} className="back-button">
                    ← {t("app.back")}
                </button>
                <h3>{t("help.generalRules")}</h3>
            </div>

            <div className="drawer-page-content">
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <section>
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
        </div>
    );
}
