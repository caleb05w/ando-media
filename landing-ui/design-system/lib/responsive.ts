/**
 * Responsive value helpers for component `size`-style props.
 *
 * Mirrors the breakpoint-object API common to mature design systems (Chakra's
 * `{ base, md }`, Radix's `{ initial, md }`): a prop accepts either a single
 * value (applies at every width) or a mobile-first map keyed by breakpoint.
 *
 * Tailwind v4 only generates a utility when its class name appears verbatim as
 * a static string in source (it scans files as plain text - no interpolation).
 * So components MUST resolve a `Responsive<T>` against an *enumerated* map of
 * complete literal class names (one cell per breakpoint x value), never build
 * `` `${bp}:...` `` at runtime. See each component's `responsive-*.ts`.
 */

/** Viewport breakpoints (Tailwind v4 defaults: 640 / 768 / 1024 / 1280 / 1536). */
export const BREAKPOINTS = ['sm', 'md', 'lg', 'xl', '2xl'] as const

export type Breakpoint = (typeof BREAKPOINTS)[number]

/** `base` is the un-prefixed value; breakpoint keys apply at that width and up. */
export type ResponsiveKey = 'base' | Breakpoint

/** All keys in mobile-first cascade order (`base` first). */
export const RESPONSIVE_KEYS: readonly ResponsiveKey[] = [
  'base',
  ...BREAKPOINTS,
]

/** A single value, or a mobile-first map of breakpoint -> value. */
export type Responsive<T> = T | Partial<Record<ResponsiveKey, T>>

/**
 * Normalize a `Responsive<T>` into a `{ base, sm, ... }` record. A bare value
 * becomes `{ base: value }`; `undefined`/`null` becomes `{}`. Object values
 * pass through (callers own which keys they set).
 */
export function resolveResponsive<T>(
  value: Responsive<T> | undefined | null,
): Partial<Record<ResponsiveKey, T>> {
  if (value == null) {
    return {}
  }
  if (typeof value === 'object') {
    return value as Partial<Record<ResponsiveKey, T>>
  }
  return { base: value }
}

/**
 * Resolve a `Responsive<T>` against an enumerated class map and join the hits
 * in cascade order. `classMap[key][value]` must hold complete literal Tailwind
 * classes (e.g. `'md:text-size-xl'`) so v4 can detect them.
 */
export function responsiveClasses<T extends string>(
  value: Responsive<T> | undefined | null,
  classMap: Partial<Record<ResponsiveKey, Partial<Record<T, string>>>>,
): string {
  const resolved = resolveResponsive(value)
  const out: string[] = []
  for (const key of RESPONSIVE_KEYS) {
    const v = resolved[key]
    if (v == null) {
      continue
    }
    const cls = classMap[key]?.[v]
    if (cls) {
      out.push(cls)
    }
  }
  return out.join(' ')
}
