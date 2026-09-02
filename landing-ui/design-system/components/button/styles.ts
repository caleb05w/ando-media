import { TextSize } from '#components/text'
import { cva } from '#lib/cn'
import { ButtonSize, ButtonVariant } from './types'

/** Maps a button size to the `Text` size used for its label. */
export const buttonSizeToTextSize: Record<ButtonSize, TextSize> = {
  [ButtonSize.Small]: TextSize.Small,
  [ButtonSize.Medium]: TextSize.Medium,
  [ButtonSize.Large]: TextSize.XL,
}

export const buttonVariants = cva(
  [
    // Layout: pill, centered row (label/section gap set per size).
    'relative inline-flex items-center justify-center whitespace-nowrap rounded-full',
    'cursor-pointer select-none',
    // Hover/color feedback: CSS `ease` curve at 150ms (Emil: gentle
    // micro-interaction), disabled under reduced-motion. Opacity is included
    // so enabling/disabling fades instead of snapping.
    'transition-[background-color,color,opacity,scale] duration-150 ease-[ease] motion-reduce:transition-none',
    // Press: 1% scale dip with asymmetric timing - in at `press` (50ms,
    // instant feedback), out at the resting 150ms (gentle recovery).
    'active:scale-[0.99] active:duration-(--duration-press)',
    // Icons (in a section or as the label itself) scale with the button's
    // font-size; the spinner (role="status") keeps its own size.
    '[&_svg:not([role=status])]:size-[1.125em]',
    // Icon-only (no text label, or label is a lone svg) -> square => circle.
    '[&:not(:has([data-label]))]:aspect-square [&:not(:has([data-label]))]:px-0',
    '[&:has([data-label]>svg:only-child)]:aspect-square [&:has([data-label]>svg:only-child)]:px-0',
    // Focus: shared keyboard-focus ring (see styles/effects.css).
    'focus-ring',
    // Disabled / loading (pointer-events-none also suppresses hover styles)
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  ],
  {
    defaultVariants: {
      variant: ButtonVariant.Primary,
    },
    variants: {
      // `size` is intentionally NOT a cva variant: it is responsive (a single
      // token or a per-breakpoint map) and is resolved to enumerated literal
      // geometry (`h-* gap-* px-*`) + `text-size-*` classes by
      // `buttonGeometryClasses` / `buttonTextSize` (see ./responsive-size.ts).
      variant: {
        [ButtonVariant.Primary]: [
          // Resting black/80%; hover nudges to black/90%, press to full black.
          'bg-surface-inverse text-text-inverse',
          'hover:bg-tonal-100/90',
          'active:bg-tonal-100',
        ],
        [ButtonVariant.Secondary]: [
          // Flat light pill, no border (May 2026 brand): 6% black fill,
          // darkening to 8% on hover and 10% on press.
          'bg-surface-pressed text-text-secondary',
          'hover:bg-opacity-8 hover:text-text-primary',
          'active:bg-opacity-10',
        ],
      },
    },
  },
)
