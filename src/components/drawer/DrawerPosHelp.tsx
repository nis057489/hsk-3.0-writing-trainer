import React from "react";
import { useTranslation } from "react-i18next";

interface DrawerPosHelpProps {
    onBack: () => void;
}

export function DrawerPosHelp({ onBack }: DrawerPosHelpProps) {
    const { t } = useTranslation();

    const posItems = [
        { abbrev: "n", full: t("pos.n"), desc: t("help.posN") },
        { abbrev: "v", full: t("pos.v"), desc: t("help.posV") },
        { abbrev: "a", full: t("pos.a"), desc: t("help.posA") },
        { abbrev: "d", full: t("pos.d"), desc: t("help.posD") },
        { abbrev: "r", full: t("pos.r"), desc: t("help.posR") },
        { abbrev: "c", full: t("pos.c"), desc: t("help.posC") },
        { abbrev: "i", full: t("pos.i"), desc: t("help.posI") },
        { abbrev: "l", full: t("pos.l"), desc: t("help.posL") }
    ];

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
                <section>
                    <h3 style={{ margin: "0 0 12px 0", color: "var(--accent)" }}>{t("help.posTitle")}</h3>
                    <p style={{ margin: "0 0 16px 0", fontSize: 14, lineHeight: 1.6, color: "var(--muted)" }}>
                        {t("help.posDesc")}
                    </p>
                </section>

                {posItems.map((item) => (
                    <section key={item.abbrev} style={{
                        background: "var(--surface-strong)",
                        padding: 12,
                        borderRadius: 8,
                        border: "1px solid var(--border)"
                    }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                            <code style={{
                                background: "var(--accent)",
                                color: "var(--accent-contrast)",
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontSize: 13,
                                fontWeight: 700
                            }}>
                                {item.abbrev}
                            </code>
                            <span style={{ fontSize: 15, fontWeight: 600 }}>{item.full}</span>
                        </div>
                        <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
                            {item.desc}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
