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
import { RESET_MS, TYPE_MS, WAVE_MS, cycleFrame, resetFrame, typingFrame, type Frame } from "../agent-typing-experience/variants";
import { BARE, CHAIN, FACES, becomingAt, faceAt } from "./agents";
import { Composer, ConversationHeader, Sidebar } from "../ando-stage/chrome";
import { JamHeaderControl } from "../ando-stage/jam";
import { CAST, ME, type Actor, type Scene as Room, type SidebarSection } from "../ando-stage/scenes";
import { Logo } from "./logo";
import { AGENT_R, AGENT_X, CARD, CARD_WIDE, INDICATOR, INDICATOR_PX, LINE_Y, PANE_W, SIDEBAR_W, STAGE, clamp01, ease, fieldAt, lerp, seg, smooth } from "./stream";
import type { Timing } from "./timing";
import { AGENT, CHAT_LEAD, CHAT_STAGGER, READ_FROM, ROWS, RowView, runStart, tracePhasesFor, valuePhasesFor, type RunPhase } from "./transcript";
import { VALUE_SLOT_W, ValueLine } from "./value-line";
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

/** The film's sidebar: the three people, one folder of three channels. */
const SIDEBAR_FILM: SidebarSection[] = [
  { label: "Favorites", rows: [{ kind: "dm", who: "aj", online: true }, { kind: "dm", who: "oli", online: false }, { kind: "dm", who: "sara", online: true }] },
  { label: "Core", rows: [{ kind: "channel", name: "launch", unread: true }, { kind: "channel", name: "general" }, { kind: "channel", name: "design" }] },
];

/** Room the studio's pill needs below the stage. */
const STUDIO_CLEARANCE = 72;
const DOT_INK = "#a3a09c";
/** The typing strip above the composer — the product's slot, h-9, 3px up. */
const STRIP_H = 36;
/** The indicator at product scale: its 60-unit canvas puts the dots at the
 *  product's 4px on a 6px pitch, so at 60px they land 1:1 on the composer's
 *  own indicator. */
const INDICATOR_SMALL = 60;
/** The trace line beneath the agent: the product's 12px line scaled to
 *  the title's 19px — the two share one slot — this far under the agent's
 *  edge. */
const TRACE_SCALE = 19 / 12;
const TRACE_GAP = 26;
const TRACE_LEAD = 0.2;
/** The one spot beneath the agent: the trace line's slot. */
const SLOT_TOP = LINE_Y + AGENT_R + TRACE_GAP;
/** The narration above the agent, and the stream: one line at a time. */
const TITLE_TOP = LINE_Y - AGENT_R - 62;
type AgentLook = { frame: Frame; face: string };
/** A bare face has no disc: the disc fades out as the face fades in, and
 *  back as it goes — the library's frame, with its disc's ink made to
 *  follow the face. Its satellites go with the disc: the library parks
 *  them under it at rest, and a mark with a gap in it would show them. */
function bare(look: AgentLook): AgentLook {
  if (!BARE.has(look.face)) return look;
  const a = Math.max(0, 1 - look.frame.avatarO);
  const fill = look.frame.blob.fill.replace(/^rgb\((.*)\)$/, `rgba($1, ${a})`);
  const sats = look.frame.sats.map((dot) => ({ ...dot, o: dot.o * a }));
  return { ...look, frame: { ...look.frame, sats, blob: { ...look.frame.blob, fill } } };
}
/** The camera: how far in it is on the indicator when the interface starts
 *  to build, and how long the pull-back takes. */
const ZOOM = INDICATOR_PX / INDICATOR_SMALL;
const ZOOM_OUT = 1.2;
/** The agent at rest — the library's Orbit v2 with the face landed: the
 *  frame its animation ends on. */
const AGENT_FRAME = INDICATOR.morph(INDICATOR.morphMs);
/** Where the face has landed on the library's clock. */
const FACE_AT = TYPE_MS + INDICATOR.morphMs;
const noop = () => {};

/** A hard pop: overshoots to 1.18 and settles. */
const pop = (p: number) => {
  const s = 2.4;
  const q = clamp01(p) - 1;
  return q * q * ((s + 1) * q + s) + 1;
};

/** The agent at `vt`: Tadao at rest; through the trace, becoming each of
 *  CHAIN in turn on the agents' clock (agents.ts); from `indicator`,
 *  /the-library's animation, `cycleFrame`, played backwards from the face
 *  — the morph in reverse, the face spinning out into three dots — and on
 *  into its typing wave, which carries until the composer takes over. One
 *  animation, reversed. */
function agentAt(vt: number, T: Timing): AgentLook {
  if (vt >= T.indicator) {
    const c = FACE_AT - (vt - T.indicator) * 1000;
    if (c >= 0) return { frame: cycleFrame(INDICATOR, c).frame, face: FACES.tadao };
    // Past the start of the loop: the wave is periodic, keep it going.
    return { frame: typingFrame(((c % WAVE_MS) + WAVE_MS) % WAVE_MS + WAVE_MS, 1), face: FACES.tadao };
  }
  const k = swapIndex(vt, T);
  if (k == null) return { frame: AGENT_FRAME, face: faceLanded(vt, T) };
  const u = (vt - becomingAt(T, k)) * 1000;
  const from = k === 0 ? FACES.tadao : FACES[CHAIN[k - 1].face];
  const to = FACES[CHAIN[k].face];
  const via = CHAIN[k].via;
  if (u < RESET_MS) return { frame: resetFrame(u), face: from };
  if (u < RESET_MS + WAVE_MS) return { frame: typingFrame(u - RESET_MS, Math.min(1, (u - RESET_MS) / 250)), face: to };
  return { frame: via.morph(u - RESET_MS - WAVE_MS), face: to };
}
/** Which becoming `vt` is in, if any. */
function swapIndex(vt: number, T: Timing): number | null {
  for (let k = 0; k < CHAIN.length; k += 1) if (vt >= becomingAt(T, k) && vt < faceAt(T, k)) return k;
  return null;
}
/** Whose face the agent wears at `vt`, between becomings: the last to have landed. */
function faceLanded(vt: number, T: Timing): string {
  for (let k = CHAIN.length - 1; k >= 0; k -= 1) if (vt >= faceAt(T, k)) return FACES[CHAIN[k].face];
  return FACES.tadao;
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
    const faces = [...new Set([...Object.values(CAST).map((actor) => actor.avatar), AGENT.avatar, "/avatars/jordan.png", ...Object.values(FACES)])];
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
  const [indicator, setIndicator] = useState<AgentLook | null>(null);
  const [valueOn, setValueOn] = useState(false);

  const groundRef = useRef<HTMLDivElement>(null);
  const pageGroundRef = useRef<HTMLDivElement>(null);
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
  const traceRef = useRef<HTMLDivElement>(null);
  const valueLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const valueItemRefs = useRef<Array<Array<HTMLSpanElement | null>>>([]);
  const title0Ref = useRef<HTMLDivElement>(null);
  const titleBRef = useRef<HTMLDivElement>(null);
  const titleARef = useRef<HTMLDivElement>(null);
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
    let valueShown = false;

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
      const trace = traceRef.current;
      if (!ground || !film || !camera || !card || !content || !sidebar || !main || !header || !transcript || !composer || !indicatorEl || !trace) return;

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
      if (pageGroundRef.current) pageGroundRef.current.style.opacity = `${winP}`;
      const side = ease(seg(vt, T.sidebar, 0.35));
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

      // The film opens on a push in to the cloud, and leaves for the logo.
      const pushIn = lerp(0.94, 1, ease(seg(vt, 0, T.line)));
      const out = ease(seg(vt, T.logo, 0.55));
      film.style.opacity = `${1 - out}`;
      film.style.transform = `scale(${pushIn - 0.02 * out})`;
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
      // The composer is in place well before the pull-back lands the dots on it.
      const slide = ease(seg(vt, T.iface + 0.05, 0.5));
      const composerTop = lerp(cardH + 12, bottomTop, slide);
      composer.style.top = `${composerTop}px`;
      transcript.style.top = `${headerH}px`;
      // The typing slot only takes room while someone is typing (the product's own rule).
      transcript.style.bottom = `${composerH + (typingShown ? STRIP_H : 8)}px`;

      /* ── Rows ──────────────────────────────────────────────────── */
      // Every row comes in from the bottom: its slot opens from the
      // composer's edge upward, pushing the rows above it up, while it
      // rises into the slot.
      let chatIndex = 0;
      ROWS.forEach((row, i) => {
        const refs = rowRefs.current[i];
        if (!refs.wrap || !refs.inner) return;
        let at: number;
        if (row.lands === "chat") {
          at = T.chat + CHAT_LEAD + chatIndex * CHAT_STAGGER;
          chatIndex += 1;
        } else {
          at = T.reply;
        }
        const p = ease(seg(vt, at, 0.45));
        refs.wrap.style.height = `${rowH[i] * p}px`;
        refs.inner.style.opacity = `${p}`;
        refs.inner.style.transform = `translateY(${14 * (1 - p)}px)`;
      });

      /* ── The agent and the camera ──────────────────────────────── */
      // The agent is /the-library's agent typing indicator, untouched: its
      // own avatar, its own animation, at INDICATOR_PX. It forms at centre
      // stage out of the dots, the stream pours into it, the trace reads
      // beneath it; at `indicator` its animation plays backwards — the face
      // spins out into the dots — and the moment it lands on them the
      // interface starts: the camera is already in on the dots — the same
      // size on screen — and pulls back while the window builds around
      // them; when the pull ends they are exactly the composer's own, and
      // hand over.
      const field = fieldAt(T, vt);
      // The trace line: centred beneath the agent, it rises in and narrates
      // the run; at `collapse` it sinks back into the agent.
      const drawn = ease(seg(vt, T.trace + TRACE_LEAD, 0.4)) * (1 - ease(seg(vt, T.collapse, 0.3)));
      const ax = AGENT_X;
      const ay = LINE_Y;
      trace.style.left = `${ax - (VALUE_SLOT_W * TRACE_SCALE) / 2}px`;
      trace.style.top = `${SLOT_TOP}px`;
      trace.style.opacity = `${drawn}`;
      trace.style.transform = `translateY(${(1 - drawn) * -10}px) scale(${TRACE_SCALE})`;
      // The slot: each line rolls up into place on its beat and tips away
      // when the next one comes — the banner's reel, on the film's clock.
      // Each line's pile pops in item by item once the line has landed, and
      // the agent gives a small nod as every step arrives.
      const valueSteps = valuePhasesFor(T).steps;
      let nod = 0;
      valueLineRefs.current.forEach((line, i) => {
        if (!line) return;
        const step = valueSteps[i];
        const next = valueSteps[i + 1];
        const roll = ease(seg(vt, step.t, 0.5));
        const gone = next ? ease(seg(vt, next.t, 0.38)) : 0;
        line.style.opacity = `${roll * (1 - gone)}`;
        line.style.transform = `translate(-50%, ${lerp(24, 0, roll) - 18 * gone}px) rotateX(${lerp(-42, 0, roll) + 42 * gone}deg)`;
        nod += Math.sin(Math.PI * seg(vt, step.t, 0.4));
        (valueItemRefs.current[i] ?? []).forEach((item, j) => {
          if (!item) return;
          const p = pop(seg(vt, step.t + 0.3 + j * 0.09, 0.3));
          item.style.opacity = `${clamp01(p * 2)}`;
          item.style.transform = `scale(${p})`;
        });
      });
      // The agent forms out of the particles: it grows inside the disc
      // as the disc tightens onto it, and settles with a little overshoot
      // as the last of them are taken in.
      const appear = pop(seg(vt, T.agent - 0.35, 0.45));
      const zoomed = vt >= T.iface;
      const zp = smooth(seg(vt, T.iface, ZOOM_OUT));
      // Where the composer's own indicator draws its middle dot: the strip
      // sits 3px above the box, its dots 4px in from the 16px inset on a
      // 6px pitch — the middle one 28px in, 19.4px up from the box.
      // Measured against the rendered TypingIndicator with the camera at
      // rest (it must be at rest — mid pull-back the numbers lie).
      const P = { x: CARD.x + 28, y: cardY + bottomTop - 19.4 };
      const C = { x: ax, y: ay };
      const z = zoomed ? lerp(ZOOM, 1, zp) : 1;
      const S = zoomed ? { x: lerp(C.x, P.x, zp), y: lerp(C.y, P.y, zp) } : P;
      camera.style.transform = `translate(${S.x - z * P.x}px, ${S.y - z * P.y}px) scale(${z})`;
      const at = zoomed ? P : C;
      // Eating has a body to it: every swallow is a small gulp — a squash
      // and a recoil toward the stream — and when the line is empty the
      // agent settles with one satisfied bounce.
      const gulp = Math.min(1, field.pulse);
      const full = field.fullAt == null ? 0 : Math.sin(Math.PI * seg(vt, field.fullAt + 0.05, 0.5));
      // Between beats the agent breathes, barely.
      const breathe = vt >= T.agent && vt < T.iface ? 0.012 * Math.sin(vt * Math.PI) : 0;
      const size = zoomed ? INDICATOR_SMALL : INDICATOR_PX * appear * (1 + 0.05 * Math.min(1, nod)) * (1 + 0.1 * full) * (1 + breathe);
      const sx = zoomed ? 1 : 1 + 0.07 * gulp;
      const sy = zoomed ? 1 : 1 - 0.05 * gulp;
      indicatorEl.style.left = `${at.x - INDICATOR_PX / 2}px`;
      indicatorEl.style.top = `${at.y - INDICATOR_PX / 2}px`;
      indicatorEl.style.transform = `translate(${zoomed ? 0 : 3 * gulp}px, 0) scale(${(size / INDICATOR_PX) * sx}, ${(size / INDICATOR_PX) * sy})`;
      // Visible from the moment it starts to grow inside the disc.
      indicatorEl.style.opacity = `${clamp01(seg(vt, T.agent - 0.35, 0.12)) * (1 - ease(seg(vt, T.iface + ZOOM_OUT - 0.1, 0.25)))}`;

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
      // The trace lines read whole seconds off this; a tenth is plenty.
      const valueLive = vt >= T.trace - 0.05 && vt < T.collapse + 0.4;
      if (valueLive !== valueShown) {
        valueShown = valueLive;
        setValueOn(valueLive);
      }
      const coarse = run === 0 ? 0 : Math.floor(vt * 10) / 10;
      if (coarse !== traceVtShown) {
        traceVtShown = coarse;
        setTraceVt(coarse);
      }
      // The agent's frame: at rest until `indicator` (one frame, no churn),
      // then the library's animation, reversed, at 60 a second — the film's
      // own rate; 30 read as choppy beside it.
      // Each becoming is its own run of ticks; a face at rest is one tick per face.
      const chainTick = () => {
        const k = swapIndex(vt, T);
        if (k == null) return -1 - CHAIN.findIndex((step) => FACES[step.face] === faceLanded(vt, T)) - 1;
        return 1000 + k * 10 + Math.floor((vt - becomingAt(T, k)) * 60) / 1000;
      };
      const tick = vt < T.agent - 0.4 || vt >= T.iface + ZOOM_OUT + 0.3 ? null : vt < T.indicator ? chainTick() : Math.floor((vt - T.indicator) * 60) / 60;
      if (tick !== indicatorShown) {
        indicatorShown = tick;
        setIndicator(tick == null ? null : bare(agentAt(vt, T)));
      }

      /* ── Titles ────────────────────────────────────────────────── */
      const fadeIn = (el: HTMLElement | null, on: number, off: number, rise = 6) => {
        if (!el) return;
        const a = ease(seg(vt, on, 0.5));
        const b = 1 - ease(seg(vt, off, 0.35));
        el.style.opacity = `${a * b}`;
        el.style.transform = `translate(-50%, ${rise * (1 - a)}px)`;
      };
      fadeIn(title0Ref.current, 0.3, T.gather - 0.1);
      // The narration, one line at a time in one spot above the agent: a
      // sentence across the film — context is everywhere, agents need all of
      // it, whichever agent you use, so we built one place for it.
      fadeIn(titleBRef.current, T.agent + 0.35, becomingAt(T, 0) - 0.25);
      fadeIn(titleARef.current, becomingAt(T, 0) + 0.2, T.collapse - 0.2);
      fadeIn(title2Ref.current, T.iface + ZOOM_OUT - 0.3, T.chat + 0.9);

      /* ── The canvas: the dots ──────────────────────────────────── */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, STAGE.w, STAGE.h);
      ctx.fillStyle = DOT_INK;
      ctx.strokeStyle = DOT_INK;
      ctx.lineCap = "round";
      for (const dot of field.marks) {
        ctx.globalAlpha = dot.a;
        if (dot.sx && Math.abs(dot.sx) > 0.5) {
          // A pouring dot is a streak: its trail is where it just was.
          ctx.lineWidth = 2 * dot.r;
          ctx.beginPath();
          ctx.moveTo(dot.x + dot.sx, dot.y);
          ctx.lineTo(dot.x, dot.y);
          ctx.stroke();
          continue;
        }
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
  const valuePhases = valuePhasesFor(timing);

  return (
    <div className="cs-stage relative w-screen overflow-hidden bg-white text-ando-fg-primary" style={{ height: `calc(100dvh - ${STUDIO_CLEARANCE}px)` }}>
      {/* The ground, edge to edge — the stage's own copy of it rides inside the camera. */}
      <div ref={pageGroundRef} className="absolute inset-0 bg-ando-bg-nav" style={{ opacity: 0 }} />
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden"
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
                <Sidebar scene={ROOM} sections={SIDEBAR_FILM} loose={[]} />
              </div>
              <div ref={mainRef} className="absolute bottom-0 right-0 top-0 overflow-hidden" style={{ width: PANE_W }}>
                <div ref={headerRef} data-cs="header" className="absolute left-0 right-0 top-0" style={{ opacity: 0 }}>
                  <ConversationHeader scene={ROOM} jamControl={<JamHeaderControl active={false} participants={[CAST[ME]]} onClick={noop} />} />
                </div>
                <div ref={transcriptRef} data-cs="transcript" className="absolute left-0 right-0 flex flex-col justify-end overflow-hidden pb-1" style={{ top: 44, bottom: 148 }}>
                  {ROWS.map((row, i) => (
                    <div
                      key={row.key}
                      data-row={row.key}
                      ref={(el) => { rowRefs.current[i].wrap = el; }}
                      className="relative shrink-0 overflow-hidden"
                      style={{ height: 0 }}
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

            {/* The trace line beneath the agent — the product's trace line, scaled to the title. No data-cs: its shimmer and pops are its own. */}
            <div ref={traceRef} data-trace className="absolute whitespace-nowrap" style={{ left: AGENT_X, top: LINE_Y, opacity: 0, transform: `scale(${TRACE_SCALE})`, transformOrigin: "0 0" }}>
              {valueOn ? <ValueLine agent={AGENT} participants={READ_FROM} steps={valuePhases.steps} lineRefs={valueLineRefs} itemRefs={valueItemRefs} /> : null}
            </div>
            {/* The agent: /the-library's typing indicator as its shelf renders it — its variant's avatar, at INDICATOR_PX — then the composer's own line. */}
            <div ref={indicatorRef} data-cs="indicator" className="absolute" style={{ opacity: 0, width: INDICATOR_PX, height: INDICATOR_PX, transformOrigin: "50% 50%" }}>
              {indicator ? <Stage frame={indicator.frame} size={INDICATOR_PX} avatarSrc={indicator.face} /> : null}
            </div>

            <div ref={title0Ref} data-cs="title-0" className="absolute left-1/2 whitespace-nowrap text-ando-fg-primary" style={{ top: STAGE.h / 2 - 20, opacity: 0, fontSize: 30, letterSpacing: -0.4, transform: "translate(-50%, 0)" }}>
              Context is everywhere.
            </div>
            <div ref={titleBRef} data-cs="title-b" className="absolute left-1/2 whitespace-nowrap text-ando-fg-primary" style={{ top: TITLE_TOP, opacity: 0, fontSize: 30, letterSpacing: -0.4, transform: "translate(-50%, 0)" }}>
              Agents need all of it.
            </div>
            <div ref={titleARef} data-cs="title-a" className="absolute left-1/2 whitespace-nowrap text-ando-fg-primary" style={{ top: TITLE_TOP, opacity: 0, fontSize: 30, letterSpacing: -0.4, transform: "translate(-50%, 0)" }}>
              Whichever agent you use.
            </div>
          </div>

          {/* Outside the camera, so the pull-back leaves it still. */}
          <div ref={title2Ref} data-cs="title-2" className="absolute left-1/2 whitespace-nowrap text-ando-fg-primary" style={{ top: CARD.y - 62, opacity: 0, fontSize: 30, letterSpacing: -0.4, transform: "translate(-50%, 0)" }}>
            So we built one place for it.
          </div>
        </div>

        <div ref={logoRef} data-cs="logo" className="absolute left-1/2 top-1/2" style={{ opacity: 0, transform: "translate(-50%, -50%)" }}>
          <Logo width={420} />
        </div>
      </div>
    </div>
  );
}
