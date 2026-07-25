"use client";

// /channel — the chat UI from /multi-select (Figma node 17167-17686,
// "Channel info: attachments version 20") with the multi-select interaction
// re-enabled and "Send to Agent" wired to real agentation: each send spawns
// an agent that works, finishes, or fails. Agents surface in the page header
// as a crescent-ringed avatar stack (status ring on the exposed side, the
// white header as the cutout stroke); clicking it opens a per-agent roster
// with retry on failures.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import "../multi-select/multi-select.css";
import "./channel.css";
import {
  MESSAGES,
  SIDEBAR,
  SIDEBAR_FLAT,
  type DemoAuthor,
  type DemoMessage,
  type SidebarEntry,
} from "../multi-select/data";
import {
  MultiSelectBar,
  useMultiSelect,
  type MultiSelectVariant,
} from "../multi-select/multi-select";

// Assets live in the shared /multi-select public folder.
const A = "/multi-select";

const FG_PRIMARY = "#1a1817";
const FG_SECONDARY = "#58524e";
const FG_TERTIARY = "#78716c";
const STROKE_WEAK = "#f0efee";
const BG_TERTIARY = "#f5f5f4";
const BRAND = "#2563eb";
const GREEN = "#16a34a";
const RED = "#dc2626";
const AMBER = "#f59e0b";

// The current user, for messages sent from the composer.
const YOU: DemoAuthor = {
  id: "you",
  name: "You",
  avatar: `${A}/rail-avatar-photo.png`,
};

/* ------------------------------- agents ------------------------------- */

type AgentStatus = "working" | "done" | "failed";

type ChannelAgent = {
  id: number;
  name: string;
  face: string;
  count: number;
  status: AgentStatus;
  progress: number;
  // What the agent is doing right now — the roster's status line, and the
  // seed of the result message it posts on completion.
  task: string;
  // Message the agent is anchored under. While that message's inline row is
  // on screen the agent lives there; scrolled away, it demotes to the
  // corner stack. null = corner only.
  anchorId: string | null;
  // Progress point where this run dies; null = this run succeeds.
  failAt: number | null;
  // Progress speed multiplier (default 1). Seeded demo agents run slow so
  // the "working" state actually sticks around.
  pace?: number;
};

const AGENT_NAMES = ["Yumi", "Scout", "Indexer", "Crawler", "Drafter", "Triage"];
const AGENT_FACES = ["#1a1817", "#2563eb", "#78716c", "#a8a29e"];
const AGENT_TASKS = [
  "Summarizing the selection",
  "Collecting attachments",
  "Drafting a reply",
  "Extracting action items",
  "Indexing links",
];

// Seeded demo agents anchor under a message near the bottom of the
// transcript, so the inline tier is visible on load and demotes to the
// corner when you scroll up. Ids sit above the spawn counter so they never
// collide with spawned agents.
const SEED_ANCHOR = MESSAGES[MESSAGES.length - 2].id;
const SEED_AGENTS: ChannelAgent[] = [
  { id: 101, name: "Yumi", face: "#1a1817", count: 3, status: "done", progress: 100, task: "Summarized the thread", anchorId: null, failAt: null },
  { id: 102, name: "Indexer", face: "#78716c", count: 1, status: "failed", progress: 54, task: "Collecting link previews", anchorId: SEED_ANCHOR, failAt: 54 },
  { id: 103, name: "Scout", face: "#2563eb", count: 2, status: "working", progress: 12, task: "Drafting a recap", anchorId: SEED_ANCHOR, failAt: null, pace: 0.12 },
];

const TICK_MS = 420;

function fmtTime(): string {
  return new Date()
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .toLowerCase();
}

// Sparkle mark shared by every agent face.
function AgentSparkle({ cx, cy, scale }: { cx: number; cy: number; scale: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(-12 -12)`}>
      <path
        d="M12 6.5l1.3 4.2 4.2 1.3-4.2 1.3L12 17.5l-1.3-4.2-4.2-1.3 4.2-1.3z"
        fill="#fff"
      />
    </g>
  );
}

// Stack avatar. Ring grammar in status colors (independent of the pfp):
// orbiting amber dashes = working, sealed solid green = done, solid red =
// failed. White gap stroke outside so overlap notches cleanly. Drawn on a
// 24 viewBox; `size` scales it.
function StackAvatar({
  agent,
  size = 24,
}: {
  agent: ChannelAgent;
  size?: number;
}) {
  const ring =
    agent.status === "working" ? (
      <circle
        className="ch-spin"
        cx="12"
        cy="12"
        r="9.5"
        fill="none"
        stroke={AMBER}
        strokeWidth="1.5"
        pathLength="100"
        strokeDasharray="4.33 4"
        strokeLinecap="round"
      />
    ) : (
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill="none"
        stroke={agent.status === "failed" ? RED : GREEN}
        strokeWidth="1.5"
      />
    );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="white" />
      {ring}
      <circle cx="12" cy="12" r="7" fill={agent.face} />
      <AgentSparkle cx={12} cy={12} scale={0.58} />
    </svg>
  );
}

function rosterSummary(agents: ChannelAgent[]): string {
  const done = agents.filter((a) => a.status === "done").length;
  const failed = agents.filter((a) => a.status === "failed").length;
  if (done === agents.length) return "All done";
  if (done + failed === agents.length && failed > 0)
    return `${done} of ${agents.length} done`;
  return `${done} of ${agents.length} done`;
}

// Short status line for the inline (above-composer) presence: working wins,
// then failures, else everything finished.
function presenceLabel(agents: ChannelAgent[]): string {
  const working = agents.filter((a) => a.status === "working").length;
  const failed = agents.filter((a) => a.status === "failed").length;
  if (working > 0)
    return working === 1 ? "1 agent working…" : `${working} agents working…`;
  if (failed > 0)
    return failed === 1 ? "1 agent failed" : `${failed} agents failed`;
  return "All done";
}

// Agent presence: a bare ringed avatar stack + roster popover. No pill — the
// surface behind it (the composer area / header) is the cutout stroke, per
// the design exploration. `agents` is what the stack shows (corner-demoted
// only); `roster` is the full list the popover reports on. `placement` flips
// the roster upward when the stack sits near the bottom of the screen.
function AgentPresence({
  agents,
  roster,
  open,
  onToggle,
  onClose,
  onRetry,
  onStop,
  placement = "down",
  showLabel = false,
}: {
  agents: ChannelAgent[];
  roster?: ChannelAgent[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onRetry: (id: number) => void;
  onStop?: (id: number) => void;
  placement?: "down" | "up";
  showLabel?: boolean;
}) {
  const rosterAgents = roster ?? agents;
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, onClose]);

  if (agents.length === 0) return null;

  const working = rosterAgents.some((a) => a.status === "working");
  const failed = rosterAgents.some((a) => a.status === "failed");
  const labelColor = working ? FG_SECONDARY : failed ? RED : GREEN;

  return (
    <span ref={rootRef} className="relative flex items-center">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${agents.length} agent${agents.length === 1 ? "" : "s"}`}
        onClick={onToggle}
        className="flex items-center gap-2 rounded-full"
      >
        {showLabel ? (
          <span className="text-[12px] leading-4" style={{ color: labelColor }}>
            {presenceLabel(agents)}
          </span>
        ) : null}
        <span className="flex items-center">
          {agents.map((agent, index) => (
            <span
              key={agent.id}
              style={
                {
                  marginLeft: index > 0 ? -10 : 0,
                  zIndex: index,
                  "--pop-delay": `${index * 140}ms`,
                } as React.CSSProperties
              }
              className="ch-agent-wrap relative flex"
            >
              {/* Materialize: scattered pixels converge, then the avatar
                  pops in (ch-agent-pop) with a spring overshoot. */}
              <span className="ch-agent-pixels" aria-hidden />
              <span className="ch-agent-pop relative flex">
                <StackAvatar agent={agent} size={32} />
              </span>
            </span>
          ))}
        </span>
      </button>

      {open ? (
        <div
          className={`absolute right-0 z-40 w-[264px] rounded-[10px] bg-white p-1 shadow-[0px_2px_12px_0px_rgba(16,16,16,0.04),0px_16px_24px_-12px_rgba(16,16,16,0.08),0px_0px_0.5px_0.75px_rgba(16,16,16,0.06)] ${
            placement === "up"
              ? "ch-pop-enter-up bottom-full mb-1.5"
              : "ch-pop-enter top-full mt-1.5"
          }`}
        >
          <div
            className="mb-0.5 flex items-center justify-between border-b-[0.5px] px-2 py-1.5"
            style={{ borderColor: STROKE_WEAK }}
          >
            <span
              className="text-[12px] font-medium leading-4"
              style={{ color: FG_PRIMARY }}
            >
              {working ? "Working.." : "Agents"}
            </span>
            <span
              className="text-[12px] leading-4 tabular-nums"
              style={{ color: FG_TERTIARY }}
            >
              {rosterSummary(rosterAgents)}
            </span>
          </div>
          {rosterAgents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-2 rounded-[6px] px-2 py-1.5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="shrink-0">
                <circle cx="12" cy="12" r="12" fill={agent.face} />
                <AgentSparkle cx={12} cy={12} scale={0.9} />
              </svg>
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[12px] font-medium leading-4"
                  style={{ color: FG_PRIMARY }}
                >
                  {agent.name}
                </span>
                <span
                  className="block truncate text-[11px] leading-[14px]"
                  style={{ color: FG_TERTIARY }}
                >
                  {agent.task} · {agent.count} msg{agent.count === 1 ? "" : "s"}
                </span>
              </span>
              {agent.status === "done" ? (
                <span className="text-[11px] font-medium leading-[14px]" style={{ color: GREEN }}>
                  Done
                </span>
              ) : agent.status === "failed" ? (
                <button
                  type="button"
                  onClick={() => onRetry(agent.id)}
                  className="text-[11px] font-medium leading-[14px] underline underline-offset-2"
                  style={{ color: RED }}
                >
                  Failed · Retry
                </button>
              ) : (
                <span className="flex items-center gap-2">
                  <span
                    className="text-[11px] leading-[14px] tabular-nums"
                    style={{ color: AMBER }}
                  >
                    {Math.min(99, Math.round(agent.progress))}%
                  </span>
                  {onStop != null ? (
                    <button
                      type="button"
                      onClick={() => onStop(agent.id)}
                      className="text-[11px] font-medium leading-[14px] underline underline-offset-2"
                      style={{ color: FG_SECONDARY }}
                    >
                      Stop
                    </button>
                  ) : null}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </span>
  );
}

// Inline presence tier: a thread-footer-style row under the message that
// spawned the agents. This is the loud representation — while it's on
// screen the corner stays empty (one fact, one place). When it scrolls out
// of view (300ms hysteresis so grazing the edge doesn't thrash) the same
// agents demote to the corner stack; scrolling back promotes them
// immediately. Typing dots animate for the first 10s, then settle — the
// chatter stops but the presence stays.
function AgentInlineRow({
  anchorId,
  agents,
  onVisibility,
  onRetry,
}: {
  anchorId: string;
  agents: ChannelAgent[];
  onVisibility: (anchorId: string, visible: boolean) => void;
  onRetry: (id: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const demoteTimerRef = useRef(0);
  const [calm, setCalm] = useState(false);

  const workingCount = agents.filter((a) => a.status === "working").length;
  const failedAgents = agents.filter((a) => a.status === "failed");

  useEffect(() => {
    setCalm(false);
    const timer = window.setTimeout(() => setCalm(true), 10_000);
    return () => window.clearTimeout(timer);
  }, [workingCount]);

  useEffect(() => {
    const el = rootRef.current;
    if (el == null) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(demoteTimerRef.current);
        if (entry.isIntersecting) {
          onVisibility(anchorId, true);
        } else {
          demoteTimerRef.current = window.setTimeout(
            () => onVisibility(anchorId, false),
            300
          );
        }
      },
      { root: el.closest(".ch-messages"), threshold: 0.5 }
    );
    observer.observe(el);
    return () => {
      window.clearTimeout(demoteTimerRef.current);
      observer.disconnect();
      onVisibility(anchorId, false);
    };
  }, [anchorId, onVisibility]);

  return (
    <div
      ref={rootRef}
      className="relative flex w-full items-center gap-2.5 px-4 py-1.5"
    >
      <span className="h-3 w-6 shrink-0" />
      <span className="flex items-center gap-2">
        <span className="flex items-center">
          {agents.map((agent, index) => (
            <span
              key={agent.id}
              className="flex"
              style={{ marginLeft: index > 0 ? -6 : 0, zIndex: index }}
            >
              <StackAvatar agent={agent} size={20} />
            </span>
          ))}
        </span>
        <span className="flex items-baseline gap-1.5 whitespace-nowrap">
          {workingCount > 0 ? (
            <span
              className="text-[12px] font-medium leading-4"
              style={{ color: BRAND }}
            >
              {workingCount === 1
                ? "Agent working"
                : `${workingCount} agents working`}
              <span className={`ch-dots${calm ? " is-calm" : ""}`}>
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </span>
          ) : null}
          {failedAgents.length > 0 ? (
            <button
              type="button"
              onClick={() => failedAgents.forEach((a) => onRetry(a.id))}
              className="text-[12px] font-medium leading-4"
              style={{ color: RED }}
            >
              {failedAgents.length === 1
                ? "1 failed"
                : `${failedAgents.length} failed`}
              {" · "}
              <span className="underline underline-offset-2">Retry</span>
            </button>
          ) : null}
          <span
            className="text-[11px] leading-[14px]"
            style={{ color: FG_TERTIARY }}
          >
            started just now
          </span>
        </span>
      </span>
    </div>
  );
}

/* ---------------------------- static chrome ---------------------------- */

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

function PageHeader() {
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

function MessageRow({
  message,
  mode,
  selected,
  peeked,
  washDelay,
}: {
  message: DemoMessage;
  mode: boolean;
  selected: boolean;
  peeked: boolean;
  washDelay: number;
}) {
  return (
    <div
      data-msg-id={message.id}
      className="relative flex w-full items-start gap-2.5 px-4 pb-1.5 pt-2"
      style={{ cursor: mode && selected ? "pointer" : undefined }}
    >
      {/* Notion-style block wash over the whole message. Always mounted so
          the fade (and its stagger) runs identically in and out. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 inset-y-0.5 z-[1] rounded-md"
        style={{
          background: peeked
            ? "rgba(37,99,235,0.22)"
            : "rgba(37,99,235,0.14)",
          opacity: mode && selected ? 1 : 0,
          transition: `opacity 350ms cubic-bezier(0.2,0,0,1) ${washDelay}ms, background-color 150ms cubic-bezier(0.2,0,0,1)`,
        }}
      />
      {message.threadFooter ? (
        <img
          src={`${A}/thread-spine.svg`}
          alt=""
          className="absolute bottom-[-14px] left-7 h-[60px] w-3"
        />
      ) : null}
      {/* Agent-authored messages carry their face color in author.avatar. */}
      {message.author.avatar.startsWith("#") ? (
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          className="shrink-0 rounded-full"
          aria-hidden
        >
          <circle cx="12" cy="12" r="12" fill={message.author.avatar} />
          <AgentSparkle cx={12} cy={12} scale={0.9} />
        </svg>
      ) : (
        <Silhouette size={24} />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex h-3 items-center gap-1.5 whitespace-nowrap">
          <span className="text-[14px] font-medium leading-5" style={{ color: FG_PRIMARY }}>
            {message.author.name}
          </span>
          <span className="text-[12px] leading-4" style={{ color: FG_TERTIARY }}>
            {message.time}
          </span>
        </div>
        <div
          data-msg-text
          className="break-words text-[14px] leading-5"
          style={{ color: FG_PRIMARY }}
        >
          {message.body.map((paragraph, pIndex) => (
            <p key={pIndex} className={pIndex > 0 ? "mt-5" : undefined}>
              {paragraph.map((segment, sIndex) =>
                segment.link ? (
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
      </div>
    </div>
  );
}

function ThreadFooter({ message }: { message: DemoMessage }) {
  const footer = message.threadFooter!;
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

function SendGlyph({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 13V3.5M8 3.5L4.5 7M8 3.5L11.5 7"
        stroke={active ? "#fff" : "#a8a29e"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const canSend = text.trim().length > 0;

  const submit = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div
      className="flex w-full shrink-0 flex-col items-center justify-center p-4"
      data-composer-region
    >
      <div
        className="flex w-full flex-col gap-2 overflow-hidden rounded-[10px] border-[0.5px] bg-white p-3"
        style={{ borderColor: STROKE_WEAK }}
      >
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Send a message in #design"
          aria-label="Message #design"
          className="h-10 w-full resize-none bg-transparent px-1 text-[14px] leading-5 outline-none placeholder:text-[#a8a29e]"
          style={{ color: FG_PRIMARY }}
        />
        <div className="flex w-full items-center justify-between">
          <span className="flex size-7 items-center justify-center rounded-[6px]">
            <img src={`${A}/icon-paperclip.svg`} alt="" className="size-4" />
          </span>
          <button
            type="button"
            aria-label="Send message"
            onClick={submit}
            disabled={!canSend}
            className="flex size-7 items-center justify-center rounded-[6px] transition-colors"
            style={{
              background: canSend ? BRAND : BG_TERTIARY,
              cursor: canSend ? "pointer" : "default",
            }}
          >
            <SendGlyph active={canSend} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChannelPage() {
  const [messages, setMessages] = useState<DemoMessage[]>(MESSAGES);
  const { state, selectedMessages, clearAll, toggleRow, setPeekId } =
    useMultiSelect(messages);
  // The A/B toggle is gone — the selection bar always uses the popout treatment.
  const variant: MultiSelectVariant = "popout";
  const [agents, setAgents] = useState<ChannelAgent[]>(SEED_AGENTS);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [stubAction, setStubAction] = useState<{
    label: string;
    count: number;
  } | null>(null);
  // Anchors whose inline rows are currently on screen — their agents render
  // inline; everyone else demotes to the corner stack.
  const [visibleAnchors, setVisibleAnchors] = useState<ReadonlySet<string>>(
    () => new Set([SEED_ANCHOR])
  );
  const nextAgentIdRef = useRef(1);
  const nextMessageIdRef = useRef(1);
  // Done agents whose result message has already been posted (seeded done
  // agents predate the transcript, so they never post).
  const postedRef = useRef<Set<number>>(
    new Set(SEED_AGENTS.filter((a) => a.status === "done").map((a) => a.id))
  );
  const forceScrollRef = useRef(false);
  const firstScrollRef = useRef(true);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Open at the latest message. After that, only re-pin to the bottom when
  // the reader is already near it (or just sent something themselves) — an
  // agent posting its result must not yank someone reading history.
  useLayoutEffect(() => {
    const list = messagesRef.current;
    if (list == null) return;
    const nearBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight < 200;
    if (firstScrollRef.current || forceScrollRef.current || nearBottom) {
      list.scrollTop = list.scrollHeight;
    }
    firstScrollRef.current = false;
    forceScrollRef.current = false;
  }, [messages.length]);

  const reportAnchorVisible = useCallback(
    (anchorId: string, visible: boolean) => {
      setVisibleAnchors((prev) => {
        if (prev.has(anchorId) === visible) return prev;
        const next = new Set(prev);
        if (visible) next.add(anchorId);
        else next.delete(anchorId);
        return next;
      });
    },
    []
  );

  // Composer send: append the typed text as a message from the current user.
  const sendMessage = useCallback((text: string) => {
    forceScrollRef.current = true;
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${nextMessageIdRef.current++}`,
        author: YOU,
        time: fmtTime(),
        body: [[{ text }]],
      },
    ]);
  }, []);

  const spawnAgent = useCallback(
    (count: number) => {
      const id = nextAgentIdRef.current++;
      // Anchor under the bottom-most selected message, so the inline row
      // appears exactly where the work was handed off.
      const selected = new Set(state.selectedIds);
      let anchorId: string | null = null;
      for (const message of messages) {
        if (selected.has(message.id)) anchorId = message.id;
      }
      setAgents((prev) => [
        ...prev,
        {
          id,
          name: AGENT_NAMES[(id - 1) % AGENT_NAMES.length],
          face: AGENT_FACES[(id - 1) % AGENT_FACES.length],
          count,
          status: "working",
          progress: 0,
          task: AGENT_TASKS[(id - 1) % AGENT_TASKS.length],
          anchorId,
          // ~30% of runs die partway; retry always succeeds.
          failAt: Math.random() < 0.3 ? 35 + Math.random() * 50 : null,
        },
      ]);
      clearAll();
    },
    [clearAll, messages, state.selectedIds]
  );

  const retryAgent = useCallback((id: number) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === id
          ? { ...agent, status: "working", progress: 0, failAt: null }
          : agent
      )
    );
  }, []);

  // Stop = cancel: the agent's presence retires everywhere.
  const stopAgent = useCallback((id: number) => {
    setAgents((prev) => prev.filter((agent) => agent.id !== id));
  }, []);

  // Completion payoff: a freshly-done agent posts its result into the
  // transcript as a real message (its ring seals in whichever tier it's in).
  useEffect(() => {
    const fresh = agents.filter(
      (agent) => agent.status === "done" && !postedRef.current.has(agent.id)
    );
    if (fresh.length === 0) return;
    fresh.forEach((agent) => postedRef.current.add(agent.id));
    setMessages((prev) => [
      ...prev,
      ...fresh.map((agent) => ({
        id: `agent-${agent.id}-result`,
        author: { id: `agent-${agent.id}`, name: agent.name, avatar: agent.face },
        time: fmtTime(),
        body: [
          [
            {
              text: `Finished: ${agent.task.toLowerCase()} across ${agent.count} message${agent.count === 1 ? "" : "s"}. Summary attached.`,
            },
          ],
        ],
      })),
    ]);
  }, [agents]);

  // Simulation tick: working agents crawl toward done (or their failure
  // point). The interval only runs while something is actually working.
  const anyWorking = agents.some((agent) => agent.status === "working");
  useEffect(() => {
    if (!anyWorking) return;
    const timer = window.setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.status !== "working") return agent;
          const progress =
            agent.progress + (3 + Math.random() * 6) * (agent.pace ?? 1);
          if (agent.failAt != null && progress >= agent.failAt) {
            return { ...agent, status: "failed", progress: agent.failAt };
          }
          if (progress >= 100) {
            return { ...agent, status: "done", progress: 100 };
          }
          return { ...agent, progress };
        })
      );
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [anyWorking]);

  const mode = state.phase === "active" && !state.exiting;

  return (
    <div
      className="flex h-dvh w-screen flex-col overflow-hidden"
      style={{ background: BG_TERTIARY, color: FG_PRIMARY }}
    >
      <Titlebar />
      <div className="relative flex min-h-0 flex-1">
        <GlobalNav />
        <LocalNav />
        {/* 6px gutter between the two cards — the page bg reads as the divider. */}
        <main className="relative ml-1.5 flex min-w-0 flex-1 flex-col overflow-clip rounded-tl-[6px] bg-white shadow-[0px_0px_0.5px_0.5px_rgba(15,13,13,0.08),0px_1px_2px_0px_rgba(15,13,13,0.05)]">
          <PageHeader />
          {/* mt-auto spacer (not justify-end) pins messages to the bottom:
              justify-end makes top overflow unscrollable in flex containers.
              ms-messages: the multi-select hook targets this class for edge
              auto-scroll and drag styling. */}
          <div
            ref={messagesRef}
            className="ch-messages ms-messages flex min-h-0 flex-1 flex-col overflow-y-auto pr-4"
          >
            <div aria-hidden className="mt-auto shrink-0" />
            {messages.map((message) => (
              <div key={message.id} className="flex w-full flex-col">
                <MessageRow
                  message={message}
                  mode={mode}
                  selected={state.selectedIds.includes(message.id)}
                  peeked={state.peekId === message.id}
                  // Cascade in first→last; on clear-all, cascade out in
                  // reverse (last selected releases first).
                  washDelay={(() => {
                    const index = state.selectedIds.indexOf(message.id);
                    if (index < 0) return 0;
                    return (
                      (state.exiting
                        ? state.selectedIds.length - 1 - index
                        : index) * 15
                    );
                  })()}
                />
                {message.threadFooter ? <ThreadFooter message={message} /> : null}
                {(() => {
                  const anchored = agents.filter(
                    (agent) =>
                      agent.anchorId === message.id && agent.status !== "done"
                  );
                  return anchored.length > 0 ? (
                    <AgentInlineRow
                      anchorId={message.id}
                      agents={anchored}
                      onVisibility={reportAnchorVisible}
                      onRetry={retryAgent}
                    />
                  ) : null;
                })()}
              </div>
            ))}
          </div>
          {/* Corner tier, just above the composer: done agents (sealed
              receipts) plus any active agent whose inline row scrolled out
              of view. The roster popover reports on everyone. */}
          <div className="relative shrink-0">
            {(() => {
              const cornerAgents = agents.filter(
                (agent) =>
                  agent.status === "done" ||
                  agent.anchorId == null ||
                  !visibleAnchors.has(agent.anchorId)
              );
              return cornerAgents.length > 0 ? (
                <div className="absolute bottom-full right-4 z-30 -mb-2 flex justify-end">
                  <AgentPresence
                    agents={cornerAgents}
                    roster={agents}
                    open={rosterOpen}
                    onToggle={() => setRosterOpen((open) => !open)}
                    onClose={() => setRosterOpen(false)}
                    onRetry={retryAgent}
                    onStop={stopAgent}
                    placement="up"
                  />
                </div>
              ) : null;
            })()}
            <Composer onSend={sendMessage} />
          </div>
          {state.phase !== "idle" ? (
            // Keyed by variant so switching mid-selection resets menu state.
            <MultiSelectBar
              key={variant}
              state={state}
              variant={variant}
              selectedMessages={selectedMessages}
              onClear={clearAll}
              onRemove={toggleRow}
              onPeek={setPeekId}
              onForward={(count) => setStubAction({ label: "Forward", count })}
              onSendToAgent={spawnAgent}
            />
          ) : null}
        </main>
      </div>

      {stubAction != null ? (
        // data-ms-bar: clicks in the dialog must not clear the selection.
        <div
          data-ms-bar
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        >
          <div className="flex flex-col items-start gap-3 rounded-[10px] bg-[#1a1817] p-5 text-white shadow-[0px_16px_24px_-12px_rgba(16,16,16,0.4)]">
            <span className="text-[14px] font-medium leading-5">
              {`${stubAction.label}: ${stubAction.count} message${stubAction.count === 1 ? "" : "s"}`}
            </span>
            <span className="text-[12px] leading-4 text-white/60">
              This action is stubbed in the prototype.
            </span>
            <button
              type="button"
              onClick={() => setStubAction(null)}
              className="rounded-md bg-white/10 px-3 py-1.5 text-[14px] leading-5 transition-colors hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
