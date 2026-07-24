"use client";

// Shipped-state harness: the states exactly as /agent-working runs them
// today. Nothing here is a re-creation — every demo renders the
// production CornerBubble (the corner's own per-bubble component) with
// the production CSS (agent-working.css). The cards drive states; the
// pixels are single-sourced. If a state drifts on this board, it
// drifted in the product.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AGENTS, CornerBubble, CornerOverflow, type AgentDef, type RunStatus } from "../agent-working/agents";
import "../agent-working/agent-working.css";

const TADAO = AGENTS[0];

/* --------------------------------- harness --------------------------------- */

// White stage: the product corner lives on a white card, so the shipped
// states are judged on white — not the board's gray.
function Frame({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className={`flex h-20 items-center justify-center rounded-[10px] border-[0.5px] bg-white ${
        wide ? "w-56" : "w-36"
      }`}
      style={{ borderColor: "#ebe9e8" }}
    >
      {children}
    </div>
  );
}

// CornerStack's bubble, verbatim: button wrapper, 2px white gap, ping on
// done, failPulse through to RingedFace, chip-in/out lifecycle classes.
function ShippedBubble({
  status,
  agent = TADAO,
  entering = false,
  removed = false,
  ping = false,
  overlap,
  z,
  promoteDelayMs,
  quiet = false,
  onExited,
}: {
  status: RunStatus;
  agent?: AgentDef;
  entering?: boolean;
  removed?: boolean;
  ping?: boolean;
  /** Inline overlap margin, matching CornerStack's density values. */
  overlap?: number;
  /** Explicit stack layer, matching CornerStack's urgency banding. */
  z?: number;
  /** Forwarded failure staging (see RingedFace). */
  promoteDelayMs?: number;
  /** Forwarded crowded-corner completion (seal only, no pop). */
  quiet?: boolean;
  onExited?: () => void;
}) {
  // Pure prop adapter over the production CornerBubble — zero markup of
  // its own, so the board cannot drift from the corner by construction.
  return (
    <CornerBubble
      agent={agent ?? TADAO}
      status={status}
      entering={entering}
      removed={removed}
      overlapped={!!overlap}
      marginLeft={overlap ?? 0}
      z={z}
      quiet={quiet}
      ping={status === "done" && ping}
      promoteDelayMs={promoteDelayMs}
      onExitEnd={onExited}
    />
  );
}

// One run of a transition: mounts working, flips to `to` at `at`, asks
// for a remount after `hold`. The parent keys it by generation so every
// cycle starts from a clean prevStatus.
function Sequenced({
  to,
  at,
  hold,
  ping = false,
  onCycleEnd,
}: {
  to: RunStatus;
  at: number;
  hold: number;
  ping?: boolean;
  onCycleEnd: () => void;
}) {
  const [status, setStatus] = useState<RunStatus>("working");
  useEffect(() => {
    const flip = setTimeout(() => setStatus(to), at);
    const end = setTimeout(onCycleEnd, at + hold);
    return () => {
      clearTimeout(flip);
      clearTimeout(end);
    };
  }, [to, at, hold, onCycleEnd]);
  return <ShippedBubble status={status} ping={ping} />;
}

function useGeneration() {
  const [gen, setGen] = useState(0);
  const bump = useCallback(() => setGen((g) => g + 1), []);
  return { gen, bump };
}

/* ---------------------------------- demos ---------------------------------- */

// Arrive: the 880ms condensation, replayed.
export function ShippedArrive() {
  const { gen, bump } = useGeneration();
  useEffect(() => {
    const t = setTimeout(bump, 2600);
    return () => clearTimeout(t);
  }, [gen, bump]);
  return (
    <Frame>
      <ShippedBubble key={gen} status="working" entering />
    </Frame>
  );
}

// Working: the comet in all three hue modes — brand blue (default),
// the portrait tone, and the spec amber (the page-level hue classes,
// applied here to local wrappers).
export function ShippedWorking() {
  return (
    <Frame>
      <div className="flex items-center gap-3">
        <ShippedBubble status="working" />
        <span className="aw-hue-portrait inline-flex">
          <ShippedBubble status="working" />
        </span>
        <span className="aw-hue-amber inline-flex">
          <ShippedBubble status="working" />
        </span>
      </div>
    </Frame>
  );
}

// Completed: seal draws green, the pop, the ping — then a clean restart.
export function ShippedCompleted() {
  const { gen, bump } = useGeneration();
  return (
    <Frame>
      <Sequenced key={gen} to="done" at={1800} hold={3000} ping onCycleEnd={bump} />
    </Frame>
  );
}

// Failed: shake, red seal, then the throb breathes until the remount —
// the state that asks for you.
export function ShippedFailed() {
  const { gen, bump } = useGeneration();
  return (
    <Frame>
      <Sequenced key={gen} to="failed" at={1800} hold={4600} onCycleEnd={bump} />
    </Frame>
  );
}

// Stopped: same shake and red seal, but still afterwards — your own act
// doesn't call for attention.
export function ShippedStopped() {
  const { gen, bump } = useGeneration();
  return (
    <Frame>
      <Sequenced key={gen} to="stopped" at={1800} hold={3400} onCycleEnd={bump} />
    </Frame>
  );
}

// Completion wave — three finishes land in quick succession: each seals
// quietly (no pop, no ping once the wave forms), the green holds a
// beat, and the wave departs TOGETHER — one exhale, not a drip of
// separate goodbyes. Compare with the solo Completed card above.
function WaveCycle({ onCycleEnd }: { onCycleEnd: () => void }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    // Finishes at 1.2/1.6/2.0s; shared depart at 3.6s; remount at 6s —
    // comfortably past the 1.6s mist (a remount mid-exit amputates the
    // glide; it happened once at 4.9s and the survivor never traveled).
    const timers = [1200, 1600, 2000, 3600].map((at, index) =>
      window.setTimeout(() => setTick(index + 1), at),
    );
    const end = window.setTimeout(onCycleEnd, 6000);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(end);
    };
  }, [onCycleEnd]);
  const leaving = tick >= 4;
  return (
    // Right-anchored like the corner itself: the stack hangs from the
    // row's right edge, so when the wave's slots close, the surviving
    // worker glides down the track toward the anchor — a left-aligned
    // stage structurally cannot show that travel.
    <div className="flex items-center justify-end" style={{ width: 96 }}>
      {/* Production display-rank banding: a finish changes ink, never
          geometry — lingering greens keep the working band's z, so no
          seal ever pops the stacking. Leftmost-on-top throughout. */}
      <ShippedBubble agent={TADAO} status="working" quiet z={20} />
      {AGENTS.slice(1, 4).map((agent, index) => {
        const done = tick >= index + 1;
        return (
          <ShippedBubble
            key={agent.id}
            agent={agent}
            status={done ? "done" : "working"}
            overlap={-8}
            removed={leaving}
            quiet
            z={20 - (index + 1)}
          />
        );
      })}
    </div>
  );
}

export function ShippedCompletionWave() {
  const { gen, bump } = useGeneration();
  return (
    <Frame wide>
      <WaveCycle key={gen} onCycleEnd={bump} />
    </Frame>
  );
}

// Failure promotion — the one reorder that animates. Three agents work;
// the rightmost fails and travels to the requires-action front in the
// Dynamic Island grammar (560ms spring, 1.07 lift, carried on its top
// z) while neighbors slide plainly (300ms). Production spring values.
function PromotionCycle({ onCycleEnd }: { onCycleEnd: () => void }) {
  const victim = AGENTS[2]; // Yumi
  const others = [TADAO, AGENTS[1]];
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const flip = setTimeout(() => setFailed(true), 1700);
    const end = setTimeout(onCycleEnd, 1700 + 3600);
    return () => {
      clearTimeout(flip);
      clearTimeout(end);
    };
  }, [onCycleEnd]);

  const order = failed ? [victim, ...others] : [...others, victim];
  const rowRef = useRef<HTMLDivElement>(null);
  const lefts = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (const el of row.querySelectorAll<HTMLElement>("[data-agent-id]")) {
      const id = el.dataset.agentId;
      if (!id) continue;
      const left = el.offsetLeft;
      const prev = lefts.current.get(id);
      if (!reduceMotion && failed && prev != null && prev !== left) {
        const dx = prev - left;
        if (id === victim.id) {
          el.animate(
            [
              { transform: `translateX(${dx}px) scale(1)` },
              { transform: `translateX(${dx * 0.35}px) scale(1.07)`, offset: 0.55 },
              { transform: "translateX(0) scale(1)" },
            ],
            { duration: 560, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
          );
        } else {
          el.animate(
            [{ transform: `translateX(${dx}px)` }, { transform: "translateX(0)" }],
            { duration: 300, easing: "cubic-bezier(0.2, 0, 0, 1)" },
          );
        }
      }
      lefts.current.set(id, left);
    }
  });

  return (
    <div ref={rowRef} className="flex items-center">
      {order.map((agent, index) => {
        const isVictim = agent.id === victim.id;
        const status: RunStatus = isVictim && failed ? "failed" : "working";
        return (
          <div key={agent.id} data-agent-id={agent.id} className="flex">
            <ShippedBubble
              agent={agent}
              status={status}
              overlap={index > 0 ? -8 : 0}
              z={(status === "failed" ? 4 : 2) * 10 - index}
              promoteDelayMs={560}
            />
          </div>
        );
      })}
    </div>
  );
}

export function ShippedPromotion() {
  const { gen, bump } = useGeneration();
  return (
    <Frame wide>
      <PromotionCycle key={gen} onCycleEnd={bump} />
    </Frame>
  );
}

// Truncation at the cap: four slots, mirroring the flyout's four-row
// window — eight agents render as three bubbles plus the +5 disc.
// Production RingedFace, production OverflowDisc. The demo crowd swells
// and thins so the +N dial rolls both directions in situ.
const TRUNC_COUNTS = [5, 6, 7, 4];
export function ShippedTruncation() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(
      () => setStep((current) => (current + 1) % TRUNC_COUNTS.length),
      1600,
    );
    return () => window.clearInterval(id);
  }, []);
  return (
    <Frame wide>
      <div className="flex items-center">
        {AGENTS.slice(0, 3).map((agent, index) => (
          <ShippedBubble
            key={agent.id}
            agent={agent}
            status="working"
            overlap={index > 0 ? -8 : 0}
            z={20 - index}
          />
        ))}
        <CornerOverflow count={TRUNC_COUNTS[step]} marginLeft={-8} />
      </div>
    </Frame>
  );
}

// Depart: the G6 mist, in the minimal honest pair — one worker stays,
// the rightmost dissolves. Right-anchored like the corner, so the demo
// shows BOTH halves of the current gesture: the departing face riding
// its collapsing slot rightward as it evaporates, and the neighbor
// flowing right with it from frame zero. A solo bubble on a centered
// stage could show neither.
function DepartOnce({ onExited }: { onExited: () => void }) {
  const [removed, setRemoved] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRemoved(true), 1600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex items-center justify-end" style={{ width: 52 }}>
      <ShippedBubble agent={TADAO} status="working" z={20} />
      <ShippedBubble
        agent={AGENTS[1]}
        status="working"
        overlap={-8}
        z={19}
        removed={removed}
        onExited={onExited}
      />
    </div>
  );
}

export function ShippedDepart() {
  const { gen, bump } = useGeneration();
  const rest = useCallback(() => {
    setTimeout(bump, 500);
  }, [bump]);
  return (
    <Frame>
      <DepartOnce key={gen} onExited={rest} />
    </Frame>
  );
}
