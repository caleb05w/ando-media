import type { ComponentPropsWithRef, ReactNode } from 'react'

/** One featured story: a brand mark, its source + date, the headline, and a link. */
export interface Story {
  /** 64px brand mark / tile node (icon, logo, or <img>). */
  image: ReactNode
  /** Source / publication name, e.g. "Claude". */
  source: string
  /** Formatted publish date, e.g. "April 26, 2026". */
  date: string
  /** Story headline (rendered as the GT Standard title). */
  title: string
  /** Destination URL (stories are external; opened in a new tab). */
  href: string
}

export interface StoriesSectionProps extends ComponentPropsWithRef<'section'> {
  /** Section heading. @default "Featured stories" */
  heading?: ReactNode
  /** The stories to list (2-up on desktop, stacked on mobile). @default the two May 2026 featured posts */
  stories?: Story[]
}
