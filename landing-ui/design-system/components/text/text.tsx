import type { CSSProperties, ElementType } from 'react'

import { cn } from '#lib/cn'
import { textSizeClasses } from './responsive-size'
import { textVariants } from './styles'
import {
  type SemanticTextProps,
  TEXT_BODY_SIZE,
  type TextNumeric,
  type TextProps,
  TextSize,
} from './types'

// Tailwind built-in numeric utilities.
const numericClassMap: Record<TextNumeric, string> = {
  'diagonal-fractions': 'diagonal-fractions',
  proportional: 'proportional-nums',
  'slashed-zero': 'slashed-zero',
  tabular: 'tabular-nums',
}

function getNumericClasses(numeric?: TextNumeric | TextNumeric[]): string {
  if (!numeric) {
    return ''
  }
  const values = Array.isArray(numeric) ? numeric : [numeric]
  return values.map((value) => numericClassMap[value]).join(' ')
}

/** Polymorphic typography primitive (`as` sets the element; `ref` is a prop). */
export function Text({
  as,
  font,
  size = TextSize.Medium,
  weight,
  color,
  uppercase,
  truncate = false,
  numeric,
  className,
  style,
  ...props
}: TextProps) {
  const Component = (as ?? 'p') as ElementType

  // `true` or `1` => single-line truncate; a number >= 2 => multi-line clamp.
  const isSingleLine = truncate === true || truncate === 1

  // Inline styles, not `line-clamp-${n}`: Tailwind v4 only emits CSS for class
  // names seen as static literals, so a template-built class would silently fail.
  const clampStyle: CSSProperties | undefined =
    typeof truncate === 'number' && truncate >= 2
      ? {
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: truncate,
          display: '-webkit-box',
          overflow: 'hidden',
        }
      : undefined

  return (
    <Component
      className={cn(
        textVariants({
          color,
          font,
          truncate: isSingleLine,
          uppercase,
          weight,
        }),
        textSizeClasses(size),
        getNumericClasses(numeric),
        className,
      )}
      style={clampStyle ? { ...clampStyle, ...style } : style}
      {...props}
    />
  )
}

Text.displayName = 'Text'

/* Semantic wrappers - fix the font + sensible defaults; all props stay overridable. */

/** Editorial hero - Test Signifier 60px. Renders as `h1`. */
export function Hero(props: SemanticTextProps) {
  return <Text as="h1" font="display" size="5xl" {...props} />
}

/** Editorial display - Test Signifier 48px (page title / CTA headline). `h2`. */
export function Display(props: SemanticTextProps) {
  return <Text as="h2" font="display" size="4xl" {...props} />
}

/** Editorial heading - Test Signifier 32px. Renders as `h3`. */
export function Heading(props: SemanticTextProps) {
  return <Text as="h3" font="display" size="3xl" {...props} />
}

/** Editorial title - Test Signifier 24px Medium (story/card titles). `h4`. */
export function Title(props: SemanticTextProps) {
  return <Text as="h4" font="display" size="2xl" weight="medium" {...props} />
}

/** Lead / sub-headline - Suisse Intl (Geist fallback) 24px, tertiary (40%). */
export function Lead(props: SemanticTextProps) {
  return <Text font="sans" size="2xl" color="tertiary" {...props} />
}

/** Body copy - Suisse Intl, 14px on mobile and 16px from `md` up. */
export function Body(props: SemanticTextProps) {
  return <Text font="sans" size={TEXT_BODY_SIZE} {...props} />
}

/** Caption / fine print - Suisse Intl (Geist fallback) 12px, tertiary (40%). */
export function Caption(props: SemanticTextProps) {
  return <Text font="sans" size="xs" color="tertiary" {...props} />
}

/** Eyebrow / overline - Suisse Intl (Geist fallback) 10px, uppercase. */
export function Eyebrow(props: SemanticTextProps) {
  return <Text font="sans" size="2xs" uppercase color="secondary" {...props} />
}
