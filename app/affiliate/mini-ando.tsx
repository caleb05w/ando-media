"use client";

// mini ando — a little computer that re-enacts use cases. A task strip
// sits beneath the stage; the selected task plays out INSIDE the
// window: the cursor clicks into the right channel, the ask gets typed
// into the composer and sent, Yumi thinks (a shimmer line), answers —
// and every scene runs the memory arc: the person states a preference,
// Yumi keeps it ("Saved to memory" lands as a quiet system line), and
// the NEXT reply visibly honors it — the shimmer reads "Searching
// memory…" and the system line is absorbed once the reply proves the
// preference took.
//
// The P0 thesis: the agent is personal. Every task is a GENERAL
// template (catch up, make the doc, spot the pattern, draft the reply,
// remember this) permutated with person data — switch who is asking
// and the same task comes back in a different shape.
//
// The shell is Figma 3642:7325: flat sidebar rail, hairline strokes,
// the product's own assets. Choreography is the house grammar — beat
// counters on timeouts; visible is the base style and hidden the
// exception.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// The /the-library context-trace shimmer (and its light-register inks),
// worn at little-computer scale for Yumi's thinking line.
import "../the-library/agent-context-trace.css";
// Arrival motion matched to the production message list (see the css).
import "./mini-ando.css";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

const ASSET_ROOT = "/agent-inline-trace";
const FG_PRIMARY = "#1a1817";
const FG_SECONDARY = "#58524e";
const STROKE_WEAK = "#f0efee";
const BG_TERTIARY = "#f5f5f4";
const ACCENT = "#2563eb";

const asset = (file: string) => `${ASSET_ROOT}/${file}`;

/* ── The sidebar, reduced (flat rail per Figma) ───────────────────────── */

type Row =
  | { kind: "channel"; label: string; avatar?: never }
  | { kind: "person"; label: string; avatar: string };

const ROWS: Row[] = [
  { kind: "person", label: "Tadao", avatar: "/avatars/agent-2.png" },
  { kind: "person", label: "Sara Du", avatar: "/avatars/sara.png" },
  { kind: "channel", label: "general" },
  { kind: "channel", label: "design" },
  { kind: "channel", label: "feedback" },
];

// Row centres in window-content space — the cursor aims at these.
const ROW_Y: Record<string, number> = { Tadao: 51, "Sara Du": 73, general: 95, design: 117, feedback: 139 };

/* ── The people Yumi knows ────────────────────────────────────────────── */
// The permutation axis. Each person is a small bundle of what Yumi has
// learned about them; the tasks below read from it. Same agent, same
// asks — a different person gets a different shape back.

type PersonId = "sara" | "oli" | "aj";

type Person = {
  id: PersonId;
  name: string; // as shown on the message
  label: string; // as shown on the switcher
  avatar: string;
};

const PEOPLE: Person[] = [
  { id: "sara", name: "Sara Du", label: "Sara", avatar: "/avatars/sara.png" },
  { id: "oli", name: "Oli", label: "Oli", avatar: "/avatars/oli.png" },
  { id: "aj", name: "AJ", label: "AJ", avatar: "/avatars/aj.png" },
];

/* ── The tasks, permutated ────────────────────────────────────────────── */
// Five GENERAL tasks — anyone's day has all five. What varies is the
// data: the ask arrives in the person's own voice, and the answer comes
// back in their shape. A playout is a little conversation — some are
// one exchange, some calibrate: the person nudges, Yumi thinks again
// and reworks it, and what it learned can be kept (`memory` marks the
// keeps).

type Turn = {
  who: "person" | "yumi";
  text: string;
  // A file attachment on this turn, rendered as the production file-row
  // chip: attachment-type icon, filename, size beneath. `kind` picks the
  // attachment-type family (default doc-blue; "code" is the amber one).
  chip?: { name: string; size: string; kind?: "code" };
  memory?: string;
  // The shimmer line before this Yumi turn; defaults to the personal
  // "Reading what I know about …" on the first, "Reworking it…" after.
  think?: string;
};

type Playout = Turn[];

type Task = {
  id: string;
  // The rail speaks in the asker's own use case — not "Catch up" but
  // the thing this person actually asked for, per their playout. The
  // labels re-permute with the asker, same as the answers do.
  personal: Record<PersonId, { title: string; blurb: string }>;
  channel: string;
  icon: React.ReactNode;
  play: Record<PersonId, Playout>;
};

/* Central Icons (round-outlined, 1.5 stroke), inlined from the product
   icon registry. */
const ICON_FILE_TEXT = (
  <svg aria-hidden className="size-4" fill="none" viewBox="0 0 24 24">
    <path
      d="M12.3358 2.75H5.75C5.19772 2.75 4.75 3.19772 4.75 3.75V20.25C4.75 20.8023 5.19771 21.25 5.75 21.25H18.25C18.8023 21.25 19.25 20.8023 19.25 20.25V9.66421C19.25 9.399 19.1446 9.14464 18.9571 8.95711L13.0429 3.04289C12.8554 2.85536 12.601 2.75 12.3358 2.75Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
    <path d="M8.75 13.25H12.25M8.75 17.25H15.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    <path d="M12.75 3.25V8.25C12.75 8.80228 13.1977 9.25 13.75 9.25H18.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
  </svg>
);
const ICON_SEARCH_MENU = (
  <svg aria-hidden className="size-4" fill="none" viewBox="0 0 24 24">
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" transform="scale(1.5)">
      <path d="M14.1667 8C14.1667 10.3012 12.3012 12.1667 10 12.1667C7.6988 12.1667 5.83333 10.3012 5.83333 8C5.83333 5.69881 7.6988 3.83333 10 3.83333C12.3012 3.83333 14.1667 5.69881 14.1667 8Z" />
      <path d="M1.83333 8H3.5" />
      <path d="M1.83333 4.5H4.16667" />
      <path d="M1.83333 11.5H4.16667" />
      <path d="M13 11L14.8333 12.8333" />
    </g>
  </svg>
);
const ICON_INBOX = (
  <svg aria-hidden className="size-4" fill="none" viewBox="0 0 24 24">
    <path
      d="M2.75 13.25H7.25L8.75 15.75H15.25L16.75 13.25H21.25M2.75 13.6096V19.25C2.75 19.8023 3.19772 20.25 3.75 20.25H20.25C20.8023 20.25 21.25 19.8023 21.25 19.25V13.6096C21.25 13.4408 21.2073 13.2748 21.1258 13.127L16.5342 4.79741C16.3583 4.47845 16.0228 4.28033 15.6585 4.28033H8.34151C7.97725 4.28033 7.64172 4.47845 7.46585 4.79741L2.87423 13.127C2.79274 13.2748 2.75 13.4408 2.75 13.6096Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
);
const ICON_PENCIL = (
  <svg aria-hidden className="size-4" fill="none" viewBox="0 0 24 24">
    <path
      d="M4.75 19.25L9 18.25L18.2929 8.95711C18.6834 8.56658 18.6834 7.93342 18.2929 7.54289L16.4571 5.70711C16.0666 5.31658 15.4334 5.31658 15.0429 5.70711L5.75 15L4.75 19.25Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path d="M13.75 7L17 10.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
  </svg>
);
const ICON_BOOKMARK = (
  <svg aria-hidden className="size-4" fill="none" viewBox="0 0 24 24">
    <path
      d="M6.75 4.75C6.75 4.19772 7.19772 3.75 7.75 3.75H16.25C16.8023 3.75 17.25 4.19772 17.25 4.75V19.25L12 15.75L6.75 19.25V4.75Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
);

const TASKS: Task[] = [
  {
    id: "catch-up",
    personal: {
      sara: { title: "Catch up without the scrollback", blurb: "A day away, returned as decisions — one line each, her rule." },
      oli: { title: "Catch up on blockers only", blurb: "Everything that can wait gets held back — his rule." },
      aj: { title: "Catch up on every open deal", blurb: "Each update names who owns the next step." },
    },
    channel: "general",
    icon: ICON_INBOX,
    play: {
      sara: [
        { who: "person", text: "yumi, what did I miss?" },
        {
          who: "yumi",
          text: "While you were out — pricing v2 went to a vote, and two more export reports landed in #feedback.",
        },
        { who: "person", text: "just decisions, one line each" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Got it — decisions only, one line each.",
          memory: "catch-ups arrive as one-line decisions",
        },
        { who: "person", text: "and from yesterday?" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "Pricing v2: approved. Launch date: held. Exports fix: shipped.",
        },
      ],
      oli: [
        { who: "person", text: "what did i miss" },
        { who: "yumi", text: "Quiet day — a few threads in #design, two small PRs, one flaky test on CI." },
        { who: "person", text: "only tell me about blockers" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Done — blockers only from here.",
          memory: "only blockers, skip the rest",
        },
        { who: "person", text: "this morning?" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "One blocker — the staging cert expired. Everything else can wait.",
        },
      ],
      aj: [
        { who: "person", text: "yumi what'd I miss?" },
        { who: "yumi", text: "Acme wants the annual plan, and Dana said yes to the pilot." },
        { who: "person", text: "always tell me who owns the next step" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Will do — every update names an owner.",
          memory: "every update names an owner",
        },
        { who: "person", text: "so where's acme at?" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "Contract's with legal — Dana owns it, due Friday.",
        },
      ],
    },
  },
  {
    id: "make-doc",
    personal: {
      sara: { title: "Turn a Jam into a product brief", blurb: "Written how Sara writes: decisions bolded, a customer quote up top." },
      oli: { title: "Write the spec from the thread", blurb: "One page, acceptance criteria first — how Oli specs." },
      aj: { title: "Recap customer calls for the team", blurb: "Tl;dr up top, the customer's words kept verbatim." },
    },
    channel: "design",
    icon: ICON_FILE_TEXT,
    play: {
      sara: [
        { who: "person", text: "can you brief this jam up?" },
        {
          who: "yumi",
          text: "Drafted from the Jam — decisions bolded.",
          chip: { name: "pricing-v2-brief.md", size: "4 KB" },
        },
        { who: "person", text: "open with a real customer quote next time" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Noted — the customer speaks first.",
          memory: "briefs open with a customer quote",
        },
        { who: "person", text: "do the onboarding jam too" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "Done — it opens with the Acme quote.",
          chip: { name: "onboarding-brief.md", size: "3 KB" },
        },
      ],
      oli: [
        { who: "person", text: "write this up?" },
        {
          who: "yumi",
          text: "Spec'd it — acceptance criteria up top.",
          chip: { name: "exports-spec.md", size: "2 KB" },
        },
        { who: "person", text: "keep specs under a page" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Got it — one page, hard limit.",
          memory: "specs stay under a page",
        },
        { who: "person", text: "and the retry logic?" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "One page exactly — criteria up top.",
          chip: { name: "retry-spec.md", size: "2 KB" },
        },
      ],
      aj: [
        { who: "person", text: "can you write this up for the team?" },
        {
          who: "yumi",
          text: "One page, customer words kept verbatim.",
          chip: { name: "acme-recap.md", size: "3 KB" },
        },
        { who: "person", text: "add a tl;dr up top next time" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Done — tl;dr leads from now on.",
          memory: "recaps open with a tl;dr",
        },
        { who: "person", text: "recap today's call too?" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "Posted — three lines up top, details under.",
          chip: { name: "dana-call-recap.md", size: "2 KB" },
        },
      ],
    },
  },
  {
    id: "pattern",
    personal: {
      sara: { title: "Spot what customers keep saying", blurb: "Nine reports on the same bug become one flow for standup." },
      oli: { title: "Dedupe the week's bug reports", blurb: "Four traces, one shared timeout — shown once, not four times." },
      aj: { title: "Hear the themes across calls", blurb: "What keeps coming up, tied to the revenue behind it." },
    },
    channel: "feedback",
    icon: ICON_SEARCH_MENU,
    play: {
      sara: [
        { who: "person", text: "anything repeating in the feedback?" },
        { who: "yumi", text: "Six reports this month point at exports — flagged for the launch." },
        { who: "person", text: "diagram it when it's more than a few" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Noted — past a few reports, you get the picture.",
          memory: "patterns arrive as diagrams",
        },
        { who: "person", text: "where's it at now?" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "Nine reports — mapped as one flow, ready for standup.",
          chip: { name: "exports-flow.svg", size: "8 KB", kind: "code" },
        },
      ],
      oli: [
        { who: "person", text: "recurring bugs this week?" },
        { who: "yumi", text: "Exports again — four traces share the same timeout." },
        { who: "person", text: "group dupes before you show me" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Done — duplicates collapse into one.",
          memory: "bug reports arrive deduped",
        },
        { who: "person", text: "what's new since?" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "One new issue — nine reports, shown once: the retry loop.",
        },
      ],
      aj: [
        { who: "person", text: "any themes from the calls?" },
        { who: "yumi", text: "Three renewals asked about SSO." },
        { who: "person", text: "tie themes to revenue when you can" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Got it — dollars attached.",
          memory: "themes come with revenue attached",
        },
        { who: "person", text: "anything else trending?" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "Exports came up twice — $80k in renewals behind it.",
        },
      ],
    },
  },
  {
    id: "reply",
    personal: {
      sara: { title: "Draft replies in her voice", blurb: "The example first, warm at the top — ready to send." },
      oli: { title: "Draft replies, kept short", blurb: "Repro steps, then the ETA — signed ‘Oli’." },
      aj: { title: "Draft replies that end open", blurb: "One clear next step, closing on a question." },
    },
    channel: "general",
    icon: ICON_PENCIL,
    play: {
      sara: [
        { who: "person", text: "can you draft a reply to Marco?" },
        {
          who: "yumi",
          text: "Drafted in your voice — the example first, then the ask.",
          chip: { name: "reply-to-marco.md", size: "1 KB" },
        },
        { who: "person", text: "bit warmer at the top" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Softened the open — and keeping it that way.",
          memory: "replies open warm",
        },
        { who: "person", text: "draft one for dana too" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "Warm open, then the ask — ready to send.",
          chip: { name: "reply-to-dana.md", size: "1 KB" },
        },
      ],
      oli: [
        { who: "person", text: "reply to marco for me?" },
        {
          who: "yumi",
          text: "Kept it short — repro steps, then the fix ETA.",
          chip: { name: "reply-to-marco.md", size: "1 KB" },
        },
        { who: "person", text: "sign off with just my first name" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Noted — just ‘Oli’ from here.",
          memory: "sign-offs are first-name only",
        },
        { who: "person", text: "one for the infra list too" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "Short, steps first — signed ‘Oli’.",
          chip: { name: "reply-to-infra.md", size: "1 KB" },
        },
      ],
      aj: [
        { who: "person", text: "help me reply to Marco" },
        {
          who: "yumi",
          text: "Warm open, one clear next step.",
          chip: { name: "reply-to-marco.md", size: "1 KB" },
        },
        { who: "person", text: "always end with a question" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Got it — every reply ends open.",
          memory: "replies end with a question",
        },
        { who: "person", text: "and one for dana" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "Done — it closes on ‘does Thursday work?’",
          chip: { name: "reply-to-dana.md", size: "1 KB" },
        },
      ],
    },
  },
  {
    id: "remember",
    personal: {
      sara: { title: "Say it once, Yumi keeps it", blurb: "Every summary line carries its source, from then on." },
      oli: { title: "No pings before 10", blurb: "Mornings stay quiet; the urgent one arrives at 10:04." },
      aj: { title: "Keep customer names out of channels", blurb: "Wins get shared; the names stay in DMs." },
    },
    channel: "feedback",
    icon: ICON_BOOKMARK,
    play: {
      sara: [
        { who: "person", text: "always link the source next to summaries" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Noted — every summary line will carry its source.",
          memory: "link the source next to every summary",
        },
        { who: "person", text: "summarize this thread?" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "Three points, each linked to its message.",
        },
      ],
      oli: [
        { who: "person", text: "don't ping me before 10" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Got it — mornings stay quiet.",
          memory: "no pings before 10:00",
        },
        { who: "person", text: "anything held for me?" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "One ping, held until now — the cert renewal. It's 10:04.",
        },
      ],
      aj: [
        { who: "person", text: "keep customer names out of shared channels" },
        {
          who: "yumi",
          think: "Saving to memory…",
          text: "Done — names stay in DMs.",
          memory: "customer names stay in DMs",
        },
        { who: "person", text: "share the win in #general?" },
        {
          who: "yumi",
          think: "Searching memory…",
          text: "Posted — ‘a fortune-500 renewal,’ no names.",
        },
      ],
    },
  },
];

/* ── the timeline ─────────────────────────────────────────────────────── */
// Choreography beats (1 cursor→row · 2 click · 3 cursor→composer ·
// 4 the ask types) run on fixed marks; from the first send onward the
// schedule is derived from the playout: each Yumi turn thinks for a
// beat (the shimmer) before landing, each follow-up from the person
// lands on its own, and a keep chips in shortly after its turn.
const CHAR_MS = 26;
const THINK_DELAY = 500; // the breath before the shimmer appears
const THINK_MS = 1900; // how long Yumi visibly thinks
const FOLLOW_UP_MS = 1400; // a person's next message arriving
const MEMORY_MS = 700; // the keep, after its turn lands

type TimelineEvent = { at: number; landed?: number; thinking?: boolean; memoryLanded?: number };

function buildTimeline(playout: Playout): TimelineEvent[] {
  const sentAt = 2200 + playout[0].text.length * CHAR_MS + 600;
  const events: TimelineEvent[] = [{ at: sentAt, landed: 1 }];
  let t = sentAt;
  let kept = 0;
  playout.slice(1).forEach((turn, j) => {
    const landedCount = j + 2;
    if (turn.who === "yumi") {
      events.push({ at: t + THINK_DELAY, thinking: true });
      t += THINK_DELAY + THINK_MS;
      events.push({ at: t, landed: landedCount, thinking: false });
    } else {
      t += FOLLOW_UP_MS;
      events.push({ at: t, landed: landedCount });
    }
    if (turn.memory) {
      kept += 1;
      events.push({ at: t + MEMORY_MS, memoryLanded: kept });
    }
  });
  return events;
}

/** The ask, typed live into the composer. */
function TypeMini({ text, on }: { text: string; on: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return;
    let i = 0;
    const iv = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) window.clearInterval(iv);
    }, CHAR_MS);
    return () => window.clearInterval(iv);
  }, [on, text]);
  return (
    <p className="text-[9.5px] leading-[13px]" style={{ color: FG_PRIMARY }}>
      {text.slice(0, n)}
      <span className="ml-px inline-block h-[9px] w-px translate-y-[1px] bg-[#1a1817]" />
    </p>
  );
}

/** A landing row, per the production message list: it mounts whole (the
    thread reflows instantly — no height tween) and the row itself does
    the small rise-and-fade of agent-row-in. */
function LandingRow({ shown, children }: { shown: boolean; children: React.ReactNode }) {
  if (!shown) return null;
  return <div className="mini-msg-in pt-2.5">{children}</div>;
}

/** The production attachment-type icon (packages/ui attachment-type-icon,
    Figma "attachment icons" 8254:192) — the docx family's folded file,
    rendered at mini scale. */
function MiniDocIcon({ size = 18, kind }: { size?: number; kind?: "code" }) {
  const body = kind === "code" ? "#D97706" : "#2563EB";
  const fold = kind === "code" ? "#F59E0B" : "#60A5FA";
  return (
    <svg aria-hidden fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <path
        d="M12.9999 3.66669H6.79159C5.98617 3.66669 5.33325 4.3196 5.33325 5.12502V18.875C5.33325 19.6804 5.98617 20.3334 6.79159 20.3334H17.2083C18.0137 20.3334 18.6666 19.6804 18.6666 18.875V9.33335H14.4583C13.6528 9.33335 12.9999 8.68044 12.9999 7.87502V3.66669Z"
        fill={body}
      />
      <path d="M13 8.22225V3.66669L18.6667 9.33337H14.1111C13.4974 9.33337 13 8.8359 13 8.22225Z" fill={fold} />
      {kind === "code" ? (
        <path
          d="M10.5938 12.625L8.71875 14.5L10.5938 16.375M13.4062 12.625L15.2812 14.5L13.4062 16.375"
          opacity="0.9"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M8.66675 14.2916H11.5834M8.66675 17H14.0834"
          opacity="0.9"
          stroke="white"
          strokeLinecap="round"
          strokeWidth="1.25"
        />
      )}
    </svg>
  );
}

/** The production file-row chip (other-attachment.tsx: bordered card,
    type icon, filename over size), at mini scale. No entrance of its
    own — it's part of the message and rides the row's arrival. */
function MiniFileChip({ name, size, kind }: { name: string; size: string; kind?: "code" }) {
  return (
    <span className="mt-1 flex h-[30px] w-[168px] items-center gap-[4px] rounded-[4px] border-[0.5px] border-[#e7e5e4] bg-white px-[5px] shadow-[0_1px_3px_0_rgba(16,16,16,0.04)]">
      <span className="flex size-[20px] shrink-0 items-center justify-center">
        <MiniDocIcon kind={kind} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[8.5px] font-medium leading-[11px]" style={{ color: FG_PRIMARY }}>
          {name}
        </span>
        <span className="text-[7.5px] leading-[10px] text-[#a8a29e]">{size}</span>
      </span>
    </span>
  );
}

function MsgRow({
  name,
  avatar,
  isAgent,
  text,
  chip,
  shown,
}: {
  name: string;
  avatar: string;
  isAgent?: boolean;
  text: string;
  chip?: { name: string; size: string; kind?: "code" };
  shown: boolean;
}) {
  return (
    <LandingRow shown={shown}>
      <div className="flex items-start gap-[6px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt="" className="mt-px size-[14px] max-w-none rounded-full object-cover" />
        <div className="min-w-0">
          <p className="text-[9px] font-semibold leading-[12px]" style={{ color: isAgent ? ACCENT : FG_PRIMARY }}>
            {name}
          </p>
          <p className="text-[9.5px] leading-[13px] text-[#44403c]">{text}</p>
          {chip ? <MiniFileChip kind={chip.kind} name={chip.name} size={chip.size} /> : null}
        </div>
      </div>
    </LandingRow>
  );
}

/** Yumi thinking — a message row whose body is the shimmer line; the
    answer takes its place when it lands. */
function ThinkingRow({ line, shown }: { line: string; shown: boolean }) {
  return (
    <LandingRow shown={shown}>
      <div className="ct-light flex items-start gap-[6px]" style={{ background: "transparent", boxShadow: "none" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/avatars/agent-1.png" alt="" className="mt-px size-[14px] max-w-none rounded-full object-cover" />
        <div className="min-w-0">
          <p className="text-[9px] font-semibold leading-[12px]" style={{ color: ACCENT }}>
            Yumi
          </p>
          <p className="ct-shimmer text-[9.5px] leading-[13px]">{line}</p>
        </div>
      </div>
    </LandingRow>
  );
}

/** The saved-to-memory line, in the production system-message grammar
    (message-list/system-message: a small rounded icon slot on muted
    fill, secondary text, left-aligned). It appears when the keep lands
    and is absorbed — collapsing away — once the agent's next reply
    proves the preference took. */
function MemoryRow({ text, everShown, visible }: { text: string; everShown: boolean; visible: boolean }) {
  // Not mounted until its moment, so the arrival animation plays on the
  // frame it first appears.
  if (!everShown) return null;
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-fast ${
        visible ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`mini-msg-in flex items-center gap-[6px] pt-2.5 transition-opacity duration-200 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="flex size-[16px] shrink-0 items-center justify-center rounded-[4px] bg-[#f0efee]">
            <svg aria-hidden className="size-[9px]" fill="none" viewBox="0 0 24 24">
              <path
                d="M6.75 4.75C6.75 4.19772 7.19772 3.75 7.75 3.75H16.25C16.8023 3.75 17.25 4.19772 17.25 4.75V19.25L12 15.75L6.75 19.25V4.75Z"
                stroke={FG_SECONDARY}
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </span>
          <span className="min-w-0 truncate text-[8.5px] leading-[11px]" style={{ color: FG_SECONDARY }}>
            Saved to memory <span className="text-[#a8a29e]">— “{text}”</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** The agent's cursor — the brand file's own set (Ando Brand
    3687-11647): arrow, pointing hand, and I-beam, drop shadows and
    all, served from /public/cursors. Each glyph offsets so its true
    hotspot rides the translate point: the arrow's tip, the finger's
    tip, the beam's centre. */
type CursorKind = "arrow" | "pointer" | "text";

const CURSORS: Record<CursorKind, { src: string; w: number; h: number; dx: number; dy: number }> = {
  arrow: { src: "/cursors/cursor-arrow.svg", w: 16, h: 22, dx: -2, dy: -1 },
  pointer: { src: "/cursors/cursor-hand.svg", w: 19, h: 20, dx: -7, dy: -1 },
  text: { src: "/cursors/cursor-ibeam.svg", w: 13, h: 22, dx: -6.5, dy: -10 },
};

function AgentCursor({ kind = "arrow" }: { kind?: CursorKind }) {
  const c = CURSORS[kind];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={c.src}
      alt=""
      width={c.w}
      height={c.h}
      className="max-w-none"
      style={{ margin: `${c.dy}px 0 0 ${c.dx}px` }}
    />
  );
}

/** The turn index of the agent's next reply after `i` — the reply that
    proves an i-turn keep took; the memory line is absorbed when it lands. */
function nextYumiAfter(playout: Playout, i: number): number {
  return playout.findIndex((t, idx) => idx > i && t.who === "yumi");
}

/* ── The little computer ──────────────────────────────────────────────── */

export function MiniAndo() {
  const [taskIdx, setTaskIdx] = useState(0);
  // The asker is fixed to Sara while the scene-settings control is
  // parked; the per-person permutation machinery stays live beneath.
  const [personId] = useState<PersonId>("sara");
  const [run, setRun] = useState(0); // bumps to replay the same scene
  const [beat, setBeat] = useState(0); // choreography beats 1–4
  const [landed, setLanded] = useState(0); // turns on the wall
  const [thinking, setThinking] = useState(false);
  const [memoryLanded, setMemoryLanded] = useState(0);
  const [channel, setChannel] = useState("general");
  const [full, setFull] = useState(false); // the world, popped out
  // Popped out, the window fills ~80% of the viewport — the scale is
  // computed against the window's natural 760×430, whichever axis
  // binds, and tracks resizes while open.
  const [fullScale, setFullScale] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false); // the scene picker
  // The scene waits for its audience: choreography holds until the
  // stage is actually on screen, then runs (and re-runs) as usual.
  const [inView, setInView] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!full && !settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFull(false);
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full, settingsOpen]);

  useEffect(() => {
    if (!full) return;
    const compute = () =>
      setFullScale(Math.min((0.8 * window.innerWidth) / 820, (0.8 * window.innerHeight) / 430));
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [full]);

  const task = TASKS[taskIdx];
  const person = PEOPLE.find((p) => p.id === personId) ?? PEOPLE[0];
  const playout = task.play[person.id];

  useEffect(() => {
    if (reduced || !inView) return;
    // state resets asynchronously so the effect body stays side-effect
    // scheduling only.
    const timers = [
      window.setTimeout(() => {
        setBeat(0);
        setLanded(0);
        setThinking(false);
        setMemoryLanded(0);
      }, 0),
    ];
    const beats: [number, number][] = [
      [1, 30],
      [2, 1000],
      [3, 1350],
      [4, 2200],
    ];
    timers.push(...beats.map(([b, at]) =>
      window.setTimeout(() => {
        setBeat(b);
        if (b === 2) setChannel(task.channel);
      }, at),
    ));
    timers.push(...buildTimeline(playout).map((ev) =>
      window.setTimeout(() => {
        if (ev.landed !== undefined) setLanded(ev.landed);
        if (ev.thinking !== undefined) setThinking(ev.thinking);
        if (ev.memoryLanded !== undefined) setMemoryLanded(ev.memoryLanded);
      }, ev.at),
    ));
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskIdx, personId, run, reduced, inView]);

  // Reduced motion: the chosen scene, finished, held still.
  const totalKeeps = playout.filter((t) => t.memory).length;
  const shownBeat = reduced ? 4 : beat;
  const shownLanded = reduced ? playout.length : landed;
  const shownThinking = reduced ? false : thinking;
  const shownMemory = reduced ? totalKeeps : memoryLanded;
  const shownChannel = reduced ? task.channel : channel;

  // Where the cursor is, per beat — and which glyph it wears: the hand
  // over the channel it's about to click, the I-beam at the composer,
  // the arrow once the ask is sent and it steps back.
  const cursor =
    shownLanded >= 1
      ? { x: 410, y: 235, kind: "arrow" as CursorKind }
      : shownBeat >= 3
        ? { x: 330, y: 356, kind: "text" as CursorKind }
        : { x: 60, y: ROW_Y[task.channel] ?? 95, kind: "pointer" as CursorKind };

  const inChannel = shownChannel === task.channel;

  // The shimmer's voice: the first think reads the person; later
  // thinks are reworks (or whatever the turn says).
  const firstYumiIdx = playout.findIndex((t) => t.who === "yumi");
  const nextTurn = playout[shownLanded];
  const thinkLine =
    nextTurn?.think ??
    (shownLanded === firstYumiIdx ? `Reading what I know about ${person.label}…` : "Reworking it…");

  // The keep chips ride their turn: this numbers each memory turn so a
  // chip shows once its keep has landed.
  let keepIdx = 0;

  return (
    <div className="flex flex-col">
      {/* the tasks — beneath the computer: the world leads, the
          templates caption it */}
      {/* the tasks — beneath the computer: the world leads, the
          templates caption it */}
      <div className="order-last mt-6">
        {/* container buttons — one hairline strip, cells sharing rules
            like the hero control. Three cases on the page; the full
            five (and the asker) live behind the stage's settings. */}
        <ul className="grid grid-cols-1 divide-y divide-border-subtle border border-border-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {TASKS.slice(0, 3).map((t, i) => {
            const active = i === taskIdx;
            return (
              <li key={t.id} className="flex">
                <button
                  className={`flex w-full flex-col gap-1.5 px-3.5 py-3.5 text-left transition-colors duration-200 ease-fast ${
                    active ? "bg-surface-hover" : "bg-white hover:bg-surface-subtle"
                  }`}
                  onClick={() => {
                    setTaskIdx(i);
                    setRun((r) => r + 1);
                  }}
                  type="button"
                >
                  <span className={active ? "text-text-primary" : "text-text-secondary"}>{t.icon}</span>
                  <span
                    className={`font-sans text-size-sm leading-5 ${
                      active ? "font-medium text-text-primary" : "text-text-secondary"
                    }`}
                  >
                    {t.personal[personId].title}
                  </span>
                  <span className="font-sans text-size-xs leading-[18px] text-text-tertiary">
                    {t.personal[personId].blurb}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* the stage — Figma 3642:7325 grammar. The landing's media-band
          rule: the window floats in even, generous air on every side.
          Popped out, the same stage fills the viewport — through a
          portal to <body>: the page's transformed wrappers would
          otherwise contain position:fixed and break the overlay. */}
      <StagePortal on={full}>
      <div
        ref={stageRef}
        className={
          full
            ? "group fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6"
            : "group relative flex w-full justify-center rounded-[14px] p-5 sm:p-8"
        }
        style={
          full
            ? undefined
            : {
                background:
                  "radial-gradient(120% 140% at 18% 12%, #dcecfe 0%, #9cc7fb 45%, #62a4f4 100%)",
              }
        }
      >
        {/* the little computer — each chosen story loads its world in:
            the wrapper remounts per run, replaying the arrival */}
        <div className="mini-world-in w-full max-w-[820px]" key={`${taskIdx}-${personId}-${run}`}>
        <div
          className={`relative w-full overflow-hidden rounded-[12px] bg-white ${
            full
              ? "origin-center shadow-[0_24px_64px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-fast"
              : "shadow-[0_18px_40px_rgba(23,68,130,0.28)]"
          }`}
          style={full ? { transform: `scale(${fullScale})` } : undefined}
        >
          {/* title bar */}
          <div className="flex h-[26px] items-center gap-1.5 border-b border-[#e4e2e0] bg-[#ececeb] px-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>

          <div className="relative flex h-[400px]">
            {/* the sidebar — flat rail */}
            <aside
              className="flex w-[132px] shrink-0 flex-col overflow-hidden border-r-[0.5px] bg-white"
              style={{ borderColor: STROKE_WEAK }}
            >
              <div
                className="flex h-[34px] shrink-0 items-end gap-2.5 border-b-[0.5px] px-[8px]"
                style={{ borderColor: STROKE_WEAK }}
              >
                <div className="flex flex-1 items-end">
                  <span className="pb-2 text-[10px] font-medium leading-[14px]" style={{ color: FG_PRIMARY }}>
                    Conversations
                  </span>
                </div>
                <div className="flex items-end pb-[8px]">
                  <span className="flex h-[16px] w-[19px] items-center justify-center rounded-[5px] bg-[#f0efee]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset("sb-share.svg")} alt="" className="size-[9px]" />
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-[1px] overflow-hidden pb-2 pl-[8px] pr-[7px] pt-[6px]">
                {ROWS.map((row) => {
                  const active = row.kind === "channel" && row.label === shownChannel;
                  const lit = shownBeat === 2 && row.label === task.channel;
                  return row.kind === "person" ? (
                    <div
                      key={row.label}
                      className="flex h-[22px] w-full items-center gap-[6px] rounded-[6px] px-[6px] transition-colors duration-150"
                      style={lit ? { background: BG_TERTIARY } : undefined}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={row.avatar} alt="" className="size-[12px] max-w-none shrink-0 rounded-full object-cover" />
                      <span className="truncate text-[10px] leading-[14px]" style={{ color: FG_SECONDARY }}>
                        {row.label}
                      </span>
                    </div>
                  ) : (
                    <button
                      key={row.label}
                      className="flex h-[22px] w-full cursor-pointer items-center gap-[6px] rounded-[6px] px-[6px] text-left transition-colors duration-150"
                      onClick={() => setChannel(row.label)}
                      style={active || lit ? { background: BG_TERTIARY } : undefined}
                      type="button"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={asset(active ? "sb-hash-active.svg" : "sb-hash.svg")} alt="" className="size-[11px] shrink-0" />
                      <span className="truncate text-[10px] leading-[14px]" style={{ color: active ? FG_PRIMARY : FG_SECONDARY }}>
                        {row.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* the main pane — header, the re-enactment, the composer */}
            <div className="flex min-w-0 flex-1 flex-col bg-white">
              <div
                className="flex h-[34px] shrink-0 items-center gap-[6px] border-b-[0.5px] px-3"
                style={{ borderColor: STROKE_WEAK }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset("hdr-hashtag.svg")} alt="" className="size-[9px]" />
                <span className="text-[10px] font-medium leading-[14px]" style={{ color: FG_PRIMARY }}>
                  {shownChannel}
                </span>
                <span className="ml-auto flex items-center gap-[4px] rounded-[5px] bg-[#f0efee] px-[6px] py-[4px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("hdr-headphones.svg")} alt="" className="h-[8px] w-[9px]" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset("hdr-chevron.svg")} alt="" className="h-[3px] w-[5px]" />
                </span>
              </div>

              {/* the room — the exchange lands here, turn by turn */}
              <div className="flex flex-1 flex-col justify-end overflow-hidden px-3 pb-2">
                {playout.map((turn, i) => {
                  const keep = turn.memory ? ++keepIdx : 0;
                  return (
                    <div key={i} className="contents">
                      <MsgRow
                        name={turn.who === "yumi" ? "Yumi" : person.name}
                        avatar={turn.who === "yumi" ? "/avatars/agent-1.png" : person.avatar}
                        isAgent={turn.who === "yumi"}
                        text={turn.text}
                        chip={turn.chip}
                        shown={inChannel && shownLanded > i}
                      />
                      {turn.memory ? (
                        <MemoryRow
                          text={turn.memory}
                          everShown={shownMemory >= keep}
                          visible={
                            inChannel &&
                            shownMemory >= keep &&
                            (nextYumiAfter(playout, i) === -1 || shownLanded <= nextYumiAfter(playout, i))
                          }
                        />
                      ) : null}
                    </div>
                  );
                })}
                {/* Yumi thinking — always the bottom row while it lasts;
                    the landing answer takes its place */}
                {!reduced ? <ThinkingRow line={thinkLine} shown={inChannel && shownThinking} /> : null}
              </div>

              {/* the composer — focused while the ask types: the accent
                  border and its soft ring, the product's focus grammar */}
              <div
                className={`m-2.5 rounded-[8px] border-[0.5px] px-2.5 pb-2 pt-2 transition-[border-color,box-shadow] duration-150 ${
                  shownBeat === 4 && shownLanded === 0
                    ? "border-[#2563eb] bg-white shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
                    : "border-[#dedcda] bg-white"
                }`}
              >
                {shownBeat === 4 && shownLanded === 0 && !reduced ? (
                  <TypeMini text={playout[0].text} on={beat === 4 && landed === 0} />
                ) : (
                  <p className="text-[9.5px] leading-[13px] text-[#a8a29e]">Enter your message</p>
                )}
                <div className="mt-3 flex items-center">
                  {/* IconPaperclip1 from the product icon registry
                      (Central Icons), inlined at mini scale. */}
                  <svg aria-hidden className="size-[11px]" fill="none" style={{ color: FG_SECONDARY }} viewBox="0 0 24 24">
                    <path
                      d="M5.75 10.75V15.25C5.75 18.5637 8.43629 21.25 11.75 21.25H12.25C15.5637 21.25 18.25 18.5637 18.25 15.25V7C18.25 4.65279 16.3472 2.75 14 2.75C11.6528 2.75 9.75 4.65279 9.75 7V14.875C9.75 16.0486 10.7014 17 11.875 17C13.0486 17 14 16.0486 14 14.875V7.75"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset("comp-send.svg")}
                    alt=""
                    className={`ml-auto size-[10px] transition-opacity duration-150 ${shownBeat === 4 && shownLanded === 0 ? "opacity-100" : "opacity-60"}`}
                  />
                </div>
              </div>
            </div>

            {/* the agent's cursor — scene-driven, never blocks clicks */}
            {!reduced ? (
              <div
                className="pointer-events-none absolute left-0 top-0 z-10"
                style={{
                  transform: `translate(${cursor.x}px, ${cursor.y}px)`,
                  transition: "transform 900ms cubic-bezier(0.3, 0, 0.2, 1)",
                }}
              >
                <AgentCursor kind={cursor.kind} />
              </div>
            ) : null}
          </div>
        </div>
        </div>
      </div>
      </StagePortal>
    </div>
  );
}

/** The stage, teleported: rendered in place normally, into <body> when
    popped out — a transformed ancestor would otherwise become the
    containing block for the fixed overlay. */
function StagePortal({ on, children }: { on: boolean; children: React.ReactNode }) {
  if (on && typeof document !== "undefined") return createPortal(children, document.body);
  return <>{children}</>;
}
