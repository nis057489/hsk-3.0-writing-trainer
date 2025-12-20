import React, { useMemo } from "react";
import { DrawingPad } from "./DrawingPad";

interface PracticeAreaProps {
    text: string;
    tracingMode: boolean;
}

export function PracticeArea({ text, tracingMode }: PracticeAreaProps) {
    const characters = useMemo(() => {
        return Array.from(text).filter(ch => ch.trim().length > 0);
    }, [text]);

    if (characters.length === 0) {
        return (
            <div className="practice-empty">
                No characters to trace yet.
            </div>
        );
    }

    return (
        <div className="practice-shell">
            <div className="practice-header">
                <div>
                    <div className="practice-kicker">Trace each character</div>
                    <div className="practice-title">{text}</div>
                </div>
                <div className="practice-count">{characters.length} chars</div>
            </div>

            <div className="trace-grid">
                {characters.map((char, index) => (
                    <div key={`${char}-${index}`} className="trace-cell">
                        <div className="trace-label">Char {index + 1}</div>
                        <div className="trace-pad">
                            <DrawingPad size={220} tracingMode={tracingMode} character={char} />
                        </div>
                        <div className="trace-char">{char}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
