import type { Transition } from 'motion/react'

// JS mirror of the `--ease-spring` linear() points in styles/motion.css: a
// baked spring with -4.2% anticipation at 20% and +4.2% overshoot at 79%.
// Motion (motion/react) tweens run in JS, so the CSS token can't be referenced
// directly - interpolating the same points reproduces exactly what the browser
// does with linear().
export const EASE_SPRING_POINTS = [
  [0, 0],
  [0.07, -0.021],
  [0.13, -0.036],
  [0.2, -0.042],
  [0.27, -0.031],
  [0.33, 0.02],
  [0.39, 0.13],
  [0.45, 0.3],
  [0.51, 0.51],
  [0.57, 0.71],
  [0.63, 0.86],
  [0.69, 0.96],
  [0.74, 1.021],
  [0.79, 1.042],
  [0.85, 1.034],
  [0.92, 1.015],
  [1, 1],
] as const

/** The `--ease-spring` curve as a JS easing function for motion/react tweens. */
export function easeSpring(progress: number): number {
  for (let index = 1; index < EASE_SPRING_POINTS.length; index++) {
    const [x1, y1] = EASE_SPRING_POINTS[index] ?? [1, 1]
    if (progress <= x1 || index === EASE_SPRING_POINTS.length - 1) {
      const [x0, y0] = EASE_SPRING_POINTS[index - 1] ?? [0, 0]
      return y0 + ((y1 - y0) * (progress - x0)) / (x1 - x0)
    }
  }
  return 1
}

/**
 * EMIL's `ease-out-quart` (from "Animations on the Web"): the recommended
 * curve for elements entering/exiting the screen. Acceleration at the start
 * makes the move read as instant and responsive, then it settles - so a page
 * block becomes visible *while* it is still travelling, instead of finishing
 * its rise behind the ease-spring curve's slow, near-invisible start.
 */
export const EASE_OUT_QUART: [number, number, number, number] = [
  0.165, 0.84, 0.44, 1,
]

/* -------------------------------------------------------------------------
 * Shared entrance recipe (mirrors styles/motion.css; motion takes seconds).
 *
 * Every entrance is the same three channels: opacity 0->1 and blur->0 on a
 * ~1s tween over the ease-spring curve, plus a small transform (16px rise /
 * scale 1.1 fields) on a real spring. Exits run much faster - 200ms fade,
 * 300ms blur-UP - so an outgoing screen evaporates while the next one is
 * still settling in (concurrent, no "wait").
 *
 * The waitlist flow rides this for screen/field entrances; the page-level
 * `Reveal` primitive rides it for on-load and on-scroll section reveals - so
 * the marketing pages share the waitlist's exact motion signature.
 * ------------------------------------------------------------------------- */

// Staggers (the `--stagger-*` tokens): 25ms per word, 100ms per block, 200ms
// per section. Compound by multiplying by the element's index.
export const STAGGER_WORD = 0.025
export const STAGGER_BLOCK = 0.1
export const STAGGER_SECTION = 0.2

// Transforms ride real springs: slight overshoot, settling in about a second.
// `SETTLE` is the critically-damped variant a large element rises on, so it
// lands without the bounce the smaller blocks can carry.
const SPRING: Transition = { type: 'spring', stiffness: 150, damping: 19 }
const SETTLE: Transition = { type: 'spring', stiffness: 150, damping: 25 }

// Opacity/blur enter tweens: `--duration-enter` (1s) on the spring curve; the
// done/finale screen slows to `--duration-finale` (1.5s).
const enterTween: Transition = { duration: 1, ease: easeSpring }
const finaleTween: Transition = { duration: 1.5, ease: easeSpring }

/** The shared enter timing, offset by `delay` (the block/section stagger). */
export function enterAt(
  delay: number,
  options?: { settle?: boolean; slow?: boolean },
): Transition {
  const tween = options?.slow ? finaleTween : enterTween
  const spring = options?.settle ? SETTLE : SPRING
  return {
    x: { ...spring, delay },
    y: { ...spring, delay },
    scale: { ...spring, delay },
    opacity: { ...tween, delay },
    filter: { ...tween, delay },
  }
}

// Exits: opacity at 200ms / blur-up at 300ms (both ease-out) while the element
// springs upward - down-in, up-out keeps one forward direction.
export const screenExit: Transition = {
  y: { type: 'spring', stiffness: 260, damping: 30 },
  opacity: { duration: 0.2, ease: 'easeOut' },
  filter: { duration: 0.3, ease: 'easeOut' },
}
