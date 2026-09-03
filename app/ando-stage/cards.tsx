"use client";

// The cut's two full-frame cards and its camera — pure functions of the
// clock (what is on at `vt`) plus the components that render them. The
// stage's driver writes the per-frame motion (each word's arrival, the
// mark's bounce, the camera's pose) straight to the DOM; see page.tsx.

import { useEffect, useState, type RefObject } from "react";
import { LOGO_H, LOGO_PARTS, LOGO_W } from "../context-stream/logo";
import { ContextTrace } from "../the-library/context-trace";
import { beatKey, type CameraAnchor, type Scene, type Timing } from "./scenes";

export const clamp01 = (p: number) => Math.min(1, Math.max(0, p));
export const ease = (p: number) => 1 - Math.pow(1 - clamp01(p), 2.2);
export const easeInOut = (p: number) => { const q = clamp01(p); return q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2; };
export const backOut = (p: number) => { const s = 1.5; const q = clamp01(p) - 1; return q * q * ((s + 1) * q + s) + 1; };
export const seg = (vt: number, from: number, dur: number) => clamp01((vt - from) / Math.max(0.001, dur));

/* ── The camera ─────────────────────────────────────────────────────── */

export type Shot = { index: number; at: CameraAnchor; scale: number; push: number; cut: boolean; t: number; end: number };

/** The shot on at `vt` and the one before it. */
export function shotsAt(scene: Scene, T: Timing, vt: number, total: number): { cur: Shot | null; prev: Shot | null } {
  const shots: Shot[] = [];
  scene.beats.forEach((beat, index) => {
    if (beat.kind !== "camera") return;
    shots.push({ index, at: beat.at, scale: beat.scale, push: beat.push ?? 0, cut: beat.cut === true, t: T[beatKey(index)], end: total });
  });
  for (let i = 0; i + 1 < shots.length; i += 1) shots[i].end = shots[i + 1].t;
  let cur: Shot | null = null;
  let prev: Shot | null = null;
  for (const shot of shots) {
    if (shot.t > vt) break;
    prev = cur;
    cur = shot;
  }
  return { cur, prev };
}

/** A shot's scale at `vt`: its opening scale, pushing in over the shot. */
export function shotScale(shot: Shot, vt: number) {
  return shot.scale + shot.push * easeInOut(seg(vt, shot.t, Math.max(0.3, shot.end - shot.t)));
}

/** Selector for what the camera looks at. */
export function anchorSelector(at: CameraAnchor): string {
  if (at.startsWith("row:")) return `[data-row-id="${at.slice(4)}"]`;
  switch (at) {
    case "composer": return "[data-stage-editor]";
    case "send-button": return "[data-stage-send]";
    case "join-button": return "[data-jam-join]";
    case "jam-button": return '[aria-label="Start Jam"], [aria-label="Open Jam"]';
    case "transcript-tab": return '[data-jam-tab="transcript"]';
    case "hang-up": return '[aria-label="End call"]';
    case "panel": return '[data-agent-surface="jam-panel"]';
    case "jam-transcript": return "[data-jam-transcript], [data-jam-lower]";
    case "room": return "[data-stage-main]";
  }
  return "[data-stage-main]";
}

/* ── The context card ───────────────────────────────────────────────── */

/** How long the type line takes to lift away after its hold. */
export const TYPE_EXIT = 0.45;
export const CONTEXT_FADE_IN = 0.4;
export const CONTEXT_FADE_OUT = 0.5;
/** The trace runs this much faster than the library page, so a 3s hold reaches "Reading today's jam…". */
export const CONTEXT_RATE = 1.7;

export type ContextOn = { key: string; t: number; hold: number };

/** The context beat on at `vt`, through its fade back. */
export function contextAt(scene: Scene, T: Timing, vt: number): ContextOn | null {
  for (let index = 0; index < scene.beats.length; index += 1) {
    const beat = scene.beats[index];
    if (beat.kind !== "context") continue;
    const t = T[beatKey(index)];
    if (vt < t || vt > t + beat.hold + CONTEXT_FADE_OUT) continue;
    return { key: beatKey(index), t, hold: beat.hold };
  }
  return null;
}

/** White; the library's context trace centred, run from its own zero.
 *  It reads the stage clock through `localRef` on its own frame loop, so
 *  the trace re-renders at 30Hz without the room doing the same. */
export function ContextCard({ localRef, hold }: { localRef: RefObject<number>; hold: number }) {
  const [local, setLocal] = useState(0);
  useEffect(() => {
    let raf = 0;
    let shown = -1;
    const tick = () => {
      const coarse = Math.floor((localRef.current ?? 0) * 30) / 30;
      if (coarse !== shown) { shown = coarse; setLocal(coarse); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [localRef]);
  const fadeIn = ease(seg(local, 0, CONTEXT_FADE_IN));
  const fadeOut = ease(seg(local, hold, CONTEXT_FADE_OUT));
  return (
    <div className="pointer-events-none fixed inset-0 z-[81] flex items-center justify-center bg-white" aria-hidden data-context-card style={{ opacity: 1 - fadeOut }}>
      <div className="w-[460px]" style={{ opacity: fadeIn, transform: `translateY(${(1 - fadeIn) * 12}px)` }}>
        <ContextTrace vt={Math.max(0, local * 1000 * CONTEXT_RATE)} open onToggle={() => {}} theme="light" />
      </div>
    </div>
  );
}

/* ── The type card ──────────────────────────────────────────────────── */

/** Seconds between one word's arrival and the next. */
export const WORD_CADENCE = 0.15;
/** How long a word takes to land. */
export const WORD_LAND = 0.42;

export type TypeCardOn = { key: string; words: string[]; t: number; hold: number };

export function typeCardAt(scene: Scene, T: Timing, vt: number): TypeCardOn | null {
  for (let index = 0; index < scene.beats.length; index += 1) {
    const beat = scene.beats[index];
    if (beat.kind !== "type") continue;
    const t = T[beatKey(index)];
    if (vt < t || vt > t + beat.hold + TYPE_EXIT) continue;
    return { key: beatKey(index), words: beat.text.split(" "), t, hold: beat.hold };
  }
  return null;
}

/** White, one line, the words arriving from the right. Word motion is
 *  written per frame by the driver via the `data-word` spans. */
export function TypeCard({ card }: { card: TypeCardOn }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-white text-[#1a1817]" aria-hidden data-type-card>
      <div className="flex whitespace-nowrap will-change-transform" data-type-line style={{ fontSize: 44, lineHeight: 1.1, letterSpacing: "-0.02em", fontWeight: 500 }}>
        {card.words.map((word, i) => (
          <span key={i} data-word className="inline-block will-change-transform" style={{ marginRight: i < card.words.length - 1 ? "0.26em" : 0, opacity: 0 }}>{word}</span>
        ))}
      </div>
    </div>
  );
}

/* ── The logo card ──────────────────────────────────────────────────── */

export function logoAt(scene: Scene, T: Timing, vt: number): number | null {
  for (let index = 0; index < scene.beats.length; index += 1) {
    const beat = scene.beats[index];
    if (beat.kind !== "logo") continue;
    const t = T[beatKey(index)];
    if (vt >= t) return t;
  }
  return null;
}

/** The lockup at this width, and where each half sits relative to its centre. */
export const LOCKUP_W = 260;
const K = LOCKUP_W / LOGO_W;
// Letters span x 0–157.7, y 35.8–76.6; the mark x 160.4–208.6, y 0–50.5 (viewBox units).
export const LOCKUP = {
  letters: { x: 0, y: 35.7, w: 157.8, h: 41.0 },
  mark: { x: 160.3, y: 0, w: 48.4, h: 50.6 },
};
const lockupCx = (LOGO_W / 2) * K;
const lockupCy = (LOGO_H / 2) * K;
/** Each half's centre, offset from the lockup's centre, in px. */
export const MARK_OFFSET = { x: (LOCKUP.mark.x + LOCKUP.mark.w / 2) * K - lockupCx, y: (LOCKUP.mark.y + LOCKUP.mark.h / 2) * K - lockupCy };
export const LETTERS_OFFSET = { x: (LOCKUP.letters.x + LOCKUP.letters.w / 2) * K - lockupCx, y: (LOCKUP.letters.y + LOCKUP.letters.h / 2) * K - lockupCy };

/** White; the mark (data-logo-mark) and the wordmark (data-logo-letters),
 *  each centred, moved per frame by the driver. */
export function LogoCard() {
  const letters = LOCKUP.letters;
  const mark = LOCKUP.mark;
  return (
    <div className="pointer-events-none fixed inset-0 z-[80] bg-white" aria-hidden data-logo-card>
      <svg data-logo-letters className="absolute left-1/2 top-1/2 will-change-transform" viewBox={`${letters.x} ${letters.y} ${letters.w} ${letters.h}`} width={letters.w * K} height={letters.h * K} fill="#1a1817" fillRule="evenodd" style={{ opacity: 0, marginLeft: (-letters.w * K) / 2, marginTop: (-letters.h * K) / 2 }}>
        {LOGO_PARTS.slice(0, 4).map((d, i) => <path d={d} key={i} />)}
      </svg>
      <svg data-logo-mark className="absolute left-1/2 top-1/2 will-change-transform" viewBox={`${mark.x} ${mark.y} ${mark.w} ${mark.h}`} width={mark.w * K} height={mark.h * K} fill="#1a1817" fillRule="evenodd" style={{ opacity: 0, marginLeft: (-mark.w * K) / 2, marginTop: (-mark.h * K) / 2 }}>
        <path d={LOGO_PARTS[4]} />
      </svg>
    </div>
  );
}
