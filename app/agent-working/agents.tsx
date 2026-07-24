"use client";

// Agent-working system, per the July Sprints spec (Figma nodes 17658-1346
// "Single Agent working", 17700-19103 "Multi Agent working session", and
// 17789-27302, the annotated flyout spec). Three surfaces:
//
//  1. Inline session chips under the invoking message
//     ("Starting agent session · 6s · stop" → red "Failed"/"Stopped").
//  2. Corner presence: one ringed avatar per live agent, bottom-right above
//     the composer. Ring grammar: orbiting sage dashes = working, solid
//     green = done, solid red = failed/stopped. Click toggles the flyout.
//  3. Dark "Active agents" flyout (single list, per the multi-agent mock —
//     no Complete tab). Rows: ringed avatar, live status line (chevron →
//     trace modal), "↳ invoking message" sub-line, elapsed time that swaps
//     to controls on hover (stop / rerun / remove). Row click jumps to the
//     source message. Completed rows linger 5s, then fade away — the posted
//     answer is the durable record. 4-row window with a "Showing 4 of N
//     agents" pager that only renders at 5+ rows.
//
// The trace modal ("Agent trace") shows a summary line and a step timeline:
// Task started → tool calls → Thinking → Task complete/failed/stopped.

import { useCallback, useEffect, useRef, useState } from "react";

const A = "/multi-select";

/* ---------------------------------- data ---------------------------------- */

export type TraceStep = { verb: string; desc: string };

// One believable "thought" beat: what the agent narrates and for how long.
// Uneven dwell times keep the cycling from feeling metronomic.
export type Thought = { text: string; ms: number };

export type AgentDef = {
  id: string;
  name: string;
  photo?: string; // photo avatar; omitted = sparkle mark
  tint?: string; // sparkle disc color (default near-black)
  // Portrait color (dominant tone, lightness clamped for the white card).
  // Used by the comet when the page is in portrait-hue mode.
  hue?: string;
  // Scripted working narration; index 0 is the spawn state. Long runs cycle
  // the beats from `loopFrom` onward once the script is exhausted.
  thoughts: Thought[];
  loopFrom?: number;
  // Canned answer paragraphs posted to the channel on completion.
  answer: string[];
  traceSteps: TraceStep[];
  // Outcome script per attempt — lets the demo show the failure branch
  // deterministically (Yumi fails her first run, succeeds on rerun).
  script: (attempt: number) => { durationMs: number; outcome: "done" | "failed" };
  toolCalls: (attempt: number) => number;
};

// Avatar assets live in /public/agent-working.
const P = "/agent-working";

export const AGENTS: AgentDef[] = [
  {
    id: "tadao",
    name: "Tadao",
    photo: `${P}/agent-2.png`,
    hue: "#3b3b3b", // the mark's charcoal
    thoughts: [
      { text: "Starting agent session", ms: 1500 },
      { text: "Reading the ask", ms: 1800 },
      { text: "Web search: “LA weekend forecast NWS”", ms: 3200 },
      { text: "Reading weather.gov/forecast/LAX", ms: 2800 },
      { text: "Completed web search: LA weather this weekend", ms: 2400 },
      { text: "Cross-checking hourly models", ms: 3000 },
      { text: "Checking the high surf advisory", ms: 2800 },
      { text: "Reconciling Saturday vs Sunday highs", ms: 3200 },
      { text: "Writing up the answer", ms: 2600 },
    ],
    loopFrom: 4,
    answer: [
      "Assuming you're in LA, it's partly sunny and warm today with a high of 88°F and a low of 68°F. Currently 72°F. Heads up there's a high surf advisory in effect through Tuesday night, with 4-7 foot breaking waves and dangerous rip currents along LA county beaches.",
    ],
    traceSteps: [
      { verb: "Ran", desc: "hourly forecast query for Los Angeles" },
      { verb: "Wrote", desc: "scratch summary of today's conditions" },
      { verb: "Searched", desc: "NWS advisories for LA county" },
      { verb: "Read", desc: "high surf advisory bulletin" },
    ],
    script: () => ({ durationMs: 9000, outcome: "done" }),
    toolCalls: () => 49,
  },
  {
    id: "ando",
    name: "Ando",
    photo: `${P}/agent-1.png`,
    hue: "#8d9188", // the disc's warm silver, deepened for the white card
    thoughts: [
      { text: "Starting agent session", ms: 1500 },
      { text: "Skimming the last 200 messages", ms: 2600 },
      { text: "Clustering topics by owner", ms: 3000 },
      { text: "Read yesterday's standup notes", ms: 2400 },
      { text: "Pulling open questions into a list", ms: 2800 },
      { text: "Cross-referencing the drag-threshold thread", ms: 3200 },
      { text: "Checking who owns the token pull", ms: 2600 },
      { text: "Drafting the summary", ms: 2800 },
      { text: "Trimming to standup length", ms: 2600 },
    ],
    loopFrom: 3,
    answer: [
      "Summary for standup: multi-select prototype review moved to 10:30 tomorrow — Jordan wants drag-threshold notes (3 vs 4, leaning 3). Sara flagged the selection wash should match the brand tint. Peter is pulling token values tonight.",
    ],
    traceSteps: [
      { verb: "Ran", desc: "message fetch over #design history" },
      { verb: "Wrote", desc: "topic clusters by owner" },
      { verb: "Searched", desc: "standup notes for open questions" },
      { verb: "Read", desc: "yesterday's decisions" },
    ],
    script: () => ({ durationMs: 12000, outcome: "done" }),
    toolCalls: () => 34,
  },
  {
    id: "yumi",
    name: "Yumi",
    photo: `${P}/yumi.png`,
    hue: "#72716d", // cat-and-blanket taupe
    thoughts: [
      { text: "Starting agent session", ms: 1500 },
      { text: "Opening the design file", ms: 2000 },
      { text: "Running token export", ms: 2800 },
      { text: "Read 128 color styles", ms: 2400 },
      { text: "Diffing brand/500 against staging", ms: 3000 },
      { text: "Flagging radius/md drift (10 → 8)", ms: 3000 },
      { text: "Diffing shadow/card y-offset", ms: 2800 },
      { text: "Writing up the changes", ms: 2600 },
    ],
    loopFrom: 3,
    answer: [
      "Token pull complete: brand/500 is #2563EB, selection wash is rgba(37,99,235,0.14), stroke/weak is #F0EFEE. Two drifted from staging: radius/md (10 → 8) and shadow/card (y-offset 2 → 1).",
    ],
    traceSteps: [
      { verb: "Ran", desc: "token export from the design file" },
      { verb: "Searched", desc: "staging theme for drift" },
      { verb: "Read", desc: "component-level overrides" },
      { verb: "Wrote", desc: "token diff summary" },
    ],
    // First attempt dies mid-run; rerun succeeds.
    script: (attempt) =>
      attempt <= 1
        ? { durationMs: 8000, outcome: "failed" }
        : { durationMs: 9000, outcome: "done" },
    toolCalls: (attempt) => (attempt <= 1 ? 18 : 27),
  },
  {
    id: "juno",
    name: "Juno",
    photo: `${P}/agent-3.png`,
    hue: "#2c76c5", // snow-globe blue
    thoughts: [
      { text: "Starting agent session", ms: 1500 },
      { text: "Reading the ask", ms: 1800 },
      { text: "Pulling five calendars", ms: 2600 },
      { text: "Checking Thursday's conflicts", ms: 2800 },
      { text: "Holding the 10:30 slot", ms: 2400 },
      { text: "Cross-checking timezones", ms: 2800 },
      { text: "Finding a 6-seat room", ms: 2600 },
      { text: "Drafting the invite", ms: 2600 },
    ],
    loopFrom: 3,
    answer: [
      "Booked: design review Thursday 10:30–11:00 in Koto (6 seats). Everyone's free — Jordan had a soft hold I bumped past. Invite is out with the Figma link attached.",
    ],
    traceSteps: [
      { verb: "Ran", desc: "availability sweep across 5 calendars" },
      { verb: "Read", desc: "Jordan's soft hold on Thursday" },
      { verb: "Searched", desc: "rooms with 6 seats free at 10:30" },
      { verb: "Wrote", desc: "the invite draft" },
    ],
    script: () => ({ durationMs: 10000, outcome: "done" }),
    toolCalls: () => 21,
  },
  {
    id: "trey",
    name: "Trey",
    photo: `${P}/agent-4.png`,
    hue: "#86463c", // portrait's warm brick
    thoughts: [
      { text: "Starting agent session", ms: 1500 },
      { text: "Reading the diff on #482", ms: 2400 },
      { text: "Tracing the drag-threshold change", ms: 3000 },
      { text: "Running the unit suite", ms: 3200 },
      { text: "Checking bundle size delta", ms: 2600 },
      { text: "Leaving inline notes", ms: 2800 },
      { text: "Summarizing the review", ms: 2400 },
    ],
    loopFrom: 3,
    answer: [
      "Reviewed #482: logic's sound, two nits inline (dead import, magic 3 → constant). Tests green — 212 passing — and bundle is +0.4kb. Approving with comments.",
    ],
    traceSteps: [
      { verb: "Read", desc: "the diff on #482" },
      { verb: "Ran", desc: "unit suite — 212 passing" },
      { verb: "Searched", desc: "usages of DRAG_THRESHOLD" },
      { verb: "Wrote", desc: "2 inline review comments" },
    ],
    script: () => ({ durationMs: 13000, outcome: "done" }),
    toolCalls: () => 41,
  },
  {
    id: "moss",
    name: "Moss",
    photo: `${P}/agent-5.png`,
    hue: "#a2ac52", // that green
    thoughts: [
      { text: "Starting agent session", ms: 1500 },
      { text: "Opening the RFC", ms: 2000 },
      { text: "Reading 34 comments", ms: 3000 },
      { text: "Grouping objections by theme", ms: 3000 },
      { text: "Checking which threads resolved", ms: 2800 },
      { text: "Pulling decision owners", ms: 2600 },
      { text: "Writing the digest", ms: 2600 },
    ],
    loopFrom: 3,
    answer: [
      "RFC digest: 34 comments, 3 threads still open. Consensus on collapse-by-default; naming is split into two camps; the perf question closed after Sara's benchmark. Full digest is in the doc.",
    ],
    traceSteps: [
      { verb: "Read", desc: "the RFC comment thread" },
      { verb: "Wrote", desc: "theme clusters with owners" },
      { verb: "Searched", desc: "linked benchmarks" },
      { verb: "Ran", desc: "a stale-thread check" },
    ],
    script: () => ({ durationMs: 11000, outcome: "done" }),
    toolCalls: () => 27,
  },
  {
    id: "kelvin",
    name: "Kelvin",
    photo: `${P}/agent-6.png`,
    hue: "#1c6d7d", // deep teal
    thoughts: [
      { text: "Starting agent session", ms: 1500 },
      { text: "Booting the preview build", ms: 2600 },
      { text: "Running visual diff on 24 screens", ms: 3400 },
      { text: "Checking the corner-stack overlap", ms: 2800 },
      { text: "Re-running the flaky spec", ms: 3000 },
      { text: "Filing the diff report", ms: 2600 },
    ],
    loopFrom: 2,
    answer: [
      "Visual sweep done: 24 screens, 1 real diff (corner-stack gap 4 → 2px — expected from the padding change), 1 flake that re-ran clean. Report linked.",
    ],
    traceSteps: [
      { verb: "Ran", desc: "visual regression on 24 screens" },
      { verb: "Read", desc: "the corner-stack diff" },
      { verb: "Ran", desc: "the flaky spec a second time" },
      { verb: "Wrote", desc: "the sweep report" },
    ],
    script: () => ({ durationMs: 14000, outcome: "done" }),
    toolCalls: () => 56,
  },
];

/* --------------------------------- engine --------------------------------- */

export type RunStatus = "working" | "done" | "failed" | "stopped";

// Per-spawn override of the agent's outcome script — used by the page's
// load-time simulation to seed long, already-underway runs. `startedAgoMs`
// backdates startedAt so elapsed readouts are accurate to how long the
// agent has actually been working, and keep ticking from there.
export type SpawnOverride = {
  durationMs?: number;
  outcome?: "done" | "failed";
  startedAgoMs?: number;
};

export type AgentRun = {
  id: string;
  agent: AgentDef;
  attempt: number;
  // The message that invoked the agent, and its text (mentions stripped —
  // the flyout sub-line shows the ask, not the address).
  messageId: string;
  prompt: string;
  startedAt: number;
  endedAt?: number;
  status: RunStatus;
  doneAt?: number;
  // removed = leaving (plays the exit animation); concealed = exit finished
  // (dropped from presence surfaces, kept in `runs` so message footers can
  // still resolve their trace). dismissed marks a user-initiated removal —
  // the corner skips its condensation farewell and leaves with the same
  // quick fade the flyout row uses.
  removed: boolean;
  dismissed?: boolean;
  concealed: boolean;
  answerMessageId?: string;
  override?: SpawnOverride;
  // Attribution for stopped runs ("stopped by you") — per the stop flow,
  // stops are never silent.
  stoppedBy?: string;
};

// Token-scoped ids: fast refresh re-evaluates the module (resetting the
// counter) while React state survives, so bare sequential ids would
// collide with runs already in state.
const RUN_ID_TOKEN = Math.random().toString(36).slice(2, 7);
let runCounter = 0;

export function useAgentEngine(
  onAgentAnswer: (run: AgentRun) => string
): {
  runs: AgentRun[];
  // Presence surfaces render visibleRuns: live rows plus removed-but-still-
  // animating-out ones (run.removed = leaving).
  visibleRuns: AgentRun[];
  spawn: (
    messageId: string,
    prompt: string,
    agents: AgentDef[],
    override?: SpawnOverride
  ) => void;
  stop: (runId: string) => void;
  rerun: (runId: string) => void;
  remove: (runId: string) => void;
  conceal: (runId: string) => void;
} {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  // Ticks every second so elapsed readouts and thought lines advance in
  // real time even when no run is transitioning — setRuns alone bails out
  // of re-rendering on quiet seconds.
  const [, setTick] = useState(0);
  const answerRef = useRef(onAgentAnswer);
  // Stagger timers for consecutive spawns; cleared on unmount.
  const spawnTimersRef = useRef<number[]>([]);
  useEffect(() => {
    answerRef.current = onAgentAnswer;
  });
  useEffect(() => {
    const timers = spawnTimersRef.current;
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  // 1s heartbeat: advances elapsed displays, resolves finished runs, and
  // fades lingering done runs out of the flyout after 5s (per the spec
  // annotation) — the posted answer is the durable record.
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
      setRuns((prev) => {
        const now = Date.now();
        let changed = false;
        const next = prev.map((run) => {
          if (run.status === "working") {
            const script = run.agent.script(run.attempt);
            const durationMs = run.override?.durationMs ?? script.durationMs;
            const outcome = run.override?.outcome ?? script.outcome;
            if (now - run.startedAt >= durationMs) {
              changed = true;
              return {
                ...run,
                status: outcome,
                endedAt: now,
                doneAt: outcome === "done" ? now : undefined,
              };
            }
          } else if (
            run.status === "done" &&
            !run.removed &&
            run.doneAt != null &&
            now - run.doneAt > 5000
          ) {
            changed = true;
            return { ...run, removed: true };
          }
          return run;
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Post the answer message once per completed run. Runs post-render so the
  // message append never happens inside a state updater.
  useEffect(() => {
    runs.forEach((run) => {
      if (run.status === "done" && run.answerMessageId == null) {
        const messageId = answerRef.current(run);
        setRuns((prev) =>
          prev.map((r) => (r.id === run.id ? { ...r, answerMessageId: messageId } : r))
        );
      }
    });
  }, [runs]);

  const spawn = useCallback(
    (messageId: string, prompt: string, agents: AgentDef[], override?: SpawnOverride) => {
      // Agents spawn consecutively (~half a beat apart), not all at once —
      // each bubble/chip gets its own arrival.
      agents.forEach((agent, index) => {
        const create = () =>
          setRuns((prev) => [
            ...prev,
            {
              id: `run-${RUN_ID_TOKEN}-${++runCounter}`,
              agent,
              attempt: 1,
              messageId,
              prompt,
              // Backdated for seeded runs — elapsed stays accurate to how
              // long the agent has actually been working.
              startedAt: Date.now() - (override?.startedAgoMs ?? 0),
              status: "working" as const,
              removed: false,
              concealed: false,
              override,
            },
          ]);
        if (index === 0) create();
        else spawnTimersRef.current.push(window.setTimeout(create, index * 500));
      });
    },
    []
  );

  const stop = useCallback((runId: string) => {
    setRuns((prev) =>
      prev.map((r) =>
        r.id === runId && r.status === "working"
          ? { ...r, status: "stopped", endedAt: Date.now(), stoppedBy: "you" }
          : r
      )
    );
  }, []);

  // Rerun keeps the run's identity (same prompt, same chip) but starts a
  // fresh attempt — per the spec: "rerun the agent on the prompt it failed
  // on". Seed overrides don't carry over; attempt 2 runs the agent's own
  // script, so a seeded failure can succeed on rerun.
  const rerun = useCallback((runId: string) => {
    setRuns((prev) =>
      prev.map((r) =>
        r.id === runId
          ? {
              ...r,
              attempt: r.attempt + 1,
              status: "working",
              startedAt: Date.now(),
              endedAt: undefined,
              doneAt: undefined,
              override: undefined,
            }
          : r
      )
    );
  }, []);

  const remove = useCallback((runId: string) => {
    // User delete: quick dismissal, not the long depart.
    setRuns((prev) =>
      prev.map((r) => (r.id === runId ? { ...r, removed: true, dismissed: true } : r)),
    );
  }, []);

  // Called from the leaving element's animationend — after the exit motion
  // the run drops out of the presence surfaces for good.
  const conceal = useCallback((runId: string) => {
    setRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, concealed: true } : r)));
  }, []);

  return {
    runs,
    visibleRuns: runs.filter((r) => !r.concealed),
    spawn,
    stop,
    rerun,
    remove,
    conceal,
  };
}

/* -------------------------------- helpers --------------------------------- */

export function formatDuration(ms: number): string {
  const total = Math.max(1, Math.round(ms / 1000));
  if (total < 60) return `${total}s`;
  return `${Math.floor(total / 60)}m ${total % 60}s`;
}

function elapsedMs(run: AgentRun): number {
  return (run.endedAt ?? Date.now()) - run.startedAt;
}

// Live status line: walks the agent's scripted thought beats (uneven dwell
// times), then cycles the working tail from `loopFrom` so long runs stay
// visibly alive; settles on the outcome (answer preview / failed / stopped).
export function statusLine(run: AgentRun): string {
  if (run.status === "working") {
    const beats = run.agent.thoughts;
    let t = elapsedMs(run);
    for (const beat of beats) {
      if (t < beat.ms) return beat.text;
      t -= beat.ms;
    }
    const loop = beats.slice(Math.min(run.agent.loopFrom ?? 1, beats.length - 1));
    let r = t % loop.reduce((sum, beat) => sum + beat.ms, 0);
    for (const beat of loop) {
      if (r < beat.ms) return beat.text;
      r -= beat.ms;
    }
    return loop[loop.length - 1].text;
  }
  if (run.status === "done") return run.agent.answer[0];
  if (run.status === "stopped") return "Agent stopped";
  return "Agent failed";
}

/* -------------------------------- avatars --------------------------------- */

// Sparkle mark for agents without a photo — tinted disc, white spark.
function SparkleAvatar({ size, tint }: { size: number; tint?: string }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: tint ?? "#1c1917" }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 16 16" aria-hidden>
        <path
          d="M8 1.5l1.55 4.1a1 1 0 00.58.58L14.5 8l-4.37 1.82a1 1 0 00-.58.58L8 14.5l-1.55-4.1a1 1 0 00-.58-.58L1.5 8l4.37-1.82a1 1 0 00.58-.58L8 1.5z"
          fill="#fff"
        />
      </svg>
    </span>
  );
}

export function AgentFace({ agent, size }: { agent: AgentDef; size: number }) {
  if (agent.photo == null) return <SparkleAvatar size={size} tint={agent.tint} />;
  return (
    <img
      src={agent.photo}
      alt=""
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

const RING_COLOR: Record<RunStatus, string> = {
  working: "#8aa48d",
  done: "#16A34A",
  failed: "#DC2626",
  stopped: "#DC2626",
};

// Status ring drawn around a face. Working = amber dashed orbit; done =
// sealed green; failed/stopped = solid red. `disc` fills the ring interior
// (white for the corner bubbles per Figma 17690-16754; omit on dark rows).
//
// State changes get staged transitions: resolving draws the outcome ring
// closed over the fading dashes (seal), success/rerun pops, failure shakes.
export function RingedFace({
  agent,
  status,
  size = 28,
  strokeWidth = 1.5,
  disc = false,
  failPulse = false,
}: {
  agent: AgentDef;
  status: RunStatus;
  size?: number;
  strokeWidth?: number;
  disc?: boolean;
  /** Corner attention grammar: the red verdict ring breathes while failed. */
  failPulse?: boolean;
}) {
  // "Adjust state during render" pattern — detect the status flip without
  // an effect, so the seal overlay mounts on the exact transition frame.
  const [prevStatus, setPrevStatus] = useState(status);
  const [seal, setSeal] = useState<RunStatus | null>(null);
  // Success pop is sequenced after the seal (aw-after-seal), so it outlives
  // the seal state and clears on its own animation end.
  const [celebrate, setCelebrate] = useState(false);
  const [restarted, setRestarted] = useState(false);
  if (prevStatus !== status) {
    setPrevStatus(status);
    if (prevStatus === "working") {
      setSeal(status);
      if (status === "done") setCelebrate(true);
    } else if (status === "working") {
      // Rerun kicking back in — clear any leftover seal, pop the ring.
      setSeal(null);
      setCelebrate(false);
      setRestarted(true);
    }
  }

  const center = size / 2;
  const working = status === "working";
  // Failure carries extra weight — the not-completed verdict draws
  // noticeably heavier than done/stopped.
  const verdictStroke = status === "failed" ? strokeWidth + 0.75 : strokeWidth;
  const radius = center - verdictStroke / 2;
  const circumference = 2 * Math.PI * radius;
  // Failure jolts immediately; success celebrates after the seal closes.
  const wrapperFx =
    seal != null && seal !== "done"
      ? "aw-shake"
      : celebrate
        ? "aw-scale-pop aw-after-seal"
        : restarted
          ? "aw-scale-pop"
          : "";

  return (
    <span
      // aw-breathe: the working bubble inhales/exhales. Transition
      // classes (pop, shake) are defined later in the CSS, so they take
      // the animation shorthand for their moment and hand it back.
      className={`relative shrink-0 rounded-full ${disc ? "bg-white" : ""} ${
        working ? "aw-breathe" : ""
      } ${wrapperFx}`}
      style={{ width: size, height: size }}
      onAnimationEnd={(event) => {
        if (event.animationName === "aw-seal-draw") setSeal(null);
        if (event.animationName === "aw-scale-pop") {
          setCelebrate(false);
          setRestarted(false);
        }
      }}
    >
      {/* Working comet — the Kinetic set's W2: one bright head, fading
          tail, on a 1.6s orbit. Brand blue by default; carries the
          agent's portrait tone so the page-level .aw-hue-portrait class
          can flip every comet at once. Kept mounted while sealing so it
          fades under the outcome ring instead of vanishing. */}
      {working || seal != null ? (
        <span
          className={`aw-comet ${seal != null ? "aw-ring-fade" : ""}`}
          style={agent.hue ? ({ "--aw-tint": agent.hue } as React.CSSProperties) : undefined}
          aria-hidden
        />
      ) : null}
      {/* Outcome ring: draws itself closed during the seal, solid after.
          On a corner failure it throbs in place (class on the svg, so it
          never fights the circle's seal-draw animation shorthand). */}
      {!working ? (
        <svg
          width={size}
          height={size}
          className={`absolute inset-0 ${failPulse && status === "failed" ? "aw-fail-throb" : ""}`}
          aria-hidden
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={verdictStroke}
            stroke={RING_COLOR[seal ?? status]}
            strokeLinecap="round"
            className={seal != null ? "aw-seal-draw" : ""}
            strokeDasharray={seal != null ? circumference : undefined}
            strokeDashoffset={seal != null ? circumference : undefined}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </svg>
      ) : null}
      <span className="absolute inset-0 flex items-center justify-center">
        {/* Tight geometry: the ring hugs the portrait — ~1px of air
            between face edge and stroke, not a moat. */}
        <span className="relative inline-flex overflow-hidden rounded-full">
          <AgentFace agent={agent} size={size - 6} />
          {/* A very slight glint crosses the portrait while working. */}
          {working ? <span className="aw-faceshine" aria-hidden /> : null}
        </span>
      </span>
    </span>
  );
}

/* ------------------------------ inline chips ------------------------------- */

// Session chips under the invoking message. Working: label + elapsed + stop.
// Failed/stopped: red label (with stop attribution) + final elapsed + a
// trace affordance — a dead run should explain itself one click away.
// Done: chip disappears (the answer message is the completion signal).
export function SessionChips({
  runs,
  onStop,
  onOpenTrace,
}: {
  runs: AgentRun[];
  onStop: (runId: string) => void;
  onOpenTrace: (runId: string) => void;
}) {
  const visible = runs.filter((r) => r.status !== "done");
  if (visible.length === 0) return null;
  return (
    <div className="mt-1 flex flex-col gap-1">
      {visible.map((run) => (
        <div key={run.id} className="flex h-5 items-center gap-2">
          <AgentFace agent={run.agent} size={16} />
          {run.status === "working" ? (
            <>
              {/* Live thought line, shimmering while the agent works;
                  beats swap in place. */}
              <span className="aw-shimmer-light min-w-0 truncate text-[13px] leading-4">
                {statusLine(run)}
              </span>
              <span className="shrink-0 text-[12px] leading-4 tabular-nums text-[#a8a29e]">
                {formatDuration(elapsedMs(run))}
              </span>
              <button
                type="button"
                onClick={() => onStop(run.id)}
                className="flex h-5 items-center rounded-[5px] border-[0.5px] border-[#e7e5e4] px-1.5 text-[11px] leading-4 text-[#58524e] transition-colors hover:bg-[#f5f5f4]"
              >
                stop
              </button>
            </>
          ) : (
            <>
              {/* Resolved chips share one quiet grammar: the red label
                  with the flyout's chevron beside it, into the trace. */}
              <button
                type="button"
                onClick={() => onOpenTrace(run.id)}
                className="group/chip flex items-center gap-0.5 text-[13px] leading-4 text-[#dc2626]"
              >
                {run.status === "stopped" ? `Stopped by ${run.stoppedBy ?? "you"}` : "Failed"}
                <span className="text-[#a8a29e] transition-colors group-hover/chip:text-[#58524e]">
                  <ChevronGlyph />
                </span>
              </button>
              <span className="text-[12px] leading-4 tabular-nums text-[#a8a29e]">
                {formatDuration(elapsedMs(run))}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ corner stack ------------------------------- */

// "+N" disc occupying the fourth slot when the stack overflows — Vercel
// Toolbar's collapsed-count pattern. A full solid circle, no status ring:
// a count is not an alarm, and status belongs to the agents themselves
// (failures persist in the flyout until addressed).
function OverflowDisc({ count }: { count: number }) {
  return (
    <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#1c1917] text-[11px] font-medium leading-none text-white">
      {`+${count}`}
    </span>
  );
}

// Bottom-right presence, per Figma 17690-16754: 34px ringed bubbles on a
// white disc, 4px white gap-ring, stacked with an 8px overlap (later bubble
// on top). At 5+ agents the fourth slot becomes a "+N" disc. Hovering the
// stack opens the flyout; clicking an individual bubble jumps to the
// message that invoked that agent.
export function CornerStack({
  runs,
  onHoverChange,
  onJumpRun,
  onConceal,
}: {
  runs: AgentRun[];
  onHoverChange: (hovering: boolean) => void;
  onJumpRun: (run: AgentRun) => void;
  onConceal: (runId: string) => void;
}) {
  const overflowing = runs.length > 4;
  const visible = runs.slice(0, overflowing ? 3 : 4);
  const hidden = overflowing ? runs.slice(3) : [];
  return (
    // Padded hover halo (mock wraps the bubbles in a 16px hover zone) —
    // offsets compensate so the rings still sit at right-16 / bottom-132.
    <div
      className="absolute bottom-[124px] right-2 z-40 flex items-center p-2"
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {visible.map((run, index) => (
        <button
          key={run.id}
          type="button"
          aria-label={`Jump to ${run.agent.name}'s invoking message`}
          onClick={() => onJumpRun(run)}
          // Condense in when a run spawns. Natural departures dissolve out
          // with the condensation farewell (overlapped bubbles hold their −8
          // margin so the face doesn't slide right mid-exit); a user delete
          // instead leaves with the flyout row's quick fade. Conceal on
          // animationend closes the gap either way.
          className={`relative flex rounded-full ${
            run.removed
              ? run.dismissed
                ? "aw-chip-dismiss"
                : index > 0
                  ? "aw-chip-out-overlap"
                  : "aw-chip-out"
              : "aw-chip-in"
          }`}
          onAnimationEnd={(event) => {
            if (
              event.animationName === "aw-chip-out" ||
              event.animationName === "aw-chip-out-overlap" ||
              event.animationName === "aw-chip-dismiss"
            )
              onConceal(run.id);
          }}
          // Overlap lives on each bubble's own left margin so appending a
          // newcomer never touches an existing bubble's styles (no snap).
          style={{
            marginLeft: index > 0 ? -8 : 0,
            boxShadow: "0 0 0 2px white",
          }}
        >
          {/* failPulse: the red verdict ring breathes in place until the
              failure is addressed. Failed only — a stop was the user's
              own act, so it rests. */}
          <RingedFace agent={run.agent} status={run.status} size={30} strokeWidth={2} disc failPulse />
          {/* Completion ping — mounts exactly when the run turns green. */}
          {run.status === "done" ? (
            <span aria-hidden className="aw-ping absolute inset-0 rounded-full" />
          ) : null}
        </button>
      ))}
      {overflowing ? (
        <button
          type="button"
          aria-label={`${hidden.length} more agents`}
          // No single message to jump to — opening the roster is the answer
          // (and gives touch a path to it).
          onClick={() => onHoverChange(true)}
          className="aw-chip-in flex rounded-full"
          style={{ marginLeft: -8, boxShadow: "0 0 0 2px white" }}
        >
          <OverflowDisc count={hidden.length} />
        </button>
      ) : null}
    </div>
  );
}

/* ---------------------------- jump-to-latest ------------------------------- */

// Dynamic-island pill (Figma 17840-6080): appears when answers land while
// you're scrolled away, carrying the faces of who posted. Springs up from
// the transcript's bottom edge, bumps on retarget, retracts on click or
// when you reach the bottom yourself.
export function JumpToLatestPill({
  leaving,
  bumpKey,
  faces,
  onJump,
  onExited,
}: {
  leaving: boolean;
  bumpKey: number;
  faces: AgentDef[];
  onJump: () => void;
  onExited: () => void;
}) {
  return (
    // Positioning wrapper stays static — the animated element must not own
    // the centering translate, or the keyframe transforms would evict it.
    <div className="pointer-events-none absolute inset-x-0 bottom-[148px] z-30 flex justify-center">
      <button
        type="button"
        onClick={onJump}
        onAnimationEnd={(event) => {
          if (event.animationName === "aw-pill-out") onExited();
        }}
        className={`pointer-events-auto flex h-8 items-center gap-1.5 rounded-full bg-[#1b1b1b] pl-2.5 pr-3 shadow-[0px_8px_24px_-6px_rgba(16,16,16,0.4),0px_0px_0.5px_0.75px_rgba(16,16,16,0.2)] ${
          leaving ? "aw-pill-out" : "aw-pill-in"
        }`}
      >
        {/* Retarget: new arrivals bump the content, not the container. */}
        <span key={bumpKey} className="aw-pill-bump flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="text-white">
            <path
              d="M6 2v8M2.8 6.8L6 10l3.2-3.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[12px] leading-4 text-white">Jump to latest</span>
          {faces.length > 0 ? (
            <span className="flex items-center">
              {faces.slice(0, 2).map((agent, index) => (
                <span
                  key={agent.id}
                  className="rounded-full"
                  style={{
                    marginLeft: index > 0 ? -4 : 2,
                    boxShadow: "0 0 0 2px #1b1b1b",
                  }}
                >
                  <AgentFace agent={agent} size={16} />
                </span>
              ))}
            </span>
          ) : null}
        </span>
      </button>
    </div>
  );
}

/* ------------------------------ small icons -------------------------------- */

function StopGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <rect x="2.5" y="2.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function RerunGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <path
        d="M9.8 6a3.8 3.8 0 11-1.1-2.7M9.8 1.6v2.2H7.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden>
      <path
        d="M3 3l6 6M9 3l-6 6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronGlyph() {
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

/* --------------------------------- flyout ---------------------------------- */

const WINDOW = 4;

export function AgentFlyout({
  runs,
  closing = false,
  onClose,
  onExited,
  onHoverChange,
  onStop,
  onRerun,
  onRemove,
  onJump,
  onTrace,
}: {
  runs: AgentRun[];
  closing?: boolean;
  onClose: () => void;
  onExited: () => void;
  onHoverChange: (hovering: boolean) => void;
  onStop: (runId: string) => void;
  onRerun: (runId: string) => void;
  onRemove: (runId: string) => void;
  onJump: (run: AgentRun) => void;
  onTrace: (run: AgentRun) => void;
}) {
  const [page, setPage] = useState(0);
  // Rows present when the panel opened render settled (the panel pop is
  // their entrance); only runs that spawn while the panel is up play the
  // short row-in. Snapshot the opening roster once, on first render.
  const openingIdsRef = useRef<Set<string> | null>(null);
  if (openingIdsRef.current === null) {
    openingIdsRef.current = new Set(runs.map((run) => run.id));
  }
  const openingIds = openingIdsRef.current;

  const rows = runs;
  // Clamp the window when rows shrink under the current page.
  const pageCount = Math.max(1, Math.ceil(rows.length / WINDOW));
  const safePage = Math.min(page, pageCount - 1);
  const windowRows = rows.slice(safePage * WINDOW, safePage * WINDOW + WINDOW);

  return (
    // 16px above the corner bubbles (ring top = 166 from the main-card
    // bottom in the reference frame), right-aligned with them. Closing
    // plays the pop-out, then onExited unmounts (checked by name — row
    // animations bubble up here too).
    <div
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onAnimationEnd={(event) => {
        if (event.animationName === "aw-pop-out") onExited();
      }}
      className={`absolute bottom-[182px] right-4 z-40 w-[360px] overflow-hidden rounded-[10px] bg-[#1b1b1b] shadow-[0px_16px_32px_-8px_rgba(16,16,16,0.4),0px_0px_0.5px_0.75px_rgba(16,16,16,0.2)] ${
        closing ? "aw-pop-exit" : "aw-pop-enter"
      }`}
    >
      <div className="flex h-9 items-center justify-between border-b border-white/10 pl-3 pr-2">
        <span className="text-[13px] font-medium leading-4 text-white">Active agents</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-6 items-center justify-center rounded-[5px] text-[#8a8a8a] transition-colors hover:bg-white/10 hover:text-white"
        >
          <CloseGlyph />
        </button>
      </div>

      {windowRows.length === 0 ? (
        <div className="flex h-16 items-center justify-center text-[12px] text-[#8a8a8a]">
          No active agents
        </div>
      ) : (
        <div className="flex flex-col p-1">
          {windowRows.map((run) => (
            <FlyoutRow
              key={run.id}
              run={run}
              entering={!openingIds.has(run.id)}
              onStop={onStop}
              onRerun={onRerun}
              onRemove={onRemove}
              onJump={onJump}
              onTrace={onTrace}
            />
          ))}
        </div>
      )}

      {/* Pager — the spec only renders this section at 5+ agents. */}
      {rows.length > WINDOW ? (
        <div className="flex h-9 items-center justify-between border-t border-white/10 pl-3 pr-2">
          <span className="text-[12px] text-[#8a8a8a]">
            {`Showing ${windowRows.length} of ${rows.length} agents`}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              aria-label="Previous agents"
              className="flex size-6 rotate-180 items-center justify-center rounded-[5px] text-[#8a8a8a] transition-colors enabled:hover:bg-white/10 enabled:hover:text-white disabled:opacity-30"
            >
              <ChevronGlyph />
            </button>
            <button
              type="button"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(safePage + 1)}
              aria-label="Next agents"
              className="flex size-6 items-center justify-center rounded-[5px] text-[#8a8a8a] transition-colors enabled:hover:bg-white/10 enabled:hover:text-white disabled:opacity-30"
            >
              <ChevronGlyph />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FlyoutRow({
  run,
  onStop,
  onRerun,
  onRemove,
  onJump,
  onTrace,
  entering = false,
}: {
  run: AgentRun;
  onStop: (runId: string) => void;
  onRerun: (runId: string) => void;
  onRemove: (runId: string) => void;
  onJump: (run: AgentRun) => void;
  onTrace: (run: AgentRun) => void;
  entering?: boolean;
}) {
  const working = run.status === "working";
  const failed = run.status === "failed" || run.status === "stopped";
  return (
    // Row click returns to the invoked message; inner controls stop the
    // bubble so stop/rerun/remove/trace never double as navigation. In
    // and out share one short gesture: a quick fade while the row's
    // space opens or closes; conceal drops the run when the out ends.
    <div
      role="button"
      tabIndex={0}
      onClick={() => onJump(run)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onJump(run);
      }}
      // No conceal here — the corner bubble is the single conceal source
      // (it is always mounted; this panel may not be). The row just holds
      // its finished exit frame until the run is concealed.
      className={`group flex cursor-pointer items-center gap-2.5 rounded-[8px] p-2 text-left transition-colors hover:bg-white/5 ${
        run.removed ? "aw-row-out" : entering ? "aw-row-in" : ""
      }`}
    >
      <RingedFace agent={run.agent} status={run.status} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onTrace(run);
            }}
            className="flex min-w-0 items-center gap-1 text-left"
          >
            {/* Thought beats swap in place — the shimmer alone signals live
                work; no roll on text changes. */}
            <span
              className={`truncate text-[13px] leading-4 ${
                working ? "aw-shimmer-dark" : "text-white"
              }`}
            >
              {statusLine(run)}
            </span>
            <span className="shrink-0 text-[#8a8a8a] transition-colors group-hover:text-white/80">
              <ChevronGlyph />
            </span>
          </button>
        </span>
        <span className="truncate text-[12px] leading-4 text-[#8a8a8a]">
          {/* Stops carry attribution instead of the prompt — never silent. */}
          {run.status === "stopped" && run.stoppedBy != null
            ? `↳ Stopped by ${run.stoppedBy}`
            : `↳ ${run.prompt}`}
        </span>
      </span>

      {/* Elapsed swaps to controls on hover, per the spec annotation. */}
      <span className="shrink-0 text-[12px] leading-4 tabular-nums text-[#8a8a8a] group-hover:hidden">
        {formatDuration(elapsedMs(run))}
      </span>
      <span className="hidden shrink-0 items-center gap-1 group-hover:flex">
        {working ? (
          <button
            type="button"
            aria-label="Stop agent"
            onClick={(event) => {
              event.stopPropagation();
              onStop(run.id);
            }}
            className="flex size-6 items-center justify-center rounded-[5px] text-[#8a8a8a] transition-colors hover:bg-white/10 hover:text-white"
          >
            <StopGlyph />
          </button>
        ) : (
          <>
            {failed ? (
              <button
                type="button"
                aria-label="Rerun agent"
                onClick={(event) => {
                  event.stopPropagation();
                  onRerun(run.id);
                }}
                className="flex size-6 items-center justify-center rounded-[5px] text-[#8a8a8a] transition-colors hover:bg-white/10 hover:text-white"
              >
                <RerunGlyph />
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Remove agent"
              onClick={(event) => {
                event.stopPropagation();
                onRemove(run.id);
              }}
              className="flex size-6 items-center justify-center rounded-[5px] text-[#8a8a8a] transition-colors hover:bg-white/10 hover:text-white"
            >
              <CloseGlyph />
            </button>
          </>
        )}
      </span>
    </div>
  );
}

/* ------------------------------- trace modal -------------------------------- */

export type TraceView = {
  outcome: RunStatus;
  toolCalls: number;
  workedForMs: number;
  steps: TraceStep[];
  visibleSteps: number;
  stoppedBy?: string;
};

export function traceViewFromRun(run: AgentRun): TraceView {
  const elapsed = elapsedMs(run);
  const resolved = run.status !== "working";
  return {
    outcome: run.status,
    toolCalls: run.agent.toolCalls(run.attempt),
    workedForMs: elapsed,
    stoppedBy: run.stoppedBy,
    steps: run.agent.traceSteps,
    // While working, steps reveal progressively so the modal feels live.
    visibleSteps: resolved
      ? run.agent.traceSteps.length
      : Math.min(run.agent.traceSteps.length, 1 + Math.floor(elapsed / 2200)),
  };
}

const TRACE_VERB_GLYPHS: Record<string, React.ReactNode> = {
  Ran: (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect x="2" y="2" width="10" height="10" rx="2" fill="none" stroke="#78716c" strokeWidth="1.1" />
      <path d="M6 5l3 2-3 2z" fill="#78716c" />
    </svg>
  ),
  Wrote: (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path
        d="M9.5 2.5l2 2L5 11l-2.5.5L3 9l6.5-6.5z"
        fill="none"
        stroke="#78716c"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Searched: (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <circle cx="6" cy="6" r="3.5" fill="none" stroke="#78716c" strokeWidth="1.1" />
      <path d="M8.8 8.8l2.7 2.7" stroke="#78716c" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  ),
  Read: (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect x="3" y="1.8" width="8" height="10.4" rx="1.5" fill="none" stroke="#78716c" strokeWidth="1.1" />
      <path d="M5 5h4M5 7h4M5 9h2.5" stroke="#78716c" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  ),
};

export function TraceModal({
  trace,
  onClose,
}: {
  trace: TraceView;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const summary =
    trace.outcome === "working"
      ? `Working · ${formatDuration(trace.workedForMs)} elapsed`
      : `${
          trace.outcome === "done"
            ? "Completed"
            : trace.outcome === "failed"
              ? "Failed"
              : trace.stoppedBy != null
                ? `Stopped by ${trace.stoppedBy}`
                : "Stopped"
        } · ${trace.toolCalls} tool calls · Worked for ${formatDuration(trace.workedForMs)}`;

  return (
    // Dimmed backdrop (black/20) — also the click-away layer.
    <div className="fixed inset-0 z-50 bg-black/20" onClick={onClose}>
      <div className="flex h-full items-center justify-center">
        <div
          role="dialog"
          aria-label="Agent trace"
          onClick={(event) => event.stopPropagation()}
          className="aw-modal-enter w-[520px] max-w-[calc(100vw-48px)] rounded-[12px] bg-white shadow-[0px_24px_48px_-12px_rgba(16,16,16,0.28),0px_0px_0.5px_0.75px_rgba(16,16,16,0.08)]"
        >
          <div className="border-b border-[#f0efee] px-5 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-medium leading-5 text-[#1a1817]">
                Agent trace
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close trace"
                className="flex size-6 items-center justify-center rounded-[5px] text-[#78716c] transition-colors hover:bg-[#f5f5f4] hover:text-[#1a1817]"
              >
                <CloseGlyph size={14} />
              </button>
            </div>
            <div className="mt-1 text-[13px] leading-4 text-[#78716c]">{summary}</div>
          </div>

          <div className="flex flex-col px-5 py-4">
            <TraceNode
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                  <circle
                    cx="7"
                    cy="7"
                    r="5.5"
                    fill="none"
                    stroke="#a8a29e"
                    strokeWidth="1.1"
                    strokeDasharray="2 2.4"
                  />
                </svg>
              }
              label="Task started"
            />
            {trace.steps.slice(0, trace.visibleSteps).map((step, index) => (
              <div key={index} className="flex items-center gap-2 py-[3px] pl-7">
                <span className="flex size-4 items-center justify-center">
                  {TRACE_VERB_GLYPHS[step.verb] ?? TRACE_VERB_GLYPHS.Ran}
                </span>
                <span className="text-[13px] leading-5">
                  <span className="font-medium text-[#1a1817]">{step.verb}</span>
                  <span className="text-[#78716c]">{`  ${step.desc}`}</span>
                </span>
              </div>
            ))}
            <TraceNode
              icon={
                <span
                  className={`size-[5px] rounded-full bg-[#a8a29e] ${
                    trace.outcome === "working" ? "aw-pulse" : ""
                  }`}
                />
              }
              label="Thinking"
            />
            {trace.outcome !== "working" ? (
              <>
                <span aria-hidden className="ml-[7px] h-3 w-px bg-[#e7e5e4]" />
                <TraceNode
                  icon={
                    trace.outcome === "done" ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                        <circle cx="7" cy="7" r="6" fill="#16A34A" />
                        <path
                          d="M4.5 7l1.8 1.8L9.7 5.4"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                        <circle
                          cx="7"
                          cy="7"
                          r="6"
                          fill={trace.outcome === "failed" ? "#DC2626" : "#a8a29e"}
                        />
                        {trace.outcome === "failed" ? (
                          <path
                            d="M5 5l4 4M9 5l-4 4"
                            stroke="#fff"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                          />
                        ) : (
                          <rect x="4.6" y="4.6" width="4.8" height="4.8" rx="1" fill="#fff" />
                        )}
                      </svg>
                    )
                  }
                  label={
                    trace.outcome === "done"
                      ? "Task complete"
                      : trace.outcome === "failed"
                        ? "Task failed"
                        : trace.stoppedBy != null
                          ? `Task stopped by ${trace.stoppedBy}`
                          : "Task stopped"
                  }
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function TraceNode({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 py-[3px]">
      <span className="flex size-4 items-center justify-center">{icon}</span>
      <span className="text-[13px] font-medium leading-5 text-[#1a1817]">{label}</span>
    </div>
  );
}
