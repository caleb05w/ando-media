'use client'

import { Footer } from '@repo/design-system-ui/footer'
import { Logo } from '@repo/design-system-ui/logo'

import { useLogoContextMenu } from './logo-context-menu'

/** The compact site-wide footer shared by every public page. */
export function SiteFooter() {
  const desktopLogoContextMenu = useLogoContextMenu()
  const mobileLogoContextMenu = useLogoContextMenu()

  return (
    <Footer compact variant="white">
      <Footer.Top className="gap-8 @5xl:gap-12">
        {/*
          Brand mark placement is breakpoint-specific (see the Figma frames):
          on desktop (@5xl) it sits at the top-left of this row, beside the link
          columns; on mobile it drops down onto the copyright row (below the
          columns). Those two arrangements pair the logo with different
          neighbours, so a single element cannot occupy both via `order` alone -
          we render the mark in each position and reveal only the one that
          applies at the current width (the other is `display:none`, so it is out
          of the tab order).
        */}
        <Footer.Brand
          aria-label="Ando, home"
          className="hidden @5xl:inline-flex"
          onContextMenu={desktopLogoContextMenu.onContextMenu}
          ref={desktopLogoContextMenu.rootRef}
        >
          <Logo size={32} variant="mark" />
        </Footer.Brand>
        {desktopLogoContextMenu.menuNode}
        <Footer.Columns className="gap-y-8 @2xl:gap-x-12">
          <Footer.Column className="gap-4 [&>ul]:gap-3" title="Social">
            <Footer.Link
              href="https://www.linkedin.com/company/andohq/"
              external
            >
              Linkedin
            </Footer.Link>
            <Footer.Link href="https://x.com/andocorporation" external>
              Twitter / X
            </Footer.Link>
          </Footer.Column>
          <Footer.Column className="gap-4 [&>ul]:gap-3" title="Company">
            <Footer.Link href="/about">About</Footer.Link>
            <Footer.Link href="/waitlist">Waitlist</Footer.Link>
            <Footer.Link href="https://jobs.ashbyhq.com/ando" external>
              Careers
            </Footer.Link>
          </Footer.Column>
          <Footer.Column className="gap-4 [&>ul]:gap-3" title="Info">
            <Footer.Link href="/security">Security</Footer.Link>
            <Footer.Link href="/security/terms-of-service">
              Terms of service
            </Footer.Link>
            <Footer.Link href="/security/privacy-policy">
              Privacy policy
            </Footer.Link>
            <Footer.Link href="/security/sub-processors">
              Sub-processors
            </Footer.Link>
          </Footer.Column>
        </Footer.Columns>
      </Footer.Top>
      {/*
        Below desktop (@5xl) the brand mark shares a row with the copyright
        (logo left, copyright right - see the mobile Figma frame). At @5xl this
        wrapper collapses to a plain block so the copyright keeps its original
        bottom-left position and the mark up top owns the brand slot.
      */}
      <div className="flex items-center justify-between @5xl:block">
        <Footer.Brand
          aria-label="Ando, home"
          className="@5xl:hidden"
          onContextMenu={mobileLogoContextMenu.onContextMenu}
          ref={mobileLogoContextMenu.rootRef}
        >
          <Logo size={32} variant="mark" />
        </Footer.Brand>
        {mobileLogoContextMenu.menuNode}
        <Footer.Legal>© 2026 Asari Inc.</Footer.Legal>
      </div>
    </Footer>
  )
}
