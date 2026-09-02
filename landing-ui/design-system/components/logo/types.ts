import type { ComponentProps } from 'react'

/**
 * Which form of the Ando logo to render.
 * - `lockup`: the logomark + "Ando" wordmark, side by side (default; the nav).
 * - `mark`: the logomark (speech-bubble glyph) on its own (the footer).
 * - `wordmark`: the "Ando" wordmark on its own.
 */
export const LogoVariant = {
  Lockup: 'lockup',
  Mark: 'mark',
  Wordmark: 'wordmark',
} as const

export type LogoVariant = (typeof LogoVariant)[keyof typeof LogoVariant]

export interface LogoProps
  extends Omit<
    ComponentProps<'svg'>,
    // Sizing is driven by `size`; accessibility by `label`. Lock both down so
    // the component's model can't be put into an invalid state from outside.
    'children' | 'width' | 'height' | 'role' | 'aria-label' | 'aria-hidden'
  > {
  /** Which form to render. @default 'lockup' */
  variant?: LogoVariant
  /**
   * Rendered height; width follows from the artwork's aspect ratio. A number is
   * treated as pixels, a string as any CSS length (e.g. `'1.5rem'`).
   * @default 20
   */
  size?: number | string
  /**
   * Accessible name. When set, the logo is exposed to assistive tech as an
   * image with this label (`role="img"`). When omitted, the logo is treated as
   * decorative (`aria-hidden`) - correct when it sits inside a labeled home
   * link or beside the visible brand name.
   */
  label?: string
}
