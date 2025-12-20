export type Card = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
};

export type Grade = "again" | "hard" | "good" | "easy";

export type CardState = {
  id: string;
  due: number;        // unix ms
  intervalDays: number;
};
