import { Text, TextColor, TextSize, TextWeight } from '#components/text'
import { cn } from '#lib/cn'
import { type FormProgressProps, FormProgressStepStatus } from './types'

// Arc geometry: a 24-unit viewBox shared by both circles so their baselines
// line up. r=9 + a 1.5 stroke gives a ~19px ring inside the box.
const ARC_RADIUS = 9
const ARC_CENTER = 12
const DEFAULT_PROGRESS = 0.25

// The status visual is decorative (aria-hidden), so the state is conveyed to
// screen readers by a visually-hidden prefix on each label.
const STATUS_LABEL: Record<FormProgressStepStatus, string> = {
  [FormProgressStepStatus.Upcoming]: 'Upcoming: ',
  [FormProgressStepStatus.Active]: 'In progress: ',
  [FormProgressStepStatus.Complete]: 'Completed: ',
}

/**
 * One step visual that morphs between the three statuses so transitions
 * animate with continuity instead of swapping artwork:
 *   - upcoming -> a quiet light-gray ring (arc at 0, hidden)
 *   - active   -> a dark arc sweeping clockwise from 12 o'clock over the ring
 *   - complete -> a three-stage choreography: the arc closes to a full ring
 *     (300ms), then the green disc pops in over it (200ms, slight overshoot),
 *     then the white check draws on (200ms). Overlapping these reads as a
 *     murky crossfade, so the later stages wait via `transition-delay` -
 *     applied only in the complete state, so reversing (back-navigation)
 *     drops the delays and exits quickly instead of replaying the ceremony.
 *
 * Arc and check-draw are full-length strokes with `pathLength=1` +
 * `stroke-dashoffset`, which - unlike an SVG path `d` - transitions in CSS.
 * Movement of an on-screen element -> `ease-in-out`; the entering disc ->
 * ease-out with a small back-overshoot (completion is rare, so it can be a
 * touch playful). Everything respects reduced motion. The slot is a fixed
 * 20px (the check overflows it by 2px on each side, matching the design) so
 * status changes never shift layout.
 */
function StepVisual({
  status,
  progress,
}: {
  status: FormProgressStepStatus
  progress: number
}) {
  const complete = status === FormProgressStepStatus.Complete
  let arcProgress = 0
  if (complete) {
    arcProgress = 1
  } else if (status === FormProgressStepStatus.Active) {
    arcProgress = Math.min(Math.max(progress, 0), 1)
  }

  return (
    <span aria-hidden={true} className="relative size-5">
      <svg
        aria-hidden={true}
        className="size-5"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Track ring (light gray, always present under the arc). */}
        <circle
          className="text-border-default"
          cx={ARC_CENTER}
          cy={ARC_CENTER}
          r={ARC_RADIUS}
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {/* Progress arc. Rotated so the sweep starts at 12 o'clock. Hidden at
            0 via opacity: with round caps, a fully-offset dash still paints a
            dot at the start point. */}
        <circle
          className={cn(
            'text-text-primary',
            'transition-[stroke-dashoffset,opacity] duration-300 ease-in-out motion-reduce:transition-none',
            arcProgress <= 0 && 'opacity-0',
          )}
          cx={ARC_CENTER}
          cy={ARC_CENTER}
          pathLength={1}
          r={ARC_RADIUS}
          stroke="currentColor"
          strokeDasharray="1"
          strokeDashoffset={1 - arcProgress}
          strokeLinecap="round"
          strokeWidth="1.5"
          transform={`rotate(-90 ${ARC_CENTER} ${ARC_CENTER})`}
        />
      </svg>
      {/* Stage 2 - the green disc, centered on the ring (24px over the 20px
          slot). Pops in after the arc has closed (delay-300 = the arc's
          duration); the overshoot curve is a gentle back-out. */}
      <svg
        aria-hidden={true}
        className={cn(
          '-inset-0.5 absolute size-6 text-surface-success',
          'transition-[scale,opacity] motion-reduce:transition-none',
          complete
            ? 'scale-100 opacity-100 delay-300 duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
            : 'scale-50 opacity-0 delay-0 duration-150 ease-out',
        )}
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="12" fill="currentColor" />
        {/* Stage 3 - the check draws on left-to-right (dash technique),
            starting just before the disc settles so the stages feel
            connected. Hidden states are covered by the disc's opacity-0, so
            the round-cap dot artifact at full offset never shows. */}
        <path
          className={cn(
            'transition-[stroke-dashoffset] motion-reduce:transition-none',
            complete
              ? 'delay-[450ms] duration-200 ease-out'
              : 'delay-0 duration-150 ease-out',
          )}
          d="M7.75 12.4615L10.5625 15.25L15.25 8.75"
          pathLength={1}
          stroke="var(--color-text-inverse)"
          strokeDasharray="1"
          strokeDashoffset={complete ? 0 : 1}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
      </svg>
    </span>
  )
}

/**
 * FormProgress - a horizontal step indicator for the waitlist onboarding flow.
 * Each step pairs a status visual (upcoming ring / active arc / complete check)
 * with a label. The current step is emphasized and exposed via `aria-current`;
 * the otherwise color-only status is announced via a visually-hidden prefix.
 * Status and `progress` changes animate (see `StepVisual`).
 */
export function FormProgress({
  steps,
  current,
  className,
  ...props
}: FormProgressProps) {
  // Default the current step to the first active one, so a caller that only
  // passes statuses still gets correct `aria-current` and label emphasis.
  const currentIndex =
    current ??
    steps.findIndex((step) => step.status === FormProgressStepStatus.Active)

  return (
    <ol
      className={cn('flex items-center justify-center gap-8', className)}
      {...props}
    >
      {steps.map((step, index) => {
        const status = step.status ?? FormProgressStepStatus.Upcoming
        const isCurrent = index === currentIndex
        // Active steps are always emphasized; a completed step is emphasized
        // only when it's also the current one (the confirmation screen).
        const emphasized =
          status === FormProgressStepStatus.Active ||
          (status === FormProgressStepStatus.Complete && isCurrent)

        return (
          <li
            // `id` survives a label change as a step completes (e.g. "Your
            // info" -> "Joined waitlist"), so the status transition animates
            // instead of remounting; labels are unique within a flow otherwise.
            key={step.id ?? step.label}
            aria-current={isCurrent ? 'step' : undefined}
            className="flex items-center gap-2"
          >
            <StepVisual
              progress={step.progress ?? DEFAULT_PROGRESS}
              status={status}
            />
            <Text
              as="span"
              className="transition-[color] duration-150 ease-[ease] motion-reduce:transition-none"
              color={emphasized ? TextColor.Primary : TextColor.Tertiary}
              size={TextSize.Small}
              weight={emphasized ? TextWeight.Medium : TextWeight.Regular}
            >
              <span className="sr-only">{STATUS_LABEL[status]}</span>
              {step.label}
            </Text>
          </li>
        )
      })}
    </ol>
  )
}

FormProgress.displayName = 'FormProgress'
