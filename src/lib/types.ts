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

export type CardState = {
  id: string;
  due: number;        // unix ms
  intervalDays: number;
};
