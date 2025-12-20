import React from "react";
import { Grade } from "../lib/types";

export function Toolbar(props: {
  onGrade: (g: Grade) => void;
  onNext: () => void;
  remaining: number;
}) {
  return (
    <div className="toolbar">
      <div className="remaining">Queue: {props.remaining}</div>
      <div className="grades">
        <button onClick={() => props.onGrade("again")}>Again</button>
        <button onClick={() => props.onGrade("hard")}>Hard</button>
        <button onClick={() => props.onGrade("good")}>Good</button>
        <button onClick={() => props.onGrade("easy")}>Easy</button>
      </div>
      <button className="next" onClick={props.onNext}>Skip</button>
    </div>
  );
}
