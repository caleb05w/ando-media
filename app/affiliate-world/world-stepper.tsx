"use client";

// The exploration stepper — quiet numerals under the world, GN.D
// style. The crowd stays on stage; the numbers page through its
// arrangements. Keyed remount so each iteration makes its entrance.

import { useState } from "react";

import { ITERATIONS, WorldBall } from "./world-ball";

// The engine's arrangements. The flat bubble that used to sit at 3
// was retired to /the-library; slot 3 is reserved for the Brand-file
// take (Brand 3772-11750) once it lands.
const STEPS: { id: string; label: string; render: () => React.ReactNode }[] = ITERATIONS.map((iteration) => ({
  id: iteration.id,
  label: iteration.label,
  render: () => <WorldBall items={iteration.items} mode={iteration.mode} />,
}));

export function WorldStepper() {
  const [at, setAt] = useState(0);
  const current = STEPS[at];

  return (
    <div>
      <div key={current.id}>{current.render()}</div>
      <div className="mt-3 flex items-center justify-center gap-1">
        {STEPS.map((step, i) => (
          <button
            aria-label={`Iteration ${i + 1} — ${step.label}`}
            aria-pressed={i === at}
            className={`h-6 min-w-6 rounded-full font-mono text-[11px] leading-4 transition-colors ease-fast ${
              i === at ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary"
            }`}
            key={step.id}
            onClick={() => setAt(i)}
            type="button"
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
