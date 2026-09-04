"use client";

// The cut's two full-frame cards and its camera — pure functions of the
// clock (what is on at `vt`) plus the components that render them. The
// stage's driver writes the per-frame motion (each word's arrival, the
// mark's bounce, the camera's pose) straight to the DOM; see page.tsx.

import { useEffect, useState, type RefObject } from "react";
import { LOGO_H, LOGO_PARTS } from "../context-stream/logo";
import { ContextTrace } from "../the-library/context-trace";
import { beatKey, type Actor, type CameraAnchor, type Scene, type Timing } from "./scenes";

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
  if (at.startsWith("dm:")) return `[data-sidebar-dm="${at.slice(3)}"]`;
  return "[data-stage-main]";
}

/* ── The context card ───────────────────────────────────────────────── */

/** How long a card takes to leave after its hold: the line lifts and the white fades, so whatever is arriving underneath crossfades through it. */
export const TYPE_EXIT = 0.6;
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

/* ── The auto camera — Screen Studio's zoom ──────────────────────────
   No camera beats needed: a cursor beat marked `zoom` pulls the frame in
   around its target as the cursor sets off — 1.6× (or the beat's own
   scale) over 0.9s on an ease-in-out, so the frame and the hand arrive
   together — holds, pans to the next zooming press on the same ease, and
   eases back out 1.5s after the press. Clamped by the driver so the frame
   never shows past the room's edge. */
export const AUTO_ZOOM = 1.6;
export const AUTO_IN = 0.9;
export const AUTO_HOLD = 1.2;
export const AUTO_OUT = 0.9;
/** The cursor's glide before it presses (page.tsx pointerAt). */
const PRESS_GLIDE = 0.9;

export type Press = { t: number; at: CameraAnchor; zoom: number };

/** Every zooming press in the scene, in order, with the second it lands. */
export function pressesOf(scene: Scene, T: Timing): Press[] {
  const out: Press[] = [];
  scene.beats.forEach((beat, index) => {
    if (beat.kind === "cursor" && beat.press && beat.zoom) out.push({ t: T[beatKey(index)], at: beat.to, zoom: beat.zoom === true ? AUTO_ZOOM : beat.zoom });
  });
  return out;
}

/** Scale and where to look at `vt`, given each press's live target. The
 *  centre and scale carry over from whatever the previous press left, so
 *  a press during a zoom pans instead of restarting. */
export function autoPoseAt(presses: Press[], vt: number, resolve: (at: CameraAnchor) => { x: number; y: number }, fallback: { x: number; y: number }): { s: number; c: { x: number; y: number } } {
  let s = 1;
  let c = fallback;
  for (const press of presses) {
    if (press.t > vt) break;
    const base = { s, c };
    const target = resolve(press.at);
    const zoomIn = easeInOut(seg(vt, press.t, AUTO_IN));
    const zoomOut = easeInOut(seg(vt, press.t + PRESS_GLIDE + AUTO_HOLD, AUTO_OUT));
    // Where the previous zoom stood when this press landed, not now.
    s = (base.s + (press.zoom - base.s) * zoomIn) * (1 - zoomOut) + 1 * zoomOut;
    c = { x: base.c.x + (target.x - base.c.x) * zoomIn, y: base.c.y + (target.y - base.c.y) * zoomIn };
  }
  return { s, c };
}

/* ── The type card ──────────────────────────────────────────────────── */

/** Seconds between one word's arrival and the next. */
export const WORD_CADENCE = 0.15;
/** How long a word takes to land. */
export const WORD_LAND = 0.42;

export type TypeCardOn = { key: string; /** Each line's words. */ lines: string[][]; /** When each line starts, from the card's own zero. */ starts: number[]; /** When each line begins to leave. */ ends: number[]; t: number; /** The whole card's hold: the last line's end. */ hold: number; faces: Array<{ actor: Actor; on: number }> };
/** How long a line takes to lift and blur away once its hold is up. */
export const LINE_EXIT = 0.5;
/** Seconds for a line's words to finish arriving. */
export const lineArrive = (words: number) => (words - 1) * WORD_CADENCE + WORD_LAND;
/** A face pops in with the word it is keyed to, over this long. */
export const FACE_LAND = 0.55;

export function typeCardAt(scene: Scene, T: Timing, vt: number): TypeCardOn | null {
  for (let index = 0; index < scene.beats.length; index += 1) {
    const beat = scene.beats[index];
    if (beat.kind !== "type") continue;
    const t = T[beatKey(index)];
    const lines = [beat.text, ...(beat.lines ?? [])].map((line) => line.split(" "));
    const starts: number[] = [];
    const ends: number[] = [];
    let at = 0;
    lines.forEach((words, i) => {
      starts.push(at);
      const last = i === lines.length - 1;
      at += lineArrive(words.length) + (last ? beat.hold : beat.lineHold ?? 1.3);
      ends.push(at);
    });
    const hold = at;
    if (vt < t || vt > t + hold + TYPE_EXIT) continue;
    return { key: beatKey(index), lines, starts, ends, t, hold, faces: (beat.faces ?? []).map((face) => ({ actor: scene.cast[face.who], on: face.on })) };
  }
  return null;
}

/** The type card `local` seconds in: each word rises out of a blur into
 *  its place on its own time, lines lift away above the next once held,
 *  and the card as a whole leaves after its last line's hold — unless it
 *  is the closer, which holds its white and its line for the logo to cut
 *  in over. Writes the TypeCard's spans; the stage's films and
 *  /context-stream call it per frame. */
export function driveTypeCard(tc: TypeCardOn, local: number, closer: boolean) {
  const lines = Array.from(document.querySelectorAll<HTMLElement>("[data-type-line]"));
  if (lines.length === 0) return;
  // Each face pops in with the word (of the first line) it is keyed to.
  const faces = Array.from(document.querySelectorAll<HTMLElement>("[data-type-faces] [data-face]"));
  const seen = new Map<number, number>();
  faces.forEach((face) => {
    const on = Number(face.dataset.on ?? 0);
    // Faces keyed to one word arrive in a run, 70ms apart.
    const nth = seen.get(on) ?? 0;
    seen.set(on, nth + 1);
    const p = seg(local, on * WORD_CADENCE + nth * 0.07, FACE_LAND);
    face.style.opacity = `${Math.min(1, p * 3)}`;
    face.style.transform = `translateY(${10 * (1 - ease(p))}px) scale(${0.6 + 0.4 * backOut(p)})`;
  });
  // The card as a whole lifts away after its last line's hold.
  const exit = closer ? 0 : easeInOut(seg(local, tc.hold, TYPE_EXIT));
  lines.forEach((line, li) => {
    const start = tc.starts[li];
    const words = Array.from(line.querySelectorAll<HTMLElement>("[data-word]"));
    // The line sits centred at its full width from the start; each word
    // rises out of a blur into its place (no sideways slide, and the line
    // never re-centres as words arrive — that stepped).
    words.forEach((word, i) => {
      const p = ease(seg(local, start + i * WORD_CADENCE, WORD_LAND));
      word.style.opacity = `${p}`;
      word.style.transform = `translateY(${(1 - p) * 16}px) scale(${1.03 - 0.03 * p})`;
      word.style.filter = `blur(${(1 - p) * 8}px)`;
    });
    // The whole line settles up into its seat with its first word.
    const settle = ease(seg(local, start, WORD_LAND + 0.2));
    // A line that has had its hold lifts and blurs away above the next; the
    // last line leaves with the card. The lift eases both ways.
    const last = li === lines.length - 1;
    // The last line leaves first — up and out of focus, the mirror of how
    // words arrive — in the first 60% of the exit, so the words are gone
    // before the wash has thinned enough to show the UI.
    const gone = last ? (closer ? 0 : ease(seg(local, tc.hold, TYPE_EXIT * 0.6))) : easeInOut(seg(local, tc.ends[li], LINE_EXIT));
    // Only one ghost at a time: a lifted line is gone for good once the line after it leaves too.
    const buried = li + 1 < lines.length - 1 ? easeInOut(seg(local, tc.ends[li + 1], LINE_EXIT)) : li + 1 === lines.length - 1 ? exit : 0;
    const lift = last ? 28 : 110;
    line.style.transform = `translateY(${12 * (1 - settle) - lift * gone}px)${last ? ` scale(${1 + 0.03 * gone})` : ""}`;
    // A lifted line is transparent by the time its top reaches the face
    // stack (28px up, 40% of the lift) — it never passes through the faces.
    line.style.opacity = `${last ? 1 - gone : Math.max(0, 1 - 2.5 * gone) * (1 - buried)}`;
    line.style.filter = `blur(${(last ? 8 : 6) * gone}px)`;
  });
  // The stack stays for every line (only the lines trade places beneath
  // it) and leaves with the card.
  const stack = document.querySelector<HTMLElement>("[data-type-faces]");
  if (stack) {
    stack.style.transform = `translateY(${-28 * exit}px)`;
    stack.style.opacity = `${1 - exit}`;
    stack.style.filter = exit > 0 ? `blur(${8 * exit}px)` : "none";
  }
}

/** White, one line, the words arriving from the right. Word motion is
 *  written per frame by the driver via the `data-word` spans. */
export function TypeCard({ card }: { card: TypeCardOn }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex flex-col items-center justify-center text-[#1a1817]" aria-hidden data-type-card>
      {card.faces.length > 0 ? (
        /* The stack: the product's overlapping faces with a stroke of the ground between them (avatar-group, ring 3px). */
        <div className="mb-7 flex items-center justify-center" data-type-faces>
          {card.faces.map((face, i) => (
            <img
              key={face.actor.name}
              data-face
              data-on={face.on}
              src={face.actor.avatar}
              alt=""
              className={`${face.actor.agent ? "" : "st-face-talking "}size-14 rounded-full will-change-transform ${face.actor.avatar.startsWith("/agents/") ? "object-contain p-1" : "object-cover"}`}
              style={{ marginLeft: i === 0 ? 0 : -14, boxShadow: "0 0 0 3px #ffffff", animationDelay: face.actor.agent ? undefined : `${-i * 1.3}s`, opacity: 0, background: face.actor.avatar.startsWith("/agents/") ? "#efedea" : face.actor.avatar.endsWith(".svg") ? "#fff" : undefined, zIndex: card.faces.length - i }}
            />
          ))}
        </div>
      ) : null}
      {/* Lines stack on one spot: the live one centred, the ones before it lifted and blurred above. */}
      <div className="relative flex items-center justify-center" style={{ height: 60 }}>
        {card.lines.map((words, li) => (
          <div key={li} className="absolute flex whitespace-nowrap will-change-transform" data-type-line data-line={li} style={{ fontSize: 44, lineHeight: 1.1, letterSpacing: "-0.02em", fontWeight: 500, fontFamily: "var(--font-geist-sans), Geist, ui-sans-serif, system-ui, sans-serif" }}>
            {words.map((word, i) => (
              <span key={i} data-word className="inline-block will-change-transform" style={{ marginRight: i < words.length - 1 ? "0.26em" : 0, opacity: 0 }}>{word}</span>
            ))}
          </div>
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

/** The lockup is Ando-Brand 3978-5015: the mark on the LEFT of the wordmark,
 *  centre-aligned — 534×105 in Figma (mark 100×105 at x 0, wordmark 402×104
 *  at x 132), rendered here at this width. Each half is one of the logo's
 *  own paths, so the shapes are exact; the layout is the frame's. */
export const LOCKUP_W = 260;
const FIG = { w: 534.32, h: 105, mark: { x: 0, w: 100.17, h: 105 }, letters: { x: 132.17, y: 0.4, w: 402.15, h: 104.19 } };
const K = LOCKUP_W / FIG.w;
// In the logo's viewBox: letters span x 0–157.7, y 35.8–76.6; the mark x 160.4–208.6, y 0–50.5.
export const LOCKUP = {
  letters: { x: 0, y: 35.7, w: 157.8, h: 41.0, px: FIG.letters.w * K },
  mark: { x: 160.3, y: 0, w: 48.4, h: 50.6, px: FIG.mark.w * K },
};
/** The closing lockup: when each half starts condensing (seconds after the
 *  logo beat), how long the fade takes, how soft it starts, and how far
 *  each half comes in from the left (px). */
export const LOGO_IN = { mark: 0.6, letters: 0.9, fade: 1.1, blur: 16, travel: 56 } as const;
/** The lockup `local` seconds into the logo beat: a beat of white, then it
 *  condenses out of it like a cloud, coming in from the left — the mark
 *  first, the wordmark a beat behind it — each from a soft blur and a touch
 *  small, easing to sharp, still and seated. Then hold. Writes the
 *  LogoCard's halves; the stage's films and /context-stream call it per
 *  frame, so they end the same way. */
export function seatLogo(local: number) {
  const mark = document.querySelector<HTMLElement>("[data-logo-mark]");
  const letters = document.querySelector<HTMLElement>("[data-logo-letters]");
  if (!mark || !letters) return;
  const pm = easeInOut(seg(local, LOGO_IN.mark, LOGO_IN.fade));
  const pl = easeInOut(seg(local, LOGO_IN.letters, LOGO_IN.fade));
  // The travel eases out on its own, longer curve, so each half is still
  // settling into its seat as it sharpens.
  const dm = ease(seg(local, LOGO_IN.mark, LOGO_IN.fade + 0.3));
  const dl = ease(seg(local, LOGO_IN.letters, LOGO_IN.fade + 0.3));
  mark.style.opacity = `${pm}`;
  mark.style.filter = pm < 1 ? `blur(${LOGO_IN.blur * (1 - pm)}px)` : "none";
  mark.style.transform = `translate(${MARK_OFFSET.x - LOGO_IN.travel * (1 - dm)}px, ${MARK_OFFSET.y}px) scale(${0.94 + 0.06 * pm})`;
  letters.style.opacity = `${pl}`;
  letters.style.filter = pl < 1 ? `blur(${LOGO_IN.blur * (1 - pl)}px)` : "none";
  letters.style.transform = `translate(${LETTERS_OFFSET.x - LOGO_IN.travel * (1 - dl)}px, ${LETTERS_OFFSET.y}px) scale(${0.94 + 0.06 * pl})`;
}
/** Each half's centre, offset from the lockup's centre, in px. */
export const MARK_OFFSET = { x: (FIG.mark.x + FIG.mark.w / 2 - FIG.w / 2) * K, y: (FIG.mark.h / 2 - FIG.h / 2) * K };
export const LETTERS_OFFSET = { x: (FIG.letters.x + FIG.letters.w / 2 - FIG.w / 2) * K, y: (FIG.letters.y + FIG.letters.h / 2 - FIG.h / 2) * K };
void LOGO_H;

/** White; the mark (data-logo-mark) and the wordmark (data-logo-letters),
 *  each centred, moved per frame by the driver. */
export function LogoCard() {
  const letters = LOCKUP.letters;
  const mark = LOCKUP.mark;
  return (
    <div className="pointer-events-none fixed inset-0 z-[80] bg-white" aria-hidden data-logo-card>
      <svg data-logo-letters className="absolute left-1/2 top-1/2 will-change-transform" viewBox={`${letters.x} ${letters.y} ${letters.w} ${letters.h}`} width={letters.px} height={(letters.h / letters.w) * letters.px} fill="#1a1817" fillRule="evenodd" style={{ opacity: 0, marginLeft: -letters.px / 2, marginTop: -((letters.h / letters.w) * letters.px) / 2 }}>
        {LOGO_PARTS.slice(0, 4).map((d, i) => <path d={d} key={i} />)}
      </svg>
      <svg data-logo-mark className="absolute left-1/2 top-1/2 will-change-transform" viewBox={`${mark.x} ${mark.y} ${mark.w} ${mark.h}`} width={mark.px} height={(mark.h / mark.w) * mark.px} fill="#1a1817" fillRule="evenodd" style={{ opacity: 0, marginLeft: -mark.px / 2, marginTop: -((mark.h / mark.w) * mark.px) / 2 }}>
        <path d={LOGO_PARTS[4]} />
      </svg>
    </div>
  );
}
