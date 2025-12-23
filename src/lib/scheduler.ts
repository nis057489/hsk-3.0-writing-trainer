import { CardState, Grade } from "./types";

const DAY = 24 * 60 * 60 * 1000;

export function nextState(prev: CardState, grade: Grade, now = Date.now()): CardState {
  // Simple, transparent schedule (tweak as you like)
  const base = prev.intervalDays || 0;

  const nextInterval =
    grade === "again" ? 0 :
    grade === "hard"  ? Math.max(1, Math.round(base * 1.2) || 1) :
    grade === "good"  ? Math.max(2, Math.round(base * 1.8) || 2) :
                        Math.max(3, Math.round(base * 2.5) || 3);

  // If "again", keep it in-session quickly
  const due = grade === "again" ? now + 30 * 1000 : now + nextInterval * DAY;

  return { ...prev, intervalDays: nextInterval, due, lastGrade: grade, lastReviewed: now };
}

export function loadProgress(): Record<string, CardState> {
  try {
    const raw = localStorage.getItem("hsk3.progress");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveProgress(map: Record<string, CardState>) {
  localStorage.setItem("hsk3.progress", JSON.stringify(map));
}

export function ensureState(id: string, map: Record<string, CardState>): CardState {
  return map[id] ?? { id, due: 0, intervalDays: 0 };
}
