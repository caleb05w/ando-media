"use client";

// Prototype furniture: a quiet segmented control floating over the page,
// switching between the mini ando build, the mini-ando-2 layout
// explorations, and the @sara parking lot. All sides arrive
// server-rendered as props; this component only owns which one is on
// stage.

import { useState } from "react";

const VIEWS = [
  ["mini2", "mini ando 2"],
  ["mini", "mini ando"],
  ["affiliate", "@sara"],
] as const;

type View = (typeof VIEWS)[number][0];

export function ViewToggle({
  affiliate,
  mini,
  mini2,
}: {
  affiliate: React.ReactNode;
  mini: React.ReactNode;
  mini2: React.ReactNode;
}) {
  const [view, setView] = useState<View>("mini");

  return (
    <>
      <div className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-[#f0efee]/90 p-0.5 shadow-[0_1px_3px_rgba(28,25,23,0.08)] backdrop-blur">
        {VIEWS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`h-6 rounded-full px-3 text-[12px] leading-4 transition-colors ${
              view === key
                ? "bg-white text-[#1a1817] shadow-[0_1px_2px_rgba(15,13,13,0.08)]"
                : "text-[#58524e] hover:text-[#1a1817]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "mini2" ? mini2 : view === "mini" ? mini : affiliate}
    </>
  );
}
