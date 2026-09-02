import type { ResponsiveKey } from '#lib/responsive'
import { type Responsive, responsiveClasses } from '#lib/responsive'
import type { TextSize } from './types'

/**
 * Enumerated `text-size-*` utilities per (breakpoint, size). Every class is a
 * complete static literal - Tailwind v4 scans source as plain text, so an
 * interpolated `` `${bp}:text-size-${size}` `` would never be generated. The
 * paired `--text-size-*--line-height` token rides along with each utility, so a
 * responsive size also resolves its line-height per breakpoint.
 */
const TEXT_SIZE_CLASSES: Record<ResponsiveKey, Record<TextSize, string>> = {
  base: {
    '2xs': 'text-size-2xs',
    xs: 'text-size-xs',
    sm: 'text-size-sm',
    md: 'text-size-md',
    lg: 'text-size-lg',
    xl: 'text-size-xl',
    '2xl': 'text-size-2xl',
    '2-5xl': 'text-size-2-5xl',
    '3xl': 'text-size-3xl',
    '4xl': 'text-size-4xl',
    '5xl': 'text-size-5xl',
    '6xl': 'text-size-6xl',
  },
  sm: {
    '2xs': 'sm:text-size-2xs',
    xs: 'sm:text-size-xs',
    sm: 'sm:text-size-sm',
    md: 'sm:text-size-md',
    lg: 'sm:text-size-lg',
    xl: 'sm:text-size-xl',
    '2xl': 'sm:text-size-2xl',
    '2-5xl': 'sm:text-size-2-5xl',
    '3xl': 'sm:text-size-3xl',
    '4xl': 'sm:text-size-4xl',
    '5xl': 'sm:text-size-5xl',
    '6xl': 'sm:text-size-6xl',
  },
  md: {
    '2xs': 'md:text-size-2xs',
    xs: 'md:text-size-xs',
    sm: 'md:text-size-sm',
    md: 'md:text-size-md',
    lg: 'md:text-size-lg',
    xl: 'md:text-size-xl',
    '2xl': 'md:text-size-2xl',
    '2-5xl': 'md:text-size-2-5xl',
    '3xl': 'md:text-size-3xl',
    '4xl': 'md:text-size-4xl',
    '5xl': 'md:text-size-5xl',
    '6xl': 'md:text-size-6xl',
  },
  lg: {
    '2xs': 'lg:text-size-2xs',
    xs: 'lg:text-size-xs',
    sm: 'lg:text-size-sm',
    md: 'lg:text-size-md',
    lg: 'lg:text-size-lg',
    xl: 'lg:text-size-xl',
    '2xl': 'lg:text-size-2xl',
    '2-5xl': 'lg:text-size-2-5xl',
    '3xl': 'lg:text-size-3xl',
    '4xl': 'lg:text-size-4xl',
    '5xl': 'lg:text-size-5xl',
    '6xl': 'lg:text-size-6xl',
  },
  xl: {
    '2xs': 'xl:text-size-2xs',
    xs: 'xl:text-size-xs',
    sm: 'xl:text-size-sm',
    md: 'xl:text-size-md',
    lg: 'xl:text-size-lg',
    xl: 'xl:text-size-xl',
    '2xl': 'xl:text-size-2xl',
    '2-5xl': 'xl:text-size-2-5xl',
    '3xl': 'xl:text-size-3xl',
    '4xl': 'xl:text-size-4xl',
    '5xl': 'xl:text-size-5xl',
    '6xl': 'xl:text-size-6xl',
  },
  '2xl': {
    '2xs': '2xl:text-size-2xs',
    xs: '2xl:text-size-xs',
    sm: '2xl:text-size-sm',
    md: '2xl:text-size-md',
    lg: '2xl:text-size-lg',
    xl: '2xl:text-size-xl',
    '2xl': '2xl:text-size-2xl',
    '2-5xl': '2xl:text-size-2-5xl',
    '3xl': '2xl:text-size-3xl',
    '4xl': '2xl:text-size-4xl',
    '5xl': '2xl:text-size-5xl',
    '6xl': '2xl:text-size-6xl',
  },
}

/** Resolve a `Responsive<TextSize>` into space-joined `text-size-*` literals. */
export function textSizeClasses(size: Responsive<TextSize>): string {
  return responsiveClasses(size, TEXT_SIZE_CLASSES)
}
