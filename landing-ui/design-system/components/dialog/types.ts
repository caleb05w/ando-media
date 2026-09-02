import type { Dialog as BaseDialog } from '@base-ui/react/dialog'
import type { ReactElement, ReactNode, Ref } from 'react'

/** `onOpenChange` detail; read `details.reason` to gate specific open/close events. */
export type DialogOpenChangeDetails = BaseDialog.Root.ChangeEventDetails

export interface DialogProps {
  children?: ReactNode
  /** Controlled open state. Pair with `onOpenChange`. */
  open?: boolean
  /** Initial open state for uncontrolled use. */
  defaultOpen?: boolean
  /** Prevent outside pointer interactions from closing the dialog/drawer. */
  disablePointerDismissal?: boolean
  onOpenChange?: (open: boolean, details: DialogOpenChangeDetails) => void
}

export interface DialogTriggerProps {
  /** The trigger element (e.g. a `Button`), rendered via Base UI's `render` prop. */
  render?: ReactElement
  children?: ReactNode
  className?: string
  ref?: Ref<HTMLButtonElement>
}

export interface DialogPopupProps {
  children?: ReactNode
  className?: string
  ref?: Ref<HTMLDivElement>
  /**
   * Accessible name for the dialog (the design has no visible title), rendered
   * as `aria-label`.
   */
  label: string
  /**
   * Element to receive focus when the dialog opens (e.g. the first input).
   * @see Base UI `Dialog.Popup` `initialFocus`
   */
  initialFocus?: BaseDialog.Popup.Props['initialFocus']
  /**
   * Layer rendered in the portal between the scrim and the card (the
   * "lightbox"). The waitlist flow puts its glimm sweep here.
   */
  backdrop?: ReactNode
}

export interface DialogHeaderProps {
  /** Left slot - the 32px back/forward chevron buttons in the design. */
  start?: ReactNode
  /** Centered slot - the "Signed in as" identity block in the design. */
  children?: ReactNode
  /**
   * Right slot. Defaults to a `Dialog.Close` button; pass `null` to render
   * nothing.
   */
  end?: ReactNode
  className?: string
}

export interface DialogCloseProps {
  /** Accessible name for the icon-only close button. @default 'Close' */
  label?: string
  className?: string
}

export interface DialogBodyProps {
  children?: ReactNode
  className?: string
}

export interface DialogFooterProps {
  children?: ReactNode
  className?: string
}
