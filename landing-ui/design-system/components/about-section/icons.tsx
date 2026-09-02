/**
 * Product-UI icons for the About section mockups.
 *
 * These are NOT part of the shared Icon set - they depict the Ando *product*
 * UI inside the feature-card previews. The geometry is the EXACT vector
 * exported from the source Figma frame (node 1809:4330), inlined here so the
 * section never depends on expiring Figma asset URLs.
 *
 * Monochrome glyphs paint with `currentColor` (set the exact product color via
 * a `text-[...]` class on the call site); the Linear mark keeps its brand blue.
 */
import type { SVGProps } from 'react'

import { cn } from '#lib/cn'

type GlyphProps = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & {
  /** Square pixel size. */
  size?: number
}

/** Channel hashtag (exact Figma vector). */
export function IconHashtag({ size = 16, className, ...props }: GlyphProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn('shrink-0', className)}
      fill="none"
      height={size}
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5.99935 2.66699L4.66602 13.3337M11.3327 2.66699L9.99935 13.3337M2.66602 5.33366H13.3327M13.3327 10.667H2.66602"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Private channel: hashtag with a padlock (june-onsite) (exact Figma vector). */
export function IconHashtagLock({
  size = 16,
  className,
  ...props
}: GlyphProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn('shrink-0', className)}
      fill="none"
      height={size}
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5.83333 2.5L4.5 13.5M11.5 2.5L11.1667 5.25L11 6.625M2.5 5.16667H13.5M2.5 10.8333H5.25H6.625"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.16797 11.6667C9.16797 11.2985 9.46644 11 9.83464 11H12.8346C13.2028 11 13.5013 11.2985 13.5013 11.6667V13.3333C13.5013 13.7015 13.2028 14 12.8346 14H9.83464C9.46644 14 9.16797 13.7015 9.16797 13.3333V11.6667Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path
        d="M9.83203 10.5C9.83203 9.6716 10.5036 9 11.332 9C12.1604 9 12.832 9.6716 12.832 10.5C12.832 10.7761 12.6082 11 12.332 11H10.332C10.0559 11 9.83203 10.7761 9.83203 10.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Call / phone handset, filled (exact Figma vector). */
export function IconCall({ size = 16, className, ...props }: GlyphProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn('shrink-0', className)}
      fill="none"
      height={size}
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3.15771 2C2.52877 2 1.98105 2.51065 2.01159 3.17934C2.09432 4.99059 2.61085 6.77313 3.52354 8.34627C4.51601 10.0569 5.9429 11.4837 7.6535 12.4762C9.2413 13.3974 11.0013 13.8831 12.8062 13.9813C13.4783 14.0178 13.9998 13.4699 13.9998 12.8333V10.4988C13.9998 9.98127 13.6588 9.5256 13.1623 9.37953L11.1961 8.80127C10.7783 8.6784 10.3268 8.7984 10.0252 9.1126L9.4403 9.72187C9.3851 9.7794 9.31663 9.77927 9.27703 9.75653C8.0161 9.03353 6.96623 7.98367 6.2432 6.72273C6.2205 6.6832 6.22037 6.61466 6.27789 6.55945L6.88723 5.97451C7.20136 5.67293 7.32136 5.22148 7.19849 4.8037L6.6202 2.83747C6.47417 2.34096 6.01849 2 5.50094 2H3.15771Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Folder (exact Figma vector). */
export function IconFolder({ size = 16, className, ...props }: GlyphProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn('shrink-0', className)}
      fill="none"
      height={size}
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6.35886 2.5H2.50004C2.13185 2.5 1.83337 2.79848 1.83337 3.16667V12.1667C1.83337 12.5349 2.13185 12.8333 2.50004 12.8333H13.5C13.8682 12.8333 14.1667 12.5349 14.1667 12.1667V4.5C14.1667 4.13181 13.8682 3.83333 13.5 3.83333H8.27084C8.09717 3.83333 7.93037 3.76558 7.80597 3.64449L6.82377 2.68885C6.69931 2.56775 6.53251 2.5 6.35886 2.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.83337 8.5V7.5C1.83337 6.94773 2.28109 6.5 2.83337 6.5H13.1667C13.719 6.5 14.1667 6.94773 14.1667 7.5V8.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Horizontal three-dot menu affordance (exact Figma centers). */
export function IconDotsHorizontal({
  size = 14,
  className,
  ...props
}: GlyphProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn('shrink-0', className)}
      fill="currentColor"
      height={size}
      viewBox="0 0 14 14"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="2.084" cy="6.669" r="0.97" />
      <circle cx="6.669" cy="6.669" r="0.97" />
      <circle cx="11.252" cy="6.669" r="0.97" />
    </svg>
  )
}

/** "Checked codebase" tool marker - a code panel (exact Figma vector). */
export function IconCodeInsert({ size = 16, className, ...props }: GlyphProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn('shrink-0', className)}
      fill="none"
      height={size}
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.83337 3.16675H2.50004C2.13185 3.16675 1.83337 3.46523 1.83337 3.83341V12.1667C1.83337 12.5349 2.13185 12.8334 2.50004 12.8334H8.83337M10.8303 3.16675H13.497C13.8652 3.16675 14.1636 3.46523 14.1636 3.83341V12.1667C14.1636 12.5349 13.8652 12.8334 13.497 12.8334H10.8303M10.8303 3.16675V1.66675M10.8303 3.16675V12.8334M10.8303 12.8334V14.3334M5.66671 6.33341L7.33337 8.00008L5.66671 9.66675"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Linear logo mark (exact path, brand blue). */
export function LinearMark({ size = 16, className, ...props }: GlyphProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn('shrink-0', className)}
      fill="#2563eb"
      height={size}
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M1.497 9.536c-.03-.126.121-.206.213-.114l4.868 4.868c.092.092.012.243-.114.213A6.675 6.675 0 0 1 1.497 9.536ZM1.334 7.585a.144.144 0 0 0 .039.101l6.941 6.942a.144.144 0 0 0 .101.038c.316-.02.626-.061.928-.123.102-.021.137-.146.064-.22L1.677 6.593c-.074-.073-.199-.038-.22.064-.062.302-.104.612-.123.928ZM1.895 5.294a.144.144 0 0 0 .028.146l8.637 8.637a.144.144 0 0 0 .146.028c.238-.106.469-.226.692-.358a.144.144 0 0 0 .024-.226L2.458 4.578a.144.144 0 0 0-.225.024c-.132.223-.252.454-.338.692ZM3.022 3.743a.144.144 0 0 1-.007-.18A6.654 6.654 0 0 1 7.994 1.333a6.673 6.673 0 0 1 6.673 6.673 6.654 6.654 0 0 1-2.23 4.978.144.144 0 0 1-.18-.006L3.022 3.743Z" />
    </svg>
  )
}
