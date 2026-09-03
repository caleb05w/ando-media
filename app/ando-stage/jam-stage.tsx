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

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { JAM_MOVE } from "./jam";

export type JamPhase = "hero" | "deploy" | "docked";

export const PANEL_W = 400;
/** The thread section's height while the panel is still the hero — tabs and
 *  the transcript, no composer. */
export const LOWER_DEPLOYED = 250;
const HERO_SCALE = 1.2;
/** The entrance: 2rem below the seat, a touch small, transparent. */
const ENTER_RISE = 32;
const ENTER_SCALE = 0.95;
/** The light end of the world's sky. */
const HERO_GROUND = "#dcecfe";

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
  useLayoutEffect(() => {
    if (!startedAsHero.current) return;
    const box = boxRef.current;
    if (!box) return;
    const start = latest.current;
    box.style.transition = "none";
    box.style.opacity = "0";
    box.style.transform = `translateY(${ENTER_RISE}px) scale(${(start?.scale ?? 1) * ENTER_SCALE})`;
    void box.offsetWidth;
    const raf = requestAnimationFrame(() => {
      const now = latest.current;
      if (!now) return;
      box.style.transition = MOVE;
      box.style.opacity = "1";
      box.style.transform = `translateY(0px) scale(${now.scale})`;
    });
    return () => cancelAnimationFrame(raf);
  }, [row]);

  const floating = phase !== "docked";
  const lowerH = lowerHeightFor(phase, size.h, stageH);
  const panelH = phase === "docked" ? size.h : stageH + lowerH;
  // The hero scale, backed off when a deployed panel would not fit the row.
  const scale = floating ? Math.min(HERO_SCALE, Math.max(1, (size.h - 48) / Math.max(1, panelH))) : 1;
  const rect: Rect = floating
    ? { left: (size.w - PANEL_W) / 2, top: (size.h - panelH) / 2, width: PANEL_W, height: panelH }
    : { left: size.w - PANEL_W, top: 0, width: PANEL_W, height: size.h };
  const ready = size.w > 0 && stageH > 0;
  useLayoutEffect(() => {
    latest.current = { rect, scale };
  });

  return (
    <>
      {/* The ground while the call is the hero: the world's daytime sky (affiliate/mini-world.tsx), flat, covering the whole room — `fixed` inside the camera's transform resolves against the camera, so the top bar goes under too. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-10"
        style={{ background: HERO_GROUND, opacity: floating ? 1 : 0, transition: `opacity ${JAM_MOVE}` }}
      />
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
          boxShadow: floating ? "0 24px 64px rgba(26,24,23,0.28), 0 0 0 1px rgba(26,24,23,0.08)" : "none",
          opacity: ready ? 1 : 0,
          transition: ready ? MOVE : "none",
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
