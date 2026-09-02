import type { ComponentProps } from 'react'

/**
 * Spinner size. String values intentionally match `ButtonSize` so a Button can
 * forward its own `size` straight through without a mapping.
 */
export const SpinnerSize = {
  Small: 'small',
  Medium: 'medium',
  Large: 'large',
} as const

export type SpinnerSize = (typeof SpinnerSize)[keyof typeof SpinnerSize]

/** Spinner color variant. Values match `ButtonVariant` for the same reason. */
export const SpinnerVariant = {
  Primary: 'primary',
  Secondary: 'secondary',
} as const

export type SpinnerVariant =
  (typeof SpinnerVariant)[keyof typeof SpinnerVariant]

export interface SpinnerProps extends Omit<ComponentProps<'svg'>, 'children'> {
  size?: SpinnerSize
  variant?: SpinnerVariant
}
