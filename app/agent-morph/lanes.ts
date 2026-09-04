// The playground's lanes — a marker per beat, a bar per change of face.
// Dragging a beat carries every beat after it, so the pacing between
// moments survives a move; a bar's right grip sets how long the dots type
// between the leave and the arrival, in whole waves — so both morphs meet
// the wave on its beat.

import type { Lane } from "../../lib/timeline-studio/studio";
import { WAVE_MS } from "../agent-typing-experience/variants";
import { LABELS, ORDER, type Timing } from "./timing";

const snap = (v: number) => Math.round(v * 100) / 100;
/** One typing wave, s — the gap's grid. */
const STEP = WAVE_MS / 1000;

/** Which beats are bars, and where their gap lives. */
const GAP: Partial<Record<keyof Timing, keyof Timing>> = { claude: "claudeGap", codex: "codexGap" };
export type BarKey = "claude" | "codex";

/** What each beat drives, for the studio's spotlight. */
const TARGETS: Partial<Record<keyof Timing, string[]>> = {
  agent: ["[data-am=indicator]"],
  grok: ["[data-am=indicator]", "[data-am=label]"],
  claude: ["[data-am=indicator]", "[data-am=label]"],
  codex: ["[data-am=indicator]", "[data-am=label]"],
};

const hold = (gap: number) => {
  const n = Math.round(gap / STEP);
  return n === 0 ? "no typing" : `${n} wave${n === 1 ? "" : "s"}`;
};

/** `fixed`: each bar's leave plus arrival, s — the settings'. */
export function lanesFor(fixed: Record<BarKey, number>): Lane<Timing>[] {
  return ORDER.map((key, index) => {
    const gap = GAP[key];
    const base = gap ? fixed[key as BarKey] : 0;
    return {
      key,
      label: LABELS[key],
      kind: gap ? "bar" : "marker",
      start: (T) => T[key],
      length: gap ? (T) => base + T[gap] : undefined,
      editStart: (T, dt) => {
        const floor = index > 0 ? T[ORDER[index - 1]] : 0;
        const applied = Math.max(dt, floor - T[key]);
        const out: Partial<Timing> = {};
        for (let i = index; i < ORDER.length; i += 1) out[ORDER[i]] = snap(T[ORDER[i]] + applied);
        return out;
      },
      editLength: gap ? (T, dt) => ({ [gap]: snap(Math.max(0, Math.round((T[gap] + dt) / STEP) * STEP)) }) as Partial<Timing> : undefined,
      title: (T) => (gap ? `${LABELS[key]} · ${T[key].toFixed(2)}s · ${hold(T[gap])} · ${(base + T[gap]).toFixed(2)}s` : `${LABELS[key]} · ${T[key].toFixed(2)}s`),
      caption: gap ? (T) => hold(T[gap]) : undefined,
      targets: TARGETS[key],
    };
  });
}

export const totalFor = (T: Timing) => T.end;
