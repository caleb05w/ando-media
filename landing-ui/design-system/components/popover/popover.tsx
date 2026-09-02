'use client'

import { Popover as BasePopover } from '@base-ui/react/popover'
import type { ReactNode } from 'react'

import { cn } from '#lib/cn'
import {
  popoverBodyStyles,
  popoverFooterStyles,
  popoverHeaderStyles,
  popoverPanelVariants,
} from './styles'
import type {
  PopoverBodyProps,
  PopoverCloseProps,
  PopoverFooterProps,
  PopoverHeaderProps,
  PopoverPanelProps,
  PopoverProps,
  PopoverTitleProps,
  PopoverTriggerProps,
} from './types'

function PopoverRoot({
  children,
  open,
  defaultOpen,
  onOpenChange,
  modal = false,
}: PopoverProps) {
  return (
    <BasePopover.Root
      defaultOpen={defaultOpen}
      modal={modal}
      onOpenChange={onOpenChange}
      open={open}
    >
      {children}
    </BasePopover.Root>
  )
}
PopoverRoot.displayName = 'Popover'

function PopoverTrigger({
  children,
  ref,
  nativeButton = false,
  ...rest
}: PopoverTriggerProps) {
  // Default false (non-<button> child); pass `true` for a native <button> trigger.
  return (
    <BasePopover.Trigger
      {...rest}
      nativeButton={nativeButton}
      ref={ref}
      render={children}
    />
  )
}
PopoverTrigger.displayName = 'Popover.Trigger'

// Portal + Positioner + Popup: placement, stacking, and chrome.
function PopoverPanel({
  children,
  className,
  radius,
  ref,
  anchor,
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  alignOffset,
  container,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}: PopoverPanelProps) {
  return (
    <BasePopover.Portal container={container}>
      {/* z-50 so the Positioner wins against in-page stacking contexts. */}
      <BasePopover.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="z-50"
        side={side}
        sideOffset={sideOffset}
      >
        <BasePopover.Popup
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          className={cn(popoverPanelVariants({ radius }), className)}
          ref={ref}
        >
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  )
}
PopoverPanel.displayName = 'Popover.Panel'

// Names the dialog (Base UI wires `aria-labelledby`). Title-less popovers
// (e.g. the QR card) pass `aria-label` to `Popover.Panel` instead.
function PopoverTitle({ children, className }: PopoverTitleProps) {
  return (
    <BasePopover.Title
      className={cn('text-size-sm font-medium text-text-primary', className)}
    >
      {children}
    </BasePopover.Title>
  )
}
PopoverTitle.displayName = 'Popover.Title'

function PopoverHeader({ children, className }: PopoverHeaderProps) {
  return <div className={cn(popoverHeaderStyles, className)}>{children}</div>
}
PopoverHeader.displayName = 'Popover.Header'

function PopoverBody({ children, className }: PopoverBodyProps) {
  return <div className={cn(popoverBodyStyles, className)}>{children}</div>
}
PopoverBody.displayName = 'Popover.Body'

function PopoverFooter({ children, className }: PopoverFooterProps) {
  return <div className={cn(popoverFooterStyles, className)}>{children}</div>
}
PopoverFooter.displayName = 'Popover.Footer'

// Render inside `Popover.Panel` when `modal='trap-focus'` so SR users can escape.
function PopoverClose({ children, ref, ...rest }: PopoverCloseProps) {
  return (
    <BasePopover.Close
      {...rest}
      nativeButton={false}
      ref={ref}
      render={children}
    />
  )
}
PopoverClose.displayName = 'Popover.Close'

export interface PopoverComponent {
  (props: PopoverProps): ReactNode
  Trigger(props: PopoverTriggerProps): ReactNode
  Panel(props: PopoverPanelProps): ReactNode
  Header(props: PopoverHeaderProps): ReactNode
  Title(props: PopoverTitleProps): ReactNode
  Body(props: PopoverBodyProps): ReactNode
  Footer(props: PopoverFooterProps): ReactNode
  Close(props: PopoverCloseProps): ReactNode
}

/** Accessible popup anchored to a trigger. Compose `Trigger` + `Panel`; `Header`, `Title`, `Body`, `Footer`, `Close` are optional. */
export const Popover: PopoverComponent = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Panel: PopoverPanel,
  Header: PopoverHeader,
  Title: PopoverTitle,
  Body: PopoverBody,
  Footer: PopoverFooter,
  Close: PopoverClose,
})
