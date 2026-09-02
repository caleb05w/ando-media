'use client'

import type { ReactNode } from 'react'

import { Button, ButtonSize, ButtonVariant } from '#components/button'
import { IconAndroid, IconApple, IconWindows } from '#components/icon'
import { Popover, PopoverRadius } from '#components/popover'
import { Text, TextSize } from '#components/text'
import { cn } from '#lib/cn'
import { DOWNLOAD_URLS, PLATFORMS_SECTION_ID } from '#lib/download'
import { qrCode } from '../download-card/media/qr-code'
import type { DownloadPlatformsProps } from './types'

/** Flat platform rows keep the download choice legible without card chrome. */
export function DownloadPlatforms({
  className,
  ref,
  ...props
}: DownloadPlatformsProps) {
  return (
    <section
      className={cn('content-frame pb-20 md:pb-28', className)}
      id={PLATFORMS_SECTION_ID}
      ref={ref}
      {...props}
    >
      <div className="mx-auto w-full max-w-reading border-border-default border-y">
        <PlatformRow
          action={
            <div className="flex flex-wrap gap-2">
              <DownloadLink
                href={DOWNLOAD_URLS.macArm64}
                label="Apple Silicon"
              />
              <DownloadLink href={DOWNLOAD_URLS.macIntel} label="Intel" />
            </div>
          }
          description="Choose the installer that matches your Mac."
          icon={<IconApple />}
          title="macOS"
          className="hidden md:grid"
        />
        <PlatformRow
          action={
            <DownloadLink href={DOWNLOAD_URLS.windows} label="Download" />
          }
          description="Download the current Windows desktop build."
          icon={<IconWindows />}
          title="Windows"
          className="hidden md:grid"
        />
        <PlatformRow
          action={<IosAction />}
          description="Take your company’s context with you on iPhone."
          icon={<IconApple />}
          title="iOS"
        />
        <PlatformRow
          action={
            <Text color="tertiary" size={TextSize.Small}>
              Coming soon
            </Text>
          }
          description="The Android app is in development."
          icon={<IconAndroid />}
          title="Android"
        />
      </div>
    </section>
  )
}

function PlatformRow({
  action,
  className,
  description,
  icon,
  title,
}: {
  action: ReactNode
  className?: string
  description: string
  icon: ReactNode
  title: string
}) {
  return (
    <div
      className={cn(
        'grid gap-5 border-border-subtle border-b py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-icon-secondary [&_svg]:size-5">
          {icon}
        </span>
        <div>
          <Text as="h3" size={TextSize.Medium} weight="medium">
            {title}
          </Text>
          <Text
            as="p"
            className="mt-1 text-pretty"
            color="secondary"
            size={TextSize.Small}
          >
            {description}
          </Text>
        </div>
      </div>
      <div className="flex items-center">{action}</div>
    </div>
  )
}

function DownloadLink({ href, label }: { href: string; label: string }) {
  return (
    <Button
      className="rounded-none"
      render={(buttonProps) => (
        <a
          {...buttonProps}
          aria-label={`Download Ando for ${label}`}
          href={href}
        />
      )}
      size={ButtonSize.Small}
      variant={ButtonVariant.Secondary}
    >
      {label}
    </Button>
  )
}

function IosAction() {
  return (
    <>
      <span className="md:hidden">
        <DownloadLink href={DOWNLOAD_URLS.ios} label="App Store" />
      </span>
      <span className="hidden md:inline">
        <Popover>
          <Popover.Trigger nativeButton>
            <Button
              className="rounded-none"
              size={ButtonSize.Small}
              variant={ButtonVariant.Secondary}
            >
              Scan QR
            </Button>
          </Popover.Trigger>
          <Popover.Panel
            align="center"
            aria-label="Scan to download Ando for iOS"
            className="rounded-none shadow-none"
            radius={PopoverRadius.Small}
            side="top"
          >
            <Popover.Body className="p-2">
              <img
                alt="Scan to download Ando for iOS"
                className="size-48 object-cover"
                height={192}
                src={qrCode}
                width={192}
              />
            </Popover.Body>
          </Popover.Panel>
        </Popover>
      </span>
    </>
  )
}

DownloadPlatforms.displayName = 'DownloadPlatforms'
