"use client";

// The Ando hive — the Ando half of the workspace-diagram polarity,
// shelved in /the-library alongside it.
//
// A dotted line is the whole workplace; inside it, a hive on a sphere —
// every dot roaming the surface on its own trajectory, trails replaying
// each dot's actual path, threads drawing themselves whenever two
// wanderers truly meet. Same drafting grammar as the parent diagram:
// dot-grid paper, dash-dot datum, centre mark, one blue accent.

import { useEffect, useRef } from "react";
import "./ando-hive.css";

// ── Geometry ────────────────────────────────────────────────────────────
const CX = 320;
const CY = 250; // dead centre of the 500-tall viewBox — the datum
const RX = 200;
const RY = 84;

// Coordinates are rounded so the numbers serialize identically on the
// server and the client — raw doubles trip React's hydration check.
const round = (n: number) => Math.round(n * 10) / 10;

// ── Ando: the workplace, drawn once ─────────────────────────────────────
// A dotted line is the whole workplace. Inside it the congregation is a
// HIVE on a sphere: every dot roams the surface on its own trajectory —
// its own drift direction and speed in longitude, its own wander in
// latitude, its own radial breath — with no shared rotation track at all.
// The trail behind each dot is its actual path over the last few seconds,
// so fast dots pull long comets and resting dots sit nearly bare. The
// sphere's silhouette holds because every wanderer stays parametrized on
// the surface; the motion inside it is sporadic on purpose.
const N_TRAIL = 64;
const GOLDEN = 2.399963229728653; // radians — Fibonacci seeding
const TILT = 0.5; // camera pitch
const SX = 92; // sphere radius on screen — equal axes
const SY = 92;
const SEG = 8; // trail samples
const TAU = 0.3; // s between trail samples — ~2.4s of remembered path

function projectPt(R: number, Y: number, lon: number) {
  const x1 = R * Math.cos(lon);
  const z1 = R * Math.sin(lon);
  const y1 = Y * Math.cos(TILT) - z1 * Math.sin(TILT);
  const z2 = Y * Math.sin(TILT) + z1 * Math.cos(TILT);
  return {
    x: round(CX + x1 * SX),
    y: round(CY - y1 * SY),
    nd: Math.round(((z2 + 1) / 2) * 100) / 100, // 0 = far, 1 = near
  };
}

// Per-dot trajectory: seeded evenly over the sphere (Fibonacci), then
// everything else is individual. Half drift east, half west, at speeds
// spread almost 3× — the "one rotation track" read is gone by design.
const MOTION = Array.from({ length: N_TRAIL }, (_, i) => ({
  th0: Math.acos(0.85 * (1 - (2 * (i + 0.5)) / N_TRAIL)), // polar seed, off the poles
  phi0: i * GOLDEN,
  drift: (0.09 + ((i * 7) % 5) * 0.035) * (i % 2 === 0 ? 1 : -1),
  a1: 0.17 + ((i * 3) % 4) * 0.06, // longitude wander
  w1: 0.18 + ((i * 5) % 5) * 0.05,
  p1: i * 2.4,
  b1: 0.12 + ((i * 2) % 4) * 0.04, // latitude wander, slow
  w3: 0.22 + ((i * 3) % 5) * 0.045,
  p3: 3.1 + i * 0.9,
  b2: 0.06 + ((i * 5) % 3) * 0.03, // latitude wander, quick
  w4: 0.4 + ((i * 7) % 4) * 0.07,
  p4: i * 1.9,
  sw: 0.05 + (i % 5 === 0 ? 0.06 : 0), // radial breath; scouts range further
  w2: 0.31 + ((i * 2) % 4) * 0.06,
  p2: 1.7 + i * 1.3,
}));

function posAt(i: number, t: number) {
  const m = MOTION[i];
  const phi = m.phi0 + m.drift * t + m.a1 * Math.sin(m.w1 * t + m.p1);
  const th = m.th0 + m.b1 * Math.sin(m.w3 * t + m.p3) + m.b2 * Math.sin(m.w4 * t + m.p4);
  const swell = 1 + m.sw * Math.sin(m.w2 * t + m.p2);
  const R = Math.sin(th) * swell;
  const Y = Math.cos(th) * swell;
  const pr = projectPt(R, Y, phi);
  // The dot's 3D position, for measuring who is actually near whom.
  return { ...pr, vx: R * Math.cos(phi), vy: Y, vz: R * Math.sin(phi) };
}

type Streak = { d: string; head: P3 };

// The trail is the dot's real path — its last SEG*TAU seconds, replayed.
function streakAt(i: number, t: number): Streak {
  const pts = Array.from({ length: SEG + 1 }, (_, k) => posAt(i, t - TAU * k));
  return {
    d: "M" + pts.map((q) => `${q.x} ${q.y}`).join("L"),
    head: pts[0],
  };
}

// Connection candidates: pairs whose seeds sit near each other on the
// sphere. Scored live by 3D distance each frame — most links rest at zero
// opacity; when two wanderers close in, their line draws itself, holds,
// and lets go as they part.
const seedVec = (i: number) => {
  const m = MOTION[i];
  return {
    x: Math.sin(m.th0) * Math.cos(m.phi0),
    y: Math.cos(m.th0),
    z: Math.sin(m.th0) * Math.sin(m.phi0),
  };
};
const LINKS: [number, number][] = [];
for (let i = 0; i < N_TRAIL; i++) {
  const a = seedVec(i);
  for (let j = i + 1; j < N_TRAIL; j++) {
    const b = seedVec(j);
    const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    if (d < 0.65) LINKS.push([i, j]);
  }
}

type P3 = { x: number; y: number; nd: number; vx: number; vy: number; vz: number };
const LINK_O = (a: P3, b: P3) => {
  const d = Math.hypot(a.vx - b.vx, a.vy - b.vy, a.vz - b.vz);
  if (d > 0.42) return 0;
  // Near in space and near the viewer both brighten the thread.
  return round(((0.42 - d) / 0.42) * 0.5 * (0.35 + 0.65 * ((a.nd + b.nd) / 2)));
};

const DOT_R = (nd: number) => round(1.1 + 1.7 * nd);
const DOT_O = (nd: number) => round(0.3 + 0.65 * nd);
const TRAIL_O = (nd: number) => round(0.06 + 0.3 * nd);

const INIT = Array.from({ length: N_TRAIL }, (_, i) => streakAt(i, 0));

export default function AndoHiveDiagram() {
  const ballRefs = useRef<(SVGCircleElement | null)[]>([]);
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);
  const linkRefs = useRef<(SVGLineElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const heads: P3[] = [];
      for (let i = 0; i < N_TRAIL; i++) {
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
    <div className="hive">
      <main className="hive-stage">
        <section className="hive-half">
          <svg className="hive-canvas" viewBox="0 0 640 500" fill="none">
            {/* datum + centre mark — the drawing's construction, kept visible */}
            <line x1="0" y1={CY} x2="640" y2={CY} className="sva-datum" />
            <line x1={CX - 9} y1={CY} x2={CX + 9} y2={CY} className="sva-center-mark" />
            <line x1={CX} y1={CY - 9} x2={CX} y2={CY + 9} className="sva-center-mark" />

            {/* faint sibling rings, Atomic-style */}
            <ellipse cx={CX} cy={CY} rx={150} ry={63} className="sva-ring" />
            <ellipse cx={CX} cy={CY} rx={252} ry={106} className="sva-ring" />

            {/* the workplace — one ink line */}
            <ellipse cx={CX} cy={CY} rx={RX} ry={RY} className="sva-workplace" />

            {/* the globe — each dot's trail arcs along its latitude */}
            {INIT.map((s, i) => (
              <path
                key={i}
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
                d={s.d}
                strokeOpacity={TRAIL_O(s.head.nd)}
                className="sva-trail"
              />
            ))}

            {/* the connections — threads that draw themselves whenever
                two wanderers actually meet, and let go as they part */}
            {LINKS.map(([i, j], k) => (
              <line
                key={k}
                ref={(el) => {
                  linkRefs.current[k] = el;
                }}
                x1={INIT[i].head.x}
                y1={INIT[i].head.y}
                x2={INIT[j].head.x}
                y2={INIT[j].head.y}
                strokeOpacity={LINK_O(INIT[i].head, INIT[j].head)}
                className="sva-link"
              />
            ))}

            {/* the congregation — one species, each on its own errand */}
            {INIT.map((s, i) => (
              <circle
                key={i}
                ref={(el) => {
                  ballRefs.current[i] = el;
                }}
                transform={`translate(${s.head.x} ${s.head.y})`}
                r={DOT_R(s.head.nd)}
                opacity={DOT_O(s.head.nd)}
                className="sva-dot"
              />
            ))}
          </svg>
        </section>
      </main>

      <footer className="hive-footer">
        <span>FIG. 02</span>
        <span>THE HIVE, HELD</span>
      </footer>
    </div>
  );
}
