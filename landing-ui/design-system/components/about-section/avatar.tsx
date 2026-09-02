/**
 * Avatar for the About section mockups.
 *
 * The avatars are the EXACT composited renders exported from the source Figma
 * frame (the agent logomark tiles, the gradient agent identity, the call-roster
 * faces, the dark "AJ" identity) - shipped as small WebPs in ./media. Each is a
 * circle painted on an opaque white square (no alpha), so this primitive both
 * sizes it AND clips it to a circle (`rounded-full`) - without the clip the
 * square's white corners cover the neighbor in an overlapping stack, slicing a
 * straight edge into it instead of a round one.
 */
import Image, { type StaticImageData } from 'next/image'

import { cn } from '#lib/cn'

export type AvatarProps = {
  /** A composited avatar image imported from ./media. */
  src: StaticImageData
  /** Square pixel size. */
  size: number
  /** Decorative by default ("" => hidden from AT); pass a name only if meaningful. */
  alt?: string
  className?: string
}

export function Avatar({ src, size, alt = '', className }: AvatarProps) {
  return (
    <Image
      alt={alt}
      className={cn('shrink-0 rounded-full object-cover', className)}
      height={size}
      // Explicit CSS size: without it a flex parent's default `items-stretch`
      // would stretch the image into a bar.
      src={src}
      style={{ height: size, width: size }}
      width={size}
    />
  )
}

Avatar.displayName = 'Avatar'
