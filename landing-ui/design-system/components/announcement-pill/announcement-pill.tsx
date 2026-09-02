'use client'

import { useRender } from '@base-ui/react/use-render'

import { IconChevronRightMedium } from '#components/icon'
import { Text, TextSize } from '#components/text'
import { cn, cva } from '#lib/cn'

/** Styles for the clickable "Read about us on New Ontologies" hero lozenge. */
export const announcementPillVariants = cva([
  // ~30px pill on mobile (8px padding), ~37px on desktop (16px x / 8px y, gap-8
  // to match Figma frame 2147256298); `group` drives the chevron hover.
  'group inline-flex items-center justify-center gap-1 rounded-full p-2 lg:gap-2 lg:px-4',
  'cursor-pointer select-none no-underline',
  // Subtle black-alpha gradient (2% -> 4%).
  'bg-gradient-to-b from-opacity-2 to-opacity-4',
  // Lifted hairline ring: white halo + black-4% (no single border token matches).
  'shadow-[0_0_0_1px_var(--color-tonal-10),0_0_0_2px_var(--color-opacity-4)]',
  'overflow-clip',
  'text-text-secondary hover:text-text-primary',
  // Scope to `color`: `transition-colors` would also animate the focus-ring outline.
  'transition-[color] duration-150 ease-[ease] motion-reduce:transition-none',
  'focus-ring',
])

/** Anchor props plus Base UI's `render` (to swap in e.g. a routing `Link`). */
export type AnnouncementPillProps = useRender.ComponentProps<'a'>

/**
 * Clickable announcement lozenge from the Home hero. Renders a semantic `<a>`
 * (pass `href`); for client-side nav pass `render={<NextLink href="/blog" />}`.
 * Pass the label as `children` - children on the `render` element would replace
 * the composed label + chevron.
 */
export function AnnouncementPill({
  className,
  children,
  render,
  ref,
  ...props
}: AnnouncementPillProps) {
  return useRender({
    defaultTagName: 'a',
    ref,
    render,
    props: {
      ...props,
      className: cn(announcementPillVariants(), className),
      children: (
        <>
          {/* leading trims the line-height to Figma per breakpoint: mobile xs
              (12px) -> ~14px line (-> ~30px pill), desktop md (16px) -> 20px line
              (-> ~37px pill). `px-1` pads the mobile gap; desktop drops it
              (`lg:px-0`) so the 8px text->arrow gap comes from `lg:gap-2`. */}
          <Text
            as="span"
            className="px-1 leading-3.5 lg:px-0 lg:leading-5"
            color="inherit"
            size={{ base: TextSize.XS, lg: TextSize.Medium }}
          >
            {children}
          </Text>
          {/* CSS size overrides the SVG's 20px attrs: 14px mobile, 18px desktop. */}
          <IconChevronRightMedium className="size-3.5 shrink-0 transition-transform duration-150 ease-[ease] group-hover:translate-x-0.5 motion-reduce:transition-none lg:size-[18px]" />
        </>
      ),
    },
  })
}

AnnouncementPill.displayName = 'AnnouncementPill'
