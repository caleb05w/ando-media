"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

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
  options: readonly {
    id: string;
    label: string;
    description: string;
  }[];
};

type TitleMotion = {
  direction: Direction;
  distance: number;
  enterDuration: number;
  exitDuration: number;
};

const FREEFORM_QUESTIONS: Partial<Record<Step, QuestionDefinition>> = {
  2: {
    title: "What should I help with first?",
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
    title: "Where should I look for context?",
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
    title: "What should I keep you updated on?",
    allowOther: false,
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

const STRUCTURED_QUESTIONS: Partial<Record<Step, QuestionDefinition>> = {
  1: {
    title: "What would you like to do?",
    allowOther: false,
    options: [
      {
        id: "intent-automation",
        label: "Create an automation",
        description: "Set up a recurring or event-based workflow.",
      },
      {
        id: "intent-question",
        label: "Ask a question",
        description: "Get an answer using conversation and connected context.",
      },
      {
        id: "intent-draft",
        label: "Draft something",
        description: "Create a message, brief, or update.",
      },
      {
        id: "intent-app",
        label: "Work with an app",
        description: "Find or update information in connected tools.",
      },
    ],
  },
  2: {
    title: "What should it do?",
    allowOther: true,
    options: [
      {
        id: "action-message",
        label: "Send a message",
        description: "Post a reminder or update to a channel.",
      },
      {
        id: "action-notify",
        label: "Notify someone",
        description: "Alert a person or team when something happens.",
      },
      {
        id: "action-update",
        label: "Update work",
        description: "Create or update an item in a connected app.",
      },
    ],
  },
  3: {
    title: "When should it trigger?",
    allowOther: true,
    options: [
      {
        id: "trigger-schedule",
        label: "On a schedule",
        description: "Run at a specific time or repeating interval.",
      },
      {
        id: "trigger-event",
        label: "When something happens in an app",
        description: "For example, when a Linear issue is created or updated.",
      },
    ],
  },
};

type OptionId = string;
type StepAnswers = { selected: OptionId[]; other: string };
type AnswersByStep = Record<Step, StepAnswers>;

const ASSET_ROOT = "/inline-multi-select";
const EASE_FAST = [0.2, 0, 0, 1] as const;
const EASE_EXIT = [0.4, 0, 1, 1] as const;

const TITLE_SLOT_VARIANTS = {
  enter: ({ direction, distance }: TitleMotion) => ({
    opacity: 0,
    y: direction * distance,
  }),
  center: ({ enterDuration }: TitleMotion) => ({
    opacity: 1,
    y: 0,
    transition: { duration: enterDuration, ease: EASE_FAST },
  }),
  exit: ({ direction, distance, exitDuration }: TitleMotion) => ({
    opacity: 0,
    y: direction * -distance,
    transition: { duration: exitDuration, ease: EASE_EXIT },
  }),
};

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

function LinearConnector({
  status,
  disabled,
  onBack,
  onPrimary,
}: {
  status: ConnectionStatus;
  disabled: boolean;
  onBack: () => void;
  onPrimary: () => void;
}) {
  const isConnecting = status === "connecting";
  const isConnected = status === "connected";

  return (
    <div
      className="ims-linear-connector"
      aria-busy={isConnecting}
      aria-label="Linear trigger connection"
    >
      <div className="ims-linear-summary">
        <span className="ims-linear-icon" aria-hidden="true">
          <Image src="/images/linear-logo.png" alt="" width={32} height={32} />
        </span>
        <span className="ims-linear-copy">
          <span className="ims-linear-heading">
            <span className="ims-linear-name">Linear</span>
            {isConnected ? (
              <span className="ims-linear-connected">
                <Image src={`${ASSET_ROOT}/check.svg`} alt="" width={12} height={12} />
                Connected
              </span>
            ) : null}
          </span>
          <span className="ims-linear-description">
            {isConnected
              ? "Linear is ready to trigger this automation when an issue changes."
              : "Create, update, or triage issues when something changes in Linear."}
          </span>
        </span>
      </div>
      <div className="ims-linear-divider" aria-hidden="true" />
      <div className="ims-linear-actions">
        <ActionButton disabled={disabled || isConnecting} onClick={onBack}>
          Back
        </ActionButton>
        <ActionButton disabled={disabled || isConnecting} primary onClick={onPrimary}>
          {isConnecting ? (
            <span className="ims-linear-connecting">
              <LoadingDots />
              Connecting
            </span>
          ) : isConnected ? (
            "Submit"
          ) : (
            "Connect"
          )}
        </ActionButton>
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
  const totalSteps = variant === "freeform-first" ? 4 : 3;
  const questions =
    variant === "freeform-first" ? FREEFORM_QUESTIONS : STRUCTURED_QUESTIONS;
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
  const [linearConnection, setLinearConnection] =
    useState<ConnectionStatus>("disconnected");
  const [automationBrief, setAutomationBrief] = useState("");
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

  const question = questions[step] ?? null;
  const answers = answersByStep[step];

  const toggle = (id: OptionId) => {
    if (transitioning || question == null) return;
    const answerStep = step;
    const currentSelections = answersByStep[answerStep].selected;
    const wasSelected = currentSelections.includes(id);
    const nextSelections = wasSelected
      ? currentSelections.filter((option) => option !== id)
      : [...currentSelections, id];

    setAnswersByStep((current) => {
      const selected = current[answerStep].selected;
      return {
        ...current,
        [answerStep]: {
          ...current[answerStep],
          selected: selected.includes(id)
            ? selected.filter((option) => option !== id)
            : [...selected, id],
        },
      };
    });

    if (variant === "structured" && step === 1) {
      const hadKnownAutomationBranch =
        currentSelections.length === 1 &&
        currentSelections[0] === "intent-automation";
      const hasKnownAutomationBranch =
        nextSelections.length === 1 && nextSelections[0] === "intent-automation";

      if (!hadKnownAutomationBranch && hasKnownAutomationBranch) {
        announce("Automation setup, step 1 of 3");
      } else if (hadKnownAutomationBranch && !hasKnownAutomationBranch) {
        announce(
          nextSelections.length > 1
            ? "Choose one task to see its steps"
            : "Step count hidden",
        );
      }
    }
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

  const connectLinear = () => {
    if (transitioning || linearConnection !== "disconnected") return;
    if (connectionTimerRef.current != null) clearTimeout(connectionTimerRef.current);

    setLinearConnection("connecting");
    announce("Connecting Linear");
    connectionTimerRef.current = setTimeout(
      () => {
        setLinearConnection("connected");
        announce("Linear connected");
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
    if (step < totalSteps) {
      const nextStep = (step + 1) as Step;
      moveToStep(
        nextStep,
        1,
        knownTotalSteps == null
          ? "Moved to the next question"
          : `Moved to step ${nextStep} of ${knownTotalSteps}`,
        focusHeadingAfter,
      );
      return;
    }

    const needsLinearConnection =
      variant === "structured" &&
      answersByStep[3].selected.includes("trigger-event") &&
      linearConnection !== "connected";

    if (needsLinearConnection) {
      moveToTriggerView("connect-app", 1, "Ready to connect the Linear trigger");
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
          : `Skipped to step ${nextStep} of ${knownTotalSteps}`,
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
  const rootSelections = answersByStep[1].selected;
  const automationFlowSelected =
    variant === "structured" &&
    rootSelections.length === 1 &&
    rootSelections[0] === "intent-automation";
  const knownTotalSteps =
    variant === "freeform-first"
      ? totalSteps
      : automationFlowSelected
        ? totalSteps
        : null;
  const showStepper = knownTotalSteps != null;
  const showLinearConnector =
    variant === "structured" && step === 3 && triggerView === "connect-app";
  const needsLinearConnection =
    variant === "structured" &&
    step === 3 &&
    selected.includes("trigger-event") &&
    linearConnection !== "connected";
  const questionTitle =
    showLinearConnector
      ? "Connect the trigger"
      : question?.title ??
        (variant === "freeform-first"
          ? "Describe your automation"
          : "Create an automation");
  const pageHeight = question
    ? question.options.length * 58 + (question.allowOther ? 56 : 0)
    : 230;
  const optionsHeight = pageHeight + 1;
  const expandedHeight = showLinearConnector ? 186 : pageHeight + 93;
  const titleMotion: TitleMotion = {
    direction,
    distance: reduceMotion ? 0 : 8,
    enterDuration: reduceMotion ? 0 : 0.16,
    exitDuration: reduceMotion ? 0 : 0.1,
  };
  const answerCount = Object.values(answersByStep).reduce(
    (total, stepAnswers) =>
      total + stepAnswers.selected.length + (stepAnswers.other.trim() ? 1 : 0),
    variant === "freeform-first" && automationBrief.trim() ? 1 : 0,
  );

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
      animate={{ height: isQuestionStage ? (collapsed ? 44 : expandedHeight) : 44 }}
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
      data-stepper={showStepper ? "visible" : "hidden"}
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
              <motion.span
                className="ims-step-slot"
                aria-hidden={showStepper ? undefined : true}
                animate={{ width: showStepper ? 40 : 0 }}
                initial={false}
                transition={{
                  duration: reduceMotion ? 0 : 0.22,
                  ease: EASE_FAST,
                }}
              >
                <AnimatePresence initial={false}>
                  {showStepper ? (
                    <motion.span
                      key="known-stepper"
                      className="ims-step"
                      aria-label={`Step ${step} of ${knownTotalSteps}`}
                      initial={{
                        opacity: 0,
                        x: reduceMotion ? 0 : -5,
                        scale: reduceMotion ? 1 : 0.94,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        transition: {
                          delay: reduceMotion ? 0 : 0.05,
                          duration: reduceMotion ? 0 : 0.16,
                          ease: EASE_FAST,
                        },
                      }}
                      exit={{
                        opacity: 0,
                        x: reduceMotion ? 0 : -4,
                        scale: reduceMotion ? 1 : 0.96,
                        transition: {
                          duration: reduceMotion ? 0 : 0.12,
                          ease: EASE_EXIT,
                        },
                      }}
                    >
                      <span className="ims-step-counter" aria-hidden="true">
                        <span className="ims-step-window">
                          <span className="ims-step-value">{step}</span>
                        </span>
                        <span>/{knownTotalSteps}</span>
                      </span>
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </motion.span>
              <h2
                ref={titleRef}
                id={titleId}
                className="ims-title"
                tabIndex={-1}
                aria-label={questionTitle}
              >
                <AnimatePresence initial={false} mode="sync" custom={titleMotion}>
                  <motion.span
                    key={`${step}:${triggerView}`}
                    className="ims-title-value"
                    aria-hidden="true"
                    custom={titleMotion}
                    variants={TITLE_SLOT_VARIANTS}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    {questionTitle}
                  </motion.span>
                </AnimatePresence>
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
                  className={`ims-body ${showLinearConnector ? "ims-body--connector" : ""}`}
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
              {showLinearConnector ? (
                <LinearConnector
                  status={linearConnection}
                  disabled={transitioning}
                  onBack={() =>
                    moveToTriggerView("choices", -1, "Returned to trigger choices")
                  }
                  onPrimary={() => {
                    if (linearConnection === "connected") {
                      completeFlow("saved");
                      return;
                    }
                    connectLinear();
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
                        knownTotalSteps == null
                          ? "Available choices"
                          : `Available choices, step ${step} of ${knownTotalSteps}`
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
                          <NumberKey>4</NumberKey>
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
                            placeholder="Other"
                            aria-label="Other choice"
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
                              knownTotalSteps == null
                                ? "Returned to the previous question"
                                : `Returned to step ${previousStep} of ${knownTotalSteps}`,
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
                    disabled={transitioning}
                    primary
                    onClick={() => continueFlow()}
                  >
                    {step === totalSteps && !needsLinearConnection ? "Submit" : "Continue"}
                  </ActionButton>
                </div>
                  </footer>
                </>
              )}
                </motion.div>
              ) : null}
            </AnimatePresence>
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
