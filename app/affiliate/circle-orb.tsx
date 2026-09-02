"use client";

// Sara's circle — the avatar orb, sized for any working world. The orb
// plan picks avatar sizes and ring radii by head count: a pair reads as
// a pair, 30+ reads as a crowd, and anything past ring capacity
// collapses into a "+N" disc. The count slider is prototype furniture
// for tuning the plan; the real page would pass the actual roster.

import { useState } from "react";

const POOL_BASE = [
  "sara", "agent-1", "oli", "aj", "jordan", "alex", "andrew", "caleb", "felipe", "ryan", "agent-2",
];

/** The owner first, then the pool cycled to length n. */
function makePeople(n: number): string[] {
  const people = ["sara"];
  for (let i = 0; people.length < n; i++) people.push(POOL_BASE[1 + (i % (POOL_BASE.length - 1))]);
  return people;
}

type OrbSlot = { x: number; y: number; size: number };

// The spacing rule: the gap between any two neighbouring elements —
// around a ring, or from a ring to what it encloses — is the same GAP.
// Rings chain outward at that gap, so there is never a void around the
// centre; each ring's avatar size is then SOLVED from its head count so
// the circumferential gap matches too, clamped to a 1.5× deviation from
// the centre size. A ring that would need tinier heads than the clamp
// allows closes up shoulder-to-shoulder instead of pushing outward.
const GAP = 10;

function orbLayout(n: number): { slots: OrbSlot[]; box: number } {
  const centre = Math.round(Math.max(38, Math.min(54, 56 - n * 0.5)));
  const sizeMin = centre / 1.5;
  const others = n - 1;

  // Ring plan. Up to a dozen heads make one wreath around the centre —
  // every neighbour gap exact. Beyond that, hex-packing capacities
  // (⌊2πk⌋: 6, 12, 18, 25 …) shape two candidate plans — heads spread
  // proportionally across rings, or inner rings filled with the rest
  // pushed outward — and the plan whose gaps deviate least from GAP
  // wins. Every ring solves its avatar size for the exact gap, clamped
  // to the 1.5× band; a ring below the floor steps outward instead of
  // overlapping.
  const caps: number[] = [];
  let cum = 0;
  for (let k = 1; cum < others; k++) {
    caps.push(Math.floor(2 * Math.PI * k));
    cum += caps[caps.length - 1];
  }

  const proportional = (): number[] => {
    const fill = others / cum;
    const counts = caps.map((c) => Math.floor(c * fill));
    let left = others - counts.reduce((a, b) => a + b, 0);
    const byFraction = caps
      .map((c, i) => ({ i, frac: c * fill - Math.floor(c * fill) }))
      .sort((a, b) => b.frac - a.frac);
    for (let j = 0; left > 0; j = (j + 1) % caps.length, left--) counts[byFraction[j].i]++;
    while (counts[0] < 5 && counts[counts.length - 1] > 5) {
      counts[0]++;
      counts[counts.length - 1]--;
    }
    return counts.filter((c) => c > 0);
  };

  const greedy = (): number[] => {
    const counts: number[] = [];
    let remaining = others;
    for (const cap of caps) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, cap);
      counts.push(take);
      remaining -= take;
    }
    // A tiny final ring borrows from the one before it.
    const last = counts.length - 1;
    while (last > 0 && counts[last] < 5 && counts[last - 1] > 5) {
      counts[last]++;
      counts[last - 1]--;
    }
    return counts;
  };

  // Lay a plan out and score it by its worst deviation from GAP.
  const build = (counts: number[]) => {
    const slots: OrbSlot[] = [{ x: 0, y: 0, size: centre }];
    let edge = centre / 2;
    let score = 0;
    counts.forEach((take, ringIndex) => {
      const inner = edge + GAP;
      const s = Math.sin(Math.PI / take);
      const solved = (2 * inner * s - GAP) / (1 - s);
      let size: number;
      let r: number;
      if (solved < sizeMin) {
        size = Math.round(sizeMin);
        r = (size + GAP) / (2 * s);
      } else {
        size = Math.round(Math.min(centre, solved));
        r = inner + size / 2;
      }
      score = Math.max(score, Math.abs(2 * r * s - size - GAP), r - size / 2 - edge - GAP);
      for (let i = 0; i < take; i++) {
        const a = (i / take) * Math.PI * 2 - Math.PI / 2 + (ringIndex % 2) * (Math.PI / take);
        slots.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, size });
      }
      edge = r + size / 2;
    });
    return { slots, box: Math.ceil(edge * 2 + 8), score };
  };

  const plans = others <= 12 ? [build([others])] : [build(proportional()), build(greedy())];
  const best = plans.reduce((a, b) => (b.score < a.score ? b : a));
  return { slots: best.slots, box: best.box };
}

// Under six people there is no crowd to draw — they stand in a row, the
// way the closing card's pair does: shoulder to shoulder, alternating
// sizes so the line has a pulse.
const ROW_SIZES = [58, 46, 54, 42, 50];

export function CircleOrb({ people }: { people: string[] }) {
  // A handful is a row, not a circle.
  if (people.length <= 5) {
    return (
      <div className="flex items-center justify-center -space-x-1.5">
        {people.map((name, i) => {
          const agent = name.startsWith("agent");
          const size = ROW_SIZES[i % ROW_SIZES.length];
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${name}-${i}`}
              src={`/avatars/${name}.png`}
              alt=""
              className={`max-w-none rounded-full border-2 border-white object-cover ${
                agent ? "ring-2 ring-[#2563eb]" : "ring-1 ring-[#f0efee]"
              }`}
              style={{ width: size, height: size, zIndex: people.length - i }}
            />
          );
        })}
      </div>
    );
  }

  const { slots, box } = orbLayout(people.length);
  return (
    <div className="relative mx-auto" style={{ width: box, height: box }}>
      {people.map((name, i) => {
        const p = slots[i];
        const agent = name.startsWith("agent");
        return (
          <span
            key={`${name}-${i}`}
            className="absolute transition-all duration-500 ease-fast"
            style={{ left: box / 2 + p.x - p.size / 2, top: box / 2 + p.y - p.size / 2 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/avatars/${name}.png`}
              alt=""
              className={`max-w-none rounded-full object-cover ${agent ? "ring-2 ring-[#2563eb]" : "ring-1 ring-[#f0efee]"}`}
              style={{ width: p.size, height: p.size }}
            />
          </span>
        );
      })}
    </div>
  );
}

export function CircleOrbDemo() {
  const [count, setCount] = useState(19);
  return (
    <div className="flex flex-col items-center gap-6">
      <CircleOrb people={makePeople(count)} />
      <label className="flex w-full max-w-[320px] items-center gap-3">
        <input
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[#e7e5e4] accent-[#2563eb]"
          max={60}
          min={2}
          onChange={(e) => setCount(Number(e.target.value))}
          type="range"
          value={count}
        />
        <span className="w-[76px] shrink-0 text-right font-mono text-[11px] tabular-nums text-[#78716c]">
          {count} people
        </span>
      </label>
    </div>
  );
}
