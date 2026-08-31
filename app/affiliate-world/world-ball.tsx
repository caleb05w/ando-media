"use client";

import { useEffect, useRef } from "react";

import "./world-ball.css";

// The world ball — the bubble's final form. The crowd is a shape you
// can handle: drag to turn it (it keeps a little momentum), scroll to
// come closer or step back. Faces always look back at you; only
// position and scale move. The world turns only when turned — left
// alone, it stands perfectly still.
//
// The engine takes any arrangement plus a mode — "ball" tumbles in 3D
// (yaw/pitch, close camera), "wheel" is flat: the ring stays fixed
// and the crowd travels its path. The frame loop sleeps whenever the
// world is at rest — frames only run while a drag, a throw, a zoom,
// or a resize is in flight — and each face is compositor-promoted so
// a frame is a transform update, not a repaint. All of it is
// deterministic — hashed seeds, no randomness — so the server and the
// client agree on the first frame.

const N = 40;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

const DESIGN = 500; // design width the size units are quoted in
const RADIUS = 0.4; // arrangement radius, as a fraction of rendered width
const ZOOM_MIN = 0.78;
const ZOOM_MAX = 1.35;

// The roster — sara is placed by hand on the item facing the viewer;
// everyone else strides through the pool so repeats never sit
// shoulder to shoulder.
const POOL = ["oli", "jordan", "alex", "andrew", "felipe", "ryan", "caleb", "aj", "agent-1", "agent-2"];

// The 2D bubble's size budget, kept: ~a third at 1x, ~a third in
// 1–1.3, the rest up to 1.5 — strided so sizes scatter.
const SIZE_STEPS = [1, 1, 1, 1.1, 1.2, 1.3, 1.38, 1.5];

const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

type Vec3 = [number, number, number];

// Ball space → view space: yaw about Y, then pitch about X.
// Screen coordinates: x right, y down, z toward the viewer.
function rotate(v: Vec3, yaw: number, pitch: number): Vec3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cx = Math.cos(pitch);
  const sx = Math.sin(pitch);
  const x1 = v[0] * cy + v[2] * sy;
  const z1 = -v[0] * sy + v[2] * cy;
  return [x1, v[1] * cx - z1 * sx, v[1] * sx + z1 * cx];
}

// View space → ball space, the exact inverse — used once per
// arrangement, to find the direction that faces the viewer on arrival.
function unrotate(v: Vec3, yaw: number, pitch: number): Vec3 {
  const cx = Math.cos(pitch);
  const sx = Math.sin(pitch);
  const y1 = v[1] * cx + v[2] * sx;
  const z1 = -v[1] * sx + v[2] * cx;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  return [v[0] * cy - z1 * sy, y1, v[0] * sy + z1 * cy];
}

const YAW0 = -0.5;
const PITCH0 = 0.22;

export type WorldMode = "ball" | "wheel";
export type WorldItem = { base: Vec3; size: number; person: string; delay: number };

/* ── iteration 1 — the ball ───────────────────────────────────────────
   The crowd spread evenly over the whole sphere (Fibonacci), sizes on
   the bubble's budget. Reads as a full, round, packed disc. Sara
   faces the viewer on arrival: the direction closest to the initial
   front gets her face. */
const BALL_ITEMS: WorldItem[] = (() => {
  const items: WorldItem[] = Array.from({ length: N }, (_, i) => {
    const y = 1 - ((i + 0.5) * 2) / N;
    const rr = Math.sqrt(1 - y * y);
    const th = i * GOLDEN;
    return {
      base: [Math.cos(th) * rr, y, Math.sin(th) * rr] as Vec3,
      size: 44 * SIZE_STEPS[(i * 5) % SIZE_STEPS.length],
      person: POOL[(i * 7) % POOL.length],
      delay: Math.round(hash(i, 2) * 45) / 100,
    };
  });
  const front = unrotate([0, 0, 1], YAW0, PITCH0);
  let bestI = 0;
  let bestDot = -2;
  items.forEach((item, i) => {
    const dot = item.base[0] * front[0] + item.base[1] * front[1] + item.base[2] * front[2];
    if (dot > bestDot) {
      bestDot = dot;
      bestI = i;
    }
  });
  items[bestI].person = "sara";
  return items;
})();

/* ── iteration 2 — the halo ───────────────────────────────────────────
   The punched-holes reference, taken flat: one closed oval, leaned so
   the crown sits at the upper right, one small size for everyone —
   the dots stay quiet next to the ring, and that proportion is most
   of the look. The rhythm is punched, not even: a tight run at the
   crown, a bunch low on the right, another on the left descent, and
   a lower-left that is almost empty. Dots sit at equal shares of the
   density's integral — the frequency is the drawing. The ring itself
   never moves: spinning sends the crowd travelling along the path,
   bunching through the dense runs and stretching across the gaps,
   while the punched pattern stays fixed on the page. */
const HALO_A = 0.78; // ellipse semi-axes: narrow across…
const HALO_B = 1.0; // …tall along
const HALO_TILT = 0.42; // leaned, crown to the upper right

// Distance between two loop parameters, around the circle.
const wrapDist = (d: number) => Math.abs(d - Math.round(d));
// A soft bunch of crowding centred at c, width w.
const bunch = (t: number, c: number, w: number) => Math.exp(-((wrapDist(t - c) / w) ** 2));

// The reference's rhythm, clockwise from the top (t = 0): the crown
// run, an even right side, a bunch at half past four, a near-empty
// lower left, a tight run on the left descent.
const haloDensity = (t: number) =>
  (0.55 + 0.85 * bunch(t, 0.05, 0.05) + 0.5 * bunch(t, 0.39, 0.055) + 0.6 * bunch(t, 0.78, 0.05)) *
  (1 - 0.45 * bunch(t, 0.6, 0.09));

// The density's cumulative integral, finely sampled — the fixed ring,
// addressed by crowd share m: equal shares land where the punches are.
const HALO_S = 400;
const HALO_CUM: number[] = (() => {
  const cum = [0];
  for (let s = 0; s < HALO_S; s++) cum.push(cum[s] + haloDensity((s + 0.5) / HALO_S));
  return cum;
})();

// Where share m of the crowd sits on the page. Spinning shifts m; the
// pattern itself never moves.
function haloPoint(m: number): [number, number] {
  const mm = m - Math.floor(m);
  const target = mm * HALO_CUM[HALO_S];
  let lo = 0;
  let hi = HALO_S;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (HALO_CUM[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  const th = -Math.PI / 2 + (lo / HALO_S) * Math.PI * 2;
  const x0 = Math.cos(th) * HALO_A;
  const y0 = Math.sin(th) * HALO_B;
  const ct = Math.cos(HALO_TILT);
  const st = Math.sin(HALO_TILT);
  return [x0 * ct - y0 * st, x0 * st + y0 * ct];
}

const HALO_ITEMS: WorldItem[] = (() => {
  const items: WorldItem[] = Array.from({ length: N }, (_, i) => {
    const [x, y] = haloPoint((i + 0.5) / N);
    return {
      base: [x, y, 0] as Vec3,
      size: 20,
      person: POOL[(i * 7) % POOL.length],
      delay: Math.round(i * 2.2) / 100,
    };
  });
  // Sara at the crown of the halo — the topmost face on arrival.
  let topI = 0;
  items.forEach((item, i) => {
    if (item.base[1] < items[topI].base[1]) topI = i;
  });
  items[topI].person = "sara";
  return items;
})();

export const ITERATIONS: { id: string; label: string; mode: WorldMode; items: WorldItem[] }[] = [
  { id: "ball", label: "the ball", mode: "ball", items: BALL_ITEMS },
  { id: "halo", label: "the halo", mode: "wheel", items: HALO_ITEMS },
];

export function WorldBall({ items = BALL_ITEMS, mode = "ball" }: { items?: WorldItem[]; mode?: WorldMode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const scene = sceneRef.current;
    if (!viewport || !scene) return;
    const els = Array.from(scene.children) as HTMLElement[];
    const zCache = new Int32Array(els.length).fill(-1);

    const rot = { yaw: YAW0, pitch: PITCH0, roll: 0 };
    const vel = { yaw: 0, pitch: 0, roll: 0 };
    let zoom = 1;
    let zoomT = 1;
    let width = viewport.clientWidth || DESIGN;
    let revealed = false;
    // The drag caches the viewport rect once at grab — no layout reads
    // while the pointer streams.
    let drag: { id: number; x: number; y: number; angle: number | null; rect: DOMRect; t: number } | null = null;

    const pointerAngle = (rect: DOMRect, x: number, y: number) => {
      const dx = x - rect.left - rect.width / 2;
      const dy = y - rect.top - rect.height / 2;
      return Math.hypot(dx, dy) < 24 ? null : Math.atan2(dy, dx);
    };

    // What the last painted frame showed — frames that would repeat it
    // are skipped, and the loop sleeps once everything settles.
    const drawn = { yaw: NaN, pitch: NaN, roll: NaN, zoom: NaN, width: NaN };

    const render = () => {
      const w = width;
      // The wheel's ring runs wider than the ball — the dots are
      // small, the ring is the presence.
      const r = w * (mode === "wheel" ? 0.46 : RADIUS);
      // The camera sits close: front faces grow, rim and back faces
      // shrink and tuck in — the disc reads full and round, dense at
      // the middle, quiet at the edge.
      const persp = w * 1.4;

      for (let i = 0; i < els.length; i++) {
        let sx: number;
        let sy: number;
        let s: number;
        if (mode === "wheel") {
          // The ring stands still; the crowd travels it — a throw
          // carries everyone along the path, bunching through the
          // dense runs, stretching across the gaps.
          const [hx, hy] = haloPoint((i + 0.5) / N + rot.roll / (Math.PI * 2));
          sx = hx * r * zoom;
          sy = hy * r * zoom;
          s = zoom;
        } else {
          const v = rotate(items[i].base, rot.yaw, rot.pitch);
          const z = v[2] * r * zoom;
          const p = persp / (persp - z);
          sx = v[0] * r * zoom * p;
          sy = v[1] * r * zoom * p;
          s = zoom * p;
          const zi = 1000 + Math.round(z);
          if (zi !== zCache[i]) {
            zCache[i] = zi;
            els[i].style.zIndex = String(zi);
          }
        }
        els[i].style.transform = `translate(-50%, -50%) translate3d(${sx}px, ${sy}px, 0) scale(${s})`;
      }
      drawn.yaw = rot.yaw;
      drawn.pitch = rot.pitch;
      drawn.roll = rot.roll;
      drawn.zoom = zoom;
      drawn.width = w;
      if (!revealed) {
        revealed = true;
        scene.style.opacity = "1";
      }
    };

    let raf = 0;
    let running = false;
    let lastFrame = 0;

    const step = (now: number) => {
      const dt = clamp((now - lastFrame) / 1000, 0.001, 0.05);
      lastFrame = now;

      // Momentum from a throw, and nothing more — no idle motion.
      if (!drag) {
        rot.yaw += vel.yaw * dt;
        rot.pitch = clamp(rot.pitch + vel.pitch * dt, -1.1, 1.1);
        rot.roll += vel.roll * dt;
        const decay = Math.exp(-dt * 3.2);
        vel.yaw *= decay;
        vel.pitch *= decay;
        vel.roll *= decay;
      }
      zoom += (zoomT - zoom) * Math.min(1, dt * 9);

      const still =
        !drag && Math.abs(vel.yaw) + Math.abs(vel.pitch) + Math.abs(vel.roll) < 0.002 && Math.abs(zoomT - zoom) < 0.001;
      if (still) {
        vel.yaw = 0;
        vel.pitch = 0;
        vel.roll = 0;
        zoom = zoomT;
      }
      const moved =
        rot.yaw !== drawn.yaw ||
        rot.pitch !== drawn.pitch ||
        rot.roll !== drawn.roll ||
        zoom !== drawn.zoom ||
        width !== drawn.width;
      if (moved) render();
      if (still) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    // The loop sleeps at rest; every input wakes it.
    const wake = () => {
      if (running) return;
      running = true;
      lastFrame = performance.now();
      raf = requestAnimationFrame(step);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (drag || (e.pointerType === "mouse" && e.button !== 0)) return;
      try {
        viewport.setPointerCapture(e.pointerId);
      } catch {
        // a pointer that vanished before capture — the drag still tracks
      }
      viewport.classList.add("awb-grabbing");
      const rect = viewport.getBoundingClientRect();
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        angle: pointerAngle(rect, e.clientX, e.clientY),
        rect,
        t: performance.now(),
      };
      vel.yaw = 0;
      vel.pitch = 0;
      vel.roll = 0;
      wake();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const now = performance.now();
      const dt = Math.max((now - drag.t) / 1000, 1 / 240);
      if (mode === "wheel") {
        const a1 = pointerAngle(drag.rect, e.clientX, e.clientY);
        if (a1 !== null && drag.angle !== null) {
          let droll = a1 - drag.angle;
          if (droll > Math.PI) droll -= Math.PI * 2;
          if (droll < -Math.PI) droll += Math.PI * 2;
          rot.roll += droll;
          vel.roll = vel.roll * 0.7 + (droll / dt) * 0.3;
        }
        drag.angle = a1;
      } else {
        const k = 3 / width; // a full-width drag turns the world ~170°
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        rot.yaw += dx * k;
        rot.pitch = clamp(rot.pitch - dy * k, -1.1, 1.1);
        vel.yaw = vel.yaw * 0.7 + ((dx * k) / dt) * 0.3;
        vel.pitch = vel.pitch * 0.7 + ((-dy * k) / dt) * 0.3;
      }
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.t = now;
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      viewport.classList.remove("awb-grabbing");
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const speed = e.ctrlKey ? 0.008 : 0.0016;
      zoomT = clamp(zoomT * Math.exp(-e.deltaY * speed), ZOOM_MIN, ZOOM_MAX);
      wake();
    };

    const ro = new ResizeObserver(() => {
      const w = viewport.clientWidth || DESIGN;
      if (w !== width) {
        width = w;
        wake();
      }
    });
    ro.observe(viewport);

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerEnd);
    viewport.addEventListener("pointercancel", onPointerEnd);
    viewport.addEventListener("wheel", onWheel, { passive: false });

    wake(); // the first frame places everyone, then the loop sleeps

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerEnd);
      viewport.removeEventListener("pointercancel", onPointerEnd);
      viewport.removeEventListener("wheel", onWheel);
    };
  }, [items, mode]);

  return (
    <div
      aria-hidden
      className="relative mx-auto w-full cursor-grab touch-none select-none"
      ref={viewportRef}
      style={{ aspectRatio: "1 / 1" }}
    >
      {/* hidden until the first frame places everyone — no pile-up flash */}
      <div className="absolute inset-0 opacity-0" ref={sceneRef}>
        {items.map((item, i) => (
          <div
            className="absolute left-1/2 top-1/2 will-change-transform"
            key={`${item.person}-${i}`}
            style={{ width: `${(item.size / DESIGN) * 100}%` }}
          >
            <span className="awb-enter block" style={{ animationDelay: `${item.delay}s` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                className="pointer-events-none aspect-square w-full max-w-none select-none rounded-full object-cover shadow-[0_0_0_0.5px_rgba(22,25,29,0.08)]"
                decoding="async"
                draggable={false}
                src={`/avatars/${item.person}.png`}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
