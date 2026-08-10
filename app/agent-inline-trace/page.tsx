"use client";

// /agent-inline-trace — sticky inline agent presence on the messaging
// shell (Aug 10 direction, forked from /agent-working). The idea in one
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
//     · done — the answer posts as its own message ("Worked for Xs ›"
//       footer → trace modal) and the face mists out.
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

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./agent-inline-trace.css";
import { MESSAGES, SIDEBAR, SIDEBAR_FLAT, type SidebarEntry } from "../multi-select/data";
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
  TraceModal,
  formatDuration,
  traceViewFromRun,
  useAgentEngine,
  type AgentDef,
  type AgentRun,
  type TraceView,
} from "./agents";

// Assets live in the shared /multi-select public folder.
const A = "/multi-select";

const FG_PRIMARY = "#1a1817";
const FG_SECONDARY = "#58524e";
const FG_TERTIARY = "#78716c";
const STROKE_WEAK = "#f0efee";
const BG_TERTIARY = "#f5f5f4";
const BRAND = "#2563eb";

/* ------------------------------ message model ------------------------------ */

type AwSegment = { text: string; link?: boolean; mention?: boolean };

type AwMessage = {
  id: string;
  authorName: string;
  // Avatar treatment: seed transcript keeps the mock's silhouettes; live
  // authors (Oli, the agents) render real faces per the spec frames.
  avatar: "silhouette" | { photo: string } | { agent: AgentDef };
  time: string;
  paragraphs: AwSegment[][];
  threadFooter?: (typeof MESSAGES)[number]["threadFooter"];
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

const TADAO = AGENTS[0];
const ANDO = AGENTS.find((agent) => agent.id === "ando")!;
const YUMI = AGENTS.find((agent) => agent.id === "yumi")!;
// avatar-oliver.png exported blank from Figma (the mock rows used
// silhouettes) — sb-photo-4 is the real face that matches the spec's Oli.
const OLI_PHOTO = `${A}/sb-photo-4.png`;

// Seeded per the spec's opening frames: Oli's past ask and Tadao's finished
// answer. A long-done run — footer opens a canned trace, no live presence.
const SEED_MESSAGES: AwMessage[] = [
  ...MESSAGES.map((message) => ({
    id: message.id,
    authorName: message.author.name,
    avatar: "silhouette" as const,
    time: message.time,
    paragraphs: message.body,
    threadFooter: message.threadFooter,
  })),
  {
    id: "aw-seed-ask",
    authorName: "Oli",
    avatar: { photo: OLI_PHOTO },
    time: "5:35 pm",
    paragraphs: [
      [
        { text: "@Tadao", mention: true },
        { text: " Hey Tadao, can you tell me what the weather is." },
      ],
    ],
  },
  {
    id: "aw-seed-answer",
    authorName: TADAO.name,
    avatar: { agent: TADAO },
    time: "5:36 pm",
    paragraphs: TADAO.answer.map((paragraph) => [{ text: paragraph }]),
    workedForMs: 624000,
    runId: "seed",
  },
];

const SEED_TRACE: TraceView = {
  outcome: "done",
  toolCalls: 49,
  workedForMs: 624000,
  steps: TADAO.traceSteps,
  visibleSteps: TADAO.traceSteps.length,
};

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
  const suffix = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  return `${hours}:${String(date.getMinutes()).padStart(2, "0")} ${suffix}`;
}

/* ------------------------------- shell chrome ------------------------------ */

// The mock's message avatars are generic silhouette placeholders — drawn
// inline so they render identically everywhere.
function Silhouette({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="shrink-0 rounded-full"
      aria-hidden
    >
      <circle cx="12" cy="12" r="12" fill="#e7e5e4" />
      <circle cx="12" cy="9.5" r="4" fill="#a8a29e" />
      <path d="M4 21.5c1.4-4 4.4-6 8-6s6.6 2 8 6a12 12 0 01-16 0z" fill="#a8a29e" />
    </svg>
  );
}

function Titlebar() {
  return (
    <div className="relative flex h-7 shrink-0 items-center justify-center">
      <div className="absolute left-2 top-2 flex items-center gap-2">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </div>
      <span className="text-[13px] font-medium leading-4" style={{ color: FG_PRIMARY }}>
        Ando
      </span>
    </div>
  );
}

function RailTile({
  children,
  size = 32,
  card = false,
}: {
  children?: React.ReactNode;
  size?: number;
  card?: boolean;
}) {
  return (
    <span
      className={`flex items-center justify-center rounded-[6px] ${
        card
          ? "bg-white shadow-[0px_1px_4px_0px_rgba(16,16,16,0.06),0px_0px_0.5px_0.75px_#f0efee]"
          : ""
      }`}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}

function GlobalNav() {
  return (
    <div className="flex w-12 shrink-0 flex-col items-center justify-between px-2 py-2.5">
      <div className="relative flex w-8 flex-col items-center gap-2.5">
        <span
          className="flex size-7 items-center justify-center rounded-[6px] border-[0.5px] border-[rgba(16,16,16,0.08)]"
          style={{ background: BG_TERTIARY }}
        >
          <img src={`${A}/rail-logo.svg`} alt="" className="size-5" />
        </span>
        <span className="absolute left-[21px] top-[19px] flex size-3 items-center justify-center rounded-[6px] bg-white shadow-[0px_1px_4px_0px_rgba(16,16,16,0.06),0px_0px_0.5px_0.75px_#f0efee]">
          <img src={`${A}/icon-chevron-down-small.svg`} alt="" className="size-3" />
        </span>
        <span className="h-px w-4" style={{ background: STROKE_WEAK }} />
        <div className="flex w-full flex-col items-center gap-2">
          <RailTile size={28} card>
            <img src={`${A}/icon-bubble.svg`} alt="" className="size-4" />
          </RailTile>
          <RailTile>
            <img src={`${A}/icon-bookmark.svg`} alt="" className="size-4" />
          </RailTile>
          <RailTile>
            <img src={`${A}/icon-search.svg`} alt="" className="size-4" />
          </RailTile>
        </div>
        <span className="h-px w-4" style={{ background: STROKE_WEAK }} />
        <RailTile>
          <img src={`${A}/icon-cmd.svg`} alt="" className="size-4" />
        </RailTile>
      </div>
      <div className="flex flex-col items-center gap-2">
        <RailTile>
          <img src={`${A}/icon-user-add.svg`} alt="" className="size-4" />
        </RailTile>
        <RailTile>
          <span className="relative size-4">
            <img
              src={`${A}/rail-avatar-photo.png`}
              alt=""
              className="size-4 rounded-full object-cover"
            />
            <img
              src={`${A}/rail-presence.svg`}
              alt=""
              className="absolute -bottom-px -right-px size-[7px]"
            />
          </span>
        </RailTile>
      </div>
    </div>
  );
}

function SidebarRowView({ entry, thinking }: { entry: SidebarEntry; thinking?: boolean }) {
  if (entry.kind === "folder") {
    return (
      <div className="flex h-6 w-full items-center gap-2 px-2">
        <span className="flex h-3.5 w-4 items-center">
          <img src={entry.icon} alt="" className="size-3.5" />
        </span>
        <span
          className="text-[11px] font-medium uppercase leading-[14px] tracking-[1.1px]"
          style={{ color: FG_SECONDARY }}
        >
          {entry.label}
        </span>
      </div>
    );
  }
  if (entry.kind === "create") {
    return (
      <div className="flex h-8 w-full items-center gap-2 rounded-xl px-2 py-1.5">
        <img src={`${A}/icon-plus-small.svg`} alt="" className="size-4" />
        <span className="text-[14px] leading-5" style={{ color: FG_SECONDARY }}>
          Create channel
        </span>
      </div>
    );
  }
  const indentClass = "indent" in entry && entry.indent ? "pl-6 pr-2" : "px-2";
  if (entry.kind === "channel") {
    return (
      <div
        className={`relative flex h-8 w-full items-center gap-3 rounded-[6px] py-1.5 ${indentClass}`}
        // While thinking, the wash IS the row's fill — the flat active
        // gray would just mud it.
        style={entry.active && !thinking ? { background: "rgba(16,16,16,0.04)" } : undefined}
      >
        {thinking ? <span aria-hidden className="aw-thinking-wash absolute inset-0" /> : null}
        <span className="relative flex flex-1 items-center gap-2 overflow-hidden">
          <img
            src={
              entry.unread
                ? `${A}/icon-hashtag-strong.svg`
                : entry.active
                  ? `${A}/icon-hashtag-weak.svg`
                  : `${A}/icon-hashtag-boxed.svg`
            }
            alt=""
            className="size-4 shrink-0"
          />
          <span
            className="truncate text-[14px] leading-5"
            style={{
              color: entry.unread || entry.active ? FG_PRIMARY : FG_SECONDARY,
              fontWeight: entry.unread ? 530 : 400,
            }}
          >
            {entry.label}
          </span>
        </span>
        {entry.badge != null ? (
          <span
            className="relative flex size-4 items-center justify-center rounded-xl text-center text-[10px] font-medium leading-[10px] text-white"
            style={{ background: BRAND }}
          >
            {entry.badge}
          </span>
        ) : null}
      </div>
    );
  }
  if (entry.kind === "group") {
    return (
      <div className="flex h-8 w-full items-center gap-1.5 rounded-xl px-2 py-1.5">
        <span className="flex flex-1 items-center gap-2 overflow-hidden">
          <img src={`${A}/icon-group.svg`} alt="" className="size-4 shrink-0" />
          <span className="truncate text-[14px] leading-5" style={{ color: FG_SECONDARY }}>
            {entry.label}
          </span>
        </span>
        {entry.muted ? (
          <img src={`${A}/icon-mute.svg`} alt="" className="size-4" />
        ) : null}
      </div>
    );
  }
  // person
  return (
    <div className={`flex h-8 w-full items-center gap-1.5 rounded-xl py-1.5 ${indentClass}`}>
      <span className="flex flex-1 items-center gap-2 overflow-hidden">
        <span className="relative size-4 shrink-0">
          <img src={entry.photo} alt="" className="size-4 rounded-full object-cover" />
          <span
            className="absolute size-[5px] rounded-full"
            style={{
              left: "calc(50% + 4px)",
              top: "calc(50% + 4px)",
              background: entry.presence === "green" ? "#16a34a" : "#d6d3d1",
              boxShadow: "0 0 0 1.5px white",
            }}
          />
        </span>
        <span
          className="truncate text-[14px] leading-5"
          style={{
            color: entry.medium ? FG_PRIMARY : FG_SECONDARY,
            fontWeight: entry.medium ? 500 : 400,
          }}
        >
          {entry.label}
        </span>
      </span>
    </div>
  );
}

// thinkingChannel: label of the channel an agent is working in (pulse
// mode) — its sidebar row carries the thinking wash, the ambient
// cross-channel tell.
function LocalNav({ thinkingChannel }: { thinkingChannel: string | null }) {
  const rowThinking = (entry: SidebarEntry) =>
    thinkingChannel != null && entry.kind === "channel" && entry.label === thinkingChannel;
  return (
    <div className="flex w-[350px] shrink-0 flex-col overflow-hidden rounded-tl-[10px] rounded-tr-[6px] bg-white shadow-[0px_0px_0.5px_0.5px_rgba(15,13,13,0.08),0px_1px_2px_0px_rgba(15,13,13,0.05)]">
      <div
        className="flex h-12 shrink-0 items-center gap-4 border-b-[0.5px] py-3 pl-2.5 pr-3"
        style={{ borderColor: STROKE_WEAK }}
      >
        <div className="flex flex-1 items-center">
          <span
            className="flex h-7 items-center justify-center rounded-full px-2.5"
            style={{ background: BG_TERTIARY }}
          >
            <span className="px-0.5 text-[12px] font-medium leading-4" style={{ color: FG_PRIMARY }}>
              Conversations
            </span>
          </span>
          <span className="flex h-7 items-center justify-center px-2.5">
            <span className="px-0.5 text-[12px] leading-4" style={{ color: FG_SECONDARY }}>
              Threads
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center rounded-[4px] p-1">
            <img src={`${A}/icon-dotgrid.svg`} alt="" className="size-4" />
          </span>
          <span className="flex items-center rounded-[4px] p-1">
            <img src={`${A}/icon-edit.svg`} alt="" className="size-4" />
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center gap-3 overflow-y-auto px-2 pb-2 pt-3">
        <div className="flex w-full flex-col gap-3">
          <div className="flex w-full flex-col">
            <SidebarRowView entry={SIDEBAR[0]} thinking={rowThinking(SIDEBAR[0])} />
          </div>
          <div className="flex w-full flex-col gap-0.5">
            {SIDEBAR.slice(1, 4).map((entry, index) => (
              <SidebarRowView key={index} entry={entry} thinking={rowThinking(entry)} />
            ))}
          </div>
          <div className="flex w-full flex-col gap-0.5">
            {SIDEBAR.slice(4).map((entry, index) => (
              <SidebarRowView key={index} entry={entry} thinking={rowThinking(entry)} />
            ))}
          </div>
        </div>
        <span className="h-px w-[268px] shrink-0" style={{ background: STROKE_WEAK }} />
        <div className="flex w-full flex-col gap-0.5">
          {SIDEBAR_FLAT.map((entry, index) => (
            <SidebarRowView key={index} entry={entry} thinking={rowThinking(entry)} />
          ))}
        </div>
        <span
          className="flex h-7 items-center justify-center gap-0.5 rounded-full border-[0.5px] px-2.5"
          style={{ borderColor: STROKE_WEAK }}
        >
          <span className="px-1 text-[12px] leading-4" style={{ color: FG_SECONDARY }}>
            Show 4 inactive conversations
          </span>
          <img src={`${A}/icon-chevron-down-medium.svg`} alt="" className="size-4" />
        </span>
      </div>
    </div>
  );
}

// Where the working agent lives on the invoking message: appended to
// the END of the text (in-line, 20px) or on the row's RIGHT edge
// (rail-sized 30px, the Figma 19-5559 Tool Call slot).
export type ClusterSide = "inline" | "right";

function PageHeader({
  clusterSide,
  onClusterSideChange,
  onOpenAgentSettings,
}: {
  clusterSide: ClusterSide;
  onClusterSideChange: (side: ClusterSide) => void;
  onOpenAgentSettings: () => void;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-10 border-b-[0.5px] bg-white px-4 py-1"
      style={{ borderColor: STROKE_WEAK }}
    >
      <div className="flex flex-1 items-center gap-2 py-0.5">
        <div className="flex flex-1 items-center">
          <span className="flex h-7 items-center gap-1">
            <span className="flex size-6 items-center justify-center rounded-[4px]">
              <img src={`${A}/icon-hashtag-header.svg`} alt="" className="size-4" />
            </span>
            <span className="text-[14px] leading-5" style={{ color: FG_PRIMARY }}>
              design
            </span>
          </span>
        </div>
        {/* Placement toggle: agent at the end of the text vs the row's
            right edge. */}
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
                clusterSide === side ? "bg-white shadow-[0px_0px_0.5px_0.75px_#ebe9e8]" : ""
              }`}
              style={{ color: clusterSide === side ? FG_PRIMARY : FG_TERTIARY }}
            >
              {side === "inline" ? "Inline" : "Right"}
            </button>
          ))}
        </span>
        {/* Agent settings — the out-of-transcript proactivity surface. */}
        <button
          type="button"
          onClick={onOpenAgentSettings}
          className="flex items-center justify-center rounded-[6px] bg-white px-2 py-1 text-[12px] leading-4 shadow-[0px_0px_0.5px_0.75px_#ebe9e8] transition-colors hover:bg-[#fafaf9]"
          style={{ color: FG_SECONDARY }}
        >
          Agents
        </button>
        <span className="flex items-center justify-center gap-1.5 rounded-[6px] bg-white px-2 py-1 shadow-[0px_0px_0.5px_0.75px_#ebe9e8]">
          <img src={`${A}/icon-people-header.svg`} alt="" className="size-4" />
          <span className="text-center text-[12px] leading-4" style={{ color: FG_SECONDARY }}>
            13
          </span>
        </span>
        <span
          className="flex items-center justify-center rounded-[6px] shadow-[0px_1px_6px_0px_rgba(16,16,16,0.04),0px_0px_0.5px_0.75px_rgba(16,16,16,0.06)]"
          style={{ background: BG_TERTIARY }}
        >
          <span className="flex items-center justify-center px-1.5 py-1">
            <img src={`${A}/icon-headphones.svg`} alt="" className="size-4" />
          </span>
          <span className="flex h-full w-5 items-center justify-center">
            <img src={`${A}/icon-chevron-header.svg`} alt="" className="size-4" />
          </span>
        </span>
      </div>
    </div>
  );
}

/* -------------------------------- transcript ------------------------------- */

function MessageAvatar({ avatar }: { avatar: AwMessage["avatar"] }) {
  if (avatar === "silhouette") return <Silhouette size={24} />;
  if ("photo" in avatar) {
    return (
      <img src={avatar.photo} alt="" className="size-6 shrink-0 rounded-full object-cover" />
    );
  }
  return <AgentFace agent={avatar.agent} size={24} />;
}

// Demo pace presets: multipliers over each agent's scripted duration,
// labeled by the ballpark they produce (scripts run ~9-14s at 1x).
const PACE_OPTIONS = [
  { label: "~3s", value: 0.3 },
  { label: "~10s", value: 1 },
  { label: "~30s", value: 3 },
  { label: "~2m", value: 12 },
] as const;

// Agent settings — the out-of-transcript home for proactivity and the
// demo's response-time setting. A quiet modal (trace-modal grammar):
// one row per agent, each with a level picker; changes post a "from
// agent settings" notice to the channel so nothing about an agent's
// behavior ever changes silently.
function AgentSettingsModal({
  levels,
  pace,
  onPaceChange,
  onPick,
  onClose,
}: {
  levels: Record<string, ProactivityLevel>;
  pace: number;
  onPaceChange: (pace: number) => void;
  onPick: (agent: AgentDef, level: ProactivityLevel) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={onClose}
    >
      <div
        className="aw-modal-enter w-[340px] rounded-[10px] bg-white shadow-[0px_16px_40px_-12px_rgba(16,16,16,0.28),0px_0px_0.5px_0.75px_rgba(16,16,16,0.08)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b-[0.5px] py-2 pl-4 pr-2"
          style={{ borderColor: STROKE_WEAK }}
        >
          <span className="text-[13px] font-medium leading-5" style={{ color: FG_PRIMARY }}>
            Agent settings
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-6 items-center justify-center rounded-[5px] text-[#a8a29e] transition-colors hover:bg-[#f5f5f4] hover:text-[#58524e]"
          >
            ×
          </button>
        </div>
        {/* Response time: how long a run takes from invoke to answer —
            applies to the NEXT invocation, not runs already underway. */}
        <div
          className="flex items-center justify-between border-b-[0.5px] py-2 pl-4 pr-3"
          style={{ borderColor: STROKE_WEAK }}
        >
          <span className="text-[13px] leading-4" style={{ color: FG_PRIMARY }}>
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
                  pace === option.value ? "bg-white shadow-[0px_0px_0.5px_0.75px_#ebe9e8]" : ""
                }`}
                style={{ color: pace === option.value ? FG_PRIMARY : FG_TERTIARY }}
              >
                {option.label}
              </button>
            ))}
          </span>
        </div>
        <div className="flex flex-col p-1.5">
          {AGENTS.map((agent) => (
            <div key={agent.id} className="flex items-center gap-2.5 rounded-[8px] p-2">
              <AgentFace agent={agent} size={24} />
              <span
                className="min-w-0 flex-1 truncate text-[13px] leading-4"
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
        </div>
        <div
          className="border-t-[0.5px] px-4 py-2 text-[11px] leading-4"
          style={{ borderColor: STROKE_WEAK, color: FG_TERTIARY }}
        >
          Changes post a notice to #design — proactivity never changes silently.
        </div>
      </div>
    </div>
  );
}

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
      <div data-aw-msg-id={message.id} className="flex w-full px-4 py-1 pl-[50px]">
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
        <RingedFace
          agent={clusterRun.agent}
          status={clusterRun.status}
          size={20}
          strokeWidth={1.5}
          inset={4}
          disc
        />
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
      className="group/row relative flex w-full items-start gap-2.5 px-4 pb-1.5 pt-2"
    >
      {/* Cream wash flash when a flyout row jumps back to this message. */}
      {flashing ? (
        <span
          aria-hidden
          className="aw-flash pointer-events-none absolute inset-x-2 inset-y-0.5 z-[1] rounded-md bg-[#FBF0C9]/60"
        />
      ) : null}
      {message.threadFooter ? (
        <img
          src={`${A}/thread-spine.svg`}
          alt=""
          className="absolute bottom-[-14px] left-7 h-[60px] w-3"
        />
      ) : null}
      <MessageAvatar avatar={message.avatar} />
      <div className="relative z-[2] flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex h-3 items-center gap-1.5 whitespace-nowrap">
          <span className="text-[14px] font-medium leading-5" style={{ color: FG_PRIMARY }}>
            {message.authorName}
          </span>
          <span className="text-[12px] leading-4" style={{ color: FG_TERTIARY }}>
            {message.time}
          </span>
        </div>
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
        {/* Agent answers: "Worked for Xm Ys ›" footer opens the trace. */}
        {message.workedForMs != null ? (
          <button
            type="button"
            onClick={() => onOpenTrace(message)}
            className="group flex w-fit items-center gap-1 rounded-[4px] text-[12px] leading-4 text-[#78716c] transition-colors duration-300 ease-in-out hover:text-[#58524e]"
          >
            {`Worked for ${formatDuration(message.workedForMs)}`}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              aria-hidden
              className="opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
            >
              <path
                d="M4.5 2.5L8 6l-3.5 3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
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
    <div className="relative flex w-full items-center gap-2.5 px-4 py-1.5">
      <span className="h-3 w-6 shrink-0" />
      <span className="flex items-center gap-2 rounded-[4px]">
        <span className="flex h-4 items-center">
          {footer.avatars.map((_, index) => (
            <span
              key={index}
              className="rounded-full border-[1.5px] border-white"
              style={{ marginRight: index < footer.avatars.length - 1 ? -6 : 0 }}
            >
              <Silhouette size={13} />
            </span>
          ))}
        </span>
        <span className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-[12px] font-medium leading-4">
            <span style={{ color: FG_PRIMARY }}>{footer.countLabel}</span>
            <span style={{ color: BRAND }}>{footer.newLabel}</span>
          </span>
          <span className="text-[11px] leading-[14px]" style={{ color: FG_TERTIARY }}>
            {footer.lastReply}
          </span>
        </span>
      </span>
    </div>
  );
}

/* --------------------------------- composer -------------------------------- */

// escHint: "to stop Tadao" while YOUR latest send has live runs — the
// "oops, wrong ask" reflex. Esc only reaches your own latest invocation,
// and only from an empty composer (mid-draft, Esc means the draft).
function Composer({
  onSend,
  escHint,
  onEscStop,
}: {
  onSend: (text: string) => void;
  escHint: string | null;
  onEscStop: () => void;
}) {
  const [value, setValue] = useState("");
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
    onSend(text);
    setValue("");
    setMenuIndex(0);
  };

  return (
    <div className="relative flex w-full shrink-0 flex-col items-center justify-center p-4">
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
        className="flex w-full flex-col gap-2 overflow-hidden rounded-[10px] border-[0.5px] bg-white p-3"
        style={{ borderColor: STROKE_WEAK }}
      >
        <div className="relative flex h-10 w-full items-start px-1">
          {/* The affordance appears only while Esc would do something —
              no hint, no surprise kill. */}
          {escHint != null && value.length === 0 ? (
            <span
              className="aw-attr-in pointer-events-none absolute right-1 top-0 flex h-5 items-center gap-1.5 text-[11px] leading-4"
              style={{ color: "#a8a29e" }}
            >
              <span className="flex h-4 items-center rounded-[4px] border-[0.5px] border-[#e7e5e4] bg-[#fafaf9] px-1 text-[10px] font-medium text-[#78716c]">
                esc
              </span>
              {escHint}
            </span>
          ) : null}
          <input
            ref={inputRef}
            type="text"
            value={value}
            placeholder="Send a message in #design"
            onChange={(event) => {
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
              // Esc precedence: closing the mention menu wins above;
              // from an empty composer it cancels your latest send's runs.
              if (event.key === "Escape" && value.length === 0 && escHint != null) {
                onEscStop();
                return;
              }
              if (event.key === "Enter") send();
            }}
            className="w-full bg-transparent text-[14px] leading-5 outline-none placeholder:text-[#a8a29e]"
            style={{ color: FG_PRIMARY }}
          />
        </div>
        <div className="flex w-full items-center justify-between">
          <span className="flex size-7 items-center justify-center rounded-[6px]">
            <img src={`${A}/icon-paperclip.svg`} alt="" className="size-4" />
          </span>
          <span className="size-7 rounded-[6px]" />
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

export default function AgentInlineTracePage() {
  const [messages, setMessages] = useState<AwMessage[]>(SEED_MESSAGES);
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
  // Trace modal target: a live run id, or "seed" for the canned run.
  const [traceRunId, setTraceRunId] = useState<string | null>(null);
  // Placement audition (header toggle): agent at the end of the text
  // vs the row's right edge.
  const [clusterSide, setClusterSide] = useState<ClusterSide>("inline");
  // Demo pace from the Agents panel — scales the next invocation's
  // scripted duration.
  const [pace, setPace] = useState(1);
  // The message id of YOUR latest agent-spawning send — the only runs
  // the composer's Esc can reach.
  const [lastOwnSendId, setLastOwnSendId] = useState<string | null>(null);
  // One source of truth for proactivity — chat commands, notice CTAs,
  // and the settings panel all read and write this map.
  const [proactivityLevels, setProactivityLevels] = useState<Record<string, ProactivityLevel>>(
    () => Object.fromEntries(AGENTS.map((agent) => [agent.id, "medium" as ProactivityLevel])),
  );
  const [agentSettingsOpen, setAgentSettingsOpen] = useState(false);
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
    setMessages((prev) => [
      ...prev,
      {
        id,
        authorName: run.agent.name,
        avatar: { agent: run.agent },
        time: nowLabel(),
        paragraphs: run.agent.answer.map((paragraph) => [{ text: paragraph }]),
        workedForMs: (run.endedAt ?? Date.now()) - run.startedAt,
        runId: run.id,
      },
    ]);
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
  const cornerRuns = engine.visibleRuns.filter((run) => !viz.on.has(anchorFor(run)));

  // Clicking a line face SUMMONS its run bottom-right even though the
  // ask is in view (the rail-only roster wouldn't carry it): the agent
  // docks into the corner stack AND rides at the top of the panel —
  // the click's answer appears where the click promised — until the
  // panel closes.
  const [flyoutFocusId, setFlyoutFocusId] = useState<string | null>(null);
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

  const handleSend = (text: string) => {
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

    setMessages((prev) => [
      ...prev,
      {
        id,
        authorName: "Oli",
        avatar: { photo: OLI_PHOTO },
        time: nowLabel(),
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
    setLastOwnSendId(id);
  };

  // Esc reaches only the runs your latest send spawned, while they live.
  const escRuns = engine.runs.filter(
    (run) => run.messageId === lastOwnSendId && run.status === "working" && !run.removed
  );
  const escHint =
    escRuns.length === 0
      ? null
      : escRuns.length === 1
        ? `to stop ${escRuns[0].agent.name}`
        : `to stop ${escRuns.length} agents`;

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
        authorName: agentName,
        avatar: "silhouette" as const,
        time: nowLabel(),
        paragraphs: [],
        system: true,
        proactivity: { actor: "Oli", agentName, level },
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
    traceRunId != null && traceRunId !== "seed"
      ? engine.runs.find((run) => run.id === traceRunId)
      : undefined;
  const trace: TraceView | null =
    traceRunId === "seed"
      ? SEED_TRACE
      : liveTraceRun != null
        ? traceViewFromRun(liveTraceRun)
        : null;

  return (
    <div
      className="aw-page flex h-dvh w-screen flex-col overflow-hidden"
      style={{ background: BG_TERTIARY, color: FG_PRIMARY }}
    >
      <Titlebar />
      <div className="relative flex min-h-0 flex-1">
        <GlobalNav />
        {/* Sidebar channel wash benched — pass the working channel's
            label to revive the cross-channel tell. */}
        <LocalNav thinkingChannel={null} />
        {/* 6px gutter between the two cards — the page bg reads as the divider. */}
        <main className="relative ml-1.5 flex min-w-0 flex-1 flex-col overflow-clip rounded-tl-[6px] bg-white shadow-[0px_0px_0.5px_0.5px_rgba(15,13,13,0.08),0px_1px_2px_0px_rgba(15,13,13,0.05)]">
          <PageHeader
            clusterSide={clusterSide}
            onClusterSideChange={setClusterSide}
            onOpenAgentSettings={() => setAgentSettingsOpen(true)}
          />
          {/* mt-auto spacer (not justify-end) pins messages to the bottom:
              justify-end makes top overflow unscrollable in flex containers. */}
          <div
            ref={messagesRef}
            onScroll={handleTranscriptScroll}
            className="aw-messages flex min-h-0 flex-1 flex-col overflow-y-auto pr-4"
          >
            <div aria-hidden className="mt-auto shrink-0" />
            {messages.map((message) => (
              <div key={message.id} className="flex w-full flex-col">
                <MessageRow
                  message={message}
                  runs={engine.runs.filter((run) => run.messageId === message.id)}
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
              </div>
            ))}
          </div>
          <Composer
            onSend={handleSend}
            escHint={escHint}
            onEscStop={() => escRuns.forEach((run) => engine.stop(run.id))}
          />

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

          {agentSettingsOpen ? (
            <AgentSettingsModal
              levels={proactivityLevels}
              pace={pace}
              onPaceChange={setPace}
              onPick={(agent, level) => handleSetProactivity(agent.name, level)}
              onClose={() => setAgentSettingsOpen(false)}
            />
          ) : null}

          {rosterCount > 0 ? (
            <CornerStack
              runs={railRuns}
              resting={flyoutState !== "closed"}
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
        </main>
      </div>

      {trace != null ? <TraceModal trace={trace} onClose={() => setTraceRunId(null)} /> : null}
    </div>
  );
}
