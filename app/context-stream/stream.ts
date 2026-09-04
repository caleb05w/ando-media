// The dot field — the first beats, as pure functions of the clock.
//
// A cloud of dots (messages, docs, files, images) drifts over the stage
// and pulls into one line — and as it does, the camera starts to move:
// the line streams left under it as it forms, one motion. More dots curve
// in from off-frame, right to left, and join it. The agent is born out of
// the dots at centre stage — where it stays, the trace reading beneath it
// — and the stream never halts: it keeps pouring into the agent until the
// line is gone. Every
// position here is a function of (timing, vt) and a per-dot constant fixed
// at module load, so scrubbing backwards puts every dot exactly where it
// was.

import { VARIANTS } from "../agent-typing-experience/variants";
import type { Timing } from "./timing";

/* ── The stage, in design pixels; the page scales it to fit. ───────── */
export const STAGE = { w: 1280, h: 800 } as const;
/** Where the line sits — the composer inherits this exact y. */
export const LINE_Y = 430;
/** The focus frame: wide in the cloud, tighter once the dots seat. */
export const FRAME_CLOUD = { x: 120, y: 140, w: 1040, h: 580 } as const;
export const FRAME_TIGHT = { x: 240, y: 84, w: 800, h: 676 } as const;
/** The window is the tight frame, and widens to the left for the sidebar. */
export const CARD = FRAME_TIGHT;
export const SIDEBAR_W = 354;
export const PANE_W = CARD.w;
export const CARD_WIDE = { x: 63, w: PANE_W + SIDEBAR_W } as const;
/** Centre stage — where the agent is born, on the line, and stays; the
 *  trace reads beneath it. */
export const CENTER_X = STAGE.w / 2;
export const AGENT_X = CENTER_X;
export const DOT_R = 2.5;
/** The agent is one of /the-library's typing indicators, at rest — the face
 *  in its disc — drawn at twice the shelf's 120px. Swap the key for another
 *  study (see app/agent-typing-experience/variants.ts: slingshot, suction,
 *  orbit, rhythm, gulp, each in v1/v2/v3). Its disc's radius on screen sets
 *  where a dot is eaten. */
export const INDICATOR_KEY = "orbit-v2";
export const INDICATOR = VARIANTS.find((v) => v.key === INDICATOR_KEY) ?? VARIANTS[0];
export const INDICATOR_PX = 240;
export const AGENT_R = INDICATOR.morph(INDICATOR.morphMs).blob.r * (INDICATOR_PX / 60);

/* ── Curves ─────────────────────────────────────────────────────────── */
export const clamp01 = (p: number) => Math.min(1, Math.max(0, p));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** The house ease. */
export const ease = (p: number) => 1 - Math.pow(1 - clamp01(p), 2.2);
/** In and out — for a camera move. */
export const smooth = (p: number) => {
  const q = clamp01(p);
  return q * q * (3 - 2 * q);
};
/** Overshoot and settle, for something that lands. */
export const backOut = (p: number) => {
  const s = 1.4;
  const q = clamp01(p) - 1;
  return q * q * ((s + 1) * q + s) + 1;
};
/** 0→1 over `dur` seconds from `from`. */
export const seg = (vt: number, from: number, dur: number) => clamp01((vt - from) / Math.max(0.001, dur));

/* ── Seeded constants ───────────────────────────────────────────────── */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Dot = {
  /** Where it floats in the cloud. */
  cx: number;
  cy: number;
  phase: number;
  phase2: number;
  /** How near it is, 0 far → 1 near: near dots are big, bold, quick. */
  z: number;
  /** Its own drift, px/s. */
  vx: number;
  vy: number;
  /** Which seat on the line it takes — several dots share one, spread a little. */
  slot: number;
  /** Its own offset from the seat, and from the line: the stream is a band, not a wire. */
  dx: number;
  dy: number;
  /** Its stagger, fixed: when in the gather it starts to move. */
  d: number;
};

type Flow = {
  fromAbove: boolean;
  ox: number;
  oy: number;
  /** Where it joins the line. */
  tx: number;
  /** Stagger jitter. */
  order: number;
  /** Its size — particles vary. */
  r: number;
  /** Its offset from the line. */
  dy: number;
};

/** How far off the line a dot may sit — the stream's thickness, either way. */
const LINE_FAT = 8;

const SLOTS = 21;
const slotX = (i: number) => FRAME_TIGHT.x + 48 + (i * (FRAME_TIGHT.w - 96)) / (SLOTS - 1);

const rng = mulberry32(7);
const DOT_COUNT = 96;
const perm = Array.from({ length: DOT_COUNT }, (_, i) => i);
for (let i = perm.length - 1; i > 0; i -= 1) {
  const j = Math.floor(rng() * (i + 1));
  [perm[i], perm[j]] = [perm[j], perm[i]];
}
export const DOTS: Dot[] = Array.from({ length: DOT_COUNT }, (_, i) => {
  const inside = rng() < 0.72;
  let cx: number;
  let cy: number;
  if (inside) {
    cx = FRAME_CLOUD.x + 28 + rng() * (FRAME_CLOUD.w - 56);
    cy = FRAME_CLOUD.y + 28 + rng() * (FRAME_CLOUD.h - 56);
  } else {
    // Outside the frame: in the bands above and below it, or the margins.
    const band = rng();
    if (band < 0.4) { cx = 40 + rng() * (STAGE.w - 80); cy = 24 + rng() * (FRAME_CLOUD.y - 48); }
    else if (band < 0.8) { cx = 40 + rng() * (STAGE.w - 80); cy = FRAME_CLOUD.y + FRAME_CLOUD.h + 24 + rng() * (STAGE.h - FRAME_CLOUD.y - FRAME_CLOUD.h - 48); }
    else { cx = rng() < 0.5 ? 30 + rng() * 70 : STAGE.w - 100 + rng() * 70; cy = 40 + rng() * (STAGE.h - 80); }
  }
  const z = rng() ** 1.4;
  const heading = rng() * Math.PI * 2;
  const speed = (6 + 22 * z) * (0.6 + 0.8 * rng());
  return { cx, cy, phase: rng() * Math.PI * 2, phase2: rng() * Math.PI * 2, z, vx: Math.cos(heading) * speed, vy: Math.sin(heading) * speed, slot: perm[i] % SLOTS, dx: (rng() - 0.5) * 40, dy: (rng() - 0.5) * 2 * LINE_FAT, d: rng() };
});

/** The cloud in depth: a dot's size and ink by how near it is. */
const cloudR = (z: number) => DOT_R * (0.45 + 1.25 * z);
const cloudA = (z: number) => 0.22 + 0.78 * z;

// Inflows — a crowd of them, from off-frame above and below in turn, into
// the gaps between seats (each gap taken more than once, at different
// offsets). All of them have landed by the time the agent is eating, so
// nothing straggles.
const FLOW_COUNT = 30;
const FLOW_DUR = 0.7;
const gaps = Array.from({ length: FLOW_COUNT }, (_, i) => i % (SLOTS - 1));
for (let i = gaps.length - 1; i > 0; i -= 1) {
  const j = Math.floor(rng() * (i + 1));
  [gaps[i], gaps[j]] = [gaps[j], gaps[i]];
}
export const FLOWS: Flow[] = gaps.map((gap, i) => {
  const fromAbove = i % 2 === 0;
  const pitch = slotX(gap + 1) - slotX(gap);
  const tx = slotX(gap) + pitch * (0.25 + 0.5 * rng());
  // From the right, like the stream.
  const ox = Math.min(STAGE.w + 60, tx + 150 + rng() * 220);
  const oy = fromAbove ? -30 : STAGE.h + 30;
  return { fromAbove, ox, oy, tx, order: rng(), r: DOT_R * (0.75 + 0.5 * rng()), dy: (rng() - 0.5) * 2 * LINE_FAT };
});

/* ── The line as a stream ───────────────────────────────────────────── */
const SPAN0 = FRAME_TIGHT.x + 24;
const SPAN1 = FRAME_TIGHT.x + FRAME_TIGHT.w - 24;
const FADE = 44;
/** The stream's own flow, px/s, from `line` on — leftward, like the camera. */
const DRIFT = -16;
/** The camera: it starts with the gather, comes up to speed over RAMP_UP,
 *  cruises through the agent's birth, and from just after it eases off
 *  over a long RAMP_DOWN — so the stream decelerates into the agent, the
 *  last dots arriving slowly, rather than feeding it at one speed. */
const CAM_V = 900;
const RAMP_UP = 0.6;
const RAMP_DOWN = 0.9;
const CRUISE_PAST_AGENT = 0.2;
/** The agent's pull on the stream — px/s², from EAT_LEAD before `agent` —
 *  so the whole line is in it by the time its face has formed: the stream
 *  consolidates into the agent, all of it, as one motion. */
const PULL = 1700;
const EAT_LEAD = 0.45;
const eatFrom = (T: Timing) => T.agent - EAT_LEAD;
/** A dot pouring into the agent streaks: its trail, px per px/s of speed, and its cap. */
const STREAK = 0.012;
const STREAK_MAX = 26;
/** How long a landing rings the disc. */
const PULSE = 0.22;
/** The agent's birth: the dots nearest centre stage peel off this long
 *  before `agent`, pack into a swirling disc-shaped cluster, and close onto
 *  the agent as it grows inside them. */
const SEED_COUNT = 34;
const SEED_LEAD = 0.8;
const SEED_GATHER = 0.42;
/** Seeds come by preference from the stretch already past the agent —
 *  which would only flow away — so the birth leaves no hole in the
 *  stream still to come. */
const SEED_AHEAD_COST = 2.2;
const SEED_SPIN = 1.6;
const GOLDEN = 2.399963;

/** The camera's x at `vt`. Smoothstep ramps, integrated in closed form. */
export function camX(T: Timing, vt: number) {
  const t0 = T.gather;
  const t1 = Math.max(t0 + RAMP_UP, T.agent + CRUISE_PAST_AGENT);
  if (vt <= t0) return 0;
  const u = clamp01((vt - t0) / RAMP_UP);
  const up = CAM_V * RAMP_UP * (u * u * u - (u * u * u * u) / 2);
  const cruise = CAM_V * Math.max(0, Math.min(vt, t1) - (t0 + RAMP_UP));
  const w = clamp01((vt - t1) / RAMP_DOWN);
  const down = CAM_V * RAMP_DOWN * (w - w * w * w + (w * w * w * w) / 2);
  return up + cruise + down;
}
const drift = (T: Timing, vt: number) => DRIFT * Math.max(0, vt - T.line);
const pull = (T: Timing, vt: number) => {
  const u = Math.max(0, vt - eatFrom(T));
  return 0.5 * PULL * u * u;
};

/** A dot is eaten when it is this far into the disc. */
const EAT_R = AGENT_R * 0.6;

function wrapX(x: number) {
  const L = SPAN1 - SPAN0;
  return SPAN0 + ((((x - SPAN0) % L) + L) % L);
}
const edgeAlpha = (x: number) => clamp01(Math.min((x - SPAN0) / FADE, (SPAN1 - x) / FADE));

/** The first `t` in [lo, hi] where `f` turns non-negative, `f` monotone. */
function bisect(f: (t: number) => number, lo: number, hi: number) {
  for (let i = 0; i < 28; i += 1) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** A mark riding the line: seated on screen at `x0` at `t0`, where is it at
 *  `vt`, and when is it eaten? Before the agent the line is endless — it
 *  wraps under the camera. From the agent on it keeps the same leftward
 *  motion, unwrapped, and is eaten when it reaches the disc. */
function ride(T: Timing, vt: number, x0: number, t0: number): { x: number; eatenAt: number | null; tA: number; v: number } {
  const pre = (t: number) => wrapX(x0 + drift(T, t) - drift(T, t0) - (camX(T, t) - camX(T, t0)));
  const tE = eatFrom(T);
  if (vt < tE) return { x: pre(vt), eatenAt: null, tA: tE, v: 0 };
  const tA = Math.max(t0, tE);
  const xA = t0 >= tE ? x0 : pre(tE);
  const at = (t: number) => xA + drift(T, t) - drift(T, tA) - (camX(T, t) - camX(T, tA)) - (pull(T, t) - pull(T, tA));
  // Streaming left into the disc's right edge; a mark already past it is inside.
  const gap = (t: number) => (AGENT_X + EAT_R) - at(t);
  const eatenAt = gap(tA) >= 0 ? tA : bisect(gap, tA, tA + 6);
  const dt = 1 / 120;
  return { x: at(vt), eatenAt, tA, v: (at(vt) - at(vt - dt)) / dt };
}

function bezier(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

export type Mark = { x: number; y: number; a: number; r: number; /** a streak trailing against its motion: the trail's end is at x + sx */ sx?: number };
export type Field = {
  marks: Mark[];
  /** How much of the stream the agent has eaten, 0→1. */
  eaten: number;
  /** The disc's ring, from the dots landing in it. */
  pulse: number;
  /** When the last dot went in — the line is empty from here. */
  fullAt: number | null;
};

/** Which marks seed the agent: the ones nearest the birth point when the
 *  birth begins, by their seat — the ones ahead of it costing more. Pure
 *  in the timing, so it scrubs. */
function seedRanks(T: Timing): Map<string, number> {
  const tSeed = T.agent - SEED_LEAD;
  const cost = (x: number) => (x > AGENT_X ? (x - AGENT_X) * SEED_AHEAD_COST : AGENT_X - x);
  const near: Array<{ id: string; dist: number }> = [];
  DOTS.forEach((dot, i) => near.push({ id: `d${i}`, dist: cost(ride(T, tSeed, slotX(dot.slot) + dot.dx, T.gather).x) }));
  const window = Math.max(0.3, eatFrom(T) - 0.1 - FLOW_DUR - T.stream);
  FLOWS.forEach((flow, i) => {
    const arrive = T.stream + ((i + flow.order * 0.6) / FLOW_COUNT) * window + FLOW_DUR;
    if (arrive <= tSeed) near.push({ id: `f${i}`, dist: cost(ride(T, tSeed, flow.tx, arrive).x) });
  });
  near.sort((a, b) => a.dist - b.dist);
  return new Map(near.slice(0, SEED_COUNT).map((n, rank) => [n.id, rank]));
}

/** Every dot at `vt`, and what the agent has made of them. */
export function fieldAt(T: Timing, vt: number): Field {
  const marks: Mark[] = [];
  let total = 0;
  let eatenCount = 0;
  let pulse = 0;
  let fullAt: number | null = null;
  const gatherDur = Math.max(0.5, T.line - T.gather);
  const tSeed = T.agent - SEED_LEAD;
  const seeds = vt >= tSeed ? seedRanks(T) : null;

  // A seed: a mark that becomes the agent. The stream around the birth
  // point collapses into a sunflower-packed disc — all of it at once, drawn
  // in and tightening — that turns slowly; then the disc closes onto the
  // agent growing inside it, and the particles are what it is made of.
  const seeded = (rank: number, x0: number, t0: number, r: number, dy: number): Mark | null => {
    total += 1;
    const snap = ease(seg(vt, T.agent - 0.35, 0.4));
    if (snap >= 1) {
      eatenCount += 1;
      return null;
    }
    const p = smooth(seg(vt, tSeed + rank * 0.004, SEED_GATHER));
    const ring = AGENT_R * (0.25 + 0.7 * Math.sqrt((rank + 0.5) / SEED_COUNT)) * (1 - snap) * (1.4 - 0.4 * p);
    const angle = rank * GOLDEN + SEED_SPIN * (vt - tSeed);
    const ax = AGENT_X;
    const here = ride(T, Math.min(vt, T.agent), x0, t0).x;
    return { x: lerp(here, ax + ring * Math.cos(angle), p), y: lerp(LINE_Y + dy, LINE_Y + ring * Math.sin(angle), p), a: 1 - snap, r: r * (1 + 0.3 * p) };
  };

  // A seated mark: riding, then eaten. Returns nothing once it is inside.
  // Rushing in it streaks, and bends a little off the line — a current
  // pouring into the agent, not beads on a wire.
  const seated = (id: string, x0: number, t0: number, r: number, d: number, dy: number): Mark | null => {
    const rank = seeds?.get(id);
    if (rank != null) return seeded(rank, x0, t0, r, dy);
    total += 1;
    const { x, eatenAt, tA, v } = ride(T, vt, x0, t0);
    if (eatenAt != null) fullAt = fullAt == null ? eatenAt : Math.max(fullAt, eatenAt);
    if (eatenAt != null && vt >= eatenAt) {
      eatenCount += 1;
      pulse += Math.sin(Math.PI * seg(vt, eatenAt, PULSE));
      return null;
    }
    if (eatenAt == null) return { x, y: LINE_Y + dy, a: edgeAlpha(x), r };
    const along = clamp01((vt - tA) / Math.max(0.05, eatenAt - tA));
    const y = LINE_Y + dy * (1 - along) - Math.sin(Math.PI * along) * 12 * (d - 0.5);
    // Into the disc: the last few px shrink, so the landing reads as a swallow.
    const near = clamp01(1 - (Math.abs(x - AGENT_X) - EAT_R) / 14);
    // The streak trails against the motion, whichever way it is going.
    const trail = Math.max(-STREAK_MAX, Math.min(STREAK_MAX, -v * STREAK));
    return { x, y, a: edgeAlpha(x), r: r * (1 - 0.5 * near), sx: trail * along };
  };

  // The cloud: the camera pushes in on it from the first frame to `line`,
  // and the near dots spread faster than the far ones — depth. Each dot
  // appears in its own moment, drifts on its own heading and jitters,
  // the near ones most; the gather brings every one up to the line's own
  // size and ink.
  const push = lerp(0.78, 1, ease(seg(vt, 0, T.line)));
  const tCloud = Math.min(vt, T.line);
  DOTS.forEach((dot, i) => {
    const p = ease(seg(vt, T.gather + dot.d * 0.4 * gatherDur, 0.6 * gatherDur));
    // The seat is already moving — the line streams left as it forms.
    const seat = seated(`d${i}`, slotX(dot.slot) + dot.dx, T.gather, DOT_R, dot.d, dot.dy);
    if (!seat) return;
    if (p >= 1) {
      marks.push(seat);
      return;
    }
    const wander = (1 - p) * (7 + 15 * dot.z);
    const jx = Math.sin(vt * 1.9 + dot.phase) * wander + Math.sin(vt * 4.3 + dot.phase2) * wander * 0.35;
    const jy = Math.cos(vt * 1.5 + dot.phase * 1.3) * wander + Math.cos(vt * 3.7 + dot.phase2) * wander * 0.35;
    const par = 1 + (push - 1) * (0.4 + 0.9 * dot.z);
    const cx = CENTER_X + (dot.cx + dot.vx * tCloud + jx - CENTER_X) * par;
    const cy = STAGE.h / 2 + (dot.cy + dot.vy * tCloud + jy - STAGE.h / 2) * par;
    const appear = ease(seg(vt, 0.1 + (dot.phase / (Math.PI * 2)) * 0.8, 0.5));
    const x = lerp(cx, seat.x, p);
    // A touch of arc so the gather reads as a flock, not a tween.
    const y = lerp(cy, LINE_Y + dot.dy, p) - Math.sin(Math.PI * p) * 22 * (dot.d - 0.5);
    const a = lerp(appear * cloudA(dot.z), seat.a, p);
    if (a > 0.005) marks.push({ x, y, a, r: lerp(cloudR(dot.z), DOT_R, p) });
  });

  // Every inflow has landed on the line before the pull begins: nothing
  // arrives late to straggle in behind the rest.
  const window = Math.max(0.3, eatFrom(T) - 0.1 - FLOW_DUR - T.stream);
  FLOWS.forEach((flow, i) => {
    const start = T.stream + ((i + flow.order * 0.6) / FLOW_COUNT) * window;
    const q = seg(vt, start, FLOW_DUR);
    if (q <= 0) return;
    const arrive = start + FLOW_DUR;
    // The flight is in the camera's frame — it curves in from the edge and
    // lands on the moving line, rather than being dragged off-screen by the
    // pan mid-flight. A late one lands short of the agent, never behind it.
    const tx = arrive > T.agent - 0.3 ? Math.max(flow.tx, AGENT_X + AGENT_R + 40) : flow.tx;
    if (q < 1) {
      const e = ease(q);
      const x = bezier(flow.ox, flow.ox - 20, tx + 170, tx, e);
      const y = bezier(flow.oy, flow.oy + (LINE_Y - flow.oy) * 0.62, LINE_Y + flow.dy, LINE_Y + flow.dy, e);
      marks.push({ x, y, a: Math.min(1, q / 0.15), r: flow.r });
      return;
    }
    const seat = seated(`f${i}`, tx, arrive, flow.r, flow.order, flow.dy);
    if (!seat) return;
    const landing = Math.sin(Math.PI * seg(vt, arrive, 0.3));
    marks.push({ ...seat, r: seat.r + 1.4 * landing });
  });

  return { marks, eaten: total > 0 ? eatenCount / total : 0, pulse: Math.min(2, pulse), fullAt };
}
