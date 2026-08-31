"use client";

// The instrument globe — the bezel take, finished as the WHOLE sphere
// (Ando Brand 3678-9503): both hemispheres built, the full circle
// floating in the card with air on every side. The affiliate footer
// keeps its horizon crop (app/affiliate/footer-globe.tsx); this is the
// instrument seen whole.
//
// The graticule is a bezel: solid rings, dotted rings, and tick rings
// of two weights mirrored around the equator, the way a dial mixes its
// scales. Latitude rings are rotationally invariant — a spinning
// sphere of them looks still — so the ticks are what make the rotation
// legible: adjacent tick rings counter-rotate at their own paces, and
// a few solid arc fragments sweep their own latitudes just off the
// surface, each led by a small triangle marker, dimming as they swing
// behind the sphere. The congregation rides the rails; one blue,
// spent on the living.

import { useEffect, useRef } from "react";

// ── Stage ──────────────────────────────────────────────────────────────
// The whole sphere, fully in frame: the card's proportions (760×536,
// per the brand file), the circle centred with generous air around it.
const VW = 760;
const VH = 536;
const CX = 380;
const CY = 268;
const TILT = 0.32; // shallow camera — open rings, the top pole in view
const S = 168; // sphere radius on screen — D336 in a 536 frame

const round = (n: number) => Math.round(n * 10) / 10;

function projectPt(r: number, y: number, lon: number) {
  const x1 = r * Math.cos(lon);
  const z1 = r * Math.sin(lon);
  const y1 = y * Math.cos(TILT) - z1 * Math.sin(TILT);
  const z2 = y * Math.sin(TILT) + z1 * Math.cos(TILT);
  return {
    x: round(CX + x1 * S),
    y: round(CY - y1 * S),
    nd: Math.round(((z2 + 1) / 2) * 100) / 100, // 0 = far, 1 = near
  };
}

// A point on the sphere by latitude/longitude; lift floats it off the
// surface — the sweep arcs hover the way a dial's outer scale does.
function projectSph(th: number, lon: number, lift = 1) {
  return projectPt(Math.cos(th) * lift, Math.sin(th) * lift, lon);
}

// ── The graticule — a ring every 8°, each with its own voice ───────────
// Both hemispheres now: the roles mirror around the equator, so the
// dial reads the same climbing either pole, and geometry still crowds
// the rings as they go.
const RING_LATS = Array.from({ length: 21 }, (_, i) => -80 + i * 8);

type RingRole = "solid" | "dot" | "minor" | "major";
const NORTH_ROLES: RingRole[] = [
  "minor", //  0 — the equator, finely divided
  "solid", //  8
  "dot", //   16
  "major", // 24
  "solid", // 32
  "minor", // 40
  "solid", // 48
  "dot", //   56
  "major", // 64
  "dot", //   72 — the dial's dotted inner circle
  "solid", // 80
];
const RING_ROLES: RingRole[] = RING_LATS.map((deg) => NORTH_ROLES[Math.round(Math.abs(deg) / 8)]);

const PARALLELS = RING_LATS.map((deg) => {
  const th = (deg * Math.PI) / 180;
  return {
    cy: round(CY - S * Math.sin(th) * Math.cos(TILT)),
    rx: round(S * Math.cos(th)),
    ry: round(S * Math.cos(th) * Math.sin(TILT)),
  };
});

// The verticals — meridians through the pole, every 30°, projected
// under the same camera.
const MERIDIANS = [0, 30, 60, 90, 120, 150].map((deg) => {
  const phi = (deg * Math.PI) / 180;
  const pts = Array.from({ length: 73 }, (_, k) => {
    const psi = (k / 72) * Math.PI * 2;
    const x = S * Math.cos(psi) * Math.cos(phi);
    const yh = S * Math.sin(psi);
    const z = S * Math.cos(psi) * Math.sin(phi);
    return `${round(CX + x)} ${round(CY - (yh * Math.cos(TILT) - z * Math.sin(TILT)))}`;
  });
  return `M${pts.join("L")}Z`;
});

// ── Tick rings — the bezel, in two weights, counter-rotating ───────────
// Ticks run along the meridian direction so they foreshorten honestly.
// Each animated ring rebuilds as two paths per frame — the near half
// holds, the far half recedes — and neighbours turn against each other.
const TICK_RINGS = RING_LATS.map((deg, i) => {
  const role = RING_ROLES[i];
  if (role !== "minor" && role !== "major") return null;
  const th = (deg * Math.PI) / 180;
  const major = role === "major";
  return {
    th,
    len: (major ? 7 : 3.5) / S, // tick span, radians of latitude
    count: Math.max(major ? 12 : 30, Math.round((major ? 36 : 130) * Math.cos(th))),
    speed: [0.05, -0.065, 0.032, -0.045, 0.055][i % 5],
    phase: i * 0.7,
  };
}).filter((r) => r !== null);

function tickRingPaths(ring: (typeof TICK_RINGS)[number], t: number) {
  const rot = ring.phase + ring.speed * t;
  let near = "";
  let far = "";
  for (let k = 0; k < ring.count; k++) {
    const u = rot + (k / ring.count) * Math.PI * 2;
    const a = projectSph(ring.th - ring.len / 2, u);
    const b = projectSph(ring.th + ring.len / 2, u);
    const seg = `M${a.x} ${a.y}L${b.x} ${b.y}`;
    if (a.nd >= 0.5) near += seg;
    else far += seg;
  }
  return { near, far };
}

// ── Sweep arcs — solid fragments on the move, each with its marker ─────
// Between the rings, a shade off the surface: an arc holds its span,
// travels its latitude at its own pace, and its triangle leads.
const ARCS = [
  { lat: -52, span: 0.9, speed: -0.11, u0: 2.6, lift: 1.025 },
  { lat: -28, span: 1.4, speed: 0.08, u0: 0.3, lift: 1.02 },
  { lat: -12, span: 1.6, speed: 0.09, u0: 0.8, lift: 1.02 },
  { lat: 20, span: 0.9, speed: -0.13, u0: 3.4, lift: 1.025 },
  { lat: 44, span: 1.25, speed: 0.07, u0: 5.1, lift: 1.02 },
  { lat: 60, span: 0.55, speed: -0.16, u0: 1.9, lift: 1.03 },
];

function arcAt(arc: (typeof ARCS)[number], t: number) {
  const th = (arc.lat * Math.PI) / 180;
  const dir = Math.sign(arc.speed);
  const head = arc.u0 + arc.speed * t;
  const n = Math.max(12, Math.ceil(arc.span / 0.06));
  const pts = Array.from({ length: n + 1 }, (_, k) => projectSph(th, head - dir * arc.span * (k / n), arc.lift));
  const hp = pts[0];
  // the marker points where the arc is going
  const ahead = projectSph(th, head + dir * 0.04, arc.lift);
  const ang = Math.atan2(ahead.y - hp.y, ahead.x - hp.x);
  const tip = { x: hp.x + 5 * Math.cos(ang), y: hp.y + 5 * Math.sin(ang) };
  const b1 = { x: hp.x + 2.6 * Math.cos(ang + Math.PI / 2), y: hp.y + 2.6 * Math.sin(ang + Math.PI / 2) };
  const b2 = { x: hp.x + 2.6 * Math.cos(ang - Math.PI / 2), y: hp.y + 2.6 * Math.sin(ang - Math.PI / 2) };
  return {
    d: "M" + pts.map((q) => `${q.x} ${q.y}`).join("L"),
    tri: `${round(tip.x)} ${round(tip.y)} ${round(b1.x)} ${round(b1.y)} ${round(b2.x)} ${round(b2.y)}`,
    o: round(0.25 + 0.6 * hp.nd), // swings behind the dome, dims
  };
}

// ── The congregation — the hive's riders, on the built lines ───────────
// Every orb is bound to one of the globe's construction curves — a
// parallel or a meridian — and travels along it at its own pace and
// direction. Depth still comes from the sphere projection, so riders
// dim and shrink as their rail carries them around the far side.

const SEG = 8; // trail samples
const TAU = 0.3; // s between samples — ~2.4s of remembered path

// The riders scatter across the rings — rail, phase, pace and
// direction all drawn from index hashes so the spread reads random
// while serializing identically on server and client. The polar
// rings stay empty; nobody orbits a puddle.
const N_RIDERS = 28;
const RAIL_BASE = 2; // rails start at -64°…
const N_RIDE_RAILS = 17; // …and run to 64° — both hemispheres ride
const RIDERS = Array.from({ length: N_RIDERS }, (_, i) => ({
  rail: (i * 5 + ((i * 11) % 3)) % N_RIDE_RAILS,
  u0: i * 2.399963 + ((i * 7) % 5) * 0.61,
  speed: (0.05 + ((i * 5) % 7) * 0.017) * ((i * 3) % 4 < 2 ? 1 : -1),
}));

type P3 = { x: number; y: number; nd: number; vx: number; vy: number; vz: number };

function posAt(i: number, t: number): P3 {
  const rd = RIDERS[i];
  const u = rd.u0 + rd.speed * t;
  // riding a ring: fixed latitude, travelling in longitude
  const th = (RING_LATS[rd.rail + RAIL_BASE] * Math.PI) / 180;
  const r = Math.cos(th);
  const y = Math.sin(th);
  const pr = projectPt(r, y, u);
  return { ...pr, vx: r * Math.cos(u), vy: y, vz: r * Math.sin(u) };
}

function streakAt(i: number, t: number) {
  const pts = Array.from({ length: SEG + 1 }, (_, k) => posAt(i, t - TAU * k));
  return { d: "M" + pts.map((q) => `${q.x} ${q.y}`).join("L"), head: pts[0] };
}

// Thread candidates: same ring, or rings near enough in latitude that
// two riders can actually come close; 3D distance does the rest.
const LINKS: [number, number][] = [];
for (let i = 0; i < N_RIDERS; i++) {
  for (let j = i + 1; j < N_RIDERS; j++) {
    if (Math.abs(RIDERS[i].rail - RIDERS[j].rail) <= 2) LINKS.push([i, j]);
  }
}

const LINK_O = (a: P3, b: P3) => {
  const d = Math.hypot(a.vx - b.vx, a.vy - b.vy, a.vz - b.vz);
  if (d > 0.42) return 0;
  return round(((0.42 - d) / 0.42) * 0.5 * (0.35 + 0.65 * ((a.nd + b.nd) / 2)));
};

const DOT_R = (nd: number) => round(1.1 + 1.7 * nd);
const DOT_O = (nd: number) => round(0.3 + 0.65 * nd);
const TRAIL_O = (nd: number) => round(0.06 + 0.3 * nd);

const INIT = Array.from({ length: N_RIDERS }, (_, i) => streakAt(i, 0));
const INIT_TICKS = TICK_RINGS.map((r) => tickRingPaths(r, 0));
const INIT_ARCS = ARCS.map((a) => arcAt(a, 0));

export function FooterGlobeInstrument() {
  const ballRefs = useRef<(SVGCircleElement | null)[]>([]);
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);
  const linkRefs = useRef<(SVGLineElement | null)[]>([]);
  const tickNearRefs = useRef<(SVGPathElement | null)[]>([]);
  const tickFarRefs = useRef<(SVGPathElement | null)[]>([]);
  const arcRefs = useRef<(SVGPathElement | null)[]>([]);
  const triRefs = useRef<(SVGPolygonElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;

      TICK_RINGS.forEach((ring, i) => {
        const near = tickNearRefs.current[i];
        const far = tickFarRefs.current[i];
        if (!near || !far) return;
        const p = tickRingPaths(ring, t);
        near.setAttribute("d", p.near);
        far.setAttribute("d", p.far);
      });

      ARCS.forEach((arc, i) => {
        const el = arcRefs.current[i];
        const tri = triRefs.current[i];
        if (!el || !tri) return;
        const a = arcAt(arc, t);
        el.setAttribute("d", a.d);
        el.setAttribute("stroke-opacity", String(a.o));
        tri.setAttribute("points", a.tri);
        tri.setAttribute("opacity", String(a.o));
      });

      const heads: P3[] = [];
      for (let i = 0; i < N_RIDERS; i++) {
        const s = streakAt(i, t);
        heads.push(s.head);
        const trail = lineRefs.current[i];
        const head = ballRefs.current[i];
        if (trail) {
          trail.setAttribute("d", s.d);
          trail.setAttribute("stroke-opacity", String(TRAIL_O(s.head.nd)));
        }
        if (head) {
          head.setAttribute("transform", `translate(${s.head.x} ${s.head.y})`);
          head.setAttribute("r", String(DOT_R(s.head.nd)));
          head.setAttribute("opacity", String(DOT_O(s.head.nd)));
        }
      }
      LINKS.forEach(([i, j], k) => {
        const el = linkRefs.current[k];
        if (!el) return;
        const o = LINK_O(heads[i], heads[j]);
        el.setAttribute("stroke-opacity", String(o));
        if (o > 0) {
          el.setAttribute("x1", String(heads[i].x));
          el.setAttribute("y1", String(heads[i].y));
          el.setAttribute("x2", String(heads[j].x));
          el.setAttribute("y2", String(heads[j].y));
        }
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg aria-hidden className="size-full" fill="none" viewBox={`0 0 ${VW} ${VH}`}>
      {/* the globe's infrastructure — meridians, then each ring in its
          own voice: solid course, dotted course, or nothing where a
          tick ring takes the latitude instead */}
      {MERIDIANS.map((d, i) => (
        <path key={`m${i}`} d={d} stroke="#e0e5f0" strokeWidth="1" />
      ))}
      {PARALLELS.map((p, i) =>
        RING_ROLES[i] === "solid" ? (
          <ellipse key={`p${i}`} cx={CX} cy={p.cy} rx={p.rx} ry={p.ry} stroke="#e0e5f0" strokeWidth="1" />
        ) : RING_ROLES[i] === "dot" ? (
          <ellipse
            key={`p${i}`}
            cx={CX}
            cy={p.cy}
            rx={p.rx}
            ry={p.ry}
            stroke="#c9ced8"
            strokeDasharray="0.1 6"
            strokeLinecap="round"
            strokeWidth="1.3"
          />
        ) : null,
      )}

      {/* the bezel — tick rings in two weights, near half over far */}
      {INIT_TICKS.map((p, i) => (
        <g key={`tk${i}`}>
          <path
            ref={(el) => {
              tickFarRefs.current[i] = el;
            }}
            d={p.far}
            stroke="#d5d9e1"
            strokeOpacity="0.55"
            strokeWidth="1"
          />
          <path
            ref={(el) => {
              tickNearRefs.current[i] = el;
            }}
            d={p.near}
            stroke="#c9ced8"
            strokeWidth="1"
          />
        </g>
      ))}

      {/* the sweeps — solid fragments off the surface, markers leading */}
      {INIT_ARCS.map((a, i) => (
        <g key={`a${i}`}>
          <path
            ref={(el) => {
              arcRefs.current[i] = el;
            }}
            d={a.d}
            stroke="#a3abba"
            strokeLinecap="round"
            strokeOpacity={a.o}
            strokeWidth="1"
          />
          <polygon
            ref={(el) => {
              triRefs.current[i] = el;
            }}
            fill="#a3abba"
            opacity={a.o}
            points={a.tri}
          />
        </g>
      ))}

      {/* trails — each wanderer's actual last seconds, replayed */}
      {INIT.map((s, i) => (
        <path
          key={`t${i}`}
          ref={(el) => {
            lineRefs.current[i] = el;
          }}
          d={s.d}
          stroke="#2563eb"
          strokeOpacity={TRAIL_O(s.head.nd)}
          strokeWidth="1"
        />
      ))}

      {/* threads — drawn when two wanderers truly meet */}
      {LINKS.map(([i, j], k) => (
        <line
          key={`l${k}`}
          ref={(el) => {
            linkRefs.current[k] = el;
          }}
          stroke="#2563eb"
          strokeOpacity={LINK_O(INIT[i].head, INIT[j].head)}
          strokeWidth="1"
          x1={INIT[i].head.x}
          x2={INIT[j].head.x}
          y1={INIT[i].head.y}
          y2={INIT[j].head.y}
        />
      ))}

      {/* the congregation */}
      {INIT.map((s, i) => (
        <circle
          key={`d${i}`}
          ref={(el) => {
            ballRefs.current[i] = el;
          }}
          fill="#2563eb"
          opacity={DOT_O(s.head.nd)}
          r={DOT_R(s.head.nd)}
          transform={`translate(${s.head.x} ${s.head.y})`}
        />
      ))}
    </svg>
  );
}
