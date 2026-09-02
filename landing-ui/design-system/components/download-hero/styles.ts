import { cva } from '#lib/cn'

// Center-tile dot-matrix: 5px rounded squares on a 5.7px pitch at ~1.8% black.
const SQUARE_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='5.7' height='5.7'%3E%3Crect width='5' height='5' rx='0.5' fill='black' fill-opacity='0.018'/%3E%3C/svg%3E\")"
const SQUARE_LAYER = `${SQUARE_TILE} center / 5.7px 5.7px repeat`
const CENTER_FILL = 'linear-gradient(#fff, #f6f6f6)'

// Side tiles: #FCFCFC fill behind a 1px #EFEFEF -> #F7F7F7 gradient border.
export const SIDE_TILE = {
  border: '1px solid transparent',
  background:
    'linear-gradient(#fcfcfc, #fcfcfc) padding-box, linear-gradient(to bottom, #efefef, #f7f7f7) border-box',
} as const

// The center tile's drop shadow, shared by both border variants.
const CENTER_SHADOW = '0 4px 4px -3px rgb(0 0 0 / 0.12)'

// Center tile, outer layer — `simple` (default): a flat 1px black-5% border over
// a white interior.
export const CENTER_OUTER_SIMPLE = {
  border: '1px solid rgb(0 0 0 / 0.05)',
  background: '#fff',
  boxShadow: CENTER_SHADOW,
} as const

// Center tile, outer layer — `3d`: a 0.5px hairline border, 5% black (top) ->
// transparent (center), over a white interior; pairs with the 2px white inner
// frame (the `::after` in `download-hero.module.css`).
export const CENTER_OUTER_3D = {
  border: '0.5px solid transparent',
  background:
    'linear-gradient(#fff, #fff) padding-box, linear-gradient(to bottom, rgb(0 0 0 / 0.05), transparent 50%) border-box',
  boxShadow: CENTER_SHADOW,
} as const

// Center tile, inner layer: a #FFF -> #F6F6F6 fill, optionally under the dot-matrix
// grid. One `background` shorthand so React can't reset `background-size`.
export function centerInner(grid: boolean) {
  return {
    background: grid ? `${SQUARE_LAYER}, ${CENTER_FILL}` : CENTER_FILL,
  } as const
}

// Center-tile grain: white film grain via SVG `feTurbulence` (baseFrequency
// 1.5625 == 1/0.64px), the `feColorMatrix` forcing each sample to white speckle
// on transparency.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='g' x='0' y='0' width='100%25' height='100%25' color-interpolation-filters='sRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5625' numOctaves='2' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0.6 0.6 0.6 0 -0.45'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")"

// Grain overlay: the noise blended soft-light over the tile, kept subtle.
export const CENTER_GRAIN = {
  backgroundImage: GRAIN,
  mixBlendMode: 'soft-light',
  opacity: 0.6,
} as const

// Side-tile size + radius (25% of side).
export const tileVariants = cva('shrink-0', {
  defaultVariants: { size: 'sm' },
  variants: {
    size: {
      sm: 'size-16 rounded-2xl' /* 64px */,
      md: 'size-24 rounded-3xl' /* 96px */,
    },
  },
})
