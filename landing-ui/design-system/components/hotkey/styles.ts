import { cva } from '#lib/cn'

/**
 * Keycap badge for a single shortcut key (e.g. the "D" in "Download for Mac" or
 * the "A" in "Get access"). Square `<kbd>` whose look adapts to the surface it
 * sits on via `tone`; the key label uses the mono Text face.
 *
 * - `inverse` (default): white-alpha fill, no border - for the dark/inverse
 *   primary buttons.
 * - `default`: a bordered cap (transparent fill) - for light page surfaces.
 *
 * When it only reinforces a labeled button, pass `aria-hidden` so the keycap is
 * not appended to the button's accessible name (e.g. "Download for Mac D").
 */
export const hotkeyVariants = cva(
  'pointer-events-none inline-flex select-none items-center justify-center rounded-md px-1',
  {
    defaultVariants: { size: 'md', tone: 'inverse' },
    variants: {
      size: {
        md: 'h-[26px] min-w-[26px]',
        sm: 'h-[21px] min-w-[21px]',
      },
      tone: {
        /** Light page surface: a hairline-bordered cap, no fill. */
        default: 'border border-border-default',
        /** Dark/inverse button surface: a white-alpha fill, no border. */
        inverse: 'bg-surface-inverse-subtle',
      },
    },
  },
)
