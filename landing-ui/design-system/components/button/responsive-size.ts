import type { TextSize } from '#components/text'
import type { ResponsiveKey } from '#lib/responsive'
import {
  type Responsive,
  resolveResponsive,
  responsiveClasses,
} from '#lib/responsive'
import { buttonSizeToTextSize } from './styles'
import type { ButtonSize } from './types'

/**
 * Enumerated geometry (`h-* gap-* px-*`) per (breakpoint, size). Every class is
 * a complete static literal - Tailwind v4 scans source as plain text, so an
 * interpolated `` `${bp}:h-11` `` would never be generated. Only geometry lives
 * here; the per-breakpoint `text-size-*` (which drives em-based icon sizing and
 * the label) is resolved separately via `buttonTextSize` + `textSizeClasses`.
 */
const BUTTON_GEOMETRY_CLASSES: Record<
  ResponsiveKey,
  Record<ButtonSize, string>
> = {
  base: {
    small: 'h-[34px] gap-1.5 px-3.5',
    medium: 'h-11 gap-2 px-4',
    large: 'h-[58px] gap-3 px-6',
  },
  sm: {
    small: 'sm:h-[34px] sm:gap-1.5 sm:px-3.5',
    medium: 'sm:h-11 sm:gap-2 sm:px-4',
    large: 'sm:h-[58px] sm:gap-3 sm:px-6',
  },
  md: {
    small: 'md:h-[34px] md:gap-1.5 md:px-3.5',
    medium: 'md:h-11 md:gap-2 md:px-4',
    large: 'md:h-[58px] md:gap-3 md:px-6',
  },
  lg: {
    small: 'lg:h-[34px] lg:gap-1.5 lg:px-3.5',
    medium: 'lg:h-11 lg:gap-2 lg:px-4',
    large: 'lg:h-[58px] lg:gap-3 lg:px-6',
  },
  xl: {
    small: 'xl:h-[34px] xl:gap-1.5 xl:px-3.5',
    medium: 'xl:h-11 xl:gap-2 xl:px-4',
    large: 'xl:h-[58px] xl:gap-3 xl:px-6',
  },
  '2xl': {
    small: '2xl:h-[34px] 2xl:gap-1.5 2xl:px-3.5',
    medium: '2xl:h-11 2xl:gap-2 2xl:px-4',
    large: '2xl:h-[58px] 2xl:gap-3 2xl:px-6',
  },
}

/** Resolve a `Responsive<ButtonSize>` into space-joined geometry literals. */
export function buttonGeometryClasses(size: Responsive<ButtonSize>): string {
  return responsiveClasses(size, BUTTON_GEOMETRY_CLASSES)
}

/**
 * Map a `Responsive<ButtonSize>` to the matching `Responsive<TextSize>` (via
 * `buttonSizeToTextSize`). The single result drives both the container's
 * `text-size-*` (em-based icon sizing) and the label `<Text size>`, so they
 * stay in lockstep across breakpoints.
 */
export function buttonTextSize(
  size: Responsive<ButtonSize>,
): Responsive<TextSize> {
  const resolved = resolveResponsive(size)
  const out: Partial<Record<ResponsiveKey, TextSize>> = {}
  for (const key of Object.keys(resolved) as ResponsiveKey[]) {
    const value = resolved[key]
    if (value != null) {
      out[key] = buttonSizeToTextSize[value]
    }
  }
  return out
}
