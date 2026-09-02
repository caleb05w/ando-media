'use client'

import { usePathname } from 'next/navigation'

import { Logo } from '@repo/design-system-ui/logo'
import { Navigation } from '@repo/design-system-ui/navigation'

import { HeaderGetAccess } from './header-get-access'
import { useLogoContextMenu } from './logo-context-menu'

/** The site-wide top navigation (brand, links, CTA, mobile menu), shared across pages. */
export function SiteNavigation({
  referralCode,
}: {
  referralCode?: string
} = {}) {
  const pathname = usePathname()
  const logoContextMenu = useLogoContextMenu()
  const aboutActive = pathname === '/about' || pathname.startsWith('/about/')

  return (
    <Navigation>
      <Navigation.Brand
        aria-label="Ando, home"
        onContextMenu={logoContextMenu.onContextMenu}
        ref={logoContextMenu.rootRef}
      >
        <Logo />
      </Navigation.Brand>
      {logoContextMenu.menuNode}
      <Navigation.Menu>
        <Navigation.Link active={aboutActive} href="/about">
          About
        </Navigation.Link>
        {/* Blog hidden for now */}
        <Navigation.Link
          href="https://jobs.ashbyhq.com/ando"
          rel="noopener noreferrer"
          target="_blank"
        >
          Careers
        </Navigation.Link>
        {/* <Navigation.Link href="/blog">Blog</Navigation.Link> */}
      </Navigation.Menu>
      <Navigation.Cta>
        <HeaderGetAccess referralCode={referralCode} />
        <Navigation.Toggle />
      </Navigation.Cta>
      <Navigation.MobileMenu>
        <Navigation.MobileGroup title="Company">
          <Navigation.MobileLink active={aboutActive} href="/about">
            About
          </Navigation.MobileLink>
          {/* Blog hidden for now */}
          <Navigation.MobileLink
            href="https://jobs.ashbyhq.com/ando"
            rel="noopener noreferrer"
            target="_blank"
          >
            Careers
          </Navigation.MobileLink>
          {/* <Navigation.MobileLink href="/blog">Blog</Navigation.MobileLink> */}
        </Navigation.MobileGroup>
        <Navigation.MobileGroup title="Socials">
          <Navigation.MobileLink href="https://www.linkedin.com/company/andohq/">
            LinkedIn
          </Navigation.MobileLink>
          <Navigation.MobileLink href="https://x.com/andocorporation">
            Twitter / X
          </Navigation.MobileLink>
        </Navigation.MobileGroup>
      </Navigation.MobileMenu>
    </Navigation>
  )
}
