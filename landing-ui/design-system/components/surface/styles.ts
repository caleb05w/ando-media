import { cva } from '#lib/cn'
import { SurfaceRadius, SurfaceVariant } from './types'

/**
 * Cards use `border-border-subtle` (8% black, the frame value) at Tailwind's 1px
 * default. Radius and shadow are the standardised tokens (styles/radius.css,
 * styles/effects.css): `elevated` uses `shadow-sm` (the brand app-icon shadow).
 */
export const surfaceVariants = cva([], {
  defaultVariants: {
    variant: SurfaceVariant.Outlined,
    radius: SurfaceRadius.Medium,
  },
  variants: {
    variant: {
      [SurfaceVariant.Elevated]:
        'border border-border-subtle bg-surface-primary shadow-sm',
      [SurfaceVariant.Outlined]:
        'border border-border-subtle bg-surface-primary',
      [SurfaceVariant.Flat]: 'bg-surface-secondary',
      [SurfaceVariant.Subtle]: 'bg-surface-subtle',
      [SurfaceVariant.Inverse]: 'bg-surface-inverse text-text-inverse',
    },
    radius: {
      [SurfaceRadius.None]: 'rounded-none',
      [SurfaceRadius.Small]: 'rounded-2xl' /* 16px - media */,
      [SurfaceRadius.Medium]: 'rounded-3xl' /* 24px - card */,
      [SurfaceRadius.Large]: 'rounded-4xl' /* 32px - feature tile */,
    },
  },
})
