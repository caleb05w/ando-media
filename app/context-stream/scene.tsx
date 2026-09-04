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
import { TYPE_MS, cycleFrame, typingFrame, type Frame } from "../agent-typing-experience/variants";
import { BARE, CHAIN, FACES, FACE_SCALE, FIRST_MORPH, becomingAt, faceAt } from "./agents";
import { readInks, swapLook } from "./swap";
import { Composer, ConversationHeader, Sidebar } from "../ando-stage/chrome";
import { JamHeaderControl } from "../ando-stage/jam";
import { CAST, ME, type Actor, type Scene as Room, type SidebarSection } from "../ando-stage/scenes";
import { LogoCard, TypeCard, driveTypeCard, easeInOut, glide, lineArrive, seatLogo, type TypeCardOn } from "../ando-stage/cards";
import { AGENT_R, AGENT_X, CARD, CARD_WIDE, INDICATOR, birthWaveMs, INDICATOR_PX, LINE_Y, PANE_W, SIDEBAR_W, STAGE, clamp01, ease, fieldAt, lerp, seg, smooth } from "./stream";
import type { Timing } from "./timing";
import { AGENT, CHAT_LEAD, CHAT_STAGGER, CODEX, READ_FROM, ROWS, RowView, runStart, tracePhasesFor, valuePhasesFor, type RunPhase } from "./transcript";
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
  const key = (Object.keys(FACES) as Array<keyof typeof FACES>).find((k) => FACES[k] === look.face);
  const faceScale = (look.frame.faceScale ?? 1) * ((key && FACE_SCALE[key]) ?? 1);
  return { ...look, frame: { ...look.frame, sats, faceScale, blob: { ...look.frame.blob, fill } } };
}
/** The camera: how far in it is on the indicator when the interface starts
 *  to build, and how long the pull-back takes. */
const ZOOM = INDICATOR_PX / INDICATOR_SMALL;
const ZOOM_OUT = 1.7;
/** Smootherstep: the pull-back's easing — flat at both ends, so the window builds without a lurch. */
/** The build's one curve — the camera's pull-back, the ground and card
 *  fading up, the composer's slide, the header, the sidebar: everything the
 *  interface is made of moves in and out on it, so no two parts fight. */
const build = (x: number) => { const q = clamp01(x); return q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2; };
/** How long someone's typing indicator shows before their line lands, and
 *  how long your own line takes to type itself into the composer. */
const PRE_TYPE = 0.7;
/** How long before the closer the window starts to recede (the stage's CARD_LEAD grammar). */
const CLOSER_LEAD = 2.4;
const SELF_TYPE = 0.8;
/** The wheel over the closer — the affiliate announcement's crest
 *  (affiliate-announcement/world-wheel.tsx: the Brand dot wheel, Figma
 *  3446-2571), on its numbers: 28 dots on a ring whose diameter is
 *  RING/DOT face-widths, the crest dot's centre DOT_CY of that down from
 *  the ring's top; faces upright while it turns; the spin drifts up to
 *  speed and freewheels as the camera pushes in, then the ring lets go —
 *  the gaps widen, every dot dissolves — its whole life scaled to the
 *  closer's hold. Everyone rides: the people, the agents, Tadao. */
const WHEEL = {
  dots: 28, face: 64, ring: 288.23, dot: 11.52, crestCy: 5.875,
  // the zoom — small dots ≈ face/7.7; the push starts with the spin
  max: 7.7, zoomFrom: 0.05,
  // the spin
  spinUpTo: 0.3, start: 0.04, peak: 0.24, floor: 0.02, friction: 3,
  // the departure — the ring starts letting go at 0.55 of the sweep; gaps
  // widen by 0.35; the spin drains only to a 0.35 cruise, never to zero
  departFrom: 0.55, spreadK: 0.35, tailFlow: 0.35, easePow: 2.2,
  // the announcement's own life is sweep 3 + exit 0.37; here it is scaled
  // to the closer's hold, so the ring is gone as the logo cuts in
  sweepShare: 3 / 3.37,
  bandAnchor: 220,
} as const;
const WHEEL_SECTOR = 360 / WHEEL.dots;
/** The wheel over the closer — off for now (Caleb, 2026-09-04); the code stays for when it comes back. */
const WHEEL_ON = false;
/** How far above the closer's line the crest sits (px, viewport). */
const WHEEL_CREST_ABOVE = 220;
// A message lands in one quick rise — the product's own send feel, not a slow reveal.
const ROW_IN = 0.3;
/** The ring: the people in the room, the agents, Tadao. Laid out the wheel's
 *  way — a fixed stride through the roster per dot, coprime with its length,
 *  so a face's twin is a full roster away, never beside it. (Scout wears
 *  Tadao's bubble, so only Tadao rides.) */
const WHEEL_ROSTER = [CAST.sara.avatar, CAST.caleb.avatar, CAST.oli.avatar, CAST.aj.avatar, CAST.alex.avatar, AGENT.avatar, FACES.grok, FACES.claude, FACES.codex];
const WHEEL_STRIDE = 4;
const wheelFace = (i: number) => WHEEL_ROSTER[(i * WHEEL_STRIDE) % WHEEL_ROSTER.length];
/** The marks that are not discs of their own ride on one. */
const WHEEL_DISC = new Set<string>([FACES.claude, FACES.codex]);
const wheelEase = (p: number) => 1 - (1 - p) ** WHEEL.easePow;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const foldDeg = (deg: number) => {
  const d = ((deg % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
};
/** rev/s at `h` of the ring's life — the announcement's speedAt. */
function wheelSpeed(h: number) {
  if (h < WHEEL.spinUpTo) {
    const u = h / WHEEL.spinUpTo;
    return WHEEL.start + (WHEEL.peak - WHEEL.start) * u * u;
  }
  const u = (h - WHEEL.spinUpTo) / (1 - WHEEL.spinUpTo);
  return WHEEL.floor + (WHEEL.peak - WHEEL.floor) * Math.exp(-WHEEL.friction * u);
}
/** The announcement's vAt: the shared zoom, 1/max → 1 over the ring's life. */
const wheelZoom = (h: number) => (1 + (WHEEL.max - 1) * smoothstep(WHEEL.zoomFrom, 1, h)) / WHEEL.max;
/** Degrees turned at `h` of the ring's life (E seconds long): the momentum
 *  integral, easing down to the cruise just before the sweep ends and
 *  flowing on through the fade — the announcement's angle table. */
function wheelAngle(h: number, E: number, sweep: number) {
  const steps = 64;
  const stopFrom = Math.max(0, (sweep - 0.1) / E);
  const end = clamp01(h);
  const dh = end / steps;
  let deg = 0;
  for (let i = 0; i < steps; i += 1) {
    const x = (i + 0.5) * dh;
    const stopper = 1 - (1 - WHEEL.tailFlow) * smoothstep(stopFrom, 1, x);
    deg += wheelSpeed(x) * stopper * dh * E * 360;
  }
  return deg;
}
/** The ring's whole life over the closer: sweep + exit = the hold. */
function wheelLife(T: Timing) {
  const E = T.logo - T.closer;
  const sweep = E * WHEEL.sweepShare;
  const departAt = sweep * WHEEL.departFrom;
  return { E, sweep, departAt, tau: (sweep - departAt) / (E - departAt) };
}
/** The closer: the stage's type card, one line, the white washing up under
 *  it over WASH_LEAD (the stage's own), held for the logo to cut in over.
 *  Once the line has landed, its last word rolls in the slot — teammates
 *  becomes agents — the reel the trace line under the agent rolls on. */
const CLOSER_LINE = "One interface. All your teammates";
const CLOSER_ROLL_TO = "agents";
/** How long the landed line is read before the last word rolls. */
const CLOSER_ROLL_AFTER = 0.7;
/** The closer's exit: a quick fade before the logo cuts in over it. */
const CLOSER_OUT = 0.3;
const WASH_LEAD = 0.4;
const closerCard = (T: Timing): TypeCardOn => {
  const words = CLOSER_LINE.split(" ");
  const hold = Math.max(0.5, T.logo - T.closer);
  return { key: "closer", lines: [words], starts: [0], ends: [hold], t: T.closer, hold, faces: [], roll: { line: 0, word: words.length - 1, to: CLOSER_ROLL_TO, at: lineArrive(words.length) + CLOSER_ROLL_AFTER } };
};
/** The agent at rest — the library's Orbit v2 with the face landed: the
 *  frame its animation ends on. */
const AGENT_FRAME = INDICATOR.morph(INDICATOR.morphMs);
/** Where the face has landed on the library's clock. */
const FACE_AT = TYPE_MS + INDICATOR.morphMs;
const noop = () => {};

/** A hard pop: overshoots to 1.18 and settles. */
/** The trace line's slot: an item is up in SLOT_IN, the one before is gone in SLOT_OUT. */
const SLOT_IN = 0.45;
const SLOT_OUT = 0.32;
const pop = (p: number) => {
  const s = 2.4;
  const q = clamp01(p) - 1;
  return q * q * ((s + 1) * q + s) + 1;
};

/** The agent at `vt`: born as the typing dots, waving, phased so the first
 *  morph starts on a wave's beat; through the trace, becoming each of
 *  CHAIN in turn on the agents' clock (agents.ts); from `indicator`,
 *  /the-library's animation, `cycleFrame`, played backwards from the last
 *  face — the morph in reverse, the face spinning out into three dots —
 *  and on into its typing wave, which carries until the composer takes
 *  over. One animation, reversed. */
const LAST_FACE = FACES[CHAIN[CHAIN.length - 1].face];
function agentAt(vt: number, T: Timing): AgentLook {
  if (vt >= T.indicator) {
    const c = FACE_AT - (vt - T.indicator) * 1000;
    if (c >= TYPE_MS) return { frame: cycleFrame(INDICATOR, c).frame, face: LAST_FACE };
    return { frame: handoverWave(vt, T), face: LAST_FACE };
  }
  if (vt < becomingAt(T, 0)) return { frame: typingFrame(birthWaveMs(T, vt), 1), face: FACES[CHAIN[0].face] };
  const k = swapIndex(vt, T);
  if (k == null) return { frame: AGENT_FRAME, face: faceLanded(vt, T) };
  if (k === 0) return { frame: FIRST_MORPH.morph((vt - becomingAt(T, 0)) * 1000), face: FACES[CHAIN[0].face] };
  // A change of face, in the typing indicator's own language (swap.ts):
  // the mark comes apart into the dots, they type, the next mark gathers.
  return swapLook((vt - becomingAt(T, k)) * 1000, CHAIN[k - 1].face, CHAIN[k].face);
}
/** The composer's own indicator (ando-stage/typing.tsx): each dot on a
 *  0.9s cycle from rest, the first 30ms after mount, each next 190ms
 *  behind the one before (delayChildren 0.03 + stagger 0.05 + its own
 *  0.14). */
const PRODUCT_DOT_DELAY = { first: 30, step: 190 };
/** When the composer's indicator mounts under the agent's dots: the end of
 *  the pull-back, a breath before the agent's dots fade. Not before — the
 *  room is not typing yet. */
const handoverAt = (T: Timing) => T.iface + ZOOM_OUT - 0.05;
/** Once the face has spun out into the dots, the dots keep the library's
 *  wave through the pull-back, settle to rest in the last 0.3s before the
 *  handover — the composer's indicator starts from rest — and from the
 *  handover run on the composer's own clock, so the two are one and the
 *  fade between them is invisible. */
function handoverWave(vt: number, T: Timing): Frame {
  const ms = (vt - handoverAt(T)) * 1000;
  const settle = smooth(clamp01((ms + 300) / 300));
  // typingFrame puts dot i at phase (ms + 150·(1 − i)); ask it for the phase we want.
  const at = (i: number, phase: number) => {
    const f = typingFrame(phase - 150 * (1 - i), 1);
    return i === 1 ? f.blob : f.sats[i === 0 ? 0 : 1];
  };
  const dot = (i: number) => {
    if (ms >= 0) return at(i, Math.max(0, ms - PRODUCT_DOT_DELAY.first - PRODUCT_DOT_DELAY.step * i));
    const wave = at(i, (vt - T.iface) * 1000 + 150 * (1 - i));
    const rest = at(i, 0);
    const ink = (fill: string) => fill.match(/\d+/g)?.map(Number) ?? [88, 82, 78];
    const a = ink(wave.fill);
    const b = ink(rest.fill);
    return { ...wave, y: lerp(wave.y, rest.y, settle), r: lerp(wave.r, rest.r, settle), fill: `rgb(${Math.round(lerp(a[0], b[0], settle))}, ${Math.round(lerp(a[1], b[1], settle))}, ${Math.round(lerp(a[2], b[2], settle))})` };
  };
  const d0 = dot(0);
  const d1 = dot(1);
  const d2 = dot(2);
  return { sats: [{ ...d0, o: 1 }, { ...d2, o: 1 }], blob: d1, avatarO: 0 };
}
/** Which becoming `vt` is in, if any. */
function swapIndex(vt: number, T: Timing): number | null {
  for (let k = 0; k < CHAIN.length; k += 1) if (vt >= becomingAt(T, k) && vt < faceAt(T, k)) return k;
  return null;
}
/** Whose face the agent wears at `vt`, between becomings: the last to have landed. */
function faceLanded(vt: number, T: Timing): string {
  for (let k = CHAIN.length - 1; k >= 0; k -= 1) if (vt >= faceAt(T, k)) return FACES[CHAIN[k].face];
  return FACES[CHAIN[0].face];
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
  const [typing, setTyping] = useState<Actor[] | null>(null);
  const [scripted, setScripted] = useState<string | null>(null);
  const [traceVt, setTraceVt] = useState(0);
  const [indicator, setIndicator] = useState<AgentLook | null>(null);
  const [valueOn, setValueOn] = useState(false);
  const [logoOn, setLogoOn] = useState(false);
  const [closerOn, setCloserOn] = useState(false);
  const wheelBandRef = useRef<HTMLDivElement>(null);
  const wheelRingRef = useRef<HTMLDivElement>(null);
  const wheelDotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const wheelDiscRefs = useRef<Array<HTMLDivElement | null>>([]);
  const washRef = useRef<HTMLDivElement>(null);

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
  // Each mark's ink, read off its image once — the colour its dots turn
  // as it gathers (swap.ts).
  useEffect(() => {
    readInks();
  }, []);
  const traceRef = useRef<HTMLDivElement>(null);
  const valueLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const valueItemRefs = useRef<Array<Array<HTMLSpanElement | null>>>([]);
  const title0Ref = useRef<HTMLDivElement>(null);
  const titleBRef = useRef<HTMLDivElement>(null);
  const title2Ref = useRef<HTMLDivElement>(null);
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
    let typingShown = "";
    let scriptedShown: string | null = null;
    let logoShown = false;
    let closerShown = false;
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
      // The white card and the grey ground fade in from nothing over the
      // whole pull-back on the build's curve; the composer — what the dots
      // land on — comes in on the same curve, early and quick.
      const winP = build(seg(vt, T.iface, ZOOM_OUT));
      ground.style.opacity = `${winP}`;
      if (pageGroundRef.current) pageGroundRef.current.style.opacity = `${winP}`;
      const side = build(seg(vt, T.sidebar, 0.6));
      const cardX = lerp(CARD.x, CARD_WIDE.x, side);
      const cardW = lerp(CARD.w, CARD_WIDE.w, side);
      const cardY = CARD.y;
      const cardH = CARD.h;
      // ...and in the lead before the closer the whole window recedes the way
      // the stage's does before a type card: a soft blur and a step back to
      // 0.96, no dimming — the room keeps talking while it lets go, and the
      // white washes up over it in the last WASH_LEAD.
      const recede = easeInOut(seg(vt, T.closer - CLOSER_LEAD, CLOSER_LEAD));
      for (const el of [card, content]) {
        el.style.left = `${cardX}px`;
        el.style.top = `${cardY}px`;
        el.style.width = `${cardW}px`;
        el.style.height = `${cardH}px`;
        el.style.opacity = el === card ? `${winP}` : "1";
        el.style.transform = recede > 0 ? `scale(${1 - 0.04 * recede})` : "";
        el.style.filter = recede > 0 ? `blur(${8 * recede}px)` : "";
      }

      // The film opens on a push in to the cloud.
      const pushIn = lerp(0.94, 1, ease(seg(vt, 0, T.line)));
      film.style.transform = `scale(${pushIn})`;
      // ...and ends the way the Grok cut does: the white washes up over the
      // room, the closer's line arrives word by word and holds, and the
      // lockup cuts in over it and condenses (ando-stage/cards.tsx).
      const wash = washRef.current;
      if (wash) wash.style.opacity = `${ease(seg(vt, T.closer - WASH_LEAD, WASH_LEAD))}`;
      if (vt >= T.closer && vt < T.logo) {
        driveTypeCard(closerCard(T), vt - T.closer, true);
        // The line goes quickly, not abruptly: a short fade with a touch of
        // lift and blur in the last CLOSER_OUT before the logo cuts in.
        const typeCard = document.querySelector<HTMLElement>("[data-type-card]");
        if (typeCard) {
          const out = ease(seg(vt, T.logo - CLOSER_OUT, CLOSER_OUT));
          typeCard.style.opacity = `${1 - out}`;
          typeCard.style.transform = `translateY(${-8 * out}px)`;
          typeCard.style.filter = out > 0 ? `blur(${4 * out}px)` : "";
        }
        // The wheel: the announcement's pass — the crest of small faces
        // drifts up to speed as the camera pushes in, then the ring lets go:
        // the gaps widen and every dot dissolves on its own clock, the far
        // side first, the crest last, all gone as the logo cuts in.
        const local = vt - T.closer;
        const band = wheelBandRef.current;
        const ring = wheelRingRef.current;
        if (band && ring) {
          const { E, sweep, departAt, tau } = wheelLife(T);
          const h = clamp01(local / E);
          band.style.opacity = `${ease(seg(local, 0, 0.25))}`;
          band.style.visibility = local >= E ? "hidden" : "visible";
          const D = WHEEL.face * (WHEEL.ring / WHEEL.dot);
          const baseR = D / 2;
          const a = wheelAngle(h, E, sweep);
          const vz = wheelZoom(h);
          ring.style.transform = `translateY(${baseR * vz}px) rotate(${a}deg) scale(${vz})`;
          const dp = clamp01((local - departAt) / (E - departAt));
          const spread = 1 + WHEEL.spreadK * wheelEase(dp);
          // The departure is measured from the crest as the sweep ends.
          const aSwap = wheelAngle(sweep / E, E, sweep);
          const crestDot = ((WHEEL.dots - Math.round(aSwap / WHEEL_SECTOR)) % WHEEL.dots + WHEEL.dots) % WHEEL.dots;
          const thM = foldDeg(a + crestDot * WHEEL_SECTOR);
          for (let i = 0; i < WHEEL.dots; i += 1) {
            const dot = wheelDotRefs.current[i];
            const disc = wheelDiscRefs.current[i];
            if (!dot || !disc) continue;
            const ang = ((((i * WHEEL_SECTOR + aSwap) % 360) + 360) % 360);
            const remote = Math.min(ang, 360 - ang) / 180;
            const thNew = thM + foldDeg(foldDeg(a + i * WHEEL_SECTOR) - thM) * spread;
            const pe = wheelEase(clamp01((dp - tau * (1 - remote)) / (1 - tau)));
            dot.style.transform = `rotate(${thNew - a}deg) translateY(${-(baseR - (WHEEL.crestCy / WHEEL.ring) * D)}px)`;
            dot.style.opacity = `${1 - pe}`;
            disc.style.transform = `rotate(${-thNew}deg)`;
          }
        }
      }
      if (vt >= T.logo) seatLogo(vt - T.logo);

      /* ── The sidebar ───────────────────────────────────────────── */
      sidebar.style.transform = `translateX(${-SIDEBAR_W * (1 - side)}px)`;
      sidebar.style.opacity = `${side}`;
      main.style.boxShadow = side > 0 ? "-1px 0 0 var(--color-ando-border-default)" : "none";

      /* ── The header and the composer's slide ───────────────────── */
      const chatP = build(seg(vt, T.chat, 0.8));
      header.style.transform = `translateY(${-headerH * (1 - chatP)}px)`;
      header.style.opacity = `${chatP}`;

      const bottomTop = cardH - composerH;
      // The composer is in place well before the pull-back lands the dots on it.
      const slide = build(seg(vt, T.iface + 0.05, 0.7));
      const composerTop = lerp(cardH + 12, bottomTop, slide);
      composer.style.top = `${composerTop}px`;
      composer.style.opacity = `${slide}`;
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
          at = T.reply + (row.after ?? 0);
        }
        const p = ease(seg(vt, at, ROW_IN));
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
        const items = valueItemRefs.current[i] ?? [];
        if (step.roll) {
          // The slot: the items roll through one spot, each up out of the
          // seat below as the one before tips away above, the slot's width
          // going with them so the line stays centred — the reel's own.
          const t0 = step.t + 0.3;
          const every = step.roll;
          const widths = items.map((item) => item?.offsetWidth ?? 0);
          // The item on its way in, and how far: the slot's width glides
          // from the one before it to it on the same curve as the roll.
          const c = Math.max(0, Math.min(items.length - 1, Math.floor((vt - t0) / every)));
          const arriving = glide(seg(vt, t0 + c * every, SLOT_IN));
          const slot = line.querySelector<HTMLElement>("[data-slot]");
          if (slot) slot.style.width = `${lerp(widths[c - 1] ?? widths[c], widths[c], c === 0 ? 1 : arriving)}px`;
          items.forEach((item, j) => {
            if (!item) return;
            const up = glide(seg(vt, t0 + j * every, SLOT_IN));
            const away = j + 1 < items.length ? glide(seg(vt, t0 + (j + 1) * every, SLOT_OUT)) : 0;
            item.style.opacity = `${up * (1 - away)}`;
            item.style.transform = `translateY(${lerp(12, 0, up) - 10 * away}px) rotateX(${lerp(-42, 0, up) + 42 * away}deg)`;
          });
        } else {
          items.forEach((item, j) => {
            if (!item) return;
            const p = pop(seg(vt, step.t + 0.3 + j * 0.09, 0.3));
            item.style.opacity = `${clamp01(p * 2)}`;
            item.style.transform = `scale(${p})`;
          });
        }
      });
      // The agent forms out of the particles: the seeds have already made
      // its three balls (stream.ts birthBalls), so it arrives at full size —
      // the real balls fading in exactly over the clusters.
      const appear = 1;
      const zoomed = vt >= T.iface;
      const zp = build(seg(vt, T.iface, ZOOM_OUT));
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
      // Face to face: the mark comes apart into the typing dots and the next
      // mark gathers out of them — all in the agent's own frames (swap.ts).
      const size = zoomed ? INDICATOR_SMALL : INDICATOR_PX * appear * (1 + 0.05 * Math.min(1, nod)) * (1 + 0.1 * full) * (1 + breathe);
      const sx = zoomed ? 1 : 1 + 0.07 * gulp;
      const sy = zoomed ? 1 : 1 - 0.05 * gulp;
      indicatorEl.style.left = `${at.x - INDICATOR_PX / 2}px`;
      indicatorEl.style.top = `${at.y - INDICATOR_PX / 2}px`;
      indicatorEl.style.transform = `translate(${zoomed ? 0 : 3 * gulp}px, 0) scale(${(size / INDICATOR_PX) * sx}, ${(size / INDICATOR_PX) * sy})`;
      // In over the seeds as they go (stream.ts: the clusters hand over in a tenth of a second).
      indicatorEl.style.opacity = `${clamp01(seg(vt, T.agent - 0.08, 0.1)) * (1 - ease(seg(vt, T.iface + ZOOM_OUT - 0.1, 0.25)))}`;

      /* ── The discrete state — the only React state ─────────────── */
      const run: RunPhase = vt >= T.reply - 0.05 ? 2 : vt >= runStart(T) ? 1 : 0;
      if (run !== runShown) {
        runShown = run;
        setRunPhase(run);
      }
      // The composer's strip: Codex is typing from the moment the pull-back
      // lands on its dots, and in every gap — it never posts; the room is
      // still going when the closer comes. Everyone else types before they
      // post: their indicator for PRE_TYPE, then the line lands. You never
      // see your own — your line types itself into the composer instead.
      // Several can type at once — "Sara Du & Codex are typing..." — on one
      // strip that only changes when the set does.
      const typers: Actor[] = [];
      let scriptedNow: string | null = null;
      // The composer's indicator mounts at the handover, from rest, on the
      // same clock as the agent's dots — they hand over unseen.
      if (vt >= handoverAt(T) && vt < T.closer) {
        let chatI = 0;
        for (const row of ROWS) {
          const land = row.lands === "chat" ? T.chat + CHAT_LEAD + chatI * CHAT_STAGGER : T.reply + (row.after ?? 0);
          if (row.lands === "chat") chatI += 1;
          if (row.who === CAST[ME]) {
            const line = row.body[0].map((part) => part.text).join("");
            const typed = seg(vt, land - SELF_TYPE, SELF_TYPE);
            if (typed > 0 && vt < land) scriptedNow = line.slice(0, Math.ceil(typed * line.length));
            continue;
          }
          if (vt >= land - PRE_TYPE && vt < land) typers.push(row.who);
        }
        typers.push(CODEX);
      }
      if (scriptedNow !== scriptedShown) {
        scriptedShown = scriptedNow;
        setScripted(scriptedNow);
      }
      const typingKey = typers.map((a) => a.name).join("&");
      if (typingKey !== typingShown) {
        typingShown = typingKey;
        setTyping(typers.length > 0 ? typers : null);
      }
      const logoNow = vt >= T.logo;
      if (logoNow !== logoShown) {
        logoShown = logoNow;
        setLogoOn(logoNow);
      }
      const closerNow = vt >= T.closer && vt < T.logo;
      if (closerNow !== closerShown) {
        closerShown = closerNow;
        setCloserOn(closerNow);
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
      // The birth's wave and every becoming are runs of ticks; a face at
      // rest is one tick per face.
      const chainTick = () => {
        if (vt < becomingAt(T, 0)) return 900 + Math.floor((vt - T.agent + 1) * 60) / 1000;
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
      // "Context is everywhere." stays up through the cloud and the gathering
      // stream, and is gone before the line has formed (Caleb: not at 3.3).
      fadeIn(title0Ref.current, 0.3, T.line - 0.25);
      // The narration, one line at a time in one spot above the agent: a
      // sentence across the film — context is everywhere, to harness it we
      // built agents, so we built a place for them.
      fadeIn(titleBRef.current, T.agent + 0.3, becomingAt(T, 0) - 0.2);

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
                  <Composer scene={ROOM} typing={typing} onSend={noop} scripted={scripted} />
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

            <div ref={title0Ref} data-cs="title-0" className="absolute left-1/2 whitespace-nowrap text-ando-fg-primary" style={{ top: TITLE_TOP, opacity: 0, fontSize: 30, letterSpacing: -0.4, transform: "translate(-50%, 0)" }}>
              Context is everywhere.
            </div>
            <div ref={titleBRef} data-cs="title-b" className="absolute left-1/2 whitespace-nowrap text-ando-fg-primary" style={{ top: TITLE_TOP, opacity: 0, fontSize: 30, letterSpacing: -0.4, transform: "translate(-50%, 0)" }}>
              To harness it, we built agents.
            </div>
          </div>

          {/* Outside the camera, so the pull-back leaves it still. */}
          <div ref={title2Ref} data-cs="title-2" className="absolute left-1/2 whitespace-nowrap text-ando-fg-primary" style={{ top: CARD.y - 62, opacity: 0, fontSize: 30, letterSpacing: -0.4, transform: "translate(-50%, 0)" }}>
            So we built an interface around them.
          </div>
        </div>

      </div>
      {/* The white the closer sits on: up over the room in the last WASH_LEAD before it. */}
      <div ref={washRef} className="pointer-events-none fixed inset-0 z-[70] bg-white" style={{ opacity: 0 }} aria-hidden data-wash />
      {closerOn ? (
        <>
          {/* The wheel's band: the announcement's — nothing is sliced by its box, content dissolves into deep soft ramps (world-wheel.css .ww-band). */}
          {WHEEL_ON ? (
          <div
            ref={wheelBandRef}
            className="pointer-events-none fixed left-1/2 z-[75]"
            aria-hidden
            style={{
              top: `calc(50% - ${WHEEL_CREST_ABOVE + 220}px)`,
              width: 1240,
              height: 400,
              transform: "translateX(-50%)",
              opacity: 0,
              overflow: "hidden",
              maskImage: "linear-gradient(to right, transparent, #000 140px, #000 calc(100% - 140px), transparent), linear-gradient(to bottom, transparent, #000 150px, #000 calc(100% - 60px), transparent)",
              maskComposite: "intersect",
              WebkitMaskImage: "linear-gradient(to right, transparent, #000 140px, #000 calc(100% - 140px), transparent), linear-gradient(to bottom, transparent, #000 150px, #000 calc(100% - 60px), transparent)",
              WebkitMaskComposite: "source-in",
            }}
          >
            {(() => {
              const D = WHEEL.face * (WHEEL.ring / WHEEL.dot);
              const R = D / 2;
              const dotDrift = (WHEEL.crestCy / WHEEL.ring) * D;
              // The ring's untransformed centre sits on the crest line; the
              // driver pushes it down by radius × zoom so the top dot stays
              // pinned at the crest while the wheel grows beneath the band.
              const crest = WHEEL.bandAnchor - dotDrift;
              return (
                <div ref={wheelRingRef} style={{ position: "absolute", left: "50%", top: crest - R, width: D, height: D, marginLeft: -R, willChange: "transform" }}>
                  {Array.from({ length: WHEEL.dots }, (_, i) => {
                    const src = wheelFace(i);
                    const onDisc = WHEEL_DISC.has(src);
                    return (
                      <div key={i} ref={(el) => { wheelDotRefs.current[i] = el; }} style={{ position: "absolute", left: "50%", top: "50%", width: WHEEL.face, height: WHEEL.face, marginLeft: -WHEEL.face / 2, marginTop: -WHEEL.face / 2, transform: `rotate(${i * WHEEL_SECTOR}deg) translateY(${-(R - dotDrift)}px)` }}>
                        <div ref={(el) => { wheelDiscRefs.current[i] = el; }} className="size-full overflow-hidden rounded-full" style={{ transform: `rotate(${-i * WHEEL_SECTOR}deg)`, background: onDisc ? "#EFEDE8" : undefined }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className={onDisc ? "block size-full object-contain p-[18%]" : "block size-full object-cover"} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          ) : null}
          <TypeCard card={closerCard(timing)} />
        </>
      ) : null}
      {logoOn ? <LogoCard /> : null}
    </div>
  );
}
