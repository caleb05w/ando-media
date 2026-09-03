"use client";

// The scene is the driver: one rAF loop, one virtual clock `vt`, and every
// visual value a pure function of it — so the studio can run time
// backwards, hold it still, and jump it. Continuous things (the frame, the
// dots, the disc, the sky, the pill's collapse, the composer's slide, every
// fade) are written straight to the DOM each frame; the only React state is
// discrete — the scripted draft, who is typing, the run's phase, the trace's
// coarse clocks, the typing indicator's frame — set when they change.
//
// Layers, bottom to top: the sky · the grey ground · the window (its card,
// then its contents: sidebar, header, transcript, composer) · the trace ·
// the card it collapses into · the canvas (dots, hairline, disc) · the
// agent, travelling · the typing indicator · the titles · the logo.
// Everything but the logo shares one group so the film can leave for it.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Hooks } from "../../lib/timeline-studio/studio";
import { Stage } from "../agent-typing-experience/stage";
import { RESET_MS, VARIANTS, resetFrame, typingFrame, type Frame } from "../agent-typing-experience/variants";
import { Composer, ConversationHeader, Sidebar } from "../ando-stage/chrome";
import { JamHeaderControl } from "../ando-stage/jam";
import { CAST, ME, type Actor, type Scene as Room } from "../ando-stage/scenes";
import { ContextTrace } from "../the-library/context-trace";
import { Logo } from "./logo";
import { AGENT_CARD, AGENT_CARD_FACE_Y, AGENT_X, CARD, CARD_WIDE, DISC_R, LINE_Y, PANE_W, PILL, SEAT, SIDEBAR_W, STAGE, absorbedAt, backOut, clamp01, dotsAt, ease, hairlineAt, lerp, seg } from "./stream";
import type { Timing } from "./timing";
import { AGENT, ASK, ROWS, RowView, tracePhasesFor, type RunPhase } from "./transcript";
import "../ando-stage/stage.css";
import "./context-stream.css";

/** The room the chrome renders: #general, as the storyboard's CleanShot. */
const ROOM: Room = {
  id: "context-stream",
  name: "#general",
  blurb: "",
  surface: { kind: "channel", name: "general", members: 15 },
  cast: CAST,
  beats: [],
};

/** Room the studio's pill needs below the stage. */
const STUDIO_CLEARANCE = 72;
const DOT_INK = "#a3a09c";
/** The disc on white, and the disc on the sky. */
const DISC_INK = [217, 214, 211] as const;
const DISC_SKY = [244, 244, 244] as const;
/** The trace runs the library's timeline at this many ms per film second. */
const TRACE_RATE = 2000;
/** The trace's drawer opens once its first source has arrived (library T). */
const TRACE_OPEN_MS = 1500;
/** The typing strip above the composer — the product's slot, h-9, 3px up. */
const STRIP_H = 36;
/** The library's typing indicator: Orbit v2. Its dots sit at 60 units = the product's 4px dots on a 6px pitch. */
const INDICATOR = VARIANTS.find((v) => v.key === "orbit-v2") ?? VARIANTS[0];
const INDICATOR_BIG = 120;
const INDICATOR_SMALL = 60;
/** How long the face holds before it resets into the dots. */
const FACE_HOLD = 0.5;
const noop = () => {};

/** The indicator's frame `t` seconds into its beat: the face, then the
 *  reset into three dots, then the wave — the library's cycle from its
 *  agent phase on, so it plays backwards from the avatar it just was. */
function indicatorFrame(t: number): Frame {
  if (t < FACE_HOLD) return INDICATOR.morph(INDICATOR.morphMs);
  const reset = (t - FACE_HOLD) * 1000;
  if (reset < RESET_MS) return resetFrame(reset);
  return typingFrame(reset - RESET_MS, 1);
}

/** offsetLeft/Top of `el` summed up to `root` — transform-immune. */
function within(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

export function ContextStreamScene({ timing, hooks, onReplay }: { timing: Timing; hooks: Hooks; onReplay: () => void }) {
  // Timing rides in a ref so a drag re-times the frame without restarting
  // the clock; a replay (key bump) is the only thing that resets `vt`.
  const timingRef = useRef(timing);
  useLayoutEffect(() => {
    timingRef.current = timing;
  }, [timing]);

  // Every face the film will show, decoded up front — the 500px avatars
  // otherwise decode on the frame they first paint, a 100ms hitch in the
  // trace's facepile.
  useEffect(() => {
    const faces = [...new Set([...Object.values(CAST).map((actor) => actor.avatar), AGENT.avatar, "/avatars/jordan.png", "/context-stream/sora.jpg"])];
    for (const src of faces) {
      const img = new Image();
      img.src = src;
      img.decode().catch(noop);
    }
  }, []);

  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min((window.innerWidth - 40) / STAGE.w, (window.innerHeight - STUDIO_CLEARANCE - 40) / STAGE.h, 1.5));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const [scripted, setScripted] = useState<string | null>(null);
  const [runPhase, setRunPhase] = useState<RunPhase>(0);
  const [typing, setTyping] = useState<Actor | null>(null);
  const [traceVt, setTraceVt] = useState(0);
  const [traceMs, setTraceMs] = useState<number | null>(null);
  const [indicator, setIndicator] = useState<Frame | null>(null);

  const skyRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const filmRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const traceRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLImageElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const title1Ref = useRef<HTMLDivElement>(null);
  const title2Ref = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<{ wrap: HTMLDivElement | null; inner: HTMLDivElement | null }>>(ROWS.map(() => ({ wrap: null, inner: null })));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = STAGE.w * dpr;
    canvas.height = STAGE.h * dpr;

    let vt = 0;
    let last = performance.now();
    let raf = 0;
    let draftShown: string | null = null;
    let runShown: RunPhase = 0;
    let typingShown: Actor | null = null;
    let traceVtShown = 0;
    let traceMsShown: number | null = null;
    let indicatorShown: number | null = null;

    const paint = (T: Timing) => {
      const sky = skyRef.current;
      const ground = groundRef.current;
      const film = filmRef.current;
      const card = cardRef.current;
      const content = contentRef.current;
      const sidebar = sidebarRef.current;
      const main = mainRef.current;
      const header = headerRef.current;
      const transcript = transcriptRef.current;
      const composer = composerRef.current;
      const trace = traceRef.current;
      const pill = pillRef.current;
      const cardInner = cardInnerRef.current;
      const float = floatRef.current;
      const indicatorEl = indicatorRef.current;
      if (!sky || !ground || !film || !card || !content || !sidebar || !main || !header || !transcript || !composer || !trace || !pill || !cardInner || !float || !indicatorEl) return;

      /* ── Reads first ───────────────────────────────────────────── */
      // Every layout read the frame needs, taken before its first style
      // write — so the browser lays out once per frame, not once per
      // read-after-write.
      const traceH = trace.offsetHeight;
      const headerH = header.offsetHeight;
      const composerH = composer.offsetHeight; // the box plus its 16px floor
      const rowH = rowRefs.current.map((refs) => refs.inner?.offsetHeight ?? 0);

      /* ── The sky and the ground ────────────────────────────────── */
      const skyIn = ease(seg(vt, T.sky, 0.9));
      const skyOut = ease(seg(vt, T.collapse + 0.15, 0.8));
      sky.style.opacity = `${skyIn * (1 - skyOut)}`;
      const winP = ease(seg(vt, T.iface, 0.6));
      ground.style.opacity = `${winP}`;

      /* ── The window ────────────────────────────────────────────── */
      const side = ease(seg(vt, T.sidebar, 0.7));
      const cardX = lerp(CARD.x, CARD_WIDE.x, side);
      const cardW = lerp(CARD.w, CARD_WIDE.w, side);
      const cardY = CARD.y;
      const cardH = CARD.h;
      for (const el of [card, content]) {
        el.style.left = `${cardX}px`;
        el.style.top = `${cardY}px`;
        el.style.width = `${cardW}px`;
        el.style.height = `${cardH}px`;
        el.style.opacity = `${winP}`;
        el.style.transform = `scale(${0.985 + 0.015 * winP})`;
      }

      // The film leaves for the logo.
      const out = ease(seg(vt, T.logo, 0.55));
      film.style.opacity = `${1 - out}`;
      film.style.transform = `scale(${1 - 0.02 * out})`;
      const logo = logoRef.current;
      if (logo) {
        const lin = ease(seg(vt, T.logo + 0.4, 0.55));
        logo.style.opacity = `${lin}`;
        logo.style.transform = `translate(-50%, -50%) scale(${0.97 + 0.03 * lin})`;
      }

      /* ── The sidebar ───────────────────────────────────────────── */
      sidebar.style.transform = `translateX(${-SIDEBAR_W * (1 - side)}px)`;
      sidebar.style.opacity = `${side}`;
      main.style.boxShadow = side > 0 ? "-1px 0 0 var(--color-ando-border-default)" : "none";

      /* ── The header and the composer's slide ───────────────────── */
      const chatP = ease(seg(vt, T.chat, 0.5));
      header.style.transform = `translateY(${-headerH * (1 - chatP)}px)`;
      header.style.opacity = `${chatP}`;

      const bottomTop = cardH - composerH;
      const slide = ease(seg(vt, T.iface + 0.15, 0.65));
      const composerTop = lerp(cardH + 12, bottomTop, slide);
      composer.style.top = `${composerTop}px`;
      transcript.style.top = `${headerH}px`;
      transcript.style.bottom = `${composerH + STRIP_H}px`;

      /* ── Rows ──────────────────────────────────────────────────── */
      ROWS.forEach((row, i) => {
        const refs = rowRefs.current[i];
        if (!refs.wrap || !refs.inner) return;
        const at = row.lands === "chat" ? T.chat + 0.25 : row.lands === "sara" ? T.sara : row.lands === "send" ? T.send : T.reply;
        const p = ease(seg(vt, at, 0.45));
        if (row.lands === "chat") refs.wrap.style.height = "";
        else refs.wrap.style.height = `${rowH[i] * p}px`;
        refs.inner.style.opacity = `${p}`;
        refs.inner.style.transform = `translateY(${8 * (1 - p)}px)`;
      });

      /* ── The trace, the pill, the agent between them ───────────── */
      // The pill's line sits on the stream's y; the drawer opens upward, so
      // the trace is anchored by its bottom edge.
      const traceIn = ease(seg(vt, T.trace, 0.3));
      const traceOut = ease(seg(vt, T.collapse, 0.3));
      trace.style.top = `${PILL.y + PILL.h - traceH}px`;
      trace.style.opacity = `${traceIn * (1 - traceOut)}`;

      // The pill takes over as the trace fades and becomes the agent's card:
      // narrower, much taller, the band and the name arriving as it settles.
      const shrink = ease(seg(vt, T.collapse + 0.1, 0.55));
      const cardGone = ease(seg(vt, T.indicator, 0.4));
      const pillW = lerp(PILL.w, AGENT_CARD.w, shrink);
      const pillH = lerp(PILL.h, AGENT_CARD.h, shrink);
      pill.style.left = `${AGENT_X - pillW / 2}px`;
      pill.style.top = `${LINE_Y - pillH / 2}px`;
      pill.style.width = `${pillW}px`;
      pill.style.height = `${pillH}px`;
      pill.style.borderRadius = `${lerp(14, AGENT_CARD.r, shrink)}px`;
      pill.style.opacity = `${traceOut * (1 - cardGone)}`;
      pill.style.transform = `scale(${1 - 0.04 * cardGone})`;
      cardInner.style.opacity = `${clamp01((shrink - 0.45) / 0.55)}`;

      // The agent rides the collapse from the seat to the card's band, then
      // shrinks to the typing indicator's face and hands over.
      const toFace = ease(seg(vt, T.indicator, 0.4));
      const stageIn = ease(seg(vt, T.indicator + 0.15, 0.3));
      const fr = lerp(lerp(SEAT.r, AGENT_CARD.faceR, shrink), 20, toFace);
      const fx = lerp(SEAT.x, AGENT_X, shrink);
      const fy = lerp(LINE_Y, AGENT_CARD_FACE_Y, shrink);
      const lift = shrink * (1 - toFace);
      float.style.left = `${fx - fr}px`;
      float.style.top = `${fy - fr}px`;
      float.style.width = `${2 * fr}px`;
      float.style.height = `${2 * fr}px`;
      float.style.opacity = `${traceOut * (1 - stageIn)}`;
      float.style.boxShadow = `0 ${3 * lift}px ${18 * lift}px rgba(0,0,0,${0.08 * lift}), 0 ${24 * lift}px ${36 * lift}px ${-18 * lift}px rgba(0,0,0,${0.08 * lift}), inset 0 0 0 1px rgba(16,16,16,${0.06 * lift})`;

      /* ── The typing indicator → the composer's line ────────────── */
      // From centre stage it shrinks to product scale and lands where the
      // composer's own indicator draws its dots, then hands over.
      const move = ease(seg(vt, T.iface + 0.3, 0.7));
      const paneLeft = cardX + cardW - PANE_W;
      const size = lerp(INDICATOR_BIG, INDICATOR_SMALL, move);
      const ix = lerp(AGENT_X, paneLeft + 16, move);
      const iy = lerp(AGENT_CARD_FACE_Y, cardY + composerTop - 19, move);
      indicatorEl.style.left = `${ix - INDICATOR_BIG / 2}px`;
      indicatorEl.style.top = `${iy - INDICATOR_BIG / 2}px`;
      indicatorEl.style.transform = `scale(${size / INDICATOR_BIG})`;
      indicatorEl.style.opacity = `${stageIn * (1 - ease(seg(vt, T.iface + 0.95, 0.25)))}`;

      /* ── The discrete state — the only React state ─────────────── */
      const run: RunPhase = vt >= T.reply - 0.05 ? 2 : vt >= T.send + 0.3 ? 1 : 0;
      if (run !== runShown) {
        runShown = run;
        setRunPhase(run);
      }
      const who: Actor | null =
        vt >= T.iface + 0.95 && vt < T.chat + 0.4 ? AGENT : vt >= T.typing && vt < T.sara ? CAST.sara : vt >= T.send + 2.3 && vt < T.reply ? AGENT : null;
      if (who !== typingShown) {
        typingShown = who;
        setTyping(who);
      }
      // The trace line reads whole seconds off this; a tenth is plenty.
      const coarse = run === 0 ? 0 : Math.floor(vt * 10) / 10;
      if (coarse !== traceVtShown) {
        traceVtShown = coarse;
        setTraceVt(coarse);
      }
      const ms = vt >= T.trace - 0.05 && vt < T.collapse + 0.4 ? Math.floor(((vt - T.trace) * TRACE_RATE) / 50) * 50 : null;
      if (ms !== traceMsShown) {
        traceMsShown = ms;
        setTraceMs(ms);
      }
      // The indicator's frame, at 30 a second, only while it is on stage.
      // Its clock starts once the face has taken over from the card.
      const tick = vt >= T.indicator && vt < T.iface + 1.3 ? Math.floor((vt - T.indicator - 0.45) * 30) / 30 : null;
      if (tick !== indicatorShown) {
        indicatorShown = tick;
        setIndicator(tick == null ? null : indicatorFrame(tick));
      }
      const typeP = seg(vt, T.ask, Math.max(0.3, T.send - T.ask - 0.25));
      const chars = Math.floor(typeP * ASK.length);
      const draft = vt >= T.send || chars === 0 ? null : ASK.slice(0, chars);
      if (draft !== draftShown) {
        draftShown = draft;
        setScripted(draft);
      }

      /* ── Titles ────────────────────────────────────────────────── */
      const fadeIn = (el: HTMLElement | null, on: number, off: number, rise = 6) => {
        if (!el) return;
        const a = ease(seg(vt, on, 0.5));
        const b = 1 - ease(seg(vt, off, 0.35));
        el.style.opacity = `${a * b}`;
        el.style.transform = `translate(-50%, ${rise * (1 - a)}px)`;
      };
      fadeIn(title1Ref.current, T.agent + 0.35, T.sky);
      fadeIn(title2Ref.current, T.iface, T.chat + 0.9);
      fadeIn(captionRef.current, T.stream + 0.15, T.agent - 0.35, 4);

      /* ── The canvas: hairline, dots, disc ──────────────────────── */
      // The disc lands on the line, swells as it takes the line in, pales
      // as the sky comes, and drifts into the pill's seat.
      const agentP = seg(vt, T.agent, 0.6);
      const absorbed = absorbedAt(T, vt);
      const toSeat = ease(seg(vt, T.sky + 0.2, 0.9));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, STAGE.w, STAGE.h);
      const hl = hairlineAt(T, vt);
      if (hl > 0) {
        ctx.strokeStyle = `rgba(26,24,23,${0.16 * hl})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(CARD.x, LINE_Y + 0.5);
        ctx.lineTo(CARD.x + CARD.w, LINE_Y + 0.5);
        ctx.stroke();
      }
      ctx.fillStyle = DOT_INK;
      for (const dot of dotsAt(T, vt)) {
        ctx.globalAlpha = dot.a;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      }
      const discA = agentP > 0 ? 1 - traceIn : 0;
      if (discA > 0) {
        const r = lerp(DISC_R * backOut(agentP) * (1 + 0.16 * absorbed), SEAT.r, toSeat);
        const x = lerp(AGENT_X, SEAT.x, toSeat);
        const ink = DISC_INK.map((c, i) => Math.round(lerp(c, DISC_SKY[i], skyIn)));
        ctx.globalAlpha = discA;
        ctx.fillStyle = `rgb(${ink[0]},${ink[1]},${ink[2]})`;
        ctx.beginPath();
        ctx.arc(x, LINE_Y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
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
      paint(T);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [hooks]);

  const phases = tracePhasesFor(timing);

  return (
    <div className="cs-stage relative w-screen overflow-hidden bg-white text-ando-fg-primary" style={{ height: `calc(100dvh - ${STUDIO_CLEARANCE}px)` }}>
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden bg-white"
        style={{ width: STAGE.w, height: STAGE.h, transform: `translate(-50%, -50%) scale(${scale})` }}
        onClick={onReplay}
        role="presentation"
      >
        <div ref={filmRef} className="absolute inset-0" style={{ transformOrigin: "50% 50%" }}>
          {/* The sky — Ando's sora render under a 10% wash — while the agent works. */}
          <div ref={skyRef} data-cs="sky" className="absolute inset-0" style={{ opacity: 0 }}>
            <img src="/context-stream/sora.jpg" alt="" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-black/10" />
          </div>
          {/* The ground goes grey when the window comes. */}
          <div ref={groundRef} className="absolute inset-0 bg-ando-bg-nav" style={{ opacity: 0 }} />

          {/* The window's card. */}
          <div ref={cardRef} data-cs="card" className="absolute rounded-xl bg-white shadow-[0_0_0_1px_rgba(26,24,23,0.07),0_18px_44px_rgba(26,24,23,0.07)]" style={{ left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, opacity: 0 }} />

          {/* The window's contents, clipped to the card. */}
          <div ref={contentRef} className="absolute overflow-hidden rounded-xl" style={{ left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, opacity: 0 }}>
            <div ref={sidebarRef} data-cs="sidebar" className="absolute bottom-0 left-0 top-0" style={{ width: SIDEBAR_W, opacity: 0 }}>
              <Sidebar scene={ROOM} />
            </div>
            <div ref={mainRef} className="absolute bottom-0 right-0 top-0 overflow-hidden" style={{ width: PANE_W }}>
              <div ref={headerRef} data-cs="header" className="absolute left-0 right-0 top-0" style={{ opacity: 0 }}>
                <ConversationHeader scene={ROOM} jamControl={<JamHeaderControl active={false} participants={[CAST[ME]]} onClick={noop} />} />
              </div>
              <div ref={transcriptRef} data-cs="transcript" className="absolute left-0 right-0 flex flex-col justify-end overflow-hidden pb-1" style={{ top: 44, bottom: 140 + STRIP_H }}>
                {ROWS.map((row, i) => (
                  <div
                    key={row.key}
                    data-row={row.key}
                    ref={(el) => { rowRefs.current[i].wrap = el; }}
                    className="relative shrink-0"
                    style={{ overflow: row.lands === "chat" ? undefined : "hidden", height: row.lands === "chat" ? undefined : 0 }}
                  >
                    <div ref={(el) => { rowRefs.current[i].inner = el; }} style={{ opacity: 0 }}>
                      <RowView row={row} runPhase={runPhase} phases={phases} traceVt={traceVt} />
                    </div>
                  </div>
                ))}
              </div>
              {/* The composer slides up from under the window's floor. */}
              <div ref={composerRef} data-cs="composer" className="absolute left-0 right-0" style={{ top: CARD.h + 12 }}>
                <Composer scene={ROOM} typing={typing} onSend={noop} scripted={scripted} />
              </div>
            </div>
          </div>

          {/* The trace — the library's, on the sky, its line on the stream's y. No data-cs: it transitions on its own. */}
          <div ref={traceRef} data-trace className="absolute" style={{ left: PILL.x, top: PILL.y, width: PILL.w, opacity: 0 }}>
            {traceMs == null ? null : <ContextTrace theme="light" vt={traceMs} open={traceMs >= TRACE_OPEN_MS} onToggle={noop} width={PILL.w} avatar={AGENT.avatar} />}
          </div>
          {/* What the trace collapses into: the agent's card (Ando-Brand 3968-2558). The face rides over it. */}
          <div ref={pillRef} data-cs="pill" className="absolute overflow-hidden bg-white shadow-[0_0_0_0.5px_rgba(16,16,16,0.06),0_15px_60px_rgba(0,0,0,0.08)]" style={{ left: PILL.x, top: PILL.y, width: PILL.w, height: PILL.h, borderRadius: 14, opacity: 0, transformOrigin: "50% 50%" }}>
            <div ref={cardInnerRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: AGENT_CARD.w, height: AGENT_CARD.h, opacity: 0 }}>
              <div className="absolute rounded-[9px]" style={{ left: AGENT_CARD.inset, right: AGENT_CARD.inset, top: AGENT_CARD.inset, height: AGENT_CARD.band, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.04) 100%), #f5f5f4" }} />
              <div className="absolute left-1/2 flex w-[258px] -translate-x-1/2 flex-col items-center gap-[3px] text-center" style={{ top: 210 }}>
                <div className="text-ando-fg-primary" style={{ fontSize: 30, lineHeight: "42px", fontWeight: 500 }}>{AGENT.name}</div>
                <div className="text-ando-fg-secondary" style={{ fontSize: 20, lineHeight: "28px" }}>Workspace assistant</div>
              </div>
            </div>
          </div>

          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" style={{ width: STAGE.w, height: STAGE.h }} aria-hidden />

          {/* The agent, from the pill's seat to the card's band to the indicator's face. */}
          <img ref={floatRef} src={AGENT.avatar} alt="" decoding="async" className="absolute rounded-full object-cover" style={{ opacity: 0, width: 22, height: 22 }} />
          {/* The typing indicator: the face, then three dots, then the composer's own line. */}
          <div ref={indicatorRef} data-cs="indicator" className="absolute" style={{ opacity: 0, width: INDICATOR_BIG, height: INDICATOR_BIG, transformOrigin: "50% 50%" }}>
            {indicator ? <Stage frame={indicator} size={INDICATOR_BIG} avatarSrc={AGENT.avatar} /> : null}
          </div>

          <div ref={title1Ref} data-cs="title-1" className="kanso-text-label-16 absolute whitespace-nowrap text-ando-fg-primary" style={{ left: CARD.x + CARD.w / 2, top: CARD.y + 56, opacity: 0, fontSize: 19, transform: "translate(-50%, 0)" }}>
            Everything becomes context for your agents.
          </div>
          <div ref={captionRef} data-cs="caption" className="kanso-text-label-12 absolute whitespace-nowrap text-ando-fg-tertiary" style={{ left: CARD.x + 96, top: LINE_Y - 30, opacity: 0, transform: "translate(-50%, 0)" }}>
            “context stream”
          </div>
          <div ref={title2Ref} data-cs="title-2" className="absolute left-1/2 whitespace-nowrap text-ando-fg-primary" style={{ top: CARD.y - 76, opacity: 0, fontSize: 30, letterSpacing: -0.4, transform: "translate(-50%, 0)" }}>
            “so we built an interface around that”
          </div>
        </div>

        <div ref={logoRef} data-cs="logo" className="absolute left-1/2 top-1/2" style={{ opacity: 0, transform: "translate(-50%, -50%)" }}>
          <Logo width={260} />
        </div>
      </div>
    </div>
  );
}
