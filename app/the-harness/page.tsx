"use client";

// /the-harness — from the notebook sketch labeled "singular inflection
// point?", redrawn in the workspace diagram's language after the
// Ando-Brand inspo board. Ando is the ring: a harness seen in
// perspective, worn by a family of hairline field lines that pinch
// through its opening and flare out the other side. Jewel dots — the
// work — crawl the lines end to end; a few more ride the rim itself,
// docked on the harness. One blue sweep across the near rim carries the
// whole color budget, and the singular point sits quiet at the centre.
//
// The scene fades in once (ring, then lines, then traffic) and rests in
// motion — the crawl is the resting state, so there is no loop reset.
// Depth is painter's order: far arc, lines, near arc.

import { useEffect, useState, useSyncExternalStore } from "react";
import "./the-harness.css";

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

// ── Geometry ────────────────────────────────────────────────────────────
// A real hyperboloid, projected. The ring is the waist: every field line
// sits at its own azimuth around the axis, touches the rim exactly on
// the ring plane, and flares outward toward both mouths — a funnel of
// revolution, not a fan of flat curves. The projection is the ring's own
// foreshortening (K = ry/rx) applied to every depth coordinate, so the
// lines and the rim live in one geometry.
const CX = 320;
const CY = 232;
const RX = 205;
const RY = 64;
const K = RY / RX; // foreshortening of the ring plane
const H = 210; // half-height of the funnel, screen px
const RW = 127; // waist radius — well inside the rim, never touching it
const B = 0.589; // hyperboloid shape: r(±1) ≈ 250, flaring past the rim

const round = (n: number) => Math.round(n * 10) / 10;

// r(t): the surface radius at height t ∈ [-1, 1]. The waist (t = 0)
// passes through the loop's opening with clear air on every side; the
// harness is worn around the flow, not welded to it.
const radiusAt = (t: number) => RW * Math.sqrt(1 + (t / B) ** 2);

// A field line at azimuth θ, sampled top mouth → bottom mouth.
function linePath(theta: number) {
  const n = 24;
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = -1 + (2 * i) / n;
    const r = radiusAt(t);
    const x = CX + r * Math.cos(theta);
    const y = CY + t * H + r * Math.sin(theta) * K;
    return `${round(x)} ${round(y)}`;
  });
  return "M" + pts.join("L");
}

// Thirty-six azimuths — dense enough to read as a woven surface,
// bunching naturally at the silhouette edges, open enough to breathe.
// sin θ > 0 is the near half of the funnel, sin θ < 0 the far half.
const LINES = Array.from({ length: 36 }, (_, n) => {
  const theta = ((5 + n * 10) * Math.PI) / 180;
  return {
    id: `hn-fl${n}`,
    d: linePath(theta),
    near: Math.sin(theta) > 0,
  };
});

const FAR_ARC = `M ${CX - RX} ${CY} A ${RX} ${RY} 0 0 1 ${CX + RX} ${CY}`;
const NEAR_ARC = `M ${CX - RX} ${CY} A ${RX} ${RY} 0 0 0 ${CX + RX} ${CY}`;
// Invisible full loop for the rim-riding dots.
const FULL_RING = `M ${CX - RX} ${CY} A ${RX} ${RY} 0 1 0 ${CX + RX} ${CY} A ${RX} ${RY} 0 1 0 ${CX - RX} ${CY}`;

// The traffic. Line dots thread the funnel top to bottom; rim dots stay
// docked on it, orbiting. Periods and offsets are all coprime-ish so the
// scene never reads as a formation, and a dot on the far surface is a
// step fainter than one on the near — the same depth cue as the lines.
// Begins are NEGATIVE: a dot whose animation "hasn't started" renders
// parked at the SVG origin, so instead every animation started in the
// past and every dot is already mid-path on first paint.
const LINE_DOTS = [
  { line: "hn-fl1", dur: "9s", begin: "-4s", fill: "#4172ea", o: 0.95 },
  { line: "hn-fl22", dur: "11.5s", begin: "-1.7s", fill: "#7f9ceb", o: 0.45 },
  { line: "hn-fl4", dur: "10.4s", begin: "-3.9s", fill: "#4172ea", o: 0.95 },
  { line: "hn-fl26", dur: "13s", begin: "-0.9s", fill: "#aeb9d2", o: 0.4 },
  { line: "hn-fl8", dur: "12.2s", begin: "-5.3s", fill: "#7f9ceb", o: 0.8 },
  { line: "hn-fl3", dur: "11s", begin: "-6.8s", fill: "#4172ea", o: 0.9 },
  { line: "hn-fl30", dur: "12.6s", begin: "-2.8s", fill: "#aeb9d2", o: 0.35 },
  { line: "hn-fl11", dur: "10.8s", begin: "-8.2s", fill: "#7f9ceb", o: 0.75 },
  { line: "hn-fl34", dur: "13.6s", begin: "-4.6s", fill: "#aeb9d2", o: 0.4 },
  { line: "hn-fl15", dur: "9.8s", begin: "-7.4s", fill: "#4172ea", o: 0.9 },
  { line: "hn-fl20", dur: "12.9s", begin: "-6.1s", fill: "#7f9ceb", o: 0.45 },
  { line: "hn-fl16", dur: "10.1s", begin: "-2.2s", fill: "#4172ea", o: 0.9 },
];

// A line with traffic on it is lit — blue where the empty ones stay
// grey, so the surface quietly maps where the work is.
const LIT = new Set(LINE_DOTS.map((dot) => dot.line));

const RIM_DOTS = [
  { dur: "18s", begin: "-2s", fill: "#2563eb", o: 0.9 },
  { dur: "24s", begin: "-9s", fill: "#7f9ceb", o: 0.7 },
  { dur: "21s", begin: "-15s", fill: "#aeb9d2", o: 0.6 },
];

function TakeHarness() {
  const reduced = useReducedMotion();
  // One-shot fade-in: 1 ring + core, 2 lines, 3 traffic + caption.
  // Reduced motion holds the drawn scene — derived, never set from the
  // effect.
  const [drawn, setDrawn] = useState(0);
  const phase = reduced ? 3 : drawn;

  useEffect(() => {
    if (reduced) return;
    const timers = [
      window.setTimeout(() => setDrawn(1), 300),
      window.setTimeout(() => setDrawn(2), 900),
      window.setTimeout(() => setDrawn(3), 1900),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reduced]);

  return (
    <section className="hn-banner" aria-label="The harness — Ando as the singular inflection point">
      <svg className="hn-svg" viewBox="0 -10 640 510" aria-hidden>
        <defs>
          {/* The accent fades in and out along the sweep, the way the
              workspace diagram's blue orbit does. */}
          <linearGradient id="hn-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2563eb" stopOpacity="0" />
            <stop offset="0.28" stopColor="#2563eb" stopOpacity="0.9" />
            <stop offset="0.62" stopColor="#7f9ceb" stopOpacity="0.75" />
            <stop offset="1" stopColor="#7f9ceb" stopOpacity="0" />
          </linearGradient>
          {/* The funnel has no visible mouths: the surface (and the
              traffic on it) dissolves well before either opening, so
              only the middle of the vessel is ever seen. */}
          <linearGradient
            id="hn-vfade-grad"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={CY - H}
            x2="0"
            y2={CY + H}
          >
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.34" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.66" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="hn-vfade" maskUnits="userSpaceOnUse" x="0" y="-10" width="640" height="510">
            <rect x="0" y="-10" width="640" height="510" fill="url(#hn-vfade-grad)" />
          </mask>
        </defs>

        {/* The far half of the surface — behind the rim, a step fainter. */}
        <g mask="url(#hn-vfade)">
          {LINES.filter((line) => !line.near).map((line, i) => (
            <path
              key={line.id}
              id={line.id}
              className={`hn-line is-far${LIT.has(line.id) ? " is-lit" : ""}${phase >= 2 ? "" : " is-hidden"}`}
              style={{ transitionDelay: phase >= 2 ? `${i * 18}ms` : "0ms" }}
              d={line.d}
            />
          ))}
        </g>

        {/* The rim — far arc over the far surface. */}
        <path className={`hn-ring${phase >= 1 ? "" : " is-hidden"}`} d={FAR_ARC} />

        {/* Near rim and the one blue sweep. */}
        <path className={`hn-ring${phase >= 1 ? "" : " is-hidden"}`} d={NEAR_ARC} />
        <path
          className={`hn-accent${phase >= 1 ? "" : " is-hidden"}`}
          d={NEAR_ARC}
          stroke="url(#hn-grad)"
        />

        {/* The near half of the surface — in front of the rim. */}
        <g mask="url(#hn-vfade)">
          {LINES.filter((line) => line.near).map((line, i) => (
            <path
              key={line.id}
              id={line.id}
              className={`hn-line${LIT.has(line.id) ? " is-lit" : ""}${phase >= 2 ? "" : " is-hidden"}`}
              style={{ transitionDelay: phase >= 2 ? `${10 + i * 18}ms` : "0ms" }}
              d={line.d}
            />
          ))}
        </g>

        {/* The invisible loop the rim dots ride. */}
        <path id="hn-rim" d={FULL_RING} fill="none" stroke="none" />

        {/* The singular point. */}
        <circle className={`hn-core${phase >= 1 ? "" : " is-hidden"}`} cx="320" cy="225" r="6.5" />

        {/* The work, crawling. SMIL ignores reduced motion, so under it
            the dots are simply not rendered and the scene rests drawn. */}
        <g mask="url(#hn-vfade)">
          {!reduced
            ? LINE_DOTS.map((dot) => (
                <circle
                  key={dot.line}
                  className={`hn-dot${phase >= 3 ? "" : " is-hidden"}`}
                  r="2.2"
                  fill={dot.fill}
                  opacity={dot.o}
                >
                  <animateMotion dur={dot.dur} begin={dot.begin} repeatCount="indefinite">
                    <mpath href={`#${dot.line}`} />
                  </animateMotion>
                </circle>
              ))
            : null}
        </g>
        {!reduced
          ? RIM_DOTS.map((dot) => (
              <circle
                key={dot.dur}
                className={`hn-dot${phase >= 3 ? "" : " is-hidden"}`}
                r="2.2"
                fill={dot.fill}
                opacity={dot.o}
              >
                <animateMotion dur={dot.dur} begin={dot.begin} repeatCount="indefinite">
                  <mpath href="#hn-rim" />
                </animateMotion>
              </circle>
            ))
          : null}
      </svg>

      <p className={`hn-caption${phase >= 3 ? "" : " is-hidden"}`}>
        Every line passes through the ring — nothing is kept inside it.
      </p>
    </section>
  );
}

/* -------------------------------- page ------------------------------------ */

export default function TheHarness() {
  return (
    <main className="hn-field bg-gray-100">
      <div className="hn-tag">01 · the harness — singular inflection point</div>
      <TakeHarness />
    </main>
  );
}
