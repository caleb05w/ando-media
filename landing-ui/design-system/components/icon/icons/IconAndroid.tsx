/**
 * Brand/platform logo - hand-authored because Central Icons has no Android
 * mark. Source: Iconify `material-symbols:android` (Apache-2.0). Filled glyph
 * (paints with `currentColor`), 24x24 viewBox to match the generated icons.
 */
import { memo } from 'react'

import { cn } from '#lib/cn'
import { type IconProps, IconSize, iconSizeValues } from '../types'

export const IconAndroid = memo(function IconAndroid({
  size = IconSize.Medium,
  title,
  className,
  ref,
  ...props
}: IconProps) {
  const px = iconSizeValues[size]

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn('shrink-0', className)}
      ref={ref}
      {...props}
    >
      <path
        fill="currentColor"
        d="M1 18q.225-2.675 1.638-4.925T6.4 9.5L4.55 6.3q-.15-.225-.075-.475T4.8 5.45q.2-.125.45-.05t.4.3L7.5 8.9Q9.65 8 12 8t4.5.9l1.85-3.2q.15-.225.4-.3t.45.05q.25.125.325.375t-.075.475L17.6 9.5q2.35 1.325 3.763 3.575T23 18zm6.888-3.113q.362-.362.362-.887t-.363-.888T7 12.75t-.888.363T5.75 14t.363.888t.887.362t.888-.363m10 0q.362-.362.362-.887t-.363-.888T17 12.75t-.888.363t-.362.887t.363.888t.887.362t.888-.363"
      />
    </svg>
  )
})
