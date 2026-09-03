"use client";

// Tadao's trace — the product's one-line TraceHeader (agent-live-trace) wearing
// the library's copy: the activity shimmers while the run is live and names
// what is being ingested, with the sources piled inline. Running, it sits
// under the message that asked; done, it moves under the agent's reply and
// reads "Worked for Ns" — the duration alone. No chevron, no Stop: the line is
// a label here, not a disclosure.

import { Avatar } from "./chrome";
import "../the-library/agent-context-trace.css";
import type { Actor } from "./scenes";

/** A run's steps on the stage clock — one per trace beat — and when it ended. */
export type TracePhases = { start: number; steps: Array<{ t: number; label: string; icon: "read" | "write" | "transcript" | null }>; done: number };

/** The light shimmer inks from .ct-light, without the card's ring. */
const SHIMMER_INKS = { ["--ct-shimmer-lo" as string]: "rgba(88, 82, 78, 0.45)", ["--ct-shimmer-hi" as string]: "#58524e" };

export function TraceLine({ agent, participants, phases, vt, onReply }: { agent: Actor; participants: Actor[]; phases: TracePhases; vt: number; /** rendered under the agent's own reply — the name drops, the run is over */ onReply: boolean }) {
  const done = vt >= phases.done;
  const elapsed = Math.max(1, Math.floor((done ? phases.done : vt) - phases.start));
  const step = [...phases.steps].reverse().find((candidate) => candidate.t <= vt) ?? phases.steps[0];
  const reading = step?.icon === "transcript";
  const status = step?.label ?? "Starting agent session";
  return (
    <div className="min-w-0 max-w-full overflow-hidden pt-1" data-agent-trace data-trace-state={done ? "done" : "running"}>
      <div className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden kanso-text-label-12">
        <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden text-ando-fg-tertiary">
          {onReply ? null : <span className="kanso-text-label-11-md shrink-0 text-ando-fg-secondary">{agent.name}</span>}
          {/* Live, the shimmering activity carries the line; the duration only appears once it is over. */}
          {done ? <span className="shrink-0 tabular-nums">{`Worked for ${elapsed}s`}</span> : null}
          {/* Done reads as the duration alone — no tool line. */}
          {done ? null : (
            <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 truncate">
              {/* The library's thinking shimmer on the product's activity slot. */}
              <span className="ct-shimmer truncate" style={SHIMMER_INKS}>{status}</span>
              {reading ? (
                <span className="ct-pop inline-flex shrink-0 items-center pl-0.5">
                  {participants.map((actor, index) => (
                    <span key={actor.name} className="ct-pop -ml-1 flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-ando-bg-main first:ml-0" style={{ animationDelay: `${index * 70}ms` }}>
                      <Avatar actor={actor} size={16} />
                    </span>
                  ))}
                </span>
              ) : null}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
