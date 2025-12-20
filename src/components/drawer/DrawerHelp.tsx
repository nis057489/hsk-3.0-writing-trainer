import React from "react";
import { useTranslation } from "react-i18next";

interface DrawerHelpProps {
    onBack: () => void;
}

export function DrawerHelp({ onBack }: DrawerHelpProps) {
    const { t } = useTranslation();

    return (
        <div>
            <button
                onClick={onBack}
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
    );
}
