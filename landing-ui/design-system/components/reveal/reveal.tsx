'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

import { EASE_OUT_QUART } from '#lib/motion'

export interface RevealProps {
  /**
   * Stagger offset in seconds. Compose page cascades from the shared tokens,
   * e.g. `STAGGER_BLOCK * index` / `STAGGER_SECTION * index`. @default 0
   */
  delay?: number
  /**
   * Blur tier by element size: 4 words, 8 buttons, 10 text blocks. Pass `0` to
   * opt out of the blur channel for large or media/WebGL content, where
   * animating a full-element blur is an expensive transient composite. @default 8
   */
  blur?: number
  /** Rise distance in px. @default 16 */
  distance?: number
  /** Finale cadence: 1.2s tween instead of 0.8s. @default false */
  slow?: boolean
  className?: string
  children: ReactNode
}

/**
 * The page-level entrance: rise + unblur + fade on the brand's ease-spring
 * curve, the same signature the waitlist flow's `Rise` uses inside the dialog.
 * Plays on mount, so a page feeds its blocks in on load - wrap each block and
 * offset its `delay` to build a staggered cascade.
 *
 * All channels (opacity, blur, transform) ride one `ease-out` tween rather
 * than the dialog `Rise`'s ease-spring. EMIL's blueprint puts enter/exit on
 * ease-out so the block becomes visible *as* it travels; the ease-spring
 * curve's slow, slightly-backwards start instead finished the rise while the
 * block was still near-invisible, so it read as a plain fade.
 *
 * Under reduced motion the block renders settled in place - no entrance of any
 * kind, all channels disabled (not just the transform).
 */
export function Reveal({
  delay = 0,
  blur = 8,
  distance = 16,
  slow = false,
  className,
  children,
}: RevealProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      className={className}
      initial={{ opacity: 0, y: distance, filter: `blur(${blur}px)` }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { delay, duration: slow ? 1.2 : 0.8, ease: EASE_OUT_QUART }
      }
    >
      {children}
    </motion.div>
  )
}

Reveal.displayName = 'Reveal'
