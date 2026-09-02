import { Separator as BaseSeparator } from '@base-ui/react/separator'
import type { ComponentPropsWithRef } from 'react'

import { cn, cva } from '#lib/cn'

/** Separator line styles. `variant` sets the tone; orientation + variant set the thickness. */
export const separatorVariants = cva('shrink-0', {
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'regular',
  },
  variants: {
    orientation: {
      horizontal: 'w-full',
      vertical: 'h-full',
    },
    variant: {
      regular: 'bg-border-subtle',
      hairline: 'bg-border-default',
    },
  },
  compoundVariants: [
    { orientation: 'horizontal', variant: 'regular', className: 'h-px' },
    { orientation: 'vertical', variant: 'regular', className: 'w-px' },
    { orientation: 'horizontal', variant: 'hairline', className: 'h-[0.5px]' },
    { orientation: 'vertical', variant: 'hairline', className: 'w-[0.5px]' },
  ],
})

/**
 * Thin divider. Wraps Base UI's `Separator` (renders `<div role="separator">`),
 * so it's accessible by default; pass `aria-hidden` for a decorative divider.
 */
export interface SeparatorProps extends ComponentPropsWithRef<'div'> {
  /** Line orientation; `'vertical'` needs a parent with a resolved height. @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical'
  /** `'regular'`: 1px, 8% black. `'hairline'`: 0.5px, 10% black. @default 'regular' */
  variant?: 'regular' | 'hairline'
}

export function Separator({
  className,
  orientation = 'horizontal',
  variant = 'regular',
  ...props
}: SeparatorProps) {
  return (
    <BaseSeparator
      className={cn(separatorVariants({ orientation, variant }), className)}
      orientation={orientation}
      {...props}
    />
  )
}

Separator.displayName = 'Separator'
