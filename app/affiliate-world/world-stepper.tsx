"use client";

// The exploration stepper — quiet numerals under the world, GN.D
// style. The stepper owns the whole hero: iterations 1 and 2 stack
// the arrangement over the centred claim; iteration 3 is the Brand
// duet (Brand 3772-11750) — the packed crowd seated beside the
// heading and the claim, 364px of faces, a 64px breath, a 440px
// column of words. Keyed remounts so every arrival re-enters.

import { Heading, Text, TextSize } from "@repo/design-system-ui/text";
import { useState } from "react";

import { WorldCrowd } from "../the-library/world-crowd";
import { ClaimHandle } from "./claim-handle";
import { ITERATIONS, WorldBall } from "./world-ball";

const STEPS: { id: string; label: string }[] = [
  ...ITERATIONS.map((iteration) => ({ id: iteration.id, label: iteration.label })),
  { id: "duet", label: "the duet" },
];

function StepDots({ at, onPick }: { at: number; onPick: (i: number) => void }) {
  return (
    <div className="mt-3 flex items-center justify-center gap-1">
      {STEPS.map((step, i) => (
        <button
          aria-label={`Iteration ${i + 1} — ${step.label}`}
          aria-pressed={i === at}
          className={`h-6 min-w-6 rounded-full font-mono text-[11px] leading-4 transition-colors ease-fast ${
            i === at ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary"
          }`}
          key={step.id}
          onClick={() => onPick(i)}
          type="button"
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}

export function WorldStepper() {
  const [at, setAt] = useState(0);
  const step = STEPS[at];

  if (step.id === "duet") {
    return (
      <div className="flex flex-col items-center">
        {/* the duet — wider than the prose column, like the uses shelf */}
        <div
          className="relative left-1/2 flex w-[calc(100vw-40px)] max-w-[888px] -translate-x-1/2 flex-col items-center gap-10 py-6 md:w-[calc(100vw-64px)] md:flex-row md:items-center md:justify-center md:gap-16 md:py-16"
          key="duet"
        >
          <div className="w-full max-w-[364px] shrink-0">
            <WorldCrowd bench={false} />
          </div>
          <div className="flex max-w-[440px] flex-col items-center text-center md:items-start md:text-left">
            <Heading as="h1" size={{ base: TextSize.XXL, md: TextSize.XXL2 }} weight="regular">
              Join the Ando world.
            </Heading>
            <Text className="mt-6" color="secondary" size={TextSize.Small}>
              The most agent-pilled startups are building their working worlds here. Claim your handle: it holds your
              name, and your place in line.
            </Text>
            <div className="mt-8">
              <ClaimHandle />
            </div>
          </div>
        </div>
        <StepDots at={at} onPick={setAt} />
      </div>
    );
  }

  const iteration = ITERATIONS[at];
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-full max-w-[500px] px-5 md:px-0" key={iteration.id}>
        <WorldBall items={iteration.items} mode={iteration.mode} />
      </div>
      <StepDots at={at} onPick={setAt} />
      <Heading as="h1" className="mt-12" size={{ base: TextSize.XXL, md: TextSize.XXL2 }} weight="regular">
        Join the Ando world.
      </Heading>
      <Text className="mt-4 max-w-[440px]" color="secondary" size={TextSize.Small}>
        The most agent-pilled startups are building their working worlds here. Claim your handle: it holds your name,
        and your place in line.
      </Text>
      <div className="mt-8">
        <ClaimHandle />
      </div>
    </div>
  );
}
