/**
 * Brand/platform logo - hand-authored because Central Icons has no Windows
 * mark. Source: Iconify `mdi:microsoft` (Material Design Icons, Apache-2.0).
 * Filled glyph (paints with `currentColor`), 24x24 viewBox to match the
 * generated icons.
 */
import { memo } from 'react'

import { cn } from '#lib/cn'
import { type IconProps, IconSize, iconSizeValues } from '../types'

export const IconWindows = memo(function IconWindows({
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
        d="M2 3h9v9H2zm9 19H2v-9h9zM21 3v9h-9V3zm0 19h-9v-9h9z"
      />
    </svg>
  )
})
