"use client";

// The scene is the driver: one rAF loop, one virtual clock `vt`, and every
// visual value a pure function of it — so the studio can run time
// backwards, hold it still, and jump it. Continuous things (the frame, the
// dots, the disc, the composer's morph, the sidebar's slide, every fade)
// are written straight to the DOM each frame; the only React state is the
// scripted draft and the agent's run phase, set when they change.
//
// Layers, bottom to top: the grey ground · the card · the canvas (dots,
// hairline, disc) · the card's contents (sidebar, header, transcript,
// composer, the travelling avatar) · the titles · the logo. The card,
// canvas and contents share one group so the whole window can leave
// together for the logo.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Hooks } from "../../lib/timeline-studio/studio";
import { Composer, ConversationHeader, Sidebar } from "../ando-stage/chrome";
import { JamHeaderControl } from "../ando-stage/jam";
import { CAST, ME, type Scene as Room } from "../ando-stage/scenes";
import { Logo } from "./logo";
import { AGENT_X, CARD, CARD_WIDE, DISC_R, FRAME_CLOUD, LINE_Y, PANE_W, SIDEBAR_W, STAGE, backOut, clamp01, dotsAt, ease, hairlineAt, lerp, seg } from "./stream";
import type { Timing } from "./timing";
import { ASK, ROWS, RowView, type RunPhase } from "./transcript";
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
const noop = () => {};

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

  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min((window.innerWidth - 40) / STAGE.w, (window.innerHeight - STUDIO_CLEARANCE - 40) / STAGE.h, 1.5));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const [scripted, setScripted] = useState<string | null>(null);
  const [runPhase, setRunPhase] = useState<RunPhase>(0);

  const groundRef = useRef<HTMLDivElement>(null);
  const filmRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
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

    const paint = (T: Timing) => {
      const ground = groundRef.current;
      const film = filmRef.current;
      const card = cardRef.current;
      const content = contentRef.current;
      const sidebar = sidebarRef.current;
      const main = mainRef.current;
      const header = headerRef.current;
      const transcript = transcriptRef.current;
      const shell = shellRef.current;
      const composer = composerRef.current;
      const float = floatRef.current;
      if (!ground || !film || !card || !content || !sidebar || !main || !header || !transcript || !shell || !composer || !float) return;

      /* ── The frame → the card → the window ─────────────────────── */
      const tight = ease(seg(vt, T.gather, 0.9));
      const side = ease(seg(vt, T.sidebar, 0.7));
      const cardX = lerp(lerp(FRAME_CLOUD.x, CARD.x, tight), CARD_WIDE.x, side);
      const cardW = lerp(lerp(FRAME_CLOUD.w, CARD.w, tight), CARD_WIDE.w, side);
      const cardY = CARD.y;
      const cardH = CARD.h;
      const grey = ease(seg(vt, T.agent - 0.2, 0.7));
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

      /* ── The header and the composer's two homes ───────────────── */
      const chatP = ease(seg(vt, T.chat, 0.5));
      const headerH = header.offsetHeight;
      header.style.transform = `translateY(${-headerH * (1 - chatP)}px)`;
      header.style.opacity = `${chatP}`;

      const composerH = composer.offsetHeight; // the box plus its 16px floor
      const boxH = Math.max(1, composerH - 16);
      const centerTop = LINE_Y - cardY - boxH / 2;
      const bottomTop = cardH - composerH;
      const drop = ease(seg(vt, T.chat, 0.7));
      const morph = ease(seg(vt, T.iface + 0.15, 0.8));
      composer.style.top = `${lerp(centerTop, bottomTop, drop)}px`;
      composer.style.opacity = `${clamp01((morph - 0.45) / 0.4)}`;
      // The shell: the line, thickening into the composer's box.
      shell.style.top = `${LINE_Y - cardY - (boxH * morph) / 2}px`;
      shell.style.height = `${Math.max(1, boxH * morph)}px`;
      shell.style.opacity = morph <= 0 ? "0" : `${1 - clamp01((morph - 0.6) / 0.4)}`;
      transcript.style.top = `${headerH}px`;
      transcript.style.bottom = `${composerH}px`;

      /* ── Rows ──────────────────────────────────────────────────── */
      let chatIndex = 0;
      let firstRowP = 0;
      ROWS.forEach((row, i) => {
        const refs = rowRefs.current[i];
        if (!refs.wrap || !refs.inner) return;
        let p: number;
        if (row.lands === "chat") {
          p = ease(seg(vt, T.chat + 0.2 + chatIndex * 0.14, 0.45));
          chatIndex += 1;
          refs.wrap.style.height = "";
        } else {
          p = ease(seg(vt, row.lands === "send" ? T.send : T.reply, 0.45));
          refs.wrap.style.height = `${refs.inner.offsetHeight * p}px`;
        }
        if (i === 0) firstRowP = p;
        refs.inner.style.opacity = `${p}`;
        refs.inner.style.transform = `translateY(${8 * (1 - p)}px)`;
      });

      /* ── The run and the draft — the only React state ──────────── */
      const run: RunPhase = vt >= T.reply - 0.05 ? 2 : vt >= T.send + 0.35 ? 1 : 0;
      if (run !== runShown) {
        runShown = run;
        setRunPhase(run);
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
      fadeIn(title1Ref.current, T.agent + 0.35, T.iface);
      fadeIn(title2Ref.current, T.iface, T.chat + 0.5);
      fadeIn(captionRef.current, T.stream + 0.15, T.agent - 0.35, 4);

      /* ── The disc → the agent's avatar ─────────────────────────── */
      const paneLeft = cardX + cardW - PANE_W;
      const agentP = seg(vt, T.agent, 0.6);
      const travel = seg(vt, T.iface + 0.1, 0.8);
      const e = ease(travel);
      let disc: { x: number; y: number; r: number; a: number } | null = null;
      if (agentP > 0) {
        const avatarEl = refs0Avatar();
        const target = avatarEl ? within(avatarEl, main) : { x: 16, y: headerH + 12 };
        const tx = paneLeft + target.x + 16;
        const ty = cardY + target.y + 16;
        const x = lerp(AGENT_X, tx, e);
        const y = lerp(LINE_Y, ty, e) - Math.sin(Math.PI * e) * 36;
        const r = lerp(DISC_R * backOut(agentP), 16, e);
        const cross = clamp01((travel - 0.6) / 0.4);
        disc = { x, y, r, a: 1 - cross };
        float.style.left = `${x - paneLeft - r}px`;
        float.style.top = `${y - cardY - r}px`;
        float.style.width = `${2 * r}px`;
        float.style.height = `${2 * r}px`;
        float.style.opacity = `${cross * (1 - clamp01((firstRowP - 0.98) / 0.02))}`;
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

    const refs0Avatar = () => rowRefs.current[0].inner?.querySelector<HTMLElement>("[data-row-avatar]") ?? null;

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

  return (
    <div className="cs-stage relative w-screen overflow-hidden bg-white text-ando-fg-primary" style={{ height: `calc(100dvh - ${STUDIO_CLEARANCE}px)` }}>
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden bg-white"
        style={{ width: STAGE.w, height: STAGE.h, transform: `translate(-50%, -50%) scale(${scale})` }}
        onClick={onReplay}
        role="presentation"
      >
        {/* The ground goes grey when the frame becomes a window. */}
        <div ref={groundRef} className="absolute inset-0 bg-ando-bg-nav" style={{ opacity: 0 }} />

        <div ref={filmRef} className="absolute inset-0" style={{ transformOrigin: "50% 50%" }}>
          {/* The focus frame — a hairline first, the window once the ground turns. */}
          <div ref={cardRef} data-cs="card" className="absolute rounded-xl" style={{ left: FRAME_CLOUD.x, top: FRAME_CLOUD.y, width: FRAME_CLOUD.w, height: FRAME_CLOUD.h }} />

          <canvas ref={canvasRef} className="absolute inset-0" style={{ width: STAGE.w, height: STAGE.h }} aria-hidden />

          {/* The window's contents, clipped to the card. */}
          <div ref={contentRef} className="absolute overflow-hidden rounded-xl" style={{ left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h }}>
            <div ref={sidebarRef} data-cs="sidebar" className="absolute bottom-0 left-0 top-0" style={{ width: SIDEBAR_W, opacity: 0 }}>
              <Sidebar scene={ROOM} />
            </div>
            <div ref={mainRef} className="absolute bottom-0 right-0 top-0 overflow-hidden" style={{ width: PANE_W }}>
              <div ref={headerRef} data-cs="header" className="absolute left-0 right-0 top-0" style={{ opacity: 0 }}>
                <ConversationHeader scene={ROOM} jamControl={<JamHeaderControl active={false} participants={[CAST[ME]]} onClick={noop} />} />
              </div>
              <div ref={transcriptRef} data-cs="transcript" className="absolute left-0 right-0 flex flex-col justify-end overflow-hidden pb-1" style={{ top: 44, bottom: 140 }}>
                {ROWS.map((row, i) => (
                  <div
                    key={row.key}
                    data-row={row.key}
                    ref={(el) => { rowRefs.current[i].wrap = el; }}
                    className="relative shrink-0"
                    style={{ overflow: row.lands === "chat" ? undefined : "hidden", height: row.lands === "chat" ? undefined : 0 }}
                  >
                    <div ref={(el) => { rowRefs.current[i].inner = el; }} style={{ opacity: 0 }}>
                      <RowView row={row} runPhase={runPhase} />
                    </div>
                  </div>
                ))}
              </div>
              {/* The line, thickening into the composer's box. */}
              <div ref={shellRef} className="absolute left-4 right-4 rounded-lg bg-ando-bg-input shadow-[0_0_0_1px_var(--color-ando-border-alpha)]" style={{ top: LINE_Y - CARD.y, height: 1, opacity: 0 }} />
              <div ref={composerRef} data-cs="composer" className="absolute left-0 right-0" style={{ top: 0, opacity: 0 }}>
                <Composer scene={ROOM} typing={null} onSend={noop} scripted={scripted} />
              </div>
              {/* The disc, become the agent — travels to the first row's avatar and waits there. */}
              <img ref={floatRef} src={CAST.ando.avatar} alt="" className="absolute rounded-full object-cover" style={{ opacity: 0, width: 32, height: 32 }} />
              <div ref={title1Ref} data-cs="title-1" className="kanso-text-label-16 absolute left-1/2 whitespace-nowrap text-ando-fg-primary" style={{ top: 56, opacity: 0, fontSize: 19, transform: "translate(-50%, 0)" }}>
                Everything becomes context for your agents.
              </div>
            </div>
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
