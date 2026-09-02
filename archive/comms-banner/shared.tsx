"use client";

// Shared grammar for the banner takes: the cast, the loop harness, and
// the message-row primitives. Lives apart from the takes so the landing
// page can mount a take without dragging the whole exploration along.

import { useEffect, useState, useSyncExternalStore } from "react";
import "./comms-banner.css";

export type Person = { name: string; avatar: string; agent?: boolean };

export const SARA: Person = { name: "Sara", avatar: "/avatars/sara.png" };
export const OLI: Person = { name: "Oli", avatar: "/avatars/oli.png" };
export const AJ: Person = { name: "AJ", avatar: "/avatars/aj.png" };
export const TADAO: Person = { name: "Tadao", avatar: "/avatars/agent-2.png", agent: true };

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/** Phase counter on timeouts. beats: [phase, at-ms]; phase -1 = exhale.
 *  Reduced motion holds finalPhase — derived, never set from the effect. */
export function useLoop(beats: [number, number][], cycle: number, finalPhase: number) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const [out, setOut] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const timers = new Set<number>();
    const schedule = () => {
      for (const [p, at] of beats) {
        timers.add(
          window.setTimeout(() => {
            if (p < 0) setOut(true);
            else setPhase(p);
          }, at),
        );
      }
      timers.add(
        window.setTimeout(() => {
          setOut(false);
          setPhase(0);
          schedule();
        }, cycle),
      );
    };
    schedule();
    return () => timers.forEach((t) => window.clearTimeout(t));
    // beats/cycle are per-take constants defined at module scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return {
    phase: reduced ? finalPhase : phase,
    out: reduced ? false : out,
  };
}

export type Segment = string | { mark: string; lit: boolean };

export function Row({
  who,
  time,
  shown,
  children,
  text,
}: {
  who: Person;
  time: string;
  shown: boolean;
  text: Segment[];
  children?: React.ReactNode;
}) {
  return (
    <div className={`cb-slot${shown ? "" : " is-hidden"}`}>
      <div className="cb-slot-inner">
        <div className="cb-row">
          <img className="cb-face" src={who.avatar} alt="" />
          <div className="cb-body">
            <div className="cb-meta">
              <span className={`cb-name${who.agent ? " is-agent" : ""}`}>
                {who.name}
              </span>
              <span className="cb-time">{time}</span>
            </div>
            <p className="cb-text">
              {text.map((seg, i) =>
                typeof seg === "string" ? (
                  <span key={i}>{seg}</span>
                ) : (
                  <span key={i} className={`cb-mark${seg.lit ? " is-lit" : ""}`}>
                    {seg.mark}
                  </span>
                ),
              )}
            </p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Chip({ shown }: { shown: boolean }) {
  return (
    <div className="cb-react">
      <span className={`cb-chip${shown ? "" : " is-hidden"}`}>
        👍 <b>1</b>
      </span>
    </div>
  );
}

export function Tag({ children }: { children: string }) {
  return <div className="cb-tag">{children}</div>;
}
