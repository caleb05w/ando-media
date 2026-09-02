'use client'

import { useRef } from 'react'

import { Button, ButtonSize, ButtonVariant } from '#components/button'
import { Hotkey } from '#components/hotkey'
import {
  DOWNLOAD_URLS,
  heroDownloadTarget,
  PLATFORMS_SECTION_ID,
  usePlatform,
} from '#lib/download'
import { useHotkeys } from '#lib/use-hotkeys'

/**
 * The hero's primary CTA. Mobile viewports link directly to the App Store.
 * Desktop renders "Download for Mac" (arm64) on the server, then after mount
 * retargets to the visitor's OS or scrolls to the platform list when no direct
 * installer is available.
 */
export function DownloadButton() {
  const { platform, appleSilicon } = usePlatform()
  const { href, label } = heroDownloadTarget(platform, appleSilicon)
  const ref = useRef<HTMLButtonElement>(null)

  // ⌘/Ctrl+D activates the CTA via a real click, so it downloads or scrolls.
  useHotkeys([{ handler: () => ref.current?.click(), key: 'd', mod: true }])

  return (
    <>
      <Button
        className="rounded-none md:hidden"
        render={(props) => <a {...props} href={DOWNLOAD_URLS.ios} />}
        size={ButtonSize.Medium}
        variant={ButtonVariant.Secondary}
      >
        Download from App Store
      </Button>
      <Button
        aria-keyshortcuts="Meta+D Control+D"
        className="hidden rounded-none md:inline-flex"
        onClick={
          href
            ? undefined
            : () =>
                document
                  .getElementById(PLATFORMS_SECTION_ID)
                  ?.scrollIntoView({ behavior: 'smooth' })
        }
        ref={ref}
        render={href ? (props) => <a {...props} href={href} /> : undefined}
        rightSection={
          <Hotkey.Group aria-hidden>
            <Hotkey tone="default">⌘</Hotkey>
            <Hotkey tone="default">D</Hotkey>
          </Hotkey.Group>
        }
        size={ButtonSize.Large}
        variant={ButtonVariant.Secondary}
      >
        {label}
      </Button>
    </>
  )
}

DownloadButton.displayName = 'DownloadButton'
