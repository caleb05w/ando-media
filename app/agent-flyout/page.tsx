"use client";

// /agent-flyout — iterations on the "agents compress above the composer"
// flyout from the July Sprints agent-invocation flow (Figma 17548-4926).
//
// Running agents compress on the top right of the composer; hovering or
// clicking flies out a high-level view of every agent you have working in
// the channel — activity, working state, tool invoked, stop CTA, and an
// entry point to each agent's trace. Four iterations are switchable in the
// header: v2 (the synthesis — aggregate chip with worst-state ring + count,
// rollup header, awaitingInput answerable inline), Rows (dark bar language),
// Cards (light, detail-forward), Console (mono, trace-forward). A scripted
// fleet drives the states: runs succeed (green ring lingers, then clears),
// one fails mid-build and persists with retry / dismiss + attribution, and
// Scout blocks on a question before posting (Linear AIG's awaitingInput).

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import "./agent-flyout.css";
import {
  useAgentFleet,
  type DerivedAgent,
} from "./agents";
import {
  AgentBadge,
  AgentChipStack,
  AggregateChip,
  FlyoutCards,
  FlyoutConsole,
  FlyoutRows,
  FlyoutV2,
  VARIANTS,
  type FlyoutVariant,
} from "./flyout";

const FG_PRIMARY = "#1a1817";
const FG_SECONDARY = "#58524e";
const FG_TERTIARY = "#78716c";
const STROKE_WEAK = "#f0efee";
const BG_TERTIARY = "#f5f5f4";
const BRAND = "#2563eb";

type SceneMessage = {
  id: string;
  author: string;
  time: string;
  segments: Array<{ text: string; mention?: boolean }>;
};

// The backdrop conversation doubles as the story: each mention is the
// invocation that spawned one of the agents in the stack.
const SCENE: SceneMessage[] = [
  {
    id: "s1",
    author: "Jordan",
    time: "5:35 pm",
    segments: [
      {
        text: "Can someone pull together what we actually decided on the drag threshold? It's scattered across like 40 messages.",
      },
    ],
  },
  {
    id: "s2",
    author: "Sara Du",
    time: "5:36 pm",
    segments: [
      { text: "@Scout", mention: true },
      { text: " digest this thread into a decisions doc" },
    ],
  },
  {
    id: "s3",
    author: "Peter",
    time: "5:37 pm",
    segments: [
      { text: "While we're at it — " },
      { text: "@Redline", mention: true },
      { text: " compare the mock against what's on staging?" },
    ],
  },
  {
    id: "s4",
    author: "Oliver",
    time: "5:38 pm",
    segments: [
      { text: "@Shipit", mention: true },
      { text: " open a PR for the header fix when you get a sec." },
    ],
  },
  {
    id: "s5",
    author: "Jordan",
    time: "5:39 pm",
    segments: [{ text: "Watch the top right of the composer 👀" }],
  },
];

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

// The in-channel trace stub that appears under the invocation, per the flow:
// agent name, working state, tool invoked, stop CTA.
function InlineTrace({
  agent,
  everSpawned,
  onStop,
  onRetry,
  onAnswer,
  onOpenTrace,
}: {
  agent: DerivedAgent | null;
  everSpawned: boolean;
  onStop: (id: string) => void;
  onRetry: (id: string) => void;
  onAnswer: (id: string) => void;
  onOpenTrace: (agent: DerivedAgent) => void;
}) {
  if (agent == null) {
    if (!everSpawned) return null;
    return (
      <div className="af-row-in mt-1 flex h-7 items-center gap-2 pl-[34px] text-[12px] leading-4" style={{ color: FG_TERTIARY }}>
        Scout is done — trace archived
      </div>
    );
  }
  return (
    <div className="af-row-in mt-1 pl-[34px]">
      <button
        type="button"
        onClick={() => onOpenTrace(agent)}
        className="group/trace flex h-8 items-center gap-2 rounded-[8px] border-[0.5px] py-1 pl-1.5 pr-2 text-left transition-colors hover:bg-[#fafaf9]"
        style={{ borderColor: STROKE_WEAK }}
      >
        <AgentBadge state={agent.state} size={16} />
        <span className="text-[12px] font-medium leading-4" style={{ color: FG_PRIMARY }}>
          {agent.name}
        </span>
        <span
          className={`max-w-[300px] truncate text-[12px] leading-4 ${
            agent.state === "working" ? "af-dots" : ""
          }`}
          style={{
            color:
              agent.state === "failed"
                ? "#be123c"
                : agent.state === "awaitingInput"
                  ? "#1d4ed8"
                  : agent.state === "success"
                    ? "#15803d"
                    : FG_SECONDARY,
          }}
        >
          {agent.state === "failed"
            ? agent.error
            : agent.state === "awaitingInput"
              ? agent.question
              : agent.state === "success"
                ? "done — summary posted"
                : agent.tool}
        </span>
        {agent.state === "awaitingInput" ? (
          <span className="flex items-center gap-1">
            {agent.options.slice(0, 2).map((option) => (
              <span
                key={option}
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  onAnswer(agent.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.stopPropagation();
                    onAnswer(agent.id);
                  }
                }}
                className="flex h-[22px] items-center rounded-[5px] bg-[#1a1817] px-1.5 text-[11px] leading-4 text-white transition-opacity hover:opacity-85"
              >
                {option}
              </span>
            ))}
          </span>
        ) : agent.state === "working" ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              onStop(agent.id);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.stopPropagation();
                onStop(agent.id);
              }
            }}
            className="rounded px-1 text-[11px] leading-4 opacity-0 transition-opacity group-hover/trace:opacity-100"
            style={{ color: FG_TERTIARY }}
          >
            Stop
          </span>
        ) : agent.state === "failed" ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              onRetry(agent.id);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.stopPropagation();
                onRetry(agent.id);
              }
            }}
            className="rounded px-1 text-[11px] leading-4"
            style={{ color: FG_SECONDARY }}
          >
            Retry
          </span>
        ) : null}
      </button>
    </div>
  );
}

export default function AgentFlyoutPage() {
  const fleet = useAgentFleet();
  const [variant, setVariant] = useState<FlyoutVariant>("v2");
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [trace, setTrace] = useState<DerivedAgent | null>(null);
  const [everSpawned, setEverSpawned] = useState(false);
  const closeTimerRef = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Render-phase adjustments (not effects): remember that Scout has existed
  // so the inline trace can show its afterglow, and drop the flyout once the
  // whole fleet is gone.
  const scout = fleet.agents.find((a) => a.id.startsWith("scout-")) ?? null;
  if (scout != null && !everSpawned) setEverSpawned(true);
  if (fleet.agents.length === 0 && (open || pinned)) {
    setOpen(false);
    setPinned(false);
  }

  const openNow = useCallback(() => {
    window.clearTimeout(closeTimerRef.current);
    setOpen(true);
  }, []);

  const closeSoon = useCallback(() => {
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 240);
  }, []);

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  // Anchor the fixed panel to the chip: bottom-aligned above it, right edges
  // flush. Style is written straight to the node so no render depends on it.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const chip = overlayRef.current?.querySelector("button");
      const panel = panelRef.current;
      if (chip == null || panel == null) return;
      const rect = chip.getBoundingClientRect();
      panel.style.bottom = `${window.innerHeight - rect.top + 6}px`;
      panel.style.right = `${window.innerWidth - rect.right}px`;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, variant]);

  // Pinned flyout: outside pointer-down or Esc releases it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (overlayRef.current?.contains(event.target as Node)) return;
      setPinned(false);
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPinned(false);
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const flyoutProps = {
    agents: fleet.agents,
    channel: "#design",
    onStop: fleet.stop,
    onRetry: fleet.retry,
    onAnswer: fleet.answer,
    onStopAll: fleet.stopAll,
    onOpenTrace: setTrace,
  };

  const liveTrace =
    trace != null
      ? (fleet.agents.find((a) => a.id === trace.id) ?? trace)
      : null;

  return (
    <div
      className="flex h-dvh w-screen flex-col overflow-hidden"
      style={{ background: BG_TERTIARY, color: FG_PRIMARY }}
    >
      {/* Lab header: variant switch + fleet controls. */}
      <div className="flex shrink-0 items-center justify-center gap-3 px-4 py-2.5">
        <span className="text-[13px] font-medium leading-4">Agent flyout</span>
        <span
          className="flex items-center rounded-[8px] p-0.5"
          style={{ background: "#ebe9e8" }}
        >
          {VARIANTS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setVariant(value)}
              className={`flex h-6 items-center rounded-[6px] px-2 text-[12px] leading-4 transition-colors ${
                variant === value ? "bg-white shadow-[0px_0px_0.5px_0.75px_#dbd9d8]" : ""
              }`}
              style={{ color: variant === value ? FG_PRIMARY : FG_SECONDARY }}
            >
              {label}
            </button>
          ))}
        </span>
        <span className="h-4 w-px" style={{ background: "#e0dedd" }} />
        <button
          type="button"
          onClick={fleet.spawn}
          className="flex h-7 items-center rounded-full bg-[#1a1817] px-3 text-[12px] leading-4 text-white transition-opacity hover:opacity-85"
        >
          Spawn agent
        </button>
        <button
          type="button"
          onClick={fleet.reset}
          className="flex h-7 items-center rounded-full px-2.5 text-[12px] leading-4 transition-colors hover:bg-[rgba(16,16,16,0.05)]"
          style={{ color: FG_SECONDARY }}
        >
          Reset
        </button>
      </div>

      {/* The channel card. */}
      <div className="flex min-h-0 flex-1 justify-center px-4 pb-4">
        <main className="flex min-h-0 w-full max-w-[720px] flex-col overflow-clip rounded-[10px] bg-white shadow-[0px_0px_0.5px_0.5px_rgba(15,13,13,0.08),0px_1px_2px_0px_rgba(15,13,13,0.05)]">
          <div
            className="flex h-11 shrink-0 items-center gap-2 border-b-[0.5px] px-4"
            style={{ borderColor: STROKE_WEAK }}
          >
            <span className="text-[15px] leading-5" style={{ color: FG_TERTIARY }}>
              #
            </span>
            <span className="text-[14px] leading-5">design</span>
            <span className="flex-1" />
            <span
              className="flex items-center justify-center rounded-[6px] bg-white px-2 py-1 text-[12px] leading-4 shadow-[0px_0px_0.5px_0.75px_#ebe9e8]"
              style={{ color: FG_SECONDARY }}
            >
              13 members
            </span>
          </div>

          {/* Messages: the invocations that spawned the fleet. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-2 pr-4">
            <div aria-hidden className="mt-auto shrink-0" />
            {SCENE.map((message) => (
              <div
                key={message.id}
                className="flex w-full items-start gap-2.5 px-4 pb-1.5 pt-2"
              >
                <Silhouette size={24} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex h-3 items-center gap-1.5 whitespace-nowrap">
                    <span className="text-[14px] font-medium leading-5">
                      {message.author}
                    </span>
                    <span className="text-[12px] leading-4" style={{ color: FG_TERTIARY }}>
                      {message.time}
                    </span>
                  </div>
                  <div className="break-words text-[14px] leading-5">
                    {message.segments.map((segment, index) =>
                      segment.mention ? (
                        <span
                          key={index}
                          className="rounded-[4px] px-0.5"
                          style={{ color: BRAND, background: "rgba(37,99,235,0.08)" }}
                        >
                          {segment.text}
                        </span>
                      ) : (
                        <span key={index}>{segment.text}</span>
                      )
                    )}
                  </div>
                  {message.id === "s2" ? (
                    <InlineTrace
                      agent={scout}
                      everSpawned={everSpawned}
                      onStop={fleet.stop}
                      onRetry={fleet.retry}
                      onAnswer={fleet.answer}
                      onOpenTrace={setTrace}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Compressed stack, top right of the composer; the flyout anchors
              to it and grows upward. */}
          <div
            ref={overlayRef}
            className="relative z-40 flex shrink-0 justify-end px-4"
            onPointerEnter={openNow}
            onPointerLeave={() => {
              if (!pinned) closeSoon();
            }}
          >
            {/* v2 compresses to a single aggregate chip (worst-state ring +
                count); the earlier iterations keep the itemized stack. */}
            {(() => {
              const chipProps = {
                agents: fleet.agents,
                active: open,
                onClick: () => {
                  if (pinned) {
                    setPinned(false);
                    setOpen(false);
                  } else {
                    setPinned(true);
                    openNow();
                  }
                },
              };
              return variant === "v2" ? (
                <AggregateChip {...chipProps} />
              ) : (
                <AgentChipStack {...chipProps} />
              );
            })()}
            {open && fleet.agents.length > 0 ? (
              // Fixed so it can outgrow the card's overflow-clip; anchored to
              // the chip by the measuring effect (style written straight to
              // the node, like the multi-select bar's positioner).
              <div key={variant} ref={panelRef} className="af-pop-enter fixed z-50">
                {variant === "v2" ? (
                  <FlyoutV2 {...flyoutProps} />
                ) : variant === "rows" ? (
                  <FlyoutRows {...flyoutProps} />
                ) : variant === "cards" ? (
                  <FlyoutCards {...flyoutProps} />
                ) : (
                  <FlyoutConsole {...flyoutProps} />
                )}
              </div>
            ) : null}
          </div>

          {/* Composer. */}
          <div className="flex w-full shrink-0 flex-col items-center justify-center px-4 pb-4 pt-1">
            <div
              className="flex w-full flex-col gap-2 overflow-hidden rounded-[10px] border-[0.5px] bg-white p-3"
              style={{ borderColor: STROKE_WEAK }}
            >
              <div className="flex h-10 w-full items-start px-1">
                <span className="whitespace-nowrap text-[14px] leading-5" style={{ color: "#a8a29e" }}>
                  Send a message in #design
                </span>
              </div>
              <div className="flex w-full items-center justify-between">
                <span className="flex size-7 items-center justify-center rounded-[6px]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M9.9 4.2L5.6 8.5a1.9 1.9 0 002.7 2.7l4.6-4.6a3.2 3.2 0 00-4.5-4.5L3.7 6.8"
                      stroke={FG_SECONDARY}
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="size-7 rounded-[6px]" />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Trace stub — the "brings you to the agent trace" hop, per the flow.
          Re-resolved against the live fleet so the steps keep advancing while
          the dialog is open (snapshot fallback if the agent has left). */}
      {liveTrace != null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setTrace(null)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex w-[340px] flex-col gap-3 rounded-[10px] bg-[#1a1817] p-5 text-white shadow-[0px_16px_24px_-12px_rgba(16,16,16,0.4)]"
          >
            <div className="flex items-center gap-2.5">
              <AgentBadge state={liveTrace.state} size={20} />
              <span className="text-[14px] font-medium leading-5">
                {liveTrace.name} — agent trace
              </span>
            </div>
            <div className="flex flex-col gap-1 font-mono">
              {liveTrace.steps.map((step, index) => {
                const awaitingHere =
                  step.status === "current" &&
                  liveTrace.state === "awaitingInput";
                return (
                  <span
                    key={index}
                    className={`text-[11.5px] leading-4 ${
                      step.status === "done"
                        ? "text-white/60"
                        : awaitingHere
                          ? "text-[#93c5fd]"
                          : step.status === "current"
                            ? "text-[#fcd34d]"
                            : step.status === "errored"
                              ? "text-[#fb7185]"
                              : "text-white/25"
                    }`}
                  >
                    {step.status === "done"
                      ? "✓"
                      : awaitingHere
                        ? "?"
                        : step.status === "current"
                          ? "▸"
                          : step.status === "errored"
                            ? "✗"
                            : "·"}{" "}
                    {step.tool}
                  </span>
                );
              })}
            </div>
            {liveTrace.state === "awaitingInput" ? (
              <div className="flex flex-col gap-2 rounded-md bg-white/5 p-2.5">
                <span className="text-[12px] leading-4 text-[#93c5fd]">
                  {liveTrace.question}
                </span>
                <span className="flex items-center gap-1.5">
                  {liveTrace.options.slice(0, 2).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => fleet.answer(liveTrace.id)}
                      className="flex h-6 items-center rounded-md bg-white/10 px-2 text-[12px] leading-4 transition-colors hover:bg-white/20"
                    >
                      {option}
                    </button>
                  ))}
                </span>
              </div>
            ) : null}
            <span className="text-[12px] leading-4 text-white/60">
              The full trace opens like a devtool panel on the side — stubbed in
              this prototype.
            </span>
            <button
              type="button"
              onClick={() => setTrace(null)}
              className="self-start rounded-md bg-white/10 px-3 py-1.5 text-[14px] leading-5 transition-colors hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
