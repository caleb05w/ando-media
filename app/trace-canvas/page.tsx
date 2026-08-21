"use client";

// /trace-canvas — this week's working copy of the inline agent trace
// (forked from /trace-test Aug 20) with the seeded transcript emptied:
// the full shell and agent machinery on a BLANK message canvas, so new
// ideas start from a clean channel instead of the August transcript.
// Fully independent code (its own page/agents/data/css); public assets
// are shared with /agent-inline-trace and /multi-select.
//
// Sticky inline agent presence on the messaging shell. The idea in one
// line: the working agent is a tiny live face ATTACHED TO THE SENTENCE
// that invoked it, and when that sentence leaves the viewport the same
// face docks into the bottom-right rail instead — presence that
// survives scroll.
//
// THE LIFECYCLE (single agent per message for now):
//   @mention an agent (type "@" in the composer for the picker) → a
//   20px ringed face condenses in at the end of your message (or at
//   the row's right edge — "Inline | Right" header toggle):
//     · working — blue comet orbits the face; hover raises a labeled
//       popover [⬜ Stop]; Esc from an empty composer also stops YOUR
//       latest send ("esc to stop {agent}" hint shows in the composer).
//     · done — the answer posts as its own message and the face mists
//       out; a hover-only "· Worked for Xs" receipt rides the answer's
//       header next to the time (→ trace modal).
//     · failed — the ring seals red; "Failed after Xs" (→ trace) +
//       [Rerun] sit beside it on the line.
//     · stopped — the ring seals red and the face PARKS, dimmed, no
//       caption (your own act needs none); hover popover offers
//       [↻ Restart] [✕ Clear].
//   Clicking any face summons its run to the top of the "Active
//   agents" panel (full controls + trace).
//
// STICKY RAIL: the bottom-right stack carries ONLY off-screen work —
//   an in-view row is its own indicator. Scroll a working row away and
//   its agent slides into the rail (420ms); scroll back and it returns
//   to the row. Completions you HAVEN'T seen stay railed (green) until
//   you view the answer — clicking a bubble jumps to it; viewing is
//   what clears it. Failed/stopped rail while off-screen too.
//   Dismissing a run from the panel (×) clears it everywhere.
//
// DEMO CONTROLS: the header "Agents" button opens agent settings —
//   per-agent proactivity plus "Response time" (~3s/~10s/~30s/~2m, a
//   pace multiplier over each agent's script). @Yumi fails attempt 1
//   by her own script; rerun succeeds.
//
// BENCHED (machinery kept, surfaces off): the tool-approval Allow/Deny
//   card (SpawnOverride.approval), the sidebar channel wash (LocalNav
//   thinkingChannel), the message's left-edge thinking wash
//   (.aw-thinking-wash), and the invoke-text blue highlight
//   (.aw-invoke-highlight).
//
// Shell chrome (rail, sidebar, header, transcript) is unchanged from
// the baseplate; transcript/sidebar data and assets are shared with
// /multi-select and /agent-working rather than duplicated.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./trace-canvas.css";
import {
  SHELL_PIN,
  SHELL_SIDEBAR,
  type ShellBlock,
  type ShellSidebarRow,
} from "./data";
import {
  AGENTS,
  AgentFace,
  AgentFlyout,
  CloseGlyph,
  CornerStack,
  JumpToLatestPill,
  RerunGlyph,
  RingedFace,
  StopGlyph,
  statusLine,
  TraceModal,
  formatDuration,
  traceViewFromRun,
  useAgentEngine,
  type AgentDef,
  type AgentRun,
  type TraceView,
} from "./agents";
import { Stage } from "../agent-typing-experience/stage";
import {
  typingFrame,
  VARIANTS,
  type Variant as TypingVariant,
} from "../agent-typing-experience/variants";

// The typing-presence animation: one of the /agent-typing-experience
// morphs plays in the identity slot — the storyboard wave while the agent
// types, the arrival (dots → the agent's own face) on demotion — replacing
// the old dot-pulse + converge/face-form CSS. The standalone route
// defaults to the at-scale slingshot; the showcase page passes whichever
// variant its deck has selected.
const DEFAULT_TYPING_VARIANT = VARIANTS.find((v) => v.key === "slingshot-v3")!;

// Product parity for the typing line's scale: the wave's dots render at
// the app's typing-indicator size (storyboard dots are r=2 units → ~6px),
// and the arrival ends at the 12px in-text face (19.2 units) the flight
// chip carries to the tray.
const TYPING_WAVE_PX_PER_UNIT = 1.7;
const TYPING_FACE_PX_PER_UNIT = 12 / 19.2;
// The app's dots sit nearly touching — squeeze the wave's spread toward
// center (storyboard centers are 6 units; the product reads ~4.7), and
// release over the morph's first 150ms so the arrival travels its
// authored geometry.
const TYPING_WAVE_SQUEEZE = 1.12;
// How long an agent types before the transition animation hands the
// floor to the trace tray.
const TYPING_DEMOTE_MS = 5000;

// Legacy assets from the /multi-select mock (a few still in use) plus
// the August shell's own exports in /public/agent-inline-trace.
const A = "/multi-select";
const AA = "/agent-inline-trace";

const FG_PRIMARY = "#1a1817";
const FG_SECONDARY = "#58524e";
const FG_TERTIARY = "#78716c";
const STROKE_WEAK = "#f0efee";
const BG_TERTIARY = "#f5f5f4";
const BRAND = "#2563eb";

/* ------------------------------ message model ------------------------------ */

// The three interfaces the view switcher flips between. "thread" is the
// thread panel's own transcript; the channel pane inside Thread view
// renders the "channel" surface.
type Surface = "channel" | "dm" | "thread";
type ViewMode = "channel" | "dm" | "thread";

// DM peer: the conversation is one-on-one with an agent — the whole
// point of the canvas is talking to agents, so the DM shell gets one.
const DM_PEER = AGENTS[0];

type AwSegment = { text: string; link?: boolean; mention?: boolean };

type AwMessage = {
  id: string;
  // Which interface the message lives in; untagged rows are channel.
  surface?: Surface;
  // Thread reply: id of the ROOT message this reply belongs to. Replies
  // never render in the main transcript — the root carries a reply
  // footer instead, and the thread panel shows them.
  parentId?: string;
  authorName: string;
  // "disc" resolves a seeded portrait by authorName (Face); agents keep
  // their own faces.
  avatar: "disc" | { agent: AgentDef };
  time: string;
  // Live messages (sends, answers) are plain segment paragraphs; seeded
  // transcript rows carry rich BLOCKS (lists, image) instead.
  paragraphs: AwSegment[][];
  blocks?: ShellBlock[];
  threadFooter?: { faces: number; count: string; lastReply: string };
  // Agent answers post as their own messages (nesting shelved for now);
  // the "Worked for Xm Ys ›" footer opens the trace modal.
  workedForMs?: number;
  runId?: string;
  // System notices — a quiet gray line in the text column, no avatar,
  // no author header. Proactivity notices ("Oli updated Tadao's
  // proactivity to mention only") carry structured fields; the level is
  // a brand-blue CTA that reopens the picker.
  system?: boolean;
  // Standalone notice: "{user} updated {agent}'s proactivity to {level}"
  // — the settings/CTA voice, anchored to nothing.
  proactivity?: { actor: string; agentName: string; level: ProactivityLevel };
  // Footers under the invoking message: "{agent} updated its own
  // proactivity to {level}" — the chat-command voice, attributed by
  // position, spaced like the Worked-for trace footer.
  proactivityFooters?: Array<{ agentName: string; level: ProactivityLevel }>;
};

const PROACTIVITY_LEVELS = ["high", "medium", "low", "mention only"] as const;
type ProactivityLevel = (typeof PROACTIVITY_LEVELS)[number];

// Blank canvas: no seeded transcript. Everything on screen is typed
// live — the first send is the first message in the channel.
const SEED_MESSAGES: AwMessage[] = [];

// Mentions parse against the known agent roster; canonical casing renders
// in the pill regardless of what was typed.
const MENTION_RE = new RegExp(
  `@(${[...AGENTS].sort((a, b) => b.name.length - a.name.length).map((a) => a.name).join("|")})`,
  "gi"
);

function parseMentions(text: string): AwSegment[] {
  const segments: AwSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(MENTION_RE)) {
    if (match.index > cursor) segments.push({ text: text.slice(cursor, match.index) });
    const agent = AGENTS.find((a) => a.name.toLowerCase() === match[1].toLowerCase())!;
    segments.push({ text: `@${agent.name}`, mention: true });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments.length > 0 ? segments : [{ text }];
}

// The flyout sub-line shows the ask, not the address — strip leading
// mention tokens ("@Tadao @Yumi Tell me a joke" → "Tell me a joke").
function promptOf(text: string): string {
  const stripped = text.replace(
    new RegExp(`^(\\s*@(${AGENTS.map((a) => a.name).join("|")})\\s*)+`, "i"),
    ""
  );
  return stripped.length > 0 ? stripped : text;
}

function nowLabel(): string {
  const date = new Date();
  let hours = date.getHours();
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${String(date.getMinutes()).padStart(2, "0")} ${suffix}`;
}

// DM rows carry the fuller "8/18/26, 12:44 PM" stamp (per the DM shell);
// channel and thread rows keep the bare time.
function stampFor(surface: Surface): string {
  if (surface !== "dm") return nowLabel();
  const date = new Date();
  return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(2)}, ${nowLabel()}`;
}

/* ------------------------------- shell chrome ------------------------------ */

// The disc is the FALLBACK now — humans resolve seeded portraits below.
function Disc({ size }: { size: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full bg-[#f5f5f4]"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

// Portraits from the figma-seed avatar set (/public/avatars). Humans
// resolve by name; agent names resolve to their AgentFace; anyone
// unmatched (e.g. Graeme — no seed portrait) keeps the quiet gray disc.
const AVATARS: Record<string, string> = {
  Caleb: "caleb",
  AJ: "aj",
  Oli: "oli",
  "Sara Du": "sara",
  Alex: "alex",
  Andrew: "andrew",
  Felipe: "felipe",
  Jordan: "jordan",
  Ryan: "ryan",
};

// Thread-footer facepiles have no participant data — a fixed cast order
// stands in, sliced to each footer's count.
const THREAD_FACES = ["Oli", "Sara Du", "Ryan"];

function Face({ name, size }: { name: string; size: number }) {
  const file = AVATARS[name];
  if (file)
    return (
      <img
        src={`/avatars/${file}.png`}
        alt=""
        aria-hidden
        className="inline-block shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  const agent = AGENTS.find((candidate) => candidate.name === name);
  if (agent) return <AgentFace agent={agent} size={size} />;
  return <Disc size={size} />;
}

// 16px avatar + 5px presence dot, the sidebar/rail person unit.
function PresenceDisc({ name, presence }: { name: string; presence: "green" | "away" }) {
  return (
    <span className="relative size-4 shrink-0">
      <Face name={name} size={16} />
      <span
        className="absolute size-[5px] rounded-full"
        style={{
          left: 11,
          top: 12,
          background: presence === "green" ? "#22c55e" : "#d3d1ce",
          boxShadow: "0 0 0 1.5px white",
        }}
      />
    </span>
  );
}

// Global rail, August shell (Figma 394:8749): #f5f5f4 strip, white
// workspace tile with the Ando mark + chevron badge, white chat tile,
// then flat 16px tools; help / settings / account presence at the foot.
function GlobalNav() {
  return (
    <div
      className="relative flex w-12 shrink-0 flex-col justify-between border-r-[0.5px] px-2 py-2"
      style={{ borderColor: STROKE_WEAK, background: BG_TERTIARY }}
    >
      <div className="flex w-8 flex-col items-center">
        <span className="relative mb-2 flex size-8 items-center justify-center">
          <span className="flex size-7 items-center justify-center overflow-clip rounded-[6px] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <img src={`${AA}/rail-workspace.png`} alt="" className="size-7 object-contain" />
          </span>
          <span className="absolute left-[22px] top-[20px] flex size-3 items-center justify-center rounded-full bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <img src={`${AA}/rail-chevron.svg`} alt="" className="h-[2.5px] w-[5px]" />
          </span>
        </span>
        <span className="mb-2 h-px w-4" style={{ background: STROKE_WEAK }} />
        <span className="mb-2 flex size-8 items-center justify-center">
          <span className="flex size-7 items-center justify-center rounded-[6px] bg-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
            <img src={`${AA}/rail-chat.svg`} alt="" className="size-[13px]" />
          </span>
        </span>
        <span className="mb-2 flex size-8 items-center justify-center">
          <img src={`${AA}/rail-inbox.svg`} alt="" className="h-[11px] w-[15px]" />
        </span>
        <span className="mb-2 flex size-8 items-center justify-center">
          <img src={`${AA}/rail-search.svg`} alt="" className="size-[12px]" />
        </span>
        <span className="flex size-8 items-center justify-center">
          <img src={`${AA}/rail-studio.svg`} alt="" className="h-[12px] w-[13px]" />
        </span>
        <span className="mt-2 mb-2 h-px w-4" style={{ background: STROKE_WEAK }} />
        <span className="mb-2 flex size-8 items-center justify-center">
          <img src={`${AA}/rail-actions.svg`} alt="" className="size-[12px]" />
        </span>
        <span className="flex size-8 items-center justify-center">
          <img src={`${AA}/rail-invite.svg`} alt="" className="h-[13px] w-[12px]" />
        </span>
      </div>
      <div className="flex w-8 flex-col items-center">
        <span className="flex h-10 w-8 items-center justify-center pb-2">
          <span className="text-[14px] leading-5" style={{ color: FG_SECONDARY }}>
            ?
          </span>
        </span>
        <span className="mb-2 flex size-8 items-center justify-center">
          <img src={`${AA}/rail-settings.svg`} alt="" className="h-[12px] w-[13px]" />
        </span>
        <span className="flex size-8 items-center justify-center">
          <PresenceDisc name="Caleb" presence="green" />
        </span>
      </div>
    </div>
  );
}

// One sidebar row, August grammar (Figma 394:8846): section headings
// with the folder mark, an add-row, people with presence dots, channels
// (active = #f5f5f4 pill, muted = opacity-50), and plain dividers.
function SidebarRowView({ row, thinking }: { row: ShellSidebarRow; thinking?: boolean }) {
  if (row.kind === "section") {
    return (
      <div className="mt-3 flex h-7 w-full items-center gap-2 px-2 first:mt-0">
        <span className="flex w-6 justify-center">
          <img src={`${AA}/sb-folder.svg`} alt="" className="h-[9px] w-[13px]" />
        </span>
        <span
          className="text-[11px] font-medium uppercase leading-[14px] tracking-[1.1px]"
          style={{ color: FG_SECONDARY }}
        >
          {row.label}
        </span>
      </div>
    );
  }
  if (row.kind === "add") {
    return (
      <div className="flex h-8 w-full items-center gap-2 rounded-[6px] py-1.5 pl-[22px] pr-2">
        <span className="flex size-4 items-center justify-center">
          <img src={`${AA}/sb-plus.svg`} alt="" className="size-2" />
        </span>
        <span className="text-[14px] leading-5" style={{ color: FG_SECONDARY }}>
          {row.label}
        </span>
      </div>
    );
  }
  if (row.kind === "divider") {
    return <span className="mx-2 my-2 h-px shrink-0" style={{ background: STROKE_WEAK }} />;
  }
  if (row.kind === "person") {
    return (
      <div className="flex h-8 w-full items-center gap-2 rounded-[6px] py-1.5 pl-[22px] pr-2">
        <PresenceDisc name={row.name} presence={row.presence} />
        <span className="truncate text-[14px] leading-5" style={{ color: FG_SECONDARY }}>
          {row.name}
        </span>
      </div>
    );
  }
  // channel — flat-list rows sit at the narrow indent, sectioned rows
  // at the 22px one (matching the Figma's w-319 vs w-305 rows).
  return (
    <div
      className={`relative flex h-8 w-full items-center gap-2 rounded-[8px] py-1.5 pr-2 ${
        row.muted ? "opacity-50" : ""
      } ${row.flat ? "pl-2" : "pl-[22px]"}`}
      style={row.active && !thinking ? { background: BG_TERTIARY } : undefined}
    >
      {thinking ? <span aria-hidden className="aw-thinking-wash absolute inset-0" /> : null}
      <img
        src={`${AA}/${
          row.active ? "sb-hash-active" : row.label === "sf-team" ? "sb-hash-lock" : "sb-hash"
        }.svg`}
        alt=""
        className="relative size-4 shrink-0"
      />
      <span
        className="relative truncate text-[14px] leading-5"
        style={{ color: row.active ? FG_PRIMARY : FG_SECONDARY }}
      >
        {row.label}
      </span>
    </div>
  );
}

// thinkingChannel: label of the channel an agent is working in — its
// sidebar row carries the thinking wash, the ambient cross-channel
// tell. (Benched: fed null.)
function LocalNav({ thinkingChannel }: { thinkingChannel: string | null }) {
  return (
    <div
      className="flex w-[354px] shrink-0 flex-col overflow-hidden border-r-[0.5px] bg-white"
      style={{ borderColor: STROKE_WEAK }}
    >
      <div
        className="flex h-12 shrink-0 items-end gap-4 border-b-[0.5px] pl-[10px] pr-3"
        style={{ borderColor: STROKE_WEAK }}
      >
        <div className="flex flex-1 items-end gap-4">
          {/* Tabs with the active underline, not pills. */}
          <span
            className="border-b pb-3 text-[14px] font-medium leading-5"
            style={{ color: FG_PRIMARY, borderColor: FG_PRIMARY }}
          >
            Conversations
          </span>
          <span
            className="border-b border-transparent pb-3 text-[14px] leading-5"
            style={{ color: FG_SECONDARY }}
          >
            Threads
          </span>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <img src={`${AA}/sb-dots.svg`} alt="" className="h-[2.5px] w-[13px]" />
          <span className="flex items-center gap-1 rounded-[6px] bg-white px-1.5 py-1 shadow-[0px_0px_0.5px_0.75px_#ebe9e8]">
            <img src={`${AA}/sb-share.svg`} alt="" className="size-[13px]" />
            <img src={`${AA}/sb-caret.svg`} alt="" className="h-[3px] w-[5px]" />
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-[2px] overflow-y-auto px-[10px] pb-4 pt-2">
        {SHELL_SIDEBAR.map((row, index) => (
          <SidebarRowView
            key={index}
            row={row}
            thinking={
              thinkingChannel != null && row.kind === "channel" && row.label === thinkingChannel
            }
          />
        ))}
      </div>
    </div>
  );
}

// Where the working agent lives on the invoking message: appended to
// the END of the text (in-line, 20px) or on the row's RIGHT edge
// (rail-sized 30px, the Figma 19-5559 Tool Call slot).
export type ClusterSide = "inline" | "right";

// The interface switcher, in the header's segmented-control grammar
// (same treatment as the Placement toggle): quiet gray track, white
// active segment.
function ViewSwitcher({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <span
      className="flex items-center rounded-[6px] p-0.5"
      style={{ background: BG_TERTIARY }}
      role="group"
      aria-label="Interface view"
    >
      {(["channel", "dm", "thread"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-pressed={view === mode}
          className={`rounded-[5px] px-2 py-0.5 text-[11px] leading-4 transition-colors ${
            view === mode ? "bg-white shadow-[0px_0px_0.5px_0.75px_#ebe9e8]" : ""
          }`}
          style={{ color: view === mode ? FG_PRIMARY : FG_TERTIARY }}
        >
          {mode === "channel" ? "#channel" : mode === "dm" ? "DM" : "Thread"}
        </button>
      ))}
    </span>
  );
}

function PageHeader({
  clusterSide,
  onClusterSideChange,
  presenceStyle,
  onPresenceStyleChange,
  suggestionStyle,
  onSuggestionStyleChange,
  levels,
  pace,
  onPaceChange,
  onPick,
  viewSwitcher,
}: {
  clusterSide: ClusterSide;
  onClusterSideChange: (side: ClusterSide) => void;
  presenceStyle: "typing" | "inline" | "reply";
  onPresenceStyleChange: (style: "typing" | "inline" | "reply") => void;
  suggestionStyle: SuggestionStyle;
  onSuggestionStyleChange: (style: SuggestionStyle) => void;
  levels: Record<string, ProactivityLevel>;
  pace: number;
  onPaceChange: (pace: number) => void;
  onPick: (agent: AgentDef, level: ProactivityLevel) => void;
  viewSwitcher?: React.ReactNode;
}) {
  // Demo controls (placement toggle + agent settings) live behind the
  // members chip now, not as standalone header buttons.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [menuOpen]);

  return (
    <div
      className="flex h-12 shrink-0 items-center gap-10 border-b-[0.5px] bg-white px-4"
      style={{ borderColor: STROKE_WEAK }}
    >
      <div className="flex flex-1 items-center gap-2">
        <div className="flex flex-1 items-center">
          <span className="flex h-8 items-center gap-2 px-0.5">
            <img src={`${AA}/hdr-hashtag.svg`} alt="" className="size-[12px]" />
            <span className="text-[14px] font-medium leading-5" style={{ color: FG_PRIMARY }}>
              design
            </span>
          </span>
        </div>
        {viewSwitcher}
        {/* Jam split-button (Figma 394:7721): 28+16 halves on a 1px
            seam, radii 6 outside / 1 inside. */}
        <span className="flex items-start gap-px">
          <span className="flex h-6 w-7 items-center justify-center rounded-l-[6px] rounded-r-[1px] bg-[#f5f5f4]">
            <img src={`${AA}/hdr-headphones.svg`} alt="" className="size-[12px]" />
          </span>
          <span className="flex h-6 w-4 items-center justify-center rounded-l-[1px] rounded-r-[6px] bg-[#f5f5f4]">
            <img src={`${AA}/hdr-chevron.svg`} alt="" className="h-[3px] w-[5px]" />
          </span>
        </span>
        <span ref={menuRef} className="relative flex items-center">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label="Channel members and demo controls"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center justify-center gap-1.5 rounded-[8px] border-[0.5px] px-2 py-1 transition-colors hover:bg-[#fafaf9]"
            style={{ borderColor: STROKE_WEAK }}
          >
            <img src={`${AA}/hdr-people.svg`} alt="" className="h-[11px] w-4" />
            <span className="text-center text-[12px] leading-4" style={{ color: FG_PRIMARY }}>
              12
            </span>
          </button>
          {menuOpen ? (
            <div className="aw-pop-enter absolute right-0 top-full z-40 mt-1.5 w-[300px] rounded-[10px] bg-white p-1 shadow-[0px_2px_12px_0px_rgba(16,16,16,0.06),0px_16px_24px_-12px_rgba(16,16,16,0.08),0px_0px_0.5px_0.75px_rgba(16,16,16,0.06)]">
              {/* Working state: "typing" = general turn, answers in
                  channel behind the typing indicator (default); inline
                  and reply keep the fork-a-thread auditions. */}
              <div className="flex items-center justify-between rounded-[6px] px-2 py-1.5">
                <span className="text-[12px] leading-4" style={{ color: FG_SECONDARY }}>
                  Working state
                </span>
                <span
                  className="flex items-center rounded-[6px] p-0.5"
                  style={{ background: BG_TERTIARY }}
                  role="group"
                  aria-label="Working indicator style"
                >
                  {(["typing", "inline", "reply"] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => onPresenceStyleChange(style)}
                      className={`rounded-[5px] px-2 py-0.5 text-[11px] leading-4 transition-colors ${
                        presenceStyle === style
                          ? "bg-white shadow-[0px_0px_0.5px_0.75px_#ebe9e8]"
                          : ""
                      }`}
                      style={{ color: presenceStyle === style ? FG_PRIMARY : FG_TERTIARY }}
                    >
                      {style === "typing" ? "Typing" : style === "inline" ? "Inline" : "Reply"}
                    </button>
                  ))}
                </span>
              </div>
              {/* Suggestions: the multi-action row under the newest
                  answer — chips, numbered list, links strip, or off. */}
              <div className="flex items-center justify-between rounded-[6px] px-2 py-1.5">
                <span className="text-[12px] leading-4" style={{ color: FG_SECONDARY }}>
                  Suggestions
                </span>
                <span
                  className="flex items-center rounded-[6px] p-0.5"
                  style={{ background: BG_TERTIARY }}
                  role="group"
                  aria-label="Suggested actions style"
                >
                  {(["chips", "list", "links", "off"] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => onSuggestionStyleChange(style)}
                      className={`rounded-[5px] px-2 py-0.5 text-[11px] leading-4 transition-colors ${
                        suggestionStyle === style
                          ? "bg-white shadow-[0px_0px_0.5px_0.75px_#ebe9e8]"
                          : ""
                      }`}
                      style={{
                        color: suggestionStyle === style ? FG_PRIMARY : FG_TERTIARY,
                      }}
                    >
                      {style === "chips"
                        ? "Chips"
                        : style === "list"
                          ? "List"
                          : style === "links"
                            ? "Links"
                            : "Off"}
                    </button>
                  ))}
                </span>
              </div>
              {/* Placement: agent at the end of the text vs the row's
                  right edge (the inline cluster's slot). */}
              <div className="flex items-center justify-between rounded-[6px] px-2 py-1.5">
                <span className="text-[12px] leading-4" style={{ color: FG_SECONDARY }}>
                  Placement
                </span>
                <span
                  className="flex items-center rounded-[6px] p-0.5"
                  style={{ background: BG_TERTIARY }}
                  role="group"
                  aria-label="Working agent placement"
                >
                  {(["inline", "right"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => onClusterSideChange(side)}
                      className={`rounded-[5px] px-2 py-0.5 text-[11px] leading-4 transition-colors ${
                        clusterSide === side
                          ? "bg-white shadow-[0px_0px_0.5px_0.75px_#ebe9e8]"
                          : ""
                      }`}
                      style={{ color: clusterSide === side ? FG_PRIMARY : FG_TERTIARY }}
                    >
                      {side === "inline" ? "Inline" : "Right"}
                    </button>
                  ))}
                </span>
              </div>
              {/* Response time: how long a run takes from invoke to
                  answer — applies to the NEXT invocation, not runs
                  already underway. */}
              <div className="flex items-center justify-between rounded-[6px] px-2 py-1.5">
                <span className="text-[12px] leading-4" style={{ color: FG_SECONDARY }}>
                  Response time
                </span>
                <span
                  className="flex items-center rounded-[6px] p-0.5"
                  style={{ background: BG_TERTIARY }}
                  role="group"
                  aria-label="Agent response time"
                >
                  {PACE_OPTIONS.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => onPaceChange(option.value)}
                      className={`rounded-[5px] px-2 py-0.5 text-[11px] leading-4 transition-colors ${
                        pace === option.value
                          ? "bg-white shadow-[0px_0px_0.5px_0.75px_#ebe9e8]"
                          : ""
                      }`}
                      style={{ color: pace === option.value ? FG_PRIMARY : FG_TERTIARY }}
                    >
                      {option.label}
                    </button>
                  ))}
                </span>
              </div>
              <div className="mx-2 my-0.5 h-px" style={{ background: STROKE_WEAK }} />
              {/* Per-agent proactivity — the old settings modal's rows,
                  inlined. Changes post a notice to the channel so
                  nothing about an agent's behavior changes silently. */}
              {AGENTS.map((agent) => (
                <div key={agent.id} className="flex items-center gap-2.5 rounded-[6px] px-2 py-1.5">
                  <AgentFace agent={agent} size={20} />
                  <span
                    className="min-w-0 flex-1 truncate text-[12px] leading-4"
                    style={{ color: FG_PRIMARY }}
                  >
                    {agent.name}
                  </span>
                  <LevelPicker
                    level={levels[agent.id] ?? "medium"}
                    onPick={(level) => onPick(agent, level)}
                  />
                </div>
              ))}
              <div
                className="mx-1 mt-0.5 border-t-[0.5px] px-1 py-1.5 text-[11px] leading-4"
                style={{ borderColor: STROKE_WEAK, color: FG_TERTIARY }}
              >
                Changes post a notice to #design — proactivity never changes silently.
              </div>
            </div>
          ) : null}
        </span>
      </div>
    </div>
  );
}

// DM header (per the DM shell): peer avatar with presence, name, and
// the headphones split-button — no member count, no demo controls
// (those live on the channel header's members chip).
function DmHeader({
  peer,
  viewSwitcher,
}: {
  peer: AgentDef;
  viewSwitcher?: React.ReactNode;
}) {
  return (
    <div
      className="flex h-12 shrink-0 items-center gap-2 border-b-[0.5px] bg-white px-4"
      style={{ borderColor: STROKE_WEAK }}
    >
      <span className="flex flex-1 items-center gap-2">
        <span className="relative flex shrink-0">
          <AgentFace agent={peer} size={24} />
          <span
            className="absolute -bottom-px -right-px size-[8px] rounded-full bg-[#16a34a]"
            style={{ boxShadow: "0 0 0 1.5px white" }}
          />
        </span>
        <span className="text-[14px] font-medium leading-5" style={{ color: FG_PRIMARY }}>
          {peer.name}
        </span>
      </span>
      {viewSwitcher}
      <span className="flex items-start gap-px">
        <span className="flex h-6 w-7 items-center justify-center rounded-l-[6px] rounded-r-[1px] bg-[#f5f5f4]">
          <img src={`${AA}/hdr-headphones.svg`} alt="" className="size-[12px]" />
        </span>
        <span className="flex h-6 w-4 items-center justify-center rounded-l-[1px] rounded-r-[6px] bg-[#f5f5f4]">
          <img src={`${AA}/hdr-chevron.svg`} alt="" className="h-[3px] w-[5px]" />
        </span>
      </span>
    </div>
  );
}

// DM intro block: big face, name, one-liner — tops the conversation.
function DmIntro({ peer }: { peer: AgentDef }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-3 px-4 pb-6 pt-14">
      <AgentFace agent={peer} size={64} />
      <span className="text-[18px] font-semibold leading-6" style={{ color: FG_PRIMARY }}>
        {peer.name}
      </span>
      <span className="text-[14px] leading-5" style={{ color: FG_SECONDARY }}>
        This is a conversation between just you and {peer.name}.
      </span>
    </div>
  );
}

/* --------------------------- suggested actions ----------------------------- */

// Agent-proposed follow-ups riding the newest answer — the multi-action
// inline surface. Canned per agent; generic fallback.
const AGENT_SUGGESTIONS: Record<string, string[]> = {
  tadao: ["Hourly breakdown", "Weekend surf report", "Set a rain alert"],
  ando: ["Post this to standup", "List the open questions", "Draft the bridges recap"],
  yumi: ["Diff against staging", "Export the token table", "Flag the drifted values"],
};
const suggestionsFor = (agent: AgentDef) =>
  AGENT_SUGGESTIONS[agent.id] ?? [
    "Go deeper on this",
    "Summarize as bullets",
    "Draft a follow-up",
  ];

type SuggestionStyle = "chips" | "list" | "links" | "off";

// Three auditions of the same surface: pill CHIPS (Gmail smart-reply
// grammar), numbered LIST rows (the Suggested-drafts form factor), and
// a one-line LINKS strip (quietest). All at the text column indent,
// staggered entrance in the typing family's rise.
function SuggestedActions({
  agent,
  variant,
  onPick,
}: {
  agent: AgentDef;
  variant: Exclude<SuggestionStyle, "off">;
  onPick: (text: string) => void;
}) {
  const suggestions = suggestionsFor(agent);
  if (variant === "links") {
    return (
      <div className="aw-typing-in flex items-baseline gap-1.5 py-1 pl-[56px] pr-4 text-[12px] leading-4">
        <span style={{ color: FG_TERTIARY }}>Suggested:</span>
        {suggestions.map((text, index) => (
          <span key={text} className="flex items-baseline gap-1.5">
            {index > 0 ? <span style={{ color: FG_TERTIARY }}>·</span> : null}
            <button
              type="button"
              onClick={() => onPick(text)}
              className="text-[#7C3AED] transition-opacity hover:opacity-70"
            >
              {text}
            </button>
          </span>
        ))}
      </div>
    );
  }
  if (variant === "list") {
    return (
      <div className="flex flex-col py-1 pl-[52px] pr-4">
        {suggestions.map((text, index) => (
          <button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            className="aw-typing-in flex items-center gap-2.5 rounded-[6px] px-1 py-1 text-left transition-colors hover:bg-[#f5f5f4]"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span
              className="flex size-[18px] items-center justify-center rounded-[4px] text-[11px] font-medium"
              style={{ background: BG_TERTIARY, color: FG_TERTIARY }}
            >
              {index + 1}
            </span>
            <span className="text-[13px] leading-4" style={{ color: FG_SECONDARY }}>
              {text}
            </span>
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1.5 pl-[56px] pr-4">
      {suggestions.map((text, index) => (
        <button
          key={text}
          type="button"
          onClick={() => onPick(text)}
          className="aw-typing-in rounded-full border-[0.5px] border-[#e7e5e4] bg-white px-2.5 py-1 text-[12px] leading-4 transition-colors hover:border-[#d6d3d1] hover:bg-[#fafaf9]"
          style={{ color: FG_SECONDARY, animationDelay: `${index * 50}ms` }}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

// Typing indicator for linear replies: the app's slim "Tadao is
// typing…" line riding just above the composer. The identity slot runs
// the selected /agent-typing-experience variant instead of the old
// dot-pulse: the storyboard wave while the agent types, and on demotion
// the variant's morph plays the arrival in place — the dots become the
// agent's own face while the text fades ("morph") — before the formed
// face flies right along the composer's top edge to land on the trace
// tray ("fly"), exactly as before.
function TypingIndicator({
  runs,
  phases = {},
  variant,
}: {
  runs: AgentRun[];
  phases?: Record<string, "morph" | "fly" | "collapse">;
  variant: TypingVariant;
}) {
  // One clock for the line — wave and arrivals both. The step is clamped
  // so a backgrounded tab resumes where it left off.
  const [vt, setVt] = useState(0);
  const vtRef = useRef(0);
  const last = useRef<number | null>(null);
  const active = runs.length > 0;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = (now: number) => {
      if (last.current != null) {
        vtRef.current += Math.min(now - last.current, 64);
      }
      last.current = now;
      setVt(vtRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      last.current = null;
    };
  }, [active]);
  // Pin the clock when a line enters demotion, so the arrival plays from
  // its first frame regardless of where the wave was.
  const [morphStarts, setMorphStarts] = useState<Record<string, number>>({});
  useEffect(() => {
    setMorphStarts((prev) => {
      let changed = false;
      const next: Record<string, number> = { ...prev };
      for (const [msgId, phase] of Object.entries(phases)) {
        if (phase != null && !(msgId in next)) {
          next[msgId] = vtRef.current;
          changed = true;
        }
      }
      for (const key of Object.keys(next)) {
        if (phases[key] == null) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [phases]);

  if (!active) return null;
  // One line per invoking message — an invocation carries up to three
  // agents, so a line reads "Tadao, Yumi, and Moss are typing…".
  const groups = new Map<string, AgentRun[]>();
  runs.forEach((run) => {
    const list = groups.get(run.messageId) ?? [];
    list.push(run);
    groups.set(run.messageId, list);
  });
  // Invocation rules cap a turn at three agents.
  type Row = {
    id: string;
    key: string;
    agents: AgentDef[];
    phase?: "morph" | "fly" | "collapse";
    morphT: number;
  };
  const rows: Row[] = [...groups.entries()].map(([msgId, groupRuns]) => ({
    id: msgId,
    key: msgId,
    agents: groupRuns.slice(0, 3).map((run) => run.agent),
    phase: phases[msgId],
    morphT: vt - (morphStarts[msgId] ?? vt),
  }));
  return (
    <div className="flex shrink-0 flex-col pl-1">
      {rows.map(({ key, agents, phase, morphT }) => {
        // The slot's frame: the wave until demotion, then the variant's
        // arrival, clamped resolved once it lands.
        const rawFrame =
          phase == null
            ? typingFrame(vt)
            : variant.morph(Math.min(morphT, variant.morphMs));
        const squeeze =
          phase == null
            ? TYPING_WAVE_SQUEEZE
            : TYPING_WAVE_SQUEEZE +
              (1 - TYPING_WAVE_SQUEEZE) * Math.min(1, morphT / 150);
        const frame =
          squeeze >= 1
            ? rawFrame
            : {
                ...rawFrame,
                sats: rawFrame.sats.map((d) => ({ ...d, x: 30 + (d.x - 30) * squeeze })),
                blob: { ...rawFrame.blob, x: 30 + (rawFrame.blob.x - 30) * squeeze },
              };
        // Product parity: the wave runs at the app's typing-dot scale
        // (~6px dots), and the arrival carries the scale down so the
        // face lands at the in-text 12px body the flight chip uses.
        const morphP =
          phase == null ? 0 : Math.min(1, morphT / variant.morphMs);
        const scaleEase =
          morphP < 0.5
            ? 4 * morphP * morphP * morphP
            : 1 - Math.pow(-2 * morphP + 2, 3) / 2;
        const pxPerUnit =
          TYPING_WAVE_PX_PER_UNIT +
          (TYPING_FACE_PX_PER_UNIT - TYPING_WAVE_PX_PER_UNIT) * scaleEase;
        // The slot hugs the wave (its dots run wider than the 20px
        // identity box at product scale) and eases back to 20px as the
        // arrival rides the scale down — by flight time it IS the 20px
        // box the tray math expects.
        const slotW = Math.max(20, 2 * (6 * squeeze + 2.24) * pxPerUnit);
        return (
          <div
            key={key}
            data-typing-row
            className={`relative flex h-5 items-center gap-[2px] ${
              phase === "collapse" ? "aw-typing-row-collapse" : "mb-1.5 aw-typing-in"
            }`}
          >
            {/* The identity slot: the new indicator waves and morphs
                INSIDE this fixed 20px box (which drifts right and then
                holds); the faces fly to the tray from the same spot. */}
            <span
              className={`relative flex h-5 shrink-0 items-center justify-center ${
                phase != null ? "aw-typing-slot-drift" : ""
              }`}
              style={{ width: slotW }}
              // Flight target: the NEWCOMER'S slot in the tray — the
              // stack is right-anchored with new chips joining on the
              // left, so the slot sits 22px further left per existing
              // chip (30px bodies, −8 overlap; rightmost center at
              // right−31, chip line at bottom−169). Measured from the
              // slot's own center, x and y, once per flight.
              ref={(el) => {
                if (el == null || (phase !== "fly" && phase !== "collapse")) return;
                if (el.style.getPropertyValue("--aw-fly-x") !== "") return;
                const pane = el.closest("main, aside");
                if (pane == null) return;
                const paneRect = pane.getBoundingClientRect();
                const slotRect = el.getBoundingClientRect();
                const stack = pane.querySelector('[class*="bottom-[146px]"]');
                const existing = stack ? stack.querySelectorAll("[data-run-id]").length : 0;
                el.style.setProperty(
                  "--aw-fly-x",
                  `${Math.round(
                    paneRect.right - 31 - existing * 22 - (slotRect.left + slotRect.width / 2)
                  )}px`
                );
                el.style.setProperty(
                  "--aw-fly-y",
                  `${Math.round(paneRect.bottom - 165 - (slotRect.top + slotRect.height / 2))}px`
                );
              }}
            >
              {/* The new indicator owns the slot through wave and
                  arrival, resolving into the (first) agent's own face;
                  at the fly frame it unmounts and the flying faces take
                  over in place. */}
              {phase !== "fly" && phase !== "collapse" ? (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <Stage
                    frame={frame}
                    size={32 * pxPerUnit}
                    crop
                    avatarSrc={agents[0].photo}
                  />
                </span>
              ) : null}
              {/* Faces render through the flight, then unmount at the
                  swap frame — the silent chip takes over in place. */}
              {phase === "fly"
                ? agents.map((agent, index) => (
                    <span
                      key={agent.id}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span
                        className="flex aw-typing-fly-x"
                        style={
                          {
                            animationDelay: `${index * 140}ms`,
                            "--aw-fly-shift": `${index * -22}px`,
                          } as React.CSSProperties
                        }
                      >
                        <span
                          className="flex aw-typing-fly-inner"
                          style={{ animationDelay: `${index * 140}ms` }}
                        >
                          <RingedFace
                            agent={agent}
                            status="working"
                            size={20}
                            strokeWidth={1.5}
                            inset={4}
                            disc
                          />
                        </span>
                      </span>
                    </span>
                  ))
                : null}
            </span>
            <span
              className={`text-[14px] leading-5 ${phase != null ? "aw-typing-text-out" : ""}`}
            >
              {agents.map((agent, index) => (
                <span key={agent.id}>
                  {index > 0 ? (
                    <span style={{ color: FG_PRIMARY }}>
                      {index === agents.length - 1
                        ? agents.length === 2
                          ? " and "
                          : ", and "
                        : ", "}
                    </span>
                  ) : null}
                  <span className="text-[#7C3AED]">{agent.name}</span>
                </span>
              ))}
              <span style={{ color: FG_PRIMARY }}>
                {" "}
                {agents.length === 1 ? "is" : "are"} typing…
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Thread panel header (Figma 117-10559): thread glyph, truncated root
// text as the title, close × back to the plain channel view.
function ThreadHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      className="flex h-12 shrink-0 items-center gap-2 border-b-[0.5px] bg-white px-4"
      style={{ borderColor: STROKE_WEAK }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="shrink-0">
        <path
          d="M3 3h10M3 6.5h10M3 10h5"
          stroke={FG_SECONDARY}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path d="M10.5 9.5v4l2-1.5 2 1.5v-4" fill="none" stroke={FG_SECONDARY} strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      <span
        className="min-w-0 flex-1 truncate text-[14px] font-medium leading-5"
        style={{ color: FG_PRIMARY }}
      >
        {title}
      </span>
      <button
        type="button"
        aria-label="Close thread"
        onClick={onClose}
        className="flex size-6 items-center justify-center rounded-[5px] text-[#a8a29e] transition-colors hover:bg-[#f5f5f4] hover:text-[#58524e]"
      >
        ×
      </button>
    </div>
  );
}

// "1 REPLY ————" rule between the thread root and its replies.
function RepliesDivider({ count }: { count: number }) {
  return (
    <div className="flex shrink-0 items-center gap-3 px-4 py-1.5">
      <span
        className="text-[11px] font-medium uppercase leading-4 tracking-[1.1px]"
        style={{ color: FG_TERTIARY }}
      >
        {count} {count === 1 ? "reply" : "replies"}
      </span>
      <span className="h-px flex-1" style={{ background: STROKE_WEAK }} />
    </div>
  );
}

// Reply footer under a message that grew a thread: replier faces,
// "1 reply", "Last reply at {time}" — clicking opens the thread panel.
function ReplyFooter({ replies, onOpen }: { replies: AwMessage[]; onOpen: () => void }) {
  const faceAgents: AgentDef[] = [];
  replies.forEach((reply) => {
    const avatar = reply.avatar;
    if (typeof avatar === "string") return;
    if (!faceAgents.some((agent) => agent.id === avatar.agent.id)) {
      faceAgents.push(avatar.agent);
    }
  });
  const last = replies[replies.length - 1];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-2 py-1 pl-[56px] pr-4 text-left"
    >
      <span className="flex items-center">
        {faceAgents.map((agent, index) => (
          <span
            key={agent.id}
            className="flex rounded-full"
            style={{
              marginLeft: index > 0 ? -4 : 0,
              boxShadow: "0 0 0 1.5px white",
            }}
          >
            <AgentFace agent={agent} size={16} />
          </span>
        ))}
      </span>
      <span
        className="whitespace-nowrap text-[12px] font-medium leading-4"
        style={{ color: FG_PRIMARY }}
      >
        {replies.length} {replies.length === 1 ? "reply" : "replies"}
      </span>
      <span
        className="min-w-0 truncate whitespace-nowrap text-[12px] leading-4"
        style={{ color: FG_TERTIARY }}
      >
        Last reply at {last.time}
      </span>
    </button>
  );
}

// Pinned strip under the header (August shell): pin glyph, author, the
// pinned link, count + chevron at the right edge.
function PinnedBar() {
  return (
    <div
      className="flex h-10 shrink-0 items-center gap-[10px] border-b-[0.5px] px-4"
      style={{ borderColor: STROKE_WEAK }}
    >
      <img src={`${AA}/pin-glyph.svg`} alt="" className="size-[11px]" />
      <Face name={SHELL_PIN.author} size={20} />
      <span className="text-[13px] font-medium leading-[18px]" style={{ color: FG_SECONDARY }}>
        {SHELL_PIN.author}
      </span>
      <span
        className="min-w-0 flex-1 truncate text-[13px] leading-[18px]"
        style={{ color: FG_TERTIARY }}
      >
        {SHELL_PIN.url}
      </span>
      <span
        className="rounded-full bg-[#fafaf9] px-1.5 py-[2px] text-[11px] leading-[14px]"
        style={{ color: FG_TERTIARY }}
      >
        {SHELL_PIN.count}
      </span>
      <img src={`${AA}/pin-chevron.svg`} alt="" className="h-[9px] w-[4.5px]" />
    </div>
  );
}

/* -------------------------------- transcript ------------------------------- */

function MessageAvatar({
  avatar,
  authorName,
}: {
  avatar: AwMessage["avatar"];
  authorName: string;
}) {
  if (avatar === "disc") return <Face name={authorName} size={32} />;
  return <AgentFace agent={avatar.agent} size={32} />;
}

// Demo pace presets: multipliers over each agent's scripted duration,
// labeled by the ballpark they produce (scripts run ~9-14s at 1x).
const PACE_OPTIONS = [
  { label: "~3s", value: 0.3 },
  { label: "~10s", value: 1 },
  { label: "~30s", value: 3 },
  { label: "~2m", value: 12 },
] as const;

// Bordered level control for settings rows — same four levels as the
// notice CTA, chrome register instead of brand blue.
function LevelPicker({
  level,
  onPick,
}: {
  level: ProactivityLevel;
  onPick: (level: ProactivityLevel) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-[6px] border-[0.5px] border-[#e7e5e4] px-2 py-1 text-[12px] leading-4 transition-colors hover:bg-[#f5f5f4]"
        style={{ color: FG_SECONDARY }}
      >
        {level}
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path
            d="M2.5 4L5 6.5L7.5 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <>
          <span className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <span
            className="aw-pop-enter absolute right-0 top-[calc(100%+4px)] z-50 flex w-[124px] flex-col rounded-[8px] border-[0.5px] bg-white py-1 shadow-[0px_8px_24px_-6px_rgba(16,16,16,0.18),0px_0px_0.5px_0.75px_rgba(16,16,16,0.08)]"
            style={{ borderColor: STROKE_WEAK }}
          >
            {PROACTIVITY_LEVELS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (option !== level) onPick(option);
                }}
                className="flex items-center justify-between px-2.5 py-1 text-left text-[12px] leading-4 transition-colors hover:bg-[#f5f5f4]"
                style={{ color: option === level ? FG_PRIMARY : FG_SECONDARY }}
              >
                {option}
                {option === level ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                    <path
                      d="M2 5.2L4.2 7.4L8 3"
                      fill="none"
                      stroke={BRAND}
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </button>
            ))}
          </span>
        </>
      ) : null}
    </span>
  );
}

// The level CTA inside a proactivity notice: brand blue, opens a small
// picker; choosing a level posts a fresh notice.
function ProactivityCta({
  level,
  onPick,
}: {
  level: ProactivityLevel;
  onPick: (level: ProactivityLevel) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[12px] leading-4 transition-colors hover:underline"
        style={{ color: BRAND }}
      >
        {level}
      </button>
      {open ? (
        <>
          {/* click-away scrim */}
          <span className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <span
            className="aw-pop-enter absolute bottom-[calc(100%+4px)] left-0 z-50 flex w-[124px] flex-col rounded-[8px] border-[0.5px] bg-white py-1 shadow-[0px_8px_24px_-6px_rgba(16,16,16,0.18),0px_0px_0.5px_0.75px_rgba(16,16,16,0.08)]"
            style={{ borderColor: STROKE_WEAK }}
          >
            {PROACTIVITY_LEVELS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (option !== level) onPick(option);
                }}
                className="flex items-center justify-between px-2.5 py-1 text-left text-[12px] leading-4 transition-colors hover:bg-[#f5f5f4]"
                style={{ color: option === level ? FG_PRIMARY : FG_SECONDARY }}
              >
                {option}
                {option === level ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                    <path
                      d="M2 5.2L4.2 7.4L8 3"
                      fill="none"
                      stroke={BRAND}
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </button>
            ))}
          </span>
        </>
      ) : null}
    </span>
  );
}

// Tool approvals are their own card — in-stream because they BLOCK: a
// dismissible corner surface can't carry a gate. Allow resumes the frozen
// timer; Deny stops the run (the note below explains it).
function ApprovalCard({
  run,
  onApprove,
  onDeny,
}: {
  run: AgentRun;
  onApprove: (runId: string) => void;
  onDeny: (runId: string) => void;
}) {
  return (
    <div className="aw-attr-in flex w-fit flex-col gap-2.5 rounded-[10px] border-[0.5px] border-[#F3E1B0] bg-[#FFFBEB] p-3">
      <span className="flex items-center gap-1.5 text-[13px] leading-4" style={{ color: FG_PRIMARY }}>
        <AgentFace agent={run.agent} size={16} />
        <span className="font-medium">{run.agent.name}</span>
        <span style={{ color: FG_SECONDARY }}>wants to run</span>
        <span className="rounded-[4px] bg-[#F6EED7] px-1 py-px font-mono text-[12px] text-[#92400E]">
          {run.approval?.toolLabel}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onApprove(run.id)}
          className="flex h-6 items-center rounded-[6px] bg-[#1a1817] px-2.5 text-[12px] font-medium leading-4 text-white transition-opacity hover:opacity-85"
        >
          Allow
        </button>
        <button
          type="button"
          onClick={() => onDeny(run.id)}
          className="flex h-6 items-center rounded-[6px] border-[0.5px] border-[#e7e5e4] bg-white px-2.5 text-[12px] leading-4 transition-colors hover:bg-[#f5f5f4]"
          style={{ color: FG_SECONDARY }}
        >
          Deny
        </button>
      </span>
    </div>
  );
}

// Rolling thought line: when the agent's beat changes, the old line
// rolls up and out while the new one rises from below (ticker grammar);
// the live line carries the shimmer. tone picks the surface: "dark" for
// the hover popover's pill, "light" for white rows.
function RollingThought({
  text,
  tone = "dark",
}: {
  text: string;
  tone?: "dark" | "light";
}) {
  const [prev, setPrev] = useState(text);
  const [leaving, setLeaving] = useState<string | null>(null);

  // Derived-state-during-render (the documented adjust pattern): when a
  // new beat arrives, the old one becomes the leaving line.
  if (prev !== text) {
    setPrev(text);
    setLeaving(prev);
  }

  useEffect(() => {
    if (leaving == null) return;
    const timer = window.setTimeout(() => setLeaving(null), 260);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  const shimmer = tone === "dark" ? "aw-thought-shimmer" : "aw-thought-shimmer-light";
  const size = tone === "dark" ? "text-[11px]" : "text-[12px]";

  return (
    <span className="relative block h-4 max-w-[240px] overflow-hidden">
      <span
        key={text}
        className={`aw-thought-in ${shimmer} block truncate ${size} leading-4`}
      >
        {text}
      </span>
      {leaving != null ? (
        <span
          aria-hidden
          className={`aw-thought-out absolute inset-x-0 top-0 block truncate ${size} leading-4 ${
            tone === "dark" ? "text-white/50" : "text-[#a8a29e]"
          }`}
        >
          {leaving}
        </span>
      ) : null}
    </span>
  );
}

// Pending-reply presence: a run that will ANSWER IN THIS MESSAGE'S
// THREAD works in the reply slot itself — same grammar as ReplyFooter
// (16px face at the reply indent), with the live thought stream and a
// Stop CTA. Failed and stopped runs keep the slot with their own
// controls until resolved or cleared; done runs hand over to the real
// reply footer.
function ReplyPresence({
  runs,
  replies,
  sealPhases,
  onStop,
  onRerun,
  onRemove,
  onOpenTrace,
}: {
  runs: AgentRun[];
  replies: AwMessage[];
  // Handoff choreography for just-completed runs: "seal" holds the row
  // while the ring closes green and the footer line rolls in; "fade"
  // releases the ring so the swap to the real footer is invisible.
  sealPhases: Record<string, "seal" | "fade">;
  onStop: (runId: string) => void;
  onRerun: (runId: string) => void;
  onRemove: (runId: string) => void;
  onOpenTrace: (runId: string) => void;
}) {
  return (
    <>
      {runs.map((run) => (
        <div
          key={run.id}
          className="flex w-full items-center gap-2 py-1 pl-[56px] pr-4"
        >
          {/* The portrait sits in a 16px box (the footer's face size) so
              the handoff never moves it; the ring orbits OUTSIDE the box
              and fades away before the swap. quiet: a 16px completion
              seals without the celebration pop. */}
          <span className="relative flex size-4 shrink-0 items-center justify-center">
            <span
              className={`flex ${sealPhases[run.id] === "fade" ? "aw-reply-ring-off" : ""}`}
            >
              <RingedFace
                agent={run.agent}
                status={run.status}
                size={22}
                strokeWidth={1.25}
                inset={3}
                quiet
              />
            </span>
          </span>
          {run.status === "done" ? (
            // The footer line rolls into the same slot the thought
            // stream occupied — the reply "arrives" in place.
            <span className="relative block h-4 overflow-hidden">
              <span className="aw-thought-in flex items-center gap-2 whitespace-nowrap">
                <span
                  className="text-[12px] font-medium leading-4"
                  style={{ color: FG_PRIMARY }}
                >
                  {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </span>
                <span className="text-[12px] leading-4" style={{ color: FG_TERTIARY }}>
                  Last reply at {replies[replies.length - 1]?.time ?? ""}
                </span>
              </span>
            </span>
          ) : run.status === "working" ? (
            <>
              <RollingThought text={statusLine(run)} tone="light" />
              <button
                type="button"
                aria-label={`Stop ${run.agent.name}`}
                onClick={() => onStop(run.id)}
                className="flex items-center gap-1 text-[12px] leading-4 text-[#a8a29e] transition-colors hover:text-[#1a1817]"
              >
                <StopGlyph />
                Stop
              </button>
            </>
          ) : run.status === "failed" ? (
            <>
              <button
                type="button"
                onClick={() => onOpenTrace(run.id)}
                className="text-[12px] leading-4 text-[#dc2626]"
              >
                {`Failed after ${formatDuration(
                  (run.endedAt ?? run.startedAt) - run.startedAt
                )}`}
              </button>
              <button
                type="button"
                onClick={() => onRerun(run.id)}
                className="text-[12px] font-medium leading-4 text-[#dc2626] underline underline-offset-2"
              >
                Rerun
              </button>
            </>
          ) : (
            <>
              <span className="text-[12px] leading-4" style={{ color: FG_TERTIARY }}>
                Stopped
              </span>
              <button
                type="button"
                onClick={() => onRerun(run.id)}
                className="flex items-center gap-1 text-[12px] leading-4 text-[#a8a29e] transition-colors hover:text-[#1a1817]"
              >
                <RerunGlyph />
                Restart
              </button>
              <button
                type="button"
                onClick={() => onRemove(run.id)}
                className="flex items-center gap-1 text-[12px] leading-4 text-[#a8a29e] transition-colors hover:text-[#1a1817]"
              >
                <CloseGlyph />
                Clear
              </button>
            </>
          )}
        </div>
      ))}
    </>
  );
}

function MessageRow({
  message,
  runs,
  clusterSide,
  flashing,
  onOpenAgentPanel,
  onStopRun,
  onRemove,
  onOpenTrace,
  onOpenRunTrace,
  onRerun,
  onApprove,
  onDeny,
  onSetProactivity,
}: {
  message: AwMessage;
  runs: AgentRun[];
  clusterSide: ClusterSide;
  flashing: boolean;
  onOpenAgentPanel: (runId: string) => void;
  onStopRun: (runId: string) => void;
  onRemove: (runId: string) => void;
  onOpenTrace: (message: AwMessage) => void;
  onOpenRunTrace: (runId: string) => void;
  onRerun: (runId: string) => void;
  onApprove: (runId: string) => void;
  onDeny: (runId: string) => void;
  onSetProactivity: (agentName: string, level: ProactivityLevel) => void;
}) {
  // Live in-stream signal is presence, not console (Figma 19-5559): the
  // working agent sits on the row's RIGHT edge — stop chip revealed on
  // row hover, face always on. The thought line lives in the corner
  // surfaces only. (Hooks live above the system-notice early return.)
  const workingRuns = runs.filter((run) => run.status === "working" && !run.removed);
  const workingRun = workingRuns[0] ?? null;
  const workingRunId = workingRun?.id ?? null;
  // The face enters and exits in the corner bubbles' own grammar —
  // condense in, mist out on natural resolution, the quick dismiss fade
  // when the stop was your own act — so row and rail read as one
  // object. A just-resolved run lingers in state only long enough to
  // play its exit. "Adjust state during render" (RingedFace's pattern)
  // — no effect, no cascading render.
  const [lastWorkingId, setLastWorkingId] = useState<string | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);
  if (workingRunId !== lastWorkingId) {
    setLastWorkingId(workingRunId);
    setExitingId(workingRunId == null ? lastWorkingId : null);
  }
  // System notices: one quiet line aligned with the text column —
  // functions like chrome, not conversation. Proactivity notices carry
  // a brand-blue level CTA that opens the picker.
  if (message.system) {
    return (
      <div data-aw-msg-id={message.id} className="flex w-full px-4 py-1 pl-[56px]">
        {message.proactivity ? (
          <span className="text-[12px] leading-4" style={{ color: "#a8a29e" }}>
            {`${message.proactivity.actor} updated ${message.proactivity.agentName}'s proactivity to `}
            <ProactivityCta
              level={message.proactivity.level}
              onPick={(level) => onSetProactivity(message.proactivity!.agentName, level)}
            />
          </span>
        ) : (
          <span className="text-[12px] leading-4" style={{ color: "#a8a29e" }}>
            {message.paragraphs[0]?.map((segment) => segment.text).join("")}
          </span>
        )}
      </div>
    );
  }
  const exitingRun =
    exitingId != null ? (runs.find((run) => run.id === exitingId) ?? null) : null;
  // Failed AND stopped runs stay on the line (requires-action outranks
  // the done-mist): failed with its sentence + Rerun, stopped as a bare
  // parked ring — sealed red, dimmed at rest, no caption. Your own stop
  // needs no explanation, but the parked face keeps the record that
  // this ask was worked and halted.
  // Dismissing from the Active agents panel clears the line too: a
  // removed parked run stays renderable just long enough to play the
  // dismiss fade, and drops at conceal (the heartbeat backstop).
  const requiresActionRun =
    [...runs].reverse().find(
      (run) => (run.status === "failed" || run.status === "stopped") && !run.concealed
    ) ?? null;
  const clusterRun = workingRun ?? requiresActionRun ?? exitingRun;
  const pendingApprovals = workingRuns.filter((run) => run.approval?.state === "pending");
  const hasNested = pendingApprovals.length > 0;

  // One cluster, two placements (header toggle): the face + its tail
  // (hover stop while working; failed sentence + Rerun after a failure).
  // Both placements share the 20px in-text body — it grows to 30 only
  // when it docks into the rail — moving in the corner grammar:
  // condense in, seal on stop (parked), mist out on completion.
  // The face's hover popover, centered over it — one grammar for every
  // live state: Stop while working; Restart or Clear once stopped.
  // Labeled controls, not bare icons.
  const stoppedParked =
    workingRun == null &&
    requiresActionRun != null &&
    requiresActionRun.status === "stopped" &&
    !requiresActionRun.removed
      ? requiresActionRun
      : null;
  const popoverControls =
    workingRun != null
      ? [{ label: "Stop", glyph: <StopGlyph />, onPress: () => onStopRun(workingRun.id) }]
      : stoppedParked != null
        ? [
            {
              label: "Restart",
              glyph: <RerunGlyph />,
              onPress: () => onRerun(stoppedParked.id),
            },
            { label: "Clear", glyph: <CloseGlyph />, onPress: () => onRemove(stoppedParked.id) },
          ]
        : null;
  const renderFace = () =>
    clusterRun == null ? null : (
      <span className="group/agent relative inline-flex">
      {popoverControls != null ? (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-30 origin-bottom -translate-x-1/2 scale-95 pb-1.5 opacity-0 transition-all duration-150 group-hover/agent:pointer-events-auto group-hover/agent:scale-100 group-hover/agent:opacity-100">
          <span className="flex items-center gap-0.5 whitespace-nowrap rounded-[8px] bg-[#1b1b1b] p-1 shadow-[0px_8px_24px_-6px_rgba(16,16,16,0.3),0px_0px_0.5px_0.75px_rgba(16,16,16,0.2)]">
            {/* Simulated stream of thought while working — the same
                scripted beats the corner roster reads (statusLine),
                advancing live on the engine tick. Shimmer while
                thinking; new beats roll in ticker-style. */}
            {workingRun != null ? (
              <>
                <span className="pl-1.5 pr-1">
                  <RollingThought text={statusLine(workingRun)} />
                </span>
                <span className="h-3.5 w-px shrink-0 bg-white/15" />
              </>
            ) : null}
            {popoverControls.map((control) => (
              <button
                key={control.label}
                type="button"
                aria-label={`${control.label} agent`}
                onClick={(event) => {
                  event.stopPropagation();
                  control.onPress();
                }}
                className="flex h-6 items-center gap-1 rounded-[5px] px-1.5 text-[11px] leading-4 text-[#8a8a8a] transition-colors hover:bg-white/10 hover:text-white"
              >
                {control.glyph}
                {control.label}
              </button>
            ))}
          </span>
        </span>
      ) : null}
      <button
        type="button"
        aria-label={`Show ${clusterRun.agent.name} in Active agents`}
        title={`Show ${clusterRun.agent.name} in Active agents`}
        onClick={() => onOpenAgentPanel(clusterRun.id)}
        className={`relative flex rounded-full ${
          workingRun != null
            ? "aw-chip-in-sm"
            : requiresActionRun != null
              ? requiresActionRun.removed
                ? "aw-chip-dismiss-sm"
                : ""
              : clusterRun.dismissed
                ? "aw-chip-dismiss-sm"
                : "aw-chip-out-sm"
        }`}
        style={{ boxShadow: "0 0 0 0.5px white" }}
        onAnimationEnd={(event) => {
          if (
            event.animationName.startsWith("aw-chip-out") ||
            event.animationName.startsWith("aw-chip-dismiss")
          )
            setExitingId(null);
        }}
      >
        {/* aw-face-pulse: hover "thinking" pulse while working —
            wrapper span so it composes with RingedFace's own breathe. */}
        <span className={`flex ${workingRun != null ? "aw-face-pulse" : ""}`}>
          <RingedFace
            agent={clusterRun.agent}
            status={clusterRun.status}
            size={20}
            strokeWidth={1.5}
            inset={4}
            disc
          />
        </span>
      </button>
      </span>
    );
  const renderTail = () =>
    requiresActionRun != null &&
    requiresActionRun.status === "failed" &&
    !requiresActionRun.removed ? (
      <>
        <button
          type="button"
          onClick={() => onOpenRunTrace(requiresActionRun.id)}
          className="text-[12px] leading-4 text-[#dc2626]"
        >
          {`Failed after ${formatDuration(
            (requiresActionRun.endedAt ?? requiresActionRun.startedAt) -
              requiresActionRun.startedAt
          )}`}
        </button>
        {requiresActionRun.status === "failed" ? (
          <button
            type="button"
            onClick={() => onRerun(requiresActionRun.id)}
            className="flex h-5 items-center rounded-[5px] border-[0.5px] border-[#e7e5e4] bg-white px-1.5 text-[11px] leading-4 text-[#58524e] transition-colors hover:bg-[#f5f5f4]"
          >
            Rerun
          </button>
        ) : null}
      </>
    ) : null;
  return (
    <div
      data-aw-msg-id={message.id}
      className="group/row relative flex w-full items-start gap-2 px-4 py-1.5"
    >
      {/* Cream wash flash when a flyout row jumps back to this message. */}
      {flashing ? (
        <span
          aria-hidden
          className="aw-flash pointer-events-none absolute inset-x-2 inset-y-0.5 z-[1] rounded-md bg-[#FBF0C9]/60"
        />
      ) : null}
      <MessageAvatar avatar={message.avatar} authorName={message.authorName} />
      <div className="relative z-[2] flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex h-[22px] items-baseline gap-1 whitespace-nowrap">
          <span className="text-[14px] font-medium leading-5" style={{ color: FG_PRIMARY }}>
            {message.authorName}
          </span>
          <span className="text-[12px] leading-4" style={{ color: FG_TERTIARY }}>
            {message.time}
          </span>
          {/* The run receipt rides the header (time-metadata register,
              like an edited mark) and only surfaces on row hover —
              still the doorway to the trace. */}
          {message.workedForMs != null ? (
            <button
              type="button"
              onClick={() => onOpenTrace(message)}
              className="flex items-baseline gap-1 text-[12px] leading-4 text-[#78716c] opacity-0 transition-opacity duration-150 hover:text-[#58524e] group-hover/row:opacity-100"
            >
              <span className="self-center text-[8px] leading-none text-[#d3d1ce]">•</span>
              {`Worked for ${formatDuration(message.workedForMs)}`}
            </button>
          ) : null}
        </div>
        {/* Seeded transcript rows carry rich blocks — lists and the
            image attachment from the August shell. Live messages (and
            everything the agent machinery hangs off) stay on the
            paragraphs path below. */}
        {message.blocks != null ? (
          <div
            className="flex flex-col gap-2 break-words text-[14px] leading-5"
            style={{ color: FG_PRIMARY }}
          >
            {message.blocks.map((block, bIndex) => {
              if (block.kind === "text")
                return (
                  <p key={bIndex}>
                    {block.segments.map((segment, sIndex) => (
                      <span key={sIndex}>{segment.text}</span>
                    ))}
                  </p>
                );
              if (block.kind === "bullets" || block.kind === "numbered") {
                const ordered = block.kind === "numbered";
                const List = ordered ? "ol" : "ul";
                return (
                  <List
                    key={bIndex}
                    className={`flex flex-col gap-1 pl-6 ${
                      ordered ? "list-decimal" : "list-disc"
                    }`}
                  >
                    {block.items.map((item, iIndex) => (
                      <li key={iIndex} className="pl-1">
                        {item}
                      </li>
                    ))}
                  </List>
                );
              }
              // image attachment placeholder (Figma 394:7795): 360x162,
              // #fafaf9, borderless.
              return (
                <span
                  key={bIndex}
                  className="mt-1.5 block h-[162px] w-[360px] rounded-[6px] bg-[#fafaf9]"
                />
              );
            })}
          </div>
        ) : null}
        <div className="break-words text-[14px] leading-5" style={{ color: FG_PRIMARY }}>
          {message.paragraphs.map((paragraph, pIndex) => {
            const segments = paragraph.map((segment, sIndex) =>
              segment.mention ? (
                <span
                  key={sIndex}
                  className="rounded-[4px] bg-[#F3E8FF] px-1 py-px text-[#7C3AED]"
                >
                  {segment.text}
                </span>
              ) : segment.link ? (
                <span key={sIndex} style={{ color: BRAND }}>
                  {segment.text}
                </span>
              ) : (
                <span key={sIndex}>{segment.text}</span>
              )
            );
            return (
              <p key={pIndex} className={pIndex > 0 ? "mt-5" : undefined}>
                {segments}
                {/* Inline placement: the agent appends itself to the
                    END of the ask. align-top keeps the 20px cluster from
                    inflating the 20px line box. */}
                {clusterSide === "inline" &&
                pIndex === message.paragraphs.length - 1 &&
                clusterRun != null ? (
                  <span className="ml-2 inline-flex items-center gap-1.5 align-top">
                    {renderFace()}
                    {renderTail()}
                  </span>
                ) : null}
              </p>
            );
          })}
        </div>
        {/* Chat-command proactivity changes attach here — the agent's
            own act, in the nested slot's spacing. */}
        {message.proactivityFooters?.map((entry) => (
          <span
            key={entry.agentName}
            className="aw-attr-in flex w-fit items-center gap-1 text-[12px] leading-4"
            style={{ color: "#a8a29e" }}
          >
            {`${entry.agentName} updated its own proactivity to `}
            <ProactivityCta
              level={entry.level}
              onPick={(level) => onSetProactivity(entry.agentName, level)}
            />
          </span>
        ))}
        {/* The inline-request slot: approval gates (benched) anchor to
            the ask. Failure/stop states live ON the line now, with the
            face; answers post as their own messages. */}
        {hasNested ? (
          <div className="mt-1 flex flex-col items-start gap-1">
            {pendingApprovals.map((run) => (
              <ApprovalCard key={run.id} run={run} onApprove={onApprove} onDeny={onDeny} />
            ))}
          </div>
        ) : null}
      </div>
      {/* Right-edge placement (header toggle): the same small face in
          the Figma 19-5559 Tool Call slot, vertically centered on the
          row, tail reading inward. */}
      {clusterSide === "right" && clusterRun != null ? (
        <span className="absolute inset-y-0 right-4 z-[2] flex items-center gap-2">
          {renderTail()}
          {renderFace()}
        </span>
      ) : null}
    </div>
  );
}

function ThreadFooter({ footer }: { footer: NonNullable<AwMessage["threadFooter"]> }) {
  return (
    <div className="relative flex w-full items-center px-4 pb-1 pl-[56px]">
      <span className="-ml-1.5 flex h-7 items-center gap-2 rounded-[6px] px-1.5">
        <span className="flex items-center">
          {THREAD_FACES.slice(0, footer.faces).map((name, index) => (
            <span
              key={name}
              className="rounded-full"
              style={{
                marginLeft: index > 0 ? -2 : 0,
                boxShadow: "0 0 0 1.5px white",
              }}
            >
              <Face name={name} size={16} />
            </span>
          ))}
        </span>
        <span className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="text-[12px] font-medium leading-4" style={{ color: FG_PRIMARY }}>
            {footer.count}
          </span>
          <span className="text-[12px] leading-4" style={{ color: FG_TERTIARY }}>
            {footer.lastReply}
          </span>
        </span>
      </span>
    </div>
  );
}

/* --------------------------------- composer -------------------------------- */

function Composer({
  onSend,
  placeholder = "Enter your message",
  alsoSendTo,
  typing,
  onTyping,
}: {
  onSend: (text: string, alsoSend?: boolean) => void;
  placeholder?: string;
  // Thread composers offer "Also send to {target}" — a copy of the
  // reply posts to the root's surface too.
  alsoSendTo?: string;
  // The "••• {agent} is typing…" line, rendered inside the composer's
  // own wrapper so it hugs the box and shares its left edge.
  typing?: React.ReactNode;
  // Fires when the user STARTS typing (empty → non-empty): someone
  // else taking the floor demotes any typing agents to the tray.
  onTyping?: () => void;
}) {
  const [value, setValue] = useState("");
  const [alsoSend, setAlsoSend] = useState(false);
  const [menuIndex, setMenuIndex] = useState(0);
  const [menuDismissed, setMenuDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mention picker: shows while the text ends in "@" + partial name.
  const mentionMatch = /@([a-zA-Z ]*)$/.exec(value);
  const query = mentionMatch?.[1].toLowerCase() ?? null;
  const candidates =
    query != null
      ? AGENTS.filter((agent) => agent.name.toLowerCase().startsWith(query))
      : [];
  const menuOpen = !menuDismissed && candidates.length > 0;
  const highlighted = Math.min(menuIndex, Math.max(0, candidates.length - 1));

  const pick = (agent: AgentDef) => {
    setValue(value.replace(/@[a-zA-Z ]*$/, `@${agent.name} `));
    setMenuIndex(0);
    inputRef.current?.focus();
  };

  const send = () => {
    const text = value.trim();
    if (text.length === 0) return;
    onSend(text, alsoSend);
    setValue("");
    setAlsoSend(false);
    setMenuIndex(0);
  };

  return (
    // pt-3: constant clearance between the last row (and its thread
    // footer) and the composer — the transcript used to run flush into
    // the box. Bottom-anchored overlays are unaffected: the composer's
    // distance from the container bottom doesn't change.
    <div className="relative flex w-full shrink-0 flex-col px-4 pb-4 pt-3">
      {typing}
      {menuOpen ? (
        <div className="aw-pop-enter absolute bottom-[calc(100%-8px)] left-4 z-30 w-56 overflow-hidden rounded-[10px] bg-white p-1 shadow-[0px_2px_12px_0px_rgba(16,16,16,0.06),0px_16px_24px_-12px_rgba(16,16,16,0.08),0px_0px_0.5px_0.75px_rgba(16,16,16,0.06)]">
          {candidates.map((agent, index) => (
            <button
              key={agent.id}
              type="button"
              onMouseEnter={() => setMenuIndex(index)}
              onClick={() => pick(agent)}
              className={`flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left ${
                index === highlighted ? "bg-[#f5f5f4]" : ""
              }`}
            >
              <AgentFace agent={agent} size={20} />
              <span className="text-[14px] leading-5" style={{ color: FG_PRIMARY }}>
                {agent.name}
              </span>
              <span className="ml-auto text-[11px] leading-4" style={{ color: FG_TERTIARY }}>
                Agent
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <div
        className="flex w-full flex-col overflow-clip rounded-[10px] border-[0.5px] bg-white"
        style={{ borderColor: STROKE_WEAK }}
      >
        <div className="relative flex h-[70px] w-full items-start px-5 py-4">
          <input
            ref={inputRef}
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(event) => {
              if (value.length === 0 && event.target.value.length > 0) onTyping?.();
              setValue(event.target.value);
              setMenuDismissed(false);
              setMenuIndex(0);
            }}
            onKeyDown={(event) => {
              if (menuOpen) {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setMenuIndex((highlighted + 1) % candidates.length);
                  return;
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setMenuIndex((highlighted - 1 + candidates.length) % candidates.length);
                  return;
                }
                if (event.key === "Enter" || event.key === "Tab") {
                  event.preventDefault();
                  pick(candidates[highlighted]);
                  return;
                }
                if (event.key === "Escape") {
                  setMenuDismissed(true);
                  return;
                }
              }
              if (event.key === "Enter") send();
            }}
            className="w-full bg-transparent text-[14px] leading-5 outline-none placeholder:text-[#a8a29e]"
            style={{ color: FG_PRIMARY }}
          />
        </div>
        {alsoSendTo != null ? (
          <label className="flex w-full cursor-pointer items-center gap-2 px-5 pb-1">
            <input
              type="checkbox"
              checked={alsoSend}
              onChange={(event) => setAlsoSend(event.target.checked)}
              className="size-4 cursor-pointer rounded-[4px] border-[1.5px] border-[#d6d3d1] accent-[#1a1817]"
            />
            <span className="text-[13px] leading-4" style={{ color: FG_SECONDARY }}>
              Also send to{" "}
              <span className="font-medium" style={{ color: FG_PRIMARY }}>
                {alsoSendTo}
              </span>
            </span>
          </label>
        ) : null}
        <div className="flex w-full items-center justify-between p-3">
          <div className="flex items-center">
            <span className="flex size-7 items-center justify-center rounded-[6px]">
              <img src={`${AA}/comp-paperclip.svg`} alt="" className="h-[13px] w-[9px]" />
            </span>
            <span className="flex size-7 items-center justify-center rounded-[6px]">
              <span
                className="text-[14px] font-medium leading-5"
                style={{ color: FG_SECONDARY }}
              >
                Aa
              </span>
            </span>
            <span className="flex size-7 items-center justify-center rounded-[6px]">
              <img src={`${AA}/comp-emoji.svg`} alt="" className="size-[13px]" />
            </span>
            <span className="flex size-7 items-center justify-center rounded-[6px]">
              <img src={`${AA}/comp-gif.svg`} alt="" className="h-[9px] w-[12px]" />
            </span>
          </div>
          {/* Send split (Figma 394:8735): 28+16 halves, radii 6/1, 1px
              seam — 45% ink until there's a draft. */}
          <div
            className={`flex items-start transition-opacity ${
              value.trim().length > 0 ? "opacity-100" : "opacity-45"
            }`}
          >
            <button
              type="button"
              onClick={send}
              aria-label="Send"
              className="flex size-7 items-center justify-center rounded-l-[6px] rounded-r-[1px] bg-[#f5f5f4] px-2"
            >
              <img src={`${AA}/comp-send.svg`} alt="" className="size-[12px]" />
            </button>
            <span className="h-7 w-px" style={{ background: STROKE_WEAK }} />
            <span className="flex h-7 w-4 items-center justify-center rounded-l-[1px] rounded-r-[6px] bg-[#f5f5f4]">
              <img src={`${AA}/comp-chevron.svg`} alt="" className="h-[3px] w-[5px]" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------- page ---------------------------------- */

// Counter is scoped by a per-module-eval token: fast refresh re-evaluates
// the module (resetting the counter) while React state survives, so bare
// sequential ids would collide with messages already in state.
const MESSAGE_ID_TOKEN = Math.random().toString(36).slice(2, 7);
let messageCounter = 0;
function nextMessageId(): string {
  return `aw-m-${MESSAGE_ID_TOKEN}-${++messageCounter}`;
}

export default function TraceCanvasPage({
  typingVariant = DEFAULT_TYPING_VARIANT,
}: {
  /** which /agent-typing-experience morph plays the typing presence */
  typingVariant?: TypingVariant;
} = {}) {
  const [messages, setMessages] = useState<AwMessage[]>(SEED_MESSAGES);
  // Which interface is on screen: plain channel, DM, or channel+thread.
  const [view, setView] = useState<ViewMode>("channel");
  // The surface the primary transcript (the one the overlays track and
  // sends default into) belongs to. In Thread view that's the thread
  // panel — the channel pane rides along read-alongside.
  const primarySurface: Surface = view === "thread" ? "thread" : view;
  const primarySurfaceRef = useRef(primarySurface);
  useEffect(() => {
    primarySurfaceRef.current = primarySurface;
  }, [primarySurface]);
  // Message id → surface, so an agent's answer lands in the surface its
  // invocation came from even if the view changed mid-run.
  const surfaceByMsgRef = useRef<Record<string, Surface>>({});
  // Message id → thread root, for messages living inside a thread —
  // an agent pinged from a reply answers into the same thread.
  const parentByMsgRef = useRef<Record<string, string>>({});
  // The per-message thread panel: id of the root whose thread is open.
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const threadListRef = useRef<HTMLDivElement>(null);
  // Flyout opens on hover (spec annotation) — a short grace timer keeps it
  // open while the pointer travels the 16px gap between stack and panel.
  // Closing is a phase, not an unmount: the pop-out plays first, and
  // animationend flips the state to closed.
  const [flyoutState, setFlyoutState] = useState<"closed" | "open" | "closing">(
    "closed"
  );
  const closeTimerRef = useRef<number | null>(null);
  const handleHoverChange = (hovering: boolean) => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (hovering) {
      setFlyoutState("open");
    } else {
      closeTimerRef.current = window.setTimeout(() => setFlyoutState("closing"), 200);
    }
  };
  const [flashId, setFlashId] = useState<string | null>(null);
  // Trace modal target: a live run id.
  const [traceRunId, setTraceRunId] = useState<string | null>(null);
  // Placement audition (header toggle): agent at the end of the text
  // vs the row's right edge.
  const [clusterSide, setClusterSide] = useState<ClusterSide>("inline");
  // Working-indicator audition for channel pings. "typing" (default):
  // a general turn from the chat's collective context — the agent
  // replies IN CHANNEL, announced by the typing indicator. "inline" /
  // "reply": the earlier threaded explorations — the answer forks a
  // thread, presence rides the text or the reply slot.
  const [presenceStyle, setPresenceStyle] = useState<"typing" | "inline" | "reply">(
    "typing"
  );
  const presenceStyleRef = useRef(presenceStyle);
  useEffect(() => {
    presenceStyleRef.current = presenceStyle;
  }, [presenceStyle]);
  // Suggested-actions audition: chips / numbered list / links strip.
  // Off by default — parked exploration, revivable from the demo menu.
  const [suggestionStyle, setSuggestionStyle] = useState<SuggestionStyle>("off");
  // Typing demotion: an agent typing past TYPING_DEMOTE_MS, or talked
  // over by the user,
  // hands the floor to the trace tray. messageId → animation phase;
  // trayed ids force their working runs onto the corner stack.
  const [demotePhases, setDemotePhases] = useState<
    Record<string, "morph" | "fly" | "collapse">
  >({});
  const [trayedMsgIds, setTrayedMsgIds] = useState<ReadonlySet<string>>(() => new Set());
  // Dynamic-Island reception: true while a landing is imminent/underway
  // — the tray anticipates, swallows, and settles.
  const [trayReceiving, setTrayReceiving] = useState(false);
  const demoteStartedRef = useRef<Set<string>>(new Set());
  // Choreography (fixed schedule — rendering throttles must never
  // strand a row mid-flight), Apple pacing: consolidate (the selected
  // typing variant's arrival plays in the slot — dots become the agent's
  // face — while the slot drifts right, gaining momentum, plus a 150ms
  // beat), flight on the sheet-glide curve (600ms), tray surfaces in the
  // settle while the emptied row squeezes closed, then the row unmounts
  // at zero height — no layout snap, no double-entrance. `count` =
  // agents in the invocation (up to 3): group departures fly staggered
  // 140ms apart, so the schedule stretches by the stagger.
  const beginDemote = (msgId: string, count = 1) => {
    if (demoteStartedRef.current.has(msgId)) return;
    demoteStartedRef.current.add(msgId);
    const lag = (Math.min(count, 3) - 1) * 140;
    const morphHold = typingVariant.morphMs + 150;
    setDemotePhases((prev) => ({ ...prev, [msgId]: "morph" }));
    window.setTimeout(() => {
      setDemotePhases((prev) =>
        prev[msgId] === "morph" ? { ...prev, [msgId]: "fly" } : prev
      );
    }, morphHold);
    // The swap lands EXACTLY at flight end (morphHold + 600, plus the
    // group stagger): the faces unmount, the chips mount silently in
    // their place, and the stack plays one subtle absorb.
    window.setTimeout(() => {
      setDemotePhases((prev) =>
        prev[msgId] === "fly" ? { ...prev, [msgId]: "collapse" } : prev
      );
      setTrayedMsgIds((prev) => new Set(prev).add(msgId));
      setTrayReceiving(true);
    }, morphHold + 600 + lag);
    window.setTimeout(() => {
      setDemotePhases((prev) => {
        if (!(msgId in prev)) return prev;
        const next = { ...prev };
        delete next[msgId];
        return next;
      });
      setTrayReceiving(false);
    }, morphHold + 1050 + lag);
  };
  // Reply handoff: run id → phase. "seal" keeps the pending row through
  // the green seal; "fade" releases the ring; absent = handed off.
  const [sealPhases, setSealPhases] = useState<Record<string, "seal" | "fade">>({});
  // Demo pace from the Agents panel — scales the next invocation's
  // scripted duration.
  const [pace, setPace] = useState(1);
  // The message id of YOUR latest agent-spawning send — the only runs
  // the composer's Esc can reach.
  // One source of truth for proactivity — chat commands, notice CTAs,
  // and the settings panel all read and write this map.
  const [proactivityLevels, setProactivityLevels] = useState<Record<string, ProactivityLevel>>(
    () => Object.fromEntries(AGENTS.map((agent) => [agent.id, "medium" as ProactivityLevel])),
  );
  const messagesRef = useRef<HTMLDivElement>(null);

  // Jump-to-latest pill (dynamic island): agent answers landing while the
  // user is scrolled away surface as a pill instead of yanking the scroll.
  const [pillState, setPillState] = useState<"hidden" | "shown" | "leaving">(
    "hidden"
  );
  const [pillFaces, setPillFaces] = useState<AgentDef[]>([]);
  const [pillBump, setPillBump] = useState(0);
  const scrolledAwayRef = useRef(false);
  const pinNextRef = useRef(true);

  const handleTranscriptScroll = () => {
    const list = messagesRef.current;
    if (list == null) return;
    const dist = list.scrollHeight - list.scrollTop - list.clientHeight;
    scrolledAwayRef.current = dist > 160;
    // Reaching the bottom on your own retracts the pill.
    if (dist < 24) {
      setPillState((state) => (state === "shown" ? "leaving" : state));
    }
    // Sticky presence follows the scroll: rows leaving the viewport
    // dock their agents into the corner; rows returning reclaim them.
    measureOffscreen();
  };

  const engine = useAgentEngine((run) => {
    const id = nextMessageId();
    // Answers land in the surface their invocation came from.
    const surface = surfaceByMsgRef.current[run.messageId] ?? "channel";
    surfaceByMsgRef.current[id] = surface;
    // Routing is deterministic by turn shape: a turn appended to a
    // specific message (a thread reply) answers in that thread; a
    // GENERAL turn from the chat's collective context answers in the
    // channel, linearly. The inline/reply auditions keep the earlier
    // fork-a-thread behavior for channel pings.
    const parentId =
      parentByMsgRef.current[run.messageId] ??
      (surface === "channel" && presenceStyleRef.current !== "typing"
        ? run.messageId
        : undefined);
    if (parentId != null) parentByMsgRef.current[id] = parentId;
    setMessages((prev) => [
      ...prev,
      {
        id,
        surface,
        parentId,
        authorName: run.agent.name,
        avatar: { agent: run.agent },
        time: stampFor(surface),
        paragraphs: run.agent.answer.map((paragraph) => [{ text: paragraph }]),
        workedForMs: (run.endedAt ?? Date.now()) - run.startedAt,
        runId: run.id,
      },
    ]);
    // The reply opens its thread, and the pending-reply row plays its
    // handoff: hold through the seal, fade the ring, release the slot
    // to the real footer.
    if (parentId != null) {
      setSealPhases((prev) => ({ ...prev, [run.id]: "seal" }));
      window.setTimeout(() => {
        setSealPhases((prev) =>
          prev[run.id] === "seal" ? { ...prev, [run.id]: "fade" } : prev
        );
      }, 1000);
      window.setTimeout(() => {
        setSealPhases((prev) => {
          if (!(run.id in prev)) return prev;
          const next = { ...prev };
          delete next[run.id];
          return next;
        });
      }, 1400);
      setOpenThreadId(parentId);
      return id;
    }
    // An answer landing in a surface that isn't on screen can't pin or
    // pill the active transcript.
    if (surface !== primarySurfaceRef.current) return id;
    // Scrolled away → don't yank; raise (or retarget) the pill instead.
    pinNextRef.current = !scrolledAwayRef.current;
    if (scrolledAwayRef.current) {
      setPillFaces((prev) =>
        [run.agent, ...prev.filter((agent) => agent.id !== run.agent.id)].slice(0, 2)
      );
      setPillState((state) => {
        if (state === "shown") setPillBump((bump) => bump + 1);
        return "shown";
      });
    }
    return id;
  });

  // Chat surfaces open at the latest message and stay pinned while you're
  // near the bottom; answers landing above a scrolled-away viewport leave
  // the scroll alone (the pill handles the return trip).
  useLayoutEffect(() => {
    const list = messagesRef.current;
    if (list != null && pinNextRef.current) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  const handlePillJump = () => {
    setPillState("leaving");
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  // Sticky presence: the corner rail carries only OFF-SCREEN work.
  // Every message row is measured against the transcript viewport;
  // while a row is in view its own surface (wash + right cluster) is
  // the working indicator, and the moment it scrolls away its agents
  // dock into the corner stack. Measured on scroll and on transcript
  // growth — plain rect math, no IntersectionObserver (whose callbacks
  // stall entirely when rendering throttles, silently freezing the
  // rail).
  // Two explicit sets, because their absences mean different things: a
  // row in NEITHER set simply hasn't been measured yet (it must count
  // as off-screen for docking and as UNSEEN for the sweep — a fresh
  // answer row must never be concealed before its first measurement).
  const [viz, setViz] = useState<{ off: Set<string>; on: Set<string> }>(() => ({
    off: new Set(),
    on: new Set(),
  }));
  const measureOffscreen = () => {
    const list = messagesRef.current;
    if (list == null) return;
    const listRect = list.getBoundingClientRect();
    const off = new Set<string>();
    const on = new Set<string>();
    list.querySelectorAll("[data-aw-msg-id]").forEach((node) => {
      const id = node.getAttribute("data-aw-msg-id");
      if (id == null) return;
      const rect = node.getBoundingClientRect();
      const overlap = Math.min(rect.bottom, listRect.bottom) - Math.max(rect.top, listRect.top);
      // In view = ~40% of the row overlaps the viewport (capped at 32px
      // so tall exchanges don't need half a screen to count) — enough
      // hysteresis that the boundary doesn't flicker agents in and out.
      if (overlap < Math.min(rect.height * 0.4, 32)) off.add(id);
      else on.add(id);
    });
    setViz((prev) => {
      const same = (a: Set<string>, b: Set<string>) =>
        a.size === b.size && [...a].every((id) => b.has(id));
      return same(prev.off, off) && same(prev.on, on) ? prev : { off, on };
    });
  };
  useEffect(measureOffscreen, [messages.length]);
  // View switch mounts a different primary transcript: open it at the
  // bottom and re-measure visibility in the new container.
  useLayoutEffect(() => {
    const list = messagesRef.current;
    if (list != null) list.scrollTop = list.scrollHeight;
    measureOffscreen();
  }, [view]);

  // A run's viewport anchor: while working (or dead) it's the invoking
  // message; once answered it's the ANSWER — that's the thing you
  // haven't seen yet, and where the bubble should take you.
  const anchorFor = (run: AgentRun) =>
    run.status === "done" ? (run.answerMessageId ?? run.messageId) : run.messageId;

  // Corner + flyout roster: EVERY agent whose anchor is out of view —
  // working runs above or below, plus completions you haven't seen.
  // In-view work is already told by its own row; visibleRuns keeps
  // leaving rows mounted through their exit animation.
  // A run docks whenever its anchor is not measured-in-view — unknown
  // rows count as off-screen, so a completion landing below a
  // scrolled-away viewport rails on its very first frame.
  // Anchor-offscreen runs dock as before; demoted typers force-dock —
  // the tray is where they went when they lost the floor.
  const cornerRuns = engine.visibleRuns.filter(
    (run) =>
      !viz.on.has(anchorFor(run)) ||
      (run.status === "working" && trayedMsgIds.has(run.messageId))
  );
  // Runs that arrived BY FLIGHT: their chips mount silently — the
  // flying face already performed the arrival.
  const landedRunIds = new Set(
    engine.runs.filter((run) => trayedMsgIds.has(run.messageId)).map((run) => run.id)
  );

  // Clicking a line face SUMMONS its run bottom-right even though the
  // ask is in view (the rail-only roster wouldn't carry it): the agent
  // docks into the corner stack AND rides at the top of the panel —
  // the click's answer appears where the click promised — until the
  // panel closes.
  const [flyoutFocusId, setFlyoutFocusId] = useState<string | null>(null);

  // Switching interfaces retires overlays keyed to the old surface's
  // message ids and resets the scroll bookkeeping — an event, not an
  // effect, so no cascading render.
  const switchView = (mode: ViewMode) => {
    if (mode === view) return;
    pinNextRef.current = true;
    scrolledAwayRef.current = false;
    setPillState("hidden");
    setPillFaces([]);
    setFlyoutState("closed");
    setFlyoutFocusId(null);
    setOpenThreadId(null);
    setView(mode);
  };
  const focusRun =
    flyoutFocusId != null
      ? (engine.visibleRuns.find((run) => run.id === flyoutFocusId) ?? null)
      : null;
  const railRuns =
    focusRun != null && !cornerRuns.some((run) => run.id === focusRun.id)
      ? [focusRun, ...cornerRuns]
      : cornerRuns;
  const rosterCount = railRuns.length;

  // Seen-completion sweep: a done run whose answer has been MEASURED in
  // view has told its whole story — conceal it so it never re-docks
  // while you browse history. (Failed and stopped runs keep persisting:
  // they carry a decision, not just news.)
  useEffect(() => {
    engine.runs.forEach((run) => {
      const seenDone =
        run.status === "done" &&
        run.answerMessageId != null &&
        viz.on.has(run.answerMessageId);
      if (!run.concealed && seenDone) {
        engine.conceal(run.id);
      }
    });
  }, [viz, engine.runs, engine.conceal]);

  // Scroll can empty the panel's roster while it's open — without this
  // reset the stale "open" state would pop the flyout un-hovered on the
  // next dock. "Adjust state during render", not an effect.
  const [prevFlyoutCount, setPrevFlyoutCount] = useState(railRuns.length);
  if (prevFlyoutCount !== railRuns.length) {
    setPrevFlyoutCount(railRuns.length);
    if (railRuns.length === 0 && flyoutState !== "closed") {
      setFlyoutState("closed");
      setFlyoutFocusId(null);
    }
  }

  const handleSend = (text: string, surface: Surface = primarySurface) => {
    // If the roster emptied while the flyout was open, the panel unmounted
    // before its exit could play, leaving stale "open" state — a fresh
    // mention must not resurrect the flyout un-hovered.
    if (rosterCount === 0) setFlyoutState("closed");
    // Your own sends always return you to the bottom.
    pinNextRef.current = true;
    scrolledAwayRef.current = false;
    const segments = parseMentions(text);
    const mentioned = AGENTS.filter((agent) =>
      segments.some(
        (segment) =>
          segment.mention &&
          segment.text.toLowerCase() === `@${agent.name.toLowerCase()}`
      )
    );
    const id = nextMessageId();

    // "@Agent stop" is a command, not a prompt: stop that agent's working
    // runs instead of spawning. The acknowledgment rides the invoking
    // message itself — "{agent} updated its own proactivity" as a footer
    // in the Worked-for spacing — attribution by position.
    const isStop = mentioned.length > 0 && /^stop[.!]?$/i.test(promptOf(text).trim());
    const footers: NonNullable<AwMessage["proactivityFooters"]> = [];
    const stoppedAgentIds: string[] = [];
    if (isStop) {
      mentioned.forEach((agent) => {
        const workingRuns = engine.runs.filter(
          (run) => run.agent.id === agent.id && run.status === "working" && !run.removed
        );
        workingRuns.forEach((run) => engine.stop(run.id));
        if (workingRuns.length > 0) {
          stoppedAgentIds.push(agent.id);
          footers.push({ agentName: agent.name, level: "mention only" });
        }
      });
    }

    surfaceByMsgRef.current[id] = surface;
    setMessages((prev) => [
      ...prev,
      {
        id,
        surface,
        authorName: "Caleb",
        avatar: "disc",
        time: stampFor(surface),
        paragraphs: [segments],
      },
    ]);

    // The kill switch is instant — the runs sealed to stopped above —
    // but the acknowledgment is not: the agent takes a beat to process
    // the command, flip its own level, and report. ~1s of thinking,
    // then the footer materializes under the command it obeyed.
    if (footers.length > 0) {
      window.setTimeout(() => {
        setProactivityLevels((prev) => {
          const next = { ...prev };
          stoppedAgentIds.forEach((agentId) => {
            next[agentId] = "mention only";
          });
          return next;
        });
        setMessages((prev) =>
          prev.map((message) =>
            message.id === id ? { ...message, proactivityFooters: footers } : message
          )
        );
      }, 1000);
    }
    if (mentioned.length === 0 || isStop) return;

    // No load-time simulation — every run is user-invoked, and runs go
    // straight through: the tool-approval gate is benched (the engine
    // still supports it via SpawnOverride.approval; pass a gate here to
    // revive the Allow/Deny card). The Agents panel's response-time
    // setting rides along as a pace multiplier.
    engine.spawn(
      id,
      promptOf(text),
      mentioned,
      pace !== 1 ? { paceMultiplier: pace } : undefined
    );
    // Linear (typing-indicator) replies get the 3-second floor: typing
    // longer than that demotes the agents to the trace tray.
    if (surface !== "channel" || presenceStyle === "typing") {
      window.setTimeout(() => beginDemote(id, mentioned.length), TYPING_DEMOTE_MS);
    }
  };

  // A reply typed into the thread panel: lands under the root; "also
  // send" posts a top-level copy to the root's surface. Mentions spawn
  // from the reply, so the agent's presence rides it inside the panel.
  const handleThreadReply = (rootId: string, text: string, alsoSend = false) => {
    const surface = surfaceByMsgRef.current[rootId] ?? "channel";
    const segments = parseMentions(text);
    const mentioned = AGENTS.filter((agent) =>
      segments.some(
        (segment) =>
          segment.mention &&
          segment.text.toLowerCase() === `@${agent.name.toLowerCase()}`
      )
    );
    const id = nextMessageId();
    surfaceByMsgRef.current[id] = surface;
    parentByMsgRef.current[id] = rootId;
    const reply: AwMessage = {
      id,
      surface,
      parentId: rootId,
      authorName: "Caleb",
      avatar: "disc",
      time: stampFor(surface),
      paragraphs: [segments],
    };
    const copy: AwMessage | null = alsoSend
      ? { ...reply, id: nextMessageId(), parentId: undefined }
      : null;
    setMessages((prev) => (copy != null ? [...prev, reply, copy] : [...prev, reply]));
    if (mentioned.length > 0) {
      engine.spawn(
        id,
        promptOf(text),
        mentioned,
        pace !== 1 ? { paceMultiplier: pace } : undefined
      );
      window.setTimeout(() => beginDemote(id, mentioned.length), TYPING_DEMOTE_MS);
    }
  };

  // An open thread is a read thread: done runs whose answer lives in it
  // have told their story — conceal them so the rail lets go.
  useEffect(() => {
    if (openThreadId == null) return;
    engine.runs.forEach((run) => {
      if (
        run.status === "done" &&
        !run.concealed &&
        run.answerMessageId != null &&
        parentByMsgRef.current[run.answerMessageId] === openThreadId
      ) {
        engine.conceal(run.id);
      }
    });
  }, [openThreadId, engine.runs, engine.conceal, engine]);

  // Thread panel stays pinned to its newest reply.
  const openReplies = useMemo(
    () =>
      openThreadId == null
        ? []
        : messages.filter((message) => message.parentId === openThreadId),
    [messages, openThreadId]
  );
  useLayoutEffect(() => {
    const list = threadListRef.current;
    if (list != null) list.scrollTop = list.scrollHeight;
  }, [openThreadId, openReplies.length]);

  // Every proactivity change — chat command, notice CTA, or the
  // settings panel — updates the shared map and posts a fresh notice:
  // a visible trail, never edited history. Settings-sourced changes
  // carry via so the notice says where they came from.
  const handleSetProactivity = (agentName: string, level: ProactivityLevel) => {
    const agent = AGENTS.find((a) => a.name === agentName);
    if (agent) {
      setProactivityLevels((prev) => ({ ...prev, [agent.id]: level }));
    }
    setMessages((prev) => [
      ...prev,
      {
        id: nextMessageId(),
        surface: primarySurfaceRef.current,
        authorName: agentName,
        avatar: "disc" as const,
        time: stampFor(primarySurfaceRef.current),
        paragraphs: [],
        system: true,
        proactivity: { actor: "Caleb", agentName, level },
      },
    ]);
  };

  // Bubble and row clicks navigate to the run's anchor — the invoking
  // message while it works, the ANSWER once it's done (spec annotation
  // on 17744-3264) — with a cream flash on arrival. Arriving at a done
  // run's answer is what marks it seen; the sweep conceals it.
  const handleJump = (run: AgentRun) => {
    const target = anchorFor(run);
    const node = messagesRef.current?.querySelector(`[data-aw-msg-id="${target}"]`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashId(null);
    // Re-trigger the animation even when flashing the same message twice.
    requestAnimationFrame(() => setFlashId(target));
  };

  const liveTraceRun =
    traceRunId != null
      ? engine.runs.find((run) => run.id === traceRunId)
      : undefined;
  const trace: TraceView | null =
    liveTraceRun != null ? traceViewFromRun(liveTraceRun) : null;

  // Replies grouped under their roots — main transcripts show the root
  // with a reply footer; the thread panel shows the replies themselves.
  const repliesByParent = new Map<string, AwMessage[]>();
  messages.forEach((message) => {
    if (message.parentId == null) return;
    const list = repliesByParent.get(message.parentId) ?? [];
    list.push(message);
    repliesByParent.set(message.parentId, list);
  });

  // Suggestions ride only the NEWEST answer of each transcript (main
  // lists and open threads) — the conversation moving on retires them.
  const suggestionTargets = new Set<string>();
  if (suggestionStyle !== "off") {
    (["channel", "dm", "thread"] as Surface[]).forEach((surface) => {
      const list = messages.filter(
        (message) =>
          (message.surface ?? "channel") === surface && message.parentId == null
      );
      const last = list[list.length - 1];
      if (last?.runId != null) suggestionTargets.add(last.id);
    });
    repliesByParent.forEach((replies) => {
      const last = replies[replies.length - 1];
      if (last?.runId != null) suggestionTargets.add(last.id);
    });
  }

  // One row, with the full interaction prop set. withReplyFooter: main
  // transcripts hang the thread footer under roots that grew replies.
  // Runs on a channel/DM top-level message answer IN-THREAD, so their
  // presence lives in the reply slot (ReplyPresence) instead of the
  // inline cluster; the static Thread view and panel replies keep the
  // inline grammar.
  const rowFor = (message: AwMessage, withReplyFooter: boolean) => {
    const replies = repliesByParent.get(message.id) ?? [];
    const messageRuns = engine.runs.filter((run) => run.messageId === message.id);
    // Channel pings thread their answers only in the inline/reply
    // auditions — those get the reply-slot presence or the inline
    // cluster. Everything else (typing mode included) replies linearly:
    // working runs announce as the typing indicator above the composer,
    // so only failed and stopped verdicts stay on the invoking row.
    const threading =
      withReplyFooter &&
      (message.surface ?? "channel") === "channel" &&
      presenceStyle !== "typing";
    const replyPresence = threading && presenceStyle === "reply";
    const rowRuns = replyPresence
      ? []
      : threading
        ? messageRuns
        : messageRuns.filter((run) => run.status !== "working");
    // Done runs stay in the reply slot through their handoff phases.
    const pendingRuns = replyPresence
      ? messageRuns.filter((run) =>
          run.status === "done" ? sealPhases[run.id] != null : !run.removed
        )
      : [];
    // While a handoff is playing, its row IS the footer — the real one
    // waits so the slot never doubles up.
    const sealingHere =
      replyPresence && messageRuns.some((run) => sealPhases[run.id] != null);
    return (
      <div key={message.id} className="flex w-full flex-col">
        <MessageRow
          message={message}
          runs={rowRuns}
          clusterSide={clusterSide}
          flashing={flashId === message.id}
          onOpenAgentPanel={(runId) => {
            setFlyoutFocusId(runId);
            setFlyoutState("open");
          }}
          onStopRun={engine.stop}
          onRemove={engine.remove}
          onOpenTrace={(target) => setTraceRunId(target.runId ?? null)}
          onOpenRunTrace={setTraceRunId}
          onRerun={engine.rerun}
          onApprove={engine.approve}
          onDeny={engine.deny}
          onSetProactivity={handleSetProactivity}
        />
        {message.threadFooter ? <ThreadFooter footer={message.threadFooter} /> : null}
        {withReplyFooter && replies.length > 0 && !sealingHere ? (
          <ReplyFooter replies={replies} onOpen={() => setOpenThreadId(message.id)} />
        ) : null}
        {pendingRuns.length > 0 ? (
          <ReplyPresence
            runs={pendingRuns}
            replies={replies}
            sealPhases={sealPhases}
            onStop={engine.stop}
            onRerun={engine.rerun}
            onRemove={engine.remove}
            onOpenTrace={setTraceRunId}
          />
        ) : null}
        {suggestionStyle !== "off" &&
        suggestionTargets.has(message.id) &&
        typeof message.avatar !== "string" ? (
          <SuggestedActions
            agent={message.avatar.agent}
            variant={suggestionStyle}
            onPick={(text) => {
              const agentName =
                typeof message.avatar !== "string" ? message.avatar.agent.name : "";
              const ask = `@${agentName} ${text}`;
              if (message.parentId != null) {
                handleThreadReply(message.parentId, ask);
              } else {
                handleSend(ask, message.surface ?? "channel");
              }
            }}
          />
        ) : null}
      </div>
    );
  };

  // Rows for one surface — replies stay out of the main transcript.
  const rowsFor = (surface: Surface) =>
    messages
      .filter(
        (message) =>
          (message.surface ?? "channel") === surface && message.parentId == null
      )
      .map((message) => rowFor(message, true));

  // Working runs whose reply will APPEND linearly to a transcript,
  // keyed by where the invoking message lives — these show as typing
  // indicators at that transcript's bottom. Trayed runs have already
  // handed the floor to the corner stack.
  const typingRunsWhere = (predicate: (invoking: AwMessage) => boolean) =>
    engine.runs.filter((run) => {
      if (run.status !== "working" || run.removed) return false;
      // Trayed runs have handed the floor to the corner stack — but a
      // row mid-choreography stays mounted so its collapse can play.
      if (trayedMsgIds.has(run.messageId) && demotePhases[run.messageId] == null)
        return false;
      const invoking = messages.find((message) => message.id === run.messageId);
      return invoking != null && predicate(invoking);
    });
  const dmTypingRuns = typingRunsWhere(
    (invoking) => (invoking.surface ?? "channel") === "dm" && invoking.parentId == null
  );
  // Channel pings are general turns in "typing" mode — they answer in
  // channel, so the channel composer types too.
  const channelTypingRuns =
    presenceStyle === "typing"
      ? typingRunsWhere(
          (invoking) =>
            (invoking.surface ?? "channel") === "channel" && invoking.parentId == null
        )
      : [];
  const staticThreadTypingRuns = typingRunsWhere(
    (invoking) => (invoking.surface ?? "channel") === "thread"
  );
  // The open panel types for pings from inside the thread AND for the
  // root's own runs — either way the reply lands here.
  const openThreadTypingRuns =
    openThreadId == null
      ? []
      : typingRunsWhere(
          (invoking) =>
            invoking.parentId === openThreadId || invoking.id === openThreadId
        );
  // "Someone else starts typing": the user taking the floor demotes
  // every agent currently on a typing line.
  const demoteAllTyping = () => {
    const counts = new Map<string, number>();
    [
      ...channelTypingRuns,
      ...dmTypingRuns,
      ...staticThreadTypingRuns,
      ...openThreadTypingRuns,
    ].forEach((run) => {
      counts.set(run.messageId, (counts.get(run.messageId) ?? 0) + 1);
    });
    counts.forEach((count, msgId) => beginDemote(msgId, count));
  };

  // Thread transcript: the first message typed is the ROOT; everything
  // after it is a reply behind the "N replies" rule (Figma 117-10559).
  const threadMessages = messages.filter((message) => message.surface === "thread");
  const threadTitle =
    threadMessages[0]?.paragraphs[0]?.map((segment) => segment.text).join("") || "Thread";
  const threadRows = (() => {
    const rows = rowsFor("thread");
    if (rows.length <= 1) return rows;
    return [
      rows[0],
      <RepliesDivider key="aw-replies-divider" count={rows.length - 1} />,
      ...rows.slice(1),
    ];
  })();

  // Presence overlays ride the PRIMARY pane (the one messagesRef
  // measures): channel, DM, or the thread panel.
  const overlays = (
    <>
      {pillState !== "hidden" ? (
        <JumpToLatestPill
          leaving={pillState === "leaving"}
          bumpKey={pillBump}
          faces={pillFaces}
          onJump={handlePillJump}
          onExited={() => {
            setPillState("hidden");
            setPillFaces([]);
          }}
        />
      ) : null}
      {rosterCount > 0 ? (
        <CornerStack
          runs={railRuns}
          resting={flyoutState !== "closed"}
          receiving={trayReceiving}
          landedRunIds={landedRunIds}
          onHoverChange={handleHoverChange}
          onJumpRun={handleJump}
          onConceal={engine.conceal}
        />
      ) : null}
      {flyoutState !== "closed" && railRuns.length > 0 ? (
        <AgentFlyout
          runs={railRuns}
          focusRunId={flyoutFocusId ?? undefined}
          closing={flyoutState === "closing"}
          onClose={() => setFlyoutState("closing")}
          onExited={() => {
            setFlyoutState("closed");
            setFlyoutFocusId(null);
          }}
          onHoverChange={handleHoverChange}
          onStop={engine.stop}
          onRerun={engine.rerun}
          onRemove={engine.remove}
          onJump={handleJump}
          onTrace={(run) => setTraceRunId(run.id)}
        />
      ) : null}
    </>
  );

  // Per-message thread panel: root on top, replies behind the divider,
  // composer with "Also send to". Opens when a ping's reply lands, or
  // from a root's reply footer; × closes it.
  const openRoot =
    openThreadId != null
      ? (messages.find((message) => message.id === openThreadId) ?? null)
      : null;
  const openThreadAside =
    openRoot != null ? (
      <aside
        className="relative flex w-[400px] shrink-0 flex-col overflow-clip border-l-[0.5px] bg-white"
        style={{ borderColor: STROKE_WEAK }}
      >
        <ThreadHeader title="Thread" onClose={() => setOpenThreadId(null)} />
        <div
          ref={threadListRef}
          className="aw-messages flex min-h-0 flex-1 flex-col overflow-y-auto pr-2"
        >
          {rowFor(openRoot, false)}
          {openReplies.length > 0 ? <RepliesDivider count={openReplies.length} /> : null}
          {openReplies.map((reply) => rowFor(reply, false))}
        </div>
        <Composer
          onSend={(text, alsoSend) => handleThreadReply(openRoot.id, text, alsoSend)}
          alsoSendTo={(openRoot.surface ?? "channel") === "dm" ? DM_PEER.name : "#design"}
          typing={<TypingIndicator runs={openThreadTypingRuns} phases={demotePhases} variant={typingVariant} />}
          onTyping={demoteAllTyping}
        />
      </aside>
    ) : null;

  const viewSwitcher = <ViewSwitcher view={view} onChange={switchView} />;
  const channelHeader = (
    <PageHeader
      clusterSide={clusterSide}
      onClusterSideChange={setClusterSide}
      presenceStyle={presenceStyle}
      onPresenceStyleChange={setPresenceStyle}
      suggestionStyle={suggestionStyle}
      onSuggestionStyleChange={setSuggestionStyle}
      levels={proactivityLevels}
      pace={pace}
      onPaceChange={setPace}
      onPick={(agent, level) => handleSetProactivity(agent.name, level)}
      viewSwitcher={viewSwitcher}
    />
  );

  return (
    <div
      className="aw-page flex h-dvh w-screen flex-col overflow-hidden bg-white"
      style={{ color: FG_PRIMARY }}
    >
      <div className="relative flex min-h-0 flex-1">
        {/* Sidebars and PinnedBar benched — only the interfaces render.
            The view switcher rides each header's control cluster. */}
        {view === "channel" ? (
          <main className="relative flex min-w-0 flex-1 flex-col overflow-clip bg-white">
            {channelHeader}
            {/* mt-auto spacer (not justify-end) pins messages to the bottom:
                justify-end makes top overflow unscrollable in flex containers. */}
            <div
              ref={messagesRef}
              onScroll={handleTranscriptScroll}
              className="aw-messages flex min-h-0 flex-1 flex-col overflow-y-auto pr-4"
            >
              <div aria-hidden className="mt-auto shrink-0" />
              {rowsFor("channel")}
            </div>
            <Composer
              onSend={(text) => handleSend(text, "channel")}
              typing={<TypingIndicator runs={channelTypingRuns} phases={demotePhases} variant={typingVariant} />}
              onTyping={demoteAllTyping}
            />
            {overlays}
          </main>
        ) : null}
        {view === "channel" ? openThreadAside : null}

        {view === "dm" ? (
          <main className="relative flex min-w-0 flex-1 flex-col overflow-clip bg-white">
            <DmHeader peer={DM_PEER} viewSwitcher={viewSwitcher} />
            {/* DM transcript is TOP-anchored (per the DM shell): intro,
                date rule, then the conversation flowing down. */}
            <div
              ref={messagesRef}
              onScroll={handleTranscriptScroll}
              className="aw-messages flex min-h-0 flex-1 flex-col overflow-y-auto pr-4"
            >
              <DmIntro peer={DM_PEER} />
              {rowsFor("dm")}
            </div>
            <Composer
              onSend={(text) => handleSend(text, "dm")}
              typing={<TypingIndicator runs={dmTypingRuns} phases={demotePhases} variant={typingVariant} />}
              onTyping={demoteAllTyping}
            />
            {overlays}
          </main>
        ) : null}
        {view === "dm" ? openThreadAside : null}

        {view === "thread" ? (
          <>
            {/* Channel pane rides alongside at whatever width the thread
                leaves it — the small-screen implementation check. */}
            <main className="relative flex min-w-0 flex-1 flex-col overflow-clip bg-white">
              {channelHeader}
              <div className="aw-messages flex min-h-0 flex-1 flex-col overflow-y-auto pr-4">
                <div aria-hidden className="mt-auto shrink-0" />
                {rowsFor("channel")}
              </div>
              <Composer onSend={(text) => handleSend(text, "channel")} />
            </main>
            {/* Thread panel: fixed 400px per Figma 117-10559. The primary
                surface — presence overlays and measurement live here. A
                ping-opened per-message thread takes the slot over. */}
            {openThreadAside ?? (
              <aside
                className="relative flex w-[400px] shrink-0 flex-col overflow-clip border-l-[0.5px] bg-white"
                style={{ borderColor: STROKE_WEAK }}
              >
                <ThreadHeader title={threadTitle} onClose={() => switchView("channel")} />
                <div
                  ref={messagesRef}
                  onScroll={handleTranscriptScroll}
                  className="aw-messages flex min-h-0 flex-1 flex-col overflow-y-auto pr-2"
                >
                  <div aria-hidden className="mt-auto shrink-0" />
                  {threadRows}
                </div>
                <Composer
                  onSend={(text) => handleSend(text, "thread")}
                  placeholder="Reply in thread"
                  typing={
                    <TypingIndicator runs={staticThreadTypingRuns} phases={demotePhases} variant={typingVariant} />
                  }
                  onTyping={demoteAllTyping}
                />
                {overlays}
              </aside>
            )}
          </>
        ) : null}
      </div>

      {trace != null ? <TraceModal trace={trace} onClose={() => setTraceRunId(null)} /> : null}
    </div>
  );
}
