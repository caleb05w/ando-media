"use client";

// /landing-page-animations — the Ando Brand dot wheel (Figma
// e4gEqJUqBMec19AI1BhLEc / 3446-2571) running as a loop.
//
// The storyboard: a ring of 36 dots whose centre sits below the banner, so
// only the crest shows. Small, it spins up and gains momentum; then it
// grows toward the camera and the growth and the slow-down are the same
// gesture — a bike wheel freewheeling down, reading bigger as it reads
// slower. The crest stays pinned to the storyboard's 34/152 line while the
// wheel scales, so it grows downward, into the scrim.
//
// The angle is integrated from an angular velocity (revolutions/second)
// rather than tweened, so momentum is real: spin-up is a rising ω on a
// squared ramp, the slow-down is friction bleeding ω off exponentially.
// The loop ping-pongs: the second half of the cycle retraces the first, so
// the wheel shrinks back out of the close-up and gathers its speed again on
// the way. No fades, no seam — ω and scale are continuous at both turns.

import { useEffect, useRef, useSyncExternalStore } from "react";
import "./landing-page-animations.css";

// ── The wheel, in storyboard numbers ────────────────────────────────────
const DOTS = 28; // storyboard ran 36 at 10°; opened up for breathing room
const SECTOR = 360 / DOTS; // degrees between neighbouring avatars

// The people in the wheel — public/avatars, repeated around the 36 dots so
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

// The crest label (Figma 3446-2775): "{name} is {verb}", shown beside
// whichever face is at the top of the wheel once the close-up lands.
const VERBS = ["prompting", "typing", "jamming"];
const displayName = (slug: string) =>
  slug === "aj" ? "AJ" : slug[0].toUpperCase() + slug.slice(1);


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
const MAX_SCALE = 3.8; // 288px ring → ~1100px, the close-up frame

// ── The camera ──────────────────────────────────────────────────────────
// The zoom blur is a focus pull, not a speed effect: the frame smears
// quickly when the push starts, then spends the whole approach resolving —
// fully sharp before the close-up lands, so arriving reads as un-blurring.
const BLUR_MAX = 6; // px at the height of the pull
const BLUR_ON_BY = 0.07; // leg fraction after the push starts to reach max
const SHARP_FROM = 0.55; // leg position where the resolve begins…
const SHARP_BY = 0.92; // …and where the frame is fully sharp again
// The shudder when the zoom lands at full size — a subtle settle, more
// tremor than thud.
const SHUDDER_AMP = 2; // px, before the decay envelope
const SHUDDER_DECAY = 9; // higher = settles faster (~0.5s tail)

// ── The stop ────────────────────────────────────────────────────────────
// The wheel never freezes mid-motion. Approaching the hold, the remaining
// spin drains away (STOP_*), and over the last stretch of the leg the ring
// rolls the crest face into its detent (SNAP_FROM_H → landing) — like a
// wheel settling into a notch, already stopped when the hold begins. The
// departure builds back up through the same taper in reverse.
const STOP_FROM = 0.88; // leg position where the spin starts draining…
const STOP_BY = 0.97; // …and where it reaches zero
const SNAP_FROM_H = 0.955; // leg position where the detent roll begins

// ── The hold ────────────────────────────────────────────────────────────
// While held, the crest face's label rises centred beneath it, dwells,
// and folds away before departure.
const LABEL_IN = [0.06, 0.22] as const; // hold fraction: rise in
const LABEL_OUT = [0.8, 0.94] as const; // hold fraction: fold away

/** Hermite ramp between two edges — 0 below edge0, 1 above edge1, eased. */
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Angular velocity, rev/s, at leg position h ∈ [0,1]. */
function speedAt(h: number) {
  if (h < SPIN_UP_TO) {
    // Squared ramp — the wheel puts on speed faster the longer you crank,
    // which reads as momentum rather than an ease-in.
    const u = h / SPIN_UP_TO;
    return START_SPEED + (PEAK_SPEED - START_SPEED) * u * u;
  }
  // Torque off: exponential decay toward the floor. By the time the wheel
  // is huge it's barely turning; on the return leg this same curve runs
  // backwards, so the wheel gathers speed again as it shrinks out.
  const u = (h - SPIN_UP_TO) / (1 - SPIN_UP_TO);
  return FLOOR_SPEED + (PEAK_SPEED - FLOOR_SPEED) * Math.exp(-FRICTION * u);
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

    // Half the ring's laid-out size — the crest-pinning offset is
    // (radius × scale). Cached on resize so the frame loop never reads
    // layout.
    let baseR = ring.offsetWidth / 2;
    const ro = new ResizeObserver(() => {
      baseR = ring.offsetWidth / 2;
    });
    ro.observe(ring);

    const place = (angle: number, scale: number, sx = 0, sy = 0, blur = 0) => {
      // The ring is laid out at MAX_SCALE (see the CSS), so the on-screen
      // scale is scale/MAX_SCALE — always ≤ 1. Scaling down instead of up
      // keeps the avatar bitmaps rasterized at close-up resolution.
      const v = scale / MAX_SCALE;
      // sx/sy is the arrival shudder — applied after the crest offset so
      // it's in screen pixels, unaffected by the zoom.
      ring.style.transform = `translateY(${baseR * v}px) translate(${sx}px, ${sy}px) rotate(${angle}deg) scale(${v})`;
      // The zoom blur goes on the ring div (one GPU-composited layer) — a
      // filter on the SVG's child images forces a software re-raster of the
      // whole SVG every frame and drops the page to ~1fps. Quantized so the
      // style only changes when the blur visibly does.
      const q = Math.round(blur * 4) / 4;
      ring.style.filter = q > 0 ? `blur(${q}px)` : "";
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
    let snapArmed = false; // detent roll engaged for this approach
    let snapFrom = 0; // ring angle when the detent roll began…
    let snapTo = 0; // …and the sector-aligned angle it rolls to

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
        // The stop taper: spin drains to zero before the hold, and builds
        // back through the same curve on the way out — no hard stops.
        const stopper = 1 - smoothstep(STOP_FROM, STOP_BY, h);
        angle = (angle + speedAt(h) * stopper * dt * 360) % 360;
        // The detent roll (approach only): with the spin drained, the ring
        // rolls the crest face the last few degrees into dead centre.
        if (phase < OUT_F && h >= SNAP_FROM_H) {
          if (!snapArmed) {
            snapArmed = true;
            snapFrom = angle;
            snapTo = Math.round(angle / SECTOR) * SECTOR;
          }
          angle = snapFrom + (snapTo - snapFrom) * smoothstep(SNAP_FROM_H, 1, h);
        }
        if (phase > OUT_F + HOLD_F && h < SNAP_FROM_H) snapArmed = false;
      } else {
        // Held: parked on the detent.
        if (!snapArmed) {
          // A clamped-dt jump can skip the roll; land directly.
          snapArmed = true;
          snapTo = Math.round(angle / SECTOR) * SECTOR;
        }
        angle = snapTo;
      }

      // Hold entry: name the crest face and arm the settle.
      if (tau >= 0 && prevTau < 0) {
        const k = (((Math.round(-snapTo / SECTOR) % DOTS) + DOTS) % DOTS) | 0;
        label.textContent = `${displayName(AVATARS[k % AVATARS.length])} is ${VERBS[k % VERBS.length]}`;
        shudderT = 0;
      }
      prevTau = tau;

      const scale = scaleAt(h);

      // The focus pull — a function of where the leg is, not how fast it's
      // moving: smears on quickly when the push starts, then unblurs across
      // the whole approach so the close-up resolves into focus. On the
      // return leg the same curve runs backwards — sharp leaving the
      // close-up, resolving again into the small state.
      const blur =
        BLUR_MAX *
        smoothstep(SPIN_UP_TO, SPIN_UP_TO + BLUR_ON_BY, h) *
        (1 - smoothstep(SHARP_FROM, SHARP_BY, h));

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

      // The label plays only inside the hold: g runs 0→1→0 (rise, dwell,
      // fold away). Centred beneath the crest face, it reveals from its
      // middle outward while drifting up into place.
      const g =
        tau >= 0
          ? smoothstep(LABEL_IN[0], LABEL_IN[1], tau) *
            (1 - smoothstep(LABEL_OUT[0], LABEL_OUT[1], tau))
          : 0;
      const s = ((1 - g) * 50).toFixed(1);
      label.style.opacity = String(g);
      label.style.clipPath = `inset(0 ${s}% 0 ${s}%)`;
      label.style.transform = `translateX(-50%) translateY(${((1 - g) * 8).toFixed(1)}px)`;

      place(angle, scale, sx, sy, blur);
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
            36 circles straight off the Figma asset (cx 144.115, cy 5.875,
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
                  href={`/avatars/${AVATARS[i % AVATARS.length]}.png`}
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
        {/* "{name} is {verb}" centred beneath the crest face (Figma
            3446-2775) — text, opacity, and reveal written per frame from
            the rAF loop. After the scrim in paint order so it sits above
            the blur it would otherwise be washed by. */}
        <div ref={labelRef} className="lpa-label" aria-hidden="true" />
      </section>
    </main>
  );
}
