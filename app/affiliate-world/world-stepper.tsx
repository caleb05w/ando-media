"use client";

// The exploration stepper — quiet numerals under the world, GN.D
// style. Iteration 1 is the halo (Brand 3772-11314): the claim lives
// INSIDE the ring — "Become an affiliate", the caption, the field —
// and beneath the field a quiet CREDIT rotates: "Oli built the
// morning catch-up · see inside", each one a door into the world
// where that thing lives. Clicking any face opens their profile
// sheet too. Iteration 2 is the packed-crowd duet (Brand 3772-11750),
// world left, claim beside it. The ball is retired from the stepper —
// it lives on at /claim and on the library shelf.

import { Heading, Text, TextSize } from "@repo/design-system-ui/text";
import { useEffect, useRef, useState } from "react";

import { ITERATIONS, WorldBall } from "../the-library/world-ball";
import { WorldCrowd } from "../the-library/world-crowd";
import { ClaimHandle } from "./claim-handle";
import { ProfilePanel } from "./profile-panel";
import "./world-stepper.css";

const STEPS: { id: string; label: string }[] = [
  ...ITERATIONS.filter((iteration) => iteration.id !== "ball").map((iteration) => ({
    id: iteration.id,
    label: iteration.label,
  })),
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

/* The credits — one short sentence of what each person actually did
   (built, caught, kept, shipped — whatever the verb really was), each
   pointing into a world where it can be seen. One on stage at a time,
   rotating on a calm clock. */
const CREDITS: { person: string; line: string }[] = [
  { person: "oli", line: "Oli caught Thursday's blocker before standup" },
  { person: "jordan", line: "Jordan turned this morning's Jam into a flow" },
  { person: "sara", line: "Sara shipped pricing v2 from one thread" },
  { person: "alex", line: "Alex kept the launch date honest" },
  { person: "agent-1", line: "Yumi kept the receipts — 1,204 and counting" },
  { person: "felipe", line: "Felipe wrote the one-pager nobody rereads" },
];

function CreditRow({
  credit,
  className = "",
  onOpen,
}: {
  credit: (typeof CREDITS)[number];
  className?: string;
  onOpen: (person: string) => void;
}) {
  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" className="size-4 rounded-full object-cover" src={`/avatars/${credit.person}.png`} />
      <Text as="span" color="tertiary" size={TextSize.XS}>
        {credit.line} ·
      </Text>
      <button
        className="cursor-pointer font-sans text-size-xs text-text-tertiary underline decoration-dotted underline-offset-2 transition-colors ease-fast hover:text-[#2563eb]"
        onClick={() => onOpen(credit.person)}
        type="button"
      >
        see inside
      </button>
    </div>
  );
}

function CreditLine({ onOpen }: { onOpen: (person: string) => void }) {
  const [at, setAt] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const atRef = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers = new Set<number>();
    const id = window.setInterval(() => {
      const cur = atRef.current;
      atRef.current = (cur + 1) % CREDITS.length;
      setLeaving(cur);
      setAt(atRef.current);
      timers.add(window.setTimeout(() => setLeaving(null), 360));
    }, 8000);
    return () => {
      window.clearInterval(id);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  return (
    <div className="relative h-5 overflow-hidden">
      {leaving !== null ? (
        <CreditRow className="aw-slot-out absolute inset-x-0 top-0" credit={CREDITS[leaving]} onOpen={onOpen} />
      ) : null}
      <CreditRow
        className={leaving !== null ? "aw-slot-in" : ""}
        credit={CREDITS[at]}
        key={at}
        onOpen={onOpen}
      />
    </div>
  );
}

/* The duet's right-hand column — the statement and the claim, shared
   by both iterations. */
function JoinColumn() {
  return (
    <div className="flex max-w-[440px] flex-col items-center text-center md:items-start md:text-left">
      <Heading as="h1" size={{ base: TextSize.XXL, md: TextSize.XXL2 }} weight="regular">
        Join the Ando world.
      </Heading>
      <Text className="mt-6" color="secondary" size={TextSize.Small}>
        The most agent-pilled startups are building their working worlds here. Claim your handle: it holds your name,
        and your place in line.
      </Text>
      <div className="mt-8">
        <ClaimHandle />
      </div>
    </div>
  );
}

export function WorldStepper() {
  const [at, setAt] = useState(0);
  const [profile, setProfile] = useState<string | null>(null);
  const step = STEPS[at];

  const hero =
    step.id === "duet" ? (
      /* the duet posture — world left, claim beside it. No left-1/2
         breakout: the stepper root's items-center already centres an
         oversized strip; the translate trick double-centred it and
         skewed the pair left by half the overflow. */
      <div
        className="flex w-[calc(100vw-40px)] max-w-[888px] flex-col items-center gap-10 py-6 md:w-[calc(100vw-64px)] md:flex-row md:items-center md:justify-center md:gap-16 md:py-16"
        key="duet"
      >
        <div className="w-full max-w-[364px] shrink-0">
          <WorldCrowd bench={false} onPick={setProfile} />
        </div>
        <JoinColumn />
      </div>
    ) : (
      /* the halo — the claim lives inside the ring, never covered;
         the rotating credit sits UNDER the halo, pointing into a
         world */
      <div className="flex flex-col items-center" key="halo">
        <div className="relative w-[calc(100vw-40px)] max-w-[680px] py-6 md:py-10">
          <WorldBall
            drift={0.05}
            items={ITERATIONS.find((candidate) => candidate.id === step.id)!.items}
            mode={ITERATIONS.find((candidate) => candidate.id === step.id)!.mode}
            onPick={setProfile}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto flex max-w-[340px] flex-col items-center text-center">
              <Heading as="h1" size={TextSize.XL} weight="regular">
                Become an affiliate
              </Heading>
              <Text className="mt-2 max-w-[250px]" color="secondary" size={TextSize.XS}>
                The most agent-pilled startups are building their working worlds here.
              </Text>
              <div className="mt-5">
                <ClaimHandle />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-1">
          <CreditLine onOpen={setProfile} />
        </div>
      </div>
    );

  return (
    <div className="flex flex-col items-center">
      {hero}
      <StepDots at={at} onPick={setAt} />
      {profile ? <ProfilePanel onClose={() => setProfile(null)} onVisit={setProfile} person={profile} /> : null}
    </div>
  );
}
