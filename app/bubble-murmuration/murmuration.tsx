"use client";

// Canvas flock engine for /bubble-murmuration.
//
// A field of particles drifts as boids (separation / alignment / cohesion +
// a wander oscillator), and on a timer coalesces into a shape — the
// logomark, an @, a checkmark — holds it, scatters, and returns to
// flocking. The cycle loops forever.
//
//   flock ──drift──▶ form ──▶ hold ──▶ scatter ──▶ flock (next shape)
//
// The size dial morphs the whole aesthetic: below ~3.5px particles render
// as square dither dots (theoluu.com-style halftone dust — run thousands),
// above it they render as tiny speech-bubble glyphs (run ~100). Targets are
// sampled from an offscreen canvas where the shape is drawn filled; at low
// counts a greedy spacing pass keeps sparse shapes even, at high counts raw
// random sampling reads as organic dither texture.

import { useEffect, useRef, type RefObject } from "react";

export type MurmurationSettings = {
  count: number;
  /** Base bubble size in px; each boid carries a ±30% multiplier. */
  size: number;
  /** Cruise speed in px/s. Formation flight may briefly exceed it. */
  speed: number;
  cohesion: number;
  separation: number;
  alignment: number;
  /** Seconds spent free-flocking between formations. */
  drift: number;
  /** Seconds a formed shape is held before scattering. */
  hold: number;
  /** Shape size as a fraction of the short viewport edge. */
  scale: number;
  /** Extra padding (px) around the avoid rect; 0 disables the repel. */
  repel: number;
  ink: string;
  accent1: string;
  accent2: string;
  accent3: string;
};

type Boid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Per-boid size multiplier so the flock isn't uniform. */
  s: number;
  /** 0 = ink, 1–3 = accents. Resolved to a colour at draw time so the
      palette dials recolour live. */
  colorIdx: 0 | 1 | 2 | 3;
  alpha: number;
  tx: number;
  ty: number;
  /** Phase offsets so wander/bob oscillators don't move in lockstep. */
  wander: number;
  bob: number;
};

type Phase = "flock" | "form" | "hold" | "scatter";

const SHAPES = ["logo", "at", "check"] as const;
type Shape = (typeof SHAPES)[number];

/** Minimum seconds allowed for the flight into formation before the hold
    timer starts; the real duration adapts to the farthest boid's travel so
    slow dust still arrives. Steering is identical in form and hold, so
    stragglers keep arriving — the split only exists so `hold` measures the
    *formed* shape. */
const MIN_FORM_SECONDS = 2;
const SCATTER_SECONDS = 1.1;

/** The Ando-ish mark: a rounded square bubble whose bottom-left corner
    extends into a tail. One closed path shared by the tiny boids (filled)
    and the big formation target (stroked), so the flock literally forms a
    giant version of itself. */
function bubblePath(ctx: CanvasRenderingContext2D, s: number) {
  const r = s * 0.28;
  const left = -s / 2;
  const top = -s / 2;
  const right = s / 2;
  const bottom = s * 0.32;
  ctx.beginPath();
  ctx.moveTo(left + r, top);
  ctx.lineTo(right - r, top);
  ctx.arcTo(right, top, right, top + r, r);
  ctx.lineTo(right, bottom - r);
  ctx.arcTo(right, bottom, right - r, bottom, r);
  ctx.lineTo(left + s * 0.34, bottom);
  ctx.lineTo(left, bottom + s * 0.3);
  ctx.lineTo(left, top + r);
  ctx.arcTo(left, top, left + r, top, r);
  ctx.closePath();
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  cx: number,
  cy: number,
  box: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#000";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (shape === "logo") {
    ctx.scale(box / 1.1, box / 1.1);
    bubblePath(ctx, 1);
    ctx.fill();
  } else if (shape === "at") {
    ctx.font = `900 ${box}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("@", 0, box * 0.04);
  } else {
    ctx.lineWidth = box * 0.13;
    ctx.beginPath();
    ctx.moveTo(-0.34 * box, 0.04 * box);
    ctx.lineTo(-0.09 * box, 0.28 * box);
    ctx.lineTo(0.36 * box, -0.24 * box);
    ctx.stroke();
  }
  ctx.restore();
}

/** Sample n points from the shape's drawn pixels. Shuffled so consecutive
    boids land on far-apart points and the shape emerges everywhere at once
    rather than tracing in from one end. */
function sampleShape(
  shape: Shape,
  w: number,
  h: number,
  cx: number,
  cy: number,
  box: number,
  n: number,
) {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  drawShape(ctx, shape, cx, cy, box);

  const step = Math.max(2, Math.floor(box / 160));
  const data = ctx.getImageData(0, 0, w, h).data;
  const candidates: [number, number][] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 100) candidates.push([x, y]);
    }
  }
  if (candidates.length === 0) return [];
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  /* At sparse counts a greedy min-distance pass keeps the shape even —
     independent samples double up and read clumpy. At dust counts the
     quadratic pass is too slow and random dither IS the desired texture.
     The spacing estimate treats candidate count × step² as drawn area. */
  let chosen: [number, number][];
  if (n <= 400) {
    const minDist = Math.max(step, Math.sqrt((candidates.length * step * step) / n) * 0.75);
    chosen = [];
    for (const c of candidates) {
      if (chosen.length >= n) break;
      let ok = true;
      for (const p of chosen) {
        const dx = c[0] - p[0];
        const dy = c[1] - p[1];
        if (dx * dx + dy * dy < minDist * minDist) {
          ok = false;
          break;
        }
      }
      if (ok) chosen.push(c);
    }
  } else {
    chosen = candidates.slice(0, n);
  }
  for (let i = 0; chosen.length < n; i++) chosen.push(candidates[i % candidates.length]);
  const jitter = step * 0.8;
  return chosen.map(
    ([x, y]) =>
      [x + (Math.random() - 0.5) * jitter, y + (Math.random() - 0.5) * jitter] as [number, number],
  );
}

function makeBoid(w: number, h: number, speed: number): Boid {
  const angle = Math.random() * Math.PI * 2;
  const colorIdx = (Math.random() < 0.78 ? 0 : 1 + Math.floor(Math.random() * 3)) as Boid["colorIdx"];
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * speed * 0.6,
    vy: Math.sin(angle) * speed * 0.6,
    s: 0.7 + Math.random() * 0.6,
    colorIdx,
    alpha: colorIdx === 0 ? 0.35 + Math.random() * 0.5 : 0.75,
    tx: 0,
    ty: 0,
    wander: Math.random() * Math.PI * 2,
    bob: Math.random() * Math.PI * 2,
  };
}

export function Murmuration({
  settings,
  avoidRef,
}: {
  settings: MurmurationSettings;
  /** Element the flock steers around while drifting (the auth card). The
      repel is dropped during form/hold so shapes stay complete — the card's
      glass blur handles legibility for the overlap. */
  avoidRef?: RefObject<HTMLDivElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    const boids: Boid[] = [];
    let phase: Phase = "flock";
    /* Simulated seconds, not wall clock — rAF throttling (hidden tab) then
       slows the whole loop coherently instead of letting the phase machine
       run ahead of the physics. */
    let simT = 0;
    let phaseT = 0;
    let shapeIdx = 0;
    let formSeconds = MIN_FORM_SECONDS;
    let last = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) drawStatic();
    };

    const syncCount = () => {
      const s = settingsRef.current;
      while (boids.length < s.count) boids.push(makeBoid(w, h, s.speed));
      if (boids.length > s.count) boids.length = s.count;
    };

    const assignTargets = () => {
      const s = settingsRef.current;
      const shape = SHAPES[shapeIdx % SHAPES.length];
      let cx = w / 2;
      const cy = h * 0.46;
      let box = Math.min(w, h) * s.scale;
      /* Shapes are solid silhouettes, so they'd fight the form if centered
         behind it. Put them in whichever side margin has room; when neither
         does (narrow screens), skip the formation and keep flocking. */
      const rect = avoidRef?.current?.getBoundingClientRect() ?? null;
      if (rect) {
        const leftSpace = rect.left;
        const rightSpace = w - rect.right;
        const side = Math.max(leftSpace, rightSpace);
        const fit = Math.min(box, side * 0.72, h * 0.62);
        if (fit < 140) return false;
        box = fit;
        // Strict > prefers the left margin on the tie a centered form
        // produces — keeps formations away from dev panels on the right.
        cx = rightSpace > leftSpace ? rect.right + rightSpace / 2 : leftSpace / 2;
      }
      const pts = sampleShape(shape, w, h, cx, cy, box, boids.length);
      if (pts.length === 0) return false;
      let maxD = 0;
      boids.forEach((b, i) => {
        b.tx = pts[i][0];
        b.ty = pts[i][1];
        maxD = Math.max(maxD, Math.hypot(b.tx - b.x, b.ty - b.y));
      });
      // Flight time scaled to the farthest traveller at formation speed.
      formSeconds = Math.min(
        8,
        Math.max(MIN_FORM_SECONDS, (maxD / (s.speed * 1.6)) * 1.15 + 0.5),
      );
      return true;
    };

    const boidColor = (b: Boid) => {
      const s = settingsRef.current;
      return [s.ink, s.accent1, s.accent2, s.accent3][b.colorIdx];
    };

    const drawBoids = (t: number) => {
      const s = settingsRef.current;
      ctx.clearRect(0, 0, w, h);
      const dust = s.size < 3.5;
      for (const b of boids) {
        const size = s.size * b.s;
        ctx.globalAlpha = b.alpha;
        ctx.fillStyle = boidColor(b);
        if (dust) {
          // Square dither pixels — no transform per particle, this path runs
          // thousands of times a frame.
          ctx.fillRect(b.x - size / 2, b.y - size / 2, size, size);
        } else {
          const tilt = Math.max(-1, Math.min(1, b.vx / Math.max(s.speed, 1))) * 0.3;
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(tilt);
          bubblePath(ctx, size);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      void t;
    };

    /* Reduced motion: skip the loop entirely and show the formed logomark
       as a still composition. */
    const drawStatic = () => {
      syncCount();
      shapeIdx = 0;
      if (!assignTargets()) return;
      for (const b of boids) {
        b.x = b.tx;
        b.y = b.ty;
        b.vx = 0;
        b.vy = 0;
      }
      drawBoids(0);
    };

    const step = (dt: number) => {
      const s = settingsRef.current;
      simT += dt;
      phaseT += dt;
      const t = simT;
      syncCount();

      if (phase === "flock" && phaseT > s.drift) {
        if (assignTargets()) {
          phase = "form";
        } else {
          // No room (or nothing sampled) — wait out another drift cycle
          // rather than re-sampling every frame.
          shapeIdx++;
        }
        phaseT = 0;
      } else if (phase === "form" && phaseT > formSeconds) {
        phase = "hold";
        phaseT = 0;
      } else if (phase === "hold" && phaseT > s.hold) {
        // One outward impulse from the shape's centre, then momentum and the
        // flock forces take over.
        let cx = 0;
        let cy = 0;
        for (const b of boids) {
          cx += b.tx;
          cy += b.ty;
        }
        cx /= boids.length;
        cy /= boids.length;
        for (const b of boids) {
          const dx = b.x - cx;
          const dy = b.y - cy;
          const d = Math.hypot(dx, dy) || 1;
          const burst = s.speed * (1.1 + Math.random() * 0.6);
          b.vx = (dx / d) * burst;
          b.vy = (dy / d) * burst;
        }
        phase = "scatter";
        phaseT = 0;
      } else if (phase === "scatter" && phaseT > SCATTER_SECONDS) {
        phase = "flock";
        phaseT = 0;
        shapeIdx++;
      }

      const forming = phase === "form" || phase === "hold";
      const maxAccel = s.speed * 6;
      const sepR = s.size * 3.6;
      const nbrR = 64;

      const avoid = !forming && s.repel > 0 ? avoidRef?.current?.getBoundingClientRect() : null;

      /* Spatial hash so neighbor search is O(n·k) — dust mode runs
         thousands of boids and the naive pair scan is quadratic. Only the
         flock branch reads neighbors, so skip the build while forming. */
      const cell = Math.max(nbrR, sepR);
      const cellKey = (x: number, y: number) =>
        Math.floor(x / cell) * 100003 + Math.floor(y / cell);
      let grid: Map<number, Boid[]> | null = null;
      if (!forming) {
        grid = new Map();
        for (const b of boids) {
          const k = cellKey(b.x, b.y);
          const bucket = grid.get(k);
          if (bucket) bucket.push(b);
          else grid.set(k, [b]);
        }
      }

      for (const b of boids) {
        let ax = 0;
        let ay = 0;

        if (forming) {
          // Arrive: full speed while far, easing off near the target. During
          // hold the target bobs a couple of px so the shape stays alive.
          const bobY = phase === "hold" ? Math.sin(t * 1.4 + b.bob) * 2.4 : 0;
          const dx = b.tx - b.x;
          const dy = b.ty + bobY - b.y;
          const d = Math.hypot(dx, dy) || 1;
          const target = Math.min(d / 90, 1) * s.speed * 1.6;
          ax += ((dx / d) * target - b.vx) * 4;
          ay += ((dy / d) * target - b.vy) * 4;
        } else {
          let sepX = 0;
          let sepY = 0;
          let aliX = 0;
          let aliY = 0;
          let cohX = 0;
          let cohY = 0;
          let nSep = 0;
          let nNbr = 0;
          const gx = Math.floor(b.x / cell);
          const gy = Math.floor(b.y / cell);
          for (let ix = gx - 1; ix <= gx + 1; ix++) {
            for (let iy = gy - 1; iy <= gy + 1; iy++) {
              const bucket = grid!.get(ix * 100003 + iy);
              if (!bucket) continue;
              for (const o of bucket) {
                if (o === b) continue;
                const dx = b.x - o.x;
                const dy = b.y - o.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < sepR * sepR && d2 > 0.0001) {
                  const d = Math.sqrt(d2);
                  sepX += dx / d / d;
                  sepY += dy / d / d;
                  nSep++;
                }
                if (d2 < nbrR * nbrR) {
                  aliX += o.vx;
                  aliY += o.vy;
                  cohX += o.x;
                  cohY += o.y;
                  nNbr++;
                }
              }
            }
          }
          const steer = (dx: number, dy: number, weight: number) => {
            const d = Math.hypot(dx, dy);
            if (d < 0.0001) return;
            ax += ((dx / d) * s.speed - b.vx) * weight;
            ay += ((dy / d) * s.speed - b.vy) * weight;
          };
          if (nSep > 0) steer(sepX, sepY, s.separation * 3);
          if (nNbr > 0) {
            steer(aliX / nNbr, aliY / nNbr, s.alignment * 1.6);
            steer(cohX / nNbr - b.x, cohY / nNbr - b.y, s.cohesion * 1.2);
          }

          // Wander: a slow oscillation perpendicular to the heading, so the
          // flock meanders instead of settling into a straight cruise.
          const vd = Math.hypot(b.vx, b.vy) || 1;
          const wob = Math.sin(t * 1.7 + b.wander) * maxAccel * 0.2;
          ax += (-b.vy / vd) * wob;
          ay += (b.vx / vd) * wob;

          // Soft walls.
          const margin = 70;
          if (b.x < margin) ax += ((margin - b.x) / margin) * maxAccel * 0.8;
          if (b.x > w - margin) ax -= ((b.x - (w - margin)) / margin) * maxAccel * 0.8;
          if (b.y < margin) ay += ((margin - b.y) / margin) * maxAccel * 0.8;
          if (b.y > h - margin) ay -= ((b.y - (h - margin)) / margin) * maxAccel * 0.8;

          if (avoid) {
            const rl = avoid.left - s.repel;
            const rr = avoid.right + s.repel;
            const rt = avoid.top - s.repel;
            const rb = avoid.bottom + s.repel;
            if (b.x > rl && b.x < rr && b.y > rt && b.y < rb) {
              const rcx = (rl + rr) / 2;
              const rcy = (rt + rb) / 2;
              const dx = b.x - rcx;
              const dy = b.y - rcy;
              const d = Math.hypot(dx, dy) || 1;
              ax += (dx / d) * maxAccel * 1.5;
              ay += (dy / d) * maxAccel * 1.5;
            }
          }
        }

        const aMag = Math.hypot(ax, ay);
        const aCap = forming ? maxAccel * 2 : maxAccel;
        if (aMag > aCap) {
          ax = (ax / aMag) * aCap;
          ay = (ay / aMag) * aCap;
        }
        b.vx += ax * dt;
        b.vy += ay * dt;
        const vMag = Math.hypot(b.vx, b.vy);
        const vCap = forming ? s.speed * 1.8 : s.speed;
        if (vMag > vCap) {
          b.vx = (b.vx / vMag) * vCap;
          b.vy = (b.vy / vMag) * vCap;
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        // Hard backstop well past the soft walls, for resize jumps.
        b.x = Math.max(-60, Math.min(w + 60, b.x));
        b.y = Math.max(-60, Math.min(h + 60, b.y));
      }
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      step(dt);
      drawBoids(simT);
      raf = requestAnimationFrame(tick);
    };

    /* Verification hook: rAF is throttled to ~nothing in hidden panes, so
       agents (and curious humans) can advance the sim synchronously —
       `__murmurationStep(8)` fast-forwards eight simulated seconds. */
    const devStep = (seconds: number) => {
      const n = Math.round(seconds * 60);
      for (let i = 0; i < n; i++) step(1 / 60);
      drawBoids(simT);
      return { phase, simT: Math.round(simT * 10) / 10 };
    };
    (window as Window & { __murmurationStep?: typeof devStep }).__murmurationStep = devStep;

    resize();
    window.addEventListener("resize", resize);
    if (!reduced) {
      syncCount();
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      delete (window as Window & { __murmurationStep?: typeof devStep }).__murmurationStep;
    };
  }, [avoidRef]);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />;
}
