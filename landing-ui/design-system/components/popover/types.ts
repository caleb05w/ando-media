import type { Popover as BasePopover } from '@base-ui/react/popover'
import type { ReactElement, ReactNode, Ref, RefObject } from 'react'

/** `onOpenChange` detail; read `details.reason` to gate specific close events. */
export type PopoverOpenChangeDetails = BasePopover.Root.ChangeEventDetails

/** Reason an open-state change happened (`'outside-press'`, `'escape-key'`, …). */
export type PopoverOpenChangeReason = BasePopover.Root.ChangeEventReason

export interface PopoverProps {
  children?: ReactNode
  /** Controlled open state. Pair with `onOpenChange`. */
  open?: boolean
  /** Initial open state for uncontrolled use. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: PopoverOpenChangeDetails) => void
  /**
   * - `false` (default): non-modal, no focus trap (Escape still closes).
   * - `'trap-focus'`: traps focus but keeps the page interactive (pair with `Close`).
   * - `true`: full modal (focus trap + scroll lock + outside events off).
   */
  modal?: boolean | 'trap-focus'
}

/** `children` is the rendered trigger element (forwarded to Base UI's `render`). */
export type PopoverTriggerProps = Omit<
  BasePopover.Trigger.Props,
  'children' | 'render'
> & {
  children: ReactElement
  ref?: Ref<HTMLButtonElement>
}

/**
 * Panel corner radius (brand scale, px): `sm` 16 (general popovers) · `md` 24
 * (the Scan QR card). @default 'sm'
 */
export const PopoverRadius = {
  Small: 'sm',
  Medium: 'md',
} as const

export type PopoverRadius = (typeof PopoverRadius)[keyof typeof PopoverRadius]

export interface PopoverPanelProps {
  children?: ReactNode
  className?: string
  /** Corner radius. @default 'sm' (16px); use 'md' (24px) for the QR card. */
  radius?: PopoverRadius
  ref?: Ref<HTMLDivElement>
  /** Anchor element/ref for positioning. Defaults to the trigger. */
  anchor?: BasePopover.Positioner.Props['anchor']
  /** @default 'bottom' */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** @default 'center' */
  align?: 'start' | 'center' | 'end'
  /** Gap (px) from the anchor along the side axis. @default 8 */
  sideOffset?: number
  /** Offset (px) along the alignment axis. */
  alignOffset?: number
  /** Accessible name when there's no `Popover.Title` (e.g. the QR card). */
  'aria-label'?: string
  /** Set automatically by `Popover.Title`. */
  'aria-labelledby'?: string
  /** Portal target. Defaults to `document.body`. */
  container?:
    | HTMLElement
    | ShadowRoot
    | RefObject<HTMLElement | ShadowRoot | null>
    | null
}

export interface PopoverHeaderProps {
  children?: ReactNode
  className?: string
}

export interface PopoverTitleProps {
  /** Renders an `<h2>` and becomes the dialog's accessible name. */
  children?: ReactNode
  className?: string
}

export interface PopoverBodyProps {
  children: ReactNode
  className?: string
}

export interface PopoverFooterProps {
  /** Right-aligned by default; pass `className="justify-between"` to split. */
  children?: ReactNode
  className?: string
}

/** `children` is the rendered close element (forwarded to Base UI's `render`). */
export type PopoverCloseProps = Omit<
  BasePopover.Close.Props,
  'children' | 'render'
> & {
  children: ReactElement
  ref?: Ref<HTMLButtonElement>
}
