import type { ComponentPropsWithRef, ReactNode } from 'react'

import type { SurfaceProps } from '#components/surface'
import type { TextProps } from '#components/text'

/**
 * Layout axis for the card's direct children:
 * - `vertical` (default): sections stack top-to-bottom (the desktop platform cards).
 * - `horizontal`: a content column sits beside a `DownloadCard.Media` panel (the mobile app cards).
 */
export const DownloadCardOrientation = {
  Vertical: 'vertical',
  Horizontal: 'horizontal',
} as const

export type DownloadCardOrientation =
  (typeof DownloadCardOrientation)[keyof typeof DownloadCardOrientation]

/**
 * DownloadCard root. Extends `SurfaceProps`, so `variant`/`radius` (and the `div` props
 * and `ref`) stay in lockstep with `Surface` - defaulting to the brand card:
 * `outlined` + 24px `md` radius. `overflow-hidden` is always applied so a
 * bleeding `DownloadCard.Media` clips to the rounded corners.
 */
export type DownloadCardProps = SurfaceProps & {
  /** Direction of the card's direct children. @default 'vertical' */
  orientation?: DownloadCardOrientation
}

/**
 * DownloadCard header: an optional leading `icon`, the title/description block (children),
 * and an optional trailing `action`. The action pins to the right of the title row
 * (the desktop "MacOS … Download" pattern); omit it and place the action in a
 * `DownloadCard.Footer` below for the stacked mobile layout.
 */
export type DownloadCardHeaderProps = ComponentPropsWithRef<'div'> & {
  /** Leading visual (e.g. a platform `Icon`), rendered at 24px in the tertiary tier. */
  icon?: ReactNode
  /** Trailing action pinned to the title row (e.g. a `Button` or `Badge`). */
  action?: ReactNode
}

/** DownloadCard title. Wraps `Text` with card-title defaults; renders an `<h3>` by default. */
export type DownloadCardTitleProps = TextProps
