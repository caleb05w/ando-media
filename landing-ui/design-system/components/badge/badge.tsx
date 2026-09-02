import type { ComponentPropsWithRef } from 'react'

import { Text } from '#components/text'
import { cn, cva } from '#lib/cn'

/**
 * Badge container styles - an outlined pill matching the "Coming soon" badge in
 * the brand frames: hairline border, transparent fill, fully rounded.
 */
export const badgeVariants = cva([
  'inline-flex items-center justify-center',
  'whitespace-nowrap rounded-full border border-border-default',
  'px-2 py-1.5',
])

/** Small outlined pill for short labels/status (e.g. "Coming soon"). */
export type BadgeProps = ComponentPropsWithRef<'span'>

export function Badge({ children, className, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants(), className)} {...props}>
      {/*
        Optical centering: Geist's metrics seat the cap height ~0.5px above the
        line-box center, so a short label reads bottom-heavy in the pill. Nudge
        it down half a pixel to balance the cap-height-to-baseline block.
      */}
      <Text
        as="span"
        size="xs"
        weight="medium"
        color="secondary"
        className="relative top-[0.5px]"
      >
        {children}
      </Text>
    </span>
  )
}

Badge.displayName = 'Badge'
