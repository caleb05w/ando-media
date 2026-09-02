import type { Metadata } from 'next'

import { DownloadHero } from '@repo/design-system-ui/download-hero'
import { DownloadPlatforms } from '@repo/design-system-ui/download-platforms'

import { SiteFooter } from '@/components/site-footer'
import { SiteNavigation } from '@/components/site-navigation'

export const metadata: Metadata = {
  title: { absolute: 'Download Ando' },
  description:
    'Get the Ando app for macOS, Windows, iOS, and Android - your company’s context, on every device.',
}

/** The /download route: shared site chrome around the Download sections. */
export default function DownloadPage() {
  return (
    <>
      <SiteNavigation />
      <main id="main-content">
        <DownloadHero />
        <DownloadPlatforms />
      </main>
      <SiteFooter />
    </>
  )
}
