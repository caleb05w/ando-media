import type { Metadata } from 'next'

import { WheelStudio } from './world-wheel'

// The affiliate announcement — the wheel, archived here WITH its
// timeline studio (scrub, windows, per-beat drag, copy-state, and
// the one-click mp4 export). The production copy lives in the
// landing repo on caleb/affiliate-announcement, studio removed.
// Ported 2026-09 from new-landing-page's affiliate-world wheel.

export const metadata: Metadata = {
  title: 'The affiliate announcement · Ando',
}

export default function AffiliateAnnouncementPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-white py-16">
      <WheelStudio />
    </main>
  )
}
