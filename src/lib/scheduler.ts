import { CardState, Grade, PromptMode, SkillState } from "./types";

const DAY = 24 * 60 * 60 * 1000;

const DEFAULT_SKILLS: PromptMode[] = ["recognize", "write"];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function gradeToQuality(grade: Grade): number {
  switch (grade) {
    case "again":
      return 1;
    case "hard":
      return 3;
    case "good":
      return 4;
    case "easy":
      return 5;
  }
}

function ensureSkill(prev: CardState, mode: PromptMode): SkillState {
  const fromSkills = prev.skills?.[mode];
  if (fromSkills) {
    return {
      due: fromSkills.due ?? prev.due ?? 0,
      intervalDays: fromSkills.intervalDays ?? prev.intervalDays ?? 0,
      stabilityDays: fromSkills.stabilityDays,
      difficulty: fromSkills.difficulty,
      lapses: fromSkills.lapses,
      lastGrade: fromSkills.lastGrade ?? prev.lastGrade,
      lastReviewed: fromSkills.lastReviewed ?? prev.lastReviewed,
    };
  }

  // Migration path: if legacy state exists, seed both skills with it
  // so existing users don't suddenly see everything as "new".
  return {
    due: prev.due ?? 0,
    intervalDays: prev.intervalDays ?? 0,
    stabilityDays: prev.intervalDays ?? 0,
    difficulty: 2.5,
    lapses: 0,
    lastGrade: prev.lastGrade,
    lastReviewed: prev.lastReviewed,
  };
}

function computeAggregate(state: CardState, skills: Partial<Record<PromptMode, SkillState>>): CardState {
  const dues = Object.values(skills)
    .map(s => s?.due)
    .filter((x): x is number => typeof x === "number");

  const due = dues.length ? Math.min(...dues) : (state.due ?? 0);

  // Keep legacy fields meaningful: reflect the "recognize" skill when present.
  const recognize = skills.recognize;
  const intervalDays = recognize?.intervalDays ?? state.intervalDays ?? 0;
  const lastGrade = recognize?.lastGrade ?? state.lastGrade;
  const lastReviewed = recognize?.lastReviewed ?? state.lastReviewed;

  return {
    ...state,
    due,
    intervalDays,
    lastGrade,
    lastReviewed,
    skills,
  };
}

function modeFactor(mode: PromptMode) {
  // Writing is intentionally "harder" so it repeats sooner.
  return mode === "write" ? 0.6 : 1.0;
}

function updateSkill(prev: SkillState, grade: Grade, now: number, mode: PromptMode): SkillState {
  const q = gradeToQuality(grade);

  let difficulty = prev.difficulty ?? 2.5;
  let stabilityDays = prev.stabilityDays ?? prev.intervalDays ?? 0;
  let lapses = prev.lapses ?? 0;

  // "Again" stays in-session.
  if (q < 3) {
    lapses += 1;
    difficulty = clamp(difficulty + 0.8 * (3 - q), 1.3, 10);
    stabilityDays = Math.max(0.25, stabilityDays * 0.5);
    return {
      ...prev,
      due: now + 30 * 1000,
      intervalDays: 0,
      stabilityDays,
      difficulty,
      lapses,
      lastGrade: grade,
      lastReviewed: now,
    };
  }

  // Success: grow stability, reduce difficulty slightly.
  difficulty = clamp(difficulty - 0.15 * (q - 2), 1.3, 10);
  if (stabilityDays < 0.5) stabilityDays = 1;

  // Growth: primarily driven by quality, slightly damped by difficulty.
  const growth = 1 + 0.35 * (q - 2) - 0.08 * (difficulty - 2.5);
  stabilityDays = Math.max(0.5, stabilityDays * Math.max(1.05, growth));

  const minDays = mode === "write" ? 1 : 1;
  const maxDays = 365;
  const nextIntervalDays = clamp(stabilityDays * modeFactor(mode), minDays, maxDays);

  return {
    ...prev,
    due: now + Math.round(nextIntervalDays * DAY),
    intervalDays: nextIntervalDays,
    stabilityDays,
    difficulty,
    lapses,
    lastGrade: grade,
    lastReviewed: now,
  };
}

export function nextState(
  prev: CardState,
  grade: Grade,
  now = Date.now(),
  opts?: {
    // If true, also schedule the writing skill.
    // If false/undefined, we still schedule it (backwards-compatible default),
    // but callers can disable it when writing was not meaningfully practiced.
    practicedWriting?: boolean;
  }
): CardState {
  const practicedWriting = opts?.practicedWriting ?? true;

  const skills: Partial<Record<PromptMode, SkillState>> = { ...(prev.skills ?? {}) };

  // Always update recognition.
  skills.recognize = updateSkill(ensureSkill(prev, "recognize"), grade, now, "recognize");

  // Optionally update writing (e.g. don't reward tracing as much).
  if (practicedWriting) {
    skills.write = updateSkill(ensureSkill(prev, "write"), grade, now, "write");
  } else {
    skills.write = ensureSkill(prev, "write");
  }

  return computeAggregate(prev, skills);
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
  const existing = map[id];
  if (!existing) {
    const base: CardState = { id, due: 0, intervalDays: 0, skills: {} };
    const skills: Partial<Record<PromptMode, SkillState>> = {};
    for (const mode of DEFAULT_SKILLS) {
      skills[mode] = ensureSkill(base, mode);
    }
    return computeAggregate(base, skills);
  }

  // Ensure migrated skills are present.
  const skills: Partial<Record<PromptMode, SkillState>> = { ...(existing.skills ?? {}) };
  for (const mode of DEFAULT_SKILLS) {
    skills[mode] = ensureSkill(existing, mode);
  }
  return computeAggregate(existing, skills);
}
