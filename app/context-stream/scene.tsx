"use client";

// The scene is the driver: one rAF loop, one virtual clock `vt`, and every
// visual value a pure function of it — so the studio can run time
// backwards, hold it still, and jump it. Continuous things (the dots, the
// three dots they gather into, the camera, the composer's slide, every fade) are
// written straight to the DOM each frame; the only React state is discrete
// — the scripted draft, who is typing, the run's phase, the trace line's
// coarse clock, the typing indicator's frame — set when they change.
//
// Layers, bottom to top, inside the camera: the grey ground · the window
// (its card, then its contents: sidebar, header, transcript, composer) ·
// the canvas (the dots, and the three they gather into) · the typing
// indicator. Outside it: the second title, the logo.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Hooks } from "../../lib/timeline-studio/studio";
import { Stage } from "../agent-typing-experience/stage";
import { VARIANTS, cycleFrame, cycleMs, type Frame } from "../agent-typing-experience/variants";
import { Composer, ConversationHeader, Sidebar } from "../ando-stage/chrome";
import { JamHeaderControl } from "../ando-stage/jam";
import { CAST, ME, type Actor, type Scene as Room } from "../ando-stage/scenes";
import { Logo } from "./logo";
import { CARD, CARD_WIDE, CENTER_X, HUB_R, HUB_X, LINE_Y, PANE_W, SIDEBAR_W, STAGE, clamp01, ease, fieldAt, lerp, seg, smooth } from "./stream";
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
/** The typing strip above the composer — the product's slot, h-9, 3px up. */
const STRIP_H = 36;
/** The library's agent typing indicator — Orbit v2, as /the-library shows
 *  it (shelf 04, 120px): dots, the morph into the face, the hold, the
 *  reset. Its 60-unit canvas puts the dots at the product's 4px on a 6px
 *  pitch, so at 60px they land 1:1 on the composer's own indicator. */
const INDICATOR = VARIANTS.find((v) => v.key === "orbit-v2") ?? VARIANTS[0];
const INDICATOR_CYCLE = cycleMs(INDICATOR);
const INDICATOR_BIG = 120;
const INDICATOR_SMALL = 60;
/** The camera: how far in it is on the indicator when the interface starts
 *  to build, and how long the pull-back takes. */
const ZOOM = INDICATOR_BIG / INDICATOR_SMALL;
const ZOOM_OUT = 1.2;
const noop = () => {};

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

  const [scripted, setScripted] = useState<string | null>(null);
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
    let draftShown: string | null = null;
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

      /* ── The stream → three dots ───────────────────────────────── */
      // After the pan the whole line flies to centre stage and lands in
      // three dots, each landing ringing its dot; the dots fill as they
      // take the stream in. At `indicator` they are the typing indicator.
      const field = fieldAt(T, vt);
      const hubIn = ease(seg(vt, T.gather2 + 0.2, 0.35));
      const stageIn = ease(seg(vt, T.indicator, 0.3));

      /* ── The typing indicator and the camera ───────────────────── */
      // The library's cycle plays centre stage over the three dots: the
      // wave, the morph into the face, the hold, the reset. At `iface` the
      // camera is already in on it — the same 120px on screen — and pulls
      // back while the window builds around it; when the pull ends the dots
      // are exactly the composer's own, and hand over.
      const zoomed = vt >= T.iface;
      const zp = smooth(seg(vt, T.iface, ZOOM_OUT));
      const P = { x: CARD.x + 16, y: cardY + bottomTop - 19 };
      const C = { x: CENTER_X, y: LINE_Y };
      const z = zoomed ? lerp(ZOOM, 1, zp) : 1;
      const S = zoomed ? { x: lerp(C.x, P.x, zp), y: lerp(C.y, P.y, zp) } : P;
      camera.style.transform = `translate(${S.x - z * P.x}px, ${S.y - z * P.y}px) scale(${z})`;
      const at = zoomed ? P : C;
      indicatorEl.style.left = `${at.x - INDICATOR_BIG / 2}px`;
      indicatorEl.style.top = `${at.y - INDICATOR_BIG / 2}px`;
      indicatorEl.style.transform = `scale(${(zoomed ? INDICATOR_SMALL : INDICATOR_BIG) / INDICATOR_BIG})`;
      indicatorEl.style.opacity = `${stageIn * (1 - ease(seg(vt, T.iface + ZOOM_OUT - 0.1, 0.25)))}`;

      /* ── The discrete state — the only React state ─────────────── */
      const run: RunPhase = vt >= T.reply - 0.05 ? 2 : vt >= T.send + 0.3 ? 1 : 0;
      if (run !== runShown) {
        runShown = run;
        setRunPhase(run);
      }
      const who: Actor | null =
        vt >= T.iface + ZOOM_OUT - 0.05 && vt < T.chat + 0.4 ? AGENT : vt >= T.typing && vt < T.sara ? CAST.sara : vt >= T.send + 2.3 && vt < T.reply ? AGENT : null;
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
      // The indicator's frame, at 30 a second, only while it is on stage —
      // the library's own cycle, from its first dot.
      const tick = vt >= T.indicator && vt < T.iface + ZOOM_OUT + 0.3 ? Math.floor((vt - T.indicator) * 30) / 30 : null;
      if (tick !== indicatorShown) {
        indicatorShown = tick;
        setIndicator(tick == null ? null : cycleFrame(INDICATOR, (tick * 1000) % INDICATOR_CYCLE).frame);
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
      fadeIn(title1Ref.current, T.gather2 + 0.35, T.indicator + 1.1);
      fadeIn(title2Ref.current, T.iface + 0.3, T.chat + 0.9);

      /* ── The canvas: the dots, and the three ───────────────────── */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, STAGE.w, STAGE.h);
      ctx.fillStyle = DOT_INK;
      for (const dot of field.marks) {
        ctx.globalAlpha = dot.a;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // The three dots give way to the indicator's own.
      const hubA = hubIn * (1 - stageIn);
      if (hubA > 0) {
        field.hub.forEach((h, i) => {
          ctx.globalAlpha = hubA * lerp(0.55, 1, h.fill);
          ctx.beginPath();
          ctx.arc(HUB_X[i], LINE_Y, lerp(2.5, HUB_R, h.fill) + 1.2 * h.pulse, 0, Math.PI * 2);
          ctx.fill();
        });
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
                  <Composer scene={ROOM} typing={typing} onSend={noop} scripted={scripted} />
                </div>
              </div>
            </div>

            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" style={{ width: STAGE.w, height: STAGE.h }} aria-hidden />

            {/* The typing indicator: the library's cycle over the three dots, then the composer's own line. */}
            <div ref={indicatorRef} data-cs="indicator" className="absolute" style={{ opacity: 0, width: INDICATOR_BIG, height: INDICATOR_BIG, transformOrigin: "50% 50%" }}>
              {indicator ? <Stage frame={indicator} size={INDICATOR_BIG} avatarSrc={AGENT.avatar} /> : null}
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
