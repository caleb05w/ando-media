// The playground's knobs — what the studio's timeline can't hold: which of
// /the-library's morphs each mark arrives by (a different one each, and
// never the film's), how a mark leaves, and whether the dots take on the
// mark's colour on the way. Kept in localStorage so a reload keeps the
// pick.

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { RESET_MS, VARIANTS, type Variant } from "../agent-typing-experience/variants";

/* ── The faces ──────────────────────────────────────────────────────── */
export const FACES = { grok: "/agents/grok.svg", claude: "/agents/claude.png", codex: "/agents/codex.png" } as const;
export type FaceKey = keyof typeof FACES;
export const FACE_KEYS: FaceKey[] = ["grok", "claude", "codex"];
export const NAMES: Record<FaceKey, string> = { grok: "Grok", claude: "Claude", codex: "Codex" };
/** Each mark's ink — the colour its dots turn — until the image is read
 *  (scene.tsx samples the real one on load). */
export const INKS: Record<FaceKey, readonly number[]> = { grok: [26, 24, 23], claude: [217, 151, 123], codex: [124, 58, 237] };

/* ── The settings ───────────────────────────────────────────────────── */
/** How a mark leaves: melts back into the resting dot (the library's own
 *  reset — the face snuffs out, the disc shrinks), or plays its own
 *  arrival backwards (the face spins out, the dots fly back to their
 *  places). */
export type Leave = "melt" | "reverse";
/** What the agent is born as: the typing dots (the film's birth), or the
 *  lone dot every change of face goes through. */
export type Start = "typing" | "dot";
/** What a change of face goes through: the lone dot (the morphs' disc
 *  track alone), or the three typing dots — the side dots flying out with
 *  the leave and back in with the arrival. */
export type Via = "dot" | "dots";
export const TEMPOS = [1, 1.5, 2, 3, 4] as const;
export type Tempo = (typeof TEMPOS)[number];
export type Settings = {
  /** The morph each mark arrives by. */
  arrive: Record<FaceKey, Variant>;
  leave: Leave;
  start: Start;
  via: Via;
  /** How many times faster than the library the morphs play — 1 is the
   *  library's own speed, the typing indicator's. */
  tempo: Tempo;
  /** The dot turns the incoming mark's colour on the way in. */
  tint: boolean;
};
/** The morphs on offer: the whole library bar the tewt demo — the v1
 *  keepers, the v2 and v3 arrivals, and the archive. */
export const ARRIVALS: Variant[] = VARIANTS.filter((v) => v.group !== "demo");
/** The film's typing indicator (context-stream/stream.ts): Orbit v2, kept
 *  for the real indicator at the film's end. Not a face's arrival here. */
export const FILM_KEYS: ReadonlySet<string> = new Set(["orbit-v2"]);
const variant = (key: string): Variant => ARRIVALS.find((v) => v.key === key) ?? ARRIVALS[0];
export const DEFAULT_SETTINGS: Settings = {
  // The typing dots become Grok exactly as in the film (context-stream/
  // agents.ts FIRST_MORPH): Slingshot v2. The others are the library's
  // quicker arrivals, so a change of face — leave, one wave of typing,
  // arrive — stays near two seconds at the library's own speed.
  arrive: { grok: variant("slingshot-v2"), claude: variant("suction-v3"), codex: variant("gulp-v3") },
  leave: "reverse",
  start: "typing",
  via: "dots",
  tempo: 1,
  tint: true,
};
/** How long `face` takes to leave, ms, at tempo. */
export const leaveMsFor = (S: Settings, face: FaceKey) => (S.leave === "melt" ? RESET_MS : S.arrive[face].morphMs) / S.tempo;
/** How long `face` takes to arrive, ms, at tempo. */
export const arriveMsFor = (S: Settings, face: FaceKey) => S.arrive[face].morphMs / S.tempo;

/* ── Persistence ────────────────────────────────────────────────────── */
// A tiny external store over localStorage, read through
// useSyncExternalStore: the server renders the defaults, the client the
// stored pick, and a change notifies every subscriber.
const KEY = "agent-morph-settings-v6";
type Stored = { arrive: Record<FaceKey, string>; leave: Leave; start: Start; via: Via; tempo: Tempo; tint: boolean };
const listeners = new Set<() => void>();
/** What was last written, for when storage is unavailable. */
let memory: string | null = null;
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const getSnapshot = (): string | null => {
  try {
    return window.localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
};
const getServerSnapshot = (): string | null => null;
function parse(raw: string | null): Settings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const stored = JSON.parse(raw) as Partial<Stored>;
    const arrive = { ...DEFAULT_SETTINGS.arrive };
    for (const face of FACE_KEYS) if (stored.arrive?.[face]) arrive[face] = variant(stored.arrive[face]);
    return {
      arrive,
      leave: stored.leave === "melt" ? "melt" : "reverse",
      start: stored.start === "dot" ? "dot" : "typing",
      via: stored.via === "dot" ? "dot" : "dots",
      tempo: TEMPOS.find((t) => t === stored.tempo) ?? DEFAULT_SETTINGS.tempo,
      tint: stored.tint ?? DEFAULT_SETTINGS.tint,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const settings = useMemo(() => parse(raw), [raw]);
  const update = useCallback((patch: Partial<Settings>) => {
    const next = { ...parse(getSnapshot()), ...patch };
    const stored: Stored = {
      arrive: { grok: next.arrive.grok.key, claude: next.arrive.claude.key, codex: next.arrive.codex.key },
      leave: next.leave,
      start: next.start,
      via: next.via,
      tempo: next.tempo,
      tint: next.tint,
    };
    memory = JSON.stringify(stored);
    try {
      window.localStorage.setItem(KEY, memory);
    } catch {
      // Nowhere to keep it; `memory` still has it for the session.
    }
    listeners.forEach((fn) => fn());
  }, []);
  return [settings, update];
}
