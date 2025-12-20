import React from "react";
import { useTranslation } from "react-i18next";

interface DrawerTipsProps {
    onBack: () => void;
}

export function DrawerTips({ onBack }: DrawerTipsProps) {
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
    );
}
