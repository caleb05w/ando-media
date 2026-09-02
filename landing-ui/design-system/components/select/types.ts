import type { Select as BaseSelect } from '@base-ui/react/select'
import type { ReactNode, Ref, RefObject } from 'react'

// This wrapper intentionally narrows Base UI's generic Select to single-select
// string values: no `multiple`, no `items`, no object/array values. The brand
// select is a single-choice pill, so the simpler surface (string | null) is all
// the flow needs; reach for Base UI's Select directly if multi-select is ever
// required.

/** `onValueChange` detail; read `details.reason` to gate specific changes. */
export type SelectValueChangeDetails = BaseSelect.Root.ChangeEventDetails

/** `onOpenChange` detail; read `details.reason` to gate specific open/close events. */
export type SelectOpenChangeDetails = BaseSelect.Root.ChangeEventDetails

export interface SelectProps {
  children?: ReactNode
  /** Class for the outer field wrapper (e.g. `flex-1` in a row with a submit button). */
  className?: string
  /**
   * Accessible name, rendered as a visually-hidden `<label>` associated with the
   * trigger. Prefer this over `aria-label` when a human-readable label exists.
   */
  label?: ReactNode
  /** Controlled value. Pair with `onValueChange`. */
  value?: string | null
  /** Initial value for uncontrolled use. */
  defaultValue?: string | null
  onValueChange?: (
    value: string | null,
    details: SelectValueChangeDetails,
  ) => void
  /** Controlled open state. Pair with `onOpenChange`. */
  open?: boolean
  /** Initial open state for uncontrolled use. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: SelectOpenChangeDetails) => void
  /** Disables the trigger and prevents opening. */
  disabled?: boolean
  /** Marks the field required for form submission. */
  required?: boolean
  /**
   * Marks the value invalid: renders the danger border + `aria-invalid` only.
   * Select has no error-message channel by design (the flow has no select error
   * state); error copy is the consumer's responsibility.
   */
  invalid?: boolean
  /** Identifies the field when a form is submitted. */
  name?: string
}

export interface SelectTriggerProps {
  /**
   * Placeholder shown when no value is selected (text-tertiary). The selected
   * value renders here once chosen.
   */
  placeholder?: ReactNode
  /** Optional leading icon (24px), rendered 20px from the left with an 8px gap. */
  icon?: ReactNode
  className?: string
  ref?: Ref<HTMLButtonElement>
  'aria-label'?: string
  'aria-labelledby'?: string
}

export interface SelectPopupProps {
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

export interface SelectItemProps {
  children?: ReactNode
  /** A unique value identifying this option. */
  value: string | null
  /** Text used for keyboard type-ahead; defaults to the item's text content. */
  label?: string
  /** Optional leading icon, rendered muted before the label with an 8px gap. */
  icon?: ReactNode
  disabled?: boolean
  className?: string
}
