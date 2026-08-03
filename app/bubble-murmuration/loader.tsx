"use client";

// The living glyph-mark for /bubble-murmuration — the Jax material
// (x.com/Jaxoriginals/status/2082101617785213333: letters as pixels) made
// into the page's resting logo, not just a loading trick.
//
// At rest, the Ando mark stands assembled from ~280 ink letter-stamp tiles
// that never quite hold still: glyphs swap on their own clocks, tones
// shimmer, a few tiles at a time run butter and wander through the mass like
// sparks, and the whole mark breathes. On submit the mass breaks apart —
// re-buttering as it scatters — gathers into a dense disc of type, then
// resolves back into the ink mark, and simply resumes resting. One material,
// one continuous life.
//
// Engine notes: silhouette sampling (incl. the bubblePath) descends from
// ./murmuration; window.__loaderStep(seconds) advances the sim synchronously
// so hidden panes (and agents) can verify frames.

import { useEffect, useRef, type RefObject } from "react";

const N = 280;
const TILE = 9.5;
const BOX = 190;
const GLYPHS = "ANDOXTZYE";

const BUTTER = [235, 220, 133];
const INK = [22, 21, 20];
const FG_BUTTER = [74, 70, 66]; // glyph color while the tile is butter
const FG_INK = [244, 242, 239]; // glyph color once the tile is ink

/* Submit-sequence beats (seconds within each phase). */
const BREAK_S = 0.38;
const DISC_S = 1.45;
const RESOLVE_S = 1.6;
const SETTLE_S = 0.7;

type Phase = "enter" | "rest" | "break" | "disc" | "resolve" | "settle";

type Tile = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  g: string;
  seed: number;
  /** 0 = butter, 1 = ink. */
  cm: number;
  nextSwap: number;
};

/** The Ando bubble silhouette, verbatim from ./murmuration. */
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

function sampleTargets(
  kind: "disc" | "mark",
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
  ctx.fillStyle = "#000";
  if (kind === "disc") {
    ctx.beginPath();
    ctx.arc(cx, cy, box / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(box / 1.1, box / 1.1);
    bubblePath(ctx, 1);
    ctx.restore();
    ctx.fill();
  }

  const step = 3;
  const data = ctx.getImageData(0, 0, w, h).data;
  const cands: [number, number][] = [];
  for (let y = 0; y < h; y += step)
    for (let x = 0; x < w; x += step)
      if (data[(y * w + x) * 4 + 3] > 100) cands.push([x, y]);
  if (cands.length === 0) return [];
  for (let i = cands.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cands[i], cands[j]] = [cands[j], cands[i]];
  }
  const minDist = Math.max(step, Math.sqrt((cands.length * step * step) / n) * 0.8);
  const chosen: [number, number][] = [];
  for (const c of cands) {
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
  for (let i = 0; chosen.length < n; i++) chosen.push(cands[i % cands.length]);
  return chosen;
}

export function GlyphMark({
  run,
  originRef,
  onDone,
}: {
  /** True while the submit sequence should play. */
  run: boolean;
  /** Element whose center anchors the mark (the logo slot). */
  originRef: RefObject<HTMLDivElement | null>;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef(run);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    runRef.current = run;
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* Geometry is re-derived on every resize: canvas backing size, the slot
       center, and both target sets. Captured once at mount it goes stale the
       moment the window changes. */
    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let disc: [number, number][] = [];
    let mark: [number, number][] = [];

    const configure = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const o = originRef.current?.getBoundingClientRect();
      cx = o ? o.left + o.width / 2 : w / 2;
      cy = o ? o.top + o.height / 2 : h / 2 - 80;
      disc = sampleTargets("disc", w, h, cx, cy, BOX, N);
      mark = sampleTargets("mark", w, h, cx, cy, BOX, N);
    };
    configure();
    if (disc.length < N || mark.length < N) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Born as a loose butter cloud around the slot; the entrance is the
       tiles finding the mark. */
    const tiles: Tile[] = [];
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 30 + Math.random() * 110;
      tiles.push({
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        vx: Math.cos(a) * (40 + Math.random() * 80),
        vy: Math.sin(a) * (40 + Math.random() * 80),
        tx: mark[i][0],
        ty: mark[i][1],
        g: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        seed: Math.random(),
        cm: 0,
        nextSwap: 1.5 + Math.random() * 5,
      });
    }

    let phase: Phase = "enter";
    let simT = 0;
    let phaseT = 0;
    let sequencing = false;
    /* Edge-detect run: onDone flips the parent's state asynchronously, so for
       a beat after the sequence ends runRef is still true — level-triggering
       would immediately re-break. Only a false→true transition starts one. */
    let prevRun = false;
    let raf = 0;
    let last = performance.now();

    const setTargets = (pts: [number, number][]) => {
      tiles.forEach((t, i) => {
        t.tx = pts[i][0];
        t.ty = pts[i][1];
      });
    };

    const onResize = () => {
      configure();
      if (disc.length < N || mark.length < N) return;
      /* Re-aim at whatever the current phase was flying toward. */
      setTargets(phase === "disc" ? disc : mark);
    };
    window.addEventListener("resize", onResize);

    /** Is this tile currently a wandering butter spark? Deterministic from
        time + seed, so sparks migrate through the mass on their own. */
    const isSpark = (t: Tile) =>
      (simT * 0.35 + t.seed * 13) % 13 < 0.9;

    const arrive = (t: Tile, dt: number, maxSp: number) => {
      const dx = t.tx - t.x;
      const dy = t.ty - t.y;
      const d = Math.hypot(dx, dy) || 1;
      const sp = Math.min(d * 7, maxSp);
      const k = Math.min(1, dt * 7);
      t.vx += ((dx / d) * sp - t.vx) * k;
      t.vy += ((dy / d) * sp - t.vy) * k;
    };

    const step = (dt: number) => {
      simT += dt;
      phaseT += dt;

      const runNow = runRef.current;
      const runEdge = runNow && !prevRun;
      prevRun = runNow;
      if (phase === "rest" && runEdge && !sequencing) {
        sequencing = true;
        phase = "break";
        phaseT = 0;
        for (const t of tiles) {
          const dx = t.x - cx;
          const dy = t.y - cy;
          const d = Math.hypot(dx, dy) || 1;
          const burst = 140 + Math.random() * 260;
          t.vx = (dx / d) * burst;
          t.vy = (dy / d) * burst;
        }
      }

      for (const t of tiles) {
        switch (phase) {
          case "enter": {
            arrive(t, dt, 700);
            const d = Math.hypot(t.tx - t.x, t.ty - t.y);
            if (d < 14) t.cm += (1 - t.cm) * Math.min(1, dt * 2.5);
            break;
          }
          case "rest": {
            arrive(t, dt, 260);
            const target = isSpark(t) ? 0 : 1;
            t.cm += (target - t.cm) * Math.min(1, dt * 2);
            if (simT > t.nextSwap) {
              t.g = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              t.nextSwap = simT + 1.5 + Math.random() * 5;
            }
            break;
          }
          case "break": {
            const drag = Math.exp(-dt * 1.5);
            t.vx *= drag;
            t.vy *= drag;
            t.cm += (0 - t.cm) * Math.min(1, dt * 5);
            break;
          }
          case "disc": {
            arrive(t, dt, 900);
            t.cm += (0 - t.cm) * Math.min(1, dt * 4);
            break;
          }
          case "resolve": {
            arrive(t, dt, 900);
            if (phaseT > t.seed * 0.35) t.cm += (1 - t.cm) * Math.min(1, dt * 2.4);
            break;
          }
          case "settle": {
            arrive(t, dt, 400);
            t.cm += (1 - t.cm) * Math.min(1, dt * 3);
            break;
          }
        }
        t.x += t.vx * dt;
        t.y += t.vy * dt;
      }

      if (phase === "enter" && phaseT > 1.7) {
        phase = "rest";
        phaseT = 0;
      } else if (phase === "break" && phaseT > BREAK_S) {
        setTargets(disc);
        phase = "disc";
        phaseT = 0;
      } else if (phase === "disc" && phaseT > DISC_S) {
        setTargets(mark);
        phase = "resolve";
        phaseT = 0;
      } else if (phase === "resolve" && phaseT > RESOLVE_S) {
        phase = "settle";
        phaseT = 0;
      } else if (phase === "settle" && phaseT > SETTLE_S) {
        phase = "rest";
        phaseT = 0;
        sequencing = false;
        onDoneRef.current();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const resting = phase === "rest" || phase === "enter";
      ctx.save();
      if (resting && !reduced) {
        /* The whole mark breathes, barely. */
        const s = 1 + Math.sin(simT * 0.55) * 0.008;
        ctx.translate(cx, cy);
        ctx.scale(s, s);
        ctx.translate(-cx, -cy);
      }
      ctx.font = `700 ${TILE * 0.72}px Georgia, 'Times New Roman', serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const t of tiles) {
        /* Micro-jitter and tone shimmer keep the mass alive at rest. */
        const jx = resting && !reduced ? Math.sin(simT * 0.9 + t.seed * 6.28) * 0.5 : 0;
        const jy = resting && !reduced ? Math.cos(simT * 0.7 + t.seed * 9.42) * 0.5 : 0;
        const tone = resting && !reduced ? Math.sin(simT * 1.3 + t.seed * 12.5) * 7 : 0;
        const m = t.cm;
        const bg = `rgb(${Math.round(BUTTER[0] + (INK[0] - BUTTER[0]) * m + tone)},${Math.round(
          BUTTER[1] + (INK[1] - BUTTER[1]) * m + tone,
        )},${Math.round(BUTTER[2] + (INK[2] - BUTTER[2]) * m + tone)})`;
        const fg = `rgba(${Math.round(FG_BUTTER[0] + (FG_INK[0] - FG_BUTTER[0]) * m)},${Math.round(
          FG_BUTTER[1] + (FG_INK[1] - FG_BUTTER[1]) * m,
        )},${Math.round(FG_BUTTER[2] + (FG_INK[2] - FG_BUTTER[2]) * m)},0.9)`;
        ctx.fillStyle = bg;
        ctx.fillRect(t.x + jx - TILE / 2, t.y + jy - TILE / 2, TILE, TILE);
        ctx.fillStyle = fg;
        ctx.fillText(t.g, t.x + jx, t.y + jy + 0.5);
      }
      ctx.restore();
    };

    /* Reduced motion: the assembled ink mark, still. Submits resolve
       instantly. */
    if (reduced) {
      tiles.forEach((t, i) => {
        t.x = mark[i][0];
        t.y = mark[i][1];
        t.vx = 0;
        t.vy = 0;
        t.cm = 1;
      });
      phase = "rest";
      draw();
      const iv = setInterval(() => {
        if (runRef.current) {
          runRef.current = false;
          onDoneRef.current();
        }
      }, 800);
      return () => {
        clearInterval(iv);
        window.removeEventListener("resize", onResize);
      };
    }

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      step(dt);
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const devStep = (seconds: number) => {
      const frames = Math.round(seconds * 60);
      for (let i = 0; i < frames; i++) step(1 / 60);
      draw();
      return { simT: Math.round(simT * 100) / 100, phase };
    };
    (window as Window & { __loaderStep?: typeof devStep }).__loaderStep = devStep;

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      delete (window as Window & { __loaderStep?: typeof devStep }).__loaderStep;
    };
  }, [originRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 h-full w-full"
    />
  );
}
