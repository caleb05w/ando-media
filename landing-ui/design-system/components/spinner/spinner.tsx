import { cn, cva } from '#lib/cn'
import { type SpinnerProps, SpinnerSize, SpinnerVariant } from './types'

const spinnerVariants = cva('animate-spin', {
  defaultVariants: {
    size: SpinnerSize.Medium,
    variant: SpinnerVariant.Primary,
  },
  variants: {
    size: {
      // Sizes track the button's font-relative icon sizing (~1.125em) so the
      // left slot doesn't resize when an icon is swapped for the spinner.
      [SpinnerSize.Small]: 'size-4',
      [SpinnerSize.Medium]: 'size-4.5',
      [SpinnerSize.Large]: 'size-5.5',
    },
    variant: {
      [SpinnerVariant.Primary]: 'text-text-inverse',
      [SpinnerVariant.Secondary]: 'text-text-secondary',
    },
  },
})

/**
 * Indeterminate loading spinner. The spin is essential motion (a frozen ring
 * reads as stalled), so it is intentionally not gated on `prefers-reduced-motion`.
 */
export function Spinner({ size, variant, className, ...props }: SpinnerProps) {
  return (
    <svg
      aria-label="Loading"
      className={cn(spinnerVariants({ size, variant }), className)}
      fill="none"
      role="status"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

Spinner.displayName = 'Spinner'
