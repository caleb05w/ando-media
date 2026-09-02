import type { Select as BaseSelect } from '@base-ui/react/select'
import type { ReactNode, Ref, RefObject } from 'react'

// The multi-select sibling of Select: same pill chrome, but backed by Base UI's
// Select with the `multiple` prop, so the value is an array of strings. The
// trigger joins the selected labels and each item carries a trailing checkmark.
// Reach for the single-select `Select` when only one choice is allowed.

/** `onValueChange` detail; read `details.reason` to gate specific changes. */
export type MultiSelectValueChangeDetails = BaseSelect.Root.ChangeEventDetails

/** `onOpenChange` detail; read `details.reason` to gate specific open/close events. */
export type MultiSelectOpenChangeDetails = BaseSelect.Root.ChangeEventDetails

export interface MultiSelectProps {
  children?: ReactNode
  /** Class for the outer field wrapper (e.g. `flex-1` in a row with a submit button). */
  className?: string
  /**
   * Accessible name, rendered as a visually-hidden `<label>` associated with the
   * trigger. Prefer this over `aria-label` when a human-readable label exists.
   */
  label?: ReactNode
  /** Controlled value. Pair with `onValueChange`. */
  value?: string[]
  /** Initial value for uncontrolled use. */
  defaultValue?: string[]
  onValueChange?: (
    value: string[],
    details: MultiSelectValueChangeDetails,
  ) => void
  /** Controlled open state. Pair with `onOpenChange`. */
  open?: boolean
  /** Initial open state for uncontrolled use. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: MultiSelectOpenChangeDetails) => void
  /**
   * Whether the open popup traps interaction (scroll lock + a backdrop that
   * captures outside presses). `false` lets a single outside click both close
   * the popup and reach what it hit - needed when a submit control sits beside
   * the trigger, since the modal backdrop would otherwise swallow the first
   * click. @default true (Base UI's default)
   */
  modal?: boolean
  /** Disables the trigger and prevents opening. */
  disabled?: boolean
  /** Marks the field required for form submission. */
  required?: boolean
  /**
   * Marks the value invalid: renders the danger border + `aria-invalid` only.
   * MultiSelect has no error-message channel by design (the flow has no select
   * error state); error copy is the consumer's responsibility.
   */
  invalid?: boolean
  /** Identifies the field when a form is submitted. */
  name?: string
}

export interface MultiSelectTriggerProps {
  /**
   * Placeholder shown when nothing is selected (text-tertiary). Once items are
   * chosen, the trigger renders their labels joined by ", ".
   */
  placeholder?: ReactNode
  className?: string
  ref?: Ref<HTMLButtonElement>
  'aria-label'?: string
  'aria-labelledby'?: string
}

export interface MultiSelectPopupProps {
  children?: ReactNode
  className?: string
  ref?: Ref<HTMLDivElement>
  /** Element used for positioning. Defaults to the trigger. */
  anchor?: BaseSelect.Positioner.Props['anchor']
  /** Portal target. Defaults to `document.body`. */
  container?:
    | HTMLElement
    | ShadowRoot
    | RefObject<HTMLElement | ShadowRoot | null>
    | null
  /** @default 'bottom' */
  side?: BaseSelect.Positioner.Props['side']
  /** Collision strategy for the popup. Defaults to Base UI's dropdown behavior. */
  collisionAvoidance?: BaseSelect.Positioner.Props['collisionAvoidance']
  /** Render in place instead of portaling to `container`/`body`. */
  inline?: boolean
  /** Cancel the app's root zoom for body-portaled popups. */
  nativeZoom?: boolean
  /** Gap (px) from the trigger along the side axis. @default 8 */
  sideOffset?: number
  /**
   * Overlap the trigger so the selected item aligns with the trigger's value
   * text (mouse input only). @default false - the brand opens a quiet panel
   * below the pill.
   */
  alignItemWithTrigger?: boolean
}

export interface MultiSelectItemProps {
  children?: ReactNode
  /** A unique value identifying this option. */
  value: string
  /** Text used for keyboard type-ahead; defaults to the item's text content. */
  label?: string
  /** Optional leading icon, rendered muted before the label with an 8px gap. */
  icon?: ReactNode
  disabled?: boolean
  className?: string
}
