import React from "react";
import { Card } from "../lib/types";

export function Flashcard(props: {
  card: Card;
  reveal: boolean;
  onToggleReveal: () => void;
}) {
  const { card, reveal } = props;

  return (
    <div className="card">
      <div className="hanzi">{card.hanzi}</div>

      <div className="meta">
        <button onClick={props.onToggleReveal}>
          {reveal ? "Hide" : "Reveal"} pinyin/meaning
        </button>
      </div>

      {reveal && (
        <div className="reveal">
          <div className="pinyin">{card.pinyin}</div>
          <div className="meaning">{card.meaning}</div>
        </div>
      )}
    </div>
  );
}
