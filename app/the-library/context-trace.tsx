"use client";

// The context trace — the working trace grows a context drawer. The
// collapsed line is the agent working indicator as shipped elsewhere
// (profile + shimmering thought line, flyout register: #1b1b1b, 13px
// white over #8a8a8a); a chevron opens it, and the drawer shows WHERE
// the context is being grabbed — a hairline rail of sources that arrive
// as the agent reaches them, hold bright while read, then check off and
// recede. Collapsed, the same journey plays as narration in the thought
// line, so nothing is lost either way; the chevron only changes altitude.
//
// Styles are lifted from /agent-inline-trace's flyout rows (dark shimmer,
// 2.2s tempo, cubic-bezier(0.2, 0, 0, 1) settles) and the trace modal's
// hand-drawn 14px glyph family.

import { useCallback, useEffect, useRef, useState } from "react";
import "./agent-context-trace.css";

/* --------------------------------- clock ----------------------------------- */

// One rAF driving virtual time (same harness as /agent-typing-experience):
// the step is clamped so a backgrounded tab resumes instead of
// fast-forwarding, and a speed ref slows the whole run for review.
function useVirtualTime(speedRef: React.MutableRefObject<number>) {
  const [vt, setVt] = useState(0);
  const vtRef = useRef(0);
  const last = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      if (last.current != null) {
        vtRef.current += Math.min(now - last.current, 64) * speedRef.current;
      }
      last.current = now;
      setVt(vtRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speedRef]);

  const set = useCallback((ms: number) => {
    vtRef.current = ms;
  }, []);

  return { vt, set };
}

/* -------------------------------- timeline --------------------------------- */

type Source = {
  key: string;
  label: string;
  // The collapsed thought line while this source is being read.
  reading: string;
  icon: React.ReactNode;
  // Richer context that populates while the source is being read
  // (avatars, doc chips — whatever the source carries).
  detail?: React.ReactNode;
  // arrive: lands on the rail (queued, dim). start..end: read (bright).
  // At end the label is struck through; a beat later the row folds down
  // into the running trace — the ingest.
  arrive: number;
  start: number;
  end: number;
};

// The beat between the strike drawing and the fold beginning.
const STRIKE_HOLD = 500;
// The fold's own duration (ct-ingest) — after this the row is gone and
// the rail has settled.
const INGEST_MS = 450;

// Beats are uneven on purpose — metronomic dwell reads as fake work.
const T = {
  pull: 1400,
  draft: 10200,
  done: 12600,
  cycle: 16600,
};
/** The run's beats, for a film that drives this trace on its own clock. */
export const TRACE_T = T;

const SOURCES: Source[] = [
  {
    key: "jam",
    label: "Today's jam",
    reading: "Reading today's jam…",
    icon: <PhoneGlyph />,
    detail: (
      <Pile
        items={[
          <Face key="a" name="caleb" />,
          <Face key="b" name="jordan" />,
          <SparkleDisc key="c" />,
          <Face key="d" name="sara" />,
          <Face key="e" name="aj" />,
        ]}
      />
    ),
    arrive: 1600,
    start: 2400,
    end: 5200,
  },
  // Reading order follows the rail upward (the queue drains bottom to
  // top), so policies goes before transcripts — matching the reference
  // stack: Transcripts / Company policies / Today's jam.
  {
    key: "policies",
    label: "Company policies",
    reading: "Checking company policies…",
    icon: <NotebookGlyph />,
    detail: (
      <Pile
        items={[<NotionDisc key="a" />, <DriveDisc key="b" />, <DocsDisc key="c" />]}
      />
    ),
    arrive: 1780,
    start: 5200,
    end: 7600,
  },
  {
    key: "transcripts",
    label: "Transcripts",
    reading: "Reading the call transcripts…",
    icon: <MicGlyph />,
    detail: (
      <Pile
        items={[
          <GrainDisc key="a" />,
          <ZoomDisc key="b" />,
          <SlackDisc key="c" />,
          <GrainDisc key="d" />,
        ]}
      />
    ),
    arrive: 1960,
    start: 7600,
    end: 10200,
  },
];

// When a source's pile populates. It waits for the rail to CLEAR — the
// previous item has to strike, fold, and be absorbed before the next
// one's context starts arriving, so each pop lands in a quiet frame
// instead of competing with the fold above it. (The first source has
// nothing above it, so it populates as soon as it's read.)
function detailAt(index: number): number {
  const s = SOURCES[index];
  if (index === 0) return s.start;
  // +150: a breath after the rail settles, so the pop reads as its own
  // moment rather than the fold's last frame.
  return Math.max(s.start, SOURCES[index - 1].end + STRIKE_HOLD + INGEST_MS + 150);
}

function statusLine(vt: number): string {
  if (vt < T.pull) return "Starting agent session";
  for (const s of SOURCES) {
    if (vt >= s.start && vt < s.end) return s.reading;
  }
  if (vt < SOURCES[0].start) return "Pulling from context…";
  if (vt < T.done) return "Drafting the standup summary…";
  return "Drafted the standup summary";
}

/* --------------------------------- glyphs ---------------------------------- */
// The trace modal's hand-drawn 14px family, extended with the three
// source marks from the context spec. currentColor throughout so a row
// dims as one ink.

export function PhoneGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path
        d="M5.1 2.5l1.5 2.1-1.2 1.3a8.9 8.9 0 002.7 2.7l1.3-1.2 2.1 1.5c.4.3.5.9.1 1.3l-.9.9c-.5.5-1.2.7-1.9.4C6.3 10.4 3.6 7.7 2.5 5.2c-.3-.7-.1-1.4.4-1.9l.9-.9c.4-.4 1-.3 1.3.1z"
        fill="none"
        stroke="var(--ct-green)"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MicGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect
        x="5.3"
        y="1.7"
        width="3.4"
        height="6"
        rx="1.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M3.9 6.6a3.1 3.1 0 006.2 0M7 9.9v2.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NotebookGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect
        x="3"
        y="1.9"
        width="8"
        height="10.2"
        rx="1.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path d="M5.3 1.9v10.2" stroke="currentColor" strokeWidth="1.1" />
      <path d="M7.3 4.6h2M7.3 6.6h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

// Richer-context piles (Ando brand node 3450-6201): while a source is
// being read, its pieces pop in staggered — the call's participants,
// or the app logos of the files being read. One disc grammar for all.
export function Pile({ items }: { items: React.ReactNode[] }) {
  // Right-aligned at the row's end, per Figma 3509-2184: ~17px discs
  // on a 14.4px pitch.
  return (
    <span className="ml-auto flex items-center pl-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="ct-pop -ml-[4px] flex size-[20px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--ct-disc-ring)] first:ml-0"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          {item}
        </span>
      ))}
    </span>
  );
}

function SparkleDisc() {
  return (
    <span className="flex size-full items-center justify-center bg-[#0c0a09]">
      <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
        <path
          d="M8 1.5l1.55 4.1a1 1 0 00.58.58L14.5 8l-4.37 1.82a1 1 0 00-.58.58L8 14.5l-1.55-4.1a1 1 0 00-.58-.58L1.5 8l4.37-1.82a1 1 0 00.58-.58L8 1.5z"
          fill="#fff"
        />
      </svg>
    </span>
  );
}

export function Face({ name }: { name: string }) {
  return <img src={`/avatars/${name}.png`} alt="" className="size-full object-cover" />;
}

// App-logo discs — loose 10px marks, one per file being read.
function GrainDisc() {
  return (
    <span className="flex size-full items-center justify-center bg-[#1c2410]">
      <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
        <path
          d="M7 7a1 1 0 011 1 2 2 0 01-4 0 3.2 3.2 0 016.4 0 4.6 4.6 0 01-9.2 0A5.8 5.8 0 0112.8 8"
          fill="none"
          stroke="#A3E635"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function ZoomDisc() {
  return (
    <span className="flex size-full items-center justify-center bg-[#2D8CFF]">
      <svg width="11" height="11" viewBox="0 0 14 14" aria-hidden>
        <rect x="1.6" y="4.2" width="7" height="5.6" rx="1.6" fill="#fff" />
        <path d="M9.2 6.6l3.2-2v4.8l-3.2-2z" fill="#fff" />
      </svg>
    </span>
  );
}

function SlackDisc() {
  return (
    <span className="flex size-full items-center justify-center bg-[#4A154B]">
      <svg width="10" height="10" viewBox="0 0 14 14" aria-hidden>
        <path
          d="M5.2 2.2v9.6M8.8 2.2v9.6M2.2 5.2h9.6M2.2 8.8h9.6"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function NotionDisc() {
  return (
    <span className="flex size-full items-center justify-center bg-[color:var(--ct-disc-paper)]">
      <svg width="11" height="11" viewBox="0 0 14 14" aria-hidden>
        <path
          d="M4.4 10.4V3.6l5.2 6.8V3.9"
          fill="none"
          stroke="#1a1817"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function DriveDisc() {
  return (
    <span className="flex size-full items-center justify-center bg-[color:var(--ct-disc-paper)]">
      <svg width="11" height="11" viewBox="0 0 14 14" aria-hidden>
        <path d="M5.1 1.9h3.8l4 7H9z" fill="#FBBC04" />
        <path d="M5.1 1.9L1.1 8.9l1.9 3.2 4-7z" fill="#34A853" />
        <path d="M3 12.1h8l1.9-3.2H4.9z" fill="#4285F4" />
      </svg>
    </span>
  );
}

function DocsDisc() {
  return (
    <span className="flex size-full items-center justify-center bg-[#4285F4]">
      <svg width="10" height="10" viewBox="0 0 14 14" aria-hidden>
        <path
          d="M2.8 3.4h8.4M2.8 7h8.4M2.8 10.6h5.2"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function ChevronGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <path
        d="M4.5 2.5L8 6l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The context ring — takes the agent's seat while context is being
// pulled (Ando brand node 3507-2127). Each source folded into the
// trace fills a third of the ring.
export function ContextRing({ filled, total }: { filled: number; total: number }) {
  const r = 6;
  const c = 2 * Math.PI * r;
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0">
      <circle
        cx="7"
        cy="7"
        r={r}
        fill="none"
        stroke="var(--ct-track)"
        strokeWidth="1.5"
      />
      <circle
        cx="7"
        cy="7"
        r={r}
        fill="none"
        stroke="var(--ct-green)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - filled / total)}
        transform="rotate(-90 7 7)"
        className="ct-ring"
        style={{ opacity: filled === 0 ? 0 : 1 }}
      />
    </svg>
  );
}

// Completion morph: the finished ring thickens INWARD until it is a
// solid 14px disc — the radius shrinks as the stroke grows, so the
// outer edge stays a circle (never clipping square) — then the check
// draws through it. One continuous object, no pop, no swap.
export function CheckDisc() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0">
      <circle
        cx="7"
        cy="7"
        r="6"
        fill="none"
        stroke="var(--ct-green)"
        strokeWidth="1.5"
        className="ct-fill"
      />
      <path
        d="M4.1 7.2l2.1 2.1 3.9-4.5"
        fill="none"
        stroke="var(--ct-check-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ct-seal"
      />
    </svg>
  );
}

/* -------------------------------- component -------------------------------- */

export function ContextTrace({
  vt,
  open,
  onToggle,
  theme = "dark",
  width = 360,
  avatar = "/agent-working/agent-1.png",
}: {
  /** ms on the trace's own clock — see T above for the beats */
  vt: number;
  open: boolean;
  onToggle: () => void;
  theme?: "dark" | "light";
  /** the card's width; /the-library's canvas gives it 360 */
  width?: number | string;
  /** the face in the seat — the library's storyboard agent unless told otherwise */
  avatar?: string;
}) {
  const done = vt >= T.done;
  const arrived = SOURCES.filter((s) => vt >= s.arrive);
  // Drained: the LAST fold is beginning. The drawer close starts on the
  // same frame, so the header rises to meet the sinking row — one
  // motion, not fold-then-close. (An emptied rail must never linger as
  // a dead pocket; the next cycle reopens it the same way.)
  const drained = SOURCES.every((s) => vt >= s.end + STRIKE_HOLD);
  const railOpen = open && !drained;
  // The ring ticks as each fold lands in the trace (~the travel's
  // touchdown frame), absorbing the item into the running total.
  const ringFilled = SOURCES.filter((s) => vt >= s.end + STRIKE_HOLD + 350).length;
  // The agent's seat morphs with the run: avatar shrinks away as the
  // pull begins, the context ring works in its place, the check seals
  // for a second, then the avatar comes back.
  const seat =
    vt < T.pull - 150
      ? "avatar"
      : vt < T.pull
        ? "avatar-out"
        : vt < T.done
          ? "ring"
          : vt < T.done + 850
            ? "check"
            : vt < T.done + 1000
              ? "check-out"
              : "avatar-back";

  return (
    <div
      className={`ct-${theme} rounded-[14px] border border-[color:var(--ct-border)] bg-[color:var(--ct-bg)]`}
      style={{ width }}
    >
      {/* The rail rides ABOVE the line: sources queue overhead and drain
          downward into the agent as they're read. */}
      <div className="ct-drawer" data-open={railOpen}>
        <div>
          {/* Rows flush at the card's 15px padding, per Figma 3509-2132 —
              no trace line in this direction. */}
          <div className="ml-[15px] mt-3 flex flex-col pr-[15px]">
            {arrived.length === 0 ? (
              <div className="flex h-7 items-center text-[14px] leading-5 text-[color:var(--ct-muted)]">
                Gathering context…
              </div>
            ) : (
              // Reversed: the queue stacks UPWARD — the next source to be
              // read sits at the bottom, against the trace line, and each
              // fold is the same short drop from the bottom slot. The rail
              // drains bottom-to-top; rows above settle down as it does.
              [...arrived].reverse().map((s) => {
                const reading = vt >= s.start && vt < s.end;
                const struck = vt >= s.end;
                const ingesting = vt >= s.end + STRIKE_HOLD;
                const populated = vt >= detailAt(SOURCES.indexOf(s));
                return (
                  <div
                    key={s.key}
                    className={`ct-row ct-row-in flex h-7 items-center ${
                      ingesting ? "ct-ingest" : ""
                    } ${reading ? "text-[color:var(--ct-text)]" : "text-[color:var(--ct-muted)]"}`}
                  >
                    <span
                      className={`flex size-4 shrink-0 items-center justify-center transition-opacity duration-300 ${
                        reading || struck ? "opacity-100" : "opacity-40"
                      }`}
                    >
                      {s.icon}
                    </span>
                    <span
                      className={`ml-[14px] min-w-0 truncate text-[14px] leading-5 ${
                        struck ? "ct-strike" : ""
                      }`}
                    >
                      {s.label}
                    </span>
                    {/* Richer context populates once the rail above has
                        cleared, right-aligned at the row's end, and
                        rides the row from then on. */}
                    {populated ? s.detail : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* The whole line is the disclosure — the chevron is the hint, not
          the only target. */}
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="group flex h-12 w-full items-center gap-2.5 pl-3 pr-[15px] text-left"
      >
        <span className="flex size-[22px] shrink-0 items-center justify-center">
          {seat === "ring" ? (
            <span className="ct-pop flex">
              <ContextRing filled={ringFilled} total={SOURCES.length} />
            </span>
          ) : seat === "check" || seat === "check-out" ? (
            <span className={`flex ${seat === "check-out" ? "ct-shrink" : ""}`}>
              <CheckDisc />
            </span>
          ) : (
            <img
              key={seat === "avatar-back" ? "back" : "front"}
              src={avatar}
              alt=""
              className={`size-[22px] rounded-full object-cover ${
                seat === "avatar-out"
                  ? "ct-shrink"
                  : seat === "avatar-back"
                    ? "ct-pop"
                    : ""
              }`}
            />
          )}
        </span>
        {done ? (
          <span className="min-w-0 flex-1 truncate text-[14px] leading-5 text-[color:var(--ct-text)]">
            {statusLine(vt)}
          </span>
        ) : (
          <span className="ct-shimmer min-w-0 flex-1 truncate text-[14px] leading-5">
            {statusLine(vt)}
          </span>
        )}
        <span
          data-open={railOpen}
          className="ct-chevron shrink-0 text-[color:var(--ct-chevron)] group-hover:text-[color:var(--ct-text)]"
        >
          <ChevronGlyph />
        </span>
      </button>
    </div>
  );
}

/* ---------------------------------- page ----------------------------------- */

function SunGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 1.2v1.8M8 13v1.8M1.2 8H3M13 8h1.8M3.2 3.2l1.3 1.3M11.5 11.5l1.3 1.3M12.8 3.2l-1.3 1.3M4.5 11.5l-1.3 1.3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M13.2 9.8A6 6 0 116.2 2.8a4.7 4.7 0 007 7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The trace itself, with its own clock, drawer state, and light/dark
// register (sun/moon toggle riding the card's shoulder) but no page
// chrome, so it can be dropped into a canvas anywhere — /the-library
// and the landing page both give it a card.
export function ContextTraceCanvas() {
  const speedRef = useRef(1);
  const { vt } = useVirtualTime(speedRef);
  // Open by default: the trace announces what it's pulling without being
  // asked, and puts itself away when everything's ingested. The chevron
  // is the manual override.
  const [open, setOpen] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const light = theme === "light";

  return (
    <>
      {/* Pinned to the canvas's top-right corner — the canvas container
          (lib-canvas / landing-canvas) is the positioning context. */}
      <button
        type="button"
        aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
        onClick={() => setTheme(light ? "dark" : "light")}
        className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-[#ebe9e8] bg-white text-[#8a827b] transition-colors hover:text-[#1a1817]"
      >
        {light ? <MoonGlyph /> : <SunGlyph />}
      </button>
      <ContextTrace
        theme={theme}
        vt={vt % T.cycle}
        open={open}
        onToggle={() => setOpen((o) => !o)}
      />
    </>
  );
}
