'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type RefObject, useEffect, useRef, useState } from 'react'

import { Button, ButtonSize, ButtonVariant } from '#components/button'
import { Dialog } from '#components/dialog'
import { FormProgress } from '#components/form-progress'
import {
  IconArrowUp,
  IconChevronLeftMedium,
  IconChevronRightMedium,
} from '#components/icon'
import { MultiSelect } from '#components/multi-select'
import { Select } from '#components/select'
import { Text, TextColor, TextFont, TextSize } from '#components/text'
import { TextArea } from '#components/text-area'
import { TextField, type TextFieldActions } from '#components/text-field'
import { Toast, useToast } from '#components/toast'
import { cn } from '#lib/cn'
import { easeSpring } from '#lib/motion'
import { WaitlistArrowButton } from './arrow-button'
import { GlimmLightbox, type GlimmLightboxHandle } from './glimm-lightbox'
import {
  arrowReveal,
  arrowTuck,
  enterAt,
  fieldReflow,
  STAGGER_BLOCK,
  screenExit,
} from './motion'
import { Rise, Screen, StaggeredTitle } from './screen-shell'
import {
  bonusAnswersFrom,
  DONE_SCREEN,
  EMAIL_INPUT_PROPS,
  isLinkedInUrlInput,
  joinAnswersFrom,
  nearestAvailableStep,
  nextAvailableStep,
  previousAvailableStep,
  progressFor,
  SCREENS,
  stepIdFor,
  suggestEmailCorrection,
  titleFor,
  WAITLIST_AUTOFILL_SUPPRESSION_PROPS,
} from './screens'
import type {
  WaitlistAdvance,
  WaitlistAdvanceResume,
  WaitlistAdvanceStop,
  WaitlistAnswers,
  WaitlistBeforeAdvanceResult,
  WaitlistProgress,
} from './types'

// The arrow's reserved room: the 64px (w-16) button + the 8px gap to the field.
// A spacer of this width animates open/closed so the field reflows its real
// width (a flexbox change), never a `scaleX` that would stretch the text inside.
const ARROW_SLOT = 72
const SELECT_COLLISION_AVOIDANCE = { align: 'shift', side: 'none' } as const
const WAITLIST_SAVE_ERROR =
  "We couldn't join the waitlist right now. Please try again in a moment."
const FLAT_CONTROL_CLASSES =
  'rounded-none [--input-glow-width:0px] md:h-12 md:px-4 md:text-size-md md:leading-6 [&_input]:md:text-size-md [&_input]:md:leading-6 [&_span]:md:text-size-md [&_span]:md:leading-6'
const FLAT_POPUP_CLASSES = 'rounded-none font-sans shadow-none'

interface EmailSuggestionReview {
  key: string
  suggestion: string
}

// A stable empty array for the controlled multiselect value: a fresh `[]` each
// render would re-fire Base UI's reference-keyed value-change effects while the
// answer is empty (harmless, but needless churn).
const EMPTY_SELECTION: string[] = []

function emailReviewKey(value: string): string {
  return value.trim().toLowerCase()
}

/** The support address, shown on both success screens as a mailto link. */
function ContactEmail() {
  return (
    <a
      className="rounded-sm text-text-primary focus-ring"
      href="mailto:hello@ando.so"
    >
      hello@ando.so
    </a>
  )
}

function clampStep(step: number): number {
  return Math.min(Math.max(step, 0), SCREENS.length - 1)
}

function resolveStep(step: number, answers: WaitlistAnswers): number {
  return nearestAvailableStep(clampStep(step), answers)
}

function isAdvanceStop(
  result: WaitlistBeforeAdvanceResult | undefined,
): result is WaitlistAdvanceStop {
  return (
    typeof result === 'object' &&
    result !== null &&
    'advance' in result &&
    result.advance === false
  )
}

function isAdvanceResume(
  result: WaitlistBeforeAdvanceResult | undefined,
): result is WaitlistAdvanceResume {
  return (
    typeof result === 'object' &&
    result !== null &&
    'step' in result &&
    typeof result.step === 'number'
  )
}

export interface WaitlistFlowProps {
  /**
   * Open the dialog on mount instead of waiting on the "Get access" trigger.
   * Used by Storybook (and any deep-link straight into the flow); the website
   * leaves it closed until the trigger is clicked.
   */
  defaultOpen?: boolean
  /**
   * Controlled open state. When provided, the built-in "Get access" trigger is
   * not rendered - an external control (the nav button, the hero email field)
   * drives the dialog through `WaitlistProvider` / `useWaitlist`. Pair a fresh
   * `key` with each open so `initialStep`/`initialAnswers` re-seed the flow.
   */
  open?: boolean
  /** Controlled open-change handler (pairs with `open`). */
  onOpenChange?: (open: boolean) => void
  /**
   * Seed the flow partway through, treating every screen up to `initialStep` as
   * already visited so the header's back/forward buttons replay them. Used by
   * Storybook and by the hero email field (which opens straight onto the name
   * screen with the email pre-filled); the bare website trigger starts at 0.
   */
  initialStep?: number
  /** Pre-filled answers to pair with `initialStep`. */
  initialAnswers?: WaitlistAnswers
  /** Fired at the confirmation with the join answers (email, name, LinkedIn, source). */
  onJoin?: (answers: WaitlistAnswers) => void
  /** Fired at the end with the bonus answers (company, role, size, agent questions). */
  onBonus?: (answers: WaitlistAnswers) => void
  /**
   * Fired while open whenever progress changes - the furthest screen reached
   * plus the answers so far - so a host can persist a resumable draft. `step`
   * is the furthest reached (not the screen currently viewed), so reopening on
   * it replays every prior screen. Only fires while the dialog is open, so it
   * never clobbers a saved draft from a closed/initial mount.
   */
  onProgressChange?: (progress: WaitlistProgress) => void
  /**
   * Fired before forward submit actions advance the flow. Return `false` to keep
   * the user on the current screen, used by the website to guarantee the first
   * email save creates a durable backend row.
   */
  onBeforeAdvance?: (
    advance: WaitlistAdvance,
  ) => WaitlistBeforeAdvanceResult | Promise<WaitlistBeforeAdvanceResult>
}

/**
 * The entire waitlist flow from the May 2026 brand frames, wired together:
 * the "Your info" questions (email with validation, name, LinkedIn, source)
 * -> confirmation -> the "Bonus" questions (company name/role/size, then the
 * agent questions, ending in the TextArea) -> done. The header's back/forward
 * buttons replay visited screens, the identity block appears once the email
 * is submitted, and the footer's FormProgress animates between states.
 * Closing the dialog resets the flow.
 *
 * Screens hand off with the shared motion recipe (see styles/motion.css):
 * word-staggered headings and scaling fields blur in while the old screen
 * blurs up and away; a rejected submit shakes the field row and reddens the
 * field border.
 */
export function WaitlistFlow({
  defaultOpen = false,
  open,
  onOpenChange,
  initialStep = 0,
  initialAnswers = {},
  onJoin,
  onBonus,
  onProgressChange,
  onBeforeAdvance,
}: WaitlistFlowProps = {}) {
  // Controlled when `open` is supplied: the trigger is owned externally (the
  // provider), so the built-in "Get access" button is dropped.
  const controlled = open !== undefined
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(() =>
    resolveStep(initialStep, initialAnswers),
  )
  // Furthest screen reached; the forward button can re-advance up to here.
  const [maxStep, setMaxStep] = useState(() =>
    resolveStep(initialStep, initialAnswers),
  )
  const [answers, setAnswers] = useState<WaitlistAnswers>(initialAnswers)
  // Errors are deferred: a failing validator paints nothing until a submit is
  // attempted, and typing (or leaving the screen) clears the attempt again.
  const [submitAttempted, setSubmitAttempted] = useState(false)
  // Replays `animate-shake` on the field row; cleared by its animationend.
  const [shaking, setShaking] = useState(false)
  // The arrow's first appearance on a screen rides the screen entrance (same
  // timing as the field). Only a fill/empty while staying on the screen plays
  // the quicker in-place reveal/tuck - tracked by which screen has settled in.
  // Without this, every back/forward to an already-answered screen replays the
  // reveal pop, desynced from the entering field.
  const [settledScreenId, setSettledScreenId] = useState<string | null>(null)
  // Tracks the controlled `open` across renders so a close->open edge can
  // re-seed the flow (see below).
  const [wasOpen, setWasOpen] = useState(open ?? false)
  const [advancing, setAdvancing] = useState(false)
  const [emailReview, setEmailReview] = useState<EmailSuggestionReview | null>(
    null,
  )
  const [dismissedEmailSuggestionKey, setDismissedEmailSuggestionKey] =
    useState<string | null>(null)
  const { toast, showToast, clearToast } = useToast()
  // Bumped on each open. The uncontrolled text fields cache their seed in a ref
  // keyed by screen so it stays stable across keystrokes (Base UI warns on a
  // changing `defaultValue`); without this generation, reopening on the same
  // screen it last showed wouldn't refresh that seed, so a remembered answer
  // wouldn't repopulate its field.
  const [openGeneration, setOpenGeneration] = useState(0)
  // Imperative field actions per text screen, so a failed submit of a
  // never-touched field (validation only runs on change) can validate. One
  // ref per screen id - during the exit/enter overlap the outgoing screen's
  // TextField is still mounted, and on a shared ref its delayed unmount
  // would null out the incoming field's actions.
  const fieldActionsRefs = useRef(
    new Map<string, RefObject<TextFieldActions | null>>(),
  )

  function fieldActionsFor(id: string): RefObject<TextFieldActions | null> {
    let ref = fieldActionsRefs.current.get(id)
    if (ref == null) {
      ref = { current: null }
      fieldActionsRefs.current.set(id, ref)
    }
    return ref
  }

  function setAnswer(id: string, value: string | string[]) {
    setSubmitAttempted(false)
    if (id === 'email' && typeof value === 'string') {
      const key = emailReviewKey(value)
      setEmailReview((review) => (review?.key === key ? review : null))
      setDismissedEmailSuggestionKey((dismissed) =>
        dismissed === key ? dismissed : null,
      )
    }
    setAnswers((prev) => {
      const next = { ...prev, [id]: value }

      if (id === 'source' && value !== 'Other') {
        delete next.source_other
      }
      if (id === 'communicate' && value !== 'Other') {
        delete next.communicate_other
      }
      if (id === 'usage' && value === 'Not using them yet') {
        delete next.agents
        delete next.agents_other
      }
      if (
        id === 'agents' &&
        (!Array.isArray(value) || !value.includes('Custom harnesses'))
      ) {
        delete next.agents_other
      }

      return next
    })
  }

  // Narrows an answer to the string[] a multiselect screen expects, without an
  // `as` cast (Array.isArray would widen to any[] in a value position). The
  // empty case returns the shared constant so the controlled value stays
  // referentially stable across renders.
  function asArray(value: string | string[] | undefined): string[] {
    return Array.isArray(value) ? value : EMPTY_SELECTION
  }

  // The glimm sweep behind the success screens; fired from `goTo` below.
  const glimmRef = useRef<GlimmLightboxHandle | null>(null)

  function navigate(next: number, nextAnswers = answers) {
    setSubmitAttempted(false)
    setShaking(false)
    setEmailReview(null)
    setStep(resolveStep(next, nextAnswers))
  }

  function goTo(next: number, nextAnswers = answers) {
    const resolvedNext = resolveStep(next, nextAnswers)
    navigate(resolvedNext, nextAnswers)
    clearToast()
    setMaxStep((max) => Math.max(max, resolvedNext))
    // The two success screens are the submit boundaries (forward-only: replays
    // go through `navigate`, not `goTo`). Each also sweeps the lightbox.
    const kind = SCREENS[resolvedNext]?.kind
    if (kind === 'confirmation') {
      glimmRef.current?.sweep()
      onJoin?.(joinAnswersFrom(nextAnswers))
    } else if (kind === 'done') {
      glimmRef.current?.sweep()
      onBonus?.(bonusAnswersFrom(nextAnswers))
    }
  }

  function resumeTo(next: number, nextAnswers?: WaitlistAnswers) {
    const resumeAnswers = nextAnswers ?? answers
    const resolvedNext = resolveStep(next, resumeAnswers)
    clearToast()
    if (nextAnswers != null) {
      setAnswers(nextAnswers)
    }
    navigate(resolvedNext, resumeAnswers)
    setMaxStep((max) => Math.max(max, resolvedNext))
  }

  async function advanceTo(next: number, nextAnswers = answers) {
    if (advancing) {
      return
    }

    const resolvedNext = resolveStep(next, nextAnswers)
    setAdvancing(true)
    try {
      const advanceResult =
        (await onBeforeAdvance?.({
          answers: nextAnswers,
          fromStep: step,
          fromStepId: screen.id,
          toStep: resolvedNext,
          toStepId: stepIdFor(resolvedNext),
        })) ?? true

      if (advanceResult === false) {
        setSubmitAttempted(true)
        setShaking(true)
        showToast(WAITLIST_SAVE_ERROR)
        fieldActionsFor(screen.id).current?.validate()
        return
      }

      if (isAdvanceStop(advanceResult)) {
        if (advanceResult.close) {
          onOpenChange?.(false)
        }
        if (advanceResult.showError) {
          setSubmitAttempted(true)
          setShaking(true)
          showToast(WAITLIST_SAVE_ERROR)
          fieldActionsFor(screen.id).current?.validate()
        }
        return
      }

      if (isAdvanceResume(advanceResult)) {
        resumeTo(advanceResult.step, advanceResult.answers)
        return
      }

      goTo(resolvedNext, nextAnswers)
    } catch {
      setSubmitAttempted(true)
      setShaking(true)
      showToast(WAITLIST_SAVE_ERROR)
      fieldActionsFor(screen.id).current?.validate()
    } finally {
      setAdvancing(false)
    }
  }

  function reset() {
    const resolvedInitialStep = resolveStep(initialStep, initialAnswers)
    navigate(resolvedInitialStep, initialAnswers)
    setMaxStep(resolvedInitialStep)
    setAnswers(initialAnswers)
  }

  // Controlled re-seed: the provider updates initialStep/initialAnswers and
  // then flips `open` to true, so on that close->open edge restart the flow on
  // the requested screen (the hero opens straight onto the name screen). This
  // adjusts state during render (React's "previous value" pattern) instead of
  // remounting or using an effect - so the Dialog still plays its enter
  // transition and there's no flash of the previous screen. Uncontrolled
  // (Storybook) usage leaves `open` undefined and keeps resetting on close.
  if (open !== undefined && open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      const resolvedInitialStep = resolveStep(initialStep, initialAnswers)
      setStep(resolvedInitialStep)
      setMaxStep(resolvedInitialStep)
      setAnswers(initialAnswers)
      setSubmitAttempted(false)
      setShaking(false)
      setOpenGeneration((generation) => generation + 1)
    }
  }

  // `step` is always in range; the fallback only satisfies
  // `noUncheckedIndexedAccess`.
  const screen = SCREENS[step] ?? DONE_SCREEN
  // The text/textarea fields are uncontrolled (they own the typed value);
  // `defaultValue` only seeds them on mount - e.g. a back-navigated answer.
  // Feeding the live `answers[screen.id]` back as `defaultValue` would hand
  // Base UI a *changing* default on every keystroke (since `setAnswer` updates
  // it), which it warns about ("changing the default value of an uncontrolled
  // field"). So snapshot the seed once per screen and keep it referentially
  // stable until the screen id changes (each remount reads the fresh answer).
  // Only string answers seed an uncontrolled field; multiselect screens are
  // controlled (their array answer never feeds defaultValue).
  const seedRaw = answers[screen.id]
  const seedValue = typeof seedRaw === 'string' ? seedRaw : ''
  // Refresh the cached seed when the screen changes *or* the dialog reopens
  // (`openGeneration`) - the latter so a remembered answer re-seeds its field
  // even when reopening on the same screen the flow last showed.
  const seedKey = `${openGeneration}:${screen.id}`
  const seededValueRef = useRef<{ key: string; value: string }>({
    key: seedKey,
    value: seedValue,
  })
  if (seededValueRef.current.key !== seedKey) {
    seededValueRef.current = { key: seedKey, value: seedValue }
  }
  const seededValue = seededValueRef.current.value
  const title = titleFor(screen, answers)
  const textFieldValue = typeof seedRaw === 'string' ? seedRaw : ''
  const fieldValidationError =
    screen.kind === 'text' && submitAttempted && emailReview == null
      ? (screen.validate?.(textFieldValue) ?? null)
      : null
  // Live under-field hint; null on screens without one. Validation errors take
  // this slot so every red outline has nearby text explaining it.
  const fieldHint =
    fieldValidationError == null &&
    screen.kind === 'text' &&
    screen.preview != null
      ? screen.preview(textFieldValue)
      : null
  const resolvedMaxStep = resolveStep(maxStep, answers)
  const previousStep = previousAvailableStep(step, answers)
  const nextVisitedStep = nextAvailableStep(step, answers, resolvedMaxStep)
  const nextStep = nextAvailableStep(step, answers)
  const textPrefix =
    screen.kind === 'text' &&
    screen.prefix != null &&
    !(
      screen.id === 'linkedin' &&
      typeof seedRaw === 'string' &&
      isLinkedInUrlInput(seedRaw)
    )
      ? screen.prefix
      : null
  const inlineTextPrefix =
    screen.kind === 'text' && screen.prefix != null
      ? (textPrefix ?? '')
      : undefined
  const progress = progressFor(step)
  // The submit arrow only shows once the current field is answered (empty
  // fields hide it, matching Frame 206); the field reflows to make room as it
  // tucks in. Selects fill on pick, text fields on type, multiselects once at
  // least one option is picked - but a validated field (email, LinkedIn) waits
  // until the value is actually valid, so the arrow never invites a submit that
  // would only bounce.
  const currentAnswer = answers[screen.id]
  const filled =
    screen.kind === 'multiselect'
      ? Array.isArray(currentAnswer) && currentAnswer.length > 0
      : typeof currentAnswer === 'string' &&
        currentAnswer.trim() !== '' &&
        (screen.kind !== 'text' ||
          screen.validate == null ||
          screen.validate(currentAnswer) == null)
  // A single-select answer is always a string (its icon keys + value prop want
  // one); multiselect answers read from the array via `asArray` instead.
  const selectValue = typeof currentAnswer === 'string' ? currentAnswer : ''
  // On entrance the field mounts at its final (room-made) width, so the arrow
  // just blurs/scales in alongside it on the screen-entrance timing (no slide).
  // Once the screen has settled, an in-place fill slides the arrow in from the
  // right (and an empty tucks it away) as the field reflows to make room.
  const screenSettled = settledScreenId === screen.id
  const arrowMotionInitial = screenSettled
    ? { opacity: 0, x: 16, scale: 0.8, filter: 'blur(8px)' }
    : { opacity: 0, scale: 1.1, filter: 'blur(8px)' }
  const arrowInitial = reduceMotion ? false : arrowMotionInitial
  const arrowEnterTransition = screenSettled
    ? arrowReveal
    : enterAt(STAGGER_BLOCK, { settle: true })
  // The under-field hint mirrors the textarea screen's helper line: the same
  // Rise block entrance (20px rise, blur 10, shared timing) and the standard
  // screen blur-up exit.
  const hintInitial = reduceMotion
    ? false
    : { opacity: 0, y: 20, filter: 'blur(10px)' }

  // Focus the incoming screen's field on each screen change: the outgoing
  // screen takes focus down with it when it unmounts, which would strand
  // Enter-driven flows. Desktop only - autofocusing on touch devices pops
  // the keyboard unexpectedly. Both refs always point at the newest mounted
  // field (the exiting clone attached earlier and is overwritten on mount).
  const fieldRef = useRef<HTMLInputElement | null>(null)
  const textAreaFieldRef = useRef<HTMLTextAreaElement | null>(null)
  const [selectRowElement, setSelectRowElement] =
    useState<HTMLDivElement | null>(null)
  const selectTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [multiSelectRowElement, setMultiSelectRowElement] =
    useState<HTMLDivElement | null>(null)
  // Separate from selectTriggerRef so a select->multiselect transition doesn't
  // collide on a shared ref during the popLayout exit/enter overlap.
  const multiSelectTriggerRef = useRef<HTMLButtonElement | null>(null)
  const confirmContinueRef = useRef<HTMLButtonElement | null>(null)

  function showEmailSuggestionIfNeeded(value: string): boolean {
    const key = emailReviewKey(value)
    const suggestion = suggestEmailCorrection(value)
    if (suggestion == null || dismissedEmailSuggestionKey === key) {
      return false
    }

    setEmailReview({ key, suggestion })
    setSubmitAttempted(false)
    setShaking(false)
    clearToast()
    return true
  }

  function setRenderedTextFieldValue(value: string) {
    if (fieldRef.current != null) {
      fieldRef.current.value = value
    }
  }

  function acceptEmailSuggestion(review: EmailSuggestionReview) {
    const nextAnswers = { ...answers, email: review.suggestion }
    setRenderedTextFieldValue(review.suggestion)
    setAnswers(nextAnswers)
    setEmailReview(null)
    setDismissedEmailSuggestionKey(emailReviewKey(review.suggestion))
    if (nextStep != null) {
      void advanceTo(nextStep, nextAnswers)
    }
  }

  function keepReviewedEmail(review: EmailSuggestionReview) {
    setEmailReview(null)
    setDismissedEmailSuggestionKey(review.key)
    if (nextStep != null) {
      void advanceTo(nextStep)
    }
  }

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return
    }
    if (screen.kind === 'text') {
      fieldRef.current?.focus()
    } else if (screen.kind === 'textarea') {
      textAreaFieldRef.current?.focus()
    } else if (screen.kind === 'select') {
      // Focus the trigger (doesn't open the popup) so Enter/Space opens it.
      selectTriggerRef.current?.focus()
    } else if (screen.kind === 'multiselect') {
      // Same as the select: focus the trigger so Enter/Space opens the popup.
      multiSelectTriggerRef.current?.focus()
    } else if (screen.kind === 'confirmation') {
      // The "Woohoo!" screen: focus Continue so Enter advances to the bonus.
      confirmContinueRef.current?.focus()
    }
  }, [screen])

  // Mark the screen settled after its entrance commit, so a later fill/empty
  // plays the in-place reveal/tuck instead of the entrance recipe. Separate
  // from the focus effect above (which bails early on touch devices) - the
  // mobile select arrow still needs the in-place reveal.
  useEffect(() => {
    setSettledScreenId(screen.id)
  }, [screen.id])

  // Persist progress (furthest screen + answers) while the dialog is open, so a
  // host can reopen the flow where the user left off. Guarded on `open` so a
  // closed/initial mount never writes an empty draft over a saved one; runs
  // after the open-edge re-seed has committed, so it sees real progress, not the
  // transient pre-seed state.
  useEffect(() => {
    if (!open) {
      return
    }
    onProgressChange?.({
      step: resolvedMaxStep,
      stepId: stepIdFor(resolvedMaxStep),
      answers,
    })
  }, [open, resolvedMaxStep, answers, onProgressChange])

  return (
    <Dialog
      defaultOpen={controlled ? undefined : defaultOpen}
      disablePointerDismissal
      onOpenChange={(next) => {
        if (!next) {
          reset()
        }
        onOpenChange?.(next)
      }}
      open={open}
    >
      {controlled ? null : (
        <Dialog.Trigger
          render={<Button className="rounded-none">Get access</Button>}
        />
      )}
      <Dialog.Popup
        backdrop={<GlimmLightbox ref={glimmRef} />}
        className="rounded-sm border border-border-default font-sans shadow-none md:rounded-sm"
        label="Join the waitlist"
      >
        <Dialog.Header
          end={<Dialog.Close className="rounded-none" />}
          start={
            <>
              <Button
                aria-label="Back"
                className="hit-area-x-1 hit-area-y-1.5 size-8 rounded-none"
                disabled={previousStep == null}
                onClick={() => {
                  if (previousStep != null) {
                    navigate(previousStep)
                  }
                }}
                size={ButtonSize.Small}
                variant={ButtonVariant.Secondary}
              >
                <IconChevronLeftMedium />
              </Button>
              <Button
                aria-label="Forward"
                className="hit-area-x-1 hit-area-y-1.5 size-8 rounded-none"
                disabled={nextVisitedStep == null}
                onClick={() => {
                  if (nextVisitedStep != null) {
                    navigate(nextVisitedStep)
                  }
                }}
                size={ButtonSize.Small}
                variant={ButtonVariant.Secondary}
              >
                <IconChevronRightMedium />
              </Button>
            </>
          }
        >
          <AnimatePresence>
            {step > 0 && (
              <motion.div
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                className="flex flex-col"
                exit={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: 0,
                        filter: 'blur(4px)',
                        transition: { duration: 0.2, ease: 'easeOut' },
                      }
                }
                initial={
                  reduceMotion ? false : { opacity: 0, filter: 'blur(4px)' }
                }
                transition={{ duration: 0.53, ease: easeSpring }}
              >
                <Text
                  aria-label="Joining as"
                  as="span"
                  color={TextColor.Tertiary}
                  size={TextSize.XS}
                >
                  {/* Break the word so iOS Safari data detectors do not fold the
                  trailing "as" into the email link below and underline it. */}
                  Joining a​s
                </Text>
                <Text as="span" size={TextSize.Small}>
                  {answers.email}
                </Text>
              </motion.div>
            )}
          </AnimatePresence>
        </Dialog.Header>

        {/* `relative` anchors popLayout's pinned exiting screen and the toast. */}
        <Dialog.Body className="relative">
          <Toast className="bottom-6" toast={toast} />
          <AnimatePresence mode="popLayout">
            {screen.kind === 'text' && (
              <Screen className="justify-center" key={screen.id}>
                <form
                  // max-w 572px = 500px field + 8px gap + 64px arrow, so the
                  // field caps at 500px on wide screens (and shrinks below it
                  // on narrow ones) with the arrow flush right.
                  className="mx-auto flex w-full max-w-[572px] flex-col gap-8 md:gap-12"
                  // The field validator sets customValidity, so without
                  // noValidate the browser pops its native bubble and blocks
                  // submit - onSubmit never fires and the shake/error never run.
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault()
                    // A text screen's answer is always a string.
                    const raw = answers[screen.id]
                    const value = typeof raw === 'string' ? raw : ''
                    const error = screen.validate?.(value) ?? null
                    if (error == null && nextStep != null) {
                      if (
                        screen.id === 'email' &&
                        showEmailSuggestionIfNeeded(value)
                      ) {
                        return
                      }
                      void advanceTo(nextStep)
                      return
                    }
                    setSubmitAttempted(true)
                    setShaking(true)
                    // An untouched field has never validated (validation
                    // runs on change), so its `data-invalid` wouldn't exist
                    // yet - run it so the danger border appears.
                    fieldActionsFor(screen.id).current?.validate()
                  }}
                >
                  {/* `layout="position"` so the heading slides (not jumps) to
                        its new spot when the hint below toggles the column
                        height and the centered stack re-centers - on the same
                        spring the field rides. */}
                  <motion.div
                    layout="position"
                    transition={{
                      layout: reduceMotion ? { duration: 0 } : fieldReflow,
                    }}
                  >
                    <StaggeredTitle text={title} />
                  </motion.div>
                  {/* 500px field + 8px gap + 64x48 secondary submit arrow
                        (Frame 206; only shown on filled fields, matching the
                        design). The arrow is placed absolutely over a spacer
                        that reserves its room (see below), so `relative` here is
                        its positioning context. The svg override restores the
                        design's 24px arrow (the button's em-based icon sizing
                        lands at 18px). A rejected submit shakes the whole row
                        (and the animationend re-arms it). */}
                  {/* The hint sits below the input+arrow row, outside the
                      field's `layout="position"` wrapper - so toggling it only
                      grows/shrinks the centered column (which slides the field
                      and heading to re-center), never the field's own box. */}
                  <div>
                    <div
                      className={cn(
                        'relative flex items-start',
                        shaking && 'animate-shake',
                      )}
                      onAnimationEnd={() => setShaking(false)}
                    >
                      {/* Rises in (not a scale: scaling the box scales the text
                            inside it). `layout="position"` slides the field
                            vertically when the hint below re-centers the column;
                            its width reflows for real off the spacer sibling
                            (flexbox), so neither axis is a `scaleX` that would
                            stretch the text. */}
                      <motion.div
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        className="w-full min-w-0"
                        initial={
                          reduceMotion
                            ? false
                            : { opacity: 0, y: 16, filter: 'blur(8px)' }
                        }
                        layout="position"
                        transition={{
                          ...enterAt(STAGGER_BLOCK, { settle: true }),
                          layout: reduceMotion ? { duration: 0 } : fieldReflow,
                        }}
                      >
                        <div className="relative">
                          <TextField
                            {...(screen.id === 'email'
                              ? EMAIL_INPUT_PROPS
                              : WAITLIST_AUTOFILL_SUPPRESSION_PROPS)}
                            actionsRef={fieldActionsFor(screen.id)}
                            className={FLAT_CONTROL_CLASSES}
                            defaultValue={seededValue}
                            label={title}
                            onBlur={() => {
                              // Empty on blur clears the deferred error (neutral);
                              // an invalid filled field keeps its red.
                              const raw = answers[screen.id]
                              if (
                                typeof raw !== 'string' ||
                                raw.trim() === ''
                              ) {
                                setSubmitAttempted(false)
                              }
                            }}
                            onValueChange={(value) =>
                              setAnswer(screen.id, value)
                            }
                            placeholder={screen.placeholder}
                            prefix={inlineTextPrefix}
                            ref={fieldRef}
                            showError={submitAttempted}
                            showErrorMessage={false}
                            type={screen.type}
                            validate={
                              screen.validate == null
                                ? undefined
                                : (value) =>
                                    screen.validate?.(String(value)) ?? null
                            }
                          />
                        </div>
                      </motion.div>
                      {/* Spacer: reserves the arrow's room (`ARROW_SLOT`) so the
                          field reflows its real width as the arrow grows in - a
                          flexbox width change, not a `scaleX`. Shown on mobile too
                          (like the select), so the field makes room for the
                          tappable arrow. `initial={false}` so an already-filled
                          screen enters at the final width instead of animating the
                          room open. */}
                      <motion.div
                        animate={{ width: filled ? ARROW_SLOT : 0 }}
                        aria-hidden
                        className="shrink-0"
                        initial={false}
                        transition={
                          reduceMotion ? { duration: 0 } : fieldReflow
                        }
                      />
                      {/* The arrow sits absolutely over that reserved room and
                          reveals/tucks in place (slide + blur) - the spacer is
                          what actually moves the field. Shown on mobile too (like
                          the select), so the email/LinkedIn fields get a tappable
                          submit instead of only the keyboard go key (the form's
                          onSubmit still rides that key as well). The button tracks
                          the control height per breakpoint, so it centers with
                          `top-0` against the 45px mobile control and 48px md+
                          control. No `initial={false}` on the
                          presence: navigating back to an already-filled screen
                          cross-fades the arrow in with the entering screen
                          instead of popping it in.
                          `layout="position"` on the wrapper so it slides
                          vertically with the field when the hint re-centers the
                          column - being absolute, it otherwise tracks the row's
                          instant move and would jump while the field slides. */}
                      <motion.div
                        className="absolute top-0 right-0"
                        layout="position"
                        transition={{
                          layout: reduceMotion ? { duration: 0 } : fieldReflow,
                        }}
                      >
                        <AnimatePresence>
                          {filled && (
                            <motion.div
                              animate={{
                                opacity: 1,
                                x: 0,
                                scale: 1,
                                filter: 'blur(0px)',
                              }}
                              exit={
                                reduceMotion
                                  ? { opacity: 0, transition: arrowTuck }
                                  : {
                                      opacity: 0,
                                      x: 16,
                                      filter: 'blur(8px)',
                                      transition: arrowTuck,
                                    }
                              }
                              initial={arrowInitial}
                              key="submit"
                              transition={arrowEnterTransition}
                            >
                              <WaitlistArrowButton
                                aria-label="Continue"
                                className="h-[45px] md:h-12"
                                disabled={advancing}
                                loading={advancing}
                                type="submit"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                    {/* A stable key keeps the hint mounted (just re-texting),
                          so it only plays its entrance/exit when it first
                          appears or fully leaves.
                          popLayout reclaims its space the instant it starts to
                          leave, so the field and heading slide back down with it
                          (their `layout="position"`) instead of snapping down
                          once it has fully gone. */}
                    <AnimatePresence mode="popLayout">
                      {fieldHint != null && (
                        <motion.div
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={
                            reduceMotion
                              ? undefined
                              : {
                                  opacity: 0,
                                  y: -16,
                                  filter: 'blur(8px)',
                                  transition: screenExit,
                                }
                          }
                          initial={hintInitial}
                          key="hint"
                          transition={enterAt(STAGGER_BLOCK)}
                        >
                          <Text
                            as="p"
                            className="mt-2 px-4 md:px-6"
                            color={TextColor.Tertiary}
                            size={TextSize.Small}
                          >
                            {fieldHint}
                          </Text>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence mode="popLayout">
                      {fieldValidationError != null && (
                        <motion.div
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={
                            reduceMotion
                              ? undefined
                              : {
                                  opacity: 0,
                                  y: -16,
                                  filter: 'blur(8px)',
                                  transition: screenExit,
                                }
                          }
                          initial={hintInitial}
                          key="field-error"
                          transition={enterAt(STAGGER_BLOCK)}
                        >
                          <div className="mt-3 flex w-full">
                            <div className="flex min-w-0 flex-1 justify-center px-4">
                              <Text
                                as="p"
                                className="max-w-full text-center text-text-danger"
                                size={TextSize.Small}
                              >
                                {fieldValidationError}
                              </Text>
                            </div>
                            <div aria-hidden className="w-[72px] shrink-0" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence mode="popLayout">
                      {screen.id === 'email' && emailReview != null && (
                        <motion.div
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={
                            reduceMotion
                              ? undefined
                              : {
                                  opacity: 0,
                                  y: -16,
                                  filter: 'blur(8px)',
                                  transition: screenExit,
                                }
                          }
                          initial={hintInitial}
                          key="email-review"
                          transition={enterAt(STAGGER_BLOCK)}
                        >
                          <div className="mt-3 flex w-full">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col items-center gap-3 px-4 text-center md:flex-row md:justify-center md:px-6">
                                <Text
                                  as="p"
                                  className="max-w-full break-words"
                                  color={TextColor.Tertiary}
                                  size={TextSize.Small}
                                >
                                  Did you mean{' '}
                                  <span className="text-text-primary">
                                    {emailReview.suggestion}
                                  </span>
                                  ?
                                </Text>
                                <div className="flex max-w-full flex-wrap justify-center gap-2">
                                  <Button
                                    className="rounded-none"
                                    onClick={() =>
                                      acceptEmailSuggestion(emailReview)
                                    }
                                    size={ButtonSize.Small}
                                    type="button"
                                    variant={ButtonVariant.Primary}
                                  >
                                    Use suggestion
                                  </Button>
                                  <Button
                                    className="rounded-none"
                                    onClick={() =>
                                      keepReviewedEmail(emailReview)
                                    }
                                    size={ButtonSize.Small}
                                    type="button"
                                    variant={ButtonVariant.Secondary}
                                  >
                                    Keep as typed
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div aria-hidden className="w-[72px] shrink-0" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </form>
              </Screen>
            )}

            {screen.kind === 'select' && (
              <Screen className="justify-center" key={screen.id}>
                <div className="mx-auto flex w-full max-w-[512px] flex-col gap-8 md:gap-12">
                  <StaggeredTitle text={title} />
                  {/* 440px select + 8px gap + 64x48 submit arrow (Frame 206;
                        see the text branch). `relative` is the positioning
                        context for the absolutely-placed arrow; an animated
                        spacer reserves its room so the select reflows for real. */}
                  <div
                    className="relative z-[100] flex items-center"
                    ref={setSelectRowElement}
                  >
                    {/* Rises in (not a scale: scaling the box scales the trigger
                          text with it). The width reflows for real off the spacer
                          sibling (flexbox), never a `scaleX`. */}
                    <motion.div
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      className="w-full min-w-0"
                      initial={
                        reduceMotion
                          ? false
                          : { opacity: 0, y: 16, filter: 'blur(8px)' }
                      }
                      transition={enterAt(STAGGER_BLOCK, { settle: true })}
                    >
                      <Select
                        label={title}
                        onValueChange={(value) =>
                          setAnswer(screen.id, value ?? '')
                        }
                        value={selectValue || null}
                      >
                        <Select.Trigger
                          className={FLAT_CONTROL_CLASSES}
                          icon={screen.valueIcons?.[selectValue]}
                          placeholder="Select an option"
                          ref={selectTriggerRef}
                        />
                        <Select.Popup
                          anchor={selectRowElement}
                          className={FLAT_POPUP_CLASSES}
                          collisionAvoidance={SELECT_COLLISION_AVOIDANCE}
                          inline
                          side="bottom"
                        >
                          {screen.options.map((option) => (
                            <Select.Item
                              className="rounded-none md:text-size-md md:leading-6"
                              icon={screen.valueIcons?.[option]}
                              key={option}
                              value={option}
                            >
                              {option}
                            </Select.Item>
                          ))}
                        </Select.Popup>
                      </Select>
                    </motion.div>
                    {/* Spacer: reserves the arrow's room (`ARROW_SLOT`) so the
                        select reflows its real width as the arrow grows in - a
                        flexbox change, not a `scaleX`. Shown on mobile too (a
                        Select has no Enter key, so the arrow stays available).
                        `initial={false}` so an answered screen enters at the
                        final width instead of animating the room open. */}
                    <motion.div
                      animate={{ width: filled ? ARROW_SLOT : 0 }}
                      aria-hidden
                      className="shrink-0"
                      initial={false}
                      transition={reduceMotion ? { duration: 0 } : fieldReflow}
                    />
                    {/* The arrow sits absolutely over that reserved room,
                        vertically centered against the trigger, and reveals/tucks
                        in place; the spacer is what moves the select. It only
                        appears once an option is picked, then advances the flow.
                        No `initial={false}` on the presence: navigating back to
                        an answered select cross-fades the arrow in with the screen
                        rather than popping it over the outgoing one. */}
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <AnimatePresence>
                        {filled && (
                          <motion.div
                            animate={{
                              opacity: 1,
                              x: 0,
                              scale: 1,
                              filter: 'blur(0px)',
                            }}
                            exit={
                              reduceMotion
                                ? { opacity: 0, transition: arrowTuck }
                                : {
                                    opacity: 0,
                                    x: 16,
                                    filter: 'blur(8px)',
                                    transition: arrowTuck,
                                  }
                            }
                            initial={arrowInitial}
                            key="submit"
                            transition={arrowEnterTransition}
                          >
                            <WaitlistArrowButton
                              aria-label="Continue"
                              className="h-[45px] md:h-12"
                              disabled={advancing}
                              loading={advancing}
                              onClick={() => {
                                if (nextStep != null) {
                                  void advanceTo(nextStep)
                                }
                              }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </Screen>
            )}

            {screen.kind === 'multiselect' && (
              <Screen className="justify-center" key={screen.id}>
                <div className="mx-auto flex w-full max-w-[512px] flex-col gap-8 md:gap-12">
                  <StaggeredTitle text={title} />
                  {/* 440px multi-select + 8px gap + 64x48 submit arrow (Frame
                        206; see the text branch). `relative` is the positioning
                        context for the absolutely-placed arrow; an animated
                        spacer reserves its room so the trigger reflows for real. */}
                  <div
                    className="relative z-[100] flex items-center"
                    ref={setMultiSelectRowElement}
                  >
                    <motion.div
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      className="w-full min-w-0"
                      initial={
                        reduceMotion
                          ? false
                          : { opacity: 0, y: 16, filter: 'blur(8px)' }
                      }
                      transition={enterAt(STAGGER_BLOCK, { settle: true })}
                    >
                      <MultiSelect
                        label={title}
                        // Non-modal so the popup (kept open while picking) has
                        // no backdrop to swallow the first arrow click - one
                        // click both closes it and advances.
                        modal={false}
                        onValueChange={(values) => setAnswer(screen.id, values)}
                        value={asArray(answers[screen.id])}
                      >
                        <MultiSelect.Trigger
                          className={FLAT_CONTROL_CLASSES}
                          placeholder="Select all that apply"
                          ref={multiSelectTriggerRef}
                        />
                        <MultiSelect.Popup
                          anchor={multiSelectRowElement}
                          className={FLAT_POPUP_CLASSES}
                          collisionAvoidance={SELECT_COLLISION_AVOIDANCE}
                          inline
                          side="bottom"
                        >
                          {screen.options.map((option) => (
                            <MultiSelect.Item
                              className="rounded-none md:text-size-md md:leading-6"
                              icon={screen.valueIcons?.[option]}
                              key={option}
                              value={option}
                            >
                              {option}
                            </MultiSelect.Item>
                          ))}
                        </MultiSelect.Popup>
                      </MultiSelect>
                    </motion.div>
                    {/* Spacer: reserves the arrow's room (`ARROW_SLOT`) so the
                        trigger reflows its real width as the arrow grows in - a
                        flexbox change, not a `scaleX`. Shown on mobile too (a
                        Select has no Enter key, so the arrow stays available).
                        `initial={false}` so an answered screen enters at the
                        final width instead of animating the room open. */}
                    <motion.div
                      animate={{ width: filled ? ARROW_SLOT : 0 }}
                      aria-hidden
                      className="shrink-0"
                      initial={false}
                      transition={reduceMotion ? { duration: 0 } : fieldReflow}
                    />
                    {/* The arrow sits absolutely over that reserved room,
                        vertically centered against the trigger, and reveals/tucks
                        in place; the spacer is what moves the trigger. It only
                        appears once at least one option is picked, then advances
                        the flow. The popup stays open while toggling selections
                        (Base UI multiple behavior); the non-modal MultiSelect has
                        no backdrop, so a single click closes it and advances.
                        No `initial={false}` on the presence: navigating back to
                        an answered multiselect cross-fades the arrow in with the
                        screen rather than popping it over the outgoing one. */}
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <AnimatePresence>
                        {filled && (
                          <motion.div
                            animate={{
                              opacity: 1,
                              x: 0,
                              scale: 1,
                              filter: 'blur(0px)',
                            }}
                            exit={
                              reduceMotion
                                ? { opacity: 0, transition: arrowTuck }
                                : {
                                    opacity: 0,
                                    x: 16,
                                    filter: 'blur(8px)',
                                    transition: arrowTuck,
                                  }
                            }
                            initial={arrowInitial}
                            key="submit"
                            transition={arrowEnterTransition}
                          >
                            <WaitlistArrowButton
                              aria-label="Continue"
                              className="h-[45px] md:h-12"
                              disabled={advancing}
                              loading={advancing}
                              onClick={() => {
                                if (nextStep != null) {
                                  void advanceTo(nextStep)
                                }
                              }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </Screen>
            )}

            {screen.kind === 'textarea' && (
              // `pb-8` keeps the fluid TextArea (flex-1) from reaching the
              // footer's progress indicators; other screens are centered so
              // they already clear it.
              <Screen className="gap-8 pt-16 pb-8 md:gap-12" key={screen.id}>
                <StaggeredTitle text={title} />
                <Rise
                  blur={10}
                  className="flex min-h-0 flex-1 flex-col"
                  delay={STAGGER_BLOCK}
                  distance={20}
                >
                  <TextArea
                    {...WAITLIST_AUTOFILL_SUPPRESSION_PROPS}
                    action={
                      <Button
                        aria-label="Submit"
                        className="size-10 rounded-none"
                        disabled={advancing}
                        onClick={() => {
                          if (nextStep != null) {
                            void advanceTo(nextStep)
                          }
                        }}
                      >
                        <IconArrowUp />
                      </Button>
                    }
                    className="min-h-0 flex-1 [&_textarea]:p-4 [&_textarea]:text-size-md [&_textarea]:leading-6"
                    controlClassName="h-full min-h-[86px] rounded-none [--input-glow-width:0px]"
                    defaultValue={seededValue}
                    onKeyDown={(event) => {
                      // Multi-line fields submit on Cmd/Ctrl+Enter.
                      if (
                        event.key === 'Enter' &&
                        (event.metaKey || event.ctrlKey)
                      ) {
                        if (nextStep != null) {
                          void advanceTo(nextStep)
                        }
                      }
                    }}
                    label={title}
                    onValueChange={(value) => setAnswer(screen.id, value)}
                    placeholder={screen.placeholder}
                    ref={textAreaFieldRef}
                  />
                  <Text
                    as="p"
                    className="mt-3 px-2 text-center"
                    color={TextColor.Tertiary}
                    size={TextSize.Small}
                  >
                    Optional - write as much or as little as you like
                  </Text>
                </Rise>
              </Screen>
            )}

            {screen.kind === 'confirmation' && (
              <Screen
                className="items-center justify-center text-center"
                key={screen.id}
              >
                <motion.div
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, y: 16, filter: 'blur(8px)' }
                  }
                  transition={enterAt(0)}
                >
                  <svg
                    aria-hidden={true}
                    className="size-12 text-surface-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Disc scales in on the footer indicator's overshoot curve;
                        `fill-box` pivots the scale on its center, not 0,0. */}
                    <motion.circle
                      animate={{ scale: 1, opacity: 1 }}
                      cx="12"
                      cy="12"
                      fill="currentColor"
                      initial={
                        reduceMotion ? false : { scale: 0.6, opacity: 0 }
                      }
                      r="12"
                      style={{
                        transformBox: 'fill-box',
                        transformOrigin: 'center',
                      }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : {
                              scale: {
                                duration: 0.25,
                                ease: [0.34, 1.56, 0.64, 1],
                                delay: 0.1,
                              },
                              opacity: {
                                duration: 0.2,
                                ease: 'easeOut',
                                delay: 0.1,
                              },
                            }
                      }
                    />
                    {/* Check draws on via `pathLength`; opacity is gated on the
                        same delay to hide the round cap's touch-down dot. Path
                        nudged ~0.6u right to optically center it in the disc. */}
                    <motion.path
                      animate={{ pathLength: 1, opacity: 1 }}
                      d="M8.35 12.4615L11.1625 15.25L15.85 8.75"
                      initial={
                        reduceMotion ? false : { pathLength: 0, opacity: 0 }
                      }
                      stroke="var(--color-text-inverse)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.75"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : {
                              pathLength: {
                                duration: 0.4,
                                ease: 'easeOut',
                                delay: 0.4,
                              },
                              opacity: { duration: 0.12, delay: 0.4 },
                            }
                      }
                    />
                  </svg>
                </motion.div>
                <Rise blur={10} delay={STAGGER_BLOCK}>
                  <Text
                    as="h2"
                    className="mt-8"
                    font={TextFont.Sans}
                    size={{ base: TextSize.XL, md: TextSize.XXL }}
                    weight="medium"
                  >
                    Woohoo!
                  </Text>
                </Rise>
                <Rise blur={10} delay={2 * STAGGER_BLOCK}>
                  <Text className="mt-4 max-w-96" color={TextColor.Tertiary}>
                    You’re on the waitlist now. If you don't see an email from
                    us, check spam or search for hello@ando.so.
                  </Text>
                  <Text className="mt-2 max-w-96" color={TextColor.Tertiary}>
                    Get access sooner by answering a few more questions.
                  </Text>
                </Rise>
                <Rise delay={3 * STAGGER_BLOCK}>
                  <Button
                    className="mt-12 rounded-none"
                    disabled={advancing}
                    onClick={() => {
                      if (nextStep != null) {
                        void advanceTo(nextStep)
                      }
                    }}
                    ref={confirmContinueRef}
                    size={ButtonSize.Medium}
                    variant={ButtonVariant.Primary}
                  >
                    Continue
                  </Button>
                </Rise>
              </Screen>
            )}

            {screen.kind === 'done' && (
              <Screen
                className="items-center justify-center text-center"
                key={screen.id}
              >
                {/* Finale cadence: deliberately slower, later. */}
                <Rise blur={10} delay={2 * STAGGER_BLOCK} slow>
                  <Text
                    as="h2"
                    font={TextFont.Sans}
                    size={{ base: TextSize.XL, md: TextSize.XXL }}
                    weight="medium"
                  >
                    You’re all set.
                  </Text>
                </Rise>
                <Rise blur={10} delay={3 * STAGGER_BLOCK} slow>
                  <Text className="mt-4 max-w-96" color={TextColor.Tertiary}>
                    Thank you for the extra context. We’ll be in touch soon.
                    Reach us at <ContactEmail />.
                  </Text>
                </Rise>
              </Screen>
            )}
          </AnimatePresence>
        </Dialog.Body>

        <Dialog.Footer>
          <FormProgress current={progress.current} steps={progress.steps} />
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog>
  )
}
