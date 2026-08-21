// Motion data + frame builders for /agent-typing-experience.
//
// Everything renders from a Frame (dots under a disc, an avatar clipped to
// the disc, optional eyelid / flip-and-squash scales / face spin), and every
// variant is a morph function built from splined keyframe tracks. The typing
// wave, the resting dot geometry, and the ink are lifted from the Agent
// trace storyboard (Figma Db5PC5Ai4JAB9cmho2HcOn, section 146-6104); the
// morphs are review explorations on top of it.
//
// Three groups:
//   v1 — the five keepers, all sharing the same arrival grammar (spring past
//        size, shudder, ring down).
//   v2 — the same five travels, each with an arrival tailored to its
//        character: knockback, soft bloom, spin-in, beat bounce, swallow.
//   archive — retired studies, kept for reference.
//
// No transparency anywhere shapes overlap: every grey is the storyboard
// opacity pre-blended onto white, and the small dots draw *under* the disc
// so consolidation reads as a clean tuck, never a blend.

export const AVATAR = "/agent-typing-experience/agent-avatar.png";

/* --------------------------------- color ---------------------------------- */

const INK: readonly number[] = [88, 82, 78]; // storyboard #58524E
const WHITE: readonly number[] = [255, 255, 255];
const DISC: readonly number[] = [45, 45, 45]; // avatar disc, sampled from the PNG

const rgb = (c: readonly number[]) =>
  `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`;

// Ink at storyboard opacity `a`, pre-blended onto the white card.
const shade = (a: number) => INK.map((v) => 255 + (v - 255) * a);

const mix = (c1: readonly number[], c2: readonly number[], t: number) =>
  c1.map((v, i) => v + (c2[i] - v) * t);

const REST = shade(0.45); // resting dot / disc body
const SAT = shade(0.561); // the outer dots mid-flight
const SAT_FILL = rgb(SAT);

/* --------------------------------- spline --------------------------------- */

export type Pt = readonly [t: number, v: number];

// Non-uniform Catmull-Rom through (t, v) samples, clamped at the ends.
// Finite-difference tangents keep velocity continuous across keyframes.
export function spline(pts: readonly Pt[], t: number): number {
  const n = pts.length;
  if (t <= pts[0][0]) return pts[0][1];
  if (t >= pts[n - 1][0]) return pts[n - 1][1];
  let i = 0;
  while (t > pts[i + 1][0]) i++;
  const [t1, v1] = pts[i];
  const [t2, v2] = pts[i + 1];
  const h = t2 - t1;
  const u = (t - t1) / h;
  const prev = pts[i - 1] ?? [t1 - h, v1];
  const next = pts[i + 2] ?? [t2 + h, v2];
  const m1 = (v2 - prev[1]) / (t2 - prev[0]);
  const m2 = (next[1] - v1) / (next[0] - t1);
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * v1 +
    (u3 - 2 * u2 + u) * h * m1 +
    (-2 * u3 + 3 * u2) * v2 +
    (u3 - u2) * h * m2
  );
}

const easeInOut = (u: number) =>
  u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ------------------------------- typing wave ------------------------------- */

// One dot's cycle as a single unit curve u(t): tone = shade(.45 + .55u),
// cy = 30 − 1.5u, r = 2 + .24u — the three tracks share it exactly in the
// storyboard frames. Sampled every 150ms; extended one sample past each end
// so the wrap interpolates seamlessly.
const WAVE: Pt[] = [
  [-150, 0.232],
  [0, 0],
  [150, 0.232],
  [300, 0.77],
  [450, 1],
  [600, 0.77],
  [750, 0.232],
  [900, 0],
  [1050, 0.232],
];
export const WAVE_MS = 900;

export function waveU(ms: number): number {
  const p = ((ms % WAVE_MS) + WAVE_MS) % WAVE_MS;
  return spline(WAVE, p);
}

/* --------------------------------- frames ---------------------------------- */

export type Dot = {
  x: number;
  y: number;
  r: number;
  fill: string;
  o: number;
  /** ellipse semi-axes — when set, renders an ellipse instead of a circle */
  rx?: number;
  ry?: number;
};

export type Frame = {
  /** drawn under the disc, in order */
  sats: Dot[];
  blob: { x: number; y: number; r: number; fill: string; sx?: number; sy?: number };
  avatarO: number;
  /** eyelid over the avatar face, 0 closed → 1 open (default 1) */
  lid?: number;
  /** face spin (degrees) and scale inside the disc (defaults 0 / 1) */
  faceRot?: number;
  faceScale?: number;
};

const DOT_X = [24, 30, 36];

function waveDot(i: number, ms: number, fade = 1): Dot {
  // Dots lead/lag the middle one by 150ms: left leads, right trails.
  const u = waveU(ms + 150 * (1 - i));
  return {
    x: DOT_X[i],
    y: 30 - 1.5 * u,
    r: 2 + 0.24 * u,
    fill: rgb(shade(0.45 + 0.55 * u)),
    o: fade,
  };
}

export function typingFrame(ms: number, sideFade = 1): Frame {
  return {
    sats: [waveDot(0, ms, sideFade), waveDot(2, ms, sideFade)],
    blob: waveDot(1, ms),
    avatarO: 0,
  };
}

// Melt back down: the face snuffs out fast, the disc lightens back to the
// resting grey as it shrinks, and a beat of stillness leads into the wave.
export function resetFrame(t: number): Frame {
  const shrink = easeInOut(Math.min(1, t / 320));
  return {
    sats: [],
    blob: {
      x: 30,
      y: 30,
      r: 9.6 + (2 - 9.6) * shrink,
      fill: rgb(mix(DISC, REST, Math.min(1, t / 300))),
    },
    avatarO: Math.max(0, 1 - t / 140),
  };
}

/* -------------------------------- helpers ---------------------------------- */

// Decaying positional shudder on the disc after the hit — two incommensurate
// sines so the shake reads as a rattle, not a metronome.
function shudder(t: number, impactMs: number, amp: number) {
  const s = t - impactMs;
  if (s < 0 || s > 340) return { dx: 0, dy: 0 };
  const a = amp * Math.exp(-s / 110);
  return { dx: a * Math.sin(s * 0.084), dy: a * Math.sin(s * 0.061 + 2) };
}

function trackDot(xs: readonly Pt[], ys: readonly Pt[], t: number, r: number): Dot {
  return { x: spline(xs, t), y: spline(ys, t), r, fill: SAT_FILL, o: 1 };
}

function discAt(
  t: number,
  rTrack: readonly Pt[],
  toneTrack: readonly Pt[],
  impactMs: number,
  shake: number,
): Frame["blob"] {
  const { dx, dy } = shudder(t, impactMs, shake);
  return {
    x: 30 + dx,
    y: 30 + dy,
    r: spline(rTrack, t),
    fill: rgb(mix(REST, DISC, spline(toneTrack, t))),
  };
}

const toneFill = (toneTrack: readonly Pt[], t: number) =>
  rgb(mix(REST, DISC, spline(toneTrack, t)));

// Trailing ghosts: the same tracks sampled a beat behind, lighter and
// smaller — speed made visible. Skipped while the mover is dawdling.
const GHOSTS: readonly (readonly [dt: number, rk: number, whiten: number])[] = [
  [28, 0.68, 0.5],
  [56, 0.45, 0.72],
];

function withGhosts(
  sats: Dot[],
  xs: readonly (readonly Pt[])[],
  ys: readonly (readonly Pt[])[],
  t: number,
): Dot[] {
  const out: Dot[] = [];
  sats.forEach((d, i) => {
    GHOSTS.forEach(([dt, rk, whiten]) => {
      const gx = spline(xs[i], Math.max(0, t - dt));
      const gy = spline(ys[i], Math.max(0, t - dt));
      if (Math.hypot(gx - d.x, gy - d.y) > 1.1) {
        out.push({ x: gx, y: gy, r: d.r * rk, fill: rgb(mix(SAT, WHITE, whiten)), o: 1 });
      }
    });
    out.push(d);
  });
  return out;
}

/* -------------------------------- variants --------------------------------- */

export type StripCell = { label: string; t: number };

export type VariantGroup = "v1" | "v2" | "v3" | "demo" | "archive";

export type Variant = {
  key: string;
  num: string;
  title: string;
  blurb: string;
  group: VariantGroup;
  morphMs: number;
  morph: (t: number) => Frame;
  stripMorph: StripCell[];
  /** face the morph resolves into — defaults to the storyboard agent */
  avatar?: string;
};

/* ------------------------------- host tinting ------------------------------ */

// Wrap a variant so its morph carries the host pfp's color: the dots (and
// the disc behind the face) start in the storyboard greys and take on the
// host's main color mid-transition — nothing before a quarter in, fully
// the host's color by ~80% — so the consolidation visibly becomes the
// person it's resolving into.
const parseRgb = (fill: string): number[] => (fill.match(/\d+/g) ?? []).map(Number);

export function hostTinted(
  base: Variant,
  host: { key: string; color: readonly number[]; avatar: string },
): Variant {
  return {
    ...base,
    key: `${base.key}-${host.key}`,
    avatar: host.avatar,
    morph: (t: number) => {
      const f = base.morph(t);
      // Fast ramp: the color turns almost immediately — on the move by
      // 8% of the morph, fully the host's color by 35%.
      const p = clamp01((t / base.morphMs - 0.08) / 0.27);
      if (p <= 0) return f;
      const tint = (fill: string) => rgb(mix(parseRgb(fill), host.color, p));
      return {
        ...f,
        sats: f.sats.map((d) => ({ ...d, fill: tint(d.fill) })),
        blob: { ...f.blob, fill: tint(f.blob.fill) },
      };
    },
  };
}

// test-tewt (Caleb's animations folder): a sky-blue pfp — main color
// sampled from its most saturated tone.
export const TEWT_HOST = {
  key: "tewt",
  color: [2, 183, 255] as const,
  avatar: "/agent-typing-experience/test-tewt.png",
};

/* 01 · Slingshot ------------------------------------------------------------ */

const SL = {
  d1x: [[0, 24], [55, 21], [100, 30.5], [142, 39.5], [185, 36], [218, 30.3]] as Pt[],
  d1y: [[0, 29.652], [55, 36.5], [100, 41], [142, 33.5], [185, 21.5], [218, 29.7]] as Pt[],
  d3x: [[0, 36], [35, 37.5], [85, 38.5], [132, 28.5], [180, 20], [220, 23.5], [253, 29.7]] as Pt[],
  d3y: [[0, 29.652], [35, 28.2], [85, 22], [132, 19.5], [180, 27], [220, 35.5], [253, 30.3]] as Pt[],
  satR: [[0, 2.056], [100, 1.95], [175, 2.15], [253, 1.6]] as Pt[],
  blobR: [
    [0, 2], [100, 3.0], [200, 3.8], [210, 3.9],
    [293, 10.9], [353, 8.9], [413, 10.2], [473, 9.35],
    [538, 9.7], [603, 9.55], [663, 9.6], [725, 9.6],
  ] as Pt[],
  tone: [[0, 0], [218, 0], [353, 1], [725, 1]] as Pt[],
};

function slingSats(t: number): Dot[] {
  const r = spline(SL.satR, t);
  const sats = [trackDot(SL.d1x, SL.d1y, t, r), trackDot(SL.d3x, SL.d3y, t, r)];
  return withGhosts(sats, [SL.d1x, SL.d3x], [SL.d1y, SL.d3y], t);
}

function slingshotMorph(t: number): Frame {
  return {
    sats: slingSats(t),
    blob: discAt(t, SL.blobR, SL.tone, 218, 0.9),
    avatarO: spline([[263, 0], [423, 1], [725, 1]], t),
  };
}

/* 01v2 · Slingshot — knockback ---------------------------------------------- */

// No generic shudder: each landing knocks the disc along its own impact
// axis — hit 1 shoves it down-left, hit 2 punches back up-right — with a
// directional squash, then one fast rebound instead of a long ring.
const SLK = {
  x: [[0, 30], [216, 30], [236, 28.9], [252, 29.5], [272, 31.0], [318, 29.7], [362, 30.1], [405, 30], [725, 30]] as Pt[],
  y: [[0, 30], [216, 30], [234, 31.0], [252, 30.4], [270, 29.1], [315, 30.4], [358, 29.85], [400, 30], [725, 30]] as Pt[],
  r: [
    [0, 2], [100, 3.0], [200, 3.8], [210, 3.9],
    [243, 6.9], [256, 7.1], [330, 10.6], [398, 9.2],
    [458, 9.78], [518, 9.53], [575, 9.6], [725, 9.6],
  ] as Pt[],
  sy: [[0, 1], [214, 1], [230, 0.88], [248, 1.03], [262, 0.9], [288, 1.05], [330, 0.98], [380, 1], [725, 1]] as Pt[],
  tone: [[0, 0], [253, 0], [390, 1], [725, 1]] as Pt[],
  av: [[300, 0], [460, 1], [725, 1]] as Pt[],
};

function slingshotV2Morph(t: number): Frame {
  return {
    sats: slingSats(t),
    blob: {
      x: spline(SLK.x, t),
      y: spline(SLK.y, t),
      r: spline(SLK.r, t),
      sy: spline(SLK.sy, t),
      fill: toneFill(SLK.tone, t),
    },
    avatarO: spline(SLK.av, t),
  };
}

/* 02 · Suction -------------------------------------------------------------- */

const SU = {
  d1x: [[0, 24], [100, 16], [200, 9], [270, 9.5], [345, 16], [405, 25], [450, 29.7]] as Pt[],
  d1y: [[0, 29.652], [100, 27], [200, 23.5], [270, 28], [345, 37.5], [405, 36], [450, 30.3]] as Pt[],
  d3x: [[0, 36], [115, 44], [215, 51], [290, 50.5], [370, 44], [435, 35], [488, 30.2]] as Pt[],
  d3y: [[0, 29.652], [115, 32.5], [215, 36.5], [290, 31.5], [370, 22.5], [435, 24.5], [488, 29.8]] as Pt[],
  satR: [[0, 2.056], [180, 2.2], [310, 1.9], [430, 1.5], [488, 1.05]] as Pt[],
  blobR: [
    [0, 2], [150, 3.2], [310, 4.3], [425, 4.7], [450, 4.45],
    [520, 10.4], [585, 9.05], [650, 9.9], [715, 9.45],
    [780, 9.7], [845, 9.55], [910, 9.6], [960, 9.6],
  ] as Pt[],
  tone: [[0, 0], [450, 0], [585, 1], [960, 1]] as Pt[],
};

function suctionSats(t: number): Dot[] {
  const r = spline(SU.satR, t);
  const sats = [trackDot(SU.d1x, SU.d1y, t, r), trackDot(SU.d3x, SU.d3y, t, r)];
  return withGhosts(sats, [SU.d1x, SU.d3x], [SU.d1y, SU.d3y], t);
}

function suctionMorph(t: number): Frame {
  return {
    sats: suctionSats(t),
    blob: discAt(t, SU.blobR, SU.tone, 450, 0.65),
    avatarO: spline([[495, 0], [655, 1], [960, 1]], t),
  };
}

/* 02v2 · Suction — soft bloom ----------------------------------------------- */

// No bounce at all: a deep inhale after the last dot lands, then the disc
// blooms smoothly to size with an overdamped ease and one gentle sigh.
// The face grows in from within instead of fading over the whole disc.
const SUB = {
  r: [
    [0, 2], [150, 3.2], [310, 4.3], [425, 4.7], [450, 4.45],
    [470, 4.1], [600, 8.6], [720, 9.6], [800, 9.48], [880, 9.6], [960, 9.6],
  ] as Pt[],
  tone: [[0, 0], [470, 0], [600, 1], [960, 1]] as Pt[],
  av: [[590, 0], [750, 1], [960, 1]] as Pt[],
  faceS: [[590, 0.72], [790, 1], [960, 1]] as Pt[],
};

function suctionV2Morph(t: number): Frame {
  return {
    sats: suctionSats(t),
    blob: { x: 30, y: 30, r: spline(SUB.r, t), fill: toneFill(SUB.tone, t) },
    avatarO: spline(SUB.av, t),
    faceScale: spline(SUB.faceS, t),
  };
}

/* 04 · Decaying orbit ------------------------------------------------------- */

const OB = {
  th1: [[0, 180], [130, 40], [210, -150], [290, -280], [360, -470], [430, -600], [500, -780], [560, -900]] as Pt[],
  a1: [[0, 6], [100, 13], [250, 10], [400, 6.5], [520, 3], [560, 0.6]] as Pt[],
  th3: [[0, 0], [140, -130], [230, -320], [310, -450], [380, -640], [450, -770], [530, -950], [600, -1080]] as Pt[],
  a3: [[0, 6], [110, 12], [260, 9.5], [410, 6], [545, 2.5], [600, 0.6]] as Pt[],
  satR: [[0, 2.056], [300, 1.9], [500, 1.5], [600, 1.1]] as Pt[],
  blobR: [
    [0, 2], [250, 3.1], [520, 3.85], [555, 3.9],
    [635, 10.6], [700, 9.0], [765, 10.0], [830, 9.4],
    [895, 9.65], [960, 9.55], [1020, 9.6], [1050, 9.6],
  ] as Pt[],
  tone: [[0, 0], [560, 0], [700, 1], [1050, 1]] as Pt[],
};

const TILT = (25 * Math.PI) / 180;
const ECC = 0.55; // minor axis / major axis

function orbitDot(th: Pt[], a: Pt[], t: number, r: number): Dot {
  const ang = (spline(th, t) * Math.PI) / 180;
  const A = spline(a, t);
  const ex = A * Math.cos(ang);
  const ey = A * ECC * Math.sin(ang);
  return {
    x: 30 + ex * Math.cos(TILT) - ey * Math.sin(TILT),
    y: 30 + ex * Math.sin(TILT) + ey * Math.cos(TILT),
    r,
    fill: SAT_FILL,
    o: 1,
  };
}

function orbitSats(t: number): Dot[] {
  const r = spline(OB.satR, t);
  return [orbitDot(OB.th1, OB.a1, t, r), orbitDot(OB.th3, OB.a3, t, r)];
}

function orbitMorph(t: number): Frame {
  return {
    sats: orbitSats(t),
    blob: discAt(t, OB.blobR, OB.tone, 560, 0.7),
    avatarO: spline([[610, 0], [770, 1], [1050, 1]], t),
  };
}

/* 04v2 · Orbit — spin-in ---------------------------------------------------- */

// The angular momentum carries into the arrival: the face spins in through
// the last 140°, decelerating and settling with a slight over-rotation,
// while the disc wobbles a touch on its width. faceScale stays just large
// enough that the rotating square art always covers the circular clip.
const OBS = {
  r: [
    [0, 2], [250, 3.1], [520, 3.85], [555, 3.9],
    [635, 10.2], [710, 9.3], [780, 9.75], [850, 9.55], [920, 9.6], [1050, 9.6],
  ] as Pt[],
  sx: [[0, 1], [600, 1], [640, 1.06], [700, 0.95], [760, 1.03], [820, 1], [1050, 1]] as Pt[],
  tone: [[0, 0], [560, 0], [670, 1], [1050, 1]] as Pt[],
  av: [[610, 0], [720, 1], [1050, 1]] as Pt[],
  rot: [[610, -140], [700, -55], [780, -18], [860, -4], [920, 0], [1050, 0]] as Pt[],
  faceS: [[610, 1.42], [700, 1.28], [780, 1.1], [860, 1.02], [920, 1], [1050, 1]] as Pt[],
};

function orbitV2Morph(t: number): Frame {
  return {
    sats: orbitSats(t),
    blob: { x: 30, y: 30, r: spline(OBS.r, t), sx: spline(OBS.sx, t), fill: toneFill(OBS.tone, t) },
    avatarO: spline(OBS.av, t),
    faceRot: spline(OBS.rot, t),
    faceScale: spline(OBS.faceS, t),
  };
}

/* 05 · Collapse in rhythm --------------------------------------------------- */

const CR = {
  spread: [[0, 6], [300, 5.5], [450, 4.1], [600, 2.6], [750, 1.1], [830, 0]] as Pt[],
  blobR: [
    [0, 2], [300, 2.6], [600, 3.3], [820, 3.9],
    [905, 10.2], [965, 9.2], [1025, 9.85], [1085, 9.5],
    [1145, 9.65], [1200, 9.6],
  ] as Pt[],
  tone: [[0, 0], [830, 0], [950, 1], [1200, 1]] as Pt[],
};

// The wave never stops — each bounce just lands closer to the middle.
function rhythmMovers(t: number): { sats: Dot[]; uMid: number; bob: number } {
  const off = spline(CR.spread, t);
  const shrink = 1 - 0.3 * clamp01(t / 830);
  const bob = clamp01((860 - t) / 120); // the bounce fades out as they land
  const mover = (i: 0 | 2): Dot => {
    const u = waveU(t + 150 * (1 - i));
    return {
      x: 30 + (i - 1) * off,
      y: 30 - 1.5 * u * bob,
      r: (2 + 0.24 * u) * shrink,
      fill: rgb(shade(0.45 + 0.55 * u)),
      o: 1,
    };
  };
  return { sats: [mover(0), mover(2)], uMid: waveU(t), bob };
}

function rhythmDiscFill(uMid: number, tone: number): string {
  return tone < 0.5
    ? rgb(mix(shade(0.45 + 0.55 * uMid), DISC, tone))
    : rgb(mix(REST, DISC, tone));
}

function rhythmMorph(t: number): Frame {
  const { sats, uMid, bob } = rhythmMovers(t);
  const disc = discAt(t, CR.blobR, CR.tone, 830, 0.45);
  disc.y += -1.5 * uMid * bob;
  disc.fill = rhythmDiscFill(uMid, spline(CR.tone, t));
  return {
    sats,
    blob: disc,
    avatarO: spline([[880, 0], [1010, 1], [1200, 1]], t),
  };
}

/* 05v2 · Rhythm — on the beat ----------------------------------------------- */

// The settle keeps the meter: after the last dots land, the disc grows in
// two beats — a small pop, then a bigger one — bobbing upward on each beat
// exactly like the typing dots did, decaying back to stillness.
const CRB = {
  r: [
    [0, 2], [300, 2.6], [600, 3.3], [820, 3.9],
    [905, 8.2], [980, 7.6], [1055, 10.1], [1130, 9.35],
    [1205, 9.7], [1280, 9.55], [1340, 9.6], [1400, 9.6],
  ] as Pt[],
  beat: [
    [830, 0], [905, -1.4], [980, 0.3], [1055, -1.7],
    [1130, 0.4], [1205, -0.7], [1280, 0.15], [1340, 0], [1400, 0],
  ] as Pt[],
  tone: [[0, 0], [905, 0], [1055, 1], [1400, 1]] as Pt[],
  av: [[980, 0], [1130, 1], [1400, 1]] as Pt[],
};

function rhythmV2Morph(t: number): Frame {
  const { sats, uMid, bob } = rhythmMovers(t);
  const tone = spline(CRB.tone, t);
  return {
    sats,
    blob: {
      x: 30,
      y: 30 - 1.5 * uMid * bob + spline(CRB.beat, t),
      r: spline(CRB.r, t),
      fill: rhythmDiscFill(uMid, tone),
    },
    avatarO: spline(CRB.av, t),
  };
}

/* 06 · Gulp handoff --------------------------------------------------------- */

const GU = {
  d1x: [[0, 24], [140, 24.3], [230, 25.6]] as Pt[],
  d1y: [[0, 29.652], [230, 29.9]] as Pt[],
  d1r: [[0, 2.056], [130, 2.0], [230, 0.05]] as Pt[],
  d3x: [[0, 36], [320, 35.9], [490, 34.4]] as Pt[],
  d3y: [[0, 29.652], [490, 29.9]] as Pt[],
  d3r: [[0, 2.056], [330, 2.0], [490, 0.05]] as Pt[],
  // Two pumps — one per swallowed dot — then the spring.
  blobR: [
    [0, 2], [150, 2.3], [210, 2.5], [290, 4.8], [350, 4.3],
    [430, 4.5], [560, 7.6], [620, 7.1],
    [660, 10.3], [725, 9.1], [790, 9.95], [855, 9.45],
    [920, 9.68], [985, 9.55], [1050, 9.6], [1080, 9.6],
  ] as Pt[],
  tone: [[0, 0], [620, 0], [750, 1], [1080, 1]] as Pt[],
};

function gulpSats(t: number): Dot[] {
  const dot = (xs: Pt[], ys: Pt[], rs: Pt[]): Dot => {
    const r = spline(rs, t);
    return { x: spline(xs, t), y: spline(ys, t), r, fill: SAT_FILL, o: clamp01(r / 0.9) };
  };
  return [dot(GU.d1x, GU.d1y, GU.d1r), dot(GU.d3x, GU.d3y, GU.d3r)];
}

function gulpMorph(t: number): Frame {
  return {
    sats: gulpSats(t),
    blob: discAt(t, GU.blobR, GU.tone, 660, 0.5),
    avatarO: spline([[680, 0], [830, 1], [1080, 1]], t),
  };
}

/* 06v2 · Gulp — swallow ----------------------------------------------------- */

// The arrival is a real swallow: after the second pump the disc stretches
// tall, squashes wide going down, and settles — squash-and-stretch instead
// of a ring, with the face arriving as it recovers.
const GUS = {
  r: [
    [0, 2], [150, 2.3], [210, 2.5], [290, 4.8], [350, 4.3],
    [430, 4.5], [560, 7.6], [620, 7.1],
    [700, 9.9], [770, 9.4], [840, 9.65], [910, 9.55], [970, 9.6], [1080, 9.6],
  ] as Pt[],
  sx: [[0, 1], [600, 1], [640, 0.9], [690, 1.12], [740, 0.96], [790, 1.02], [840, 1], [1080, 1]] as Pt[],
  sy: [[0, 1], [600, 1], [640, 1.14], [690, 0.84], [740, 1.06], [790, 0.97], [840, 1], [1080, 1]] as Pt[],
  tone: [[0, 0], [640, 0], [780, 1], [1080, 1]] as Pt[],
  av: [[720, 0], [870, 1], [1080, 1]] as Pt[],
};

function gulpV2Morph(t: number): Frame {
  return {
    sats: gulpSats(t),
    blob: {
      x: 30,
      y: 30,
      r: spline(GUS.r, t),
      sx: spline(GUS.sx, t),
      sy: spline(GUS.sy, t),
      fill: toneFill(GUS.tone, t),
    },
    avatarO: spline(GUS.av, t),
  };
}

/* ---------------------------------- v3 -------------------------------------
   The v2 principles miniaturized for showing at product scale: excursions
   stay within ~8 units of center, no ghost trails, overshoot under 3%, no
   rattle, and everything lands faster. Same characters, indoor voices.
---------------------------------------------------------------------------- */

/* 01v3 · Slingshot — flick -------------------------------------------------- */

const SLF = {
  d1x: [[0, 24], [70, 23.4], [140, 26.6], [190, 29.7]] as Pt[],
  d1y: [[0, 29.652], [70, 33.2], [140, 32.8], [190, 30.2]] as Pt[],
  d3x: [[0, 36], [85, 36.4], [160, 33.2], [220, 30.3]] as Pt[],
  d3y: [[0, 29.652], [85, 26.6], [160, 26.9], [220, 29.8]] as Pt[],
  satR: [[0, 2.056], [220, 1.7]] as Pt[],
  x: [[0, 30], [188, 30], [204, 29.7], [222, 30.15], [238, 29.95], [260, 30], [600, 30]] as Pt[],
  y: [[0, 30], [188, 30], [202, 30.25], [220, 29.9], [240, 30.03], [262, 30], [600, 30]] as Pt[],
  r: [[0, 2], [100, 2.8], [180, 3.6], [240, 9.9], [310, 9.45], [370, 9.63], [430, 9.6], [600, 9.6]] as Pt[],
  tone: [[0, 0], [220, 0], [330, 1], [600, 1]] as Pt[],
  av: [[260, 0], [400, 1], [600, 1]] as Pt[],
};

function slingshotV3Morph(t: number): Frame {
  const r = spline(SLF.satR, t);
  return {
    sats: [trackDot(SLF.d1x, SLF.d1y, t, r), trackDot(SLF.d3x, SLF.d3y, t, r)],
    blob: { x: spline(SLF.x, t), y: spline(SLF.y, t), r: spline(SLF.r, t), fill: toneFill(SLF.tone, t) },
    avatarO: spline(SLF.av, t),
  };
}

/* 02v3 · Suction — draw-in -------------------------------------------------- */

const SUD = {
  d1x: [[0, 24], [120, 21.5], [230, 23], [300, 29.7]] as Pt[],
  d1y: [[0, 29.652], [120, 29], [230, 31.4], [300, 30.1]] as Pt[],
  d3x: [[0, 36], [140, 38.6], [250, 36.6], [330, 30.2]] as Pt[],
  d3y: [[0, 29.652], [140, 30.4], [250, 28.5], [330, 29.9]] as Pt[],
  satR: [[0, 2.056], [150, 2.1], [330, 1.4]] as Pt[],
  r: [[0, 2], [150, 3.0], [290, 3.6], [335, 3.45], [480, 8.9], [620, 9.6], [700, 9.6]] as Pt[],
  tone: [[0, 0], [335, 0], [470, 1], [700, 1]] as Pt[],
  av: [[430, 0], [580, 1], [700, 1]] as Pt[],
  faceS: [[430, 0.9], [600, 1], [700, 1]] as Pt[],
};

function suctionV3Morph(t: number): Frame {
  const r = spline(SUD.satR, t);
  return {
    sats: [trackDot(SUD.d1x, SUD.d1y, t, r), trackDot(SUD.d3x, SUD.d3y, t, r)],
    blob: { x: 30, y: 30, r: spline(SUD.r, t), fill: toneFill(SUD.tone, t) },
    avatarO: spline(SUD.av, t),
    faceScale: spline(SUD.faceS, t),
  };
}

/* 04v3 · Orbit — half-pass -------------------------------------------------- */

const OBH = {
  th1: [[0, 180], [130, 80], [260, -30], [350, -120], [410, -170]] as Pt[],
  a1: [[0, 6], [120, 7.8], [260, 5.6], [360, 3.2], [410, 0.8]] as Pt[],
  th3: [[0, 0], [140, -95], [270, -200], [370, -290], [440, -350]] as Pt[],
  a3: [[0, 6], [130, 7.4], [280, 5.2], [380, 2.8], [440, 0.8]] as Pt[],
  satR: [[0, 2.056], [300, 1.7], [440, 1.2]] as Pt[],
  r: [[0, 2], [200, 3.0], [400, 3.7], [430, 3.75], [510, 9.85], [580, 9.5], [640, 9.62], [700, 9.6], [750, 9.6]] as Pt[],
  tone: [[0, 0], [430, 0], [560, 1], [750, 1]] as Pt[],
  av: [[470, 0], [600, 1], [750, 1]] as Pt[],
  // Small spin-in: −32° with the scale riding just above the coverage bound.
  rot: [[450, -32], [560, -12], [620, -2], [680, 0], [750, 0]] as Pt[],
  faceS: [[450, 1.19], [560, 1.08], [620, 1.01], [680, 1], [750, 1]] as Pt[],
};

function orbitV3Morph(t: number): Frame {
  const r = spline(OBH.satR, t);
  return {
    sats: [orbitDot(OBH.th1, OBH.a1, t, r), orbitDot(OBH.th3, OBH.a3, t, r)],
    blob: { x: 30, y: 30, r: spline(OBH.r, t), fill: toneFill(OBH.tone, t) },
    avatarO: spline(OBH.av, t),
    faceRot: spline(OBH.rot, t),
    faceScale: spline(OBH.faceS, t),
  };
}

/* 05v3 · Rhythm — soft cadence ---------------------------------------------- */

const CRS = {
  spread: [[0, 6], [250, 5.2], [400, 3.6], [550, 1.8], [650, 0]] as Pt[],
  r: [[0, 2], [300, 2.7], [640, 3.6], [720, 9.75], [800, 9.5], [870, 9.62], [930, 9.6], [1000, 9.6]] as Pt[],
  beat: [[650, 0], [720, -0.7], [800, 0.15], [870, 0], [1000, 0]] as Pt[],
  tone: [[0, 0], [720, 0], [850, 1], [1000, 1]] as Pt[],
  av: [[790, 0], [930, 1], [1000, 1]] as Pt[],
};

function rhythmV3Morph(t: number): Frame {
  const off = spline(CRS.spread, t);
  const shrink = 1 - 0.25 * clamp01(t / 650);
  const bob = clamp01((680 - t) / 110);
  const mover = (i: 0 | 2): Dot => {
    const u = waveU(t + 150 * (1 - i));
    return {
      x: 30 + (i - 1) * off,
      y: 30 - 1.5 * u * bob,
      r: (2 + 0.24 * u) * shrink,
      fill: rgb(shade(0.45 + 0.55 * u)),
      o: 1,
    };
  };
  const uMid = waveU(t);
  const tone = spline(CRS.tone, t);
  return {
    sats: [mover(0), mover(2)],
    blob: {
      x: 30,
      y: 30 - 1.5 * uMid * bob + spline(CRS.beat, t),
      r: spline(CRS.r, t),
      fill: rhythmDiscFill(uMid, tone),
    },
    avatarO: spline(CRS.av, t),
  };
}

/* 06v3 · Gulp — sip --------------------------------------------------------- */

const GUP = {
  d1x: [[0, 24], [180, 25.2]] as Pt[],
  d1y: [[0, 29.652], [180, 29.9]] as Pt[],
  d1r: [[0, 2.056], [100, 1.9], [180, 0.05]] as Pt[],
  d3x: [[0, 36], [380, 34.9]] as Pt[],
  d3y: [[0, 29.652], [380, 29.9]] as Pt[],
  d3r: [[0, 2.056], [260, 1.9], [380, 0.05]] as Pt[],
  r: [
    [0, 2], [140, 2.4], [220, 3.8], [280, 3.5], [350, 3.7],
    [430, 5.6], [480, 5.35], [560, 9.72], [640, 9.52], [710, 9.62], [780, 9.6], [850, 9.6],
  ] as Pt[],
  sx: [[0, 1], [500, 1], [540, 0.97], [590, 1.03], [640, 0.995], [690, 1], [850, 1]] as Pt[],
  sy: [[0, 1], [500, 1], [540, 1.05], [590, 0.96], [640, 1.01], [690, 1], [850, 1]] as Pt[],
  tone: [[0, 0], [520, 0], [660, 1], [850, 1]] as Pt[],
  av: [[600, 0], [740, 1], [850, 1]] as Pt[],
};

function gulpV3Morph(t: number): Frame {
  const dot = (xs: Pt[], ys: Pt[], rs: Pt[]): Dot => {
    const r = spline(rs, t);
    return { x: spline(xs, t), y: spline(ys, t), r, fill: SAT_FILL, o: clamp01(r / 0.9) };
  };
  return {
    sats: [dot(GUP.d1x, GUP.d1y, GUP.d1r), dot(GUP.d3x, GUP.d3y, GUP.d3r)],
    blob: {
      x: 30,
      y: 30,
      r: spline(GUP.r, t),
      sx: spline(GUP.sx, t),
      sy: spline(GUP.sy, t),
      fill: toneFill(GUP.tone, t),
    },
    avatarO: spline(GUP.av, t),
  };
}

/* 03 · Rubber band (archive) ------------------------------------------------ */

const RB = {
  d1x: [[0, 24], [140, 17], [260, 12], [340, 10.5], [365, 14], [410, 29.8]] as Pt[],
  d1y: [[0, 29.652], [140, 30.2], [260, 30.8], [340, 31], [410, 30.1]] as Pt[],
  d1rx: [[0, 2.056], [180, 2.6], [340, 3.3], [362, 4.3], [395, 2.3], [410, 1.8]] as Pt[],
  d1ry: [[0, 2.056], [180, 1.85], [340, 1.5], [362, 1.35], [410, 1.8]] as Pt[],
  d3x: [[0, 36], [150, 43.5], [280, 48], [380, 49.5], [402, 45.5], [450, 30.2]] as Pt[],
  d3y: [[0, 29.652], [150, 29.4], [280, 29.1], [380, 29], [450, 29.9]] as Pt[],
  d3rx: [[0, 2.056], [200, 2.6], [380, 3.4], [402, 4.4], [435, 2.3], [450, 1.8]] as Pt[],
  d3ry: [[0, 2.056], [200, 1.85], [380, 1.45], [450, 1.8]] as Pt[],
  blobR: [
    [0, 2], [250, 2.9], [390, 3.3], [410, 3.5],
    [480, 10.9], [545, 8.9], [610, 10.2], [675, 9.4],
    [740, 9.68], [805, 9.55], [870, 9.6], [900, 9.6],
  ] as Pt[],
  tone: [[0, 0], [410, 0], [545, 1], [900, 1]] as Pt[],
};

function rubberDot(xs: Pt[], ys: Pt[], rxs: Pt[], rys: Pt[], t: number): Dot {
  return {
    x: spline(xs, t),
    y: spline(ys, t),
    r: spline(rys, t),
    rx: spline(rxs, t),
    ry: spline(rys, t),
    fill: SAT_FILL,
    o: 1,
  };
}

function rubberMorph(t: number): Frame {
  return {
    sats: [
      rubberDot(RB.d1x, RB.d1y, RB.d1rx, RB.d1ry, t),
      rubberDot(RB.d3x, RB.d3y, RB.d3rx, RB.d3ry, t),
    ],
    blob: discAt(t, RB.blobR, RB.tone, 410, 1.0),
    avatarO: spline([[455, 0], [615, 1], [900, 1]], t),
  };
}

/* 07 · Splash (archive) ----------------------------------------------------- */

const SP = {
  d1x: [[0, 24], [90, 20.5], [165, 25.8], [205, 29.7]] as Pt[],
  d1y: [[0, 29.652], [90, 35.5], [165, 33.8], [205, 30.2]] as Pt[],
  d3x: [[0, 36], [70, 39.5], [160, 34.5], [230, 30.2]] as Pt[],
  d3y: [[0, 29.652], [70, 25], [160, 25.5], [230, 29.8]] as Pt[],
  satR: [[0, 2.056], [150, 1.9], [230, 1.5]] as Pt[],
  // Droplets: ejected from behind the disc on impact, arcing out and
  // falling back in — they start and end hidden under the disc.
  drops: [
    {
      x: [[235, 30], [320, 40], [420, 36.5], [490, 31]] as Pt[],
      y: [[235, 30], [320, 21], [420, 26], [490, 29.5]] as Pt[],
      r: [[235, 1.2], [490, 0.85]] as Pt[],
    },
    {
      x: [[245, 30], [330, 19.5], [430, 24], [500, 29]] as Pt[],
      y: [[245, 30], [330, 24], [430, 28], [500, 30]] as Pt[],
      r: [[245, 1.0], [500, 0.7]] as Pt[],
    },
    {
      x: [[250, 30], [330, 35], [425, 32.5], [485, 30.5]] as Pt[],
      y: [[250, 30], [330, 40.5], [425, 35], [485, 31]] as Pt[],
      r: [[250, 0.85], [485, 0.6]] as Pt[],
    },
  ],
  blobR: [
    [0, 2], [150, 3.2], [205, 3.5], [235, 3.9],
    [310, 10.8], [375, 9.1], [440, 9.95], [505, 9.45],
    [570, 9.7], [640, 9.55], [710, 9.6], [950, 9.6],
  ] as Pt[],
  tone: [[0, 0], [230, 0], [380, 1], [950, 1]] as Pt[],
};

function splashMorph(t: number): Frame {
  const r = spline(SP.satR, t);
  const sats = [trackDot(SP.d1x, SP.d1y, t, r), trackDot(SP.d3x, SP.d3y, t, r)];
  for (const d of SP.drops) {
    sats.push({ x: spline(d.x, t), y: spline(d.y, t), r: spline(d.r, t), fill: SAT_FILL, o: 1 });
  }
  return {
    sats,
    blob: discAt(t, SP.blobR, SP.tone, 230, 0.8),
    avatarO: spline([[430, 0], [590, 1], [950, 1]], t),
  };
}

/* 08 · Coin flip (archive) -------------------------------------------------- */

const CF = {
  d1x: [[0, 24], [110, 22.5], [210, 27], [280, 29.8]] as Pt[],
  d1y: [[0, 29.652], [110, 34.5], [210, 34], [280, 30.2]] as Pt[],
  d3x: [[0, 36], [90, 37.5], [190, 33], [300, 30.2]] as Pt[],
  d3y: [[0, 29.652], [90, 25.5], [190, 25.8], [300, 29.8]] as Pt[],
  satR: [[0, 2.056], [200, 1.7], [300, 1.2]] as Pt[],
  blobR: [[0, 2], [150, 4], [300, 7], [420, 9.6], [630, 9.6], [662, 9.9], [700, 9.6], [950, 9.6]] as Pt[],
  // The flip: grey face out, charcoal + avatar face back.
  sx: [[0, 1], [450, 1], [540, 0.05], [630, 1], [663, 1.05], [700, 1], [950, 1]] as Pt[],
  tone: [[0, 0], [532, 0], [548, 1], [950, 1]] as Pt[],
};

function coinflipMorph(t: number): Frame {
  const r = spline(CF.satR, t);
  const blob = discAt(t, CF.blobR, CF.tone, 630, 0.35);
  blob.sx = Math.max(0.04, spline(CF.sx, t));
  return {
    sats: [trackDot(CF.d1x, CF.d1y, t, r), trackDot(CF.d3x, CF.d3y, t, r)],
    blob,
    avatarO: spline([[535, 0], [560, 1], [950, 1]], t),
  };
}

/* 09 · Blink (archive) ------------------------------------------------------ */

const BL = {
  d1x: [[0, 24], [100, 20], [210, 23.5], [290, 29.7]] as Pt[],
  d1y: [[0, 29.652], [100, 31.5], [210, 25], [290, 29.8]] as Pt[],
  d3x: [[0, 36], [120, 40], [230, 36], [320, 30.3]] as Pt[],
  d3y: [[0, 29.652], [120, 28], [230, 34.8], [320, 30.2]] as Pt[],
  satR: [[0, 2.056], [220, 1.7], [320, 1.2]] as Pt[],
  blobR: [
    [0, 2], [160, 3.4], [320, 4.2], [420, 4.4],
    [500, 10.1], [560, 9.3], [620, 9.75], [680, 9.5],
    [740, 9.6], [1000, 9.6],
  ] as Pt[],
  tone: [[0, 0], [430, 0], [540, 1], [1000, 1]] as Pt[],
  // Eye opens, holds, quick re-blink, open for good.
  lid: [[0, 0], [530, 0], [600, 1], [650, 1], [690, 0.2], [740, 1], [1000, 1]] as Pt[],
};

function blinkMorph(t: number): Frame {
  const r = spline(BL.satR, t);
  return {
    sats: [trackDot(BL.d1x, BL.d1y, t, r), trackDot(BL.d3x, BL.d3y, t, r)],
    blob: discAt(t, BL.blobR, BL.tone, 430, 0.4),
    avatarO: spline([[500, 0], [540, 1], [1000, 1]], t),
    lid: clamp01(spline(BL.lid, t)),
  };
}

/* --------------------------------- roster ---------------------------------- */

const BASE_VARIANTS: Variant[] = [
  /* ------------------------------- v1 ------------------------------------- */
  {
    key: "slingshot",
    num: "01",
    title: "Slingshot",
    group: "v1",
    blurb:
      "The outer dots sling out on curved comet arcs — three-quarters of a turn, gathering speed, staggered, trailing ghosts — then drive into the middle one after the other. The disc springs up from the first hit.",
    morphMs: 725,
    morph: slingshotMorph,
    stripMorph: [
      { label: "+55", t: 55 }, { label: "+100", t: 100 }, { label: "+142", t: 142 },
      { label: "+185", t: 185 }, { label: "+210 dive", t: 210 }, { label: "+293 pop", t: 293 },
      { label: "+425", t: 425 }, { label: "resolve", t: 725 },
    ],
  },
  {
    key: "suction",
    num: "02",
    title: "Suction",
    group: "v1",
    blurb:
      "The dots grow apart first — drifting free, out to nearly four times the resting spread, slowing as the attractor's pull fights their momentum. Then the pull wins: they whip down tightening spirals, and the disc inhales, gulps them down, and springs into the agent.",
    morphMs: 960,
    morph: suctionMorph,
    stripMorph: [
      { label: "+100", t: 100 }, { label: "+200", t: 200 }, { label: "+270", t: 270 },
      { label: "+345", t: 345 }, { label: "+410 dive", t: 410 }, { label: "+450 gulp", t: 450 },
      { label: "+520 pop", t: 520 }, { label: "+640", t: 640 }, { label: "resolve", t: 960 },
    ],
  },
  {
    key: "orbit",
    num: "04",
    title: "Decaying orbit",
    group: "v1",
    blurb:
      "Gravity capture: the dots fall into tilted elliptical orbits that visibly rush at close approach and laze at the far end — each pass tighter than the last — until they burn in and the disc erupts.",
    morphMs: 1050,
    morph: orbitMorph,
    stripMorph: [
      { label: "+130", t: 130 }, { label: "+290", t: 290 }, { label: "+430", t: 430 },
      { label: "+520", t: 520 }, { label: "+560 burn-in", t: 560 }, { label: "+635 pop", t: 635 },
      { label: "+780", t: 780 }, { label: "resolve", t: 1050 },
    ],
  },
  {
    key: "rhythm",
    num: "05",
    title: "Collapse in rhythm",
    group: "v1",
    blurb:
      "No stray at all: the typing wave keeps beating, and each bounce lands the outer dots a step closer to the middle until the last one drops them inside. The merge grows out of the typing rhythm — the calmest of the set.",
    morphMs: 1200,
    morph: rhythmMorph,
    stripMorph: [
      { label: "+300", t: 300 }, { label: "+530", t: 530 }, { label: "+680", t: 680 },
      { label: "+790", t: 790 }, { label: "+830 land", t: 830 }, { label: "+905 pop", t: 905 },
      { label: "+1020", t: 1020 }, { label: "resolve", t: 1200 },
    ],
  },
  {
    key: "gulp",
    num: "06",
    title: "Gulp handoff",
    group: "v1",
    blurb:
      "No travel: the outer dots dissolve in place, one at a time, and the center pumps bigger on each disappearance — two heartbeat gulps — then springs into the agent. Teleport-absorption, very quiet.",
    morphMs: 1080,
    morph: gulpMorph,
    stripMorph: [
      { label: "+230 gulp", t: 230 }, { label: "+300", t: 300 }, { label: "+490 gulp", t: 490 },
      { label: "+660 spring", t: 660 }, { label: "+800", t: 800 }, { label: "resolve", t: 1080 },
    ],
  },
  /* ------------------------------- v2 ------------------------------------- */
  {
    key: "slingshot-v2",
    num: "01",
    title: "Slingshot v2 · Knockback",
    group: "v2",
    blurb:
      "Same travel, tailored arrival: no generic shudder — each landing knocks the disc along its own impact axis with a directional squash (hit one shoves it down-left, hit two punches back), then one fast rebound instead of a long ring.",
    morphMs: 725,
    morph: slingshotV2Morph,
    stripMorph: [
      { label: "+100", t: 100 }, { label: "+185", t: 185 }, { label: "+236 knock", t: 236 },
      { label: "+272 knock", t: 272 }, { label: "+330 peak", t: 330 }, { label: "+460", t: 460 },
      { label: "resolve", t: 725 },
    ],
  },
  {
    key: "suction-v2",
    num: "02",
    title: "Suction v2 · Soft bloom",
    group: "v2",
    blurb:
      "Same travel, no bounce at all: a deep inhale after the last dot lands, then the disc blooms smoothly to size — overdamped, one gentle sigh — and the face grows in from within instead of fading over the disc.",
    morphMs: 960,
    morph: suctionV2Morph,
    stripMorph: [
      { label: "+200", t: 200 }, { label: "+345", t: 345 }, { label: "+450 land", t: 450 },
      { label: "+470 inhale", t: 470 }, { label: "+600 bloom", t: 600 }, { label: "+750 face", t: 750 },
      { label: "resolve", t: 960 },
    ],
  },
  {
    key: "orbit-v2",
    num: "04",
    title: "Orbit v2 · Spin-in",
    group: "v2",
    blurb:
      "Same travel, rotational arrival: the burn-in's angular momentum carries into the face, which spins in through the last 140° — decelerating, over-rotating a hair, settling — while the disc wobbles on its width instead of rattling.",
    morphMs: 1050,
    morph: orbitV2Morph,
    stripMorph: [
      { label: "+290", t: 290 }, { label: "+520", t: 520 }, { label: "+560 burn-in", t: 560 },
      { label: "+635 pop", t: 635 }, { label: "+700 spin", t: 700 }, { label: "+800", t: 800 },
      { label: "resolve", t: 1050 },
    ],
  },
  {
    key: "rhythm-v2",
    num: "05",
    title: "Rhythm v2 · On the beat",
    group: "v2",
    blurb:
      "Same travel, and the settle keeps the meter: the disc grows in two beats — a small pop, then a bigger one — bobbing upward on each beat exactly like the typing dots did, decaying back to stillness. The face lands on the second beat.",
    morphMs: 1400,
    morph: rhythmV2Morph,
    stripMorph: [
      { label: "+530", t: 530 }, { label: "+790", t: 790 }, { label: "+830 land", t: 830 },
      { label: "+905 beat", t: 905 }, { label: "+1055 beat", t: 1055 }, { label: "+1205", t: 1205 },
      { label: "resolve", t: 1400 },
    ],
  },
  {
    key: "gulp-v2",
    num: "06",
    title: "Gulp v2 · Swallow",
    group: "v2",
    blurb:
      "Same travel, and the arrival is a real swallow: after the second pump the disc stretches tall, squashes wide going down, and recovers — squash-and-stretch instead of a ring — with the face arriving as it settles.",
    morphMs: 1080,
    morph: gulpV2Morph,
    stripMorph: [
      { label: "+230 gulp", t: 230 }, { label: "+490 gulp", t: 490 }, { label: "+640 stretch", t: 640 },
      { label: "+690 squash", t: 690 }, { label: "+770", t: 770 }, { label: "resolve", t: 1080 },
    ],
  },
  /* ------------------------------- v3 ------------------------------------- */
  {
    key: "slingshot-v3",
    num: "01",
    title: "Slingshot v3 · Flick",
    group: "v3",
    blurb:
      "The slingshot at indoor volume: two small, quick curved flicks into the center — no trails, no big arcs — and each landing gives the disc only a half-unit directional nudge before a 3% pop and a single soft rebound.",
    morphMs: 600,
    morph: slingshotV3Morph,
    stripMorph: [
      { label: "+70", t: 70 }, { label: "+140", t: 140 }, { label: "+204 nudge", t: 204 },
      { label: "+240 pop", t: 240 }, { label: "+330", t: 330 }, { label: "resolve", t: 600 },
    ],
  },
  {
    key: "suction-v3",
    num: "02",
    title: "Suction v3 · Draw-in",
    group: "v3",
    blurb:
      "The pull without the drama: the dots drift just a couple of units apart, then curve gently into the center; a barely-there inhale, a smooth no-overshoot bloom, and the face grows in from 0.9.",
    morphMs: 700,
    morph: suctionV3Morph,
    stripMorph: [
      { label: "+120", t: 120 }, { label: "+230", t: 230 }, { label: "+335 in", t: 335 },
      { label: "+480 bloom", t: 480 }, { label: "+580", t: 580 }, { label: "resolve", t: 700 },
    ],
  },
  {
    key: "orbit-v3",
    num: "04",
    title: "Orbit v3 · Half-pass",
    group: "v3",
    blurb:
      "One close, modest pass instead of a decaying system — the dots swing a single tightening loop within eight units — and the face spins in through just 32°, settling without a wobble.",
    morphMs: 750,
    morph: orbitV3Morph,
    stripMorph: [
      { label: "+130", t: 130 }, { label: "+260", t: 260 }, { label: "+410 in", t: 410 },
      { label: "+510 pop", t: 510 }, { label: "+560 spin", t: 560 }, { label: "resolve", t: 750 },
    ],
  },
  {
    key: "rhythm-v3",
    num: "05",
    title: "Rhythm v3 · Soft cadence",
    group: "v3",
    blurb:
      "The collapse on a quicker meter, and the settle is a single soft beat — one gentle pop with a 0.7-unit bob, no second bounce — with the face arriving right behind it.",
    morphMs: 1000,
    morph: rhythmV3Morph,
    stripMorph: [
      { label: "+250", t: 250 }, { label: "+450", t: 450 }, { label: "+650 land", t: 650 },
      { label: "+720 beat", t: 720 }, { label: "+850", t: 850 }, { label: "resolve", t: 1000 },
    ],
  },
  {
    key: "gulp-v3",
    num: "06",
    title: "Gulp v3 · Sip",
    group: "v3",
    blurb:
      "The swallow at a sip: the dots dissolve quickly, the pumps are shallow, and the squash-and-stretch is within 5% — a polite little gulp before the face settles in.",
    morphMs: 850,
    morph: gulpV3Morph,
    stripMorph: [
      { label: "+180 sip", t: 180 }, { label: "+380 sip", t: 380 }, { label: "+540 stretch", t: 540 },
      { label: "+590 squash", t: 590 }, { label: "+700", t: 700 }, { label: "resolve", t: 850 },
    ],
  },
  /* ----------------------------- archive ----------------------------------- */
  {
    key: "rubber-band",
    num: "03",
    title: "Rubber band",
    group: "archive",
    blurb:
      "The dots strain slowly apart, elongating under the tension, hang at full stretch — then release: they snap dead straight into the center in a blink, one after the other, and the disc takes the hardest hit of the set.",
    morphMs: 900,
    morph: rubberMorph,
    stripMorph: [
      { label: "+140", t: 140 }, { label: "+340 stretch", t: 340 }, { label: "+375 snap", t: 375 },
      { label: "+420", t: 420 }, { label: "+480 pop", t: 480 }, { label: "+610", t: 610 },
      { label: "resolve", t: 900 },
    ],
  },
  {
    key: "splash",
    num: "07",
    title: "Splash",
    group: "archive",
    blurb:
      "Quick dives in, and the impact ejects three droplets that arc out from behind the disc and fall back in while it rings down — the secondary action sells the force.",
    morphMs: 950,
    morph: splashMorph,
    stripMorph: [
      { label: "+90", t: 90 }, { label: "+165", t: 165 }, { label: "+235 splash", t: 235 },
      { label: "+330", t: 330 }, { label: "+430", t: 430 }, { label: "+520", t: 520 },
      { label: "resolve", t: 950 },
    ],
  },
  {
    key: "coin-flip",
    num: "08",
    title: "Coin flip",
    group: "archive",
    blurb:
      "The dots fold in gently and the disc grows to full size still grey — then flips on its vertical axis: grey on the way out, charcoal and face on the way back, landing with a tiny bounce.",
    morphMs: 950,
    morph: coinflipMorph,
    stripMorph: [
      { label: "+150", t: 150 }, { label: "+300", t: 300 }, { label: "+420 disc", t: 420 },
      { label: "+540 edge", t: 540 }, { label: "+575", t: 575 }, { label: "+660 land", t: 660 },
      { label: "resolve", t: 950 },
    ],
  },
  {
    key: "blink",
    num: "09",
    title: "Blink",
    group: "archive",
    blurb:
      "Consolidate, darken — then the face arrives like an eye opening: the smile is revealed by a lid that opens, holds, and gives one quick re-blink. A character beat instead of a physics beat.",
    morphMs: 1000,
    morph: blinkMorph,
    stripMorph: [
      { label: "+100", t: 100 }, { label: "+230", t: 230 }, { label: "+320", t: 320 },
      { label: "+500 pop", t: 500 }, { label: "+600 open", t: 600 }, { label: "+690 blink", t: 690 },
      { label: "resolve", t: 1000 },
    ],
  },
];

// The tewt demo: the five v2 arrivals resolving into test-tewt, with the
// dots taking on the host pfp's blue mid-transition.
export const VARIANTS: Variant[] = [
  ...BASE_VARIANTS,
  ...BASE_VARIANTS.filter((v) => v.group === "v2").map((v) => ({
    ...hostTinted(v, TEWT_HOST),
    group: "demo" as const,
    title: v.title.replace(" v2 ", " tewt "),
  })),
];

/* ------------------------------ cycle machinery ---------------------------- */

export const TYPE_MS = 2 * WAVE_MS; // two wave loops before the morph
export const HOLD_MS = 1500;
export const RESET_MS = 450;
export const cycleMs = (v: Variant) => TYPE_MS + v.morphMs + HOLD_MS + RESET_MS;

export type PhaseName = "typing" | "morph" | "agent" | "reset";

export function cycleFrame(v: Variant, c: number): { frame: Frame; phase: PhaseName } {
  if (c < TYPE_MS) {
    // Side dots fade in over the first beat (also covers first paint).
    return { frame: typingFrame(c, Math.min(1, c / 250)), phase: "typing" };
  }
  if (c < TYPE_MS + v.morphMs) {
    return { frame: v.morph(c - TYPE_MS), phase: "morph" };
  }
  if (c < TYPE_MS + v.morphMs + HOLD_MS) {
    return { frame: v.morph(v.morphMs), phase: "agent" };
  }
  return { frame: resetFrame(c - TYPE_MS - v.morphMs - HOLD_MS), phase: "reset" };
}
