"use client";

// The scene is the driver: one rAF loop, one virtual clock `vt`, and every
// visual value a pure function of it — so the studio can run time
// backwards, hold it still, and jump it. Continuous things (the frame, the
// dots, the disc, the card's growth, the composer's slide, every fade) are
// written straight to the DOM each frame; the only React state is discrete
// — the scripted draft, who is typing, the run's phase, and two coarse
// clocks the trace lines read seconds from — set when they change.
//
// Layers, bottom to top: the grey ground · the card (a hairline frame,
// then the agent's card, then the window) · the window's contents
// (sidebar, header, transcript, composer) · the agent's card · the canvas
// (dots, hairline, disc) · the agent, travelling · the titles · the logo.
// The card, contents and canvas share one group so the whole window can
// leave together for the logo.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Hooks } from "../../lib/timeline-studio/studio";
import { Composer, ConversationHeader, Sidebar } from "../ando-stage/chrome";
import { JamHeaderControl } from "../ando-stage/jam";
import { CAST, ME, type Actor, type Scene as Room } from "../ando-stage/scenes";
import { AgentCard } from "./agent-card";
import { Logo } from "./logo";
import { AGENT_CARD_W, AGENT_X, CARD, CARD_WIDE, DISC_R, FRAME_CLOUD, HERO_AVATAR_R, HERO_H, LINE_Y, PANE_W, SIDEBAR_W, STAGE, absorbedAt, backOut, clamp01, dotsAt, ease, hairlineAt, lerp, seg } from "./stream";
import type { Timing } from "./timing";
import { ASK, ROWS, RowView, tracePhasesFor, type RunPhase } from "./transcript";
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
const DISC_INK = "#d9d6d3";
/** The trace in the card runs the library's timeline at this many ms per film second. */
const TRACE_RATE = 2000;
/** The typing strip above the composer — the product's slot, h-9, 3px up. */
const STRIP_H = 36;
const noop = () => {};

type Rect = { x: number; y: number; w: number; h: number };
const mix = (a: Rect, b: Rect, p: number): Rect => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });

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

const REPLY_INDEX = ROWS.findIndex((row) => row.key === "reply");

export function ContextStreamScene({ timing, hooks, onReplay }: { timing: Timing; hooks: Hooks; onReplay: () => void }) {
  // Timing rides in a ref so a drag re-times the frame without restarting
  // the clock; a replay (key bump) is the only thing that resets `vt`.
  const timingRef = useRef(timing);
  useLayoutEffect(() => {
    timingRef.current = timing;
  }, [timing]);

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
  const agentCardRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const traceRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLImageElement>(null);
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

    const paint = (T: Timing) => {
      const ground = groundRef.current;
      const film = filmRef.current;
      const card = cardRef.current;
      const content = contentRef.current;
      const sidebar = sidebarRef.current;
      const main = mainRef.current;
      const header = headerRef.current;
      const transcript = transcriptRef.current;
      const composer = composerRef.current;
      const agentCard = agentCardRef.current;
      const copy = copyRef.current;
      const trace = traceRef.current;
      const float = floatRef.current;
      if (!ground || !film || !card || !content || !sidebar || !main || !header || !transcript || !composer || !agentCard || !copy || !trace || !float) return;

      /* ── The frame → the agent's card → the window ─────────────── */
      const tight = ease(seg(vt, T.gather, 0.9));
      const formP = ease(seg(vt, T.form + 0.1, 0.7));
      const workP = ease(seg(vt, T.work, 0.5));
      const breakP = ease(seg(vt, T.breakout, 0.7));
      const side = ease(seg(vt, T.sidebar, 0.7));

      // The card's body is whichever of its two bodies is showing — the
      // introduction, then the trace — so its height follows the crossfade.
      const bodyH = lerp(copy.offsetHeight, trace.offsetHeight, workP);
      const centerH = HERO_H + bodyH;
      const center: Rect = { x: (STAGE.w - AGENT_CARD_W) / 2, y: STAGE.h / 2 - centerH / 2, w: AGENT_CARD_W, h: centerH };
      const frame = mix(FRAME_CLOUD, CARD, tight);
      const formed = mix(frame, center, formP);
      const window_ = mix(formed, CARD, breakP);
      const cardX = lerp(window_.x, CARD_WIDE.x, side);
      const cardW = lerp(window_.w, CARD_WIDE.w, side);
      const cardY = window_.y;
      const cardH = window_.h;

      const grey = ease(seg(vt, T.form, 0.7));
      ground.style.opacity = `${grey}`;
      const rect = (el: HTMLElement) => {
        el.style.left = `${cardX}px`;
        el.style.top = `${cardY}px`;
        el.style.width = `${cardW}px`;
        el.style.height = `${cardH}px`;
      };
      rect(card);
      rect(content);
      card.style.background = `rgba(255,255,255,${grey})`;
      card.style.boxShadow = `0 0 0 1px rgba(26,24,23,${lerp(0.1, 0.07, grey)}), 0 ${18 * grey}px ${44 * grey}px rgba(26,24,23,${0.07 * grey})`;

      // The agent's card: its contents live at the centre rect, fading in
      // as the frame arrives there and out as it grows into the window.
      agentCard.style.left = `${center.x}px`;
      agentCard.style.top = `${center.y}px`;
      agentCard.style.height = `${centerH}px`;
      agentCard.style.opacity = `${clamp01((formP - 0.45) / 0.55) * (1 - clamp01(breakP / 0.4))}`;
      copy.style.opacity = `${1 - workP}`;
      trace.style.opacity = `${workP}`;

      // The window leaves for the logo.
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
      const headerH = header.offsetHeight;
      header.style.transform = `translateY(${-headerH * (1 - chatP)}px)`;
      header.style.opacity = `${chatP}`;

      const composerH = composer.offsetHeight; // the box plus its 16px floor
      const bottomTop = cardH - composerH;
      const slide = ease(seg(vt, T.breakout + 0.2, 0.65));
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
        else refs.wrap.style.height = `${refs.inner.offsetHeight * p}px`;
        refs.inner.style.opacity = `${p}`;
        refs.inner.style.transform = `translateY(${8 * (1 - p)}px)`;
      });

      /* ── The discrete state — the only React state ─────────────── */
      const run: RunPhase = vt >= T.reply - 0.05 ? 2 : vt >= T.send + 0.3 ? 1 : 0;
      if (run !== runShown) {
        runShown = run;
        setRunPhase(run);
      }
      const who: Actor | null = vt >= T.typing && vt < T.sara ? CAST.sara : vt >= T.send + 2.3 && vt < T.reply ? CAST.ando : null;
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
      const ms = vt >= T.work - 0.05 && vt < T.breakout + 0.6 ? Math.floor(((vt - T.work) * TRACE_RATE) / 50) * 50 : null;
      if (ms !== traceMsShown) {
        traceMsShown = ms;
        setTraceMs(ms);
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
      fadeIn(title1Ref.current, T.agent + 0.35, T.form - 0.1);
      fadeIn(title2Ref.current, T.breakout + 0.1, T.chat + 0.9);
      fadeIn(captionRef.current, T.stream + 0.15, T.agent - 0.35, 4);

      /* ── The disc → the agent, travelling ──────────────────────── */
      // Lands on the line, swells as it takes the line in, rises to the
      // hero and becomes the avatar, drops to sit above the composer, and
      // finally takes its seat on the reply.
      const paneLeft = cardX + cardW - PANE_W;
      const agentP = seg(vt, T.agent, 0.6);
      const absorbed = absorbedAt(T, vt);
      const travel = seg(vt, T.form, 0.8);
      const e1 = ease(travel);
      const cross = clamp01((travel - 0.5) / 0.5);
      const leave = seg(vt, T.breakout + 0.1, 0.8);
      const e2 = ease(leave);
      const seat = seg(vt, T.reply, 0.5);
      const e3 = ease(seat);
      let disc: { x: number; y: number; r: number; a: number } | null = null;
      if (agentP > 0) {
        const heroX = center.x + AGENT_CARD_W / 2;
        const heroY = center.y + HERO_H / 2;
        let x = lerp(AGENT_X, heroX, e1);
        let y = lerp(LINE_Y, heroY, e1) - Math.sin(Math.PI * e1) * 24;
        let r = lerp(DISC_R * backOut(agentP) * (1 + 0.16 * absorbed), HERO_AVATAR_R, e1);
        const aboveX = paneLeft + PANE_W / 2;
        const aboveY = cardY + composerTop - 3 - STRIP_H / 2;
        x = lerp(x, aboveX, e2);
        y = lerp(y, aboveY, e2);
        r = lerp(r, 16, e2);
        const avatarEl = rowRefs.current[REPLY_INDEX]?.inner?.querySelector<HTMLElement>("[data-row-avatar]") ?? null;
        if (avatarEl && seat > 0) {
          const target = within(avatarEl, main);
          x = lerp(x, paneLeft + target.x + 16, e3);
          y = lerp(y, cardY + target.y + 16, e3);
        }
        disc = { x, y, r, a: 1 - cross };
        const heroness = cross * (1 - e2);
        float.style.left = `${x - r}px`;
        float.style.top = `${y - r}px`;
        float.style.width = `${2 * r}px`;
        float.style.height = `${2 * r}px`;
        float.style.opacity = `${cross * (1 - clamp01((seat - 0.7) / 0.3))}`;
        float.style.boxShadow = `0 0 0 ${4 * heroness}px #fff, 0 ${10 * heroness}px ${28 * heroness}px rgba(26,24,23,${0.18 * heroness})`;
      } else {
        float.style.opacity = "0";
      }

      /* ── The canvas: hairline, dots, disc ──────────────────────── */
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
      if (disc && disc.a > 0) {
        ctx.globalAlpha = disc.a;
        ctx.fillStyle = DISC_INK;
        ctx.beginPath();
        ctx.arc(disc.x, disc.y, disc.r, 0, Math.PI * 2);
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
        {/* The ground goes grey when the frame becomes a card. */}
        <div ref={groundRef} className="absolute inset-0 bg-ando-bg-nav" style={{ opacity: 0 }} />

        <div ref={filmRef} className="absolute inset-0" style={{ transformOrigin: "50% 50%" }}>
          {/* The focus frame — a hairline first, the agent's card, then the window. */}
          <div ref={cardRef} data-cs="card" className="absolute rounded-xl" style={{ left: FRAME_CLOUD.x, top: FRAME_CLOUD.y, width: FRAME_CLOUD.w, height: FRAME_CLOUD.h }} />

          {/* The window's contents, clipped to the card. */}
          <div ref={contentRef} className="absolute overflow-hidden rounded-xl" style={{ left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h }}>
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
              {/* The composer slides up from under the window's floor at the breakout. */}
              <div ref={composerRef} data-cs="composer" className="absolute left-0 right-0" style={{ top: CARD.h + 12 }}>
                <Composer scene={ROOM} typing={typing} onSend={noop} scripted={scripted} />
              </div>
            </div>
          </div>

          {/* The agent's card — its hero and body; the avatar rides over it. */}
          <div ref={agentCardRef} className="absolute overflow-hidden rounded-xl" style={{ left: (STAGE.w - AGENT_CARD_W) / 2, top: 180, width: AGENT_CARD_W, opacity: 0 }}>
            <AgentCard copyRef={copyRef} traceRef={traceRef} traceMs={traceMs} />
          </div>

          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" style={{ width: STAGE.w, height: STAGE.h }} aria-hidden />

          {/* The disc, become the agent — hero, then above the composer, then its seat on the reply. */}
          <img ref={floatRef} src={CAST.ando.avatar} alt="" className="absolute rounded-full object-cover" style={{ opacity: 0, width: 32, height: 32 }} />

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
