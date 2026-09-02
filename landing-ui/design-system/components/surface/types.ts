import type { ComponentPropsWithRef } from 'react'

/**
 * Visual treatment, drawn from the brand frames:
 * - `outlined` (default): white card + hairline border (the download cards)
 * - `elevated`: outlined + the single `shadow-default` token
 * - `flat`: `surface-secondary` panel, no border (sections, footer)
 * - `subtle`: `surface-subtle` tint, no border (sub-nav strip)
 * - `inverse`: dark fill + inverse text (the dark CTAs)
 *
 * Tonal fills beyond these (tertiary/quaternary) and `border-strong` edges are
 * reached via `className`.
 */
export const SurfaceVariant = {
  Elevated: 'elevated',
  Outlined: 'outlined',
  Flat: 'flat',
  Subtle: 'subtle',
  Inverse: 'inverse',
} as const

export type SurfaceVariant =
  (typeof SurfaceVariant)[keyof typeof SurfaceVariant]

/**
 * Corner radius, in px: none 0 · sm 16 · md 24 · lg 32. These are the brand's
 * surface radii (media / card / feature tile); `md` (the card) is the default.
 */
export const SurfaceRadius = {
  None: 'none',
  Small: 'sm',
  Medium: 'md',
  Large: 'lg',
} as const

export type SurfaceRadius = (typeof SurfaceRadius)[keyof typeof SurfaceRadius]

/**
 * Generic visual container: tokenised background, optional border/shadow, and a
 * corner radius. Padding is not a prop - pass `className="p-8"` (brand cards use 32px).
 */
export type SurfaceProps = ComponentPropsWithRef<'div'> & {
  /** Visual treatment. @default 'outlined' */
  variant?: SurfaceVariant
  /** Corner radius. @default 'md' */
  radius?: SurfaceRadius
}
