"use client";

// /agent-working — the messaging shell from /multi-select with the
// agent-working interaction from the July Sprints spec (Figma nodes
// 17658-1346, 17700-19103, 17789-27302) layered on:
//
//   @mention an agent in the composer (type "@" for the picker) and a run
//   spawns — inline session chip under the message, ringed avatar in the
//   bottom-right corner, dark "Active agents" flyout, and an Agent trace
//   modal. The page loads mid-simulation: three seeded runs are already
//   underway (backdated, so their timers are accurate), one of which fails
//   live. Yumi fails her first run so rerun stays demoable.
//
// Shell chrome (rail, sidebar, header, transcript) is unchanged from the
// baseplate; transcript/sidebar data and assets are shared with
// /multi-select rather than duplicated.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./agent-working.css";
import { MESSAGES, SIDEBAR, SIDEBAR_FLAT, type SidebarEntry } from "../multi-select/data";
import {
  AGENTS,
  AgentFace,
  AgentFlyout,
  CornerStack,
  JumpToLatestPill,
  SessionChips,
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
  // Agent answers carry the "Worked for Xm Ys ›" footer → trace modal.
  workedForMs?: number;
  runId?: string;
};

const TADAO = AGENTS[0];
const ANDO = AGENTS.find((agent) => agent.id === "ando")!;
const YUMI = AGENTS.find((agent) => agent.id === "yumi")!;
// avatar-oliver.png exported blank from Figma (the mock rows used
// silhouettes) — sb-photo-4 is the real face that matches the spec's Oli.
const OLI_PHOTO = `${A}/sb-photo-4.png`;

// Load-time simulation: three runs already underway when the page opens.
// startedAgoMs backdates each timer so elapsed reads true working time;
// durations are absolute, so Yumi fails ~7s after load and the others
// complete while you watch (or get stopped first).
const SEED_RUNS: {
  messageId: string;
  agent: AgentDef;
  prompt: string;
  override: { durationMs: number; outcome: "done" | "failed"; startedAgoMs: number };
}[] = [
  {
    messageId: "aw-live-ando",
    agent: ANDO,
    prompt: "can you summarize this thread for standup?",
    override: { durationMs: 75000, outcome: "done", startedAgoMs: 42000 },
  },
  {
    messageId: "aw-live-yumi",
    agent: YUMI,
    prompt: "pull the current token values from the design file",
    override: { durationMs: 28000, outcome: "failed", startedAgoMs: 21000 },
  },
  {
    messageId: "aw-live-tadao",
    agent: TADAO,
    prompt: "what's the weather looking like this weekend?",
    override: { durationMs: 55000, outcome: "done", startedAgoMs: 8000 },
  },
];

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
  // Invoking messages for the load-time simulation runs.
  {
    id: "aw-live-ando",
    authorName: "Oli",
    avatar: { photo: OLI_PHOTO },
    time: "5:37 pm",
    paragraphs: [
      [
        { text: "@Ando", mention: true },
        { text: " can you summarize this thread for standup?" },
      ],
    ],
  },
  {
    id: "aw-live-yumi",
    authorName: "Oli",
    avatar: { photo: OLI_PHOTO },
    time: "5:38 pm",
    paragraphs: [
      [
        { text: "@Yumi", mention: true },
        { text: " pull the current token values from the design file" },
      ],
    ],
  },
  {
    id: "aw-live-tadao",
    authorName: "Oli",
    avatar: { photo: OLI_PHOTO },
    time: "5:38 pm",
    paragraphs: [
      [
        { text: "@Tadao", mention: true },
        { text: " what's the weather looking like this weekend?" },
      ],
    ],
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

function SidebarRowView({ entry }: { entry: SidebarEntry }) {
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
        className={`flex h-8 w-full items-center gap-3 rounded-[6px] py-1.5 ${indentClass}`}
        style={entry.active ? { background: "rgba(16,16,16,0.04)" } : undefined}
      >
        <span className="flex flex-1 items-center gap-2 overflow-hidden">
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
            className="flex size-4 items-center justify-center rounded-xl text-center text-[10px] font-medium leading-[10px] text-white"
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

function LocalNav() {
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
            <SidebarRowView entry={SIDEBAR[0]} />
          </div>
          <div className="flex w-full flex-col gap-0.5">
            {SIDEBAR.slice(1, 4).map((entry, index) => (
              <SidebarRowView key={index} entry={entry} />
            ))}
          </div>
          <div className="flex w-full flex-col gap-0.5">
            {SIDEBAR.slice(4).map((entry, index) => (
              <SidebarRowView key={index} entry={entry} />
            ))}
          </div>
        </div>
        <span className="h-px w-[268px] shrink-0" style={{ background: STROKE_WEAK }} />
        <div className="flex w-full flex-col gap-0.5">
          {SIDEBAR_FLAT.map((entry, index) => (
            <SidebarRowView key={index} entry={entry} />
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

function PageHeader({
  hueMode,
  onHueModeChange,
}: {
  hueMode: "blue" | "portrait";
  onHueModeChange: (mode: "blue" | "portrait") => void;
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
        {/* Working-hue toggle: brand blue vs each agent's portrait tone. */}
        <span
          className="flex items-center rounded-[6px] p-0.5"
          style={{ background: BG_TERTIARY }}
          role="group"
          aria-label="Working indicator color"
        >
          {(["blue", "portrait"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onHueModeChange(mode)}
              className={`rounded-[5px] px-2 py-0.5 text-[11px] leading-4 transition-colors ${
                hueMode === mode ? "bg-white shadow-[0px_0px_0.5px_0.75px_#ebe9e8]" : ""
              }`}
              style={{ color: hueMode === mode ? FG_PRIMARY : FG_TERTIARY }}
            >
              {mode === "blue" ? "Blue" : "Portrait"}
            </button>
          ))}
        </span>
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

function MessageRow({
  message,
  chipRuns,
  flashing,
  onStopRun,
  onOpenTrace,
  onOpenRunTrace,
}: {
  message: AwMessage;
  chipRuns: AgentRun[];
  flashing: boolean;
  onStopRun: (runId: string) => void;
  onOpenTrace: (message: AwMessage) => void;
  onOpenRunTrace: (runId: string) => void;
}) {
  return (
    <div
      data-aw-msg-id={message.id}
      className="relative flex w-full items-start gap-2.5 px-4 pb-1.5 pt-2"
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
          {message.paragraphs.map((paragraph, pIndex) => (
            <p key={pIndex} className={pIndex > 0 ? "mt-5" : undefined}>
              {paragraph.map((segment, sIndex) =>
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
              )}
            </p>
          ))}
        </div>
        {/* Agent answers: "Worked for Xm Ys ›" footer opens the trace. */}
        {message.workedForMs != null ? (
          <button
            type="button"
            onClick={() => onOpenTrace(message)}
            className="group flex w-fit items-center gap-1 text-[12px] leading-4 transition-colors"
            style={{ color: FG_TERTIARY }}
          >
            <span className="group-hover:underline">
              {`Worked for ${formatDuration(message.workedForMs)}`}
            </span>
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
          </button>
        ) : null}
        <SessionChips runs={chipRuns} onStop={onStopRun} onOpenTrace={onOpenRunTrace} />
      </div>
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

function Composer({ onSend }: { onSend: (text: string) => void }) {
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
        <div className="flex h-10 w-full items-start px-1">
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

export default function AgentWorkingPage() {
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
  // Working-comet hue: the page's brand blue, or each agent's portrait
  // tone (root class .aw-hue-portrait flips the CSS for every comet).
  const [hueMode, setHueMode] = useState<"blue" | "portrait">("blue");
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

  // Kick off the load-time simulation, agents arriving one at a time. The
  // ref guards StrictMode's double-invoked dev effects from duplicating
  // spawns; cleanup clears pending arrivals and re-arms the guard.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    const timers = SEED_RUNS.map((seed, index) =>
      window.setTimeout(
        () => engine.spawn(seed.messageId, seed.prompt, [seed.agent], seed.override),
        300 + index * 900
      )
    );
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      seededRef.current = false;
    };
  }, [engine.spawn]);

  // Once every agent is dismissed the flyout has nothing to float over —
  // rendering is gated on rosterCount rather than syncing state in an
  // effect. visibleRuns keeps leaving rows mounted through their exit
  // animation, so the surfaces linger just long enough to play it.
  const rosterCount = engine.visibleRuns.length;

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
    if (mentioned.length > 0) engine.spawn(id, promptOf(text), mentioned);
  };

  // Bubble and row clicks both navigate to the message that invoked the
  // agent (spec annotation on 17744-3264), with a cream flash on arrival.
  const handleJump = (run: AgentRun) => {
    const node = messagesRef.current?.querySelector(
      `[data-aw-msg-id="${run.messageId}"]`
    );
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashId(null);
    // Re-trigger the animation even when flashing the same message twice.
    requestAnimationFrame(() => setFlashId(run.messageId));
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
      className={`aw-page flex h-dvh w-screen flex-col overflow-hidden ${
        hueMode === "portrait" ? "aw-hue-portrait" : ""
      }`}
      style={{ background: BG_TERTIARY, color: FG_PRIMARY }}
    >
      <Titlebar />
      <div className="relative flex min-h-0 flex-1">
        <GlobalNav />
        <LocalNav />
        {/* 6px gutter between the two cards — the page bg reads as the divider. */}
        <main className="relative ml-1.5 flex min-w-0 flex-1 flex-col overflow-clip rounded-tl-[6px] bg-white shadow-[0px_0px_0.5px_0.5px_rgba(15,13,13,0.08),0px_1px_2px_0px_rgba(15,13,13,0.05)]">
          <PageHeader hueMode={hueMode} onHueModeChange={setHueMode} />
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
                  chipRuns={engine.runs.filter((run) => run.messageId === message.id)}
                  flashing={flashId === message.id}
                  onStopRun={engine.stop}
                  onOpenTrace={(target) => setTraceRunId(target.runId ?? null)}
                  onOpenRunTrace={setTraceRunId}
                />
                {message.threadFooter ? <ThreadFooter footer={message.threadFooter} /> : null}
              </div>
            ))}
          </div>
          <Composer onSend={handleSend} />

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
              runs={engine.visibleRuns}
              onHoverChange={handleHoverChange}
              onJumpRun={handleJump}
              onConceal={engine.conceal}
            />
          ) : null}
          {flyoutState !== "closed" && rosterCount > 0 ? (
            <AgentFlyout
              runs={engine.visibleRuns}
              closing={flyoutState === "closing"}
              onClose={() => setFlyoutState("closing")}
              onExited={() => setFlyoutState("closed")}
              onHoverChange={handleHoverChange}
              onStop={engine.stop}
              onRerun={engine.rerun}
              onRemove={engine.remove}
              onJump={handleJump}
              onTrace={(run) => setTraceRunId(run.id)}
              onConceal={engine.conceal}
            />
          ) : null}
        </main>
      </div>

      {trace != null ? <TraceModal trace={trace} onClose={() => setTraceRunId(null)} /> : null}
    </div>
  );
}
