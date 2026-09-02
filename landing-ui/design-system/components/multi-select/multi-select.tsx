'use client'

import { Field } from '@base-ui/react/field'
import { ScrollArea } from '@base-ui/react/scroll-area'
import { Select as BaseSelect } from '@base-ui/react/select'
import type { ReactNode } from 'react'

import {
  IconCheckmark1Medium,
  IconChevronGrabberVertical,
} from '#components/icon'
import { cn } from '#lib/cn'
import {
  multiSelectIconStyles,
  multiSelectItemIconStyles,
  multiSelectItemIndicatorStyles,
  multiSelectItemStyles,
  multiSelectPopupStyles,
  multiSelectPositionerStyles,
  multiSelectScrollbarStyles,
  multiSelectTriggerStyles,
  multiSelectValueStyles,
  multiSelectViewportStyles,
} from './styles'
import type {
  MultiSelectItemProps,
  MultiSelectPopupProps,
  MultiSelectProps,
  MultiSelectTriggerProps,
} from './types'

/**
 * MultiSelect - the multi-choice sibling of `Select`, sharing the May 2026
 * waitlist pill chrome. The trigger reuses the TextField geometry (66px pill,
 * 24px inset, 18/26 value text) with a trailing grabber chevron; with multiple
 * values there's no single leading icon, so the trigger joins the selected
 * labels instead. Each item carries a trailing checkmark when selected. The
 * popup has no Figma design, so it borrows the quiet popover panel chrome.
 *
 * Compose `MultiSelect` (Root) + `MultiSelect.Trigger` + `MultiSelect.Popup`
 * wrapping `MultiSelect.Item`s. Controlled (`value` + `onValueChange`) or
 * uncontrolled (`defaultValue`); both are `string[]`. Set `invalid` for the red
 * border and `name` for form submission.
 */
function MultiSelectRoot({
  children,
  className,
  label,
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  modal,
  disabled,
  required,
  invalid,
  name,
}: MultiSelectProps) {
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

      {/* `multiple` makes Base UI type the value as `string[]`; the <string,
          true> generics pin item values to strings so the array stays typed. */}
      {/* `modal` is forwarded undefined when unset so Base UI keeps its `true`
          default; the waitlist passes `false` so its submit arrow stays
          clickable beside the open popup. */}
      <BaseSelect.Root<string, true>
        defaultOpen={defaultOpen}
        defaultValue={defaultValue}
        disabled={disabled}
        modal={modal}
        multiple
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
MultiSelectRoot.displayName = 'MultiSelect'

function MultiSelectTrigger({
  placeholder,
  className,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}: MultiSelectTriggerProps) {
  return (
    <BaseSelect.Trigger
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={cn(multiSelectTriggerStyles, className)}
      ref={ref}
    >
      {/* Join the selected labels; Base UI types the render arg as `any`, so
          annotate it `string[]` (no `any`). Empty array -> placeholder, and
          Base UI keeps `data-placeholder` set so it stays tertiary. */}
      <BaseSelect.Value className={cn(multiSelectValueStyles)}>
        {(selected: string[]) =>
          Array.isArray(selected) && selected.length > 0
            ? selected.join(', ')
            : placeholder
        }
      </BaseSelect.Value>
      <BaseSelect.Icon className={cn(multiSelectIconStyles)}>
        <IconChevronGrabberVertical />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  )
}
MultiSelectTrigger.displayName = 'MultiSelect.Trigger'

// Portal + Positioner + Popup: placement, stacking, and chrome.
function MultiSelectPopup({
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
}: MultiSelectPopupProps) {
  const positioner = (
    <BaseSelect.Positioner
      alignItemWithTrigger={alignItemWithTrigger}
      anchor={anchor}
      className={cn(multiSelectPositionerStyles)}
      collisionAvoidance={collisionAvoidance}
      data-native-zoom={nativeZoom ? '' : undefined}
      side={side}
      sideOffset={sideOffset}
    >
      <BaseSelect.Popup
        className={cn(multiSelectPopupStyles, className)}
        ref={ref}
      >
        {/* Base UI ScrollArea draws the brand's quiet overlay scrollbar
            instead of the native one. The Viewport is the scroll container
            (capped to the popup's available height); Base UI Select's
            keyboard scroll-into-view targets it as the nearest scrollable
            ancestor. */}
        <ScrollArea.Root className="min-h-0">
          <ScrollArea.Viewport className={cn(multiSelectViewportStyles)}>
            {children}
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar className={cn(multiSelectScrollbarStyles)}>
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
MultiSelectPopup.displayName = 'MultiSelect.Popup'

function MultiSelectItem({
  children,
  value,
  label,
  icon,
  disabled,
  className,
}: MultiSelectItemProps) {
  return (
    <BaseSelect.Item
      className={cn(multiSelectItemStyles, className)}
      disabled={disabled}
      label={label}
      value={value}
    >
      {icon != null && (
        <span className={cn(multiSelectItemIconStyles)}>{icon}</span>
      )}
      <BaseSelect.ItemText className="min-w-0 flex-1 truncate">
        {children}
      </BaseSelect.ItemText>
      {/* ItemIndicator only mounts for the selected item, so the checkmark is
          the multi-select cue (the chevron grabber stays on the trigger). */}
      <BaseSelect.ItemIndicator className={cn(multiSelectItemIndicatorStyles)}>
        <IconCheckmark1Medium />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  )
}
MultiSelectItem.displayName = 'MultiSelect.Item'

// Compound type for the `Object.assign` result. Parts are typed via the shared
// `*Props` types (no prop re-declaration, so it can't drift). This explicit,
// exported interface is required - not stylistic: the part functions are local
// (un-exported), so a bare `Object.assign` makes `MultiSelect`'s inferred type
// reference un-nameable symbols and `tsc` raises TS4023 wherever a consumer
// re-exports `typeof MultiSelect` (e.g. the stories `meta`). Mirrors the house
// `PopoverComponent` pattern. No cast needed - the root is non-generic.
export interface MultiSelectComponent {
  (props: MultiSelectProps): ReactNode
  Trigger(props: MultiSelectTriggerProps): ReactNode
  Popup(props: MultiSelectPopupProps): ReactNode
  Item(props: MultiSelectItemProps): ReactNode
}

export const MultiSelect: MultiSelectComponent = Object.assign(
  MultiSelectRoot,
  {
    Trigger: MultiSelectTrigger,
    Popup: MultiSelectPopup,
    Item: MultiSelectItem,
  },
)
