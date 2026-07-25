"use client";

// /slack-sync-cards — interaction study for the post-Slack-sync "Wrapped"
// deck. Content is deliberately thin (one fact per card, placeholder copy);
// the subject here is how the deck FEELS to move through:
//
//   • Tap zones — left 25% back, rest forward (stories convention).
//   • Drag — cards track the pointer 1:1, commit past a distance or velocity
//     threshold, rubber-band at the two ends.
//   • Press-and-hold — pauses autoplay without advancing on release.
//   • Autoplay — per-card timer painting the progress segment in real time.
//   • Transition variants — Slide / Deck / Fade, switchable live so we can
//     argue about the feel with the same content under each.
//
// The HUD (top-left) exposes the variant switcher, autoplay, and the live
// gesture state so a reviewer can see which interaction fired.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import "./slack-sync-cards.css";

/* --------------------------------- content -------------------------------- */

type Card = {
  key: string;
  eyebrow: string;
  headline: string;
  sub: string;
  bg: string;
  fg: string;
  dim: string;
  accent: string;
};

const CARDS: Card[] = [
  {
    key: "cold",
    eyebrow: "Congrats on your Slack retirement!",
    headline: "You sent 2,847 messages.",
    sub: "Across 14 synced channels, from March 3 to June 1.",
    bg: "#1a1817",
    fg: "#faf9f7",
    dim: "rgba(250,249,247,0.6)",
    accent: "#fb923c",
  },
  {
    key: "agents",
    eyebrow: "Your supporting cast",
    headline: "You worked with 4 Slack agents.",
    sub: "Two AI agents, plus two automations doing their best.",
    bg: "#faf9f7",
    fg: "#1a1817",
    dim: "#78716c",
    accent: "#ea580c",
  },
  {
    key: "delegation",
    eyebrow: "Delegation behavior",
    headline: "You delegated 23 pieces of work.",
    sub: "68% was delegatable. That leaves a 45-point opportunity.",
    bg: "#2563eb",
    fg: "#ffffff",
    dim: "rgba(255,255,255,0.72)",
    accent: "#bfdbfe",
  },
  {
    key: "age",
    eyebrow: "Slack age",
    headline: "You Slack like a 26-year-old.",
    sub: "Short messages. Fast follow-ups. Punctuation optional.",
    bg: "#ea580c",
    fg: "#fff8f3",
    dim: "rgba(255,248,243,0.78)",
    accent: "#ffd7bd",
  },
  {
    key: "switching",
    eyebrow: "Context switching",
    headline: "You switched channels 6.4 times an hour.",
    sub: "Your attention had more tabs than your browser.",
    bg: "#f4f1ec",
    fg: "#1a1817",
    dim: "#78716c",
    accent: "#2563eb",
  },
  {
    key: "ghosted",
    eyebrow: "Asked and answered. Except not.",
    headline: "You were ghosted 17 times.",
    sub: "You asked a question. Nobody ever replied.",
    bg: "#0f0d0c",
    fg: "#f5f4f2",
    dim: "rgba(245,244,242,0.55)",
    accent: "#a8a29e",
  },
  {
    key: "final",
    eyebrow: "The final card",
    headline: "After 143 hours of Slacking, I’m finally retiring.",
    sub: "The Air-Traffic Controller. Everyone landed. Nobody saw you sweat.",
    bg: "#1a1817",
    fg: "#faf9f7",
    dim: "rgba(250,249,247,0.6)",
    accent: "#fb923c",
  },
];

/* ------------------------------- interaction ------------------------------ */

const VARIANTS = ["slide", "deck", "fade"] as const;
type Variant = (typeof VARIANTS)[number];

// Page and HUD share one easing so chrome never leads the background.
const THEME_MS = 520;
const THEME_EASE = "cubic-bezier(0.4,0,0.2,1)";
const THEME_TRANSITION = `background-color ${THEME_MS}ms ${THEME_EASE}, border-color ${THEME_MS}ms ${THEME_EASE}, color ${THEME_MS}ms ${THEME_EASE}`;

const CARD_MS = 5200; // autoplay dwell per card
const TAP_MAX_MS = 400; // longer press with no travel = hold, not tap
const DRAG_START_PX = 8; // travel before a press becomes a drag
const COMMIT_RATIO = 0.22; // fraction of width that commits the turn
const COMMIT_VELOCITY = 0.55; // px/ms flick that commits short of that distance
const FLICK_MIN_PX = 44; // ...but a flick still has to travel this far
const VELOCITY_MIN_DT = 8; // ms floor, so a coalesced jump isn't read as a rocket
const EDGE_RESIST = 0.32; // rubber-band factor past the first/last card
const SNAP_MS = 380;

// Where a card sits, given its offset from the current index (rel) plus the
// live drag progress (p, in card-widths). e === 0 means dead center.
function cardStyle(rel: number, p: number, variant: Variant): React.CSSProperties {
  const e = rel + p;
  const away = Math.abs(e);
  const z = 20 - Math.round(away * 10);

  if (variant === "slide") {
    return { transform: `translateX(${e * 100}%)`, opacity: 1, zIndex: z };
  }
  if (variant === "fade") {
    return {
      transform: `translateX(${e * 4}%) scale(${1 - Math.min(away, 1) * 0.06})`,
      opacity: Math.max(0, 1 - away * 1.15),
      zIndex: z,
    };
  }
  // deck — the outgoing card slides off and fades; the incoming one waits
  // behind it, scaled down, so the stack reads as depth not a filmstrip.
  // It stays fully opaque: the front card is a full-bleed surface that hides
  // it until the front card actually moves.
  if (e <= 0) {
    return {
      transform: `translateX(${e * 62}%) scale(${1 + e * 0.08})`,
      opacity: Math.max(0, 1 + e * 1.1),
      zIndex: z,
    };
  }
  return {
    transform: `translateX(${e * 8}%) scale(${1 - Math.min(e, 1) * 0.09})`,
    opacity: 1,
    zIndex: z,
  };
}

type Gesture = "idle" | "dragging" | "holding";

export default function SlackSyncCardsPage() {
  const [index, setIndex] = useState(0);
  const [variant, setVariant] = useState<Variant>("slide");
  const [autoplay, setAutoplay] = useState(true);
  const [progress, setProgress] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const [gesture, setGesture] = useState<Gesture>("idle");
  // Last interaction that moved the deck — shown in the HUD so a reviewer can
  // tell a committed drag from a tap.
  const [lastInput, setLastInput] = useState("—");
  // A card you dragged in is already on screen and read; replaying the line
  // stagger on arrival would flash it. Only non-drag arrivals animate.
  const [animateEnter, setAnimateEnter] = useState(true);

  // Stage width converts drag pixels into card-widths, so it's render data
  // (state) rather than a ref. Handlers measure the DOM directly instead.
  const [stageWidth, setStageWidth] = useState(1);

  const stageRef = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef(0);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const drag = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    startT: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
  });

  const atStart = index === 0;
  const atEnd = index === CARDS.length - 1;

  const go = useCallback((delta: number, source: string, animate = true) => {
    setIndex((i) => Math.max(0, Math.min(CARDS.length - 1, i + delta)));
    setProgress(0);
    elapsedRef.current = 0;
    setLastInput(source);
    setAnimateEnter(animate);
  }, []);

  // Release the drag: either commit the turn or spring back. Both paths ride
  // the same snap transition, so a rejected drag feels like the same object.
  const settle = useCallback(
    (commit: number, source: string) => {
      setSnapping(true);
      setDragX(0);
      // Report every release, including the ones that spring back — a drag
      // that refused to commit is exactly what a reviewer wants to see named.
      setLastInput(source);
      if (commit !== 0) go(commit, source, false);
      if (snapTimer.current != null) clearTimeout(snapTimer.current);
      snapTimer.current = setTimeout(() => setSnapping(false), SNAP_MS);
    },
    [go]
  );

  useEffect(() => () => {
    if (snapTimer.current != null) clearTimeout(snapTimer.current);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (stage == null) return;
    const observer = new ResizeObserver(([entry]) => {
      setStageWidth(entry.contentRect.width || 1);
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  /* --------------------------------- autoplay -------------------------------- */

  const paused = gesture !== "idle";

  useEffect(() => {
    if (!autoplay || paused || atEnd) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Clamp the frame delta: a backgrounded tab or a long stall would
      // otherwise bank seconds of "dwell" and skip cards on return.
      elapsedRef.current += Math.min(now - last, 50);
      last = now;
      if (elapsedRef.current >= CARD_MS) {
        elapsedRef.current = 0;
        setProgress(0);
        setIndex((i) => Math.min(CARDS.length - 1, i + 1));
        setLastInput("autoplay");
      } else {
        setProgress(elapsedRef.current / CARD_MS);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoplay, paused, atEnd, index]);

  /* -------------------------------- keyboard --------------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("a,button") != null && (e.key === "Enter" || e.key === " ")) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        go(1, "key →");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1, "key ←");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  /* --------------------------------- pointer --------------------------------- */

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("a,button,[data-stop]") != null) return;
    const stage = stageRef.current;
    if (stage == null) return;
    // Capture keeps the drag alive if the pointer leaves the stage. Guarded:
    // an unknown pointerId throws, and that must not kill the gesture.
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {}
    drag.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      startT: performance.now(),
      lastX: e.clientX,
      lastT: performance.now(),
      velocity: 0,
    };
    setSnapping(false);
    setGesture("holding");
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const now = performance.now();
    const dt = now - d.lastT;
    d.velocity = (e.clientX - d.lastX) / Math.max(dt, VELOCITY_MIN_DT);
    d.lastX = e.clientX;
    d.lastT = now;

    if (!d.moved) {
      // Vertical intent (page scroll on touch) shouldn't hijack the deck.
      if (Math.abs(e.clientY - d.startY) > Math.abs(dx) && Math.abs(e.clientY - d.startY) > DRAG_START_PX) {
        d.active = false;
        setGesture("idle");
        return;
      }
      if (Math.abs(dx) < DRAG_START_PX) return;
      d.moved = true;
      setGesture("dragging");
    }
    // Resist past the ends so the deck feels bounded, not broken.
    const overscrolling = (dx > 0 && atStart) || (dx < 0 && atEnd);
    setDragX(overscrolling ? dx * EDGE_RESIST : dx);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) {
      setGesture("idle");
      return;
    }
    d.active = false;
    const stage = stageRef.current;
    try {
      if (stage?.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    } catch {}
    setGesture("idle");

    if (!d.moved) {
      // No travel: a quick press is a tap; a long one was a pause. With
      // autoplay off there's nothing to pause, so a slow press is still a tap
      // rather than a dead press.
      const held = performance.now() - d.startT;
      if (held > TAP_MAX_MS && autoplay) {
        setLastInput("hold → resumed");
        return;
      }
      const rect = stage?.getBoundingClientRect();
      const back = rect != null && e.clientX - rect.left < rect.width * 0.25;
      go(back ? -1 : 1, back ? "tap (back zone)" : "tap (forward zone)");
      return;
    }

    const dx = e.clientX - d.startX;
    // Never divide the decision by an unmeasured stage: a 0-width fallback
    // would make every twitch clear the commit threshold.
    const width = Math.max(stage?.clientWidth ?? 0, stageWidth, 1);
    const far = Math.abs(dx) > width * COMMIT_RATIO;
    // A flick needs speed AND some travel — otherwise a fast twitch turns the card.
    const flicked = Math.abs(d.velocity) > COMMIT_VELOCITY && Math.abs(dx) > FLICK_MIN_PX;
    const wants = dx < 0 ? 1 : -1;
    const blocked = (wants === 1 && atEnd) || (wants === -1 && atStart);
    if ((far || flicked) && !blocked) {
      settle(wants, flicked && !far ? "flick" : "drag");
    } else {
      settle(0, blocked ? "drag (blocked at edge)" : "drag (returned)");
    }
  };

  /* ---------------------------------- render --------------------------------- */

  const card = CARDS[index];
  const p = dragX / stageWidth;
  const transition = snapping
    ? `transform ${SNAP_MS}ms cubic-bezier(0.22,1,0.36,1), opacity ${SNAP_MS}ms cubic-bezier(0.22,1,0.36,1)`
    : "none";

  return (
    <div
      className="relative h-dvh w-screen select-none overflow-hidden"
      style={{
        background: card.bg,
        color: card.fg,
        transition: THEME_TRANSITION,
        touchAction: "pan-y",
      }}
    >
      {/* Progress rail — the current segment fills in real time under autoplay. */}
      <div className="absolute inset-x-0 top-0 z-40 flex items-center gap-4 px-5 pt-4">
        <div
          className="flex flex-1 items-center gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={CARDS.length}
          aria-valuenow={index + 1}
        >
          {CARDS.map((c, i) => (
            <button
              key={c.key}
              type="button"
              aria-label={`Card ${i + 1}`}
              onClick={() => go(i - index, "progress jump")}
              className="h-[3px] flex-1 overflow-hidden rounded-full"
              style={{ background: "currentColor", opacity: i <= index ? 0.28 : 0.15 }}
            >
              <span
                className="block h-full rounded-full"
                style={{
                  background: "currentColor",
                  width: i < index ? "100%" : i === index ? `${(autoplay ? progress : 1) * 100}%` : "0%",
                  opacity: 0.9,
                }}
              />
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] leading-4 tabular-nums opacity-55">
          {index + 1} / {CARDS.length}
        </span>
        <Link href="/" aria-label="Exit report" className="text-[16px] leading-4 opacity-55 transition-opacity hover:opacity-100">
          ✕
        </Link>
      </div>

      {/* Interaction HUD — the point of this prototype. */}
      <div
        data-stop
        className="absolute left-5 top-12 z-40 flex flex-col gap-2 rounded-xl border px-3 py-2.5"
        // Panel sits on the card's own background so it reads as chrome,
        // hairline border in the card's foreground color.
        style={{ borderColor: card.fg, background: card.bg, opacity: 0.94, transition: THEME_TRANSITION }}
      >
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] opacity-55">Transition</span>
          {/* Explicit fg/bg, not currentColor: on the active chip `color` is
              the card background, so currentColor would paint it invisible. */}
          {VARIANTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVariant(v)}
              className="rounded-full px-2 py-0.5 font-mono text-[10px] capitalize leading-4 transition-opacity"
              style={{
                background: variant === v ? card.fg : "transparent",
                color: variant === v ? card.bg : card.fg,
                opacity: variant === v ? 1 : 0.55,
                border: `0.5px solid ${card.fg}`,
                transition: THEME_TRANSITION,
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoplay((a) => !a)}
            className="rounded-full px-2 py-0.5 font-mono text-[10px] leading-4"
            style={{
              background: autoplay ? card.fg : "transparent",
              color: autoplay ? card.bg : card.fg,
              border: `0.5px solid ${card.fg}`,
              opacity: autoplay ? 1 : 0.55,
              transition: THEME_TRANSITION,
            }}
          >
            {autoplay ? "Autoplay on" : "Autoplay off"}
          </button>
          <span className="font-mono text-[10px] leading-4 opacity-55">
            {gesture === "dragging"
              ? `drag ${Math.round(dragX)}px`
              : gesture === "holding"
                ? "held — paused"
                : lastInput}
          </span>
        </div>
      </div>

      {/* Stage — owns the pointer contract; cards are positioned siblings. */}
      <div
        ref={stageRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {CARDS.map((c, i) => {
          const rel = i - index;
          if (Math.abs(rel + p) > 1.35) return null;
          const isCurrent = i === index;
          // Only the current card's content is keyed (so the stagger replays
          // on arrival); neighbours render static and fully visible, which
          // keeps the outgoing card readable as it leaves.
          const animate = isCurrent && animateEnter;
          const line = animate ? "ssc-line" : "";
          return (
            <div
              key={c.key}
              className="absolute inset-0 flex items-center will-change-transform"
              // Each card is its own opaque surface. Transparent cards let a
              // neighbour's headline show through the current one in deck and
              // fade; opaque panels occlude, which is what a stack implies.
              style={{ ...cardStyle(rel, p, variant), background: c.bg, transition }}
              aria-hidden={i !== index}
            >
              <div className="mx-auto w-full max-w-[880px] px-7 sm:px-10" style={{ color: c.fg }}>
                <div key={animate ? `on-${index}` : "static"} className="flex flex-col gap-5">
                  <p
                    className={`${line} font-mono text-[12px] font-medium uppercase leading-4 tracking-[0.22em]`}
                    style={{ color: c.accent, animationDelay: "80ms" }}
                  >
                    {c.eyebrow}
                  </p>
                  <h1
                    className={`${line} text-[clamp(38px,6.6vw,80px)] font-semibold leading-[1.02] tracking-[-0.035em]`}
                    style={{ animationDelay: "170ms" }}
                  >
                    {c.headline}
                  </h1>
                  <p
                    className={`${line} max-w-md text-[17px] leading-6`}
                    style={{ color: c.dim, animationDelay: "260ms" }}
                  >
                    {c.sub}
                  </p>
                  {c.key === "final" ? (
                    // One real control, to prove taps on interactive elements
                    // don't advance the deck.
                    <Link
                      href="/agent-working"
                      className={`${line} mt-1 flex h-9 w-fit items-center rounded-full px-4 text-[13px] font-medium leading-4`}
                      style={{ background: c.fg, color: c.bg, animationDelay: "350ms" }}
                    >
                      Set up your first agent →
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-24 pb-5">
        <span className="whitespace-nowrap font-mono text-[10px] uppercase leading-4 tracking-[0.14em] opacity-45">
          {atEnd ? "The end" : "Drag, tap, or press → · hold to pause"}
        </span>
      </div>
    </div>
  );
}
