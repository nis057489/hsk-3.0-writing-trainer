import { useTranslation } from "react-i18next";

interface DrawerPosHelpProps {
    onBack: () => void;
}

export function DrawerPosHelp({ onBack }: DrawerPosHelpProps) {
    const { t } = useTranslation();

    const posItems = [
        { abbrev: "a", full: t("pos.a"), desc: t("help.posA") },
        { abbrev: "ad", full: t("pos.ad"), desc: t("help.posAD") },
        { abbrev: "ag", full: t("pos.ag"), desc: t("help.posAG") },
        { abbrev: "an", full: t("pos.an"), desc: t("help.posAN") },
        { abbrev: "b", full: t("pos.b"), desc: t("help.posB") },
        { abbrev: "c", full: t("pos.c"), desc: t("help.posC") },
        { abbrev: "d", full: t("pos.d"), desc: t("help.posD") },
        { abbrev: "dg", full: t("pos.dg"), desc: t("help.posDG") },
        { abbrev: "e", full: t("pos.e"), desc: t("help.posE") },
        { abbrev: "f", full: t("pos.f"), desc: t("help.posF") },
        { abbrev: "g", full: t("pos.g"), desc: t("help.posG") },
        { abbrev: "h", full: t("pos.h"), desc: t("help.posH") },
        { abbrev: "i", full: t("pos.i"), desc: t("help.posI") },
        { abbrev: "j", full: t("pos.j"), desc: t("help.posJ") },
        { abbrev: "k", full: t("pos.k"), desc: t("help.posK") },
        { abbrev: "l", full: t("pos.l"), desc: t("help.posL") },
        { abbrev: "m", full: t("pos.m"), desc: t("help.posM") },
        { abbrev: "mg", full: t("pos.mg"), desc: t("help.posMG") },
        { abbrev: "n", full: t("pos.n"), desc: t("help.posN") },
        { abbrev: "ng", full: t("pos.ng"), desc: t("help.posNG") },
        { abbrev: "nr", full: t("pos.nr"), desc: t("help.posNR") },
        { abbrev: "ns", full: t("pos.ns"), desc: t("help.posNS") },
        { abbrev: "nt", full: t("pos.nt"), desc: t("help.posNT") },
        { abbrev: "nx", full: t("pos.nx"), desc: t("help.posNX") },
        { abbrev: "nz", full: t("pos.nz"), desc: t("help.posNZ") },
        { abbrev: "o", full: t("pos.o"), desc: t("help.posO") },
        { abbrev: "p", full: t("pos.p"), desc: t("help.posP") },
        { abbrev: "q", full: t("pos.q"), desc: t("help.posQ") },
        { abbrev: "r", full: t("pos.r"), desc: t("help.posR") },
        { abbrev: "rg", full: t("pos.rg"), desc: t("help.posRG") },
        { abbrev: "s", full: t("pos.s"), desc: t("help.posS") },
        { abbrev: "t", full: t("pos.t"), desc: t("help.posT") },
        { abbrev: "tg", full: t("pos.tg"), desc: t("help.posTG") },
        { abbrev: "u", full: t("pos.u"), desc: t("help.posU") },
        { abbrev: "v", full: t("pos.v"), desc: t("help.posV") },
        { abbrev: "vd", full: t("pos.vd"), desc: t("help.posVD") },
        { abbrev: "vg", full: t("pos.vg"), desc: t("help.posVG") },
        { abbrev: "vn", full: t("pos.vn"), desc: t("help.posVN") },
        { abbrev: "w", full: t("pos.w"), desc: t("help.posW") },
        { abbrev: "x", full: t("pos.x"), desc: t("help.posX") },
        { abbrev: "y", full: t("pos.y"), desc: t("help.posY") },
        { abbrev: "z", full: t("pos.z"), desc: t("help.posZ") }
    ];

    return (
        <div className="drawer-page">
            <div className="drawer-page-header">
                <button onClick={onBack} className="back-button">
                    ← {t("app.back")}
                </button>
                <h3>{t("help.posTitle")}</h3>
            </div>

            <div className="drawer-page-content">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <section>
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
        </div>
    );
}
