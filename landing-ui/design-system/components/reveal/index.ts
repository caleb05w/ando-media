// The stagger tokens travel with `Reveal` so callers compose page cascades
// (`STAGGER_BLOCK * index`) without reaching into `#lib/motion` directly.
export { STAGGER_BLOCK, STAGGER_SECTION, STAGGER_WORD } from '#lib/motion'
export { Reveal, type RevealProps } from './reveal'
