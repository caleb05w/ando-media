'use client'

import { useRender } from '@base-ui/react/use-render'
import { Children, isValidElement } from 'react'

import { IconArrowRight, IconSize } from '#components/icon'
import { Text, TextColor, TextSize } from '#components/text'
import { cn, cva } from '#lib/cn'
import { FooterDotField } from './dot-field'
import type {
  FooterBannerProps,
  FooterBrandProps,
  FooterColumnProps,
  FooterColumnsProps,
  FooterComponent,
  FooterGraphicsProps,
  FooterLegalProps,
  FooterLinkProps,
  FooterProps,
  FooterTopProps,
} from './types'
import { FooterWatermark } from './watermark'
import { FooterWatermarkShadowHover } from './watermark-shadow-hover'

// Shared by the content column and watermark; also matches page/header edges.
const CONTENT_FRAME = 'content-frame'

const footerVariants = cva('@container relative isolate overflow-hidden', {
  defaultVariants: { variant: 'default' },
  variants: {
    variant: {
      default: 'bg-surface-secondary',
      white: 'bg-surface-primary',
    },
  },
})

function FooterRoot({
  className,
  children,
  compact = false,
  variant = 'default',
  ...props
}: FooterProps) {
  // The expanded bottom padding only exists to clear the bottom-pinned
  // `Footer.Graphics` watermark. Compact mode is used by the shared site
  // footer, where the content should occupy a shorter vertical band.
  const hasGraphics = Children.toArray(children).some(
    (child) => isValidElement(child) && child.type === FooterGraphics,
  )
  const spacing = compact
    ? cn(
        'gap-10 pt-12 @2xl:gap-12 @5xl:gap-14 @5xl:pt-16',
        hasGraphics ? 'pb-30 @2xl:pb-60 @5xl:pb-75' : 'pb-12 @5xl:pb-16',
      )
    : cn(
        'gap-12 pt-16 @2xl:gap-16 @5xl:gap-24 @5xl:pt-32',
        hasGraphics ? 'pb-30 @2xl:pb-60 @5xl:pb-75' : 'pb-24',
      )
  return (
    <footer className={cn(footerVariants({ variant }), className)} {...props}>
      <div className={cn('flex w-full flex-col', spacing, CONTENT_FRAME)}>
        {children}
      </div>
    </footer>
  )
}

FooterRoot.displayName = 'Footer'

function FooterTop({ className, children, ...props }: FooterTopProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-10 @5xl:flex-row @5xl:items-start @5xl:justify-between @5xl:gap-16',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

FooterTop.displayName = 'Footer.Top'

function FooterBrand({
  href = '/',
  className,
  children,
  render,
  ref,
  ...props
}: FooterBrandProps) {
  return useRender({
    defaultTagName: 'a',
    ref,
    render,
    props: {
      ...props,
      href,
      className: cn(
        'inline-flex w-fit items-center self-start rounded-lg -m-2 p-2',
        'transition-opacity duration-150 ease-[ease] hover:opacity-70 motion-reduce:transition-none',
        'focus-ring',
        className,
      ),
      children,
    },
  })
}

FooterBrand.displayName = 'Footer.Brand'

function FooterColumns({
  label = 'Footer',
  className,
  children,
  ...props
}: FooterColumnsProps) {
  return (
    <nav
      aria-label={label}
      className={cn(
        'footer-link-group grid grid-cols-1 gap-x-8 gap-y-10 @2xl:grid-cols-3 @2xl:gap-x-16',
        className,
      )}
      {...props}
    >
      {children}
    </nav>
  )
}

FooterColumns.displayName = 'Footer.Columns'

function FooterColumn({
  title,
  className,
  children,
  ...props
}: FooterColumnProps) {
  return (
    <div className={cn('flex flex-col gap-8', className)} {...props}>
      <Text
        as="h3"
        className="leading-[18px]"
        color={TextColor.Tertiary}
        size={TextSize.Small}
      >
        {title}
      </Text>
      <ul className="flex flex-col gap-6">{children}</ul>
    </div>
  )
}

FooterColumn.displayName = 'Footer.Column'

function FooterLink({
  external = false,
  className,
  children,
  render,
  ref,
  ...props
}: FooterLinkProps) {
  return (
    <li>
      {useRender({
        defaultTagName: 'a',
        ref,
        render,
        props: {
          ...props,
          rel: external ? 'noopener noreferrer' : undefined,
          target: external ? '_blank' : undefined,
          className: cn(
            'footer-link inline-flex w-fit items-center gap-1 rounded-sm text-text-primary',
            'focus-ring',
            className,
          ),
          children: (
            <>
              <Text
                as="span"
                className="leading-5"
                color={TextColor.Inherit}
                size={TextSize.Small}
              >
                {children}
              </Text>
              <IconArrowRight
                className="footer-link-arrow"
                size={IconSize.Small}
              />
              {external ? (
                <span className="sr-only"> (opens in new tab)</span>
              ) : null}
            </>
          ),
        },
      })}
    </li>
  )
}

FooterLink.displayName = 'Footer.Link'

function FooterLegal({
  trailing,
  className,
  children,
  ...props
}: FooterLegalProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 @2xl:flex-row @2xl:items-center @2xl:justify-between',
        className,
      )}
      {...props}
    >
      <Text as="p" color={TextColor.Tertiary} size={TextSize.XS}>
        {children}
      </Text>
      {trailing ? (
        <div className="flex items-center gap-4">{trailing}</div>
      ) : null}
    </div>
  )
}

FooterLegal.displayName = 'Footer.Legal'

// The top in-flow graphic slot: a content-framed banner region that sits as the
// first child of `<Footer>`. It holds a graphic like `Footer.DotField`. Unlike
// `Footer.Graphics` (the bottom watermark) it is NOT absolutely positioned - it's
// a normal flow block at the top. It is inert (aria-hidden + select-none); the
// graphic inside sizes it via its own aspect ratio.
//
// Spacing from the content: at smaller sizes the footer's own flex gap is enough;
// on desktop (@5xl) the gap below the graphic should be 128px, so `mb-8` (32px)
// tops up the @5xl `gap-24` (96px) to 128px. (Flex gaps and item margins add.)
function FooterBanner({ className, children, ...props }: FooterBannerProps) {
  return (
    <div
      aria-hidden
      className={cn('relative w-full select-none @5xl:mb-8', className)}
      {...props}
    >
      {children}
    </div>
  )
}

FooterBanner.displayName = 'Footer.Banner'

// The compound graphics slot: an absolutely-positioned, content-framed layer
// pinned to the footer's bottom (behind the content via `-z-10`, inert to
// pointers + selection). It owns the positioning so the graphics inside stay
// pure visuals - stack the static `Footer.Watermark` svg and, optionally, the
// interactive `Footer.WatermarkShadowHover` canvas on top of it. The svg sizes the
// slot; the shadow canvas fills it via `absolute inset-0`.
function FooterGraphics({
  className,
  children,
  ...props
}: FooterGraphicsProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 -z-10 w-full select-none',
        CONTENT_FRAME,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

FooterGraphics.displayName = 'Footer.Graphics'

export const Footer: FooterComponent = Object.assign(FooterRoot, {
  Top: FooterTop,
  Brand: FooterBrand,
  Columns: FooterColumns,
  Column: FooterColumn,
  Link: FooterLink,
  Legal: FooterLegal,
  Banner: FooterBanner,
  Graphics: FooterGraphics,
  DotField: FooterDotField,
  Watermark: FooterWatermark,
  WatermarkShadowHover: FooterWatermarkShadowHover,
})
