"use client";

/* The compressed agent stack + three flyout iterations.

   Per the flow (Figma 17548-4926): running agents compress into a chip stack
   on the top right of the composer; click/hover flies out a high-level list
   of all YOUR agents in the channel (truncated to 4) — agent activity,
   working state, stop CTA, tool invoked, and a path to the agent trace.

   State language from the flow's chips: dark bubble-smile avatar wrapped in
   an offset ring — amber dashed (working, spins), crimson (failed, persists
   until addressed), green (success, lingers ~2s). */

import {
  formatElapsed,
  splitVisible,
  worstState,
  type AgentState,
  type DerivedAgent,
} from "./agents";

export type FlyoutVariant = "v2" | "rows" | "cards" | "console";

export const VARIANTS: ReadonlyArray<[FlyoutVariant, string]> = [
  ["v2", "v2"],
  ["rows", "Rows"],
  ["cards", "Cards"],
  ["console", "Console"],
];

const RING = {
  working: "#f59e0b",
  failed: "#e11d48",
  awaitingInput: "#2563eb",
  success: "#22c55e",
} as const;

/* ---------- glyphs ---------- */

// The agent avatar from the design: a speech bubble with a tipped half-disc
// smile, drawn inline so it stays crisp at chip sizes.
export function BubbleSmileGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4.1 2.9h7.8a1.7 1.7 0 011.7 1.7v4.6a1.7 1.7 0 01-1.7 1.7H8.1l-2.5 2.7v-2.7H4.1a1.7 1.7 0 01-1.7-1.7V4.6a1.7 1.7 0 011.7-1.7z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path d="M5.3 6.1a2.85 2.85 0 005.5.9z" fill="currentColor" />
    </svg>
  );
}

function StopGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="3.75" y="3.75" width="6.5" height="6.5" rx="1.25" fill="currentColor" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 7.5l2.8 2.8L11 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path
        d="M3.5 3.5l8 8m0-8l-8 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- state badge (chip + ring) ---------- */

export function AgentBadge({
  state,
  size = 24,
  className,
}: {
  state: AgentState;
  size?: number;
  className?: string;
}) {
  // Ring floats 2px off the chip, per the flow's chips.
  const box = size + 10;
  const r = (size + 6) / 2;
  const c = box / 2;
  const circumference = 2 * Math.PI * r;
  // ~14 dashes regardless of size, rounded caps like the mock.
  const dash = circumference / 14;
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center ${className ?? ""}`}
      style={{ width: box, height: box }}
    >
      <svg
        width={box}
        height={box}
        viewBox={`0 0 ${box} ${box}`}
        fill="none"
        aria-hidden
        className={`absolute inset-0 ${
          state === "working"
            ? "af-spin"
            : state === "awaitingInput"
              ? "af-breathe"
              : ""
        }`}
      >
        <circle
          cx={c}
          cy={c}
          r={r}
          stroke={RING[state]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={
            state === "working" ? `${dash * 0.52} ${dash * 0.48}` : undefined
          }
        />
      </svg>
      <span
        className="flex items-center justify-center rounded-full bg-[#292524] text-white"
        style={{ width: size, height: size }}
      >
        <BubbleSmileGlyph size={Math.round(size * 0.58)} />
      </span>
    </span>
  );
}

/* ---------- chip stack (the compressed state) ---------- */

export function AgentChipStack({
  agents,
  active,
  onClick,
}: {
  agents: DerivedAgent[];
  active: boolean;
  onClick: () => void;
}) {
  const { visible, overflow } = splitVisible(agents, 4);
  if (agents.length === 0) return null;
  return (
    <button
      type="button"
      aria-label={`${agents.length} agent${agents.length === 1 ? "" : "s"} in this channel`}
      aria-expanded={active}
      onClick={onClick}
      className={`af-chip-in pointer-events-auto flex items-center rounded-full p-1 pr-2 transition-colors ${
        active ? "bg-[rgba(16,16,16,0.06)]" : "hover:bg-[rgba(16,16,16,0.04)]"
      }`}
    >
      <span className="flex items-center">
        {visible.map((agent, index) => (
          <span
            key={agent.id}
            className={agent.leaving ? "af-chip-out" : "af-chip-in"}
            style={{ marginLeft: index === 0 ? 0 : -9, zIndex: 10 - index }}
          >
            <AgentBadge state={agent.state} size={22} />
          </span>
        ))}
      </span>
      {overflow > 0 ? (
        <span className="ml-0.5 text-[11px] font-medium leading-4 text-[#78716c]">
          +{overflow}
        </span>
      ) : null}
    </button>
  );
}

/* ---------- v2: aggregate chip (one indicator, not a facepile) ----------

   Per Chrome's downloads bubble + iOS Live Activities: past a couple of
   concurrent tasks, itemized rings stop scanning — compress to ONE chip whose
   ring carries the fleet's most attention-worthy state, plus a count badge.
   A green ping rolls off the chip each time an agent finishes. */

export function AggregateChip({
  agents,
  active,
  onClick,
}: {
  agents: DerivedAgent[];
  active: boolean;
  onClick: () => void;
}) {
  if (agents.length === 0) return null;
  const worst = worstState(agents);
  // Keyed remount replays the ping whenever the set of successes changes.
  const successKey = agents
    .filter((a) => a.state === "success" && !a.leaving)
    .map((a) => a.id)
    .join("|");
  return (
    <button
      type="button"
      aria-label={`${agents.length} agent${agents.length === 1 ? "" : "s"} in this channel`}
      aria-expanded={active}
      onClick={onClick}
      className={`af-chip-in pointer-events-auto relative flex items-center justify-center rounded-full p-1.5 transition-colors ${
        active ? "bg-[rgba(16,16,16,0.06)]" : "hover:bg-[rgba(16,16,16,0.04)]"
      }`}
    >
      <span className="relative">
        <AgentBadge state={worst} size={26} />
        {successKey !== "" ? (
          <span key={successKey} className="af-ping absolute inset-0 rounded-full" />
        ) : null}
        {agents.length > 1 ? (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#1a1817] px-[3px] text-[9.5px] font-medium leading-none text-white shadow-[0_0_0_1.5px_white]">
            {agents.length}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/* ---------- shared flyout behavior ---------- */

type FlyoutActions = {
  onStop: (id: string) => void;
  onRetry: (id: string) => void;
  onAnswer: (id: string) => void;
  onStopAll: () => void;
  onOpenTrace: (agent: DerivedAgent) => void;
};

type FlyoutProps = FlyoutActions & {
  agents: DerivedAgent[];
  channel: string;
};

function statusLine(agent: DerivedAgent): string {
  if (agent.state === "failed") return agent.error ?? "Failed";
  if (agent.state === "awaitingInput") return agent.question ?? "Needs your input";
  if (agent.state === "success") return `Done — ${agent.tool.toLowerCase()}`;
  return agent.tool;
}

// One-click answers for an awaitingInput agent (v2 riff: the flyout is not
// just a status list — blocked agents are unblockable in place).
export function AnswerPills({
  agent,
  onAnswer,
  dark,
}: {
  agent: DerivedAgent;
  onAnswer: (id: string) => void;
  dark: boolean;
}) {
  return (
    <span className="flex items-center gap-1">
      {agent.options.slice(0, 2).map((option) => (
        <button
          key={option}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAnswer(agent.id);
          }}
          className={`flex h-6 items-center rounded-md px-2 text-[12px] leading-4 transition-colors ${
            dark
              ? "bg-white/10 hover:bg-white/20"
              : "bg-[#1a1817] text-white hover:opacity-85"
          }`}
        >
          {option}
        </button>
      ))}
    </span>
  );
}

/* ---------- iteration 4 (v2): the synthesis ----------

   Rows' dark language + Cards' step progress + a rollup header (GitHub PR
   checks) + awaitingInput as a first-class state (Linear AIG), answerable
   inline. Attention sort: failed → needs you → working → done. */

const ROLLUP: Array<{ state: AgentState; label: string; plural?: string }> = [
  { state: "failed", label: "failed" },
  { state: "awaitingInput", label: "needs you" },
  { state: "working", label: "working" },
  { state: "success", label: "done" },
];

export function FlyoutV2({
  agents,
  channel,
  onStop,
  onRetry,
  onAnswer,
  onStopAll,
  onOpenTrace,
}: FlyoutProps) {
  const { visible, overflow } = splitVisible(agents, 4);
  const anyWorking = agents.some((a) => a.state === "working");
  const counts = ROLLUP.map((entry) => ({
    ...entry,
    count: agents.filter((a) => a.state === entry.state).length,
  })).filter((entry) => entry.count > 0);
  return (
    <div className="w-[348px] rounded-[10px] bg-[#1a1817] p-1 text-white shadow-[0px_2px_12px_0px_rgba(16,16,16,0.24),0px_16px_24px_-12px_rgba(16,16,16,0.24)]">
      {/* Rollup header: the fleet's state in one line, not a label. */}
      <div className="flex items-center justify-between px-2 pb-1 pt-1.5">
        <span className="flex items-center gap-2.5 text-[11px] leading-4 text-white/70">
          {counts.map((entry) => (
            <span key={entry.state} className="flex items-center gap-1">
              <span
                className={`size-[5px] rounded-full ${
                  entry.state === "working" ? "af-pulse" : ""
                }`}
                style={{ background: RING[entry.state] }}
              />
              {entry.count} {entry.label}
            </span>
          ))}
          <span className="text-white/35">· {channel}</span>
        </span>
        {anyWorking ? (
          <button
            type="button"
            onClick={onStopAll}
            className="rounded px-1 text-[11px] leading-4 text-white/50 transition-colors hover:text-white"
          >
            Stop all
          </button>
        ) : null}
      </div>
      {visible.map((agent) => (
        <div
          key={agent.id}
          onClick={() => onOpenTrace(agent)}
          className={`group/row cursor-pointer rounded-md py-2 pl-1.5 pr-2 transition-colors hover:bg-white/10 ${
            agent.leaving ? "af-leaving" : "af-row-in"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AgentBadge state={agent.state} size={22} />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-1.5">
                <span className="text-[13px] font-medium leading-4">
                  {agent.name}
                </span>
                <span className="truncate text-[11px] leading-4 text-white/40">
                  {agent.task}
                </span>
              </span>
              <span
                className={`mt-0.5 block truncate text-[12px] leading-4 ${
                  agent.state === "failed"
                    ? "text-[#fda4af]"
                    : agent.state === "awaitingInput"
                      ? "text-[#93c5fd]"
                      : agent.state === "success"
                        ? "text-[#86efac]"
                        : "af-dots text-white/60"
                }`}
              >
                {statusLine(agent)}
              </span>
            </span>
            {agent.state === "working" ? (
              <span className="flex shrink-0 items-center gap-1">
                <span className="font-mono text-[11px] tabular-nums leading-4 text-white/40">
                  {formatElapsed(agent.elapsedMs)}
                </span>
                <button
                  type="button"
                  aria-label={`Stop ${agent.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onStop(agent.id);
                  }}
                  className="flex size-6 items-center justify-center rounded-md text-white/60 opacity-0 transition-opacity hover:bg-white/15 hover:text-white group-hover/row:opacity-100"
                >
                  <StopGlyph />
                </button>
              </span>
            ) : agent.state === "awaitingInput" ? (
              <AnswerPills agent={agent} onAnswer={onAnswer} dark />
            ) : agent.state === "failed" ? (
              <span className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRetry(agent.id);
                  }}
                  className="flex h-6 items-center rounded-md bg-white/10 px-2 text-[12px] leading-4 transition-colors hover:bg-white/20"
                >
                  Retry
                </button>
                <button
                  type="button"
                  aria-label={`Dismiss ${agent.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onStop(agent.id);
                  }}
                  className="flex size-6 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <CrossGlyph />
                </button>
              </span>
            ) : (
              <span className="flex size-6 shrink-0 items-center justify-center text-[#4ade80]">
                <CheckGlyph />
              </span>
            )}
          </div>
          {/* Micro step-progress, borrowed from Cards. */}
          <div className="ml-[42px] mt-1.5 flex gap-0.5">
            {agent.steps.map((step, index) => (
              <span
                key={index}
                className={`h-[2px] flex-1 rounded-full ${
                  step.status === "done"
                    ? "bg-white/80"
                    : step.status === "current"
                      ? agent.state === "awaitingInput"
                        ? "bg-[#2563eb]"
                        : "af-pulse bg-[#f59e0b]"
                      : step.status === "errored"
                        ? "bg-[#e11d48]"
                        : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
      ))}
      {overflow > 0 ? (
        <div className="px-2 pb-1 pt-1.5 text-[11px] leading-4 text-white/40">
          +{overflow} more working
        </div>
      ) : null}
    </div>
  );
}

/* ---------- iteration 1: Rows (dark, brand-matched to the actions bar) ---------- */

export function FlyoutRows({
  agents,
  channel,
  onStop,
  onRetry,
  onAnswer,
  onStopAll,
  onOpenTrace,
}: FlyoutProps) {
  const { visible, overflow } = splitVisible(agents, 4);
  const anyWorking = agents.some((a) => a.state === "working");
  return (
    <div className="w-[332px] rounded-[10px] bg-[#1a1817] p-1 text-white shadow-[0px_2px_12px_0px_rgba(16,16,16,0.24),0px_16px_24px_-12px_rgba(16,16,16,0.24)]">
      <div className="flex items-center justify-between px-2 pb-1 pt-1.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-white/50">
          Your agents · {channel}
        </span>
        {anyWorking ? (
          <button
            type="button"
            onClick={onStopAll}
            className="rounded px-1 text-[11px] leading-4 text-white/50 transition-colors hover:text-white"
          >
            Stop all
          </button>
        ) : null}
      </div>
      {visible.map((agent) => (
        <div
          key={agent.id}
          onClick={() => onOpenTrace(agent)}
          className={`group/row flex cursor-pointer items-center gap-2.5 rounded-md py-1.5 pl-1.5 pr-2 transition-colors hover:bg-white/10 ${
            agent.leaving ? "af-leaving" : "af-row-in"
          }`}
        >
          <AgentBadge state={agent.state} size={22} />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-1.5">
              <span className="text-[13px] font-medium leading-4">
                {agent.name}
              </span>
              <span className="truncate text-[11px] leading-4 text-white/40">
                {agent.task}
              </span>
            </span>
            <span
              className={`mt-0.5 block truncate text-[12px] leading-4 ${
                agent.state === "failed"
                  ? "text-[#fda4af]"
                  : agent.state === "awaitingInput"
                    ? "text-[#93c5fd]"
                    : agent.state === "success"
                      ? "text-[#86efac]"
                      : "af-dots text-white/60"
              }`}
            >
              {statusLine(agent)}
            </span>
          </span>
          {agent.state === "awaitingInput" ? (
            <AnswerPills agent={agent} onAnswer={onAnswer} dark />
          ) : agent.state === "working" ? (
            <span className="flex shrink-0 items-center gap-1">
              <span className="font-mono text-[11px] tabular-nums leading-4 text-white/40">
                {formatElapsed(agent.elapsedMs)}
              </span>
              <button
                type="button"
                aria-label={`Stop ${agent.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onStop(agent.id);
                }}
                className="flex size-6 items-center justify-center rounded-md text-white/60 opacity-0 transition-opacity hover:bg-white/15 hover:text-white group-hover/row:opacity-100"
              >
                <StopGlyph />
              </button>
            </span>
          ) : agent.state === "failed" ? (
            <span className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRetry(agent.id);
                }}
                className="flex h-6 items-center rounded-md bg-white/10 px-2 text-[12px] leading-4 transition-colors hover:bg-white/20"
              >
                Retry
              </button>
              <button
                type="button"
                aria-label={`Dismiss ${agent.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onStop(agent.id);
                }}
                className="flex size-6 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/15 hover:text-white"
              >
                <CrossGlyph />
              </button>
            </span>
          ) : (
            <span className="flex size-6 shrink-0 items-center justify-center text-[#4ade80]">
              <CheckGlyph />
            </span>
          )}
        </div>
      ))}
      {overflow > 0 ? (
        <div className="px-2 pb-1 pt-1.5 text-[11px] leading-4 text-white/40">
          +{overflow} more working
        </div>
      ) : null}
    </div>
  );
}

/* ---------- iteration 2: Cards (light, detail-forward) ---------- */

const PILL: Record<AgentState, { label: string; className: string }> = {
  working: { label: "Working", className: "bg-[#fef3c7] text-[#b45309]" },
  failed: { label: "Failed", className: "bg-[#ffe4e6] text-[#be123c]" },
  awaitingInput: { label: "Needs you", className: "bg-[#dbeafe] text-[#1d4ed8]" },
  success: { label: "Done", className: "bg-[#dcfce7] text-[#15803d]" },
};

export function FlyoutCards({
  agents,
  channel,
  onStop,
  onRetry,
  onAnswer,
  onStopAll,
  onOpenTrace,
}: FlyoutProps) {
  const { visible, overflow } = splitVisible(agents, 4);
  const anyWorking = agents.some((a) => a.state === "working");
  return (
    <div className="w-[356px] rounded-[12px] border-[0.5px] border-[#f0efee] bg-white p-1.5 shadow-[0px_2px_12px_0px_rgba(16,16,16,0.08),0px_16px_24px_-12px_rgba(16,16,16,0.12),0px_0px_0.5px_0.75px_rgba(16,16,16,0.06)]">
      <div className="flex items-center justify-between px-1.5 pb-1.5 pt-1">
        <span className="text-[12px] font-medium leading-4 text-[#1a1817]">
          Your agents{" "}
          <span className="font-normal text-[#78716c]">in {channel}</span>
        </span>
        {anyWorking ? (
          <button
            type="button"
            onClick={onStopAll}
            className="rounded px-1 text-[11px] leading-4 text-[#58524e] transition-colors hover:text-[#1a1817]"
          >
            Stop all
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        {visible.map((agent) => (
          <div
            key={agent.id}
            className={`rounded-[8px] border-[0.5px] p-2 ${
              agent.state === "failed"
                ? "border-[#fecdd3] bg-[#fff1f2]"
                : "border-[#f0efee] bg-[#fafaf9]"
            } ${agent.leaving ? "af-leaving" : "af-row-in"}`}
          >
            <div className="flex items-center gap-2">
              <AgentBadge state={agent.state} size={18} />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-4 text-[#1a1817]">
                {agent.name}
                <span className="ml-1.5 font-normal text-[#78716c]">
                  {agent.task}
                </span>
              </span>
              <span
                className={`flex h-[18px] shrink-0 items-center rounded-full px-1.5 text-[10.5px] font-medium leading-none ${PILL[agent.state].className}`}
              >
                {PILL[agent.state].label}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2 pl-0.5">
              <span
                className={`min-w-0 truncate text-[12px] leading-4 ${
                  agent.state === "failed"
                    ? "text-[#be123c]"
                    : agent.state === "awaitingInput"
                      ? "text-[#1d4ed8]"
                      : "text-[#58524e]"
                } ${agent.state === "working" ? "af-dots" : ""}`}
              >
                {agent.state === "working" ? (
                  <>
                    <span className="mr-1.5 rounded-[4px] bg-[#f0efee] px-1 py-0.5 font-mono text-[10.5px] text-[#58524e]">
                      {agent.stepIndex + 1}/{agent.steps.length}
                    </span>
                    {agent.tool}
                  </>
                ) : (
                  statusLine(agent)
                )}
              </span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums leading-4 text-[#a8a29e]">
                {formatElapsed(agent.elapsedMs)}
              </span>
            </div>
            {/* Segmented step progress — done, current (pulsing), todo. */}
            <div className="mt-2 flex gap-0.5">
              {agent.steps.map((step, index) => (
                <span
                  key={index}
                  className={`h-[3px] flex-1 rounded-full ${
                    step.status === "done"
                      ? "bg-[#1a1817]"
                      : step.status === "current"
                        ? agent.state === "awaitingInput"
                          ? "bg-[#2563eb]"
                          : "af-pulse bg-[#f59e0b]"
                        : step.status === "errored"
                          ? "bg-[#e11d48]"
                          : "bg-[#e7e5e4]"
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between">
              {agent.state === "failed" ? (
                <span className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onRetry(agent.id)}
                    className="flex h-6 items-center rounded-[6px] bg-[#1a1817] px-2 text-[12px] leading-4 text-white transition-opacity hover:opacity-85"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => onStop(agent.id)}
                    className="flex h-6 items-center rounded-[6px] px-1.5 text-[12px] leading-4 text-[#58524e] transition-colors hover:bg-[rgba(16,16,16,0.05)]"
                  >
                    Dismiss
                  </button>
                </span>
              ) : agent.state === "awaitingInput" ? (
                <AnswerPills agent={agent} onAnswer={onAnswer} dark={false} />
              ) : agent.state === "working" ? (
                <button
                  type="button"
                  onClick={() => onStop(agent.id)}
                  className="flex h-6 items-center gap-1 rounded-[6px] px-1.5 text-[12px] leading-4 text-[#58524e] transition-colors hover:bg-[rgba(16,16,16,0.05)] hover:text-[#1a1817]"
                >
                  <StopGlyph />
                  Stop
                </button>
              ) : (
                <span className="text-[10.5px] leading-4 text-[#a8a29e]">
                  Output posted to thread
                </span>
              )}
              <span className="flex items-center gap-2">
                {agent.state === "failed" ? (
                  <span className="text-[10.5px] leading-4 text-[#a8a29e]">
                    invoked by {agent.invokedBy}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onOpenTrace(agent)}
                  className="rounded text-[11.5px] leading-4 text-[#2563eb] transition-opacity hover:opacity-75"
                >
                  Trace →
                </button>
              </span>
            </div>
          </div>
        ))}
      </div>
      {overflow > 0 ? (
        <div className="px-1.5 pb-0.5 pt-1.5 text-[11px] leading-4 text-[#a8a29e]">
          +{overflow} more working
        </div>
      ) : null}
    </div>
  );
}

/* ---------- iteration 3: Console (mono, trace-forward) ---------- */

const BULLET: Record<AgentState, string> = {
  working: "#f59e0b",
  failed: "#fb7185",
  awaitingInput: "#60a5fa",
  success: "#4ade80",
};

export function FlyoutConsole({
  agents,
  channel,
  onStop,
  onRetry,
  onAnswer,
  onStopAll,
  onOpenTrace,
}: FlyoutProps) {
  const { visible, overflow } = splitVisible(agents, 4);
  const anyWorking = agents.some((a) => a.state === "working");
  return (
    <div className="w-[388px] overflow-hidden rounded-[10px] bg-[#141210] font-mono shadow-[0px_2px_12px_0px_rgba(16,16,16,0.28),0px_16px_24px_-12px_rgba(16,16,16,0.28)]">
      <div className="flex items-center justify-between border-b-[0.5px] border-white/10 px-3 py-2">
        <span className="text-[11px] leading-4 text-white/50">
          agents — {channel}
        </span>
        {anyWorking ? (
          <button
            type="button"
            onClick={onStopAll}
            className="rounded text-[11px] leading-4 text-white/40 transition-colors hover:text-[#fda4af]"
          >
            kill all
          </button>
        ) : null}
      </div>
      <div className="p-1.5">
        {visible.map((agent) => {
          // The last finished step + the live one — a 2-line trace excerpt.
          const done = agent.steps.filter((s) => s.status === "done");
          const prev = done[done.length - 1];
          return (
            <div
              key={agent.id}
              onClick={() => onOpenTrace(agent)}
              className={`group/row cursor-pointer rounded-md px-1.5 py-1.5 transition-colors hover:bg-white/5 ${
                agent.leaving ? "af-leaving" : "af-row-in"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`size-[7px] shrink-0 rounded-full ${
                    agent.state === "working" || agent.state === "awaitingInput"
                      ? "af-pulse"
                      : ""
                  }`}
                  style={{ background: BULLET[agent.state] }}
                />
                <span className="text-[12px] leading-4 text-white">
                  {agent.name.toLowerCase()}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] leading-4 text-white/40">
                  {agent.task.toLowerCase()}
                </span>
                <span className="shrink-0 text-[10.5px] tabular-nums leading-4 text-white/30">
                  {formatElapsed(agent.elapsedMs)}
                </span>
                {agent.state === "failed" ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRetry(agent.id);
                    }}
                    className="shrink-0 rounded text-[11px] leading-4 text-white/50 opacity-0 transition-all hover:text-white group-hover/row:opacity-100"
                  >
                    retry
                  </button>
                ) : null}
                {agent.state === "awaitingInput" ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onAnswer(agent.id);
                    }}
                    className="shrink-0 rounded text-[11px] leading-4 text-[#93c5fd] opacity-0 transition-all hover:text-white group-hover/row:opacity-100"
                  >
                    answer
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onStop(agent.id);
                  }}
                  className="shrink-0 rounded text-[11px] leading-4 text-white/50 opacity-0 transition-all hover:text-[#fda4af] group-hover/row:opacity-100"
                >
                  {agent.state === "working" || agent.state === "awaitingInput"
                    ? "stop"
                    : "clear"}
                </button>
              </div>
              <div className="mt-1 flex flex-col gap-0.5 pl-[15px]">
                {prev != null ? (
                  <span className="truncate text-[11px] leading-4 text-white/35">
                    ✓ {prev.tool.toLowerCase()}{" "}
                    <span className="text-white/20">
                      · {(prev.ranMs / 1000).toFixed(1)}s
                    </span>
                  </span>
                ) : null}
                {agent.state === "working" ? (
                  <span className="flex items-center gap-1.5 truncate text-[11px] leading-4 text-[#fcd34d]/90">
                    ▸ {agent.tool.toLowerCase()}
                    <span className="af-caret" />
                  </span>
                ) : agent.state === "awaitingInput" ? (
                  <span className="truncate text-[11px] leading-4 text-[#93c5fd]">
                    ? {agent.question?.toLowerCase()}
                  </span>
                ) : agent.state === "failed" ? (
                  <>
                    <span className="truncate text-[11px] leading-4 text-[#fb7185]">
                      ✗ {agent.tool.toLowerCase()}
                    </span>
                    <span className="truncate text-[11px] leading-4 text-[#fb7185]/70">
                      └ {agent.error?.toLowerCase()}
                    </span>
                  </>
                ) : (
                  <span className="truncate text-[11px] leading-4 text-[#4ade80]/80">
                    ✓ done · output posted to thread
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {overflow > 0 ? (
          <div className="px-1.5 pb-1 pt-1.5 text-[11px] leading-4 text-white/30">
            … +{overflow} more
          </div>
        ) : null}
      </div>
    </div>
  );
}
