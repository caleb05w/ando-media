'use client'

import { Field } from '@base-ui/react/field'
import { ScrollArea } from '@base-ui/react/scroll-area'

import { cn } from '#lib/cn'
import type { TextAreaProps } from './types'

// The control box (a ScrollArea.Root). The stroke, validity states, and focus
// ring live here - the inner <textarea> is borderless and auto-grows, so the
// box reads as the control. It shares TextField's `input-ring` box-shadow ring
// (1px grey stroke at rest -> 2px active-blue + glow on focus); the utility's
// `:focus-within` lights it when the inner <textarea> is focused. Validity
// recolours the stroke off Base UI's Field data attributes via the `group` on
// Field.Root. The box-shadow (not a CSS border) is unaffected by the box's own
// `overflow-hidden`.
const boxClasses = [
  'input-ring',
  'h-[190px] w-full overflow-hidden',
  'rounded-3xl bg-surface-primary',
  // Invalid -> 2px red stroke + glow (same tokens as TextField). No success
  // state: a free-text answer has nothing to "get right", so the stroke stays
  // neutral when valid.
  'group-data-[invalid]:[--input-accent:var(--color-border-danger)]',
  'group-data-[invalid]:[--input-stroke:var(--color-border-danger)]',
  'group-data-[invalid]:[--input-stroke-width:2px]',
  'has-[textarea:disabled]:cursor-not-allowed has-[textarea:disabled]:opacity-50',
]

// The <textarea> itself: transparent, auto-growing (`field-sizing: content`),
// never scrolling on its own - overflow belongs to the ScrollArea viewport.
// `flex-1` (inside the min-h-full Content column) keeps it filling the box
// when content is short, so clicking anywhere inside focuses it. Browsers
// without `field-sizing` fall back to the textarea's native internal
// scrolling (the viewport simply never overflows).
const controlClasses = [
  'block field-sizing-content w-full flex-1 resize-none',
  'p-6 text-size-lg leading-[26px] text-text-primary',
  'placeholder:text-text-tertiary',
  'outline-none',
  'disabled:cursor-not-allowed',
]

// Overlay scrollbar: a quiet 20%-black pill inset from the box edge, revealed
// on hover or while scrolling (hover/color feedback -> 150ms `ease`); hidden
// from the start under reduced motion is fine since opacity still toggles.
const scrollbarClasses = [
  'flex w-1 justify-center rounded-full',
  'm-2 pointer-events-none',
  'opacity-0 transition-opacity duration-150 ease-[ease] motion-reduce:transition-none',
  'data-[hovering]:pointer-events-auto data-[hovering]:opacity-100',
  'data-[scrolling]:pointer-events-auto data-[scrolling]:opacity-100',
  'data-[scrolling]:duration-0',
]

const errorClasses =
  'mt-4 text-center text-size-sm leading-[21px] text-text-danger'

/**
 * TextArea - a multi-line text control (May 2026 brand: rounded-3xl box, 1px
 * hairline border, 24px padding, 18/26 text). Built on Base UI `Field.Root` +
 * `Field.Control` rendered as a native `<textarea>`, so it inherits the same
 * `validate` / `data-invalid` plumbing as `TextField` (no success border - a
 * free-text answer has nothing to "get right"). The
 * textarea auto-grows inside a Base UI `ScrollArea`, which owns overflow and
 * draws the brand's quiet overlay scrollbar.
 *
 * Pass an `action` (e.g. a 40px icon-only `Button`) to pin a control inside the
 * box, bottom-right with a 24px inset; bottom padding is reserved so text never
 * scrolls under it.
 */
export function TextArea({
  ref,
  label,
  validate,
  validationMode = 'onChange',
  onValueChange,
  errorMessage,
  action,
  className,
  controlClassName,
  ...controlProps
}: TextAreaProps) {
  return (
    <Field.Root
      className={cn('group flex flex-col', className)}
      validate={validate}
      validationMode={validationMode}
    >
      {label != null && <Field.Label className="sr-only">{label}</Field.Label>}

      {/* Anchor for the absolutely-positioned action slot. Flex-through so a
          consumer can make the box fluid-height: pass `flex-1 min-h-0` to the
          Field.Root (via `className`) and `h-full` to the box (via
          `controlClassName`) and the box fills - and shrinks with - its
          container instead of the fixed default height. */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <ScrollArea.Root className={cn(boxClasses, controlClassName)}>
          <ScrollArea.Viewport className="h-full overscroll-contain">
            {/* Content's ResizeObserver re-measures the thumb as the textarea
                grows; the min-h-full column lets the textarea stretch to the
                box when content is short. minWidth must override Base UI's
                inline `min-width: fit-content`: with a field-sizing textarea,
                fit-content is the unwrapped single-line text width, which
                would stop the text from ever wrapping. */}
            <ScrollArea.Content
              className="flex min-h-full flex-col"
              style={{ minWidth: 0 }}
            >
              {/* `onValueChange` is a Field.Control prop (value, event), so it
                  rides on Field.Control itself. The native textarea attributes
                  ride on the rendered element instead (Base UI types
                  Field.Control for <input>, so spreading textarea handlers onto
                  it would mistype); Base UI merges its own handlers in. Reserve
                  room bottom-right so content clears the 40px action + insets. */}
              <Field.Control
                onValueChange={onValueChange}
                render={
                  <textarea
                    ref={ref}
                    {...controlProps}
                    className={cn(
                      controlClasses,
                      // 40px action + 24px inset + 8px gap.
                      action != null && 'pr-[88px] pb-[72px]',
                    )}
                  />
                }
              />
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar className={cn(scrollbarClasses)}>
            <ScrollArea.Thumb className="w-full rounded-full bg-border-strong" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
        {action != null && (
          <div className="absolute right-6 bottom-6">{action}</div>
        )}
      </div>

      {/* Error message: 14/21 danger text, centered below the field (matches
          TextField). Shown only when invalid; `errorMessage` overrides the
          validator's string when provided. The override must be a separate
          element: `children: undefined` would still clobber Base UI's default
          message (its props merge is last-wins per key). */}
      {errorMessage !== undefined ? (
        <Field.Error className={errorClasses}>{errorMessage}</Field.Error>
      ) : (
        <Field.Error className={errorClasses} />
      )}
    </Field.Root>
  )
}

TextArea.displayName = 'TextArea'
