"use client";

// The Jam panel's stage — where the panel sits in each phase of joining.
//
//   hero    — you pressed Join: the card in the transcript grows into the
//             call itself, alone and centred over a dimmed room. Only the
//             dark call stage shows; the thread is folded away.
//   deploy  — the thread and live transcript unfold beneath the call
//             (no composer yet — that comes with the column).
//   docked  — the room comes back and the panel takes its seat on the
//             right, its column opening in the layout as it lands.
//
// The panel is one absolutely positioned box whose left/top/width/height
// and scale are set per phase and transitioned on the house curve, so a
// scrub backwards runs every move in reverse. A live (unscripted) jam is
// docked from the start and keeps the product's own slide-in.

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { animate } from "motion";
import { JAM_MOVE } from "./jam";

export type JamPhase = "hero" | "deploy" | "docked";

export const PANEL_W = 400;
/** The thread section's height while the panel is still the hero — tabs and
 *  the transcript, no composer. */
export const LOWER_DEPLOYED = 250;
const HERO_SCALE = 1.2;
/** The entrance: 2rem below the seat, a touch small, transparent. */
const ENTER_RISE = 32;
const ENTER_SCALE = 0.92;
/** The arrival spring (damping ratio ~0.55): it lands, overshoots a hair, settles. */
const ENTER_SPRING = { type: "spring" as const, stiffness: 240, damping: 17, mass: 1 };
/** The arrival is quicker than the panel's other moves: the press should feel like it opened the call. */
const ENTER_MOVE = "420ms cubic-bezier(0.2, 0, 0, 1)";
/** The sky. The photo at public/ando-stage/sky.jpg when it is there; under
 *  it, a gradient in the photo's own blues with a little grain, so the shot
 *  reads the same before the file lands. */
const HERO_GROUND = "url(/ando-stage/sky.jpg) no-repeat";
/** The sky image's own size (public/ando-stage/sky.jpg), for lining the overlay up with the canvas's cover-fit copy. */
const SKY = { w: 2048, h: 1558 };
const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>\")";

type Rect = { left: number; top: number; width: number; height: number };

const MOVE = `left ${JAM_MOVE}, top ${JAM_MOVE}, width ${JAM_MOVE}, height ${JAM_MOVE}, transform ${JAM_MOVE}, opacity ${JAM_MOVE}, border-radius ${JAM_MOVE}, box-shadow ${JAM_MOVE}`;

/** Where the lower section sits for a phase; the stage passes it into the panel. */
export function lowerHeightFor(phase: JamPhase, rowH: number, stageH: number) {
  if (phase === "hero") return 0;
  if (phase === "deploy") return LOWER_DEPLOYED;
  return Math.max(0, rowH - stageH);
}

export function JamStage({ phase, row, children }: { phase: JamPhase; row: RefObject<HTMLDivElement | null>; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [stageH, setStageH] = useState(0);

  useLayoutEffect(() => {
    const el = row.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [row]);

  useLayoutEffect(() => {
    const stage = boxRef.current?.querySelector<HTMLElement>("[data-jam-stage]");
    if (stage) setStageH(stage.offsetHeight);
  }, []);

  // Mounting as the hero: the call arrives in place — from 2rem below its
  // seat, at 0.95, transparent — and settles up into it. Painted one frame
  // early straight on the element (the values React would render next), so
  // the transition has a start and no extra render is needed.
  const innerRef = useRef<HTMLDivElement>(null);
  const startedAsHero = useRef(phase !== "docked");
  const latest = useRef<{ rect: Rect; scale: number } | null>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!startedAsHero.current) return;
    const box = boxRef.current;
    const rowEl = row.current;
    if (!box || !rowEl) return;
    // The sky arrives with the call, not a frame before it.
    const sky = skyRef.current;
    if (sky) { sky.style.transition = "none"; sky.style.opacity = "0"; }
    // The seat, measured here and now: the row has not been measured into
    // state yet on this first frame, and a box left on that zero-size
    // guess would transition in from the top-left corner.
    const w = rowEl.clientWidth;
    const h = rowEl.clientHeight;
    const stage = box.querySelector<HTMLElement>("[data-jam-stage]")?.offsetHeight ?? 0;
    const heroScale = Math.min(HERO_SCALE, Math.max(1, (h - 48) / Math.max(1, stage)));
    box.style.transition = "none";
    box.style.left = `${(w - PANEL_W) / 2}px`;
    box.style.top = `${(h - stage) / 2}px`;
    box.style.width = `${PANEL_W}px`;
    box.style.height = `${stage}px`;
    box.style.opacity = "0";
    box.style.transform = `translateY(${ENTER_RISE}px) scale(${heroScale * ENTER_SCALE})`;
    void box.offsetWidth;
    let spring: { stop: () => void } | null = null;
    const raf = requestAnimationFrame(() => {
      if (sky) { sky.style.transition = `opacity ${ENTER_MOVE}`; sky.style.opacity = "1"; }
      // The rise and the scale ride one spring, so the panel lands with a
      // little give — past its seat and back — instead of easing to a stop.
      // The fade stays on the sky's curve so the two arrive as one (and the
      // first-frame re-seat, once the row is measured, happens unseen).
      box.style.transition = `opacity ${ENTER_MOVE}`;
      box.style.opacity = "1";
      spring = animate(0, 1, {
        ...ENTER_SPRING,
        onUpdate: (p) => {
          const target = latest.current?.scale ?? heroScale;
          box.style.transform = `translateY(${ENTER_RISE * (1 - p)}px) scale(${target * (ENTER_SCALE + (1 - ENTER_SCALE) * p)})`;
        },
        onComplete: () => { box.style.transition = MOVE; },
      });
    });
    return () => { cancelAnimationFrame(raf); spring?.stop(); };
  }, [row]);

  const floating = phase !== "docked";
  // While the call floats, the window dissolves into the canvas's sky: no
  // shadow, no edge — and the sky drawn inside the window is the canvas's
  // own, pixel for pixel, so there is no seam at the window's bounds.
  useLayoutEffect(() => {
    const win = document.querySelector<HTMLElement>("[data-stage-window]");
    if (!win) return;
    win.style.transition = `box-shadow ${JAM_MOVE}`;
    win.style.boxShadow = floating ? "none" : "0 24px 64px rgba(15,17,19,0.22), 0 0 0 1px rgba(15,17,19,0.06)";
  }, [floating]);
  useLayoutEffect(() => {
    const sky = skyRef.current;
    const canvas = document.querySelector<HTMLElement>("[data-stage-canvas]");
    const win = document.querySelector<HTMLElement>("[data-stage-window]");
    if (!sky || !canvas || !win) return;
    const align = () => {
      const c = canvas.getBoundingClientRect();
      const w = win.getBoundingClientRect();
      // object-fit: cover, centred — what the canvas's <img> draws.
      const scale = Math.max(c.width / SKY.w, c.height / SKY.h);
      const drawnW = SKY.w * scale;
      const drawnH = SKY.h * scale;
      const x = c.left + (c.width - drawnW) / 2 - w.left;
      const y = c.top + (c.height - drawnH) / 2 - w.top;
      sky.style.backgroundSize = `${drawnW}px ${drawnH}px`;
      sky.style.backgroundPosition = `${x}px ${y}px`;
    };
    align();
    const ro = new ResizeObserver(align);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);
  const lowerH = lowerHeightFor(phase, size.h, stageH);
  const panelH = phase === "docked" ? size.h : stageH + lowerH;
  // The hero scale, backed off when a deployed panel would not fit the row.
  const scale = floating ? Math.min(HERO_SCALE, Math.max(1, (size.h - 48) / Math.max(1, panelH))) : 1;
  const rect: Rect = floating
    ? { left: (size.w - PANEL_W) / 2, top: (size.h - panelH) / 2, width: PANEL_W, height: panelH }
    : { left: size.w - PANEL_W, top: 0, width: PANEL_W, height: size.h };
  const ready = size.w > 0 && stageH > 0;
  // The first placement is a seat, not a move: the box lands where it
  // belongs on the frame the row is measured, and only from the next frame
  // do its moves transition — a docked (live) panel would otherwise travel
  // in from the unmeasured guess at the row's far left.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!ready || settled) return;
    const raf = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(raf);
  }, [ready, settled]);
  useLayoutEffect(() => {
    latest.current = { rect, scale };
  });

  return (
    <>
      {/* The ground while the call is the hero: the world's daytime sky (affiliate/mini-world.tsx), flat, covering the whole room — `fixed` inside the camera's transform resolves against the camera, so the top bar goes under too. */}
      <div
        ref={skyRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: HERO_GROUND, opacity: floating ? 1 : 0, transition: `opacity ${floating ? ENTER_MOVE : JAM_MOVE}` }}
      >
        {/* Plain grain, no blend mode: a blend over the whole room is recomposited every frame the box animates. */}
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: 0.07 }} />
      </div>
      <div
        ref={boxRef}
        className="absolute z-20 overflow-hidden"
        style={{
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          transform: `translateY(0px) scale(${scale})`,
          transformOrigin: "50% 50%",
          borderRadius: floating ? 12 : 0,
          boxShadow: floating ? "0 16px 32px rgba(26,24,23,0.22), 0 0 0 1px rgba(26,24,23,0.08)" : "none",
          opacity: ready ? 1 : 0,
          transition: ready && settled ? MOVE : "none",
        }}
      >
        {/* The panel's own width is the column's; it fades in as the card becomes it. */}
        <div ref={innerRef} className="h-full" style={{ width: PANEL_W, opacity: 1, transition: "opacity 320ms cubic-bezier(0.2, 0, 0, 1)" }}>
          {children}
        </div>
      </div>
    </>
  );
}
