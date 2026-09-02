'use client'

import { NavigationMenu as BaseNavigationMenu } from '@base-ui/react/navigation-menu'
import { Children, isValidElement } from 'react'

import { Surface } from '#components/surface'
import { Text } from '#components/text'
import { cn } from '#lib/cn'
import type {
  SubNavigationComponent,
  SubNavigationLinkProps,
  SubNavigationProps,
  SubNavigationSectionProps,
} from './types'

/**
 * A 57px section sub-nav bar: a `Section` title beside packed `Link`s, divided
 * from the page by a hairline border. The title is split from the links so the
 * links sit in their own base-ui `NavigationMenu` (arrow-key navigable, like
 * the header `Navigation.Menu`); `gap-6` sets the title off from them.
 */
function SubNavigationRoot({
  children,
  className,
  label = 'Section',
}: SubNavigationProps) {
  const items = Children.toArray(children)
  const section = items.filter(
    (child) => isValidElement(child) && child.type === SubNavigationSection,
  )
  const links = items.filter(
    (child) => isValidElement(child) && child.type === SubNavigationLink,
  )
  return (
    <Surface
      // Full-bleed background + hairline border that divide the page edge-to-edge.
      className="border-border-default border-y-[0.5px]"
      radius="none"
      variant="subtle"
    >
      {/* 57px content bar (py-2 + the 41px link rows), centered and capped at the
          1728px design width on wider screens - consistent with Navigation/Footer. */}
      <div
        className={cn(
          'content-frame flex items-baseline gap-6 py-2',
          className,
        )}
      >
        {section}
        <BaseNavigationMenu.Root aria-label={label} className="shrink-0">
          <BaseNavigationMenu.List className="flex items-center">
            {links}
          </BaseNavigationMenu.List>
        </BaseNavigationMenu.Root>
      </div>
    </Surface>
  )
}

SubNavigationRoot.displayName = 'SubNavigation'

/** Section title for the sub-nav bar (e.g. "About Ando"). */
function SubNavigationSection({
  className,
  children,
}: SubNavigationSectionProps) {
  return (
    <Text as="span" className={className} size="lg" weight="medium">
      {children}
    </Text>
  )
}

SubNavigationSection.displayName = 'SubNavigation.Section'

/** A single packed link in the sub-nav bar. */
function SubNavigationLink({
  active = false,
  className,
  children,
  ...props
}: SubNavigationLinkProps) {
  return (
    <BaseNavigationMenu.Item>
      <BaseNavigationMenu.Link
        active={active}
        aria-current={active ? 'page' : undefined}
        className={cn(
          // `px-5 py-2.5` matches Figma; the list has no gap so the links pack
          // against their neighbours.
          'flex items-center justify-center rounded-lg px-5 py-2.5',
          'text-text-tertiary transition-[color] duration-150 ease-[ease] hover:text-text-primary motion-reduce:transition-none',
          active && 'text-text-primary',
          'focus-ring',
          className,
        )}
        {...props}
      >
        {/* Tighten the md line-height 24px -> 21px so the row is 41px (py-2.5 +
            21) and the bar lands at 57px. */}
        <Text
          as="span"
          className="leading-[21px]"
          color="inherit"
          font="sans"
          size="md"
          weight="regular"
        >
          {children}
        </Text>
      </BaseNavigationMenu.Link>
    </BaseNavigationMenu.Item>
  )
}

SubNavigationLink.displayName = 'SubNavigation.Link'

/** Section sub-nav bar. See `SubNavigationProps` and the part exports. */
export const SubNavigation: SubNavigationComponent = Object.assign(
  SubNavigationRoot,
  {
    Section: SubNavigationSection,
    Link: SubNavigationLink,
  },
)
