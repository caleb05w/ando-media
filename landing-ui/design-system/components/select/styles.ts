/**
 * Select styles.
 *
 * The trigger reuses the TextField pill geometry (45px tall / 16px inset /
 * 16/21 value text on mobile, growing to 66px / 24px inset / 18/26 on md+) and
 * its focus ring: the `input-ring` box-shadow (1px grey stroke at rest -> 2px
 * active-blue stroke + glow on focus, red on `data-invalid`), with
 * `outline-hidden` suppressing the browser's default focus outline so it can't
 * paint over the box-shadow. The two controls read as one family.
 *
 * The popup has no Figma design - it borrows the popover panel chrome: white
 * fill, hairline border, faint shadow, rounded corners, quiet hover. Motion
 * follows the house rule: opacity + scale only, reduced-motion aware.
 */

export const selectTriggerStyles = [
  // Pill geometry + box-shadow focus ring (mirrors text-field/text-field.tsx).
  'input-ring outline-hidden',
  'flex h-[var(--height-field)] w-full items-center rounded-full bg-surface-primary px-4',
  'text-size-md leading-[21px] text-text-primary',
  'md:h-[var(--height-field-md)] md:px-6 md:text-size-lg md:leading-[26px]',
  'cursor-pointer select-none text-left',
  // Invalid -> 2px red stroke + glow (mirror TextField's dangerClasses); the
  // focus-within pair keeps it red while the trigger is focused.
  'data-[invalid]:[--input-accent:var(--color-border-danger)]',
  'data-[invalid]:[--input-stroke:var(--color-border-danger)]',
  'data-[invalid]:[--input-stroke-width:2px]',
  'data-[invalid]:focus-within:[--input-stroke:var(--color-border-danger)]',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
]

// Value fills the row; placeholder takes the tertiary tone via data-placeholder.
export const selectValueStyles = [
  'min-w-0 flex-1 truncate',
  'data-[placeholder]:text-text-tertiary',
]

// Trailing chevron: 24px from the right edge (px-6 inset) + icon-secondary tone.
export const selectIconStyles = ['ml-2 flex shrink-0 text-icon-secondary']

// Leading icon: 20px from the left (px-6 is 24px, so a -1 nudge) + 8px gap.
// Muted (icon-secondary) so brand marks read as quiet glyphs beside the value.
export const selectLeadingIconStyles = [
  '-ml-1 mr-2 flex shrink-0 text-icon-secondary',
]

// Per-option leading icon: the item row is already `flex items-center gap-2`,
// so it only needs to stay sized + muted (matches the trigger's value icon).
export const selectItemIconStyles = ['flex shrink-0 text-icon-secondary']

export const selectPositionerStyles = ['z-[9999]']

export const selectPopupStyles = [
  'flex flex-col',
  // Match the trigger width. The height cap + scrolling live on the ScrollArea
  // viewport inside; `overflow-hidden` clips the scrolled list to the rounded
  // corners.
  'min-w-[var(--anchor-width)]',
  'origin-[var(--transform-origin)]',
  'overflow-hidden',
  'rounded-2xl bg-surface-primary',
  'border-[0.5px] border-border-strong',
  'shadow-xs',
  'outline-none',
  // Motion: opacity + scale only (GPU), reduced-motion aware.
  'transition-[opacity,scale] duration-200 ease-out',
  'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
  'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
  'data-[ending-style]:duration-150',
  'motion-reduce:transition-none',
]

// Base UI ScrollArea inside the popup, replacing the native scrollbar with the
// brand's quiet overlay (mirrors TextArea). The viewport caps to the available
// height so the list scrolls; 2px padding keeps item highlights off the edges.
export const selectViewportStyles = [
  'max-h-[var(--available-height)] overscroll-contain p-2',
  // Base UI gives the viewport `tabindex=0` when the list overflows; suppress
  // its default browser focus ring (the list items carry the focus state).
  'outline-none',
]

// Overlay scrollbar: a quiet pill inset from the popup edge, revealed on hover
// or while scrolling. Same recipe as TextArea's scrollbar.
export const selectScrollbarStyles = [
  'flex w-1 justify-center rounded-full',
  'm-1.5 pointer-events-none',
  'opacity-0 transition-opacity duration-150 ease-[ease] motion-reduce:transition-none',
  'data-[hovering]:pointer-events-auto data-[hovering]:opacity-100',
  'data-[scrolling]:pointer-events-auto data-[scrolling]:opacity-100',
  'data-[scrolling]:duration-0',
]

export const selectItemStyles = [
  'flex cursor-pointer select-none items-center gap-2',
  'rounded-xl px-3 py-2.5 md:px-4 md:py-3',
  'text-size-md leading-[24px] text-text-primary md:text-size-lg md:leading-[26px]',
  'outline-none',
  // Base UI highlights via data-highlighted (keyboard + pointer).
  'data-[highlighted]:bg-surface-hover',
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
]
