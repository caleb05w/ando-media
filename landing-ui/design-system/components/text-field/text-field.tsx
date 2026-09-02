'use client'

import { Field } from '@base-ui/react/field'
import { useCallback, useRef } from 'react'

import { cn } from '#lib/cn'
import type { TextFieldProps } from './types'

// Pill input matching the May 2026 brand: 45px tall / 16px inset / 16/21 value
// text on mobile, growing to 66px / 24px inset / 18/26 on md+. The stroke +
// focus glow are box-shadow layers from the `input-ring` utility (no CSS
// border - so the stroke animates 1px->2px with no reflow or seam); state
// recolours them by reassigning its variables, driven off Base UI's field data
// attributes so the visual state tracks validation (the "input fields" frame):
//   - default (rest)           -> 1px grey stroke
//   - :focus (neutral)         -> 2px border-active (#51a6f5 @60%) + blue glow
//   - data-valid + data-filled -> 2px border-success (green; `successClasses`,
//     only applied when a `validate` prop exists); stays green + green glow
//     while focused
//   - data-invalid             -> 2px border-danger (red; `dangerClasses`, only
//     applied while `showError`); stays red + red glow while focused
// The caret is the active blue everywhere. The brand replaces the shared black
// `focus-ring` outline with this coloured stroke + glow - so `outline-hidden`
// suppresses the browser's *default* focus outline, which would otherwise paint
// its own (blue, offset) ring over the box-shadow and hide the state colour.
// `outline-hidden` keeps a transparent forced-colors fallback for a11y.
const controlClasses = cn(
  'input-ring outline-hidden',
  'h-[var(--height-field)] w-full rounded-full bg-surface-primary px-4',
  'text-size-md leading-[21px] text-text-primary',
  'md:h-[var(--height-field-md)] md:px-6 md:text-size-lg md:leading-[26px]',
  'placeholder:text-text-tertiary caret-border-active',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

const prefixedControlClasses = cn(
  'input-ring outline-hidden',
  'flex h-[var(--height-field)] w-full items-center rounded-full bg-surface-primary px-4',
  'text-size-md leading-[21px] text-text-primary',
  'md:h-[var(--height-field-md)] md:px-6 md:text-size-lg md:leading-[26px]',
  'cursor-text [&:has(input:disabled)]:cursor-not-allowed [&:has(input:disabled)]:opacity-50',
)

const prefixedInputClasses = cn(
  'min-w-0 flex-1 bg-transparent p-0 outline-none',
  'text-size-md leading-[21px] text-text-primary',
  'md:text-size-lg md:leading-[26px]',
  'placeholder:text-text-tertiary caret-border-active',
  'disabled:cursor-not-allowed',
)

const prefixClasses =
  'shrink-0 select-none text-size-md leading-[21px] text-text-primary md:text-size-lg md:leading-[26px]'

// Success is opt-in (only fields given a `validate` prop) and only while the
// field has a value. Both gates are load-bearing: Base UI commits
// `valid: true` on every change even with no `validate` prop (its default
// validator is a no-op), and an empty optional input is natively valid - so an
// ungated `data-[valid]` class would turn every field green on the first
// keystroke and keep it green after the text is deleted. The design wants
// green only on validated fields (email, LinkedIn), and neutral for an
// emptied or never-validated one (the name field). Pinning `--input-stroke` to
// green here (2px) makes the field green at rest AND keeps it green while
// active: the two-attribute selector out-specifies the utility's neutral
// `:focus` stroke. `--input-accent` recolours the focus glow to match.
const successClasses = cn(
  'data-[valid]:data-[filled]:[--input-accent:var(--color-border-success)]',
  'data-[valid]:data-[filled]:[--input-stroke:var(--color-border-success)]',
  'data-[valid]:data-[filled]:[--input-stroke-width:2px]',
)

const prefixedSuccessClasses = cn(
  '[&:has(input[data-valid][data-filled])]:[--input-accent:var(--color-border-success)]',
  '[&:has(input[data-valid][data-filled])]:[--input-stroke:var(--color-border-success)]',
  '[&:has(input[data-valid][data-filled])]:[--input-stroke-width:2px]',
)

// Same idea for the 2px red stroke. The single-attribute `data-[invalid]`
// selector ties the utility's neutral `:focus` stroke on specificity, so the
// focused pair `data-[invalid]:focus:` is needed to keep an invalid focused
// field red. `--input-accent` recolours the glow to red.
const dangerClasses = cn(
  'data-[invalid]:[--input-accent:var(--color-border-danger)]',
  'data-[invalid]:[--input-stroke:var(--color-border-danger)]',
  'data-[invalid]:[--input-stroke-width:2px]',
  'data-[invalid]:focus:[--input-stroke:var(--color-border-danger)]',
)

const prefixedDangerClasses = cn(
  '[&:has(input[data-invalid])]:[--input-accent:var(--color-border-danger)]',
  '[&:has(input[data-invalid])]:[--input-stroke:var(--color-border-danger)]',
  '[&:has(input[data-invalid])]:[--input-stroke-width:2px]',
  '[&:has(input[data-invalid]):focus-within]:[--input-stroke:var(--color-border-danger)]',
)

const errorClasses =
  'mt-4 text-center text-size-sm leading-[21px] text-text-danger'

/**
 * TextField - single-line pill input built on Base UI `Field`. Drop in a
 * `validate` function to get the green (valid) / red (invalid) border treatment
 * and a centered error message; without one the border stays neutral even when
 * filled. Name the control with `label` (visually hidden) or `aria-label`.
 */
export function TextField({
  className,
  ref,
  placeholder,
  prefix,
  name,
  type = 'text',
  value,
  defaultValue,
  onValueChange,
  disabled,
  required,
  validate,
  validationMode = 'onChange',
  validationDebounceTime,
  actionsRef,
  errorMessage,
  showError = true,
  showErrorMessage = true,
  showSuccess = true,
  label,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...controlProps
}: TextFieldProps) {
  const controlRef = useRef<HTMLInputElement | null>(null)
  const setControlRef = useCallback(
    (node: HTMLInputElement | null) => {
      controlRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref != null) {
        ref.current = node
      }
    },
    [ref],
  )
  const hasPrefix = prefix !== undefined
  const control = (
    <Field.Control
      {...controlProps}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={cn(
        hasPrefix ? prefixedInputClasses : controlClasses,
        !hasPrefix && showSuccess && validate != null && successClasses,
        !hasPrefix && showError && dangerClasses,
        !hasPrefix && className,
      )}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      placeholder={placeholder}
      ref={setControlRef}
      required={required}
      type={type}
      value={value}
    />
  )

  return (
    <Field.Root
      actionsRef={actionsRef}
      className="flex w-full flex-col items-stretch"
      disabled={disabled}
      name={name}
      validate={validate}
      validationDebounceTime={validationDebounceTime}
      validationMode={validationMode}
    >
      {label != null && <Field.Label className="sr-only">{label}</Field.Label>}

      {hasPrefix ? (
        <div
          className={cn(
            prefixedControlClasses,
            showSuccess && validate != null && prefixedSuccessClasses,
            showError && prefixedDangerClasses,
            className,
          )}
          onPointerDown={(event) => {
            if (event.target !== controlRef.current) {
              event.preventDefault()
              controlRef.current?.focus()
            }
          }}
        >
          {prefix !== '' && prefix != null && (
            <span aria-hidden className={prefixClasses}>
              {prefix}
            </span>
          )}
          {control}
        </div>
      ) : (
        control
      )}

      {/* `errorMessage` overrides the validator's string when provided. The
          override must be a separate element: `children: undefined` would still
          clobber Base UI's default message (its props merge is last-wins per
          key). */}
      {showError &&
        showErrorMessage &&
        (errorMessage !== undefined ? (
          <Field.Error className={errorClasses}>{errorMessage}</Field.Error>
        ) : (
          <Field.Error className={errorClasses} />
        ))}
    </Field.Root>
  )
}

TextField.displayName = 'TextField'
