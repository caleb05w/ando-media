"use client";

// The workspace diagram — the loop, segmented into levels.
//
// One circle, actually composed of four stacked LEVELS. Each level
// carries its quarter of the loop in blue; the rest of its ring is grey.
// Collapsed, the quarters tile into ONE complete circle — the loop as it
// should be — with twenty agents orbiting it and an orchestrator at the
// centre they report to. Data transfer is a blue pulse that shoots along
// one or two spokes at a time; a spoke only exists around its moment of
// use. As the stack pulls apart the connections SNAP one by one (outer
// rings first), stubs recoil into both ends, the orchestrator greys out,
// and the agents crawl at a fraction of their meeting pace on separated
// rings tied together only by dashed construction verticals.
//
// Under the diagram, the same story in product language: one dark trace
// card — the team in a jam, thought line shimmering — that hands off to
// one card per person as the split lands.

import Image from "next/image";
import { useEffect, useRef } from "react";
import "./slack-vs-ando.css";

// ── Geometry ────────────────────────────────────────────────────────────
const CX = 320;
const CY = 250; // dead centre of the viewBox
const RX = 196;
const RY = 78;

const round = (n: number) => Math.round(n * 10) / 10;
const smooth = (s: number) => s * s * (3 - 2 * s);

const arcPath = (a0: number, a1: number) => {
  const n = 48;
  const pts = Array.from({ length: n + 1 }, (_, k) => {
    const a = ((a0 + ((a1 - a0) * k) / n) * Math.PI) / 180;
    return `${round(CX + RX * Math.cos(a))} ${round(CY + RY * Math.sin(a))}`;
  });
  return "M" + pts.join("L");
};

// Four levels; their blue quarters tile the full circle exactly, so the
// collapsed stack reads as one unbroken blue loop. Listed bottom-first:
// SVG paints in order, so the top level (closest) lands on top.
const N_LEVELS = 4;
const LIFT = 62; // vertical separation per level — a tight stack
const LEVELS = Array.from({ length: N_LEVELS }, (_, i) => ({
  blue: arcPath(90 + i * 90, 90 + (i + 1) * 90),
  lift: 1.5 - i, // bottom (+1.5) first, top (-1.5) last — centred stack
  depth: 1 - i / (N_LEVELS - 1), // 1 = farthest … 0 = closest
}));
const RING = arcPath(0, 360);

const DEPTH_SCALE = 0; // rings keep one size — the seam verticals must
// land exactly on every ring; depth is carried by opacity alone
const levelTransform = (lift: number, depth: number, k: number) => {
  const s = 1 + (0.5 - depth) * DEPTH_SCALE * k;
  const dy = lift * LIFT * k;
  return `translate(${round(CX * (1 - s))} ${round(CY * (1 - s) + dy)}) scale(${Math.round(s * 1000) / 1000})`;
};
const levelOpacity = (depth: number, k: number) => round(1 - depth * 0.65 * Math.min(1, k));

// Architecture lines: dashed vertical construction lines at three of the
// loop's seams, tying the separated levels back to one geometry.
const SEAMS = [90, 210, 330];

function seamPoint(levelIdx: number, angDeg: number, k: number) {
  const lv = LEVELS[levelIdx];
  const s = 1 + (0.5 - lv.depth) * DEPTH_SCALE * k;
  const dy = lv.lift * LIFT * k;
  const a = (angDeg * Math.PI) / 180;
  const y = CY + RY * Math.sin(a);
  // x stays unscaled so a seam's line is strictly vertical.
  return { x: round(CX + RX * Math.cos(a)), y: round(y * s + CY * (1 - s) + dy) };
}

// ── The nodes ───────────────────────────────────────────────────────────
// Agents riding each level's track, plus one orchestrator at the centre.
const NODES = Array.from({ length: 20 }, (_, i) => ({
  level: i % N_LEVELS,
  speed: 0.55 + ((i * 5) % 4) * 0.09,
  // 1.63 rad steps — irrational to 2π/level-count, so the dots on a
  // level spread instead of stacking.
  phase: i * 1.63,
  // The surge rhythm: each agent works in bursts, then coasts.
  wb: 0.35 + ((i * 7) % 4) * 0.11,
  pb: i * 1.3,
  // And a slight wobble off the track — riding it, not welded to it.
  wj: 0.8 + ((i * 3) % 3) * 0.25,
  pj: i * 2.4,
}));

// A node's global position: its spot on the ellipse, run through its
// level's depth transform by hand (nodes render at root level so the
// spokes can honestly span between planes).
function nodeGlobal(levelIdx: number, angRad: number, k: number, wob = 0) {
  const lv = LEVELS[levelIdx];
  const s = 1 + (0.5 - lv.depth) * DEPTH_SCALE * k;
  const dy = lv.lift * LIFT * k;
  const x = CX + RX * (1 + wob) * Math.cos(angRad);
  const y = CY + RY * (1 + wob) * Math.sin(angRad);
  return {
    x: round(x * s + CX * (1 - s)),
    y: round(y * s + CY * (1 - s) + dy),
    s,
  };
}

// Speed IS the productivity metric: the agents never stop, but together
// they run at full pace and segmented they crawl at ~4% of it.
const speedFactor = (k: number) => 1 - 0.96 * smooth(Math.min(1, k * 1.3));

// The severing: connections don't shrink — they SNAP. Each spoke holds
// while the stack starts to open, then breaks at its own threshold
// (outer rings first, per-agent jitter so the breaks cascade one by
// one). At the cut the line vanishes in a beat and two short stubs
// recoil into the core and the agent. Rejoining reverses it.
const SNAP_AT = (n: { level: number }, i: number) => {
  const base = Math.abs(LEVELS[n.level].lift) > 1 ? 0.24 : 0.5;
  return base + ((i * 7) % 5) * 0.02;
};
const RECOIL_T = 0.4; // s for the stubs to whip back
const ATTACH_T = 0.25; // s for a re-attached line to draw on
const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;

// The orchestrator's colour: blue while conducting, blue-grey once the
// split leaves it with nothing to conduct.
const coreFill = (k: number) => {
  const e = smooth(Math.min(1, k));
  const ch = (a: number, b: number) => Math.round(a + (b - a) * e);
  return `rgb(${ch(37, 154)} ${ch(99, 166)} ${ch(235, 192)})`;
};

// ── The Ando UI strip ───────────────────────────────────────────────────
// The register is /agent-context-trace's collapsed line: #1b1b1b card,
// shimmer thought line, 20px avatar discs rimmed in the card's own dark.
const CAST = [
  { avatar: "sara", name: "Sara", task: "Writing the PRD" },
  { avatar: "oli", name: "Oli", task: "Reviewing designs" },
  { avatar: "andrew", name: "Andrew", task: "Fixing the build" },
  { avatar: "jordan", name: "Jordan", task: "Drafting the deck" },
];
const CARD_SPREAD = 158; // px between individual cards, fully apart

// ── The cycle: joined → apart → joined ──────────────────────────────────
const T_CYCLE = 10;
const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;

// Cubic glide both ways — deliberate, no bounce.
function apartK(t: number) {
  const u = ((t % T_CYCLE) + T_CYCLE) % T_CYCLE;
  if (u < 2) return 0;
  if (u < 3.6) return easeInOutCubic((u - 2) / 1.6);
  if (u < 8) return 1;
  if (u < 9.6) return 1 - easeInOutCubic((u - 8) / 1.6);
  return 0;
}
const K0 = apartK(0);

export default function WorkspaceDiagram() {
  const levelRefs = useRef<(SVGGElement | null)[]>([]);
  const greyRefs = useRef<(SVGPathElement | null)[]>([]);
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([]);
  const spokeARefs = useRef<(SVGLineElement | null)[]>([]);
  const spokeBRefs = useRef<(SVGLineElement | null)[]>([]);
  const seamRefs = useRef<(SVGLineElement | null)[]>([]);
  const jamRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const coreRef = useRef<SVGCircleElement | null>(null);
  // The two caption readings — hard-swapped on the same k that opens the
  // stack, so the words always match the state the eye is seeing.
  const capJoinedRef = useRef<HTMLSpanElement | null>(null);
  const capSiloedRef = useRef<HTMLSpanElement | null>(null);
  // Which reading is up; flips only when the ring travel fully lands.
  const capSiloed = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    const start = last;
    // Orbit state: angles integrate, so slowing preserves position.
    const angles = NODES.map((n) => n.phase);
    // Connection state per agent: attached or snapped, and when.
    const attached = NODES.map(() => true);
    const tEvent = NODES.map(() => -10);

    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = apartK(t);

      // Caption swap: a hard cut, and only AFTER the rings finish their
      // travel — the flip waits for k to fully land (1 = stack open,
      // 0 = loop resealed). Mid-glide the previous reading holds.
      if (k >= 0.999) capSiloed.current = true;
      else if (k <= 0.001) capSiloed.current = false;
      if (capJoinedRef.current) capJoinedRef.current.style.opacity = capSiloed.current ? "0" : "1";
      if (capSiloedRef.current) capSiloedRef.current.style.opacity = capSiloed.current ? "1" : "0";

      LEVELS.forEach((lv, i) => {
        const g = levelRefs.current[i];
        if (g) {
          g.setAttribute("transform", levelTransform(lv.lift, lv.depth, k));
          g.setAttribute("opacity", String(levelOpacity(lv.depth, k)));
        }
        // The grey remainders snap in the moment separation begins —
        // they ARE the rings, not an effect.
        greyRefs.current[i]?.setAttribute("stroke-opacity", String(round(Math.min(1, k * 8) * 0.9)));
      });

      // Architecture lines follow the stack as it opens.
      SEAMS.forEach((a, i) => {
        const el = seamRefs.current[i];
        if (!el) return;
        const top = seamPoint(N_LEVELS - 1, a, k); // closest
        const bot = seamPoint(0, a, k); // farthest
        el.setAttribute("x1", String(top.x));
        el.setAttribute("y1", String(top.y));
        el.setAttribute("x2", String(bot.x));
        el.setAttribute("y2", String(bot.y));
        el.setAttribute("stroke-opacity", String(round(Math.min(1, Math.max(0, k) * 1.2) * 0.8)));
      });

      // Nodes: agents surging and coasting around their tracks.
      const sf = speedFactor(k);
      NODES.forEach((n, i) => {
        // Surge-and-coast: bursts of progress between lulls.
        const burst = 0.35 + 2.2 * Math.max(0, Math.sin(n.wb * t + n.pb)) ** 2;
        angles[i] += n.speed * sf * burst * dt;
        const wob = 0.006 * Math.sin(n.wj * t + n.pj);
        const g = nodeGlobal(n.level, angles[i], k, wob);
        const el = nodeRefs.current[i];
        if (el) {
          el.setAttribute("transform", `translate(${g.x} ${g.y})`);
          el.setAttribute("r", String(round(2.2 * g.s)));
          el.setAttribute("opacity", String(levelOpacity(LEVELS[n.level].depth, k)));
        }
        // Connection state machine: hold, SNAP, recoil, re-attach.
        const snapAt = SNAP_AT(n, i);
        if (attached[i] && k > snapAt) {
          attached[i] = false;
          tEvent[i] = t;
        } else if (!attached[i] && k < snapAt - 0.1) {
          attached[i] = true;
          tEvent[i] = t;
        }
        const a = spokeARefs.current[i];
        const b = spokeBRefs.current[i];
        const dtE = t - tEvent[i];
        if (attached[i]) {
          // No standing wires: a spoke only exists around its moment of
          // use. It fades in just before its pulse, carries the blue
          // transfer, and fades away after — so the condensed state
          // shows two or three live conversations, never twenty lines.
          // Spoke i fires at slots s ≡ 3i (mod 20) — 3 is 7⁻¹ mod 20 —
          // i.e. once every 10s.
          const s0 = ((i * 3) % NODES.length) * 0.5;
          const fire = s0 + 10 * Math.round((t - s0) / 10);
          let lineO = 0;
          if (t > fire - 0.3 && t < fire + 1.3) {
            if (t < fire) lineO = (t - (fire - 0.3)) / 0.3;
            else if (t < fire + 0.9) lineO = 1;
            else lineO = 1 - (t - (fire + 0.9)) / 0.4;
          }
          const draw = Math.min(1, dtE / ATTACH_T);
          if (a) {
            a.setAttribute("stroke", "#aeb9d2");
            a.setAttribute("stroke-opacity", String(round(Math.max(0, lineO) * 0.5)));
            a.setAttribute("stroke-dashoffset", String(round((i % 2 === 0 ? -1 : 1) * t * 8)));
            a.setAttribute("x1", String(CX));
            a.setAttribute("y1", String(CY));
            a.setAttribute("x2", String(round(CX + (g.x - CX) * draw)));
            a.setAttribute("y2", String(round(CY + (g.y - CY) * draw)));
          }
          // The pulse rota: every 0.5s a new spoke fires; each pulse
          // takes 0.9s, so at most two are in flight at once.
          let pulse: { u: number; out: boolean } | null = null;
          const slot = Math.floor(t / 0.5);
          for (const s of [slot - 1, slot]) {
            if ((((s * 7) % NODES.length) + NODES.length) % NODES.length === i) {
              const u = (t - s * 0.5) / 0.9;
              if (u >= 0 && u < 1) pulse = { u, out: s % 2 === 0 };
            }
          }
          if (b) {
            if (pulse) {
              const f0 = pulse.u * 0.85;
              const f1 = f0 + 0.15;
              const lo = pulse.out ? f0 : 1 - f1;
              const hi = pulse.out ? f1 : 1 - f0;
              b.style.strokeDasharray = "none";
              b.setAttribute("stroke", "#2563eb");
              b.setAttribute("stroke-opacity", "0.9");
              b.setAttribute("x1", String(round(CX + (g.x - CX) * lo)));
              b.setAttribute("y1", String(round(CY + (g.y - CY) * lo)));
              b.setAttribute("x2", String(round(CX + (g.x - CX) * hi)));
              b.setAttribute("y2", String(round(CY + (g.y - CY) * hi)));
            } else {
              b.setAttribute("stroke-opacity", "0");
            }
          }
        } else if (dtE < RECOIL_T && ((((t - ((i * 3) % NODES.length) * 0.5) % 10) + 10) % 10) < 2.2) {
          // The cut: only lines that were actually in use recoil.
          const e = easeOutCubic(dtE / RECOIL_T);
          const dx = g.x - CX;
          const dy = g.y - CY;
          const o = round(0.55 * (1 - e * 0.5));
          if (a) {
            a.setAttribute("stroke", "#aeb9d2");
            a.setAttribute("stroke-opacity", String(o));
            a.setAttribute("x1", String(CX));
            a.setAttribute("y1", String(CY));
            a.setAttribute("x2", String(round(CX + dx * 0.34 * (1 - e))));
            a.setAttribute("y2", String(round(CY + dy * 0.34 * (1 - e))));
          }
          if (b) {
            b.style.strokeDasharray = "";
            b.setAttribute("stroke", "#aeb9d2");
            b.setAttribute("stroke-opacity", String(o));
            b.setAttribute("x1", String(round(g.x - dx * 0.3 * (1 - e))));
            b.setAttribute("y1", String(round(g.y - dy * 0.3 * (1 - e))));
            b.setAttribute("x2", String(g.x));
            b.setAttribute("y2", String(g.y));
          }
        } else {
          a?.setAttribute("stroke-opacity", "0");
          b?.setAttribute("stroke-opacity", "0");
        }
      });

      const cap = smooth(Math.min(1, Math.max(0, k)));
      // The UI strip: the jam card hands off to the individual cards,
      // staggered so the two never overlap.
      const jam = jamRef.current;
      if (jam) {
        const o = Math.max(0, 1 - cap * 2.2);
        jam.style.opacity = String(round(o));
        jam.style.transform = `translate(-50%, 0) scale(${round(0.96 + 0.04 * o)})`;
      }
      CAST.forEach((_, i) => {
        const el = cardRefs.current[i];
        if (!el) return;
        const o = Math.max(0, cap * 2.2 - 1.2);
        el.style.opacity = String(round(Math.min(1, o)));
        const x = (i - (CAST.length - 1) / 2) * CARD_SPREAD * cap;
        el.style.transform = `translate(calc(-50% + ${round(x)}px), 0)`;
      });

      // The orchestrator breathes while conducting, and greys once split.
      const core = coreRef.current;
      if (core) {
        core.setAttribute("r", String(round(9 + (1 - k) * 0.7 * Math.sin(t * 2))));
        core.setAttribute("fill", coreFill(k));
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="sva">
      <main className="sva-stage">
        <section className="sva-half">
          <svg className="sva-canvas" viewBox="-40 0 720 470" fill="none">
            {/* architecture lines — dashed verticals through the seams */}
            {SEAMS.map((a, i) => {
              const top = seamPoint(N_LEVELS - 1, a, K0);
              const bot = seamPoint(0, a, K0);
              return (
                <line
                  key={i}
                  ref={(el) => {
                    seamRefs.current[i] = el;
                  }}
                  x1={top.x}
                  y1={top.y}
                  x2={bot.x}
                  y2={bot.y}
                  strokeOpacity={Math.min(1, K0 * 1.2) * 0.8}
                  className="sva-seam"
                />
              );
            })}

            {/* the levels — one loop's worth of blue, segmented across
                four planes. Bottom first so the top paints closest. */}
            {LEVELS.map((lv, i) => (
              <g
                key={i}
                ref={(el) => {
                  levelRefs.current[i] = el;
                }}
                transform={levelTransform(lv.lift, lv.depth, K0)}
                opacity={levelOpacity(lv.depth, K0)}
              >
                <path
                  ref={(el) => {
                    greyRefs.current[i] = el;
                  }}
                  d={RING}
                  strokeOpacity={Math.min(1, K0 * 8) * 0.9}
                  className="sva-level-ring"
                />
                <path d={lv.blue} className="sva-piece" />
              </g>
            ))}

            {/* spokes — a line only exists while it's being used; the
                blue pulse is the data, and a snapped line recoils */}
            {NODES.map((n, i) => {
              const g = nodeGlobal(n.level, n.phase, K0);
              return (
                <g key={i}>
                  <line
                    ref={(el) => {
                      spokeARefs.current[i] = el;
                    }}
                    x1={CX}
                    y1={CY}
                    x2={g.x}
                    y2={g.y}
                    stroke="#aeb9d2"
                    strokeOpacity={0}
                    className="sva-spoke"
                  />
                  <line
                    ref={(el) => {
                      spokeBRefs.current[i] = el;
                    }}
                    x1={g.x}
                    y1={g.y}
                    x2={g.x}
                    y2={g.y}
                    strokeOpacity={0}
                    className="sva-spoke"
                  />
                </g>
              );
            })}

            {/* the orchestrator — one core at the centre of the system */}
            <circle ref={coreRef} cx={CX} cy={CY} r="9" fill={coreFill(K0)} className="sva-core" />

            {/* the agents — riding their tracks */}
            {NODES.map((n, i) => {
              const g = nodeGlobal(n.level, n.phase, K0);
              return (
                <circle
                  key={i}
                  ref={(el) => {
                    nodeRefs.current[i] = el;
                  }}
                  transform={`translate(${g.x} ${g.y})`}
                  r={round(2.2 * g.s)}
                  opacity={levelOpacity(LEVELS[n.level].depth, K0)}
                  className="sva-node"
                />
              );
            })}
          </svg>

          {/* the Ando UI strip — the trace card register, verbatim */}
          <div className="sva-ui">
            <div ref={jamRef} className="sva-jam">
              <div className="sva-faces">
                {CAST.map((c) => (
                  <span key={c.avatar} className="sva-disc">
                    <Image
                      src={`/avatars/${c.avatar}.png`}
                      alt=""
                      width={20}
                      height={20}
                      className="sva-face"
                    />
                  </span>
                ))}
              </div>
              <span className="sva-shimmer">Jamming on the launch plan…</span>
            </div>

            {CAST.map((c, i) => (
              <div
                key={c.avatar}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="sva-card"
              >
                <span className="sva-disc">
                  <Image
                    src={`/avatars/${c.avatar}.png`}
                    alt=""
                    width={20}
                    height={20}
                    className="sva-face"
                  />
                </span>
                <span className="sva-card-text">
                  <span className="sva-card-name">{c.name}</span>
                  <span className="sva-card-task">{c.task}</span>
                </span>
              </div>
            ))}
          </div>

          {/* What the motion is saying, in words — right under the
              cards so it travels with the content, never the page edge.
              Two readings, one per ideal: the outgoing line fades and
              sinks through the first half of the split, the incoming
              rises through the second — a handoff, not a double
              exposure. */}
          <p className="sva-caption">
            <span ref={capJoinedRef}>
              The workspace is a loop. Everyone together works better.
            </span>
            <span ref={capSiloedRef} style={{ opacity: 0 }}>
              However, people go off and get silo&rsquo;d into their own tasks.
            </span>
          </p>
        </section>
      </main>
    </div>
  );
}
