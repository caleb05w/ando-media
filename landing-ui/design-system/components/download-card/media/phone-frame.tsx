import type { ComponentPropsWithRef } from 'react'

import { cn } from '#lib/cn'

/**
 * Phone-mockup chrome shared by the mobile DownloadCard story media (iOS + Android): a
 * white panel with 32px-rounded top corners (`rounded-t-4xl`), a 1px 6%-black
 * hairline, and the soft drop shadow measured from the Download frame's phone
 * cards (`0 2px 8px rgba(0,0,0,0.05)`). The call site sizes and positions it;
 * its content (an app-screen image or the wireframe grid) bleeds off the card's
 * bottom edge, which the card clips.
 *
 * The `before:*` layer washes the white surface with 1% black: `isolate` makes
 * the frame its own stacking context and `-z-10` parks the wash above the white
 * fill but behind the content, so the grid/screen sits on the tinted surface.
 */
export function PhoneFrame({
  className,
  ...props
}: ComponentPropsWithRef<'div'>) {
  return (
    <div
      className={cn(
        "isolate overflow-hidden rounded-t-4xl border border-opacity-6 bg-surface-primary shadow-[0_2px_8px_0_rgba(0,0,0,0.05)] before:absolute before:inset-0 before:-z-10 before:bg-opacity-1 before:content-['']",
        className,
      )}
      {...props}
    />
  )
}
PhoneFrame.displayName = 'PhoneFrame'
