import type { ComponentPropsWithRef, ReactNode } from 'react'

/**
 * Horizontal placement of the shared lines pattern within a single card.
 *
 * `BelieverCardLines` is ONE continuous SVG spanning the whole 3-card row; each
 * card reveals a slice of it. The alignment picks which slice shows:
 * - `start`: pinned left (the first card)
 * - `center`: centered (the middle card)
 * - `end`: pinned right (the last card)
 */
export const BelieverCardLinesAlign = {
  Start: 'start',
  Center: 'center',
  End: 'end',
} as const

export type BelieverCardLinesAlign =
  (typeof BelieverCardLinesAlign)[keyof typeof BelieverCardLinesAlign]

/**
 * BelieverCard root. A single investor quote card from the "Believers Details"
 * frame: a pastel surface (the accent color composited over the Figma artboard
 * base) carrying a logo, a person, a quote, and a supporting detail line.
 */
export type BelieverCardProps = ComponentPropsWithRef<'div'> & {
  /**
   * The brand accent painted over the card via `mix-blend-overlay`. A one-off
   * per-investor CSS color string (e.g. `#D53B2E`), not a theme token.
   */
  accentColor: string
  /** Whether this card carries its investor color; inactive cards settle to grey. @default true */
  highlighted?: boolean
  /** Which slice of the shared lines pattern this card reveals. */
  lines: BelieverCardLinesAlign
  /** The investor logo, rendered at its intrinsic size in the top slot. */
  logo: ReactNode
}

/**
 * BelieverCard.Person: a 20px avatar circle beside the person's name. `avatar`
 * is a slot for the photo (stories pass a `next/image`); it fills the circle.
 */
export type BelieverCardPersonProps = ComponentPropsWithRef<'div'> & {
  /** The person's photo, sized to fill the 20px circle. */
  avatar: ReactNode
}
