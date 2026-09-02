'use client'

import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { Drawer } from '@base-ui/react/drawer'
import { useMediaQuery } from '@base-ui/react/unstable-use-media-query'
import { createContext, type ReactNode, useContext, useState } from 'react'

import { Button, ButtonSize, ButtonVariant } from '#components/button'
import { IconCrossMedium } from '#components/icon'
import { cn } from '#lib/cn'
import type {
  DialogBodyProps,
  DialogCloseProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogOpenChangeDetails,
  DialogPopupProps,
  DialogProps,
  DialogTriggerProps,
} from './types'

// Frosted scrim behind the card (shared by the dialog and drawer branches).
const backdropClasses = [
  'fixed inset-0 z-50 bg-tonal-100/35 backdrop-blur-xs',
  'transition-opacity duration-200 ease-out',
  'data-[starting-style]:opacity-0',
  'data-[ending-style]:opacity-0 data-[ending-style]:duration-150',
  'motion-reduce:transition-none',
]

// Full-viewport scroll container (md+ and the SSR/first-paint fallback). A card
// taller than the viewport scrolls here instead of clipping; `pointer-events-none`
// lets clicks on the empty area fall through to the backdrop to close (the card
// re-enables them). The scale/opacity enter-exit rides here, reduced-motion aware.
const popupWrapperClasses = [
  'pointer-events-none fixed inset-0 z-50 flex flex-col overflow-y-auto',
  'transition-[opacity,scale] duration-200 ease-out',
  'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
  'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
  'data-[ending-style]:duration-150',
  'motion-reduce:transition-none',
]

// The card itself. Mobile fallback: a bottom sheet 92px below the nav (the May
// 2026 frame's measured offset, a static literal so Tailwind's text scan emits
// it). md+: the centered 768x786 design card that shrinks with the viewport
// (max-h) down to a 480px floor (min-h), past which the wrapper scrolls. `m-auto`
// centers it yet still scrolls to the top when it overflows.
const cardClasses = [
  'pointer-events-auto flex w-full flex-col bg-surface-primary shadow-md outline-none',
  'mt-auto h-[calc(100dvh-92px)] rounded-t-2xl p-5',
  'md:m-auto md:h-[786px] md:max-h-[calc(100dvh-4rem)] md:min-h-[480px]',
  'md:max-w-3xl md:rounded-2xl md:p-8',
]

// Drawer bottom sheet (mobile, once the media query resolves): slides up and
// tracks the finger to dismiss. The enter/exit slide (`translate-y-full`) and the
// live swipe (`--drawer-swipe-movement-y`) stack on transform; `transition-transform`
// is scoped so its easing never leaks onto the focus-ring outline.
const drawerPopupClasses = [
  'fixed inset-x-0 bottom-0 z-50 flex h-[calc(100dvh-92px)] w-full flex-col',
  'rounded-t-2xl bg-surface-primary shadow-md outline-none',
  'p-5',
  '[transform:translateY(var(--drawer-swipe-movement-y,0px))]',
  'transition-transform duration-200 ease-out',
  'data-[starting-style]:translate-y-full',
  'data-[ending-style]:translate-y-full data-[ending-style]:duration-150',
  'data-[swiping]:transition-none',
  'motion-reduce:transition-none',
]

// Positioning container Base UI's Drawer requires between Portal and Popup.
const drawerViewportClasses = ['fixed inset-0 z-50']

// Mobile renders Base UI's Drawer (swipe-dismiss); md+ renders the modal Dialog.
// Chosen once in the root and read by every part so they branch consistently.
type DialogVariant = 'dialog' | 'drawer'
const DialogVariantContext = createContext<DialogVariant>('dialog')

/**
 * Dialog - the waitlist-flow modal (May 2026 brand): a centered card on md+, a
 * swipe-dismissable bottom sheet (Base UI `Drawer`) on mobile. Compose `Dialog`
 * + `Dialog.Trigger` + `Dialog.Popup` wrapping `Dialog.Header` / `Dialog.Body`
 * / `Dialog.Footer`. Controlled (`open` + `onOpenChange`) or uncontrolled
 * (`defaultOpen`); Base UI handles focus trap, scroll lock, and dismiss.
 */
function DialogRoot({
  children,
  open,
  defaultOpen,
  disablePointerDismissal,
  onOpenChange,
}: DialogProps) {
  // `defaultMatches: true` first-paints the dialog branch; real usage opens
  // after hydration, so the swap to the drawer on phones is never seen.
  const isDesktop = useMediaQuery('(min-width: 48rem)', {
    defaultMatches: true,
  })
  const variant: DialogVariant = isDesktop ? 'dialog' : 'drawer'

  // Lifted so an open dialog survives a breakpoint flip (the root swaps
  // BaseDialog <-> Drawer). Controlled `open` wins when provided.
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
  const isControlled = open !== undefined
  const actualOpen = isControlled ? open : uncontrolledOpen

  function setOpen(next: boolean) {
    if (!isControlled) {
      setUncontrolledOpen(next)
    }
  }

  // Branched (not a shared `Root` var) so each `onOpenChange` is typed against
  // its own detail union - the Drawer's adds `swipe` / `closeWatcher`.
  const body = (
    <DialogVariantContext.Provider value={variant}>
      {children}
    </DialogVariantContext.Provider>
  )

  if (variant === 'drawer') {
    return (
      <Drawer.Root
        disablePointerDismissal={disablePointerDismissal}
        onOpenChange={(next, details) => {
          setOpen(next)
          onOpenChange?.(next, details as DialogOpenChangeDetails)
        }}
        open={actualOpen}
      >
        {body}
      </Drawer.Root>
    )
  }

  return (
    <BaseDialog.Root
      disablePointerDismissal={disablePointerDismissal}
      onOpenChange={(next, details) => {
        setOpen(next)
        onOpenChange?.(next, details)
      }}
      open={actualOpen}
    >
      {body}
    </BaseDialog.Root>
  )
}
DialogRoot.displayName = 'Dialog'

function DialogTrigger({
  render,
  children,
  className,
  ref,
}: DialogTriggerProps) {
  const variant = useContext(DialogVariantContext)
  // Branched so each Trigger keeps its own prop types (Drawer.Trigger is
  // generic over a payload the dialog one lacks).
  if (variant === 'drawer') {
    return (
      <Drawer.Trigger className={className} ref={ref} render={render}>
        {children}
      </Drawer.Trigger>
    )
  }
  return (
    <BaseDialog.Trigger className={className} ref={ref} render={render}>
      {children}
    </BaseDialog.Trigger>
  )
}
DialogTrigger.displayName = 'Dialog.Trigger'

// Portal + Backdrop + Popup. md+ centers the card in a scroll wrapper; mobile
// uses the Drawer's bottom sheet (with the Viewport container Base UI requires).
function DialogPopup({
  children,
  className,
  ref,
  label,
  initialFocus,
  backdrop,
}: DialogPopupProps) {
  const variant = useContext(DialogVariantContext)

  if (variant === 'drawer') {
    return (
      <Drawer.Portal>
        <Drawer.Backdrop className={cn(backdropClasses)} />
        {backdrop}
        <Drawer.Viewport className={cn(drawerViewportClasses)}>
          <Drawer.Popup
            aria-label={label}
            className={cn(drawerPopupClasses, className)}
            initialFocus={initialFocus}
            ref={ref}
          >
            {children}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    )
  }

  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={cn(backdropClasses)} />
      {backdrop}
      <BaseDialog.Popup
        aria-label={label}
        className={cn(popupWrapperClasses)}
        initialFocus={initialFocus}
        ref={ref}
      >
        <div className={cn(cardClasses, className)}>{children}</div>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  )
}
DialogPopup.displayName = 'Dialog.Popup'

/**
 * Three-slot header (left / center / right, right defaults to close). `1fr auto
 * 1fr` keeps the middle centered when the sides differ; `min-h` is the design's
 * constant row height so screens without the identity block don't shift.
 */
function DialogHeader({ start, children, end, className }: DialogHeaderProps) {
  return (
    <div
      className={cn(
        'grid min-h-[38px] grid-cols-[1fr_auto_1fr] items-center gap-4',
        className,
      )}
    >
      <div className="flex items-center gap-2 justify-self-start">{start}</div>
      <div className="justify-self-center text-center">{children}</div>
      <div className="flex items-center gap-2 justify-self-end">
        {end === undefined ? <DialogClose /> : end}
      </div>
    </div>
  )
}
DialogHeader.displayName = 'Dialog.Header'

/** The 32px circular close button (top-right in the design). `hit-area-1.5`
 * grows the tap target to 44px without changing layout. */
function DialogClose({ label = 'Close', className }: DialogCloseProps) {
  const variant = useContext(DialogVariantContext)
  const button = (
    <Button
      aria-label={label}
      className={cn('hit-area-1.5 size-8', className)}
      size={ButtonSize.Small}
      variant={ButtonVariant.Secondary}
    >
      <IconCrossMedium />
    </Button>
  )
  // Branched per variant (see Dialog.Trigger).
  if (variant === 'drawer') {
    return <Drawer.Close render={button} />
  }
  return <BaseDialog.Close render={button} />
}
DialogClose.displayName = 'Dialog.Close'

/** The screen's content area; fills the space between header and footer. */
function DialogBody({ children, className }: DialogBodyProps) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      {children}
    </div>
  )
}
DialogBody.displayName = 'Dialog.Body'

/** Centered `FormProgress` slot. Mobile reserves bottom padding above the home
 * indicator; md+ sits flush per the design. */
function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={cn('flex items-center justify-center pb-6 md:pb-0', className)}
    >
      {children}
    </div>
  )
}
DialogFooter.displayName = 'Dialog.Footer'

// Explicit (not inferred): the part fns are local, so a bare `Object.assign`
// would make `Dialog`'s type reference un-nameable symbols and trip TS4023 when
// a consumer re-exports `typeof Dialog`. Mirrors the house `SelectComponent`.
export interface DialogComponent {
  (props: DialogProps): ReactNode
  Trigger(props: DialogTriggerProps): ReactNode
  Popup(props: DialogPopupProps): ReactNode
  Header(props: DialogHeaderProps): ReactNode
  Close(props: DialogCloseProps): ReactNode
  Body(props: DialogBodyProps): ReactNode
  Footer(props: DialogFooterProps): ReactNode
}

export const Dialog: DialogComponent = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Popup: DialogPopup,
  Header: DialogHeader,
  Close: DialogClose,
  Body: DialogBody,
  Footer: DialogFooter,
})
