/**
 * Color Token Definitions - Ando
 *
 * Single source of truth for the Storybook color documentation. Must stay in
 * sync with ./colors.css (same token names + scales).
 *
 * Used by:
 * - stories.tsx for the swatch documentation
 * - Tailwind content scanning (colorSafelist) so every primitive + semantic
 *   color CSS variable is emitted into the Storybook/app build (Tailwind v4
 *   only outputs a `--color-*` variable when an emitted utility references it).
 */

export interface ScaleColor {
  /** Token prefix, e.g. `opacity` -> `--color-opacity-80` */
  key: string
  name: string
  description: string
  scales: number[]
  /** Resolved display value per scale (hex, or rgb()/alpha string). */
  values: Record<number, string>
  /** Render swatches over a checkerboard (translucent / white chips). */
  bordered?: boolean
}

export interface SemanticToken {
  name: string
  cssVar: string
  /** The primitive this token resolves to (for the docs table). */
  source: string
  /** Where the color is used in the brand frames. */
  usage: string
}

export interface SemanticCategory {
  name: string
  /** Tailwind utility prefix used to apply the category. */
  utility: 'bg' | 'text' | 'border'
  tokens: SemanticToken[]
}

export const scaleColors: ScaleColor[] = [
  {
    key: 'opacity',
    name: 'Opacity (black)',
    description:
      'Black alpha - the working neutral ramp for text, borders and subtle fills on light surfaces.',
    scales: [1, 2, 4, 6, 8, 10, 20, 40, 50, 60, 80],
    bordered: true,
    values: {
      1: 'rgb(0 0 0 / 1%)',
      2: 'rgb(0 0 0 / 2%)',
      4: 'rgb(0 0 0 / 4%)',
      6: 'rgb(0 0 0 / 6%)',
      8: 'rgb(0 0 0 / 8%)',
      10: 'rgb(0 0 0 / 10%)',
      20: 'rgb(0 0 0 / 20%)',
      40: 'rgb(0 0 0 / 40%)',
      50: 'rgb(0 0 0 / 50%)',
      60: 'rgb(0 0 0 / 60%)',
      80: 'rgb(0 0 0 / 80%)',
    },
  },
  {
    key: 'opacity-inverted',
    name: 'Opacity (white)',
    description:
      'White alpha - text and fills on dark surfaces (dark buttons, dark cards).',
    scales: [20, 40, 75, 80],
    bordered: true,
    values: {
      20: 'rgb(255 255 255 / 20%)',
      40: 'rgb(255 255 255 / 40%)',
      75: 'rgb(255 255 255 / 75%)',
      80: 'rgb(255 255 255 / 80%)',
    },
  },
  {
    key: 'tonal',
    name: 'Tonal (opaque)',
    description:
      'Opaque surfaces. 10-40 are the light surfaces; 100 is opaque black. The mid-range is absent by design - mid greys come from the black-alpha scale.',
    scales: [10, 20, 30, 40, 100],
    bordered: true,
    values: {
      10: '#fcfcfc',
      20: '#fafaf8',
      30: '#fdfcf3',
      40: '#f0f0f0',
      100: '#000000',
    },
  },
]

export const semanticTokens: SemanticCategory[] = [
  {
    name: 'Text',
    utility: 'text',
    tokens: [
      {
        name: 'Primary',
        cssVar: '--color-text-primary',
        source: '#282828',
        usage: 'Headings, primary body, active nav',
      },
      {
        name: 'Secondary',
        cssVar: '--color-text-secondary',
        source: '#676767',
        usage: 'Captions and supporting text',
      },
      {
        name: 'Tertiary',
        cssVar: '--color-text-tertiary',
        source: 'Opacity/40',
        usage: 'Body, meta, dates, inactive nav',
      },
      {
        name: 'Strong',
        cssVar: '--color-text-strong',
        source: 'Tonal/100',
        usage: 'The few opaque-black headings + logo art',
      },
      {
        name: 'Inverse',
        cssVar: '--color-text-inverse',
        source: 'Tonal/10',
        usage: 'Labels on dark buttons/cards',
      },
      {
        name: 'Inverse Strong',
        cssVar: '--color-text-inverse-strong',
        source: 'Opacity-inverted/80',
        usage: 'Emphasized text on dark (company names)',
      },
      {
        name: 'Inverse Secondary',
        cssVar: '--color-text-inverse-secondary',
        source: 'Opacity-inverted/75',
        usage: 'Keycap glyph on dark buttons',
      },
      {
        name: 'Inverse Tertiary',
        cssVar: '--color-text-inverse-tertiary',
        source: 'Opacity-inverted/40',
        usage: 'Muted caption on dark cards',
      },
      {
        name: 'Danger',
        cssVar: '--color-text-danger',
        source: '#ff6666',
        usage: 'Form validation error message',
      },
    ],
  },
  {
    name: 'Icon',
    utility: 'text',
    tokens: [
      {
        name: 'Primary',
        cssVar: '--color-icon-primary',
        source: 'Opacity/80',
        usage: 'Primary icons',
      },
      {
        name: 'Secondary',
        cssVar: '--color-icon-secondary',
        source: 'Opacity/40',
        usage: 'Muted icons',
      },
      {
        name: 'Inverse',
        cssVar: '--color-icon-inverse',
        source: 'Tonal/10',
        usage: 'Icons on dark surfaces',
      },
    ],
  },
  {
    name: 'Surface',
    utility: 'bg',
    tokens: [
      {
        name: 'Primary',
        cssVar: '--color-surface-primary',
        source: 'Tonal/10',
        usage: 'Page background, cards (#fcfcfc)',
      },
      {
        name: 'Secondary',
        cssVar: '--color-surface-secondary',
        source: 'Tonal/20',
        usage: 'Sections, footer (#fafaf8)',
      },
      {
        name: 'Tertiary',
        cssVar: '--color-surface-tertiary',
        source: 'Tonal/30',
        usage: 'Paper tint (#fdfcf3)',
      },
      {
        name: 'Quaternary',
        cssVar: '--color-surface-quaternary',
        source: 'Tonal/40',
        usage: 'Hero graphic container (#f0f0f0)',
      },
      {
        name: 'Inverse',
        cssVar: '--color-surface-inverse',
        source: '#242424',
        usage: 'Dark buttons + investor cards',
      },
      {
        name: 'Subtle',
        cssVar: '--color-surface-subtle',
        source: 'Opacity/2',
        usage: 'Faint strip tint',
      },
      {
        name: 'Hover',
        cssVar: '--color-surface-hover',
        source: 'Opacity/4',
        usage: 'Hover / chip fill',
      },
      {
        name: 'Pressed',
        cssVar: '--color-surface-pressed',
        source: 'Opacity/6',
        usage: 'Pressed / pill fill',
      },
      {
        name: 'Inverse Subtle',
        cssVar: '--color-surface-inverse-subtle',
        source: 'Opacity-inverted/20',
        usage: 'Keycap chip fill on dark',
      },
      {
        name: 'Success',
        cssVar: '--color-surface-success',
        source: '#09cc29',
        usage: 'Form progress check fill',
      },
    ],
  },
  {
    name: 'Border',
    utility: 'border',
    tokens: [
      {
        name: 'Subtle',
        cssVar: '--color-border-subtle',
        source: 'Opacity/8',
        usage: 'Hairline outline (stroke-outline)',
      },
      {
        name: 'Default',
        cssVar: '--color-border-default',
        source: 'Opacity/10',
        usage: 'Dividers, card & chip edges',
      },
      {
        name: 'Strong',
        cssVar: '--color-border-strong',
        source: 'Opacity/20',
        usage: 'Image container edge',
      },
      {
        name: 'Success',
        cssVar: '--color-border-success',
        source: '#75db84',
        usage: 'Valid form input outline',
      },
      {
        name: 'Danger',
        cssVar: '--color-border-danger',
        source: '#ff6666',
        usage: 'Invalid form input outline',
      },
      {
        name: 'Active',
        cssVar: '--color-border-active',
        source: '#51a6f5',
        usage: 'Active/focused input stroke, glow & caret',
      },
    ],
  },
  {
    name: 'Shadow',
    utility: 'bg',
    tokens: [
      {
        name: 'Default',
        cssVar: '--color-shadow-default',
        source: 'black 20%',
        usage: 'Elevation (app-icon drop shadow)',
      },
    ],
  },
]

/**
 * Tailwind safelist for every color token.
 *
 * Tailwind v4 only emits a `--color-*` custom property when an emitted utility
 * references it. The swatch story reads tokens via `var(--color-*)`, so without
 * this list those variables would be missing and the swatches would be empty.
 * The app/Storybook `@source` globs scan this file, so listing one `bg-*` class
 * per token forces all of them into the build. Keep in sync with the tokens above.
 */
// biome-ignore format: single-line safelist string is intentional
export const colorSafelist =
  'bg-opacity-1 bg-opacity-2 bg-opacity-4 bg-opacity-6 bg-opacity-8 bg-opacity-10 bg-opacity-20 bg-opacity-40 bg-opacity-50 bg-opacity-60 bg-opacity-80 bg-opacity-inverted-20 bg-opacity-inverted-40 bg-opacity-inverted-75 bg-opacity-inverted-80 bg-tonal-10 bg-tonal-20 bg-tonal-30 bg-tonal-40 bg-tonal-100 bg-text-primary bg-text-secondary bg-text-tertiary bg-text-strong bg-text-inverse bg-text-inverse-strong bg-text-inverse-secondary bg-text-inverse-tertiary bg-icon-primary bg-icon-secondary bg-icon-inverse bg-surface-primary bg-surface-secondary bg-surface-tertiary bg-surface-quaternary bg-surface-inverse bg-surface-subtle bg-surface-hover bg-surface-pressed bg-surface-inverse-subtle bg-border-subtle bg-border-default bg-border-strong bg-border-success bg-border-danger bg-border-active bg-text-danger bg-surface-success bg-shadow-default'
