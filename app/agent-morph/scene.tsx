"use client";

// The scene is the driver: one rAF loop, one virtual clock `vt`, and every
// visual value a pure function of it — so the studio can run time
// backwards, hold it still, and jump it. The agent's position and fades
// and the label are written straight to the DOM each frame; the only
// React state is discrete — which frame the indicator shows, whose name
// is under it.
//
// What it is: /context-stream's agent, on its own, changing face in the
// typing indicator's own language (app/agent-typing-experience). The
// marks are never broken up, and a change of face is quick — the
// library's morphs at their own speed round one wave of typing, about
// two seconds end to end (a tempo can speed the morphs, off by default):
//
//   leave    the mark's own arrival plays backwards — the face spins out,
//            the disc shrinks to the resting dot, the side dots fly back
//            to their places — or it melts (the library's reset: the face
//            snuffs out, the disc shrinks, no side dots);
//   typing   the three dots wave, for whole waves;
//   arrive   the dots gather into the next mark by its own morph, turning
//            the mark's colour on the way (the library's host tint).
//
// `via` picks whether the side dots take part or the disc's track goes
// alone through one dot. The agent is born as the typing dots (the film's
// birth) or as that lone dot.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Hooks } from "../../lib/timeline-studio/studio";
import { Stage } from "../agent-typing-experience/stage";
import { RESET_MS, WAVE_MS, resetFrame, typingFrame, type Frame } from "../agent-typing-experience/variants";
import { FACES, INKS, NAMES, arriveMsFor, leaveMsFor, type FaceKey, type Settings } from "./settings";
import type { Timing } from "./timing";
import "./agent-morph.css";

/* ── The stage, in design pixels; the page scales it to fit. ───────── */
export const STAGE = { w: 1280, h: 800 } as const;
/** Room the studio's pill needs below the stage. */
const STUDIO_CLEARANCE = 72;
/** Where the agent sits. */
const AGENT = { x: STAGE.w / 2, y: STAGE.h / 2 - 24 } as const;
/** The agent is one of /the-library's typing indicators drawn at twice the
 *  shelf's 120px — the film's size. */
export const INDICATOR_PX = 240;
/** Every arrival lands on the library's 9.6-unit disc. */
const AGENT_R = 9.6 * (INDICATOR_PX / 60);
/** The side dots come in over their first beat — the library's own rule
 *  (cycleFrame) — at the birth, and after a melt when they take part. */
const SIDE_IN_MS = 250;
/** The lone dot: the library's reset, finished — one resting dot, no
 *  satellites. What every change of face goes through. */
const DOT: Frame = resetFrame(RESET_MS);
/** How far into an arrival the dot is the mark's colour: the library's
 *  host tint — on the move by 8% of the morph, fully the colour by 35%. */
const TINT = { from: 0.08, span: 0.27 } as const;
/** The melt's disc lightens to the resting grey over this long (resetFrame). */
const MELT_GREY_MS = 300;

/* ── Curves ─────────────────────────────────────────────────────────── */
const clamp01 = (p: number) => Math.min(1, Math.max(0, p));
/** The house ease. */
const ease = (p: number) => 1 - Math.pow(1 - clamp01(p), 2.2);
/** 0→1 over `dur` seconds from `from`. */
const seg = (vt: number, from: number, dur: number) => clamp01((vt - from) / Math.max(0.001, dur));
const noop = () => {};

/* ── Colour ─────────────────────────────────────────────────────────── */
type Ink = readonly number[];
const parseRgb = (fill: string): number[] => (fill.match(/\d+/g) ?? []).map(Number);
const rgb = (c: Ink) => `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`;
const mix = (a: Ink, b: Ink, p: number) => a.map((v, i) => v + (b[i] - v) * p);
/** The frame with its dots and disc turned `p` of the way to `ink`. */
function tinted(f: Frame, ink: Ink, p: number): Frame {
  if (p <= 0) return f;
  const tint = (fill: string) => rgb(mix(parseRgb(fill), ink, p));
  return { ...f, sats: f.sats.map((d) => ({ ...d, fill: tint(d.fill) })), blob: { ...f.blob, fill: tint(f.blob.fill) } };
}
/** A mark's ink: the mean of its opaque pixels, read at the size it shows. */
function sampleInk(img: HTMLImageElement): Ink | null {
  const size = 120;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.drawImage(img, 0, 0, size, size);
  const data = g.getImageData(0, 0, size, size).data;
  const sum = [0, 0, 0];
  let n = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      if (data[i + 3] < 120) continue;
      // Only what shows: the Stage clips the image to the disc.
      const dx = x / size - 0.5;
      const dy = y / size - 0.5;
      if (dx * dx + dy * dy > 0.25) continue;
      sum[0] += data[i];
      sum[1] += data[i + 1];
      sum[2] += data[i + 2];
      n += 1;
    }
  }
  return n === 0 ? null : sum.map((v) => v / n);
}

/* ── The plan: who the agent becomes, and when ──────────────────────── */
type Swap = { prev: FaceKey; face: FaceKey; leaveAt: number; leaveEnd: number; arriveAt: number; landAt: number };
type Plan = { birth: { at: number; landAt: number }; swaps: Swap[] };
export function planFor(T: Timing, S: Settings): Plan {
  const arrive = (face: FaceKey) => arriveMsFor(S, face) / 1000;
  const swap = (prev: FaceKey, face: FaceKey, at: number, gap: number): Swap => {
    const leaveEnd = at + leaveMsFor(S, prev) / 1000;
    const arriveAt = leaveEnd + gap;
    return { prev, face, leaveAt: at, leaveEnd, arriveAt, landAt: arriveAt + arrive(face) };
  };
  return {
    birth: { at: T.grok, landAt: T.grok + arrive("grok") },
    swaps: [swap("grok", "claude", T.claude, T.claudeGap), swap("claude", "codex", T.codex, T.codexGap)],
  };
}
/** The typing wave's clock, phased so phase 0 falls on `anchor` — where
 *  the next morph starts (every morph's first frame is the wave's at
 *  phase 0). The studio keeps the typing between faces to whole waves, so
 *  a reversed morph hands over on phase 0 as well. */
const waveMs = (anchor: number, vt: number) => (((vt - anchor) * 1000) % WAVE_MS) + WAVE_MS;
/** A morph's frame with its satellites left out: the disc's track alone,
 *  from the lone dot to the mark. Ghost trails go with them. */
const solo = (f: Frame): Frame => ({ ...f, sats: [] });

type Phase = "off" | "wave" | "dot" | "arrive" | "rest" | "leave";
type Look = { frame: Frame; face: FaceKey; phase: Phase };
/** The frame's side dots faded to `o`. */
const sideDots = (f: Frame, o: number): Frame => (o >= 1 ? f : { ...f, sats: f.sats.map((d) => ({ ...d, o: d.o * o })) });
/** The agent at `vt`, by the plan. `ink` is each mark's colour. `ms` is
 *  always the library's own clock: the plan's seconds times the tempo. */
function agentAt(vt: number, T: Timing, S: Settings, P: Plan, ink: (face: FaceKey) => Ink): Look {
  const withSides = S.via === "dots";
  /** How far into `face`'s morph the dots are its colour. */
  const tintP = (face: FaceKey, t: number) => (S.tint ? clamp01((t / S.arrive[face].morphMs - TINT.from) / TINT.span) : 0);
  /** `face` at rest: its own morph's landed frame. */
  const landed = (face: FaceKey): Look => ({ frame: solo(S.arrive[face].morph(S.arrive[face].morphMs)), face, phase: "rest" });
  /** After a melt the side dots are gone; when they take part they come
   *  back in over their first beat, on the library's clock. */
  const sideIn = (sinceLeaveEnd: number) => (withSides && S.leave === "melt" ? clamp01((sinceLeaveEnd * 1000 * S.tempo) / SIDE_IN_MS) : 1);
  /** The arrival, `ms` in, as `face` — by its own morph. With the side
   *  dots when they take part (and always at the typing birth); the
   *  disc's track alone otherwise. */
  const arriving = (ms: number, face: FaceKey, sinceLeaveEnd: number, full = withSides): Look => {
    const f = tinted(S.arrive[face].morph(ms), ink(face), tintP(face, ms));
    return { frame: full ? sideDots(f, sideIn(sinceLeaveEnd)) : solo(f), face, phase: "arrive" };
  };
  /** The leave, `ms` in, from `face`: into the dots. */
  const leaving = (ms: number, face: FaceKey): Look => {
    if (S.leave === "reverse") {
      const V = S.arrive[face];
      const f = tinted(V.morph(V.morphMs - ms), ink(face), tintP(face, V.morphMs - ms));
      return { frame: withSides ? f : solo(f), face, phase: "leave" };
    }
    // The melt: the disc shows in the mark's colour as the face snuffs out,
    // and greys as it shrinks — the library's reset, in the mark's ink.
    const f = resetFrame(ms);
    return { frame: S.tint ? tinted(f, ink(face), clamp01(1 - ms / MELT_GREY_MS)) : f, face, phase: "leave" };
  };
  /** Between the leave and the arrival: the three dots typing — the wave
   *  phased to end where the next morph begins, at `arriveAt` — or the
   *  lone dot, holding. */
  const between = (face: FaceKey, sinceLeaveEnd: number, arriveAt: number): Look =>
    withSides ? { frame: sideDots(typingFrame(waveMs(arriveAt, vt), 1), sideIn(sinceLeaveEnd)), face, phase: "wave" } : { frame: DOT, face, phase: "dot" };
  if (vt < T.agent) return { frame: typingFrame(0, 0), face: "grok", phase: "off" };
  if (vt < P.birth.at) {
    if (S.start === "dot") return { frame: DOT, face: "grok", phase: "dot" };
    // The typing dots; the side dots fade in over their first beat.
    return { frame: typingFrame(waveMs(P.birth.at, vt), clamp01(((vt - T.agent) * 1000) / SIDE_IN_MS)), face: "grok", phase: "wave" };
  }
  if (vt < P.birth.landAt) return arriving((vt - P.birth.at) * 1000 * S.tempo, "grok", Infinity, S.start === "typing");
  for (const s of P.swaps) {
    if (vt < s.leaveAt) return landed(s.prev);
    if (vt < s.leaveEnd) return leaving((vt - s.leaveAt) * 1000 * S.tempo, s.prev);
    if (vt < s.arriveAt) return between(s.prev, vt - s.leaveEnd, s.arriveAt);
    if (vt < s.landAt) return arriving((vt - s.arriveAt) * 1000 * S.tempo, s.face, vt - s.leaveEnd);
  }
  return landed(P.swaps[P.swaps.length - 1].face);
}
/** The faces are marks, not portraits: no disc under them. The disc fades
 *  out as the face fades in, and back as it goes — the library's frame,
 *  with its disc's ink made to follow the face. Its satellites go with
 *  the disc: the library parks them under it at rest, and a mark with a
 *  gap in it would show them. */
function bare(look: Look): Look {
  const a = Math.max(0, 1 - look.frame.avatarO);
  const fill = look.frame.blob.fill.replace(/^rgb\((.*)\)$/, `rgba($1, ${a})`);
  const sats = look.frame.sats.map((dot) => ({ ...dot, o: dot.o * a }));
  return { ...look, frame: { ...look.frame, sats, blob: { ...look.frame.blob, fill } } };
}

export function AgentMorphScene({ timing, settings, hooks, onReplay }: { timing: Timing; settings: Settings; hooks: Hooks; onReplay: () => void }) {
  // Timing and settings ride in refs so a drag or a pick re-times the
  // frame without restarting the clock; a replay (key bump) is the only
  // thing that resets `vt`.
  const timingRef = useRef(timing);
  const settingsRef = useRef(settings);
  useLayoutEffect(() => {
    timingRef.current = timing;
    settingsRef.current = settings;
  }, [timing, settings]);

  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min((window.innerWidth - 40) / STAGE.w, (window.innerHeight - STUDIO_CLEARANCE - 40) / STAGE.h, 1.5));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const [indicator, setIndicator] = useState<Look | null>(null);
  const [label, setLabel] = useState<FaceKey>("grok");

  const indicatorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  /** Each mark's ink, read once its image has loaded — and decoded up
   *  front, so no face paints its first frame with a hitch. */
  const inksRef = useRef<Partial<Record<FaceKey, Ink>>>({});
  useEffect(() => {
    for (const face of Object.keys(FACES) as FaceKey[]) {
      const img = new Image();
      img.onload = () => {
        const ink = sampleInk(img);
        if (ink) inksRef.current[face] = ink;
      };
      img.src = FACES[face];
      img.decode().catch(noop);
    }
  }, []);

  useEffect(() => {
    let vt = 0;
    let last = performance.now();
    let raf = 0;
    let indicatorShown: string | null = null;
    let labelShown: FaceKey = "grok";
    const ink = (face: FaceKey): Ink => inksRef.current[face] ?? INKS[face];

    const paint = (T: Timing, S: Settings) => {
      const indicatorEl = indicatorRef.current;
      const labelEl = labelRef.current;
      if (!indicatorEl || !labelEl) return;
      const P = planFor(T, S);
      const look = agentAt(vt, T, S, P, ink);

      /* ── The agent ─────────────────────────────────────────────── */
      // In over the first beat of the dots; from there the frames do it all.
      indicatorEl.style.left = `${AGENT.x - INDICATOR_PX / 2}px`;
      indicatorEl.style.top = `${AGENT.y - INDICATOR_PX / 2}px`;
      indicatorEl.style.opacity = `${ease(seg(vt, T.agent, 0.3))}`;

      /* ── The label ─────────────────────────────────────────────── */
      // The name under the agent: out as the mark starts to leave, in as
      // the next one lands.
      let labelO = ease(seg(vt, P.birth.landAt - 0.25, 0.35));
      let labelNow: FaceKey = "grok";
      for (const s of P.swaps) {
        if (vt < s.leaveAt) break;
        labelNow = vt < s.arriveAt ? s.prev : s.face;
        labelO = (1 - ease(seg(vt, s.leaveAt, 0.25))) + ease(seg(vt, s.landAt - 0.25, 0.35));
      }
      labelEl.style.opacity = `${clamp01(labelO)}`;
      labelEl.style.transform = `translate(-50%, ${4 * (1 - clamp01(labelO))}px)`;
      labelEl.style.color = rgb(ink(labelNow));
      if (labelNow !== labelShown) {
        labelShown = labelNow;
        setLabel(labelNow);
      }

      /* ── The discrete state ────────────────────────────────────── */
      // The agent's frame: the wave, a leave and an arrival are runs of
      // ticks at 60 a second — the film's own rate; a face at rest, or the
      // dot holding, is one tick.
      // (A hold with the side dots still coming in is a short run, not a still.)
      const still = look.phase === "rest" || (look.phase === "dot" && look.frame.sats.every((d) => d.o >= 1 || d.o === 0));
      const key = look.phase === "off" ? null : still ? `${look.phase}:${look.face}` : `${look.phase}:${look.face}:${Math.floor(vt * 60)}`;
      if (key !== indicatorShown) {
        indicatorShown = key;
        setIndicator(key == null ? null : bare(look));
      }
    };

    const frame = (now: number) => {
      const T = timingRef.current;
      const speed = hooks.pausedRef.current ? 0 : hooks.speedRef.current;
      // dt clamped: a throttled tab must slow, never leap.
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (hooks.seekRef.current != null) {
        vt = Math.max(0, hooks.seekRef.current);
        hooks.seekRef.current = null;
      } else {
        vt = Math.min(T.end, vt + dt * speed);
      }
      hooks.onTick(vt);
      paint(T, settingsRef.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [hooks]);

  return (
    <div className="am-stage relative w-screen overflow-hidden bg-white text-ando-fg-primary" style={{ height: `calc(100dvh - ${STUDIO_CLEARANCE}px)` }}>
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden"
        style={{ width: STAGE.w, height: STAGE.h, transform: `translate(-50%, -50%) scale(${scale})` }}
        onClick={onReplay}
        role="presentation"
      >
        {/* The agent: /the-library's typing indicator as its shelf renders it, wearing each mark in turn. */}
        <div ref={indicatorRef} data-am="indicator" className="absolute" style={{ opacity: 0, width: INDICATOR_PX, height: INDICATOR_PX, transformOrigin: "50% 50%" }}>
          {indicator ? <Stage frame={indicator.frame} size={INDICATOR_PX} avatarSrc={FACES[indicator.face]} /> : null}
        </div>

        {/* Whose face it is, beneath. */}
        <div ref={labelRef} data-am="label" className="absolute left-1/2 whitespace-nowrap" style={{ top: AGENT.y + AGENT_R + 40, opacity: 0, fontSize: 30, letterSpacing: -0.4, transform: "translate(-50%, 0)" }}>
          {NAMES[label]}
        </div>
      </div>
    </div>
  );
}
