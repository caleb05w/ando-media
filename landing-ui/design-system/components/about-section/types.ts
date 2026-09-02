import type { ComponentPropsWithRef, ReactNode } from 'react'

/**
 * FeatureCard - one column of the About section: an interactive product preview
 * fading into a bottom caption (heading + description). The middle card sets
 * `highlighted` for the focused blue-ring treatment.
 */
export type FeatureCardProps = Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> & {
  /** Display-font card title. */
  heading: ReactNode
  /** Supporting paragraph under the title. */
  description: ReactNode
  /** Focused treatment: taller card, blue border + inner glow ring. */
  highlighted?: boolean
  /** The product-UI preview, pinned near the top and faded into the surface. */
  children: ReactNode
}

/** The full 3-up About section. */
export type AboutSectionProps = ComponentPropsWithRef<'section'>
