// /agent-interactions — an idea board for how agent interactions could
// work across the lifecycle: invoking → while working → resolving →
// governing. Static cards, no wiring; each carries its inspiration source
// so the provenance stays legible. Distilled from the July Sprints agent
// canvas (proactivity table, stop flow, multi-payload notes) and the
// reference set (Linear AIG, Cursor, Vercel, Dynamic Island).

import "./agent-interactions.css";

const P = "/agent-working";

const FG_PRIMARY = "#1a1817";
const FG_SECONDARY = "#58524e";
const FG_TERTIARY = "#78716c";
const STROKE_WEAK = "#f0efee";
const BG_TERTIARY = "#f5f5f4";
const BRAND = "#2563eb";

/* ------------------------------ mini visuals ------------------------------ */

function Face({ src, size = 16 }: { src: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt=""
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

function Ring({
  color,
  dashed = false,
  breathe = false,
  size = 22,
  children,
}: {
  color: string;
  dashed?: boolean;
  breathe?: boolean;
  size?: number;
  children?: React.ReactNode;
}) {
  const center = size / 2;
  const radius = center - 1;
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className={`absolute inset-0 ${dashed ? "ai-spin" : ""} ${breathe ? "ai-breathe" : ""}`}
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={1.5}
          stroke={color}
          strokeDasharray={dashed ? "3 3.6" : undefined}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </span>
  );
}

// A quiet chip in the session-chip grammar.
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 rounded-[6px] border-[0.5px] px-2 text-[12px] leading-4"
      style={{ borderColor: "#e7e5e4", color: FG_SECONDARY }}
    >
      {children}
    </span>
  );
}

function VisualSuggest() {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex items-center gap-2 rounded-[8px] border-[0.5px] bg-white px-2.5 py-2"
        style={{ borderColor: STROKE_WEAK }}
      >
        <span className="text-[13px]" style={{ color: FG_PRIMARY }}>
          does anyone know what the weather in LA is this wee
        </span>
        <span className="ml-auto h-3.5 w-px bg-[#1a1817]" />
      </div>
      <div className="flex items-center gap-1.5 pl-1">
        <Face src={`${P}/agent-2.png`} size={14} />
        <span className="text-[12px]" style={{ color: FG_TERTIARY }}>
          Tadao can answer this — <span style={{ color: BRAND }}>tab to ask</span>
        </span>
      </div>
    </div>
  );
}

function VisualGather() {
  return (
    <div className="flex flex-col gap-1">
      {["decided: ship popout variant", "blocker: token drift on staging"].map((line) => (
        <div
          key={line}
          className="rounded-[6px] px-2 py-1 text-[12px]"
          style={{ background: "rgba(37,99,235,0.14)", color: FG_PRIMARY }}
        >
          {line}
        </div>
      ))}
      <div className="flex items-center gap-1.5 pt-1">
        <Chip>
          <Face src={`${P}/agent-1.png`} size={13} />
          Send 2 messages to Ando
        </Chip>
      </div>
    </div>
  );
}

function VisualAwait() {
  return (
    <div
      className="flex items-center gap-2.5 rounded-[8px] bg-[#1b1b1b] p-2"
      style={{ maxWidth: 300 }}
    >
      <Ring color="#2563eb" breathe size={24}>
        <Face src={`${P}/yumi.png`} size={16} />
      </Ring>
      <span className="flex min-w-0 flex-col">
        <span className="text-[12px] leading-4 text-white">
          Which staging theme — light or dim?
        </span>
        <span className="text-[11px] leading-4 text-[#8a8a8a]">reply here to unblock</span>
      </span>
      <span
        className="ml-auto rounded-[5px] px-1.5 py-0.5 text-[11px]"
        style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
      >
        answer
      </span>
    </div>
  );
}

function VisualSteer() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-5 items-center gap-2">
        <Face src={`${P}/agent-2.png`} size={16} />
        <span className="ai-shimmer text-[13px] leading-4">Cross-checking hourly models</span>
        <span className="text-[12px] tabular-nums" style={{ color: "#a8a29e" }}>
          24s
        </span>
      </div>
      <div
        className="flex items-center gap-2 rounded-[8px] border-[0.5px] px-2.5 py-1.5"
        style={{ borderColor: STROKE_WEAK }}
      >
        <span className="text-[12px]" style={{ color: FG_TERTIARY }}>
          ↳ also check Sunday morning specifically
        </span>
        <span className="ml-auto text-[11px]" style={{ color: BRAND }}>
          absorbed
        </span>
      </div>
    </div>
  );
}

function VisualDraft() {
  return (
    <div
      className="flex flex-col gap-2 rounded-[8px] border-[0.5px] p-2.5"
      style={{ borderColor: STROKE_WEAK, background: "#fafaf9" }}
    >
      <span className="text-[11px] uppercase tracking-[0.6px]" style={{ color: FG_TERTIARY }}>
        Only visible to you
      </span>
      <span className="text-[12px] leading-4" style={{ color: FG_PRIMARY }}>
        Partly sunny, high of 88°F — surf advisory through Tuesday…
      </span>
      <div className="flex items-center gap-1.5">
        <span
          className="rounded-[5px] px-2 py-0.5 text-[11px] text-white"
          style={{ background: FG_PRIMARY }}
        >
          Post to channel
        </span>
        <span className="rounded-[5px] px-2 py-0.5 text-[11px]" style={{ color: FG_SECONDARY }}>
          Revise
        </span>
        <span className="rounded-[5px] px-2 py-0.5 text-[11px]" style={{ color: "#dc2626" }}>
          Discard
        </span>
      </div>
    </div>
  );
}

function VisualFollowups() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Chip>Compare to last weekend</Chip>
      <Chip>Set a rain alert</Chip>
      <Chip>Post to #social</Chip>
    </div>
  );
}

function VisualStopScope() {
  return (
    <div
      className="flex w-[200px] flex-col overflow-hidden rounded-[10px] bg-white p-1 shadow-[0px_2px_12px_0px_rgba(16,16,16,0.06),0px_16px_24px_-12px_rgba(16,16,16,0.08),0px_0px_0.5px_0.75px_rgba(16,16,16,0.06)]"
    >
      {[
        ["Stop this run", FG_PRIMARY],
        ["Pause Tadao in #design", FG_PRIMARY],
        ["Lower proactivity → mention-only", FG_SECONDARY],
      ].map(([label, color]) => (
        <span
          key={label}
          className="rounded-[6px] px-2 py-1.5 text-[12px] leading-4"
          style={{ color }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function VisualAttribution() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Ring color="#dc2626" size={20}>
          <Face src={`${P}/agent-2.png`} size={13} />
        </Ring>
        <span className="text-[12px]" style={{ color: FG_PRIMARY }}>
          Stopped by <span className="font-medium">Sara</span> · proactivity unchanged
        </span>
      </div>
      <span className="pl-7 text-[11px]" style={{ color: FG_TERTIARY }}>
        “stop during asked-for work never changes settings”
      </span>
    </div>
  );
}

function VisualDigest() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center">
        <Ring color="#16a34a" size={20}>
          <Face src={`${P}/agent-1.png`} size={13} />
        </Ring>
      </div>
      <span className="text-[12px]" style={{ color: FG_SECONDARY }}>
        Quiet day: <span style={{ color: FG_PRIMARY }}>3 runs · 2 done · 1 stopped</span> —
        <span style={{ color: BRAND }}> review</span>
      </span>
    </div>
  );
}

function VisualWatch() {
  return (
    <Chip>
      <Face src={`${P}/yumi.png`} size={13} />
      <span>
        watching <span style={{ color: FG_PRIMARY }}>token drift</span> · acts on next mention
      </span>
      <span
        className="ml-1 size-[5px] rounded-full"
        style={{ background: "#f59e0b" }}
        aria-hidden
      />
    </Chip>
  );
}

/* --------------------------------- ideas ---------------------------------- */

type Idea = {
  title: string;
  source: string;
  body: string;
  visual?: React.ReactNode;
};

type Section = { heading: string; blurb: string; ideas: Idea[] };

const SECTIONS: Section[] = [
  {
    heading: "Invoking",
    blurb: "How work gets handed to an agent in the first place.",
    ideas: [
      {
        title: "Draft-aware suggestion",
        source: "proactivity levels · canvas",
        body: "While you type a question the composer margin quietly offers the agent that could answer it — tab to convert the message into an invocation. Suggestion frequency is gated by the channel's proactivity level, so it never nags.",
        visual: <VisualSuggest />,
      },
      {
        title: "Gather-and-send payloads",
        source: "/multi-select · multi-payload note",
        body: "Block-select messages (the existing multi-select interaction) and hand the bundle to an agent as one payload. The agent's sub-line cites “2 messages from #design” instead of a single prompt — provenance stays visible in the flyout.",
        visual: <VisualGather />,
      },
      {
        title: "Standing tasks",
        source: "Linear recurring issues · Vercel crons",
        body: "“@Tadao every weekday at 9: post the forecast.” The invocation message stays pinned as the task's home: edit it to edit the schedule, and every run threads under it, so history accumulates in one place instead of littering the channel.",
      },
      {
        title: "Handoff between agents",
        source: "Cursor agent-to-agent",
        body: "An agent that hits the edge of its remit proposes a colleague: Yumi finishes the token pull and offers “Ando can write the migration note.” Accepting spawns the second run with the first one's output as payload — a visible relay, never a silent transfer.",
      },
    ],
  },
  {
    heading: "While working",
    blurb: "Presence, steering, and asking without derailing the run.",
    ideas: [
      {
        title: "Mid-run steering",
        source: "multi-payload messages · canvas",
        body: "Reply to the session chip while the agent works and the context is absorbed into the live run — no restart, no second agent. The chip acknowledges with a brief “absorbed” tick, and the trace records the steer as its own step.",
        visual: <VisualSteer />,
      },
      {
        title: "Awaiting input as a first-class state",
        source: "Linear AIG",
        body: "When an agent blocks on a question it turns blue and breathes — attention without alarm. The question lives in the flyout row and is answerable inline; the run resumes the moment you reply. Working, awaiting, done, failed: four states, four colors.",
        visual: <VisualAwait />,
      },
      {
        title: "Typing indicator, final seconds only",
        source: "canvas debate: “feels human but needs regulating”",
        body: "“Tadao is typing…” appears only in the last moments before the answer posts — the human tell at the human moment. The rest of the run belongs to the ring and the thought line, so five working agents never stack five typing rows.",
      },
      {
        title: "Peek a single tool call",
        source: "Cursor tool cards · trace modal",
        body: "The chip's live tool line is itself a target: tap “Reading weather.gov…” to peek just that call's input and output in a popover, without opening the full trace. Debugging stays one gesture deep for the common case.",
      },
    ],
  },
  {
    heading: "Resolving",
    blurb: "What landing an answer should feel like.",
    ideas: [
      {
        title: "Draft-first answers",
        source: "human-in-the-loop · Cursor review flow",
        body: "For channels that opt in, the agent posts to the invoker privately first — “only visible to you” — with post, revise, or discard. The channel sees either a finished answer or nothing. Trust dial per channel: direct-post ↔ draft-first.",
        visual: <VisualDraft />,
      },
      {
        title: "Suggested follow-ups",
        source: "v0 / ChatGPT continuation chips",
        body: "Under an answer, two or three chips propose the obvious next asks — each one is a prefilled invocation of the same agent with the answer as context. The conversation keeps momentum without retyping the setup.",
        visual: <VisualFollowups />,
      },
      {
        title: "Reactions tune proactivity",
        source: "proactivity counter · canvas table",
        body: "👍 on an agent answer is signal, 👎 increments the same counter the stop-flow uses; at ~3 the system proposes a settings change with one-tap accept. Feedback people already give becomes governance input — never silently, always confirmed.",
      },
      {
        title: "Failure triage card",
        source: "“persists until addressed” · spec",
        body: "A failed run's row expands into a small triage card: the failing step from the trace, plus “retry”, “retry with more context” (point it at messages or files), and “dismiss”. Failures end as decisions, not as red pixels that time out.",
      },
    ],
  },
  {
    heading: "Governing",
    blurb: "Stop semantics, attribution, and ambient trust.",
    ideas: [
      {
        title: "Scoped stop",
        source: "stop flowchart · canvas",
        body: "Press-and-hold the stop control to choose scope: this run, this agent in this channel, or proactivity itself. The quick tap stays scoped to the run — settings never change from a reflex, matching the canvas rule: stopping is about now, settings are about later.",
        visual: <VisualStopScope />,
      },
      {
        title: "Attribution everywhere",
        source: "stop flow · Linear activity feed",
        body: "Anyone can stop anyone's agent, and the flyout, chip, and trace all say who — “stopped by Sara” — with the invariant spelled out: stopping asked-for work never changes proactivity. Multiplayer control needs multiplayer receipts.",
        visual: <VisualAttribution />,
      },
      {
        title: "End-of-day digest",
        source: "Vercel deploy summary emails",
        body: "When the corner has been quiet, the roster collapses to a single green-ringed dot; once a day it posts a one-line digest — runs, outcomes, anything still failed — linking into run history. Ambient presence that earns its pixels.",
        visual: <VisualDigest />,
      },
      {
        title: "Watch mode",
        source: "Linear triage rules",
        body: "An agent can subscribe to a topic instead of a thread: “watch for token drift.” It sits dormant — no ring, just a small amber dot on its roster entry — and only invokes itself when the topic recurs, posting why it woke up as the first trace step.",
        visual: <VisualWatch />,
      },
    ],
  },
];

/* ---------------------------------- page ----------------------------------- */

export default function AgentInteractionsPage() {
  return (
    <div className="flex flex-1 justify-center bg-white">
      <main className="w-full max-w-3xl px-6 pb-24 pt-24">
        <h1 className="text-[14px] font-medium leading-5" style={{ color: FG_PRIMARY }}>
          Agent interactions — idea board
        </h1>
        <p className="mt-2 text-[13px] leading-[18px]" style={{ color: FG_TERTIARY }}>
          Sixteen sketches for how working with agents in a channel could feel, grouped by
          lifecycle. Sources: the July Sprints agent canvas (proactivity table, stop flow,
          multi-payload notes) and the reference set — Linear AIG, Cursor, Vercel, Dynamic
          Island. Nothing here is wired; <span style={{ color: FG_SECONDARY }}>/agent-working</span>{" "}
          is the live prototype.
        </p>

        {SECTIONS.map((section) => (
          <section key={section.heading} className="mt-12">
            <div className="flex items-baseline gap-3">
              <h2
                className="text-[11px] font-medium uppercase leading-[14px] tracking-[1.1px]"
                style={{ color: FG_SECONDARY }}
              >
                {section.heading}
              </h2>
              <span className="text-[12px] leading-4" style={{ color: "#a8a29e" }}>
                {section.blurb}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {section.ideas.map((idea) => (
                <article
                  key={idea.title}
                  className="flex flex-col gap-2.5 rounded-[10px] border-[0.5px] p-4"
                  style={{ borderColor: STROKE_WEAK, background: "#fff" }}
                >
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-[13px] font-medium leading-5" style={{ color: FG_PRIMARY }}>
                      {idea.title}
                    </h3>
                    <span className="text-[11px] leading-4" style={{ color: "#a8a29e" }}>
                      {idea.source}
                    </span>
                  </div>
                  <p className="text-[12px] leading-[18px]" style={{ color: FG_SECONDARY }}>
                    {idea.body}
                  </p>
                  {idea.visual != null ? (
                    <div
                      className="mt-1 rounded-[8px] p-3"
                      style={{ background: BG_TERTIARY }}
                    >
                      {idea.visual}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
