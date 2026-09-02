import type { ComponentProps } from 'react'

/**
 * Status of a single step in the progress indicator.
 *
 * - `upcoming` - not yet reached: light gray ring + tertiary label.
 * - `active` - in progress: a dark arc sweeping over a gray track ring
 *   (see `progress`) + emphasized (primary, medium) label.
 * - `complete` - finished: a filled green check disc + tertiary label,
 *   unless the step is also the current one (see `FormProgressProps.current`),
 *   which keeps the label emphasized.
 */
export const FormProgressStepStatus = {
  Upcoming: 'upcoming',
  Active: 'active',
  Complete: 'complete',
} as const

export type FormProgressStepStatus =
  (typeof FormProgressStepStatus)[keyof typeof FormProgressStepStatus]

/** A single step descriptor. */
export interface FormProgressStep {
  /**
   * Stable identity (the React key), defaulting to `label`. Provide it when a
   * step's label changes between states (e.g. "Your info" -> "Joined
   * waitlist") so the status change animates instead of remounting.
   */
  id?: string
  /** Visible label, e.g. "Your info". */
  label: string
  /** Step state. @default 'upcoming' */
  status?: FormProgressStepStatus
  /**
   * Arc fill for an `active` step, 0-1. Ignored for other statuses.
   * @default 0.25 (matches the design)
   */
  progress?: number
}

export interface FormProgressProps
  extends Omit<ComponentProps<'ol'>, 'children'> {
  /** Ordered steps, left to right. */
  steps: FormProgressStep[]
  /**
   * Index of the step the user is currently on. An `active` step is always
   * the current one; a `complete` step at this index keeps its label
   * emphasized (the success/confirmation screen). Drives `aria-current`.
   * @default the index of the first `active` step, if any
   */
  current?: number
}
