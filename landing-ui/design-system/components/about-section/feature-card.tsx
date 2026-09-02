'use client'

import { useEffect, useRef, useState } from 'react'

import { Text, TextColor, TextFont, TextSize } from '#components/text'
import { cn } from '#lib/cn'
import type { FeatureCardProps } from './types'

// The previews are authored for the desktop card width: their text wraps and
// their height settles at the design layout while the column is at least this
// wide (content-box px). Narrower than this the mockups reflow taller and
// collide with the bottom caption, so below this width we lock the preview's
// layout and scale it down to fit instead of letting it re-wrap. Measured from
// the design: every mockup holds its settled height down to ~354px, and the
// native large-monitor column is ~376px - so 360 leaves every size at/above a
// laptop transform-free and only scales the cramped sub-laptop band.
const PREVIEW_DESIGN_WIDTH = 360

/**
 * FeatureCard - the shell shared by all three About columns.
 *
 * The preview slot is absolutely positioned near the top and the caption sits in
 * normal flow, pinned to the bottom by the card's `justify-end`. A vertical
 * white gradient ("fade") paints between them, dissolving the preview's lower
 * edge into the surface so the mockup reads as fading out behind the copy -
 * matching the source frames. `overflow-hidden` clips previews that run past the
 * card; `isolate` keeps the highlighted card's inner ring scoped to the card.
 *
 * Mobile: the two non-highlighted cards collapse to a caption-only strip (no
 * preview, copy pinned to the top) at a fixed short height so the spotlight's
 * height change can animate as it moves between cards; the highlighted card
 * keeps its preview + blue ring at a taller height. From `md` up every card
 * shows its preview at the full desktop heights.
 */
export function FeatureCard({
  heading,
  description,
  highlighted = false,
  children,
  className,
  ...props
}: FeatureCardProps) {
  // Scale the preview down (rather than let it re-wrap) once the column is
  // narrower than the design width. All three columns share a width, but each
  // card measures its own preview window so the shell stays self-contained.
  const previewWindowRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1)

  useEffect(() => {
    const el = previewWindowRef.current
    if (!el) return
    // Only the md+ three-column layout scales; mobile keeps its own sizing.
    const desktop = window.matchMedia('(min-width: 768px)')
    const measure = () => {
      const width = el.clientWidth
      setPreviewScale(
        desktop.matches && width > 0 && width < PREVIEW_DESIGN_WIDTH
          ? width / PREVIEW_DESIGN_WIDTH
          : 1,
      )
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    desktop.addEventListener('change', measure)
    return () => {
      observer.disconnect()
      desktop.removeEventListener('change', measure)
    }
  }, [])

  const scaled = previewScale < 1

  return (
    <div
      className={cn(
        // Card surface: a faint top-to-white vertical wash (per the source frame).
        // Mobile pads 24px (`p-6`) so the larger collapsed-card text has room;
        // desktop pads 32px.
        // Non-highlighted cards pin their caption to the top on mobile (no
        // preview), so default to `justify-start` and switch to `justify-end`
        // from `md` up; the highlighted card keeps `justify-end` everywhere.
        'focus-ring relative isolate flex cursor-pointer touch-manipulation flex-col overflow-hidden rounded-3xl bg-[linear-gradient(180deg,#fcfcfc_60%,#ffffff_70%)] p-6 md:justify-end md:p-8',
        // The highlight moves between cards to mark the active animation, so the
        // treatment animates: height, border colour and the inset glow all
        // transition as the spotlight moves. The duration lives on each state so
        // growing into the spotlight (`duration-300`) reads a touch slower than
        // shrinking back out (`duration-200`).
        'transition-[height,border-color,box-shadow] ease-out motion-reduce:transition-none',
        // The focused card's blue (#51a6f5 border + glow) is back-solved from
        // the source frame: the neutral brand palette has no blue/focus token,
        // so this accent is an intentional literal (cf. believer-card's #F5F5F5).
        // The glow is an `inset` shadow ON THE CARD so it follows the border's
        // inner curve exactly - a separate inset-0 overlay would round at the
        // outer 24px radius and leave a mismatched sliver at the corners.
        highlighted
          ? 'h-[520px] justify-end border-2 border-[#51a6f5] shadow-[inset_0_0_0_4px_rgba(81,166,245,0.25)] duration-300 md:h-[512px]'
          : 'h-[168px] justify-start border border-border-subtle duration-200 md:h-[480px]',
        className,
      )}
      {...props}
    >
      {/*
        Product-UI preview, pinned near the top, spanning the content width.
        Mobile shows it only on the highlighted card (the source frame drops the
        preview from the two side cards); from `md` up every card shows it.
        `aria-hidden` (not `inert`): the mockups are decorative real controls
        (switches, menus, buttons), so drop them from the a11y tree only - cursor
        and keyboard interaction stay live, but SR users don't hit fake widgets.
      */}
      <div
        aria-hidden
        ref={previewWindowRef}
        className={cn(
          'absolute inset-x-6 top-6 md:inset-x-8 md:top-12',
          highlighted ? 'block' : 'hidden md:block',
        )}
      >
        {/*
          At/above the design width this is a plain full-width block (the mockup
          reflows to fill, as designed). Below it we pin the mockup to the design
          width and scale it from the top-left so it shrinks in place instead of
          re-wrapping into the caption.
        */}
        <div
          style={
            scaled
              ? {
                  width: PREVIEW_DESIGN_WIDTH,
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                }
              : undefined
          }
        >
          {children}
        </div>
      </div>

      {/*
        Fade: preview stays crisp up top, then dissolves into the surface. Inset
        horizontally so it covers the preview but never the focused card's edge
        glow. Anchored to the card's bottom padding (`bottom-6`/`bottom-8`) rather
        than a fixed height so it SCALES with the card - a fixed height lags
        behind while the card grows into the spotlight and momentarily paints
        over the rising bottom edge of the glow. Hidden on mobile wherever the
        preview is (matching the preview's visibility).
      */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-4 top-0 bottom-6 bg-gradient-to-b from-transparent from-[68%] via-white via-[84%] to-white md:bottom-8 md:from-[60%] md:via-[70%]',
          highlighted ? 'block' : 'hidden md:block',
        )}
      />

      {/*
        Caption, pinned to the bottom. On mobile it stays transparent so the
        collapsed cards do not show a rectangular white panel behind the text.
        From `md` up, the opaque surface fill sits ON TOP of the preview (it
        spans the same content width), so a tall preview can never bleed through
        behind the copy - it is the hard floor the fade resolves into. Kept to
        the content width (not the card edges) so the focused card's edge glow
        stays visible in the padding.
      */}
      <div className="relative flex flex-col gap-2 md:gap-4 md:bg-surface-primary">
        <Text
          as="h3"
          className="leading-[1.2]"
          color={TextColor.Primary}
          font={TextFont.Display}
          // Mobile collapsed + highlighted cards are 20px per feedback; the
          // full 24px lands from `lg` up where `zoom` also kicks in, so the
          // heading doesn't jump bigger as the row narrows.
          size={{
            base: TextSize.XL,
            md: TextSize.XL,
            lg: TextSize.XXL,
          }}
        >
          {heading}
        </Text>
        <Text
          className="leading-[1.5]"
          color={TextColor.Tertiary}
          // 14px mobile/body in the cramped md band, 16px from `lg` up.
          size={{
            base: TextSize.Small,
            md: TextSize.Small,
            lg: TextSize.Medium,
          }}
        >
          {description}
        </Text>
      </div>
    </div>
  )
}

FeatureCard.displayName = 'FeatureCard'
