import type { ComponentPropsWithRef, ReactNode } from 'react'

/** A single entry in a {@link TableOfContents}. */
export interface TableOfContentsItem {
  /** Id of the section element this links to; the link points at `#${id}`. */
  id: string
  /** Visible label for the link. */
  label: ReactNode
}

export interface TableOfContentsProps
  extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  /** Section links, in document order. */
  items: TableOfContentsItem[]
  /**
   * Small overline above the list (e.g. "On this page"). When set it also names
   * the `<nav>` landmark; otherwise pass `aria-label`.
   */
  label?: ReactNode
  /**
   * Controlled active section id. Omit to let the built-in scroll-spy track it;
   * pass `null` for "no active section".
   */
  activeId?: string | null
  /** Fires when the scroll-spy detects a new active section (uncontrolled only). */
  onActiveChange?: (id: string | null) => void
  /**
   * `rootMargin` for the scroll-spy activation band.
   * @default '-80px 0px 0px 0px'
   */
  rootMargin?: string
  /**
   * Width of each link (and therefore its hover/active highlight). `'full'`
   * spans the rail; `'fit'` hugs the label, capped at the rail width.
   * @default 'full'
   */
  linkWidth?: 'full' | 'fit'
}
