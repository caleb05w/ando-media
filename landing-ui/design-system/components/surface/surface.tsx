import { cn } from '#lib/cn'
import { surfaceVariants } from './styles'
import type { SurfaceProps } from './types'

/** Generic visual container primitive - compose instead of restating the recipe on a `<div>`. */
export function Surface({
  variant,
  radius,
  className,
  children,
  ref,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(surfaceVariants({ variant, radius }), className)}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  )
}

Surface.displayName = 'Surface'
