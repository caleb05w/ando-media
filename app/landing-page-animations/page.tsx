"use client";

// /landing-page-animations — the Ando Brand dot wheel (Figma
// e4gEqJUqBMec19AI1BhLEc / 3446-2571) running as a loop.
//
// A ring of avatars whose centre sits below the banner, so only the crest
// shows. It cranks up small, pushes into a close-up, holds on whoever
// crested while their typing indicator plays (3446-2775), then pulls back
// out. Everything is integrated per frame — angular velocity to an angle —
// so momentum is real and every arrival is one continuous, forward motion:
// the approach is steered so the wheel's natural coast lands a face at
// dead centre, with no corrective roll afterwards.
//
// The hold composes to the blueprint (3488-1842): the crest face centred
// at 48u with "{name} is {verb}" centred 12u beneath it, and its two
// neighbours at ±38.3% of the banner, lower on the arc, blurred into the
// scrim.

import { useEffect, useRef, useSyncExternalStore } from "react";
import "./landing-page-animations.css";

const DOTS = 28; // storyboard ran 36 at 10°; opened up for breathing room
const SECTOR = 360 / DOTS; // degrees between neighbouring avatars

// The people in the wheel — public/avatars, repeated around the dots so
// no two neighbours share a face.
const AVATARS = [
  "aj",
  "alex",
  "andrew",
  "caleb",
  "felipe",
  "jordan",
  "oli",
  "ryan",
  "sara",
];

// The crest label: "{name} is {verb}" for whoever crested (3488-1842).
const VERBS = ["prompting", "typing", "jamming"];
const displayName = (slug: string) =>
  slug === "aj" ? "AJ" : slug[0].toUpperCase() + slug.slice(1);

// The face in each slot. 28 % 9 = 1, so a plain modulo puts the same face
// on dots 27 and 0 — neighbours across the wrap. Patch the last slot with
// a face that matches neither neighbour.
const FACES = Array.from({ length: DOTS }, (_, i) =>
  i === DOTS - 1 ? AVATARS[4] : AVATARS[i % AVATARS.length],
);

// ── The loop ────────────────────────────────────────────────────────────
const CYCLE = 14; // seconds for out → hold → back
const OUT_F = 0.41; // fraction of the cycle spent pushing in…
const HOLD_F = 0.185; // …holding at the close-up (~2.6s, label plays here)…
// …and the remainder pulling back out.
const SPIN_UP_TO = 0.32; // fraction of each leg spent cranking
const START_SPEED = 0.09; // rev/s the leg opens on
const PEAK_SPEED = 0.25; // rev/s at the end of the crank
const FLOOR_SPEED = 0.02; // rev/s the freewheel decays toward
const FRICTION = 5; // how hard the wheel is braked once torque is off
// The blueprint's close-up (3488-1842) puts the crest avatar at 48/152 of
// the banner; dots are 11.52 in storyboard units, so the zoom ceiling is
// 48 / 11.52. Keep in sync with --lpa-max in the CSS.
const MAX_SCALE = 48 / 11.52;

// ── The stop ────────────────────────────────────────────────────────────
// One fluid landing: from STEER_FROM the wheel's remaining coast is
// projected forward and scaled — imperceptibly, the speeds are tiny — so
// the natural drain (STOP_*) runs out exactly as a face reaches dead
// centre. Always forward; nothing rolls back into place.
const STEER_FROM = 0.6; // leg position where the landing is projected
const STOP_FROM = 0.88; // leg position where the spin starts draining…
const STOP_BY = 0.97; // …and where it reaches zero

// ── The spread ──────────────────────────────────────────────────────────
// As the camera closes in, spacing between avatars grows until the crest
// face's neighbours sit just past the banner's edges — the close-up is one
// person. The exact multiple is computed from the banner's measured width.
const SPREAD_START = 0.65; // leg position where the spacing starts growing

// ── The hold ────────────────────────────────────────────────────────────
// The typing-indicator grammar, in absolute seconds from the landing:
// the crest face acknowledges with a small pip, "…" pops in beneath it
// and cycles, then the sentence resolves whole in its place (the
// blueprint's resolved state is text alone). The label never folds itself
// away — the departure motion is what removes it.
const ACK_AT = 0.3; // s: the avatar's pip
const DOTS_AT = 0.35; // s: the "…" container pops in
const POP_S = 0.2; // s: pop-in duration (slight overshoot)
const RESOLVE_AT = 1.0; // s: dots resolve into the sentence
const DOT_PERIOD = 0.9; // s: one wave through the three dots
// Blueprint 3488-1842: the crest face's neighbours sit at ±38.3% of the
// banner width (their centres), lower on the arc. Their blur comes from
// the side scrims (gradient-masked backdrop-filters), not the avatars.
const NEIGHBOUR_X = (206 - 48) / 412;


/** Hermite ramp between two edges — 0 below edge0, 1 above edge1, eased. */
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Normalize an angle to (-180, 180]. */
function norm(a: number) {
  const m = ((a % 360) + 360) % 360;
  return m > 180 ? m - 360 : m;
}

/** Angular velocity, rev/s, at leg position h ∈ [0,1]. The crank's squared
 *  ramp and the freewheel's exponential decay are BLENDED across ±BLEND of
 *  the handoff — the raw pieces meet at a corner (acceleration flips sign
 *  in one frame), which read as the wheel hitting a wall at peak spin. */
const SPEED_BLEND = 0.08;
function crankAt(h: number) {
  const u = h / SPIN_UP_TO;
  return START_SPEED + (PEAK_SPEED - START_SPEED) * u * u;
}
function freewheelAt(h: number) {
  const u = Math.max(0, (h - SPIN_UP_TO) / (1 - SPIN_UP_TO));
  return FLOOR_SPEED + (PEAK_SPEED - FLOOR_SPEED) * Math.exp(-FRICTION * u);
}
function speedAt(h: number) {
  const m = smoothstep(SPIN_UP_TO - SPEED_BLEND, SPIN_UP_TO + SPEED_BLEND, h);
  if (m <= 0) return crankAt(h);
  if (m >= 1) return freewheelAt(h);
  return crankAt(h) * (1 - m) + freewheelAt(h) * m;
}

/** The stop taper — spin drains to zero across the approach's last leg. */
function stopperAt(h: number) {
  return 1 - smoothstep(STOP_FROM, STOP_BY, h);
}

/** Degrees the wheel would naturally coast from leg position h0 to 1. */
function coastFrom(h0: number, legSeconds: number) {
  const steps = 32;
  let deg = 0;
  for (let i = 0; i < steps; i++) {
    const h = h0 + ((i + 0.5) / steps) * (1 - h0);
    deg += speedAt(h) * stopperAt(h) * 360 * (legSeconds * (1 - h0)) / steps;
  }
  return deg;
}

/** Scale at leg position h — the push in starts on the crank's tail, so
 *  the zoom and the spin peak don't land on the same frame. */
function scaleAt(h: number) {
  return 1 + (MAX_SCALE - 1) * smoothstep(SPIN_UP_TO - 0.05, 1, h);
}

// ── The timeline strip ──────────────────────────────────────────────────
// A read-out of the cycle drawn under the banner: the same functions the
// frame loop runs, sampled once at module load. ω is speed × stop-taper
// on the legs and zero through the hold (the per-cycle steer ratio is
// omitted — it varies with where the coast lands). The playhead is driven
// from the rAF loop.
const TL_W = 1000;
const TL_H = 120;
function cycleAt(p: number) {
  let h: number;
  let tau = -1;
  if (p < OUT_F) h = p / OUT_F;
  else if (p < OUT_F + HOLD_F) {
    h = 1;
    tau = (p - OUT_F) / HOLD_F;
  } else h = 1 - (p - OUT_F - HOLD_F) / (1 - OUT_F - HOLD_F);
  const omega = tau >= 0 ? 0 : speedAt(h) * stopperAt(h);
  const zoom = (scaleAt(h) - 1) / (MAX_SCALE - 1);
  const tH = tau >= 0 ? tau * HOLD_F * CYCLE : -1;
  let lab = 0;
  if (tH >= DOTS_AT) lab = Math.min(1, (tH - DOTS_AT) / POP_S);
  else if (tau < 0 && p > OUT_F) lab = smoothstep(0.9, 0.985, h);
  return { omega, zoom, lab };
}
function tlPath(pick: (c: ReturnType<typeof cycleAt>) => number, max = 1) {
  const pts: string[] = [];
  for (let i = 0; i <= 240; i++) {
    const p = i / 240;
    const y = TL_H - 12 - (pick(cycleAt(p)) / max) * (TL_H - 28);
    pts.push(`${i === 0 ? "M" : "L"}${((p * TL_W)).toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}
const TL_OMEGA_MAX = PEAK_SPEED;
const TL_PATHS = {
  omega: tlPath((c) => c.omega, TL_OMEGA_MAX),
  zoom: tlPath((c) => c.zoom),
  label: tlPath((c) => c.lab),
};
const TL_HOLD = { x: OUT_F * TL_W, w: HOLD_F * TL_W };
const TL_MARKS = [
  { x: OUT_F * SPIN_UP_TO * TL_W, name: "crank end" },
  { x: OUT_F * STEER_FROM * TL_W, name: "steer" },
  { x: OUT_F * STOP_FROM * TL_W, name: "stop drain" },
];

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

export default function LandingPageAnimations() {
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<SVGLineElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!ring || !label) return;
    const banner = ring.parentElement as HTMLElement;
    const textEl = label.querySelector<HTMLSpanElement>(".lpa-label-text")!;
    const dotEls = Array.from(
      label.querySelectorAll<HTMLElement>(".lpa-label-dots i"),
    );
    const avatarEls = ring.querySelectorAll<SVGImageElement>("image");
    const dotGroups = ring.querySelectorAll<SVGGElement>("svg > g");

    // Geometry, cached on resize so the frame loop never reads layout for
    // it: the crest-pin offset, and how far the spacing must spread to put
    // the crest face's neighbours at the blueprint's ±38.3% of the banner.
    let baseR = ring.offsetWidth / 2;
    let spreadMax = 1; // sector multiple that lands the neighbours on spec
    const measure = () => {
      baseR = ring.offsetWidth / 2;
      const rimR = baseR * (138.24 / 144.115);
      const targetX = banner.clientWidth * NEIGHBOUR_X;
      spreadMax = Math.max(
        1,
        ((Math.asin(Math.min(0.98, targetX / rimR)) * 180) / Math.PI) / SECTOR,
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ring);
    ro.observe(banner);

    const place = (angle: number, scale: number) => {
      // The ring is laid out at MAX_SCALE (see the CSS), so the on-screen
      // scale is scale/MAX_SCALE — always ≤ 1. Scaling down instead of up
      // keeps the avatar bitmaps rasterized at close-up resolution.
      const v = scale / MAX_SCALE;
      ring.style.transform = `translateY(${baseR * v}px) rotate(${angle}deg) scale(${v})`;
      // Fed to the CSS on each avatar: the counter-rotation that keeps
      // faces upright while the wheel turns.
      ring.style.setProperty("--lpa-spin", `${angle}deg`);
    };

    if (reduced) {
      // No motion: park the wheel at rest, storyboard frame one.
      place(0, 1);
      return () => ro.disconnect();
    }

    let raf = 0;
    let last = performance.now();
    let phase = 0;
    let angle = 0;
    let prevTau = -1; // hold-local time last frame; <0 = not holding
    let steerOn = false; // landing projection armed for this approach
    let steerH0 = 0; // leg position where the projection was armed
    let steerExtra = 0; // extra speed factor, eased in via the steer ramp
    let steerTarget = 0; // the sector-aligned angle the coast lands on
    const STEER_RAMP = 0.12; // leg fraction over which the factor eases in
    let pendingText = ""; // this visit's sentence, applied at the resolve
    let pipEl: SVGImageElement | null = null; // the crest face, for the pip
    let lastSpread = 1; // last spacing multiple written to the dots

    const frame = (now: number) => {
      // Clamped so a backgrounded tab doesn't return and jump the wheel.
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      phase = (phase + dt / CYCLE) % 1;

      // Timeline: push in (h 0→1) → hold (h = 1, tau 0→1) → pull back out
      // (h 1→0). The wheel only turns on the legs; the hold is still.
      let h: number;
      let tau = -1;
      if (phase < OUT_F) {
        h = phase / OUT_F;
      } else if (phase < OUT_F + HOLD_F) {
        h = 1;
        tau = (phase - OUT_F) / HOLD_F;
      } else {
        h = 1 - (phase - OUT_F - HOLD_F) / (1 - OUT_F - HOLD_F);
      }

      if (tau < 0) {
        if (phase < OUT_F && h >= STEER_FROM) {
          // Project the coast once and pick the next detent past it. The
          // extra speed that closes the gap eases in over STEER_RAMP —
          // engaging it in one frame was an audible speed step. The ramp's
          // weighted coast is integrated so the landing still hits the
          // detent exactly. Never backwards.
          if (!steerOn) {
            steerOn = true;
            steerH0 = h;
            const legS = OUT_F * CYCLE;
            const natural = coastFrom(h, legS);
            let ramped = 0;
            for (let i = 0; i < 32; i++) {
              const hh = h + ((i + 0.5) / 32) * (1 - h);
              ramped +=
                speedAt(hh) * stopperAt(hh) *
                smoothstep(steerH0, steerH0 + STEER_RAMP, hh) *
                360 * (legS * (1 - h)) / 32;
            }
            steerTarget = Math.ceil((angle + natural) / SECTOR) * SECTOR;
            steerExtra = (steerTarget - angle - natural) / Math.max(ramped, 1e-3);
          }
          const factor =
            1 + steerExtra * smoothstep(steerH0, steerH0 + STEER_RAMP, h);
          angle += speedAt(h) * stopperAt(h) * factor * dt * 360;
          angle = Math.min(angle, steerTarget);
        } else {
          angle = (angle + speedAt(h) * stopperAt(h) * dt * 360) % 360;
          if (phase > OUT_F + HOLD_F) steerOn = false; // re-arm next pass
        }
      } else {
        // Held: parked where the coast ran out.
        angle = steerTarget;
      }

      // Hold entry: pick the crest face and a verb for this visit (random,
      // so nobody is stuck jamming forever), stage its sentence, and arm
      // the settle.
      if (tau >= 0 && prevTau < 0) {
        const k =
          (((Math.round(-steerTarget / SECTOR) % DOTS) + DOTS) % DOTS) | 0;
        const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
        pendingText = `${displayName(FACES[k])} is ${verb}`;
        textEl.textContent = "";
        if (pipEl) pipEl.style.setProperty("--lpa-pip", "1");
        pipEl = avatarEls[k] ?? null;
      }
      prevTau = tau;

      const scale = scaleAt(h);

      // The spread — spacing grows through the final zoom until the crest
      // face's neighbours sit past the banner's edges, and contracts the
      // same way on the way out. Anchored at the crest line, so the centre
      // face never moves while the others slide away.
      const spread = 1 + (spreadMax - 1) * smoothstep(SPREAD_START, 1, h);
      if (spread > 1.0005 || lastSpread > 1.0005) {
        lastSpread = spread;
        for (let j = 0; j < dotGroups.length; j++) {
          const base = j * SECTOR;
          // Multiply the dot's angle from the crest, CLAMPED at the wheel's
          // bottom (±180°) — without the clamp, far-side dots spread past
          // the bottom and wrap back around into the crest view.
          const n = norm(angle + base);
          const spreadTo = Math.sign(n) * Math.min(Math.abs(n) * spread, 180);
          const a = base + (spreadTo - n);
          dotGroups[j].setAttribute(
            "transform",
            `rotate(${a.toFixed(3)} 144.115 144.115)`,
          );
          avatarEls[j].style.setProperty("--lpa-da", `${a.toFixed(3)}deg`);
        }
      }

      // ── The typing indicator ──────────────────────────────────────────
      // Seconds since the hold landed; <0 while travelling.
      const tHold = tau >= 0 ? tau * HOLD_F * CYCLE : -1;

      // The crest face's pip — a small breath the moment before its dots
      // appear, tying the label to the person.
      if (pipEl && tHold >= ACK_AT) {
        const p = Math.min(1, (tHold - ACK_AT) / 0.45);
        pipEl.style.setProperty(
          "--lpa-pip",
          (1 + 0.06 * Math.sin(Math.PI * p)).toFixed(4),
        );
      }

      // Container: pops in shortly after landing (fast, slight overshoot),
      // stays for the whole hold, and is taken away by the departure — it
      // fades and sinks with the first motion of the pull-out.
      let cOp = 0;
      let cDy = 4;
      let cScale = 1;
      if (tHold >= DOTS_AT) {
        const u = Math.min(1, (tHold - DOTS_AT) / POP_S);
        cOp = u;
        cScale = 1 + 0.05 * Math.sin(u * Math.PI) - 0.1 * (1 - u) * (1 - u);
        cDy = (1 - u) * 4;
      } else if (tau < 0 && phase > OUT_F) {
        // Return leg: the camera leaving is what removes the label.
        const e = smoothstep(0.9, 0.985, h);
        cOp = e;
        cDy = (1 - e) * 6;
      }

      if (cOp > 0) {
        // The three dots cycle the whole time the label is up — the live
        // typing indicator, trailing the sentence once it resolves.
        const te =
          tau >= 0
            ? smoothstep(RESOLVE_AT, RESOLVE_AT + 0.18, tHold)
            : 1;
        const wave = now / 1000 / DOT_PERIOD;
        for (let j = 0; j < dotEls.length; j++) {
          const o =
            0.25 + 0.75 * (0.5 + 0.5 * Math.sin(2 * Math.PI * wave - j * 1.05));
          dotEls[j].style.opacity = o.toFixed(2);
        }
        if (te > 0) {
          if (textEl.textContent !== pendingText) textEl.textContent = pendingText;
          textEl.style.opacity = te.toFixed(3);
          textEl.style.transform = `translateY(${((1 - te) * 4).toFixed(1)}px)`;
        }
      }

      // The label sits centred beneath the crest face (blueprint: 12u gap,
      // 20u/28u text).
      label.style.opacity = cOp.toFixed(3);
      label.style.transform = `translateX(-50%) translateY(${cDy.toFixed(1)}px) scale(${cScale.toFixed(3)})`;

      place(angle, scale);
      const ph = playheadRef.current;
      if (ph) {
        const x = (phase * TL_W).toFixed(1);
        ph.setAttribute("x1", x);
        ph.setAttribute("x2", x);
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduced]);

  return (
    <main className="lpa-field bg-gray-100">
      <section className="lpa-banner">
        {/* The wheel is one SVG in the storyboard's own coordinate space —
            circles straight off the Figma asset (cx 144.115, cy 5.875,
            r 5.76 in a 288.23 box), each rotated about the centre. */}
        <div ref={ringRef} className="lpa-ring">
          <svg
            className="lpa-ring-svg"
            viewBox="0 0 288.23 288.23"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              {/* One clip in the dot's local coordinates — every dot group
                  shares it, since each group is just a rotation of the same
                  circle about the ring's centre. */}
              <clipPath id="lpa-dot-clip">
                <circle cx="144.115" cy="5.875" r="5.76" />
              </clipPath>
            </defs>
            {Array.from({ length: DOTS }, (_, i) => (
              <g key={i} transform={`rotate(${(i / DOTS) * 360} 144.115 144.115)`}>
                {/* The avatar IS the dot — clipped to the storyboard's
                    circle; the CSS counter-rotation (ring spin + this dot's
                    offset, negated) keeps it upright while it orbits. */}
                <image
                  className="lpa-avatar"
                  href={`/avatars/${FACES[i]}.png`}
                  x={144.115 - 5.76}
                  y={5.875 - 5.76}
                  width={11.52}
                  height={11.52}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath="url(#lpa-dot-clip)"
                  style={{ "--lpa-da": `${(i / DOTS) * 360}deg` } as React.CSSProperties}
                />
              </g>
            ))}
          </svg>
        </div>
        {/* Side scrims — gradient-masked backdrop blur + wash at each edge
            so the crest face's neighbours dissolve toward the banner edges
            without filtering the avatars themselves. */}
        <div className="lpa-side lpa-side-l">
          <div className="lpa-side-blur" />
          <div className="lpa-side-blur" />
          <div className="lpa-side-wash" />
        </div>
        <div className="lpa-side lpa-side-r">
          <div className="lpa-side-blur" />
          <div className="lpa-side-blur" />
          <div className="lpa-side-wash" />
        </div>
        {/* Progressive blur + white wash over the bottom half — see the
            .lpa-scrim rules for how the bands stack. */}
        <div className="lpa-scrim">
          <div className="lpa-scrim-blur" />
          <div className="lpa-scrim-blur" />
          <div className="lpa-scrim-blur" />
          <div className="lpa-scrim-blur" />
          <div className="lpa-scrim-wash" />
        </div>
        {/* The typing indicator, composed beside the crest face at the
            Figma pill's ratios (3446-2773): "…" cycles, the sentence
            resolves whole, the dots trail live. All motion written per
            frame from the rAF loop. After the scrim in paint order so it
            sits above the blur it would otherwise be washed by. */}
        <div ref={labelRef} className="lpa-label" aria-hidden="true">
          <span className="lpa-label-text" />
          <span className="lpa-label-dots">
            <i />
            <i />
            <i />
          </span>
        </div>
      </section>
      {/* The motion timeline — the cycle's curves with a live playhead.
          A read-out, not part of the piece. */}
      <div className="lpa-timeline" aria-hidden="true">
        <svg viewBox={`0 0 ${TL_W} ${TL_H}`} preserveAspectRatio="none">
          <rect
            x={TL_HOLD.x}
            y={0}
            width={TL_HOLD.w}
            height={TL_H}
            className="lpa-tl-hold"
          />
          {TL_MARKS.map((m) => (
            <line
              key={m.name}
              x1={m.x}
              x2={m.x}
              y1={10}
              y2={TL_H}
              className="lpa-tl-mark"
            />
          ))}
          <path d={TL_PATHS.omega} className="lpa-tl-omega" />
          <path d={TL_PATHS.zoom} className="lpa-tl-zoom" />
          <path d={TL_PATHS.label} className="lpa-tl-label" />
          <line
            ref={playheadRef}
            x1={0}
            x2={0}
            y1={0}
            y2={TL_H}
            className="lpa-tl-playhead"
          />
        </svg>
        <div className="lpa-tl-legend">
          <span className="lpa-tl-key lpa-tl-key-zoom">zoom</span>
          <span className="lpa-tl-key lpa-tl-key-omega">spin ω</span>
          <span className="lpa-tl-key lpa-tl-key-label">label</span>
          <span className="lpa-tl-key">hold = shaded · ticks: crank end / steer / stop drain</span>
        </div>
      </div>
    </main>
  );
}
