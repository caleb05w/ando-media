"use client";

// The world, one card — the bubble and the ball were neighbours on
// the shelf; now they share a canvas. A quiet corner toggle picks the
// take (the same corner the context trace hangs its chrome in); the
// ball embeds without wheel-zoom so the shelf keeps its scroll.

import { useState } from "react";

import { WorldBall } from "./world-ball";
import { WorldCrowd } from "./world-crowd";

const TAKES = [
  { id: "bubble", label: "bubble" },
  { id: "ball", label: "ball" },
] as const;

type Take = (typeof TAKES)[number]["id"];

export function WorldCard() {
  const [take, setTake] = useState<Take>("bubble");

  return (
    <div className="lib-card lib-card--canvas">
      <div className="absolute right-3 top-3 flex items-center gap-0.5">
        {TAKES.map((option) => (
          <button
            aria-pressed={take === option.id}
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase leading-4 tracking-[0.08em] transition-colors ease-fast ${
              take === option.id ? "text-[#1a1817]" : "text-[#a8a29e] hover:text-[#58524e]"
            }`}
            key={option.id}
            onClick={() => setTake(option.id)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="w-full max-w-[300px]" key={take}>
        {take === "bubble" ? <WorldCrowd /> : <WorldBall zoomable={false} />}
      </div>
    </div>
  );
}
