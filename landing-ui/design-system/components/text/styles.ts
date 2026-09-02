import { cva } from '#lib/cn'
import type { TextSize } from './types'

/**
 * CVA variants for the Text component (tokens from typography.css + colors.css).
 * Display and UI faces use their native tracking; `uppercase` overrides it with
 * wide tracking. cn()'s tailwind-merge lets `className` win conflicts.
 */
// `size` is intentionally NOT a cva variant: it is responsive (a single token
// or a per-breakpoint map) and is resolved to enumerated literal `text-size-*`
// classes by `textSizeClasses` (see ./responsive-size.ts).
export const textVariants = cva('', {
  defaultVariants: {
    color: 'primary',
    font: 'sans',
    truncate: false,
    uppercase: false,
    weight: 'regular',
  },
  variants: {
    color: {
      inherit: '',
      inverse: 'text-text-inverse',
      'inverse-secondary': 'text-text-inverse-secondary',
      'inverse-strong': 'text-text-inverse-strong',
      'inverse-tertiary': 'text-text-inverse-tertiary',
      primary: 'text-text-primary',
      secondary: 'text-text-secondary',
      strong: 'text-text-strong',
      tertiary: 'text-text-tertiary',
    },
    font: {
      display: 'font-display tracking-normal',
      mono: 'font-mono tracking-normal',
      sans: 'font-sans tracking-normal',
    },
    truncate: {
      false: '',
      true: 'truncate',
    },
    uppercase: {
      false: '',
      true: 'uppercase tracking-wide',
    },
    weight: {
      medium: 'font-medium',
      regular: 'font-normal',
    },
  },
})

/**
 * Line-height per Text size, in rem (mirrors typography.css). For code that must
 * match a Text line, e.g. skeleton placeholders.
 */
export const TEXT_LEADING_REM: Record<TextSize, number> = {
  '2xl': 1.875,
  '2-5xl': 2.1,
  '2xs': 0.75,
  '3xl': 2.2,
  '4xl': 3,
  '5xl': 3.75,
  '6xl': 4.5,
  lg: 1.6875,
  md: 1.5,
  sm: 1.3125,
  xl: 1.875,
  xs: 1.125,
}
