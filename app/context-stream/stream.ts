// The dot field — beats 1 to 5, as pure functions of the clock.
//
// A cloud of dots (messages, docs, files, images) drifts over the stage,
// pulls into one line, and the line starts to flow: more dots curve in
// from off-frame and join it. Every position here is a function of
// (timing, vt) and a per-dot constant fixed at module load, so scrubbing
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
/** The disc — the agent — lands here, on the line. */
export const AGENT_X = STAGE.w / 2;
export const DISC_R = 28;
export const DOT_R = 2.5;
/** The agent's card, centre stage: a fixed width, the height its content
 *  measures. The hero band holds the avatar. */
export const AGENT_CARD_W = 690;
export const HERO_H = 240;
export const HERO_AVATAR_R = 48;

/* ── Curves ─────────────────────────────────────────────────────────── */
export const clamp01 = (p: number) => Math.min(1, Math.max(0, p));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** The house ease. */
export const ease = (p: number) => 1 - Math.pow(1 - clamp01(p), 2.2);
/** Overshoot and settle, for something that lands. */
export const backOut = (p: number) => {
  const s = 1.4;
  const q = clamp01(p) - 1;
  return q * q * ((s + 1) * q + s) + 1;
};
/** Accelerating — for something being pulled in. */
export const easeIn = (p: number) => Math.pow(clamp01(p), 2.4);
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

// One inflow per gap between seats, so the line stays even as it fills;
// the gaps are taken in a shuffled order, from off-frame above and below
// in turn.
const FLOW_COUNT = SLOTS - 1;
const FLOW_DUR = 1.1;
const gaps = Array.from({ length: FLOW_COUNT }, (_, i) => i);
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
const DRIFT = 16; // px/s

/** How far the line has flowed by `vt`: steady from `line`, easing to a
 *  stop once the agent lands — the stream holds still for the disc. */
function driftDist(T: Timing, vt: number) {
  if (vt <= T.line) return 0;
  const linear = Math.max(0, Math.min(vt, T.agent) - T.line);
  const tail = Math.max(0, vt - T.agent);
  const tau = 0.6;
  return DRIFT * (linear + tau * (1 - Math.exp(-tail / tau)));
}

function wrapX(x: number) {
  const L = SPAN1 - SPAN0;
  return SPAN0 + ((((x - SPAN0) % L) + L) % L);
}
const edgeAlpha = (x: number) => clamp01(Math.min((x - SPAN0) / FADE, (SPAN1 - x) / FADE));

/** The disc pushes the line apart around it — smooth, so a dot passing the
 *  centre is shouldered aside rather than swallowed. */
function gapX(x: number, agentP: number) {
  const g = (DISC_R + 22) * agentP;
  if (g <= 0) return x;
  const dx = x - AGENT_X;
  return AGENT_X + Math.sign(dx || 1) * Math.sqrt(dx * dx + g * g);
}

function bezier(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

export type Mark = { x: number; y: number; a: number; r: number };

/** How much of the line the disc has taken in by `vt`, 0→1. */
export function absorbedAt(T: Timing, vt: number) {
  return ease(seg(vt, T.absorb, absorbDur(T)));
}
const absorbDur = (T: Timing) => Math.max(0.6, T.form - T.absorb);

/** A seated dot being pulled into the disc: from its seat `x` on the line
 *  to the disc's centre, accelerating, gone as it crosses the rim. `d` is
 *  its stagger. Returns null once it is inside. */
function pullIn(T: Timing, vt: number, x: number, d: number): { x: number; y: number; a: number; r: number } | null {
  const dur = absorbDur(T);
  // The far end of the line leaves first, so the pull reads as a current.
  const far = Math.abs(x - AGENT_X) / (FRAME_TIGHT.w / 2);
  const q = seg(vt, T.absorb + (0.55 * (1 - far) + 0.25 * d) * dur * 0.6, 0.4 * dur);
  if (q <= 0) return { x, y: LINE_Y, a: 1, r: DOT_R };
  const p = easeIn(q);
  const nx = lerp(x, AGENT_X, p);
  const inside = Math.abs(nx - AGENT_X) < DISC_R * 0.9;
  if (inside || q >= 1) return null;
  return { x: nx, y: LINE_Y - Math.sin(Math.PI * p) * 10 * (d - 0.5), a: 1, r: DOT_R + 0.8 * p };
}

/** Every dot at `vt`. Empty once the disc has taken the line in. */
export function dotsAt(T: Timing, vt: number): Mark[] {
  if (vt >= T.form) return [];
  const gatherDur = Math.max(0.5, T.line - T.gather);
  const agentP = ease(seg(vt, T.agent, 0.6));
  const dd = driftDist(T, vt);
  const absorbing = vt >= T.absorb;
  const out: Mark[] = [];

  for (const dot of DOTS) {
    const p = ease(seg(vt, T.gather + dot.d * 0.4 * gatherDur, 0.6 * gatherDur));
    const wander = (1 - p) * 6;
    const cx = dot.cx + Math.sin(vt * 0.7 + dot.phase) * wander;
    const cy = dot.cy + Math.cos(vt * 0.5 + dot.phase * 1.3) * wander;
    const lx = gapX(wrapX(slotX(dot.slot) + dd), agentP);
    if (absorbing) {
      const mark = pullIn(T, vt, lx, dot.d);
      if (mark) out.push({ ...mark, a: mark.a * edgeAlpha(lx) });
      continue;
    }
    const x = lerp(cx, lx, p);
    // A touch of arc so the gather reads as a flock, not a tween.
    const y = lerp(cy, LINE_Y, p) - Math.sin(Math.PI * p) * 22 * (dot.d - 0.5);
    const a = lerp(1, edgeAlpha(lx), p);
    if (a > 0.005) out.push({ x, y, a, r: DOT_R });
  }

  const window = Math.max(0.3, T.agent - 0.5 - FLOW_DUR - T.stream);
  FLOWS.forEach((flow, i) => {
    const start = T.stream + ((i + flow.order * 0.6) / FLOW_COUNT) * window;
    const q = seg(vt, start, FLOW_DUR);
    if (q <= 0) return;
    if (q < 1) {
      const e = ease(q);
      const x = bezier(flow.ox, flow.ox + 20, flow.tx - 170, flow.tx, e);
      const y = bezier(flow.oy, flow.oy + (LINE_Y - flow.oy) * 0.62, LINE_Y, LINE_Y, e);
      out.push({ x, y, a: Math.min(1, q / 0.15), r: DOT_R });
      return;
    }
    const arrive = start + FLOW_DUR;
    const x = gapX(wrapX(flow.tx + dd - driftDist(T, arrive)), agentP);
    if (absorbing) {
      const mark = pullIn(T, vt, x, flow.order);
      if (mark) out.push({ ...mark, a: mark.a * edgeAlpha(x) });
      return;
    }
    const pulse = Math.sin(Math.PI * seg(vt, arrive, 0.3));
    out.push({ x, y: LINE_Y, a: edgeAlpha(x), r: DOT_R + 1.4 * pulse });
  });

  return out;
}

/** The hairline the stream runs along — in with the stream, gone before the disc. */
export function hairlineAt(T: Timing, vt: number) {
  return ease(seg(vt, T.stream, 0.5)) * (1 - ease(seg(vt, T.agent - 0.35, 0.35)));
}
