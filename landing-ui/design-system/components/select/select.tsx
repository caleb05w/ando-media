'use client'

import { Field } from '@base-ui/react/field'
import { ScrollArea } from '@base-ui/react/scroll-area'
import { Select as BaseSelect } from '@base-ui/react/select'
import type { ReactNode } from 'react'

import { IconChevronGrabberVertical } from '#components/icon'
import { cn } from '#lib/cn'
import {
  selectIconStyles,
  selectItemIconStyles,
  selectItemStyles,
  selectLeadingIconStyles,
  selectPopupStyles,
  selectPositionerStyles,
  selectScrollbarStyles,
  selectTriggerStyles,
  selectValueStyles,
  selectViewportStyles,
} from './styles'
import type {
  SelectItemProps,
  SelectPopupProps,
  SelectProps,
  SelectTriggerProps,
} from './types'

/**
 * Select - pill dropdown matching the May 2026 waitlist flow. The trigger shares
 * the TextField geometry (66px pill, 24px inset, 18/26 value text) with a
 * trailing grabber chevron and an optional leading icon slot. The popup has no
 * Figma design, so it borrows the quiet popover panel chrome.
 *
 * Compose `Select` (Root) + `Select.Trigger` + `Select.Popup` wrapping
 * `Select.Item`s. Controlled (`value` + `onValueChange`) or uncontrolled
 * (`defaultValue`); set `invalid` for the red border and `name` for form
 * submission.
 */
function SelectRoot({
  children,
  className,
  label,
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  required,
  invalid,
  name,
}: SelectProps) {
  // Wrapping in a Field lets the trigger pick up `data-invalid` (red border)
  // straight from Base UI's field state - the same primitive TextField uses -
  // so `invalid` stays a single declarative prop with no extra wiring. The
  // wrapper is full-width so the trigger fills it; `className` lets a consumer
  // size the field in a row (e.g. `flex-1` next to a submit button).
  return (
    <Field.Root
      className={cn('w-full', className)}
      disabled={disabled}
      invalid={invalid}
    >
      {/* Base UI associates the field label with the Select trigger via its
          labelable context (the trigger reads the field's labelId and sets
          aria-labelledby), so the sr-only label names the control. */}
      {label != null && <Field.Label className="sr-only">{label}</Field.Label>}

      <BaseSelect.Root
        defaultOpen={defaultOpen}
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
        open={open}
        required={required}
        value={value}
      >
        {children}
      </BaseSelect.Root>
    </Field.Root>
  )
}
SelectRoot.displayName = 'Select'

function SelectTrigger({
  placeholder,
  icon,
  className,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={cn(selectTriggerStyles, className)}
      ref={ref}
    >
      {icon != null && (
        <span className={cn(selectLeadingIconStyles)}>{icon}</span>
      )}
      <BaseSelect.Value
        className={cn(selectValueStyles)}
        placeholder={placeholder}
      />
      <BaseSelect.Icon className={cn(selectIconStyles)}>
        <IconChevronGrabberVertical />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  )
}
SelectTrigger.displayName = 'Select.Trigger'

// Portal + Positioner + Popup: placement, stacking, and chrome.
function SelectPopup({
  children,
  className,
  ref,
  anchor,
  container,
  side,
  collisionAvoidance,
  inline = false,
  nativeZoom = false,
  sideOffset = 8,
  alignItemWithTrigger = false,
}: SelectPopupProps) {
  const positioner = (
    <BaseSelect.Positioner
      alignItemWithTrigger={alignItemWithTrigger}
      anchor={anchor}
      className={cn(selectPositionerStyles)}
      collisionAvoidance={collisionAvoidance}
      data-native-zoom={nativeZoom ? '' : undefined}
      side={side}
      sideOffset={sideOffset}
    >
      <BaseSelect.Popup className={cn(selectPopupStyles, className)} ref={ref}>
        {/* Base UI ScrollArea draws the brand's quiet overlay scrollbar
            instead of the native one. The Viewport is the scroll container
            (capped to the popup's available height); Base UI Select's
            keyboard scroll-into-view targets it as the nearest scrollable
            ancestor. */}
        <ScrollArea.Root className="min-h-0">
          <ScrollArea.Viewport className={cn(selectViewportStyles)}>
            {children}
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar className={cn(selectScrollbarStyles)}>
            <ScrollArea.Thumb className="w-full rounded-full bg-border-strong" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </BaseSelect.Popup>
    </BaseSelect.Positioner>
  )

  if (inline) {
    return positioner
  }

  return (
    <BaseSelect.Portal container={container}>{positioner}</BaseSelect.Portal>
  )
}
SelectPopup.displayName = 'Select.Popup'

function SelectItem({
  children,
  value,
  label,
  icon,
  disabled,
  className,
}: SelectItemProps) {
  return (
    <BaseSelect.Item
      className={cn(selectItemStyles, className)}
      disabled={disabled}
      label={label}
      value={value}
    >
      {icon != null && <span className={cn(selectItemIconStyles)}>{icon}</span>}
      <BaseSelect.ItemText className="min-w-0 flex-1 truncate">
        {children}
      </BaseSelect.ItemText>
    </BaseSelect.Item>
  )
}
SelectItem.displayName = 'Select.Item'

// Compound type for the `Object.assign` result. Parts are typed via the shared
// `*Props` types (no prop re-declaration, so it can't drift). This explicit,
// exported interface is required - not stylistic: the part functions are local
// (un-exported), so a bare `Object.assign` makes `Select`'s inferred type
// reference un-nameable symbols and `tsc` raises TS4023 wherever a consumer
// re-exports `typeof Select` (e.g. the stories `meta`). Mirrors the house
// `PopoverComponent` pattern. No cast needed - the root is non-generic.
export interface SelectComponent {
  (props: SelectProps): ReactNode
  Trigger(props: SelectTriggerProps): ReactNode
  Popup(props: SelectPopupProps): ReactNode
  Item(props: SelectItemProps): ReactNode
}

export const Select: SelectComponent = Object.assign(SelectRoot, {
  Trigger: SelectTrigger,
  Popup: SelectPopup,
  Item: SelectItem,
})
