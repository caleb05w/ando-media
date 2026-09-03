// The dot field — beats 1 to 5, as pure functions of the clock.
//
// A cloud of dots (messages, docs, files, images) drifts over the stage,
// pulls into one line, and the line starts to flow: more dots curve in
// from off-frame and join it. Then the camera pans right, fast — the line
// streaks left under it — and the whole stream rushes to centre stage and
// gathers into three dots: a typing indicator, which the library's
// animation then turns into the agent. Every position here is a function
// of (timing, vt) and a per-dot constant fixed at module load, so scrubbing
// backwards puts every dot exactly where it was.

import type { Timing } from "./timing";

/* ── The stage, in design pixels; the page scales it to fit. ───────── */
export const STAGE = { w: 1280, h: 800 } as const;
/** Where the line sits — the composer inherits this exact y. */
export const LINE_Y = 430;
/** The focus frame: wide in the cloud, tighter once the dots seat. */
export const FRAME_CLOUD = { x: 120, y: 140, w: 1040, h: 580 } as const;
export const FRAME_TIGHT = { x: 240, y: 140, w: 800, h: 580 } as const;
/** The window is the tight frame, and widens to the left for the sidebar. */
export const CARD = FRAME_TIGHT;
export const SIDEBAR_W = 354;
export const PANE_W = CARD.w;
export const CARD_WIDE = { x: 63, w: PANE_W + SIDEBAR_W } as const;
/** Centre stage: where the stream gathers, and where the indicator plays. */
export const CENTER_X = STAGE.w / 2;
export const DOT_R = 2.5;
/** The typing indicator's three dots, as the library's Stage draws them at
 *  120px: 6 units apart on a 60-unit canvas, 2px a unit. */
export const HUB_PITCH = 12;
export const HUB_X = [CENTER_X - HUB_PITCH, CENTER_X, CENTER_X + HUB_PITCH] as const;
export const HUB_R = 4;

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
  /** Which seat on the line it takes — several dots share one and merge. */
  slot: number;
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
};

const SLOTS = 11;
const slotX = (i: number) => FRAME_TIGHT.x + 48 + (i * (FRAME_TIGHT.w - 96)) / (SLOTS - 1);

const rng = mulberry32(7);
const DOT_COUNT = 34;
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
  return { cx, cy, phase: rng() * Math.PI * 2, slot: perm[i] % SLOTS, d: rng() };
});

// Inflows: one per gap between seats and then some more, so the stream
// keeps coming while the agent eats it; the gaps are taken in a shuffled
// order, from off-frame above and below in turn.
const FLOW_COUNT = 16;
const FLOW_DUR = 1.1;
const gaps = Array.from({ length: FLOW_COUNT }, (_, i) => i % (SLOTS - 1));
for (let i = gaps.length - 1; i > 0; i -= 1) {
  const j = Math.floor(rng() * (i + 1));
  [gaps[i], gaps[j]] = [gaps[j], gaps[i]];
}
export const FLOWS: Flow[] = gaps.map((gap, i) => {
  const fromAbove = i % 2 === 0;
  const tx = (slotX(gap) + slotX(gap + 1)) / 2;
  const ox = Math.max(FRAME_TIGHT.x - 60, tx - 150 - rng() * 220);
  const oy = fromAbove ? -30 : STAGE.h + 30;
  return { fromAbove, ox, oy, tx, order: rng() };
});

/* ── The line as a stream ───────────────────────────────────────────── */
const SPAN0 = FRAME_TIGHT.x + 24;
const SPAN1 = FRAME_TIGHT.x + FRAME_TIGHT.w - 24;
const FADE = 44;
/** The stream's own flow, px/s, from `line` on. */
const DRIFT = 16;
/** The pan: how far the camera moves right, and how fast. */
const PAN_DIST = 1100;
const PAN_DUR = 0.7;
/** The gather into the three dots: a mark leaves after its own beat and
 *  arrives faster the further it has to come, so the far ends fly. */
const GATHER_LAG = 0.12;
const GATHER_DUR = 0.42;
const GATHER_FAR = 0.28;
/** How long a landing rings its dot. */
const PULSE = 0.2;

/** The camera's x at `vt`: still, then a fast push right over the pan. */
export function camX(T: Timing, vt: number) {
  return PAN_DIST * smooth(seg(vt, T.pan, PAN_DUR));
}
const drift = (T: Timing, vt: number) => DRIFT * Math.max(0, vt - T.line);
/** Accelerating — for something rushing somewhere. */
const rushIn = (p: number) => Math.pow(clamp01(p), 2);

function wrapX(x: number) {
  const L = SPAN1 - SPAN0;
  return SPAN0 + ((((x - SPAN0) % L) + L) % L);
}
const edgeAlpha = (x: number) => clamp01(Math.min((x - SPAN0) / FADE, (SPAN1 - x) / FADE));

/** A mark riding the line: seated on screen at `x0` at `t0`, where is it at
 *  `vt`, and when does it land in its dot? Before the gather the line is
 *  endless — it wraps under the camera. From the gather on it flies to one
 *  of the three dots at centre stage and is taken in. */
function ride(T: Timing, vt: number, x0: number, t0: number, lane: number, d: number): { x: number; a: number; landsAt: number | null } {
  const pre = (t: number) => wrapX(x0 + drift(T, t) - drift(T, t0) - (camX(T, t) - camX(T, t0)));
  if (vt < T.gather2) {
    const x = pre(vt);
    return { x, a: edgeAlpha(x), landsAt: null };
  }
  const tA = Math.max(t0, T.gather2);
  const xA = t0 >= T.gather2 ? x0 : pre(T.gather2);
  const target = HUB_X[lane];
  const far = Math.abs(target - xA) / (FRAME_TIGHT.w / 2);
  const start = tA + GATHER_LAG * d;
  const dur = GATHER_DUR + GATHER_FAR * far;
  const p = rushIn(seg(vt, start, dur));
  return { x: lerp(xA, target, p), a: edgeAlpha(xA) * (1 - clamp01((p - 0.82) / 0.18)), landsAt: start + dur };
}

function bezier(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

export type Mark = { x: number; y: number; a: number; r: number };
export type Field = {
  marks: Mark[];
  /** The three dots the stream gathers into: how full each is, and its ring from the landings. */
  hub: Array<{ fill: number; pulse: number }>;
};

/** Every dot at `vt`, and what the stream has gathered into. */
export function fieldAt(T: Timing, vt: number): Field {
  const marks: Mark[] = [];
  const hub = HUB_X.map(() => ({ fill: 0, pulse: 0, total: 0, landed: 0 }));
  const gatherDur = Math.max(0.5, T.line - T.gather);

  // A seated mark: riding, then flying to its dot. Returns nothing once it
  // has landed.
  const seated = (x0: number, t0: number, r: number, lane: number, d: number): Mark | null => {
    const h = hub[lane];
    h.total += 1;
    const { x, a, landsAt } = ride(T, vt, x0, t0, lane, d);
    if (landsAt != null && vt >= landsAt) {
      h.landed += 1;
      h.pulse += Math.sin(Math.PI * seg(vt, landsAt, PULSE));
      return null;
    }
    return { x, y: LINE_Y, a, r };
  };

  DOTS.forEach((dot, i) => {
    const p = ease(seg(vt, T.gather + dot.d * 0.4 * gatherDur, 0.6 * gatherDur));
    const seat = seated(slotX(dot.slot), T.line, DOT_R, i % 3, dot.d);
    if (!seat) return;
    if (p >= 1) {
      marks.push(seat);
      return;
    }
    const wander = (1 - p) * 6;
    const cx = dot.cx + Math.sin(vt * 0.7 + dot.phase) * wander;
    const cy = dot.cy + Math.cos(vt * 0.5 + dot.phase * 1.3) * wander;
    const x = lerp(cx, seat.x, p);
    // A touch of arc so the gather reads as a flock, not a tween.
    const y = lerp(cy, LINE_Y, p) - Math.sin(Math.PI * p) * 22 * (dot.d - 0.5);
    const a = lerp(1, seat.a, p);
    if (a > 0.005) marks.push({ x, y, a, r: DOT_R });
  });

  // Inflows keep coming until the gather is under way; the late ones fly
  // straight from where they land.
  const window = Math.max(0.3, T.gather2 + 0.5 - T.stream);
  FLOWS.forEach((flow, i) => {
    const start = T.stream + ((i + flow.order * 0.6) / FLOW_COUNT) * window;
    const q = seg(vt, start, FLOW_DUR);
    if (q <= 0) return;
    const arrive = start + FLOW_DUR;
    // The flight is drawn against the camera: it curves in with the world.
    const shift = (t: number) => camX(T, t) - camX(T, start);
    if (q < 1) {
      const e = ease(q);
      const x = bezier(flow.ox, flow.ox + 20, flow.tx - 170, flow.tx, e) - shift(vt);
      const y = bezier(flow.oy, flow.oy + (LINE_Y - flow.oy) * 0.62, LINE_Y, LINE_Y, e);
      marks.push({ x, y, a: Math.min(1, q / 0.15), r: DOT_R });
      return;
    }
    const seat = seated(flow.tx - shift(arrive), arrive, DOT_R, i % 3, flow.order);
    if (!seat) return;
    const landing = Math.sin(Math.PI * seg(vt, arrive, 0.3));
    marks.push({ ...seat, r: seat.r + 1.4 * landing });
  });

  return { marks, hub: hub.map((h) => ({ fill: h.total > 0 ? h.landed / h.total : 0, pulse: Math.min(2, h.pulse) })) };
}
