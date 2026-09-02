import type { Ref, SVGProps } from 'react'

/**
 * Named icon sizes, matching the sizes used across the brand frames
 * (16 / 20 / 24px).
 */
export const IconSize = {
  Small: 'sm',
  Medium: 'md',
  Large: 'lg',
} as const

export type IconSize = (typeof IconSize)[keyof typeof IconSize]

/** Size token to pixel mapping. */
export const iconSizeValues: Record<IconSize, number> = {
  [IconSize.Small]: 16,
  [IconSize.Medium]: 20,
  [IconSize.Large]: 24,
}

/**
 * Icon fill style (outlined vs filled artwork), for icons generated with the
 * `--filled` flag. This selects the icon variant; the SVG color itself always
 * comes from `currentColor`.
 */
export const IconFill = {
  Filled: 'filled',
  Outlined: 'outlined',
} as const

export type IconFill = (typeof IconFill)[keyof typeof IconFill]

/** Base props for outlined-only icons. */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'size'> {
  /** Size token. Defaults to Medium (20px). */
  size?: IconSize
  /**
   * Accessible label. When provided, the icon gets `role="img"` + `aria-label`
   * and is exposed to screen readers; otherwise it is `aria-hidden` (decorative).
   */
  title?: string
  className?: string
  ref?: Ref<SVGSVGElement>
}

/** Props for icons with outlined/filled variants. */
export interface IconWithFillProps extends IconProps {
  fill?: IconFill
}
