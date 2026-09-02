import type { Transition } from 'motion/react'

/* -------------------------------------------------------------------------
 * Waitlist-specific motion. The shared entrance recipe (enterAt, screenExit,
 * the stagger tokens) now lives in `#lib/motion` so the page-level `Reveal`
 * primitive can share the exact same signature; it is re-exported here so the
 * flow's own modules keep their local `./motion` import. The arrow/reflow
 * transitions below are unique to the inline email field and stay local.
 * ------------------------------------------------------------------------- */

export {
  enterAt,
  STAGGER_BLOCK,
  STAGGER_WORD,
  screenExit,
} from '#lib/motion'

const ARROW_SPRING: Transition = { type: 'spring', stiffness: 210, damping: 22 }

// The submit arrow revealing as the field fills - a micro-interaction, quicker
// than a screen entrance: a settling spring for the slide+scale, a short
// blur+fade. The reveal is held back 50ms so the field starts making room
// first, then the arrow drops into the space.
export const arrowReveal: Transition = {
  default: { ...ARROW_SPRING, delay: 0.05 },
  opacity: { duration: 0.2, ease: 'easeOut', delay: 0.05 },
  filter: { duration: 0.25, ease: 'easeOut', delay: 0.05 },
}

// The arrow tucking away as the field empties - same curve, but no delay (it
// leaves at once) and no scale: a center-origin shrink in the top-aligned row
// reads as the arrow dropping on the Y axis, so it just slides right + fades.
export const arrowTuck: Transition = {
  default: ARROW_SPRING,
  opacity: { duration: 0.2, ease: 'easeOut' },
  filter: { duration: 0.25, ease: 'easeOut' },
}

// The field resizing to make room for (or reclaim space from) the arrow as it
// reveals/tucks - drives the `layout` animation on the field wrapper.
export const fieldReflow: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 30,
}
