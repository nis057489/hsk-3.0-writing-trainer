export type Card = {
  id: string;
  hanzi: string;
  traditional?: string;
  pinyin: string;
  meaning: string;
  level?: string[];
  pos?: string[];
};

export type Grade = "again" | "hard" | "good" | "easy";

export type PromptMode = "recognize" | "write";

export type SkillState = {
  due: number; // unix ms
  intervalDays: number;
  stabilityDays?: number;
  difficulty?: number;
  lapses?: number;
  lastGrade?: Grade;
  lastReviewed?: number; // unix ms
};

export type CardState = {
  id: string;
  due: number;        // unix ms
  intervalDays: number;
  lastGrade?: Grade;
  lastReviewed?: number; // unix ms

  // Optional per-skill SRS state (backwards-compatible with older saves)
  skills?: Partial<Record<PromptMode, SkillState>>;
};
