import localFont from 'next/font/local'
import type { ReactNode } from 'react'

import { cn } from '@repo/design-system-ui/lib/cn'

import './landing-diagrams.css'

import { WaitlistPersistenceProvider } from '@/components/waitlist-persistence-provider'

// Self-hosted faces copied alongside the design system. next/font/local binds
// each one to the --font-* var that the design system's typography.css reads.
const geistSans = localFont({
  src: '../../landing-ui/design-system/styles/fonts/geist-sans-variable.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
  display: 'swap',
})

const geistMono = localFont({
  src: '../../landing-ui/design-system/styles/fonts/geist-mono-variable.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
  preload: false,
})

const testSignifier = localFont({
  src: [
    {
      path: '../../landing-ui/design-system/styles/fonts/test-signifier-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../landing-ui/design-system/styles/fonts/test-signifier-medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../landing-ui/design-system/styles/fonts/test-signifier-regular-italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../landing-ui/design-system/styles/fonts/test-signifier-medium-italic.woff2',
      weight: '500',
      style: 'italic',
    },
  ],
  variable: '--font-test-signifier',
  display: 'swap',
})

const gtStandard = localFont({
  src: [
    {
      path: '../../landing-ui/design-system/styles/fonts/gt-standard-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../landing-ui/design-system/styles/fonts/gt-standard-medium.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-gt-standard',
  display: 'swap',
})

// Nested layout: the root layout owns <html>/<body>, so the font vars and the
// landing surface colours are applied on a wrapper instead. Keeping it scoped
// here means the other ando-media routes are untouched.
export default function LandingPageLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        geistSans.variable,
        geistMono.variable,
        testSignifier.variable,
        gtStandard.variable,
        'landing-root min-h-dvh bg-surface-primary font-sans text-text-primary',
      )}
    >
      {/* Get-access buttons call useWaitlist, which the landing app mounts in
          its root layout. Kept here so the copied pages render standalone. */}
      <WaitlistPersistenceProvider>{children}</WaitlistPersistenceProvider>
    </div>
  )
}
