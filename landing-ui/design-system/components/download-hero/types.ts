import type { ComponentPropsWithRef, ReactNode } from 'react'

/** Center tile border treatment. */
export type TileVariant = 'simple' | '3d'

export interface DownloadHeroProps
  // Override the native `title` (the tooltip string attribute) with the heading.
  extends Omit<ComponentPropsWithRef<'section'>, 'title'> {
  /** Headline, rendered as a `Hero` `<h1>`. @default 'Download Ando' */
  title?: ReactNode
  /** Supporting line under the title, rendered as a `Lead`. @default the platforms line */
  subtitle?: ReactNode
  /** The download control; any node (consumer owns onClick/render). @default the "Download for Mac" button */
  action?: ReactNode
  /** Center tile border: a flat 1px border (`simple`) or the layered frame (`3d`). @default 'simple' */
  variant?: TileVariant
  /** Show the dot-matrix grid texture inside the center tile. @default false */
  grid?: boolean
  /** Show the white gradient stroke around the logomark. @default false */
  logoStroke?: boolean
}
