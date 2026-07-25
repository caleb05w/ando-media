"use client";

/* Simulated agent fleet for /agent-flyout.

   Everything is derived from wall-clock time against a per-agent script of
   tool steps — a single 300ms tick re-derives every agent's state, so there
   are no per-agent timers to leak or reconcile:
   - working: elapsed walks the script; the current step is the "tool invoked".
   - failed: a script with `failAt` dies partway through that step and then
     persists until addressed (retry restarts the clock and succeeds; dismiss
     removes). Per the flow: attribution + retry/close live on the row.
   - awaitingInput (v2, per Linear's AIG session states): a script with
     `askAt` blocks before that step and holds a question until answered;
     answering rebases the clock so the run resumes seamlessly.
   - success: lingers ~2.4s with the green ring, then animates out. */

import { useCallback, useEffect, useRef, useState } from "react";

export type AgentState = "working" | "failed" | "awaitingInput" | "success";

export type AgentStep = { tool: string; ms: number };

export type AgentSpec = {
  key: string;
  name: string;
  task: string;
  invokedBy: string;
  steps: AgentStep[];
  // Index of the step that errors on the first attempt.
  failAt?: number;
  error?: string;
  // Index of the step the agent blocks before, until the user answers.
  // (A spec should use failAt or askAt, not both.)
  askAt?: number;
  question?: string;
  options?: string[];
};

// Fraction of the failing step that runs before the error lands.
const FAIL_POINT = 0.7;
const SUCCESS_LINGER_MS = 2400;
const LEAVE_MS = 220;

export const AGENT_SPECS: AgentSpec[] = [
  {
    key: "scout",
    name: "Scout",
    task: "Digest this thread into a decisions doc",
    invokedBy: "you",
    steps: [
      { tool: "Reading thread (28 messages)", ms: 5200 },
      { tool: "Searching #design history", ms: 4800 },
      { tool: "Drafting decisions doc", ms: 6400 },
      { tool: "Posting summary to thread", ms: 2600 },
    ],
    askAt: 3,
    question: "Post the doc to the channel, or keep it in this thread?",
    options: ["Channel", "Thread"],
  },
  {
    key: "redline",
    name: "Redline",
    task: "Compare the mock against staging tokens",
    invokedBy: "you",
    steps: [
      { tool: "Fetching Figma frame 17167-17686", ms: 4200 },
      { tool: "Extracting color + type tokens", ms: 3800 },
      { tool: "Diffing against tailwind.config", ms: 5200 },
      { tool: "Writing redline report", ms: 3600 },
    ],
  },
  {
    key: "shipit",
    name: "Shipit",
    task: "Open a PR for the header fix",
    invokedBy: "you",
    steps: [
      { tool: "Cloning ando/web", ms: 3200 },
      { tool: "Applying header patch", ms: 2800 },
      { tool: "Running pnpm build", ms: 4600 },
      { tool: "Opening pull request", ms: 2400 },
    ],
    failAt: 2,
    error: "pnpm build failed — type error in composer.tsx:143",
  },
  {
    key: "minutes",
    name: "Minutes",
    task: "Collect action items from standup",
    invokedBy: "you",
    steps: [
      { tool: "Scanning yesterday's standup", ms: 3600 },
      { tool: "Extracting action items", ms: 4200 },
      { tool: "Cross-checking owners", ms: 3800 },
      { tool: "Posting checklist to #design", ms: 2400 },
    ],
  },
  {
    key: "digest",
    name: "Digest",
    task: "Summarize the 6 links shared today",
    invokedBy: "you",
    steps: [
      { tool: "Collecting shared links", ms: 4400 },
      { tool: "Reading 6 articles", ms: 6800 },
      { tool: "Writing channel digest", ms: 5200 },
    ],
  },
  {
    key: "vibe",
    name: "Vibe",
    task: "Rename the launch playlist",
    invokedBy: "you",
    steps: [
      { tool: "Reading channel vibes", ms: 3400 },
      { tool: "Consulting taste model", ms: 5600 },
      { tool: "Committing the rename", ms: 2000 },
    ],
  },
];

type LiveAgent = {
  id: string;
  spec: AgentSpec;
  startedAt: number;
  attempt: number;
  answered: boolean;
  leavingAt: number | null;
};

export type DerivedStep = AgentStep & {
  status: "done" | "current" | "todo" | "errored";
  // Actual run time for finished steps (script time; the failed step reports
  // its partial run).
  ranMs: number;
};

export type DerivedAgent = {
  id: string;
  name: string;
  task: string;
  invokedBy: string;
  state: AgentState;
  // Tool currently invoked (working), the tool that errored (failed), the
  // blocked step (awaitingInput), or the last tool that ran (success).
  tool: string;
  error: string | null;
  // Set only while awaitingInput.
  question: string | null;
  options: string[];
  elapsedMs: number;
  stepIndex: number;
  steps: DerivedStep[];
  leaving: boolean;
};

// Time into the script at which the ask blocks (start of step askAt).
function askTime(spec: AgentSpec): number {
  let total = 0;
  for (let i = 0; i < (spec.askAt ?? 0); i++) total += spec.steps[i].ms;
  return total;
}

function scriptTotal(spec: AgentSpec, attempt: number): number {
  const failsAt = attempt === 0 ? spec.failAt : undefined;
  let total = 0;
  for (let i = 0; i < spec.steps.length; i++) {
    if (i === failsAt) return total + spec.steps[i].ms * FAIL_POINT;
    total += spec.steps[i].ms;
  }
  return total;
}

function derive(agent: LiveAgent, now: number): DerivedAgent {
  const { spec, attempt } = agent;
  const failsAt = attempt === 0 ? spec.failAt : undefined;
  const asksAt = agent.answered ? undefined : spec.askAt;
  const elapsed = Math.max(0, now - agent.startedAt);

  let acc = 0;
  let state: AgentState = "success";
  let stepIndex = spec.steps.length - 1;
  let clampMs = elapsed;
  const statuses: DerivedStep[] = spec.steps.map((step) => ({
    ...step,
    status: "done",
    ranMs: step.ms,
  }));

  const markRest = (from: number) => {
    for (let j = from; j < spec.steps.length; j++) {
      statuses[j] = { ...statuses[j], status: "todo", ranMs: 0 };
    }
  };

  for (let i = 0; i < spec.steps.length; i++) {
    const step = spec.steps[i];
    // The ask blocks before this step runs; the clock pins at the block.
    if (i === asksAt && elapsed >= acc) {
      stepIndex = i;
      state = "awaitingInput";
      clampMs = acc;
      statuses[i] = { ...statuses[i], status: "current", ranMs: 0 };
      markRest(i + 1);
      break;
    }
    const end = i === failsAt ? acc + step.ms * FAIL_POINT : acc + step.ms;
    if (elapsed < end) {
      stepIndex = i;
      state = "working";
      statuses[i] = { ...statuses[i], status: "current", ranMs: elapsed - acc };
      markRest(i + 1);
      break;
    }
    if (i === failsAt) {
      stepIndex = i;
      state = "failed";
      statuses[i] = {
        ...statuses[i],
        status: "errored",
        ranMs: step.ms * FAIL_POINT,
      };
      markRest(i + 1);
      break;
    }
    acc = end;
  }

  const total = scriptTotal(spec, attempt);
  const awaiting = state === "awaitingInput";
  return {
    id: agent.id,
    name: spec.name,
    task: spec.task,
    invokedBy: spec.invokedBy,
    state,
    tool: spec.steps[stepIndex].tool,
    error: state === "failed" ? (spec.error ?? "Agent hit an error") : null,
    question: awaiting ? (spec.question ?? "Needs your input to continue") : null,
    options: awaiting ? (spec.options ?? ["Continue"]) : [],
    elapsedMs: Math.min(clampMs, total),
    stepIndex,
    steps: statuses,
    leaving: agent.leavingAt != null,
  };
}

export function useAgentFleet() {
  const [agents, setAgents] = useState<LiveAgent[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const seqRef = useRef(0);

  const spawn = useCallback(() => {
    const seq = seqRef.current++;
    const spec = AGENT_SPECS[seq % AGENT_SPECS.length];
    setAgents((prev) => [
      ...prev,
      {
        id: `${spec.key}-${seq}`,
        spec,
        startedAt: Date.now(),
        attempt: 0,
        answered: false,
        leavingAt: null,
      },
    ]);
  }, []);

  const reset = useCallback(() => {
    seqRef.current = 0;
    setAgents([]);
  }, []);

  // Stop / dismiss both tear the agent down through the leave animation.
  const stop = useCallback((id: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id && a.leavingAt == null ? { ...a, leavingAt: Date.now() } : a
      )
    );
  }, []);

  const stopAll = useCallback(() => {
    const at = Date.now();
    setAgents((prev) =>
      prev.map((a) => (a.leavingAt == null ? { ...a, leavingAt: at } : a))
    );
  }, []);

  // Retry restarts the clock; attempt > 0 skips the scripted failure so the
  // demo shows the full arc to success.
  const retry = useCallback((id: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, startedAt: Date.now(), attempt: a.attempt + 1, leavingAt: null }
          : a
      )
    );
  }, []);

  // Answering rebases the clock to the block point, so the run resumes as if
  // it never paused (elapsed stays honest — wait time isn't work time).
  const answer = useCallback((id: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id && a.spec.askAt != null && !a.answered
          ? { ...a, answered: true, startedAt: Date.now() - askTime(a.spec) }
          : a
      )
    );
  }, []);

  // Opening demo: two long-runners, then the one that fails mid-flight.
  useEffect(() => {
    const timers = [
      window.setTimeout(spawn, 300),
      window.setTimeout(spawn, 900),
      window.setTimeout(spawn, 1600),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [spawn]);

  // One shared tick: refresh `now`, expire lingering successes, sweep leavers.
  useEffect(() => {
    const tick = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      setAgents((prev) => {
        let changed = false;
        const next: LiveAgent[] = [];
        for (const a of prev) {
          if (a.leavingAt != null) {
            if (t - a.leavingAt >= LEAVE_MS) {
              changed = true;
              continue;
            }
            next.push(a);
            continue;
          }
          const total = scriptTotal(a.spec, a.attempt);
          const failed = a.attempt === 0 && a.spec.failAt != null;
          // An unanswered ask pins the clock — the agent can't be done yet.
          const blocked = a.spec.askAt != null && !a.answered;
          const doneFor = t - a.startedAt - total;
          if (!failed && !blocked && doneFor >= SUCCESS_LINGER_MS) {
            changed = true;
            next.push({ ...a, leavingAt: t });
            continue;
          }
          next.push(a);
        }
        return changed ? next : prev;
      });
    }, 300);
    return () => window.clearInterval(tick);
  }, []);

  return {
    agents: agents.map((a) => derive(a, now)),
    spawn,
    reset,
    stop,
    stopAll,
    retry,
    answer,
  };
}

// The flyout truncates to 4 — attention states force their way in: failed
// first (red must never hide), then blocked-on-you, then working by age,
// then lingering successes.
const STATE_ORDER: Record<AgentState, number> = {
  failed: 0,
  awaitingInput: 1,
  working: 2,
  success: 3,
};

// The single most attention-worthy state across the fleet — drives the
// aggregate chip's ring in v2.
export function worstState(agents: DerivedAgent[]): AgentState {
  let worst: AgentState = "success";
  for (const a of agents) {
    if (STATE_ORDER[a.state] < STATE_ORDER[worst]) worst = a.state;
  }
  return worst;
}

export function splitVisible(agents: DerivedAgent[], max = 4) {
  const ranked = [...agents].sort(
    (a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state]
  );
  return {
    visible: ranked.slice(0, max),
    overflow: Math.max(0, ranked.length - max),
  };
}

export function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}
