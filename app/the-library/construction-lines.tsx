"use client";

// Construction lines — three more plates from the brand file's
// reference board, each a different construction, not another take on
// an old one: a cone of diminishing circles read against its timecode
// ladder, a two-point-perspective bowtie with a cursor running its
// outline, and a fan of sightlines crossing inside a kite. Same
// vocabulary as line-arts.tsx (thin lines, riding dots, mono ciphers),
// same rules: deterministic first frame, rAF moves attributes only,
// reduced motion keeps frame zero.

import { useEffect, useRef } from "react";

import { MONO, PlateChrome, VH, VW, round } from "./line-arts";

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

// ── V. The cone — circles diminishing to the apex ──────────────────────
// From the plate with the tunnel of circles: each circle nests toward
// the vanishing point at its own depth, and one rider per circle holds
// the shared generatrix — the same angle on every circle, offset a beat
// per depth, so the swarm reads as a thread winding into the cone. The
// timecode ladder hangs off the apex the way the plate's does.

const APEX = { x: 645, y: 268 };
const CONE_Q = 0.64; // each circle this share of the last

const CONE_CIRCLES = Array.from({ length: 6 }, (_, k) => {
  const r = round(150 * Math.pow(CONE_Q, k));
  return { r, cx: round(APEX.x - r * 2.35) };
});

const CONE_LADDER = Array.from({ length: 5 }, (_, j) => ({
  y: 296 + j * 24,
  len: 46 + j * 44,
  label: `0:${28 - j}`,
}));

const CONE_RIDERS = CONE_CIRCLES.map((c, k) => ({
  ...c,
  u0: -1.1 + k * 0.55,
  dotR: round(3.2 - k * 0.25),
}));

// The outer circles are the sources the context trace names, each one
// closer to the point; the reader runs the axis and crosses them in
// order on its way in.
const CONE_SOURCES = ["TRANSCRIPTS", "POLICIES", "TODAY'S JAM"];

function coneReaderAt(t: number) {
  const f = (((0.11 * t) % 1) + 1) % 1;
  return { x: round(lerp(CONE_CIRCLES[0].cx - 150, APEX.x, f)), r: round(3.4 - 2 * f) };
}
const CONE_READER0 = coneReaderAt(0);

function coneRiderAt(k: number, t: number) {
  const rd = CONE_RIDERS[k];
  const u = rd.u0 + 0.35 * t;
  return { x: round(rd.cx + rd.r * Math.cos(u)), y: round(APEX.y + rd.r * Math.sin(u)) };
}

const CONE_INIT = CONE_RIDERS.map((_, k) => coneRiderAt(k, 0));
const CONE_BIG = CONE_CIRCLES[0];

export function ConeLines() {
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const readerRef = useRef<SVGCircleElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      CONE_RIDERS.forEach((_, k) => {
        const dot = dotRefs.current[k];
        if (!dot) return;
        const p = coneRiderAt(k, t);
        dot.setAttribute("cx", String(p.x));
        dot.setAttribute("cy", String(p.y));
      });
      const reader = readerRef.current;
      if (reader) {
        const rp = coneReaderAt(t);
        reader.setAttribute("cx", String(rp.x));
        reader.setAttribute("r", String(rp.r));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative h-full w-full bg-white">
      <PlateChrome
        cipher="A – 7"
        eyebrow="Context"
        line="Sources funnel to the point."
      />
      <svg
        aria-hidden
        className="size-full"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VW} ${VH}`}
      >
        {/* the axis, then the cone's silhouette to the big circle's rim */}
        <line stroke="#2563eb" strokeOpacity="0.3" strokeWidth="1" x1={CONE_BIG.cx - 170} x2={APEX.x + 30} y1={APEX.y} y2={APEX.y} />
        <line stroke="#2563eb" strokeOpacity="0.7" strokeWidth="1" x1={APEX.x} x2={CONE_BIG.cx} y1={APEX.y} y2={APEX.y - CONE_BIG.r} />
        <line stroke="#2563eb" strokeOpacity="0.7" strokeWidth="1" x1={APEX.x} x2={CONE_BIG.cx} y1={APEX.y} y2={APEX.y + CONE_BIG.r} />
        {CONE_CIRCLES.map((c, k) => (
          <circle cx={c.cx} cy={APEX.y} key={`c${k}`} r={c.r} stroke="#2563eb" strokeOpacity="0.7" strokeWidth="1" />
        ))}
        {/* the sources, named at each circle's crown, stepping toward
            the point in reading order */}
        {CONE_SOURCES.map((name, k) => (
          <text
            fill="#78716c"
            fontSize="8.5"
            key={`src${k}`}
            letterSpacing="0.1em"
            style={MONO}
            textAnchor="middle"
            x={CONE_CIRCLES[k].cx}
            y={APEX.y - CONE_CIRCLES[k].r - 10}
          >
            {name}
          </text>
        ))}
        {/* the timecode ladder off the apex */}
        {CONE_LADDER.map((row, j) => (
          <g key={`l${j}`}>
            <line stroke="#d6d3d1" strokeWidth="1" x1={APEX.x + 16 - row.len} x2={APEX.x + 16} y1={row.y} y2={row.y} />
            <text fill="#78716c" fontSize="10" letterSpacing="0.08em" style={MONO} x={APEX.x + 24} y={row.y + 3}>
              {row.label}
            </text>
          </g>
        ))}
        {CONE_INIT.map((p, k) => (
          <circle
            cx={p.x}
            cy={p.y}
            fill="#2563eb"
            key={`d${k}`}
            r={CONE_RIDERS[k].dotR}
            ref={(el) => {
              dotRefs.current[k] = el;
            }}
          />
        ))}
        {/* the reader, running the axis into the point */}
        <circle
          cx={CONE_READER0.x}
          cy={APEX.y}
          fill="#2563eb"
          r={CONE_READER0.r}
          ref={readerRef}
        />
        <circle cx={APEX.x} cy={APEX.y} fill="#2563eb" r="2.5" />
      </svg>
    </div>
  );
}

// ── VI. The bowtie — two-point perspective, run as a circuit ───────────
// The plate's two vanishing points, the waist between them, and the
// verticals stepping through both triangles. A blue cursor runs the
// bowtie's outline — up to the waist, down to the far point and back —
// and its position reads on the tick ruler underneath as a timecode,
// the way the plate stamps its frames.

// The whole construction rides high in the frame so the tick ruler
// clears the plate's caption block.
const BT = { lx: 70, rx: 690, y: 240, wx: 380, ty: 122, by: 358 };
const BT_SLOPE = (BT.ty - BT.y) / (BT.wx - BT.lx); // rise of the top rays

// The four corners of the circuit: left point, waist top, right point,
// waist bottom.
const BT_PTS = [
  { x: BT.lx, y: BT.y },
  { x: BT.wx, y: BT.ty },
  { x: BT.rx, y: BT.y },
  { x: BT.wx, y: BT.by },
];

const BT_VERTICALS = Array.from({ length: 14 }, (_, i) => {
  const x = 120 + i * 40;
  const rise = x <= BT.wx ? (x - BT.lx) * BT_SLOPE : (BT.rx - x) * BT_SLOPE;
  return { x, yt: round(BT.y + rise), yb: round(BT.y - rise) };
});

const BT_RIDERS = [
  { s0: 0.3, speed: 0.35 },
  { s0: 2.1, speed: 0.28 },
];

function btRiderAt(i: number, t: number) {
  const rd = BT_RIDERS[i];
  const s = (((rd.s0 + rd.speed * t) % 4) + 4) % 4;
  const leg = Math.floor(s);
  const a = BT_PTS[leg];
  const b = BT_PTS[(leg + 1) % 4];
  const f = s - leg;
  return { x: round(lerp(a.x, b.x, f)), y: round(lerp(a.y, b.y, f)) };
}

// The ruler under the plate reads the lead cursor's x as a timecode —
// one tick per vertical, 0:03 at the left like the reference frames.
const btTimecode = (x: number) =>
  `0:${String(3 + Math.max(0, Math.min(13, Math.floor((x - 120) / 40)))).padStart(2, "0")}`;

const BT_INIT = BT_RIDERS.map((_, i) => btRiderAt(i, 0));

export function BowtieLines() {
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const cursorRef = useRef<SVGLineElement | null>(null);
  const readoutRef = useRef<SVGTextElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      let leadX = BT_INIT[0].x;
      BT_RIDERS.forEach((_, i) => {
        const dot = dotRefs.current[i];
        if (!dot) return;
        const p = btRiderAt(i, t);
        if (i === 0) leadX = p.x;
        dot.setAttribute("cx", String(p.x));
        dot.setAttribute("cy", String(p.y));
      });
      const cursor = cursorRef.current;
      const readout = readoutRef.current;
      if (cursor) {
        cursor.setAttribute("x1", String(leadX));
        cursor.setAttribute("x2", String(leadX));
      }
      if (readout) {
        readout.setAttribute("x", String(leadX));
        const tc = btTimecode(leadX);
        if (readout.textContent !== tc) readout.textContent = tc;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative h-full w-full bg-[#0a0a0a]">
      <PlateChrome
        cipher="A – 8"
        dark
        eyebrow="Sync"
        line="Nothing drops between rooms."
      />
      <svg
        aria-hidden
        className="size-full"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VW} ${VH}`}
      >
        {/* horizon through both vanishing points */}
        <line stroke="#f5f5f4" strokeOpacity="0.2" strokeWidth="1" x1={0} x2={VW} y1={BT.y} y2={BT.y} />
        {/* the four rays, drawn past the waist to the far edges */}
        <line stroke="#f5f5f4" strokeOpacity="0.85" strokeWidth="1" x1={BT.lx} x2={VW} y1={BT.y} y2={round(BT.y + (VW - BT.lx) * BT_SLOPE)} />
        <line stroke="#f5f5f4" strokeOpacity="0.85" strokeWidth="1" x1={BT.lx} x2={VW} y1={BT.y} y2={round(BT.y - (VW - BT.lx) * BT_SLOPE)} />
        <line stroke="#f5f5f4" strokeOpacity="0.85" strokeWidth="1" x1={BT.rx} x2={0} y1={BT.y} y2={round(BT.y + (BT.rx - 0) * BT_SLOPE)} />
        <line stroke="#f5f5f4" strokeOpacity="0.85" strokeWidth="1" x1={BT.rx} x2={0} y1={BT.y} y2={round(BT.y - (BT.rx - 0) * BT_SLOPE)} />
        {/* the verticals stepping through both triangles; the waist holds */}
        {BT_VERTICALS.map((v) => (
          <line key={`v${v.x}`} stroke="#f5f5f4" strokeOpacity="0.5" strokeWidth="1" x1={v.x} x2={v.x} y1={v.yt} y2={v.yb} />
        ))}
        <line stroke="#f5f5f4" strokeWidth="1" x1={BT.wx} x2={BT.wx} y1={BT.ty} y2={BT.by} />
        <circle cx={BT.lx} cy={BT.y} fill="#f5f5f4" r="2.5" />
        <circle cx={BT.rx} cy={BT.y} fill="#f5f5f4" r="2.5" />
        {/* the two rooms, named at their vanishing points */}
        <text
          fill="#f5f5f4"
          fillOpacity="0.6"
          fontSize="9"
          letterSpacing="0.12em"
          style={MONO}
          textAnchor="middle"
          x={BT.lx}
          y={BT.y + 26}
        >
          SLACK
        </text>
        <text
          fill="#f5f5f4"
          fillOpacity="0.6"
          fontSize="9"
          letterSpacing="0.12em"
          style={MONO}
          textAnchor="middle"
          x={BT.rx}
          y={BT.y + 26}
        >
          ANDO
        </text>
        {/* the ruler: a tick per vertical, the cursor's frame stamped */}
        {BT_VERTICALS.map((v, i) => (
          <g key={`t${v.x}`}>
            <line stroke="#f5f5f4" strokeOpacity="0.4" strokeWidth="1" x1={v.x} x2={v.x} y1={426} y2={434} />
            <text
              fill="#f5f5f4"
              fontSize="8.5"
              letterSpacing="0.06em"
              opacity="0.55"
              style={MONO}
              textAnchor="middle"
              x={v.x}
              y={452}
            >
              {`0:${String(3 + i).padStart(2, "0")}`}
            </text>
          </g>
        ))}
        <line
          ref={cursorRef}
          stroke="#2563eb"
          strokeWidth="1.5"
          x1={BT_INIT[0].x}
          x2={BT_INIT[0].x}
          y1={422}
          y2={438}
        />
        <text
          fill="#2563eb"
          fontSize="9"
          letterSpacing="0.08em"
          ref={readoutRef}
          style={MONO}
          textAnchor="middle"
          x={BT_INIT[0].x}
          y={416}
        >
          {btTimecode(BT_INIT[0].x)}
        </text>
        {BT_INIT.map((p, i) => (
          <circle
            cx={p.x}
            cy={p.y}
            fill="#2563eb"
            key={`d${i}`}
            r="3.5"
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// ── VII. The fan — sightlines crossing inside the kite ─────────────────
// The plate with rays converging from both wings: a kite, its spine,
// and a rung of targets down the middle that both wings sight at once.
// The targets breathe a few pixels, so the moiré at the crossing
// drifts; three riders travel wing → target → far wing, drawing a new
// target every lap.

const FAN = { ax: 90, bx: 670, y: 268, tx: 380, ty: 124, by: 412 };
const FAN_N = 15;
const fanBaseY = (j: number) => 156 + j * 16;

// Each target sways on its own beat; the two wings' rays re-aim live.
const fanTargetY = (j: number, t: number) => round(fanBaseY(j) + 6 * Math.sin(0.25 * t + j * 0.45));

const FAN_RIDERS = [
  { s0: 0.2, speed: 0.22, pick: 5 },
  { s0: 0.9, speed: 0.19, pick: 11 },
  { s0: 1.5, speed: 0.25, pick: 2 },
];

// wing → target → far wing; a fresh target each lap, index-hashed.
// The flash is the landing: the target on the spine brightens as its
// rider reaches it, and lets go as the rider carries on.
function fanRiderAt(i: number, t: number) {
  const rd = FAN_RIDERS[i];
  const raw = rd.s0 + rd.speed * t;
  const lap = Math.floor(raw / 2);
  const s = raw - lap * 2;
  const j = (lap * 7 + rd.pick) % FAN_N;
  const py = fanTargetY(j, t);
  const flash = Math.round(Math.max(0, 1 - Math.abs(s - 1) * 2.5) * 100) / 100;
  const pos =
    s < 1
      ? { x: round(lerp(FAN.ax, FAN.tx, s)), y: round(lerp(FAN.y, py, s)) }
      : { x: round(lerp(FAN.tx, FAN.bx, s - 1)), y: round(lerp(py, FAN.y, s - 1)) };
  return { ...pos, ty: py, flash };
}

const FAN_INIT_TARGETS = Array.from({ length: FAN_N }, (_, j) => fanTargetY(j, 0));
const FAN_INIT = FAN_RIDERS.map((_, i) => fanRiderAt(i, 0));

export function FanLines() {
  const rayARefs = useRef<(SVGLineElement | null)[]>([]);
  const rayBRefs = useRef<(SVGLineElement | null)[]>([]);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const flashRefs = useRef<(SVGCircleElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      for (let j = 0; j < FAN_N; j++) {
        const y = fanTargetY(j, t);
        rayARefs.current[j]?.setAttribute("y2", String(y));
        rayBRefs.current[j]?.setAttribute("y2", String(y));
      }
      FAN_RIDERS.forEach((_, i) => {
        const dot = dotRefs.current[i];
        const flash = flashRefs.current[i];
        if (!dot) return;
        const p = fanRiderAt(i, t);
        dot.setAttribute("cx", String(p.x));
        dot.setAttribute("cy", String(p.y));
        if (flash) {
          flash.setAttribute("cy", String(p.ty));
          flash.setAttribute("opacity", String(p.flash));
        }
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative h-full w-full bg-[#2563eb]">
      <PlateChrome
        cipher="A – 9"
        dark
        eyebrow="Focus"
        line="Both wings, one spine."
      />
      <svg
        aria-hidden
        className="size-full"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VW} ${VH}`}
      >
        {/* the kite and its spine */}
        <path
          d={`M${FAN.ax} ${FAN.y}L${FAN.tx} ${FAN.ty}L${FAN.bx} ${FAN.y}L${FAN.tx} ${FAN.by}Z`}
          stroke="#fff"
          strokeOpacity="0.9"
          strokeWidth="1"
        />
        <line stroke="#fff" strokeOpacity="0.35" strokeWidth="1" x1={FAN.ax} x2={FAN.bx} y1={FAN.y} y2={FAN.y} />
        {/* both wings sighting every target */}
        {FAN_INIT_TARGETS.map((y, j) => (
          <g key={`r${j}`}>
            <line
              ref={(el) => {
                rayARefs.current[j] = el;
              }}
              stroke="#fff"
              strokeOpacity="0.3"
              strokeWidth="0.75"
              x1={FAN.ax}
              x2={FAN.tx}
              y1={FAN.y}
              y2={y}
            />
            <line
              ref={(el) => {
                rayBRefs.current[j] = el;
              }}
              stroke="#fff"
              strokeOpacity="0.3"
              strokeWidth="0.75"
              x1={FAN.bx}
              x2={FAN.tx}
              y1={FAN.y}
              y2={y}
            />
          </g>
        ))}
        <circle cx={FAN.ax} cy={FAN.y} fill="#fff" r="2.5" />
        <circle cx={FAN.bx} cy={FAN.y} fill="#fff" r="2.5" />
        {/* the shared plan, named above the spine */}
        <text
          fill="#fff"
          fillOpacity="0.7"
          fontSize="9"
          letterSpacing="0.12em"
          style={MONO}
          textAnchor="middle"
          x={FAN.tx}
          y={FAN.ty - 14}
        >
          THE PLAN
        </text>
        {FAN_INIT.map((p, i) => (
          <circle
            cx={FAN.tx}
            cy={p.ty}
            fill="#fff"
            key={`f${i}`}
            opacity={p.flash}
            r="2.5"
            ref={(el) => {
              flashRefs.current[i] = el;
            }}
          />
        ))}
        {FAN_INIT.map((p, i) => (
          <circle
            cx={p.x}
            cy={p.y}
            fill="#fff"
            key={`d${i}`}
            r="3.5"
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
          />
        ))}
      </svg>
    </div>
  );
}
