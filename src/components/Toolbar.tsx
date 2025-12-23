import React from "react";
import { useTranslation } from "react-i18next";
import { Grade } from "../lib/types";

export function Toolbar(props: {
    onGrade: (g: Grade) => void;
    onNext: () => void;
    remaining: number;
}) {
    const { t } = useTranslation();
    return (
        <div className="toolbar">
            <div className="remaining">{t("toolbar.queue")}: {props.remaining}</div>
            <div className="grades">
                <button onClick={() => props.onGrade("again")}>{t("toolbar.again")}</button>
                <button onClick={() => props.onGrade("hard")}>{t("toolbar.hard")}</button>
                <button onClick={() => props.onGrade("good")}>{t("toolbar.good")}</button>
                <button onClick={() => props.onGrade("easy")}>{t("toolbar.easy")}</button>
            </div>
            <button className="next" onClick={props.onNext}>{t("toolbar.skip")}</button>
        </div>
    );
}
