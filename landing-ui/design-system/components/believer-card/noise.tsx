import { type ComponentPropsWithRef, useId } from 'react'

/**
 * Fine monochrome grain behind a believer card - Figma's procedural "Noise" fill
 * rebuilt as an `feTurbulence` filter (no raster). Decorative (`aria-hidden`);
 * the card applies the blend + opacity in CSS.
 *
 * `fractalNoise` at baseFrequency 0.7 (~1px grain), then a `feColorMatrix` that
 * desaturates and centres on mid-grey (mean 128) so hard-light adds symmetric
 * grain without shifting the card colour. `color-interpolation-filters="sRGB"`
 * is load-bearing (linearRGB skews amplitude across renderers). `useId()` keeps
 * the three cards' filter ids distinct (runs in RSC).
 */
export function BelieverCardNoise(props: ComponentPropsWithRef<'svg'>) {
  const filterId = useId()

  return (
    <svg
      aria-hidden="true"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <filter
        id={filterId}
        x="0"
        y="0"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.7"
          numOctaves={1}
          seed={7}
          stitchTiles="stitch"
          result="noise"
        />
        <feColorMatrix
          in="noise"
          type="matrix"
          values="0.14 0.14 0.14 0 0.29
                  0.14 0.14 0.14 0 0.29
                  0.14 0.14 0.14 0 0.29
                  0    0    0    0 1"
        />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${filterId})`} />
    </svg>
  )
}

BelieverCardNoise.displayName = 'BelieverCardNoise'
