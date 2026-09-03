// The film's lanes — one marker per beat. Dragging a beat carries every
// beat after it, so the pacing between moments survives a move.

import type { Lane } from "../../lib/timeline-studio/studio";
import { LABELS, ORDER, type Timing } from "./timing";

const snap = (v: number) => Math.round(v * 100) / 100;

/** What each beat drives, for the studio's spotlight. */
const TARGETS: Partial<Record<keyof Timing, string[]>> = {
  gather: ["[data-cs=card]"],
  stream: ["[data-cs=caption]"],
  pan: ["[data-cs=card]"],
  agent: ["[data-cs=title-1]"],
  card: ["[data-cs=agent-card]"],
  indicator: ["[data-cs=indicator]"],
  iface: ["[data-cs=title-2]", "[data-cs=composer]"],
  chat: ["[data-cs=header]", "[data-cs=transcript]"],
  sidebar: ["[data-cs=sidebar]"],
  typing: ["[data-cs=composer]"],
  sara: ["[data-row=sara]"],
  ask: ["[data-cs=composer]"],
  send: ["[data-row=ask]"],
  reply: ["[data-row=reply]"],
  logo: ["[data-cs=logo]"],
};

export function lanesFor(): Lane<Timing>[] {
  return ORDER.map((key, index) => ({
    key,
    label: LABELS[key],
    kind: "marker",
    start: (T) => T[key],
    editStart: (T, dt) => {
      const floor = index > 0 ? T[ORDER[index - 1]] : 0;
      const applied = Math.max(dt, floor - T[key]);
      const out: Partial<Timing> = {};
      for (let i = index; i < ORDER.length; i += 1) out[ORDER[i]] = snap(T[ORDER[i]] + applied);
      return out;
    },
    title: (T) => `${LABELS[key]} · ${T[key].toFixed(2)}s`,
    targets: TARGETS[key],
  }));
}

export const totalFor = (T: Timing) => T.end;
