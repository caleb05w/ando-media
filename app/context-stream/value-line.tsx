"use client";

// The value-prop line beneath the agent: the product's trace line
// (shimmering activity, the sources piled inline — the face above it is
// the name) with the library's one-line-banner slot for the activity —
// each new line rolls up into the slot on a shallow 3D tip while the last
// one tips away above it, centred under the agent. The lines are all
// mounted; scene.tsx writes each one's roll per frame from the clock, so
// it scrubs.

import type { ReactNode, RefObject } from "react";
import { Avatar } from "../ando-stage/chrome";
import type { TracePhases } from "../ando-stage/context-trace";
import type { Actor } from "../ando-stage/scenes";
import "../the-library/agent-context-trace.css";

/** The light shimmer inks from .ct-light, without the card's ring. */
const SHIMMER_INKS = { ["--ct-shimmer-lo" as string]: "rgba(88, 82, 78, 0.45)", ["--ct-shimmer-hi" as string]: "#58524e" };
/** The slot, unscaled: wide enough for the longest line and its pile. */
export const VALUE_SLOT_W = 320;
export const VALUE_LINE_H = 20;

export function ValueLine({ agent, participants, steps, lineRefs, itemRefs }: { agent: Actor; participants: Actor[]; steps: TracePhases["steps"]; lineRefs: RefObject<Array<HTMLSpanElement | null>>; /** [step][item] — each pile item, so it can pop in on its own beat */ itemRefs: RefObject<Array<Array<HTMLSpanElement | null>>> }) {
  return (
    <div className="flex items-center kanso-text-label-12 text-ando-fg-tertiary" aria-label={`${agent.name} is working`}>
      {/* The slot: lines roll through it vertically, with a shallow 3D tip, each centred under the agent. */}
      <span className="relative block shrink-0" style={{ width: VALUE_SLOT_W, height: VALUE_LINE_H, perspective: 420 }}>
        {steps.map((step, i) => {
          const pile: ReactNode[] | null = step.pile ?? (step.icon === "transcript" ? participants.map((actor) => <Avatar actor={actor} size={16} key={actor.name} />) : null);
          return (
            <span
              key={i}
              ref={(el) => { lineRefs.current[i] = el; }}
              className="absolute left-1/2 top-0 flex items-center gap-1.5 whitespace-nowrap"
              style={{ height: VALUE_LINE_H, opacity: 0, transformOrigin: "50% 50%" }}
            >
              <span className="ct-shimmer" style={SHIMMER_INKS}>{step.label}</span>
              {pile ? (
                <span className="inline-flex shrink-0 items-center pl-0.5">
                  {pile.map((item, index) => (
                    <span
                      key={index}
                      ref={(el) => { (itemRefs.current[i] ??= [])[index] = el; }}
                      className="-ml-1 flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-ando-bg-main first:ml-0"
                      style={{ opacity: 0 }}
                    >
                      {item}
                    </span>
                  ))}
                </span>
              ) : null}
            </span>
          );
        })}
      </span>
    </div>
  );
}
