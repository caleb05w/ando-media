"use client";

// Line arts — the reference plates, redrawn and set in motion, one per
// shelf entry: a white wireframe sphere on black, a blue coil looping
// across white, a cluster of white orbits on blue, and the ring family —
// a hub and its orbit from the brand file's construction plates, in
// three takes (the paper original, a dark dial with timecodes, a stack
// of three orbits casting rays). All share one vocabulary — thin lines,
// dots that actually ride their lines: sphere riders dim as their rail
// carries them behind the dome, coil riders loop and drift off the
// right edge before re-entering on the left, orbit riders circle rails
// that are themselves slowly precessing, and the ring's spokes track
// their riders around the loop.
//
// Geometry is deterministic (index hashes, no Math.random) so the
// server and client serialize the same first frame; the rAF loops only
// move attributes after mount, and reduced motion keeps frame zero.

import { useEffect, useRef } from "react";

export const round = (n: number) => Math.round(n * 10) / 10;

// Every plate composes in the card's own proportions (760×536, the
// brand file's canvas). The svgs fit with "meet", so a card of another
// aspect letterboxes on the panel's own ground instead of cropping the
// drawing; whatever a plate paints past the viewBox shows there.
export const VW = 760;
export const VH = 536;

export const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" } as const;

type Rider = { x: number; y: number; nd: number };

// A dot and its call sign, moved as one group. Depth (nd, 0 far → 1
// near) sizes and dims the sphere's riders; flat plates pass nd = 1.
function RiderMark({
  color,
  label,
  init,
  below,
  groupRef,
}: {
  color: string;
  label?: string;
  init: Rider;
  below?: boolean;
  groupRef: (el: SVGGElement | null) => void;
}) {
  return (
    <g opacity={riderO(init.nd)} ref={groupRef} transform={`translate(${init.x} ${init.y})`}>
      <circle fill={color} r={riderR(init.nd)} />
      {label ? (
        <text
          fill={color}
          fontSize="10"
          letterSpacing="0.08em"
          style={MONO}
          x={below ? -9 : 9}
          y={below ? 17 : -9}
          textAnchor={below ? "end" : "start"}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

const riderR = (nd: number) => round(2.4 + 2 * nd);
const riderO = (nd: number) => round(0.3 + 0.7 * nd);

// Each plate wears its own chrome, the way the inspo cards do: a mono
// cipher in the top-left corner, and at the foot a square-bulleted
// eyebrow with one line that grounds the drawing in an Ando story.
// HTML over the svg, not inside it, so the type stays print-size no
// matter how the plate scales in its card.
export function PlateChrome({
  cipher,
  eyebrow,
  line,
  dark,
}: {
  cipher: string;
  eyebrow: string;
  line: string;
  /** white type for the black and blue grounds */
  dark?: boolean;
}) {
  const main = dark ? "text-[#f5f5f4]" : "text-[#1a1817]";
  const dim = dark ? "text-[#f5f5f4]/60" : "text-[#78716c]";
  return (
    <>
      <span className={`absolute left-6 top-5 font-mono text-[10px] tracking-[0.14em] ${dim}`}>
        {cipher}
      </span>
      <div className="absolute inset-x-6 bottom-5">
        <span
          className={`flex items-center gap-[7px] font-mono text-[10px] uppercase tracking-[0.14em] ${dim}`}
        >
          <span aria-hidden className="inline-block size-[5px] bg-current" />
          {eyebrow}
        </span>
        <p className={`mt-[6px] max-w-[340px] text-[13px] leading-[18px] ${main}`}>{line}</p>
      </div>
    </>
  );
}

function moveRider(el: SVGGElement | null, p: Rider) {
  if (!el) return;
  el.setAttribute("transform", `translate(${p.x} ${p.y})`);
  el.setAttribute("opacity", String(riderO(p.nd)));
  const dot = el.firstElementChild;
  if (dot) dot.setAttribute("r", String(riderR(p.nd)));
}

// ── I. The sphere — white wireframe on black ───────────────────────────
// An outline, two parallels, and two meridians that slowly turn in
// longitude. The riders hold their rails — one on the equator, one on
// a meridian, one on the lower parallel — and the projection dims them
// as the far side takes them.

const SP = { cx: 380, cy: 268, r: 190, tilt: 0.35 };

function sphProject(x: number, y: number, z: number): Rider {
  const y1 = y * Math.cos(SP.tilt) - z * Math.sin(SP.tilt);
  const z1 = y * Math.sin(SP.tilt) + z * Math.cos(SP.tilt);
  return {
    x: round(SP.cx + x * SP.r),
    y: round(SP.cy - y1 * SP.r),
    nd: Math.round(((z1 + 1) / 2) * 100) / 100,
  };
}

// A point at latitude th, longitude lon, on the unit sphere.
const sphAt = (th: number, lon: number) =>
  sphProject(Math.cos(th) * Math.cos(lon), Math.sin(th), Math.cos(th) * Math.sin(lon));

const SPH_PARALLELS = [0, -0.32].map((th) => ({
  cy: round(SP.cy - SP.r * Math.sin(th) * Math.cos(SP.tilt)),
  rx: round(SP.r * Math.cos(th)),
  ry: round(SP.r * Math.cos(th) * Math.sin(SP.tilt)),
}));

function meridianPath(lon: number) {
  const pts = Array.from({ length: 73 }, (_, k) => {
    const psi = (k / 72) * Math.PI * 2;
    const p = sphProject(Math.cos(psi) * Math.cos(lon), Math.sin(psi), Math.cos(psi) * Math.sin(lon));
    return `${p.x} ${p.y}`;
  });
  return `M${pts.join("L")}Z`;
}

const SPH_TURN = 0.055; // rad/s — the whole armature drifts in longitude
const SPH_LON0 = [0.9, 0.9 + Math.PI / 2];

// rail: which line the rider holds. Meridian riders travel psi around
// a circle that is itself turning; ring riders travel longitude flat.
// Seven riders, because the story is a crew: whichever face of the
// dome is yours, the far side stays busy.
type SphRail = "meridianA" | "meridianB" | "equator" | "parallel";
const SPH_RIDERS: { label?: string; rail: SphRail; u0: number; speed: number; below?: boolean }[] = [
  { label: "N431", rail: "meridianA", u0: 1.15, speed: 0.2 },
  { label: "N12", rail: "equator", u0: 3.7, speed: 0.16, below: true },
  { rail: "parallel", u0: 0.6, speed: -0.13 },
  { rail: "meridianB", u0: 4.3, speed: 0.24 },
  { rail: "equator", u0: 1.2, speed: -0.19 },
  { rail: "parallel", u0: 2.9, speed: 0.17 },
  { rail: "meridianA", u0: 5.5, speed: -0.15 },
];

function sphRiderAt(i: number, t: number): Rider {
  const rd = SPH_RIDERS[i];
  const u = rd.u0 + rd.speed * t;
  if (rd.rail === "meridianA" || rd.rail === "meridianB") {
    const lon = SPH_LON0[rd.rail === "meridianA" ? 0 : 1] + SPH_TURN * t;
    return sphProject(Math.cos(u) * Math.cos(lon), Math.sin(u), Math.cos(u) * Math.sin(lon));
  }
  return sphAt(rd.rail === "equator" ? 0 : -0.32, u);
}

// The trail: the rider's own last seconds replayed, so a dot deep on
// the far side reads as working, not parked.
const SPH_TRAIL_N = 7;
const SPH_TRAIL_TAU = 0.35;
function sphTrailAt(i: number, t: number) {
  const pts = Array.from({ length: SPH_TRAIL_N }, (_, k) => sphRiderAt(i, t - k * SPH_TRAIL_TAU));
  return { d: "M" + pts.map((q) => `${q.x} ${q.y}`).join("L"), nd: pts[0].nd };
}
const sphTrailO = (nd: number) => round(0.06 + 0.24 * nd);

const SPH_INIT = SPH_RIDERS.map((_, i) => sphRiderAt(i, 0));
const SPH_INIT_TRAILS = SPH_RIDERS.map((_, i) => sphTrailAt(i, 0));
const SPH_INIT_MERIDIANS = SPH_LON0.map((lon) => meridianPath(lon));

export function SphereLines() {
  const riderRefs = useRef<(SVGGElement | null)[]>([]);
  const trailRefs = useRef<(SVGPathElement | null)[]>([]);
  const meridianRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      SPH_LON0.forEach((lon, i) => {
        meridianRefs.current[i]?.setAttribute("d", meridianPath(lon + SPH_TURN * t));
      });
      SPH_RIDERS.forEach((_, i) => {
        moveRider(riderRefs.current[i], sphRiderAt(i, t));
        const trail = trailRefs.current[i];
        if (trail) {
          const s = sphTrailAt(i, t);
          trail.setAttribute("d", s.d);
          trail.setAttribute("stroke-opacity", String(sphTrailO(s.nd)));
        }
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative h-full w-full bg-[#0a0a0a]">
      <PlateChrome
        cipher="A – 1"
        dark
        eyebrow="Presence"
        line="The far side keeps working."
      />
      <svg
        aria-hidden
        className="size-full"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VW} ${VH}`}
      >
        <circle cx={SP.cx} cy={SP.cy} r={SP.r} stroke="#f5f5f4" strokeOpacity="0.9" strokeWidth="1" />
        {SPH_PARALLELS.map((p, i) => (
          <ellipse
            cx={SP.cx}
            cy={p.cy}
            key={`p${i}`}
            rx={p.rx}
            ry={p.ry}
            stroke="#f5f5f4"
            strokeOpacity="0.9"
            strokeWidth="1"
          />
        ))}
        {SPH_INIT_MERIDIANS.map((d, i) => (
          <path
            d={d}
            key={`m${i}`}
            ref={(el) => {
              meridianRefs.current[i] = el;
            }}
            stroke="#f5f5f4"
            strokeOpacity="0.9"
            strokeWidth="1"
          />
        ))}
        {SPH_INIT_TRAILS.map((s, i) => (
          <path
            d={s.d}
            key={`tr${i}`}
            ref={(el) => {
              trailRefs.current[i] = el;
            }}
            stroke="#fff"
            strokeOpacity={sphTrailO(s.nd)}
            strokeWidth="1"
          />
        ))}
        {SPH_RIDERS.map((rd, i) => (
          <RiderMark
            below={rd.below}
            color="#fff"
            groupRef={(el) => {
              riderRefs.current[i] = el;
            }}
            init={SPH_INIT[i]}
            key={`r${i}`}
            label={rd.label}
          />
        ))}
      </svg>
    </div>
  );
}

// ── II. The coil — blue loops across white ─────────────────────────────
// A prolate cycloid: tall loops overlapping as they walk right. The
// line holds still; the riders travel it, leaving off the right edge
// and re-entering on the left where the parameter wraps. The line runs
// far past the frame on both sides so a wide card (the plates letterbox
// with "meet") still sees loops to its edges and never sees the wrap.

const COIL = { x0: -400, cy: 268, rx: 50, ry: 195, adv: 74 };
const COIL_SPAN = Math.PI * 44; // twenty-two loops — wrap points far off any card

function coilAt(u: number): Rider {
  return {
    x: round(COIL.x0 + (COIL.adv * u) / (Math.PI * 2) + COIL.rx * Math.sin(u)),
    y: round(COIL.cy - COIL.ry * Math.cos(u)),
    nd: 1,
  };
}

const COIL_PATH = (() => {
  const n = Math.ceil(COIL_SPAN / 0.06);
  const pts = Array.from({ length: n + 1 }, (_, k) => {
    const p = coilAt((k / n) * COIL_SPAN);
    return `${p.x} ${p.y}`;
  });
  return `M${pts.join("L")}`;
})();

const COIL_RIDERS = [
  { u0: 30, speed: 0.5 },
  { label: "N23", u0: 40, speed: 0.42 },
  { u0: 47, speed: 0.5 },
  { label: "N33", u0: 54, speed: 0.38, below: true },
  { u0: 62, speed: 0.55 },
  { u0: 69, speed: 0.4 },
  { label: "N6", u0: 77, speed: 0.46, below: true },
  { u0: 85, speed: 0.52 },
  { u0: 100, speed: 0.44 },
];

function coilRiderAt(i: number, t: number): Rider {
  const rd = COIL_RIDERS[i];
  const u = (((rd.u0 + rd.speed * t) % COIL_SPAN) + COIL_SPAN) % COIL_SPAN;
  return coilAt(u);
}

const COIL_INIT = COIL_RIDERS.map((_, i) => coilRiderAt(i, 0));

// Each loop is a day. A tick and its name sit at every crest a card
// can reach, and the riders lap them in order — the update coming
// back around.
const COIL_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const COIL_CRESTS = Array.from({ length: 10 }, (_, k) => ({
  x: COIL.x0 + COIL.adv * (k + 6),
  day: COIL_DAYS[k % 7],
}));

export function CoilLines() {
  const riderRefs = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      COIL_RIDERS.forEach((_, i) => moveRider(riderRefs.current[i], coilRiderAt(i, t)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative h-full w-full bg-white">
      <PlateChrome
        cipher="A – 2"
        eyebrow="Cadence"
        line="The update laps the week."
      />
      <svg
        aria-hidden
        className="size-full"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VW} ${VH}`}
      >
        <path d={COIL_PATH} stroke="#2563eb" strokeOpacity="0.7" strokeWidth="1" />
        {COIL_CRESTS.map((c) => (
          <g key={`day${c.x}`}>
            <line stroke="#a8a29e" strokeWidth="1" x1={c.x} x2={c.x} y1={COIL.cy - COIL.ry - 8} y2={COIL.cy - COIL.ry} />
            <text
              fill="#a8a29e"
              fontSize="8.5"
              letterSpacing="0.1em"
              style={MONO}
              textAnchor="middle"
              x={c.x}
              y={COIL.cy - COIL.ry - 17}
            >
              {c.day}
            </text>
          </g>
        ))}
        {COIL_RIDERS.map((rd, i) => (
          <RiderMark
            below={"below" in rd && rd.below}
            color="#2563eb"
            groupRef={(el) => {
              riderRefs.current[i] = el;
            }}
            init={COIL_INIT[i]}
            key={`r${i}`}
            label={"label" in rd ? rd.label : undefined}
          />
        ))}
      </svg>
    </div>
  );
}

// ── III. The orbits — white rings on blue ──────────────────────────────
// A cluster of ellipses of near-equal size, centres jittered, hung past
// the right edge so the cluster crops the way the reference plate does.
// Each ring precesses at its own slow pace; the riders circle three of
// them, carried by both motions at once.

const ORB = { cx: 380, cy: 268 };

// Index hashes spread the rings — centre, radii, set angle, precession —
// while serializing identically on server and client.
const ORB_RINGS = Array.from({ length: 8 }, (_, i) => ({
  cx: ORB.cx + (((i * 37) % 9) - 4) * 6,
  cy: ORB.cy + (((i * 23) % 7) - 3) * 6,
  rx: 150 + ((i * 29) % 55),
  ry: 118 + ((i * 17) % 48),
  rot0: i * 0.42,
  spin: ((0.012 + ((i * 7) % 5) * 0.004) * (i % 2 ? 1 : -1)) as number,
}));

// One conversation per ring — every one of them circling the same
// work, and the named ones are the channels you'd actually see.
const ORB_RIDERS = [
  { ring: 0, u0: 0.3, speed: 0.17 },
  { label: "#launch", ring: 1, u0: 1.9, speed: 0.24 },
  { ring: 2, u0: 4.9, speed: -0.14 },
  { ring: 3, u0: 3.2, speed: 0.2 },
  { label: "#design", ring: 4, u0: 4.4, speed: -0.19, below: true },
  { ring: 5, u0: 0.9, speed: 0.15 },
  { label: "#support", ring: 6, u0: 0.4, speed: 0.28 },
  { ring: 7, u0: 2.4, speed: -0.22 },
];

function orbRiderAt(i: number, t: number): Rider {
  const rd = ORB_RIDERS[i];
  const ring = ORB_RINGS[rd.ring];
  const u = rd.u0 + rd.speed * t;
  const rot = ring.rot0 + ring.spin * t;
  const lx = ring.rx * Math.cos(u);
  const ly = ring.ry * Math.sin(u);
  return {
    x: round(ring.cx + lx * Math.cos(rot) - ly * Math.sin(rot)),
    y: round(ring.cy + lx * Math.sin(rot) + ly * Math.cos(rot)),
    nd: 1,
  };
}

const ringTransform = (ring: (typeof ORB_RINGS)[number], t: number) =>
  `translate(${ring.cx} ${ring.cy}) rotate(${round(((ring.rot0 + ring.spin * t) * 180) / Math.PI)})`;

const ORB_INIT = ORB_RIDERS.map((_, i) => orbRiderAt(i, 0));

export function OrbitLines() {
  const riderRefs = useRef<(SVGGElement | null)[]>([]);
  const ringRefs = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      ORB_RINGS.forEach((ring, i) => {
        ringRefs.current[i]?.setAttribute("transform", ringTransform(ring, t));
      });
      ORB_RIDERS.forEach((_, i) => moveRider(riderRefs.current[i], orbRiderAt(i, t)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative h-full w-full bg-[#2563eb]">
      <PlateChrome
        cipher="A – 3"
        dark
        eyebrow="Channels"
        line="Every orbit, the same work."
      />
      <svg
        aria-hidden
        className="size-full"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VW} ${VH}`}
      >
        {ORB_RINGS.map((ring, i) => (
          <g
            key={`g${i}`}
            ref={(el) => {
              ringRefs.current[i] = el;
            }}
            transform={ringTransform(ring, 0)}
          >
            <ellipse rx={ring.rx} ry={ring.ry} stroke="#fff" strokeOpacity="0.8" strokeWidth="1" />
          </g>
        ))}
        {/* the work itself, held at the centre of every orbit */}
        <circle cx={ORB.cx} cy={ORB.cy} r="10" stroke="#fff" strokeOpacity="0.6" strokeWidth="1" />
        <circle cx={ORB.cx} cy={ORB.cy} fill="#fff" r="5" />
        {ORB_RIDERS.map((rd, i) => (
          <RiderMark
            below={"below" in rd && rd.below}
            color="#fff"
            groupRef={(el) => {
              riderRefs.current[i] = el;
            }}
            init={ORB_INIT[i]}
            key={`r${i}`}
            label={"label" in rd ? rd.label : undefined}
          />
        ))}
      </svg>
    </div>
  );
}

// ── IV. The ring — the hub and its orbit ───────────────────────────────
// From the brand file's construction plates: one wide orbit seen at a
// shallow angle, a swarm of small riders spread unevenly along it, the
// hub solid at the centre. Grey dotted spokes track three of the riders
// as they travel, and a short blue dash leads each tracked rider just
// off the ring. The dotted paper grid comes with the plate.

const RING = { cx: 380, cy: 262, rx: 300, ry: 118 };

const ringAt = (u: number) => ({
  x: round(RING.cx + RING.rx * Math.cos(u)),
  y: round(RING.cy + RING.ry * Math.sin(u)),
});

// The ellipse's unit outward normal and unit tangent at u — the dash
// accents hover on the normal and lie along the tangent.
function ringFrame(u: number) {
  const nx = RING.ry * Math.cos(u);
  const ny = RING.rx * Math.sin(u);
  const nl = Math.hypot(nx, ny);
  const tx = -RING.rx * Math.sin(u);
  const ty = RING.ry * Math.cos(u);
  const tl = Math.hypot(tx, ty);
  return { nx: nx / nl, ny: ny / nl, tx: tx / tl, ty: ty / tl };
}

// The swarm reads unevenly on purpose: a clump near the top of the
// loop, a pair down the left, strays elsewhere — and near-equal speeds,
// so the clusters stretch and reform over minutes rather than seconds.
const RING_U0 = [4.2, 4.35, 4.5, 4.62, 4.76, 5.5, 5.63, 0.4, 0.52, 1.6, 2.3, 2.42, 2.55, 3.1, 3.62, 5.1, 5.9, 1.15];
const RING_RIDERS = RING_U0.map((u0, i) => ({
  u0,
  speed: 0.1 + ((i * 7) % 5) * 0.008,
  r: 2.5 + ((i * 3) % 3) * 0.5,
}));
const RING_TRACKED = [1, 6, 10, 14]; // the riders the spokes hold on to

const ringRiderU = (i: number, t: number) => RING_RIDERS[i].u0 + RING_RIDERS[i].speed * t;

// A tracked rider's spoke endpoints and its leading dash, all at once.
function ringSpokeAt(i: number, t: number) {
  const u = ringRiderU(i, t);
  const p = ringAt(u);
  const f = ringFrame(u);
  const ox = p.x + f.nx * 7;
  const oy = p.y + f.ny * 7;
  return {
    p,
    dash: {
      x1: round(ox - f.tx * 8),
      y1: round(oy - f.ty * 8),
      x2: round(ox + f.tx * 8),
      y2: round(oy + f.ty * 8),
    },
  };
}

// The agent on each held line: a small dot shuttling hub ↔ rider,
// keeping the thread taut while the rider travels.
function ringAgentAt(k: number, t: number) {
  const p = ringAt(ringRiderU(RING_TRACKED[k], t));
  const f = 0.5 + 0.42 * Math.sin(0.5 * t + k * 1.7);
  return {
    x: round(RING.cx + (p.x - RING.cx) * f),
    y: round(RING.cy + (p.y - RING.cy) * f),
  };
}

const RING_INIT = RING_RIDERS.map((_, i) => ringAt(ringRiderU(i, 0)));
const RING_INIT_SPOKES = RING_TRACKED.map((i) => ringSpokeAt(i, 0));
const RING_INIT_AGENTS = RING_TRACKED.map((_, k) => ringAgentAt(k, 0));

export function RingLines() {
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const spokeRefs = useRef<(SVGLineElement | null)[]>([]);
  const dashRefs = useRef<(SVGLineElement | null)[]>([]);
  const agentRefs = useRef<(SVGCircleElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      RING_RIDERS.forEach((_, i) => {
        const el = dotRefs.current[i];
        if (!el) return;
        const p = ringAt(ringRiderU(i, t));
        el.setAttribute("cx", String(p.x));
        el.setAttribute("cy", String(p.y));
      });
      RING_TRACKED.forEach((ri, k) => {
        const spoke = spokeRefs.current[k];
        const dash = dashRefs.current[k];
        if (!spoke || !dash) return;
        const s = ringSpokeAt(ri, t);
        spoke.setAttribute("x2", String(s.p.x));
        spoke.setAttribute("y2", String(s.p.y));
        dash.setAttribute("x1", String(s.dash.x1));
        dash.setAttribute("y1", String(s.dash.y1));
        dash.setAttribute("x2", String(s.dash.x2));
        dash.setAttribute("y2", String(s.dash.y2));
        const agent = agentRefs.current[k];
        if (agent) {
          const a = ringAgentAt(k, t);
          agent.setAttribute("cx", String(a.x));
          agent.setAttribute("cy", String(a.y));
        }
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative h-full w-full bg-white">
      <PlateChrome
        cipher="A – 4"
        eyebrow="Harness"
        line="Every line threads the hub."
      />
      <svg
        aria-hidden
        className="size-full"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VW} ${VH}`}
      >
        <defs>
          <pattern height="26" id="ring-grid" patternUnits="userSpaceOnUse" width="26">
            <circle cx="1" cy="1" fill="#e7e5e4" r="1" />
          </pattern>
        </defs>
        {/* the paper grid runs far past the frame so a letterboxed card
            is still papered to its edges */}
        <rect fill="url(#ring-grid)" height={VH + 800} width={VW + 1000} x={-500} y={-400} />
        <ellipse cx={RING.cx} cy={RING.cy} rx={RING.rx} ry={RING.ry} stroke="#2563eb" strokeOpacity="0.75" strokeWidth="1" />
        {RING_INIT_SPOKES.map((s, k) => (
          <g key={`s${k}`}>
            <line
              ref={(el) => {
                spokeRefs.current[k] = el;
              }}
              stroke="#d6d3d1"
              strokeDasharray="2 6"
              strokeLinecap="round"
              strokeWidth="1"
              x1={RING.cx}
              x2={s.p.x}
              y1={RING.cy}
              y2={s.p.y}
            />
            <line
              ref={(el) => {
                dashRefs.current[k] = el;
              }}
              stroke="#2563eb"
              strokeWidth="1.5"
              x1={s.dash.x1}
              x2={s.dash.x2}
              y1={s.dash.y1}
              y2={s.dash.y2}
            />
          </g>
        ))}
        {RING_INIT_AGENTS.map((a, k) => (
          <circle
            cx={a.x}
            cy={a.y}
            fill="#2563eb"
            key={`a${k}`}
            r="2.2"
            ref={(el) => {
              agentRefs.current[k] = el;
            }}
          />
        ))}
        {RING_INIT.map((p, i) => (
          <circle
            cx={p.x}
            cy={p.y}
            fill="#2563eb"
            key={`d${i}`}
            r={RING_RIDERS[i].r}
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
          />
        ))}
        <circle cx={RING.cx} cy={RING.cy} fill="#2563eb" r="13" />
      </svg>
    </div>
  );
}

// ── IV b. The ring, timed — the dial plate, gone dark ──────────────────
// The construction plates in the brand file carry timecode rulers; here
// the orbit becomes the ruler. Sixty ticks around the loop, every fifth
// held longer, and each tracked rider wears a mono timecode that reads
// its position on the dial — 0:00 at the top, clockwise — ticking over
// as it travels.

const DIAL = { cx: 380, cy: 264, rx: 296, ry: 116 };

const dialAt = (u: number) => ({
  x: round(DIAL.cx + DIAL.rx * Math.cos(u)),
  y: round(DIAL.cy + DIAL.ry * Math.sin(u)),
});

function dialNormal(u: number) {
  const nx = DIAL.ry * Math.cos(u);
  const ny = DIAL.rx * Math.sin(u);
  const nl = Math.hypot(nx, ny);
  return { nx: nx / nl, ny: ny / nl };
}

const DIAL_TICKS = Array.from({ length: 60 }, (_, k) => {
  const u = (k / 60) * Math.PI * 2;
  const p = dialAt(u);
  const n = dialNormal(u);
  const major = k % 5 === 0;
  const len = major ? 5 : 3;
  return {
    major,
    x1: round(p.x - n.nx * len),
    y1: round(p.y - n.ny * len),
    x2: round(p.x + n.nx * len),
    y2: round(p.y + n.ny * len),
  };
});

const DIAL_RIDERS = [
  { u0: 4.9, speed: 0.11, tracked: true },
  { u0: 0.7, speed: 0.14, tracked: true },
  { u0: 2.6, speed: 0.09, tracked: true },
  { u0: 4.1, speed: 0.12 },
  { u0: 5.6, speed: 0.1 },
  { u0: 1.7, speed: 0.13 },
  { u0: 3.4, speed: 0.1 },
  { u0: 0.1, speed: 0.11 },
];

const TAU = Math.PI * 2;

// The dial reads 0:00 at the top of the loop and counts clockwise —
// exactly the direction the riders travel in screen space.
function dialTimecode(u: number) {
  const frac = (((u + Math.PI / 2) % TAU) + TAU) % TAU;
  const s = Math.floor((frac / TAU) * 60);
  return `0:${String(s).padStart(2, "0")}`;
}

function dialRiderAt(i: number, t: number) {
  const u = DIAL_RIDERS[i].u0 + DIAL_RIDERS[i].speed * t;
  const p = dialAt(u);
  const n = dialNormal(u);
  return {
    p,
    label: {
      x: round(p.x + n.nx * 16),
      y: round(p.y + n.ny * 16 + 3),
      anchor: n.nx >= 0 ? ("start" as const) : ("end" as const),
      text: dialTimecode(u),
    },
  };
}

const DIAL_INIT = DIAL_RIDERS.map((_, i) => dialRiderAt(i, 0));
const DIAL_TRACKED = DIAL_RIDERS.flatMap((rd, i) => (rd.tracked ? [i] : []));

// The stamps: each tracked rider leaves a short blue trail of ticks on
// the dial behind it, fading as they age — the pass, stamped.
const DIAL_STAMP_N = 6;
function dialStampAt(ri: number, s: number, t: number) {
  const u = DIAL_RIDERS[ri].u0 + DIAL_RIDERS[ri].speed * t - (s + 1) * 0.14;
  const p = dialAt(u);
  const n = dialNormal(u);
  return {
    x1: round(p.x - n.nx * 3.5),
    y1: round(p.y - n.ny * 3.5),
    x2: round(p.x + n.nx * 3.5),
    y2: round(p.y + n.ny * 3.5),
  };
}
const DIAL_INIT_STAMPS = DIAL_TRACKED.map((ri) =>
  Array.from({ length: DIAL_STAMP_N }, (_, s) => dialStampAt(ri, s, 0)),
);

export function RingDialLines() {
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const spokeRefs = useRef<(SVGLineElement | null)[]>([]);
  const labelRefs = useRef<(SVGTextElement | null)[]>([]);
  const stampRefs = useRef<(SVGLineElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      DIAL_RIDERS.forEach((_, i) => {
        const dot = dotRefs.current[i];
        if (!dot) return;
        const s = dialRiderAt(i, t);
        dot.setAttribute("cx", String(s.p.x));
        dot.setAttribute("cy", String(s.p.y));
      });
      DIAL_TRACKED.forEach((ri, k) => {
        const spoke = spokeRefs.current[k];
        const label = labelRefs.current[k];
        if (!spoke || !label) return;
        const s = dialRiderAt(ri, t);
        spoke.setAttribute("x2", String(s.p.x));
        spoke.setAttribute("y2", String(s.p.y));
        label.setAttribute("x", String(s.label.x));
        label.setAttribute("y", String(s.label.y));
        label.setAttribute("text-anchor", s.label.anchor);
        if (label.textContent !== s.label.text) label.textContent = s.label.text;
        for (let st = 0; st < DIAL_STAMP_N; st++) {
          const stamp = stampRefs.current[k * DIAL_STAMP_N + st];
          if (!stamp) continue;
          const m = dialStampAt(ri, st, t);
          stamp.setAttribute("x1", String(m.x1));
          stamp.setAttribute("y1", String(m.y1));
          stamp.setAttribute("x2", String(m.x2));
          stamp.setAttribute("y2", String(m.y2));
        }
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative h-full w-full bg-[#0a0a0a]">
      <PlateChrome
        cipher="A – 5"
        dark
        eyebrow="Recap"
        line="Every pass is stamped."
      />
      <svg
        aria-hidden
        className="size-full"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VW} ${VH}`}
      >
        <ellipse cx={DIAL.cx} cy={DIAL.cy} rx={DIAL.rx} ry={DIAL.ry} stroke="#f5f5f4" strokeOpacity="0.9" strokeWidth="1" />
        {DIAL_TICKS.map((tk, k) => (
          <line
            key={`t${k}`}
            stroke="#f5f5f4"
            strokeOpacity={tk.major ? 0.5 : 0.22}
            strokeWidth="1"
            x1={tk.x1}
            x2={tk.x2}
            y1={tk.y1}
            y2={tk.y2}
          />
        ))}
        {DIAL_INIT_STAMPS.map((stamps, k) =>
          stamps.map((m, st) => (
            <line
              key={`st${k}-${st}`}
              ref={(el) => {
                stampRefs.current[k * DIAL_STAMP_N + st] = el;
              }}
              stroke="#2563eb"
              strokeOpacity={round((0.55 - st * 0.08) * 100) / 100}
              strokeWidth="1.5"
              x1={m.x1}
              x2={m.x2}
              y1={m.y1}
              y2={m.y2}
            />
          )),
        )}
        {DIAL_TRACKED.map((i, k) => {
          const s = DIAL_INIT[i];
          return (
            <g key={`s${i}`}>
              <line
                ref={(el) => {
                  spokeRefs.current[k] = el;
                }}
                stroke="#f5f5f4"
                strokeDasharray="2 6"
                strokeLinecap="round"
                strokeOpacity="0.4"
                strokeWidth="1"
                x1={DIAL.cx}
                x2={s.p.x}
                y1={DIAL.cy}
                y2={s.p.y}
              />
              <text
                fill="#f5f5f4"
                fontSize="10"
                letterSpacing="0.08em"
                ref={(el) => {
                  labelRefs.current[k] = el;
                }}
                style={MONO}
                textAnchor={s.label.anchor}
                x={s.label.x}
                y={s.label.y}
              >
                {s.label.text}
              </text>
            </g>
          );
        })}
        {DIAL_RIDERS.map((rd, i) => (
          <circle
            cx={DIAL_INIT[i].p.x}
            cy={DIAL_INIT[i].p.y}
            fill="#fff"
            key={`d${i}`}
            r={rd.tracked ? 3.5 : 2.5}
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
          />
        ))}
        <circle cx={DIAL.cx} cy={DIAL.cy} fill="#2563eb" r="12" />
      </svg>
    </div>
  );
}

// ── IV c. The rings — three orbits, rays cast through the riders ───────
// The stack take: three orbits of one system sharing the hub, inner
// ones quicker the way orbits are. One rider per ring is sighted — a
// dashed ray runs hub → rider and carries on past the ring the way the
// plates' vanishing rays do, solid only beyond the loop.

const STACK = { cx: 380, cy: 268 };
const STACK_RINGS = [
  { rx: 150, ry: 58 },
  { rx: 230, ry: 90 },
  { rx: 310, ry: 122 },
];
// The three horizons by name, hung on each orbit's lower-left arc the
// way an orbit map names its planets.
const STACK_LABELS = ["TODAY", "THIS WEEK", "THIS QUARTER"];

// Riders per ring; the first of each is the sighted one.
const STACK_RIDERS = [
  { ring: 0, u0: 0.9, speed: 0.22, sighted: true },
  { ring: 0, u0: 3.3, speed: 0.22 },
  { ring: 0, u0: 5.2, speed: 0.22 },
  { ring: 1, u0: 2.1, speed: -0.15, sighted: true },
  { ring: 1, u0: 3.9, speed: -0.15 },
  { ring: 1, u0: 5.5, speed: -0.15 },
  { ring: 1, u0: 0.6, speed: -0.15 },
  { ring: 2, u0: 4.6, speed: 0.11, sighted: true },
  { ring: 2, u0: 0.2, speed: 0.11 },
  { ring: 2, u0: 1.4, speed: 0.11 },
  { ring: 2, u0: 2.8, speed: 0.11 },
  { ring: 2, u0: 5.8, speed: 0.11 },
];

function stackRiderAt(i: number, t: number) {
  const rd = STACK_RIDERS[i];
  const ring = STACK_RINGS[rd.ring];
  const u = rd.u0 + rd.speed * t;
  const x = round(STACK.cx + ring.rx * Math.cos(u));
  const y = round(STACK.cy + ring.ry * Math.sin(u));
  return {
    x,
    y,
    // the ray carries on past the rider by a fixed share of its length
    bx: round(STACK.cx + (x - STACK.cx) * 1.22),
    by: round(STACK.cy + (y - STACK.cy) * 1.22),
  };
}

const STACK_INIT = STACK_RIDERS.map((_, i) => stackRiderAt(i, 0));
const STACK_SIGHTED = STACK_RIDERS.flatMap((rd, i) => (rd.sighted ? [i] : []));

export function RingStackLines() {
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const rayInRefs = useRef<(SVGLineElement | null)[]>([]);
  const rayOutRefs = useRef<(SVGLineElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      STACK_RIDERS.forEach((_, i) => {
        const dot = dotRefs.current[i];
        if (!dot) return;
        const s = stackRiderAt(i, t);
        dot.setAttribute("cx", String(s.x));
        dot.setAttribute("cy", String(s.y));
      });
      STACK_SIGHTED.forEach((ri, k) => {
        const rin = rayInRefs.current[k];
        const rout = rayOutRefs.current[k];
        if (!rin || !rout) return;
        const s = stackRiderAt(ri, t);
        rin.setAttribute("x2", String(s.x));
        rin.setAttribute("y2", String(s.y));
        rout.setAttribute("x1", String(s.x));
        rout.setAttribute("y1", String(s.y));
        rout.setAttribute("x2", String(s.bx));
        rout.setAttribute("y2", String(s.by));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative h-full w-full bg-[#2563eb]">
      <PlateChrome
        cipher="A – 6"
        dark
        eyebrow="Horizons"
        line="One sightline to each."
      />
      <svg
        aria-hidden
        className="size-full"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VW} ${VH}`}
      >
        {STACK_RINGS.map((ring, i) => (
          <ellipse
            cx={STACK.cx}
            cy={STACK.cy}
            key={`e${i}`}
            rx={ring.rx}
            ry={ring.ry}
            stroke="#fff"
            strokeOpacity="0.85"
            strokeWidth="1"
          />
        ))}
        {STACK_RINGS.map((ring, i) => (
          <text
            fill="#fff"
            fillOpacity="0.7"
            fontSize="9"
            key={`lb${i}`}
            letterSpacing="0.12em"
            style={MONO}
            textAnchor="end"
            x={round(STACK.cx - ring.rx * 0.71)}
            y={round(STACK.cy + ring.ry * 0.71 + 14)}
          >
            {STACK_LABELS[i]}
          </text>
        ))}
        {STACK_SIGHTED.map((i, k) => {
          const s = STACK_INIT[i];
          return (
            <g key={`ray${i}`}>
              <line
                ref={(el) => {
                  rayInRefs.current[k] = el;
                }}
                stroke="#fff"
                strokeDasharray="2 6"
                strokeLinecap="round"
                strokeOpacity="0.55"
                strokeWidth="1"
                x1={STACK.cx}
                x2={s.x}
                y1={STACK.cy}
                y2={s.y}
              />
              <line
                ref={(el) => {
                  rayOutRefs.current[k] = el;
                }}
                stroke="#fff"
                strokeWidth="1"
                x1={s.x}
                x2={s.bx}
                y1={s.y}
                y2={s.by}
              />
            </g>
          );
        })}
        {STACK_RIDERS.map((rd, i) => (
          <circle
            cx={STACK_INIT[i].x}
            cy={STACK_INIT[i].y}
            fill="#fff"
            key={`d${i}`}
            r={rd.sighted ? 3.5 : 2.8}
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
          />
        ))}
        <circle cx={STACK.cx} cy={STACK.cy} fill="#fff" r="11" />
      </svg>
    </div>
  );
}
