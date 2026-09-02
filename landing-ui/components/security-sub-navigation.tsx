'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { Text, TextSize } from '@repo/design-system-ui/text'

const SECURITY_LINKS = [
  { href: '/security', id: 'overview', label: 'Overview' },
  {
    href: '/security/terms-of-service',
    id: 'terms-of-service',
    label: 'Terms of service',
  },
  {
    href: '/security/privacy-policy',
    id: 'privacy-policy',
    label: 'Privacy policy',
  },
  {
    href: '/security/sub-processors',
    id: 'sub-processors',
    label: 'Sub-processors',
  },
] as const

/** Which `/security/*` page is currently active (matches the route slug). */
type SecurityPage =
  | 'overview'
  | 'terms-of-service'
  | 'privacy-policy'
  | 'sub-processors'

/**
 * Compact editorial index shared across the `/security/*` pages. The active
 * page is indicated by text color and one baseline rule; the row scrolls on
 * narrow screens so every destination remains reachable.
 */
export function SecuritySubNavigation({ active }: { active: SecurityPage }) {
  const activeLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const activeHref =
      active === 'overview' ? '/security' : `/security/${active}`
    if (activeLinkRef.current?.getAttribute('href') !== activeHref) {
      return
    }
    activeLinkRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    })
  }, [active])

  return (
    <div className="border-border-subtle border-b">
      <div className="content-frame overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex h-11 min-w-max items-stretch">
          <Text
            as="span"
            className="mr-8 flex items-center"
            size={TextSize.Small}
            weight="medium"
          >
            Security
          </Text>
          <nav aria-label="Security" className="flex items-stretch gap-7">
            {SECURITY_LINKS.map((link) => {
              const isActive = active === link.id
              return (
                <Link
                  aria-current={isActive ? 'page' : undefined}
                  className={`focus-ring relative flex items-center text-size-sm transition-colors ${
                    isActive
                      ? 'text-text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border-active'
                      : 'text-text-tertiary hover:text-text-primary'
                  }`}
                  href={link.href}
                  key={link.id}
                  ref={isActive ? activeLinkRef : undefined}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
