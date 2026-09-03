"use client";

// The scene is the driver: one rAF loop, one virtual clock `vt`, and every
// visual value a pure function of it — so the studio can run time
// backwards, hold it still, and jump it. Continuous things (the dots, the
// camera, the agent's walk, the composer's slide, every fade) are written
// straight to the DOM each frame; the only React state is discrete — who
// is typing, the run's phase, the trace line's coarse clock, the typing
// indicator's frame — set when they change.
//
// Layers, bottom to top, inside the camera: the grey ground · the window
// (its card, then its contents: sidebar, header, transcript, composer) ·
// the canvas (the dots) · the agent, which is the typing indicator.
// Outside it: the second title, the logo.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Hooks } from "../../lib/timeline-studio/studio";
import { Stage } from "../agent-typing-experience/stage";
import { RESET_MS, resetFrame, typingFrame, type Frame } from "../agent-typing-experience/variants";
import { Composer, ConversationHeader, Sidebar } from "../ando-stage/chrome";
import { JamHeaderControl } from "../ando-stage/jam";
import { CAST, ME, type Actor, type Scene as Room } from "../ando-stage/scenes";
import { Logo } from "./logo";
import { CARD, CARD_WIDE, CENTER_X, INDICATOR, INDICATOR_PX, LINE_Y, PANE_W, SIDEBAR_W, STAGE, agentX, backOut, clamp01, ease, fieldAt, lerp, seg, smooth } from "./stream";
import type { Timing } from "./timing";
import { AGENT, CHAT_LEAD, CHAT_STAGGER, ROWS, RowView, runStart, tracePhasesFor, type RunPhase } from "./transcript";
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
/** The typing strip above the composer — the product's slot, h-9, 3px up. */
const STRIP_H = 36;
/** The indicator at product scale: its 60-unit canvas puts the dots at the
 *  product's 4px on a 6px pitch, so at 60px they land 1:1 on the composer's
 *  own indicator. */
const INDICATOR_SMALL = 60;
/** The camera: how far in it is on the indicator when the interface starts
 *  to build, and how long the pull-back takes. */
const ZOOM = INDICATOR_PX / INDICATOR_SMALL;
const ZOOM_OUT = 1.2;
/** The agent at rest — the library's Orbit v2 with the face landed. */
const AGENT_FRAME = INDICATOR.morph(INDICATOR.morphMs);
const noop = () => {};

/** The agent's frame `t` seconds into `indicator`: at rest before, then the
 *  library's reset — the face gives way to three dots — then its wave. */
function agentFrame(t: number): Frame {
  if (t < 0) return AGENT_FRAME;
  const ms = t * 1000;
  if (ms < RESET_MS) return resetFrame(ms);
  return typingFrame(ms - RESET_MS, 1);
}

export function ContextStreamScene({ timing, hooks, onReplay }: { timing: Timing; hooks: Hooks; onReplay: () => void }) {
  // Timing rides in a ref so a drag re-times the frame without restarting
  // the clock; a replay (key bump) is the only thing that resets `vt`.
  const timingRef = useRef(timing);
  useLayoutEffect(() => {
    timingRef.current = timing;
  }, [timing]);

  // Every face the film will show, decoded up front — the 500px avatars
  // otherwise decode on the frame they first paint, a 100ms hitch.
  useEffect(() => {
    const faces = [...new Set([...Object.values(CAST).map((actor) => actor.avatar), AGENT.avatar])];
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

  const [runPhase, setRunPhase] = useState<RunPhase>(0);
  const [typing, setTyping] = useState<Actor | null>(null);
  const [traceVt, setTraceVt] = useState(0);
  const [indicator, setIndicator] = useState<Frame | null>(null);

  const groundRef = useRef<HTMLDivElement>(null);
  const filmRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const title1Ref = useRef<HTMLDivElement>(null);
  const title2Ref = useRef<HTMLDivElement>(null);
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
    let runShown: RunPhase = 0;
    let typingShown: Actor | null = null;
    let traceVtShown = 0;
    let indicatorShown: number | null = null;

    const paint = (T: Timing) => {
      const ground = groundRef.current;
      const film = filmRef.current;
      const camera = cameraRef.current;
      const card = cardRef.current;
      const content = contentRef.current;
      const sidebar = sidebarRef.current;
      const main = mainRef.current;
      const header = headerRef.current;
      const transcript = transcriptRef.current;
      const composer = composerRef.current;
      const indicatorEl = indicatorRef.current;
      if (!ground || !film || !camera || !card || !content || !sidebar || !main || !header || !transcript || !composer || !indicatorEl) return;

      /* ── Reads first ───────────────────────────────────────────── */
      // Every layout read the frame needs, taken before its first style
      // write — so the browser lays out once per frame, not once per
      // read-after-write.
      const headerH = header.offsetHeight;
      const composerH = composer.offsetHeight; // the box plus its 16px floor
      const rowH = rowRefs.current.map((refs) => refs.inner?.offsetHeight ?? 0);

      /* ── The window ────────────────────────────────────────────── */
      const winP = ease(seg(vt, T.iface + 0.1, 0.7));
      ground.style.opacity = `${winP}`;
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
      const slide = ease(seg(vt, T.iface + 0.25, 0.7));
      const composerTop = lerp(cardH + 12, bottomTop, slide);
      composer.style.top = `${composerTop}px`;
      transcript.style.top = `${headerH}px`;
      transcript.style.bottom = `${composerH + STRIP_H}px`;

      /* ── Rows ──────────────────────────────────────────────────── */
      let chatIndex = 0;
      ROWS.forEach((row, i) => {
        const refs = rowRefs.current[i];
        if (!refs.wrap || !refs.inner) return;
        let at: number;
        if (row.lands === "chat") {
          at = T.chat + CHAT_LEAD + chatIndex * CHAT_STAGGER;
          chatIndex += 1;
          refs.wrap.style.height = "";
        } else {
          at = T.reply;
        }
        const p = ease(seg(vt, at, 0.45));
        if (row.lands !== "chat") refs.wrap.style.height = `${rowH[i] * p}px`;
        refs.inner.style.opacity = `${p}`;
        refs.inner.style.transform = `translateY(${8 * (1 - p)}px)`;
      });

      /* ── The agent and the camera ──────────────────────────────── */
      // The agent — the library's indicator at rest, face in its disc —
      // comes in from the right as the camera settles, pops, and swells as
      // the stream runs into it; walks to centre stage; at `indicator`
      // resets into three dots and waves. At `iface` the camera is already
      // in on it — the same 120px on screen — and pulls back while the
      // window builds around it; when the pull ends the dots are exactly
      // the composer's own, and hand over.
      const field = fieldAt(T, vt);
      const pop = backOut(seg(vt, T.agent - 0.35, 0.5));
      const swell = 0.88 + 0.12 * field.eaten + 0.04 * field.pulse;
      const zoomed = vt >= T.iface;
      const zp = smooth(seg(vt, T.iface, ZOOM_OUT));
      const P = { x: CARD.x + 16, y: cardY + bottomTop - 19 };
      const C = { x: agentX(T, vt), y: LINE_Y };
      const z = zoomed ? lerp(ZOOM, 1, zp) : 1;
      const S = zoomed ? { x: lerp(CENTER_X, P.x, zp), y: lerp(LINE_Y, P.y, zp) } : P;
      camera.style.transform = `translate(${S.x - z * P.x}px, ${S.y - z * P.y}px) scale(${z})`;
      const at = zoomed ? P : C;
      const size = zoomed ? INDICATOR_SMALL : INDICATOR_PX * pop * swell;
      indicatorEl.style.left = `${at.x - INDICATOR_PX / 2}px`;
      indicatorEl.style.top = `${at.y - INDICATOR_PX / 2}px`;
      indicatorEl.style.transform = `scale(${size / INDICATOR_PX})`;
      indicatorEl.style.opacity = `${clamp01(seg(vt, T.agent - 0.35, 0.2)) * (1 - ease(seg(vt, T.iface + ZOOM_OUT - 0.1, 0.25)))}`;

      /* ── The discrete state — the only React state ─────────────── */
      const run: RunPhase = vt >= T.reply - 0.05 ? 2 : vt >= runStart(T) ? 1 : 0;
      if (run !== runShown) {
        runShown = run;
        setRunPhase(run);
      }
      // The agent is typing from the moment the pull-back lands until it replies.
      const who: Actor | null = vt >= T.iface + ZOOM_OUT - 0.05 && vt < T.reply ? AGENT : null;
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
      // The agent's frame: at rest until `indicator` (one frame, no churn),
      // then the library's reset and wave at 30 a second.
      const tick = vt < T.agent - 0.4 || vt >= T.iface + ZOOM_OUT + 0.3 ? null : vt < T.indicator ? -1 : Math.floor((vt - T.indicator) * 30) / 30;
      if (tick !== indicatorShown) {
        indicatorShown = tick;
        setIndicator(tick == null ? null : agentFrame(tick));
      }

      /* ── Titles ────────────────────────────────────────────────── */
      const fadeIn = (el: HTMLElement | null, on: number, off: number, rise = 6) => {
        if (!el) return;
        const a = ease(seg(vt, on, 0.5));
        const b = 1 - ease(seg(vt, off, 0.35));
        el.style.opacity = `${a * b}`;
        el.style.transform = `translate(-50%, ${rise * (1 - a)}px)`;
      };
      fadeIn(title1Ref.current, T.agent + 0.3, T.indicator + 0.5);
      fadeIn(title2Ref.current, T.iface + 0.3, T.chat + 0.9);

      /* ── The canvas: the dots ──────────────────────────────────── */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, STAGE.w, STAGE.h);
      ctx.fillStyle = DOT_INK;
      for (const dot of field.marks) {
        ctx.globalAlpha = dot.a;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
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
          {/* The camera: everything that zooms. */}
          <div ref={cameraRef} className="absolute inset-0" style={{ transformOrigin: "0 0" }}>
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
                  <Composer scene={ROOM} typing={typing} onSend={noop} scripted={null} />
                </div>
              </div>
            </div>

            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" style={{ width: STAGE.w, height: STAGE.h }} aria-hidden />

            {/* The agent: the library's typing indicator at rest, then its reset and wave, then the composer's own line. */}
            <div ref={indicatorRef} data-cs="indicator" className="absolute" style={{ opacity: 0, width: INDICATOR_PX, height: INDICATOR_PX, transformOrigin: "50% 50%" }}>
              {indicator ? <Stage frame={indicator} size={INDICATOR_PX} avatarSrc={AGENT.avatar} /> : null}
            </div>

            <div ref={title1Ref} data-cs="title-1" className="kanso-text-label-16 absolute whitespace-nowrap text-ando-fg-primary" style={{ left: CARD.x + CARD.w / 2, top: CARD.y + 56, opacity: 0, fontSize: 19, transform: "translate(-50%, 0)" }}>
              Everything becomes context for your agents.
            </div>
          </div>

          {/* Outside the camera, so the pull-back leaves it still. */}
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
