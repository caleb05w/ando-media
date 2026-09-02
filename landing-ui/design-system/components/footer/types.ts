import type { useRender } from '@base-ui/react/use-render'
import type { ComponentPropsWithRef, ReactNode } from 'react'

import type { FooterDotFieldProps } from './dot-field'
import type { FooterWatermarkProps } from './watermark'
import type { FooterWatermarkShadowHoverProps } from './watermark-shadow-hover'

export interface FooterProps extends ComponentPropsWithRef<'footer'> {
  /** Background tone. `'default'`: #fafaf8 section surface. `'white'`: #ffffff. @default 'default' */
  variant?: 'default' | 'white'
  /** Use the tighter site-footer spacing without changing footer content. @default false */
  compact?: boolean
}

export type FooterTopProps = ComponentPropsWithRef<'div'>

export interface FooterBrandProps extends useRender.ComponentProps<'a'> {
  /** Destination for the brand home link. @default '/' */
  href?: string
}

export interface FooterColumnsProps
  extends Omit<ComponentPropsWithRef<'nav'>, 'aria-label'> {
  /** Accessible label for the `<nav>` landmark. @default 'Footer' */
  label?: string
}

export interface FooterColumnProps
  extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Muted column heading (e.g. "Company"); rendered as an `<h3>`. */
  title: ReactNode
}

export interface FooterLinkProps extends useRender.ComponentProps<'a'> {
  /** Open in a new tab with a safe `rel`. Use for off-site links. */
  external?: boolean
}

export interface FooterLegalProps extends ComponentPropsWithRef<'div'> {
  /** Optional trailing slot (e.g. a trust badge); right-aligned from `@2xl`. */
  trailing?: ReactNode
}

/**
 * The top graphic slot at the footer's head. Holds a graphic like
 * `Footer.DotField` (the interactive dot-field wordmark), spaced from the
 * content by the footer's own flex gap.
 */
export type FooterBannerProps = ComponentPropsWithRef<'div'>

/**
 * The compound graphics slot at the footer's bottom. Stack graphics inside it -
 * the static `Footer.Watermark` svg and, optionally, the interactive
 * `Footer.WatermarkShadowHover` canvas (progressive enhancement over the svg).
 */
export type FooterGraphicsProps = ComponentPropsWithRef<'div'>

export interface FooterComponent {
  (props: FooterProps): ReactNode
  Top(props: FooterTopProps): ReactNode
  Brand(props: FooterBrandProps): ReactNode
  Columns(props: FooterColumnsProps): ReactNode
  Column(props: FooterColumnProps): ReactNode
  Link(props: FooterLinkProps): ReactNode
  Legal(props: FooterLegalProps): ReactNode
  Banner(props: FooterBannerProps): ReactNode
  Graphics(props: FooterGraphicsProps): ReactNode
  DotField(props: FooterDotFieldProps): ReactNode
  Watermark(props: FooterWatermarkProps): ReactNode
  WatermarkShadowHover(props: FooterWatermarkShadowHoverProps): ReactNode
}
