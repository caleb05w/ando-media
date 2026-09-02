import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Re-exported so components import their styling primitives from one place:
// `import { cn, cva, type VariantProps } from '#lib/cn'`.
export { cva, type VariantProps } from 'class-variance-authority'

// Typography size scale keys (see src/styles/typography.css).
const SIZE_KEYS = [
  '2xs',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '2-5xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
]

/**
 * tailwind-merge taught about the custom `text-size-*` utilities: without
 * registering them under `font-size` they'd be treated as `text-*` color
 * utilities and a size + color could cancel out.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ 'text-size': SIZE_KEYS }],
    },
  },
})

/** Merge class names; later conflicting utilities win. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
