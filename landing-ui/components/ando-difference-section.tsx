import Image from 'next/image'
import type { ReactNode } from 'react'

import { Display, Text } from '@repo/design-system-ui/text'

import { BringYourOwnAgentsPill } from './agent-pill-animation'
import { RotatingPlatformName } from './rotating-platform-name'

export function AndoDifferenceSection() {
  return (
    <section className="content-frame section-y flex flex-col items-center gap-[72px]">
      <div className="flex max-w-[657px] flex-col items-center gap-4 text-center">
        <Display
          className="flex flex-col items-center gap-1 text-balance"
          size={{ base: '2-5xl', md: '4xl' }}
        >
          <span>How is Ando different</span>
          <RotatingPlatformName />
        </Display>
        <Text
          as="p"
          className="max-w-[640px] text-balance"
          color="tertiary"
          size={{ base: 'md', md: 'xl' }}
        >
          We shape context, memory stores, and tools for agents to work just
          like humans do. That&apos;s all we can say for now.
        </Text>
      </div>

      <div className="flex w-full flex-col items-center gap-10">
        <div className="grid w-full gap-10 lg:grid-cols-3 lg:gap-6">
          <DifferenceCard label="Context">
            <DifferenceImage
              alt="Context sources arranged as floating chips for transcripts, files, calls, Linear, Notion, and channels."
              src="/difference/context.jpg"
            />
          </DifferenceCard>
          <DifferenceCard label="Memory">
            <DifferenceImage
              alt="Memory examples shown as floating notes about team ownership, reminders, channel patterns, and preferences."
              src="/difference/memory.jpg"
            />
          </DifferenceCard>
          <DifferenceCard label="Tools">
            <DifferenceImage
              alt="Tool cards for React, Think, Reply, Notion, Claude, Linear, and related actions."
              src="/difference/tools.jpg"
            />
          </DifferenceCard>
        </div>

        <DesktopConnectors />
        <MobileConnector />
        <BringYourOwnAgentsPill />
      </div>
    </section>
  )
}

AndoDifferenceSection.displayName = 'AndoDifferenceSection'

function DifferenceCard({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-6">
      <Text
        as="h3"
        className="order-first text-center tracking-[-0.02em] text-black/80 lg:order-last"
        color="primary"
        size={{ base: 'xl', lg: '2xl' }}
      >
        {label}
      </Text>
      <div className="relative aspect-square w-4/5 overflow-hidden rounded-[24px] bg-black/[0.02]">
        {children}
      </div>
    </div>
  )
}

function DifferenceImage({ alt, src }: { alt: string; src: string }) {
  return (
    <Image
      alt={alt}
      className="object-cover"
      fill
      sizes="(min-width: 1024px) 25vw, calc(80vw - 32px)"
      src={src}
    />
  )
}

function DesktopConnectors() {
  return (
    <svg
      aria-hidden="true"
      className="hidden h-24 w-full lg:block"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 1344 96"
    >
      <path d="M216 0V24C216 62 616 46 672 96" stroke="rgba(0,0,0,0.2)" />
      <path d="M672 0V96" stroke="rgba(0,0,0,0.2)" />
      <path d="M1128 0V24C1128 62 728 46 672 96" stroke="rgba(0,0,0,0.2)" />
      <path d="M216 0V24C216 62 616 46 672 96" stroke="rgba(255,255,255,0.3)" />
      <path d="M672 0V96" stroke="rgba(255,255,255,0.3)" />
      <path
        d="M1128 0V24C1128 62 728 46 672 96"
        stroke="rgba(255,255,255,0.3)"
      />
    </svg>
  )
}

function MobileConnector() {
  return (
    <div className="h-12 w-px bg-black/[0.16] lg:hidden" aria-hidden="true" />
  )
}
