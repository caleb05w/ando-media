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
const CYCLE = 16; // seconds for out → hold → back
const OUT_F = 0.36; // fraction of the cycle spent pushing in…
const HOLD_F = 0.28; // …holding at the close-up (label plays here)…
// …and the remainder pulling back out.
const SPIN_UP_TO = 0.35; // fraction of each leg spent cranking
const START_SPEED = 0.06; // rev/s the leg opens on
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
const SPREAD_START = 0.72; // leg position where the spacing starts growing

// ── The hold ────────────────────────────────────────────────────────────
// The typing-indicator grammar, in absolute seconds from the landing:
// the crest face acknowledges with a small pip, "…" pops in beneath it
// and cycles, then the sentence resolves whole in its place (the
// blueprint's resolved state is text alone). The label never folds itself
// away — the departure motion is what removes it.
const ACK_AT = 0.3; // s: the avatar's pip
const DOTS_AT = 0.35; // s: the "…" container pops in
const POP_S = 0.2; // s: pop-in duration (slight overshoot)
const RESOLVE_AT = 1.4; // s: dots resolve into the sentence
const DOT_PERIOD = 0.9; // s: one wave through the three dots
// Blueprint 3488-1842: the crest face's neighbours sit at ±38.3% of the
// banner width (their centres), lower on the arc, blurred into the scrim.
const NEIGHBOUR_X = (206 - 48) / 412;
const NEIGHBOUR_BLUR = "blur(0.9px)"; // viewBox units ≈ 8px on screen

// The shudder when the zoom lands — a subtle settle, more tremor than thud.
const SHUDDER_AMP = 2; // px, before the decay envelope
const SHUDDER_DECAY = 9; // higher = settles faster (~0.5s tail)

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

/** Angular velocity, rev/s, at leg position h ∈ [0,1]. */
function speedAt(h: number) {
  if (h < SPIN_UP_TO) {
    // Squared ramp — the wheel puts on speed faster the longer you crank,
    // which reads as momentum rather than an ease-in.
    const u = h / SPIN_UP_TO;
    return START_SPEED + (PEAK_SPEED - START_SPEED) * u * u;
  }
  // Torque off: exponential decay toward the floor. On the return leg the
  // same curve runs backwards, so the wheel gathers speed as it shrinks.
  const u = (h - SPIN_UP_TO) / (1 - SPIN_UP_TO);
  return FLOOR_SPEED + (PEAK_SPEED - FLOOR_SPEED) * Math.exp(-FRICTION * u);
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

/** Scale at leg position h — held at 1 through the crank, then the push in. */
function scaleAt(h: number) {
  return 1 + (MAX_SCALE - 1) * smoothstep(SPIN_UP_TO, 1, h);
}

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

    const place = (angle: number, scale: number, sx = 0, sy = 0) => {
      // The ring is laid out at MAX_SCALE (see the CSS), so the on-screen
      // scale is scale/MAX_SCALE — always ≤ 1. Scaling down instead of up
      // keeps the avatar bitmaps rasterized at close-up resolution.
      const v = scale / MAX_SCALE;
      // sx/sy is the arrival shudder — screen pixels, applied after the
      // crest offset so the zoom doesn't amplify it.
      ring.style.transform = `translateY(${baseR * v}px) translate(${sx.toFixed(2)}px, ${sy}px) rotate(${angle}deg) scale(${v})`;
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
    let shudderT = -1; // <0 = not shuddering
    let prevTau = -1; // hold-local time last frame; <0 = not holding
    let steer = 0; // 0 = free; else the speed ratio that lands on centre
    let steerTarget = 0; // the sector-aligned angle the coast lands on
    let pendingText = ""; // this visit's sentence, applied at the resolve
    let pipEl: SVGImageElement | null = null; // the crest face, for the pip
    let blurredEls: SVGImageElement[] = []; // flanking faces, blurred at hold
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
          // Project the coast once, pick the next detent past it, and scale
          // the remaining travel to land there — same physics, same drain,
          // just slightly more of it. Never backwards.
          if (steer === 0) {
            const natural = coastFrom(h, OUT_F * CYCLE);
            steerTarget = Math.ceil((angle + natural) / SECTOR) * SECTOR;
            steer = (steerTarget - angle) / Math.max(natural, 1e-3);
          }
          angle += speedAt(h) * stopperAt(h) * steer * dt * 360;
          angle = Math.min(angle, steerTarget);
        } else {
          angle = (angle + speedAt(h) * stopperAt(h) * dt * 360) % 360;
          if (phase > OUT_F + HOLD_F) steer = 0; // re-arm for the next pass
        }
      } else {
        // Held: parked where the coast ran out.
        angle = steerTarget;
      }

      // Hold entry: pick the crest face and a verb for this visit (random,
      // so nobody is stuck jamming forever), stage its sentence, arm the
      // settle, and blur the two flanking faces into the background per the
      // blueprint. The wheel is parked for the whole hold, so the blur
      // rasters once — cleared before motion resumes.
      if (tau >= 0 && prevTau < 0) {
        const k =
          (((Math.round(-steerTarget / SECTOR) % DOTS) + DOTS) % DOTS) | 0;
        const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
        pendingText = `${displayName(FACES[k])} is ${verb}`;
        textEl.textContent = "";
        if (pipEl) pipEl.style.setProperty("--lpa-pip", "1");
        pipEl = avatarEls[k] ?? null;
        shudderT = 0;
        blurredEls = [
          avatarEls[(k + 1) % DOTS],
          avatarEls[(k - 1 + DOTS) % DOTS],
        ];
        for (const el of blurredEls) el.style.filter = NEIGHBOUR_BLUR;
      }
      if (tau < 0 && prevTau >= 0) {
        // Hold just ended — unblur before the wheel moves again (a filter
        // on SVG children forces software re-rasters while animating).
        for (const el of blurredEls) el.style.filter = "";
        blurredEls = [];
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

      // The arrival shudder — a decaying two-axis wobble as the hold lands.
      let sx = 0;
      let sy = 0;
      if (shudderT >= 0) {
        shudderT += dt;
        const envelope = Math.exp(-SHUDDER_DECAY * shudderT);
        if (envelope < 0.01) {
          shudderT = -1;
        } else {
          sx = SHUDDER_AMP * envelope * Math.sin(38 * shudderT);
          sy = SHUDDER_AMP * 0.6 * envelope * Math.cos(29 * shudderT);
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
        // The resolve envelope: 0 while the dots have the floor, 1 once
        // the sentence is up. Dots fade out as the text pops in — the
        // blueprint's resolved state is text alone, centred (3488-1842).
        const te =
          tau >= 0
            ? smoothstep(RESOLVE_AT, RESOLVE_AT + 0.18, tHold)
            : 1;
        const wave = now / 1000 / DOT_PERIOD;
        for (let j = 0; j < dotEls.length; j++) {
          const o =
            (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(2 * Math.PI * wave - j * 1.05))) *
            (1 - te);
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

      place(angle, scale, sx, sy);
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
    </main>
  );
}
