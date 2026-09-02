import { cva } from '#lib/cn'
import { PopoverRadius } from './types'

/**
 * Popover panel chrome + enter/exit motion.
 *
 * Chrome matches the "Scan QR" card (Frame 206): white `surface-primary` fill,
 * 0.5px `border-strong` hairline (20% black), faint `shadow-xs` (0 1px 2px / 5%).
 * Corner radius is a variant: 16px default, 24px for the QR card. Motion (Emil's
 * rules): `opacity` + `scale` only (GPU), origin at the trigger corner
 * (`--transform-origin`), `ease-out` 200ms in / 150ms out, reduced-motion aware.
 */
export const popoverPanelVariants = cva(
  [
    'flex flex-col',
    'bg-surface-primary',
    'border-[0.5px] border-border-strong',
    'shadow-xs',
    // Cap to the viewport (Base UI sets --available-height) so the Body scrolls.
    'max-h-[var(--available-height)]',
    'overflow-hidden',
    'outline-none',
    // Motion
    'origin-[var(--transform-origin)]',
    'transition-[opacity,scale] duration-200 ease-out',
    'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
    'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
    'data-[ending-style]:duration-150',
    'motion-reduce:transition-none',
  ],
  {
    defaultVariants: { radius: PopoverRadius.Small },
    variants: {
      radius: {
        [PopoverRadius.Small]: 'rounded-2xl' /* 16px - general popovers */,
        [PopoverRadius.Medium]: 'rounded-3xl' /* 24px - the Scan QR card */,
      },
    },
  },
)

// Header / Footer: tighter rhythm (py-2) than Body (py-3); auto dividers.
export const popoverHeaderStyles = [
  'shrink-0',
  'px-3 py-2',
  'border-b border-border-default',
]

// Body: main content. Scrolls past the panel's max-height; override the scroller
// with `className="overflow-y-visible"`.
export const popoverBodyStyles = [
  'min-h-0 flex-1',
  'px-3 py-3',
  'overflow-y-auto',
]

// Footer: action row, right-aligned, auto top divider.
export const popoverFooterStyles = [
  'shrink-0',
  'px-2 py-2',
  'border-t border-border-default',
  'flex items-center justify-end gap-2',
]
