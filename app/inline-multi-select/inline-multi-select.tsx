"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import { TypingCycle } from "./typing/cycle";

type Step = 1 | 2 | 3 | 4;
type FlowVariant = "structured" | "freeform-first";
type Direction = -1 | 1;
type Stage = "questions" | "submitting" | "saved" | "skipped";
type Outcome = "saved" | "skipped";
type TriggerView = "choices" | "connect-app";
type ConnectionStatus = "disconnected" | "connecting" | "connected";

type QuestionDefinition = {
  title: string;
  allowOther: boolean;
  /** Example answer shown in the custom input; defaults to "Something else…". */
  otherPlaceholder?: string;
  /** Renders the connect-an-app card instead of options; the step is
   *  answered once the app is connected. */
  connect?: boolean;
  options: readonly {
    id: string;
    label: string;
    description: string;
  }[];
};

const FREEFORM_QUESTIONS: Partial<Record<Step, QuestionDefinition>> = {
  2: {
    title: "What should I tackle first?",
    allowOther: true,
    options: [
      {
        id: "q1-planning",
        label: "Product planning",
        description: "Turn goals and feedback into clear next steps.",
      },
      {
        id: "q1-design",
        label: "Design work",
        description: "Explore flows, critique work, and summarize research.",
      },
      {
        id: "q1-code",
        label: "Shipping code",
        description: "Implement, test, and prepare releases.",
      },
    ],
  },
  3: {
    title: "Where should I find context?",
    allowOther: true,
    options: [
      {
        id: "q2-conversation",
        label: "This conversation",
        description: "Use the messages and files shared here.",
      },
      {
        id: "q2-team",
        label: "Team conversations",
        description: "Follow relevant channels and threads.",
      },
      {
        id: "q2-apps",
        label: "Connected apps",
        description: "Search Linear, GitHub, and other tools.",
      },
    ],
  },
  4: {
    title: "When should I check in?",
    allowOther: true,
    options: [
      {
        id: "q3-decisions",
        label: "Decisions & approvals",
        description: "Check in when a choice needs your call.",
      },
      {
        id: "q3-blockers",
        label: "Blockers & risks",
        description: "Flag anything that could slow the work.",
      },
    ],
  },
};

const INTENT_STEP: QuestionDefinition = {
  title: "Let’s set something up!",
  allowOther: true,
  otherPlaceholder: "Something else entirely…",
  options: [
    {
      id: "intent-scheduled",
      label: "Create a scheduled event",
      description: "Digests, reminders, and event-triggered workflows.",
    },
    {
      id: "intent-research",
      label: "Conduct web research",
      description: "Scout a topic and report back with findings.",
    },
    {
      id: "intent-app",
      label: "Put your apps to work",
      description: "Find or update information in connected tools.",
    },
  ],
};

const SCHEDULED_STEPS: Partial<Record<Step, QuestionDefinition>> = {
  2: {
    title: "What should it do?",
    allowOther: true,
    otherPlaceholder: "Summarize my Linear tickets + open PRs",
    options: [
      {
        id: "event-digest",
        label: "Post a digest",
        description: "A recurring roundup of the work you follow.",
      },
      {
        id: "event-message",
        label: "Send a message",
        description: "Post a reminder or update to a channel.",
      },
      {
        id: "event-update",
        label: "Update work",
        description: "Create or update an item in a connected app.",
      },
    ],
  },
  3: {
    title: "When should it run?",
    allowOther: true,
    otherPlaceholder: "Every Monday morning",
    options: [
      {
        id: "trigger-schedule",
        label: "On a schedule",
        description: "Run at a specific time or repeating interval.",
      },
      {
        id: "trigger-event",
        label: "On an app event",
        description: "For example, when a Notion page is created or updated.",
      },
    ],
  },
  4: {
    title: "Where should it post?",
    allowOther: true,
    otherPlaceholder: "#general at 8am",
    options: [
      {
        id: "event-general",
        label: "#general",
        description: "Share it with the whole team.",
      },
      {
        id: "event-dm",
        label: "DM me",
        description: "Send it directly to you.",
      },
    ],
  },
};

const APP_STEPS: Partial<Record<Step, QuestionDefinition>> = {
  /* No apps are connected yet, so the first step prompts for a connection. */
  2: {
    title: "Connect an app",
    allowOther: false,
    connect: true,
    options: [],
  },
  3: {
    title: "What should I do there?",
    allowOther: true,
    options: [
      {
        id: "app-find",
        label: "Find something",
        description: "Search for records, docs, or answers.",
      },
      {
        id: "app-update",
        label: "Make an update",
        description: "Create or edit items on your behalf.",
      },
      {
        id: "app-summarize",
        label: "Summarize activity",
        description: "Recap what changed and what needs attention.",
      },
    ],
  },
};

const RESEARCH_STEPS: Partial<Record<Step, QuestionDefinition>> = {
  2: {
    title: "What should I research?",
    allowOther: true,
    otherPlaceholder: "Latest AI funding rounds",
    options: [
      {
        id: "research-market",
        label: "A company or market",
        description: "Funding, competitors, and momentum.",
      },
      {
        id: "research-technical",
        label: "A technical question",
        description: "Docs, benchmarks, and best practices.",
      },
      {
        id: "research-news",
        label: "News on a topic",
        description: "The latest coverage and takes.",
      },
    ],
  },
  3: {
    title: "What angle and depth?",
    allowOther: true,
    otherPlaceholder: "Top 5 headlines, keep it brief",
    options: [
      {
        id: "research-headlines",
        label: "Quick headlines",
        description: "Top five results, kept brief.",
      },
      {
        id: "research-summary",
        label: "Balanced summary",
        description: "Key points with a little context.",
      },
      {
        id: "research-deep",
        label: "Deep dive",
        description: "Thorough findings with sources cited.",
      },
    ],
  },
  4: {
    title: "Where should I post it?",
    allowOther: true,
    otherPlaceholder: "Another channel",
    options: [
      {
        id: "research-dm",
        label: "DM me",
        description: "Send the result directly to you.",
      },
      {
        id: "research-channel",
        label: "#research",
        description: "Post to the research channel.",
      },
    ],
  },
};

/* Shown while no intent is chosen (or a custom one is typed) — the
 * follow-ups aren't known yet. */
const PLACEHOLDER_STEPS: Partial<Record<Step, QuestionDefinition>> = {
  2: {
    title: "Placeholder question",
    allowOther: true,
    options: [
      {
        id: "placeholder-a",
        label: "Placeholder option A",
        description: "Stand-in until this branch is designed.",
      },
      {
        id: "placeholder-b",
        label: "Placeholder option B",
        description: "Swap in real choices later.",
      },
    ],
  },
  3: {
    title: "Another placeholder",
    allowOther: true,
    options: [
      {
        id: "placeholder-a",
        label: "Placeholder option A",
        description: "Stand-in until this branch is designed.",
      },
      {
        id: "placeholder-b",
        label: "Placeholder option B",
        description: "Swap in real choices later.",
      },
    ],
  },
};

type BranchDefinition = {
  /** True only when the flow's length is certain, so the card can promise
   *  "step x of y". Placeholder branches make no such promise. */
  countKnown: boolean;
  steps: Partial<Record<Step, QuestionDefinition>>;
};

const INTENT_BRANCHES: Record<string, BranchDefinition> = {
  "intent-scheduled": { countKnown: true, steps: SCHEDULED_STEPS },
  "intent-research": { countKnown: true, steps: RESEARCH_STEPS },
  "intent-app": { countKnown: true, steps: APP_STEPS },
};

const UNKNOWN_BRANCH: BranchDefinition = {
  countKnown: false,
  steps: PLACEHOLDER_STEPS,
};

const branchForIntent = (intent: string | null): BranchDefinition =>
  (intent != null ? INTENT_BRANCHES[intent] : undefined) ?? UNKNOWN_BRANCH;

type OptionId = string;
type StepAnswers = { selected: OptionId[]; other: string };
type AnswersByStep = Record<Step, StepAnswers>;

const ASSET_ROOT = "/inline-multi-select";
const EASE_FAST = [0.2, 0, 0, 1] as const;
const EASE_EXIT = [0.4, 0, 1, 1] as const;

function ActionButton({
  children,
  disabled = false,
  primary = false,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`ims-action ${primary ? "ims-action--primary" : "ims-action--secondary"}`}
    >
      {children}
    </button>
  );
}

function NumberKey({ children }: { children: React.ReactNode }) {
  return (
    <span className="ims-number" aria-hidden="true">
      {children}
    </span>
  );
}

function LoadingDots() {
  return (
    <span className="ims-loading-dots" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function AppConnector({
  status,
  disabled,
  connectedLabel,
  onBack,
  onPrimary,
}: {
  status: ConnectionStatus;
  disabled: boolean;
  connectedLabel: string;
  onBack: () => void;
  onPrimary: () => void;
}) {
  const isConnecting = status === "connecting";
  const isConnected = status === "connected";

  return (
    <div
      className="ims-connector"
      aria-busy={isConnecting}
      aria-label="Notion connection"
    >
      <div className="ims-connector-summary">
        <span className="ims-connector-icon" aria-hidden="true">
          <Image src={`${ASSET_ROOT}/notion.svg`} alt="" width={16} height={16} />
        </span>
        <span className="ims-connector-copy">
          <span className="ims-connector-heading">
            <span className="ims-connector-name">Notion</span>
            {isConnected ? (
              <span className="ims-connector-connected">
                <Image src={`${ASSET_ROOT}/check.svg`} alt="" width={12} height={12} />
                Connected
              </span>
            ) : (
              <span className="ims-connector-dot" aria-hidden="true" />
            )}
          </span>
          <span className="ims-connector-description">
            {isConnected
              ? "Notion is connected and ready to use."
              : "Enable agents to turn conversations into artifacts, update notes, & automate workflows in Notion."}
          </span>
        </span>
      </div>
      <div className="ims-connector-divider" aria-hidden="true" />
      <div className="ims-connector-actions">
        <span className="ims-connector-more">
          Want to connect more apps?
          <button type="button" className="ims-text-button">
            Click here
          </button>
        </span>
        <span className="ims-connector-buttons">
          <ActionButton disabled={disabled || isConnecting} onClick={onBack}>
            Back
          </ActionButton>
          <ActionButton disabled={disabled || isConnecting} primary onClick={onPrimary}>
            {isConnecting ? (
              <span className="ims-connector-connecting">
                <LoadingDots />
                Connecting
              </span>
            ) : isConnected ? (
              connectedLabel
            ) : (
              "Connect"
            )}
          </ActionButton>
        </span>
      </div>
    </div>
  );
}

export function InlineMultiSelect({
  variant = "structured",
}: {
  variant?: FlowVariant;
}) {
  const reduceMotion = Boolean(useReducedMotion());
  const titleId = useId();
  const bodyId = useId();
  const automationInputId = useId();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<Direction>(1);
  const [stage, setStage] = useState<Stage>("questions");
  const [pendingOutcome, setPendingOutcome] = useState<Outcome>("saved");
  const [transitioning, setTransitioning] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [triggerView, setTriggerView] = useState<TriggerView>("choices");
  const [appConnection, setAppConnection] =
    useState<ConnectionStatus>("disconnected");
  const [automationBrief, setAutomationBrief] = useState("");
  const [titleSlot, setTitleSlot] = useState({
    key: "",
    title: "",
    prevKey: "",
    prevTitle: "",
  });
  const [traceOpen, setTraceOpen] = useState(false);
  const [thoughtIndex, setThoughtIndex] = useState(0);
  const [answersByStep, setAnswersByStep] = useState<AnswersByStep>(() => ({
    1: { selected: [], other: "" },
    2: { selected: [], other: "" },
    3: { selected: [], other: "" },
    4: { selected: [], other: "" },
  }));
  const [status, setStatus] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const receiptActionRef = useRef<HTMLButtonElement>(null);
  const focusTitleOnExpandRef = useRef(false);
  const pageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pageTimerRef.current != null) clearTimeout(pageTimerRef.current);
      if (settleTimerRef.current != null) clearTimeout(settleTimerRef.current);
      if (focusTimerRef.current != null) clearTimeout(focusTimerRef.current);
      if (statusTimerRef.current != null) clearTimeout(statusTimerRef.current);
      if (connectionTimerRef.current != null) clearTimeout(connectionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (stage === "questions") return;

    const focusTimer = setTimeout(() => receiptRef.current?.focus(), 0);
    return () => clearTimeout(focusTimer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "saved" && stage !== "skipped") return;

    if (focusTimerRef.current != null) clearTimeout(focusTimerRef.current);
    const focusTimer = setTimeout(
      () => receiptActionRef.current?.focus(),
      reduceMotion ? 0 : 320,
    );
    focusTimerRef.current = focusTimer;

    return () => {
      clearTimeout(focusTimer);
    };
  }, [reduceMotion, stage]);

  const announce = (message: string) => {
    setStatus(message);
    if (statusTimerRef.current != null) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setStatus(""), 1800);
  };

  const primaryIntent = answersByStep[1].selected[0] ?? null;
  const activeBranch = branchForIntent(primaryIntent);
  /* The intent screen plus however many screens the chosen flow defines —
   * flows are allowed to differ in length. */
  const totalSteps =
    variant === "freeform-first"
      ? 4
      : 1 + Object.keys(activeBranch.steps).length;
  const questions: Partial<Record<Step, QuestionDefinition>> =
    variant === "freeform-first"
      ? FREEFORM_QUESTIONS
      : { 1: INTENT_STEP, ...activeBranch.steps };
  const question = questions[step] ?? null;
  const answers = answersByStep[step];
  const flowCountKnown =
    variant === "freeform-first" ? true : activeBranch.countKnown;
  /* Structured steps are numbered within the chosen flow — the intent screen
   * isn't counted, so the counter opens at "1/2" on a branch's first screen. */
  const flowTotal =
    variant === "freeform-first"
      ? totalSteps
      : Object.keys(activeBranch.steps).length;
  const flowStepFor = (target: Step) =>
    variant === "freeform-first" ? target : target - 1;
  const flowStep = flowStepFor(step);
  const knownTotalSteps = flowCountKnown ? flowTotal : null;
  /* The counter renders only inside a flow whose length is certain — never on
   * the intent screen, where selecting an option must not shift the title. */
  const showStepper =
    flowCountKnown && (variant === "freeform-first" || step > 1);

  const toggle = (id: OptionId) => {
    if (transitioning || question == null) return;
    const answerStep = step;
    const currentSelections = answersByStep[answerStep].selected;
    /* Single-select: picking an option replaces the previous pick; picking
     * the same one again clears it. */
    const nextSelections = currentSelections.includes(id) ? [] : [id];
    const branchChanged =
      variant === "structured" &&
      answerStep === 1 &&
      branchForIntent(currentSelections[0] ?? null).steps !==
        branchForIntent(nextSelections[0] ?? null).steps;

    setAnswersByStep((current) => {
      const next = {
        ...current,
        [answerStep]: { ...current[answerStep], selected: nextSelections },
      };
      if (branchChanged) {
        next[2] = { selected: [], other: "" };
        next[3] = { selected: [], other: "" };
        next[4] = { selected: [], other: "" };
      }
      return next;
    });

    if (branchChanged) announce("Follow-up steps updated");
  };

  const updateOther = (value: string) => {
    if (question == null) return;
    const answerStep = step;

    setAnswersByStep((current) => ({
      ...current,
      [answerStep]: { ...current[answerStep], other: value },
    }));
  };

  const moveToStep = (
    nextStep: Step,
    nextDirection: Direction,
    message: string,
    focusHeadingAfter = false,
  ) => {
    if (transitioning) return;
    if (pageTimerRef.current != null) clearTimeout(pageTimerRef.current);

    setTransitioning(true);
    setDirection(nextDirection);
    setTriggerView("choices");
    setStep(nextStep);
    announce(message);

    pageTimerRef.current = setTimeout(
      () => {
        setTransitioning(false);
        if (nextDirection === -1 || focusHeadingAfter) {
          titleRef.current?.focus();
        }
      },
      reduceMotion ? 0 : 310,
    );
  };

  const moveToTriggerView = (
    nextView: TriggerView,
    nextDirection: Direction,
    message: string,
  ) => {
    if (transitioning) return;
    if (pageTimerRef.current != null) clearTimeout(pageTimerRef.current);
    if (focusTimerRef.current != null) clearTimeout(focusTimerRef.current);

    setTransitioning(true);
    setDirection(nextDirection);
    setTriggerView(nextView);
    announce(message);

    focusTimerRef.current = setTimeout(() => titleRef.current?.focus(), 0);
    pageTimerRef.current = setTimeout(
      () => setTransitioning(false),
      reduceMotion ? 0 : 310,
    );
  };

  const connectApp = () => {
    if (transitioning || appConnection !== "disconnected") return;
    if (connectionTimerRef.current != null) clearTimeout(connectionTimerRef.current);

    setAppConnection("connecting");
    announce("Connecting Notion");
    connectionTimerRef.current = setTimeout(
      () => {
        setAppConnection("connected");
        announce("Notion connected");
      },
      reduceMotion ? 0 : 620,
    );
  };

  const completeFlow = (outcome: Outcome) => {
    if (transitioning) return;
    if (settleTimerRef.current != null) clearTimeout(settleTimerRef.current);

    setPendingOutcome(outcome);
    setStage("submitting");
    announce(outcome === "saved" ? "Saving selections" : "Skipping step");

    settleTimerRef.current = setTimeout(
      () => {
        setStage(outcome);
        announce(outcome === "saved" ? "Selections saved" : "Step skipped");
      },
      reduceMotion ? 0 : 720,
    );
  };

  const continueFlow = (focusHeadingAfter = false) => {
    if (!stepAnswered) return;
    if (step < totalSteps) {
      const nextStep = (step + 1) as Step;
      moveToStep(
        nextStep,
        1,
        knownTotalSteps == null
          ? "Moved to the next question"
          : `Moved to step ${flowStepFor(nextStep)} of ${knownTotalSteps}`,
        focusHeadingAfter,
      );
      return;
    }

    const needsAppConnection =
      variant === "structured" &&
      answersByStep[3].selected.includes("trigger-event") &&
      appConnection !== "connected";

    if (needsAppConnection) {
      moveToTriggerView("connect-app", 1, "Ready to connect the Notion trigger");
      return;
    }

    completeFlow("saved");
  };

  const skip = () => {
    if (step < totalSteps) {
      const nextStep = (step + 1) as Step;
      moveToStep(
        nextStep,
        1,
        knownTotalSteps == null
          ? "Skipped to the next question"
          : `Skipped to step ${flowStepFor(nextStep)} of ${knownTotalSteps}`,
      );
      return;
    }
    completeFlow("skipped");
  };

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      announce(current ? "Choices expanded" : "Choices collapsed");
      return !current;
    });
  };

  const restoreQuestions = () => {
    focusTitleOnExpandRef.current = true;
    setTriggerView("choices");
    setCollapsed(false);
    setStage("questions");
    announce("Selections ready to edit");
  };

  const isQuestionStage = stage === "questions";
  const selected = answers.selected;
  const other = answers.other;
  /* Continue/Submit unlock only once the step is answered; Skip is the
   * explicit way past an unanswered step. */
  const stepAnswered =
    question != null
      ? question.connect
        ? appConnection === "connected"
        : selected.length > 0 || other.trim().length > 0
      : automationBrief.trim().length > 0;
  const triggerConnector =
    variant === "structured" &&
    step === totalSteps &&
    triggerView === "connect-app";
  const connectStep = question?.connect === true;
  const showConnector = triggerConnector || connectStep;
  const needsConnection =
    variant === "structured" &&
    answersByStep[3].selected.includes("trigger-event") &&
    appConnection !== "connected";
  const questionTitle =
    triggerConnector
      ? "Connect the trigger"
      : question?.title ??
        (variant === "freeform-first"
          ? "Describe your automation"
          : "Let’s set something up!");
  /* Adjust-during-render capture of the outgoing title: at most one ghost
   * ever exists, parked behind the clip once its roll-out finishes. */
  const titleKey = `${step}:${triggerView}`;
  if (titleSlot.key !== titleKey) {
    setTitleSlot({
      key: titleKey,
      title: questionTitle,
      prevKey: titleSlot.key,
      prevTitle: titleSlot.title,
    });
  }
  const previousTitle = titleSlot.prevTitle
    ? { key: titleSlot.prevKey, title: titleSlot.prevTitle }
    : null;

  const pageHeight = question
    ? question.options.length * 58 + (question.allowOther ? 56 : 0)
    : 230;
  const optionsHeight = pageHeight + 1;
  const expandedHeight = showConnector ? 186 : pageHeight + 93;
  const answerCount = Object.values(answersByStep).reduce(
    (total, stepAnswers) =>
      total + stepAnswers.selected.length + (stepAnswers.other.trim() ? 1 : 0),
    variant === "freeform-first" && automationBrief.trim() ? 1 : 0,
  );

  /* Once submitted the answers are locked, so the saved state renders a
   * summary of what was chosen and what the agent is now doing. */
  const showSummary = variant === "structured" && stage === "saved";
  const summaryHeadline =
    (primaryIntent != null
      ? {
          "intent-scheduled": "Creating scheduled event",
          "intent-research": "Conducting web research",
          "intent-app": "Putting your apps to work",
        }[primaryIntent]
      : undefined) ?? "Working on it";
  const summarySteps = ([2, 3, 4] as Step[]).filter((s) => questions[s] != null);
  const answerFor = (s: Step): string => {
    const q = questions[s];
    if (q == null) return "";
    if (q.connect) return appConnection === "connected" ? "Notion" : "Not connected";
    const stepAnswers = answersByStep[s];
    const option = q.options.find((o) => stepAnswers.selected.includes(o.id));
    if (option) return option.label;
    const custom = stepAnswers.other.trim();
    return custom ? `“${custom}”` : "Skipped";
  };
  const pick = (map: Record<string, string>, id?: string) =>
    id != null ? map[id] : undefined;

  let summaryActivity = "Tadao is working through your answers.";
  if (primaryIntent === "intent-scheduled") {
    const what =
      pick(
        {
          "event-digest": "a digest",
          "event-message": "a message",
          "event-update": "work updates",
        },
        answersByStep[2].selected[0],
      ) ??
      (answersByStep[2].other.trim()
        ? `“${answersByStep[2].other.trim()}”`
        : "an update");
    const when =
      pick(
        {
          "trigger-schedule": "running on your schedule",
          "trigger-event": "watching Notion for page changes",
        },
        answersByStep[3].selected[0],
      ) ?? "waiting on a trigger";
    const where =
      pick(
        { "event-general": "#general", "event-dm": "your DMs" },
        answersByStep[4].selected[0],
      ) ??
      (answersByStep[4].other.trim() || "this channel");
    summaryActivity = `Tadao is ${when} and will post ${what} to ${where}.`;
  } else if (primaryIntent === "intent-research") {
    const topic =
      answersByStep[2].other.trim() ||
      pick(
        {
          "research-market": "a company and its market",
          "research-technical": "a technical question",
          "research-news": "the latest news",
        },
        answersByStep[2].selected[0],
      ) ||
      "your topic";
    const depth =
      pick(
        {
          "research-headlines": "quick headlines",
          "research-summary": "a balanced summary",
          "research-deep": "a deep dive",
        },
        answersByStep[3].selected[0],
      ) ?? "the findings";
    const where =
      pick(
        { "research-dm": "your DMs", "research-channel": "#research" },
        answersByStep[4].selected[0],
      ) ??
      (answersByStep[4].other.trim() || "this channel");
    summaryActivity = `Tadao is researching ${topic} and will post ${depth} to ${where}.`;
  } else if (primaryIntent === "intent-app") {
    const doing =
      pick(
        {
          "app-find": "finding what you asked for",
          "app-update": "making your updates",
          "app-summarize": "summarizing recent activity",
        },
        answersByStep[3].selected[0],
      ) ?? "getting to work";
    summaryActivity =
      appConnection === "connected"
        ? `Tadao is in Notion, ${doing}.`
        : "Tadao will start once Notion is connected.";
  }
  /* Working narration for the stream-of-thought line — beats with uneven
   * dwell times so the cycling never feels metronomic (the inline agent
   * trace's grammar). */
  let summaryThoughts: { text: string; ms: number }[] = [
    { text: "Reading your answers", ms: 2400 },
    { text: "Working it out", ms: 3000 },
    { text: "Pulling things together", ms: 2800 },
  ];
  if (primaryIntent === "intent-scheduled") {
    const where =
      pick(
        { "event-general": "#general", "event-dm": "your DMs" },
        answersByStep[4].selected[0],
      ) ??
      (answersByStep[4].other.trim() || "the channel");
    summaryThoughts = [
      { text: "Setting up the scheduled event", ms: 2400 },
      answersByStep[3].selected[0] === "trigger-event"
        ? { text: "Listening for Notion page changes", ms: 3200 }
        : { text: "Locking in the schedule", ms: 3000 },
      { text: "Drafting the first run", ms: 3200 },
      { text: `Pointing it at ${where}`, ms: 2600 },
      { text: "Double-checking the details", ms: 2800 },
    ];
  } else if (primaryIntent === "intent-research") {
    const depth =
      pick(
        {
          "research-headlines": "quick headlines",
          "research-summary": "a balanced summary",
          "research-deep": "a deep dive",
        },
        answersByStep[3].selected[0],
      ) ?? "the findings";
    summaryThoughts = [
      { text: "Scoping the research", ms: 2400 },
      { text: "Scanning fresh sources", ms: 3200 },
      { text: "Ranking what matters", ms: 2800 },
      { text: `Shaping ${depth}`, ms: 3000 },
      { text: "Citing the good parts", ms: 2600 },
    ];
  } else if (primaryIntent === "intent-app") {
    const doing =
      pick(
        {
          "app-find": "Hunting down the answer",
          "app-update": "Drafting the updates",
          "app-summarize": "Summarizing what changed",
        },
        answersByStep[3].selected[0],
      ) ?? "Getting to work";
    summaryThoughts = [
      { text: "Opening Notion", ms: 2200 },
      { text: "Reading recent activity", ms: 3000 },
      { text: doing, ms: 3200 },
      { text: "Tidying the results", ms: 2600 },
    ];
  }
  const currentThought =
    summaryThoughts[thoughtIndex % summaryThoughts.length];

  /* Advance the stream-of-thought beat after each dwell. */
  useEffect(() => {
    if (!showSummary || reduceMotion) return;

    const beatTimer = setTimeout(
      () => setThoughtIndex((index) => index + 1),
      currentThought.ms,
    );
    return () => clearTimeout(beatTimer);
  }, [showSummary, reduceMotion, thoughtIndex, currentThought.ms]);

  let receiptLabel = "Saving selections…";
  let receiptDetail = answerCount === 1 ? "1 answer" : `${answerCount} answers`;
  let receiptAction = "";

  if (stage === "submitting" && pendingOutcome === "skipped") {
    receiptLabel = "Skipping step…";
    receiptDetail = "";
  } else if (stage === "saved") {
    receiptLabel = "Selections saved";
    receiptAction = "Edit";
  } else if (stage === "skipped") {
    receiptLabel = "Step skipped";
    receiptDetail = "";
    receiptAction = "Review";
  }

  return (
    <motion.section
      className="ims-card"
      aria-label={isQuestionStage ? undefined : receiptLabel}
      aria-labelledby={isQuestionStage ? titleId : undefined}
      animate={{
        height: isQuestionStage
          ? collapsed
            ? 44
            : expandedHeight
          : showSummary
            ? "auto"
            : 44,
      }}
      initial={false}
      transition={{
        delay:
          !reduceMotion && isQuestionStage && collapsed
            ? 0.06
            : !reduceMotion && !isQuestionStage
              ? 0.08
              : 0,
        duration: reduceMotion ? 0 : 0.28,
        ease: EASE_FAST,
      }}
      data-stage={stage}
      data-step={step}
      data-flow-variant={variant}
      data-trigger-view={triggerView}
      data-collapsed={collapsed}
    >
      <AnimatePresence initial={false} mode="sync">
        {isQuestionStage ? (
          <motion.div
            key="questions"
            className="ims-expanded-panel"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                delay: reduceMotion ? 0 : 0.12,
                duration: reduceMotion ? 0 : 0.16,
                ease: EASE_FAST,
              },
            }}
            onAnimationComplete={() => {
              if (!focusTitleOnExpandRef.current) return;
              focusTitleOnExpandRef.current = false;
              titleRef.current?.focus();
            }}
            exit={{
              opacity: 0,
              y: reduceMotion ? 0 : -3,
              transition: { duration: reduceMotion ? 0 : 0.1, ease: EASE_EXIT },
            }}
          >
            <header className="ims-header">
              {/* The counter never animates: it snaps in and out with the
                  step change while the title alone slides, and advancing
                  steps just swaps the number. */}
              <span
                className="ims-step-slot"
                data-visible={showStepper || undefined}
                aria-hidden={showStepper ? undefined : true}
              >
                {flowCountKnown ? (
                  <span
                    className="ims-step"
                    aria-label={
                      showStepper
                        ? `Step ${flowStep} of ${knownTotalSteps}`
                        : undefined
                    }
                  >
                    <span className="ims-step-counter" aria-hidden="true">
                      <span className="ims-step-window">
                        <span className="ims-step-value">
                          {Math.max(1, flowStep)}
                        </span>
                      </span>
                      <span>/{knownTotalSteps}</span>
                    </span>
                  </span>
                ) : null}
              </span>
              <h2
                ref={titleRef}
                id={titleId}
                className="ims-title"
                tabIndex={-1}
                aria-label={questionTitle}
                data-direction={direction}
              >
                {/* Slot-machine roll, CSS-driven: the old line rolls out one
                    edge of the clipped window while the new one rolls in from
                    the other. */}
                <span
                  key={titleKey}
                  className="ims-title-value ims-title-value--in"
                  aria-hidden="true"
                >
                  {questionTitle}
                </span>
                {previousTitle ? (
                  <span
                    key={`out:${previousTitle.key}`}
                    className="ims-title-value ims-title-value--out"
                    aria-hidden="true"
                  >
                    {previousTitle.title}
                  </span>
                ) : null}
              </h2>
              <button
                type="button"
                disabled={transitioning}
                onClick={toggleCollapsed}
                className="ims-icon-button"
                aria-controls={bodyId}
                aria-expanded={!collapsed}
                aria-label={collapsed ? "Expand choices" : "Collapse choices"}
              >
                <Image
                  className="ims-header-chevron"
                  src={`${ASSET_ROOT}/chevron-down.svg`}
                  alt=""
                  width={16}
                  height={16}
                />
              </button>
            </header>

            <AnimatePresence initial={false}>
              {!collapsed ? (
                <motion.div
                  key="body"
                  id={bodyId}
                  className={`ims-body ${showConnector ? "ims-body--connector" : ""}`}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : -2 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: reduceMotion ? 0 : 0.07,
                      duration: reduceMotion ? 0 : 0.14,
                      ease: EASE_FAST,
                    },
                  }}
                  exit={{
                    opacity: 0,
                    y: reduceMotion ? 0 : -2,
                    transition: {
                      duration: reduceMotion ? 0 : 0.08,
                      ease: EASE_EXIT,
                    },
                  }}
                >
              {showConnector ? (
                <AppConnector
                  status={appConnection}
                  disabled={transitioning}
                  connectedLabel={step === totalSteps ? "Submit" : "Continue"}
                  onBack={() => {
                    if (triggerConnector) {
                      moveToTriggerView(
                        "choices",
                        -1,
                        "Returned to trigger choices",
                      );
                      return;
                    }
                    const previousStep = (step - 1) as Step;
                    moveToStep(
                      previousStep,
                      -1,
                      flowStepFor(previousStep) < 1
                        ? "Returned to the previous question"
                        : `Returned to step ${flowStepFor(previousStep)} of ${knownTotalSteps}`,
                    );
                  }}
                  onPrimary={() => {
                    if (appConnection !== "connected") {
                      connectApp();
                      return;
                    }
                    if (triggerConnector || step === totalSteps) {
                      completeFlow("saved");
                      return;
                    }
                    continueFlow();
                  }}
                />
              ) : (
                <>
                  <motion.div
                    className="ims-options-viewport"
                    animate={{ height: optionsHeight }}
                    initial={false}
                    transition={{
                      duration: reduceMotion ? 0 : 0.28,
                      ease: EASE_FAST,
                    }}
                    inert={transitioning ? true : undefined}
                  >
                <div className="ims-options-pages">
                  {question ? (
                    <div
                      className="ims-options"
                      role="group"
                      aria-label={
                        knownTotalSteps == null || flowStep < 1
                          ? "Available choices"
                          : `Available choices, step ${flowStep} of ${knownTotalSteps}`
                      }
                    >
                      {question.options.map((option, index) => {
                        const isSelected = selected.includes(option.id);

                        return (
                          <button
                            key={option.id}
                            type="button"
                            role="checkbox"
                            aria-checked={isSelected}
                            onClick={() => toggle(option.id)}
                            className="ims-option"
                          >
                            <span className="ims-option-content">
                              <NumberKey>{index + 1}</NumberKey>
                              <span className="ims-option-copy">
                                <span className="ims-option-label">{option.label}</span>
                                <span className="ims-option-description">
                                  {option.description}
                                </span>
                              </span>
                            </span>
                            <AnimatePresence initial={false}>
                              {isSelected ? (
                                <motion.img
                                  key="check"
                                  className="ims-check"
                                  src={`${ASSET_ROOT}/check.svg`}
                                  alt=""
                                  width={16}
                                  height={16}
                                  initial={{
                                    opacity: 0,
                                    scale: reduceMotion ? 1 : 0.76,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                    transition: {
                                      duration: reduceMotion ? 0 : 0.16,
                                      ease: EASE_FAST,
                                    },
                                  }}
                                  exit={{
                                    opacity: 0,
                                    scale: reduceMotion ? 1 : 0.86,
                                    transition: { duration: reduceMotion ? 0 : 0.1 },
                                  }}
                                />
                              ) : null}
                            </AnimatePresence>
                          </button>
                        );
                      })}

                      {question.allowOther ? (
                        <div className="ims-other-row">
                          <NumberKey>{question.options.length + 1}</NumberKey>
                          <input
                            value={other}
                            disabled={transitioning}
                            onChange={(event) => updateOther(event.target.value)}
                            onKeyDown={(event) => {
                              if (
                                event.key === "Enter" &&
                                !event.repeat &&
                                !event.nativeEvent.isComposing
                              ) {
                                event.preventDefault();
                                continueFlow(true);
                              }
                            }}
                            className="ims-other-input"
                            placeholder={question.otherPlaceholder ?? "Something else…"}
                            aria-label="Custom answer"
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="ims-automation-step">
                      <div className="ims-automation-copy">
                        <label
                          className="ims-automation-prompt"
                          htmlFor={automationInputId}
                        >
                          Sure! What should the automation do, and when should it trigger?
                        </label>
                        <p className="ims-automation-example">
                          For example: “post a daily standup reminder every weekday at 9am”
                          or “notify when a Linear issue is created.”
                        </p>
                      </div>
                      <textarea
                        id={automationInputId}
                        value={automationBrief}
                        disabled={transitioning}
                        onChange={(event) => setAutomationBrief(event.target.value)}
                        className="ims-automation-input"
                        placeholder="Describe what should happen and when…"
                        aria-label="Automation description"
                      />
                    </div>
                  )}
                </div>
                <div className="ims-divider ims-divider--bottom" aria-hidden="true" />
                  </motion.div>

                  <footer className="ims-footer">
                <span className="ims-footer-back-slot">
                  <AnimatePresence initial={false}>
                    {step > 1 ? (
                      <motion.span
                        key="back"
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 3 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: {
                            delay: reduceMotion ? 0 : 0.13,
                            duration: reduceMotion ? 0 : 0.15,
                            ease: EASE_FAST,
                          },
                        }}
                        exit={{
                          opacity: 0,
                          y: reduceMotion ? 0 : 2,
                          transition: { duration: reduceMotion ? 0 : 0.08 },
                        }}
                      >
                        <ActionButton
                          disabled={transitioning}
                          onClick={() => {
                            const previousStep = (step - 1) as Step;
                            moveToStep(
                              previousStep,
                              -1,
                              knownTotalSteps == null ||
                                flowStepFor(previousStep) < 1
                                ? "Returned to the previous question"
                                : `Returned to step ${flowStepFor(previousStep)} of ${knownTotalSteps}`,
                            );
                          }}
                        >
                          Back
                        </ActionButton>
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </span>
                <div className="ims-footer-actions">
                  <ActionButton disabled={transitioning} onClick={skip}>
                    Skip
                  </ActionButton>
                  <ActionButton
                    disabled={transitioning || !stepAnswered}
                    primary
                    onClick={() => continueFlow()}
                  >
                    {step === totalSteps && !needsConnection ? "Submit" : "Continue"}
                  </ActionButton>
                </div>
                  </footer>
                </>
              )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : showSummary ? (
          <motion.div
            ref={receiptRef}
            key="summary"
            className="ims-summary"
            tabIndex={-1}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 5 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                delay: reduceMotion ? 0 : 0.17,
                duration: reduceMotion ? 0 : 0.15,
                ease: EASE_FAST,
              },
            }}
            exit={{
              opacity: 0,
              y: reduceMotion ? 0 : 3,
              transition: { duration: reduceMotion ? 0 : 0.08 },
            }}
          >
            <div className="ims-summary-head">
              <span className="ims-summary-title">{summaryHeadline}</span>
              <p className="ims-summary-activity">{summaryActivity}</p>
            </div>
            <div className="ims-summary-divider" aria-hidden="true" />
            <button
              type="button"
              className="ims-summary-trace-toggle"
              aria-expanded={traceOpen}
              aria-label="Stream of thought"
              onClick={() => setTraceOpen((open) => !open)}
            >
              <span className="ims-summary-trace-label">
                {/* The /agent-typing-experience rig — Tadao types, arrives,
                    holds, resets, then moves to the next v3 variant. */}
                <span className="ims-summary-typing" aria-hidden="true">
                  <TypingCycle size={32} group="v3" />
                </span>
                {/* Live narration in the inline trace's ticker grammar:
                    each beat rolls in and carries the light shimmer. */}
                <span className="ims-thought" aria-hidden="true">
                  <span key={thoughtIndex} className="ims-thought-line">
                    {currentThought.text}
                  </span>
                </span>
              </span>
              <Image
                className="ims-summary-trace-chevron"
                src={`${ASSET_ROOT}/chevron-down.svg`}
                alt=""
                width={16}
                height={16}
              />
            </button>
            <div
              className="ims-summary-trace-body"
              data-open={traceOpen || undefined}
            >
              <div>
                <dl className="ims-summary-rows">
                  {summarySteps.map((s) => (
                    <div key={s} className="ims-summary-row">
                      <dt>{questions[s]?.title}</dt>
                      <dd>{answerFor(s)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            ref={receiptRef}
            key="receipt"
            className="ims-receipt"
            tabIndex={-1}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 5 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                delay: reduceMotion ? 0 : 0.17,
                duration: reduceMotion ? 0 : 0.15,
                ease: EASE_FAST,
              },
            }}
            exit={{
              opacity: 0,
              y: reduceMotion ? 0 : 3,
              transition: { duration: reduceMotion ? 0 : 0.08 },
            }}
          >
            <span className="ims-receipt-status">
              {stage === "submitting" ? (
                <LoadingDots />
              ) : stage === "saved" ? (
                <Image src={`${ASSET_ROOT}/check.svg`} alt="" width={16} height={16} />
              ) : (
                <span className="ims-receipt-dot" aria-hidden="true" />
              )}
              <span className="ims-receipt-label">{receiptLabel}</span>
              {receiptDetail ? (
                <span className="ims-receipt-detail">{receiptDetail}</span>
              ) : null}
            </span>
            {receiptAction ? (
              <button
                ref={receiptActionRef}
                type="button"
                onClick={restoreQuestions}
                className="ims-receipt-action"
              >
                {receiptAction}
              </button>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
    </motion.section>
  );
}
