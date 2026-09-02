import type { ComponentPropsWithRef } from 'react'

import type { Responsive } from '#lib/responsive'

/** Font family axis. */
export const TextFont = {
  /** Suisse Intl with a Geist fallback - body & UI (default). */
  Sans: 'sans',
  /** Test Signifier - editorial headings and long-form reading. */
  Display: 'display',
  /** Geist Mono - eyebrows/overlines & key-cap badges. */
  Mono: 'mono',
} as const

export type TextFont = (typeof TextFont)[keyof typeof TextFont]

/** Size scale, keyed to the `--text-size-*` tokens. */
export const TextSize = {
  /** eyebrow / overline */
  XXS: '2xs',
  /** caption / TOC */
  XS: 'xs',
  /** small body / bios */
  Small: 'sm',
  /** body (default) */
  Medium: 'md',
  /** large UI */
  Large: 'lg',
  /** lead / button */
  XL: 'xl',
  /** sub-headline / display title */
  XXL: '2xl',
  /** mobile display / hero (28px), between XXL and XXXL */
  XXL2: '2-5xl',
  /** display heading */
  XXXL: '3xl',
  /** display large (page title / CTA) */
  Display: '4xl',
  /** display hero */
  Hero: '5xl',
  /** display hero XL (home page headline, 72px) */
  HeroXL: '6xl',
} as const

export type TextSize = (typeof TextSize)[keyof typeof TextSize]

/** Standard reading size: compact on mobile, full body size from `md` up. */
export const TEXT_BODY_SIZE = {
  base: TextSize.Small,
  md: TextSize.Medium,
} as const

/** Font weight - the design uses only Regular (400) and Medium (500). */
export const TextWeight = {
  Regular: 'regular',
  Medium: 'medium',
} as const

export type TextWeight = (typeof TextWeight)[keyof typeof TextWeight]

/** Text color tiers, mapped to the semantic `--color-text-*` tokens. */
export const TextColor = {
  /** black 80% (default) */
  Primary: 'primary',
  /** black 60% */
  Secondary: 'secondary',
  /** black 40% */
  Tertiary: 'tertiary',
  /** opaque black */
  Strong: 'strong',
  /** white */
  Inverse: 'inverse',
  /** white 80% */
  InverseStrong: 'inverse-strong',
  /** white 75% */
  InverseSecondary: 'inverse-secondary',
  /** white 40% */
  InverseTertiary: 'inverse-tertiary',
  /** inherit from parent */
  Inherit: 'inherit',
} as const

export type TextColor = (typeof TextColor)[keyof typeof TextColor]

/** OpenType numeric features (Tailwind built-ins). */
export const TextNumeric = {
  /** Fixed-width digits ('tnum') */
  Tabular: 'tabular',
  /** Variable-width digits, default ('pnum') */
  Proportional: 'proportional',
  /** Zero with diagonal slash ('zero') */
  SlashedZero: 'slashed-zero',
  /** Diagonal fractions, e.g. 1/2 ('frac') */
  DiagonalFractions: 'diagonal-fractions',
} as const

export type TextNumeric = (typeof TextNumeric)[keyof typeof TextNumeric]

/** Allowed HTML elements for polymorphic rendering. */
export type TextElement =
  | 'p'
  | 'span'
  | 'div'
  | 'label'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'

/**
 * Props for the Text component. Extends paragraph attributes; `color` is
 * re-typed to the token union (not the HTML presentational attribute).
 */
export interface TextProps extends Omit<ComponentPropsWithRef<'p'>, 'color'> {
  /** HTML element to render. Defaults to `p`. */
  as?: TextElement
  /** Font family axis. Defaults to `sans` (Suisse Intl, then Geist). */
  font?: TextFont
  /**
   * Typography size token. Defaults to `md` (16px). Accepts a single token, or
   * a mobile-first responsive map, e.g. `size={{ base: '2-5xl', lg: '5xl' }}`.
   */
  size?: Responsive<TextSize>
  /** Font weight. Defaults to `regular` (400). */
  weight?: TextWeight
  /** Text color tier. Defaults to `primary`. */
  color?: TextColor
  /** Uppercase the text and apply wide tracking (for eyebrows/overlines). */
  uppercase?: boolean
  /** Truncate text. `true` = single line, number = max lines (line clamp). */
  truncate?: boolean | number
  /** Numeric OpenType feature(s). Accepts a single value or an array. */
  numeric?: TextNumeric | TextNumeric[]
}

/** Props for the semantic wrappers (Hero, Display, Body, ...). Font is fixed. */
export type SemanticTextProps = Omit<TextProps, 'font'>
