import type { Metadata } from 'next'
import Link from 'next/link'

import { ButtonSize } from '@repo/design-system-ui/button'
import {
  IconArrowUpRight,
  IconSize,
  IconSlack,
} from '@repo/design-system-ui/icon'
import { Logo } from '@repo/design-system-ui/logo'
import {
  Heading,
  Hero,
  TEXT_BODY_SIZE,
  Text,
  TextSize,
} from '@repo/design-system-ui/text'

import { SiteFooter } from '@/components/site-footer'
import { SiteNavigation } from '@/components/site-navigation'
import { SlackConnectButton } from '@/components/slack-connect-button'

const HOW_IT_WORKS = [
  {
    title: 'Choose the channels',
    description:
      'An admin selects which public Slack channels to sync and where each belongs in Ando.',
  },
  {
    title: 'Keep messages moving',
    description:
      'New messages and thread replies stay current. Members can connect Slack separately to post as themselves from Ando.',
  },
  {
    title: 'Bring the recent context',
    description:
      'The last 180 days of selected channel history fill in automatically in the background.',
  },
] as const

const INSTALL_STEPS = [
  {
    title: 'Open your Ando workspace',
    description:
      'Sign in to Ando and choose the workspace you want to connect to Slack.',
  },
  {
    title: 'Go to Slack sync',
    description:
      'Open Workspace settings, choose Slack sync, then select Connect to Slack.',
  },
  {
    title: 'Approve access in Slack',
    description:
      'Review the requested permissions and authorize Ando. If your workspace restricts app installs, a Slack admin will need to approve it.',
  },
  {
    title: 'Choose what stays in sync',
    description:
      'Back in Ando, select the public channels to connect and map each one to its Ando destination.',
  },
] as const

const PERMISSION_ROWS = [
  {
    title: 'Workspace connection',
    description:
      'Reads public channel names and history, workspace member details for identity matching, and custom emoji so synced conversations remain legible.',
  },
  {
    title: 'Your Slack connection',
    description:
      'A separate, optional member connection requests permission to post as you. It is used only when you send a synced message from Ando.',
  },
  {
    title: 'Your control',
    description:
      'You choose the public channels. Disconnecting stops new sync activity; content already brought into Ando stays in your Ando workspace.',
  },
] as const

const PAGE_SECTIONS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#permissions', label: 'Access and control' },
  { href: '#install', label: 'Installation' },
] as const

export const metadata: Metadata = {
  title: { absolute: 'Ando for Slack' },
  description:
    'Connect Slack to Ando, sync selected public channels, and keep conversations moving across both workspaces.',
}

export default function SlackPage() {
  return (
    <>
      <SiteNavigation />
      <main id="main-content">
        <section className="content-frame py-12 md:py-20">
          <div className="grid grid-cols-1 gap-x-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,640px)_minmax(0,1fr)]">
            <aside className="hidden xl:block">
              <nav
                aria-label="On this page"
                className="sticky top-32 flex flex-col items-start gap-3"
              >
                <Text color="tertiary" size={TextSize.XS}>
                  On this page
                </Text>
                {PAGE_SECTIONS.map((section) => (
                  <a
                    className="focus-ring rounded-sm text-size-sm text-text-secondary transition-colors hover:text-text-primary"
                    href={section.href}
                    key={section.href}
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
            </aside>

            <article className="w-full max-w-reading xl:col-start-2">
              <header className="pb-16 md:pb-20">
                <SlackAndoLockup />
                <Text
                  as="p"
                  className="mt-8 font-mono uppercase tracking-wide"
                  color="secondary"
                  size={TextSize.XXS}
                >
                  Ando for Slack
                </Text>
                <Hero
                  className="mt-4 text-balance leading-[0.96]"
                  size={{ base: TextSize.XXXL, md: TextSize.Display }}
                >
                  Keep Slack in the loop while work moves to Ando
                </Hero>
                <Text
                  as="p"
                  className="mt-7 text-pretty"
                  color="secondary"
                  size={TEXT_BODY_SIZE}
                >
                  Sync selected public channels across Slack and Ando. Bring
                  recent context with you, keep new messages moving, and let
                  teammates reply from Ando as themselves.
                </Text>
                <div className="mt-8 flex flex-col items-start gap-4">
                  <SlackConnectButton
                    className="rounded-none"
                    rightSection={<IconArrowUpRight />}
                    size={ButtonSize.Medium}
                  >
                    Open Ando to connect Slack
                  </SlackConnectButton>
                  <a
                    className="focus-ring rounded-sm text-size-sm text-text-secondary underline underline-offset-4 hover:text-text-primary"
                    href="#install"
                  >
                    See installation steps
                  </a>
                </div>
              </header>

              <SyncRelay />

              <section
                className="mt-16 scroll-mt-32 md:mt-20"
                id="how-it-works"
              >
                <SectionHeading>One conversation, two places</SectionHeading>
                <Text
                  as="p"
                  className="mt-4 text-pretty"
                  color="secondary"
                  size={TEXT_BODY_SIZE}
                >
                  Ando keeps the mechanics quiet: choose the channels once, then
                  let each teammate participate from the place where they
                  already work.
                </Text>
                <DetailRows rows={HOW_IT_WORKS} />
              </section>

              <section className="mt-16 scroll-mt-32 md:mt-20" id="permissions">
                <SectionHeading>Access and control</SectionHeading>
                <Text
                  as="p"
                  className="mt-4 text-pretty"
                  color="secondary"
                  size={TEXT_BODY_SIZE}
                >
                  Ando supports public Slack channels only. Nothing starts
                  syncing until an Ando admin chooses it.
                </Text>
                <DetailRows rows={PERMISSION_ROWS} />
                <Text
                  as="p"
                  className="mt-5 text-pretty"
                  color="tertiary"
                  size={TextSize.Small}
                >
                  Ando includes generative AI. AI-generated messages and
                  summaries can be inaccurate, so review them before relying on
                  them.
                </Text>
              </section>

              <section className="mt-16 scroll-mt-32 md:mt-20" id="install">
                <SectionHeading>Connect Slack from Ando</SectionHeading>
                <Text
                  as="p"
                  className="mt-4 text-pretty"
                  color="secondary"
                  size={TEXT_BODY_SIZE}
                >
                  Authorization starts inside Ando so the connection is attached
                  to the correct workspace.
                </Text>
                <ol className="mt-6 border-border-default border-y">
                  {INSTALL_STEPS.map((step, index) => (
                    <li
                      className="grid grid-cols-[28px_minmax(0,1fr)] gap-4 border-border-subtle border-b py-5 last:border-b-0"
                      key={step.title}
                    >
                      <Text
                        as="span"
                        className="font-mono"
                        color="tertiary"
                        numeric="tabular"
                        size={TextSize.XS}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </Text>
                      <div>
                        <Text as="h3" size={TextSize.Medium} weight="medium">
                          {step.title}
                        </Text>
                        <Text
                          as="p"
                          className="mt-2 text-pretty"
                          color="secondary"
                          size={TextSize.Small}
                        >
                          {step.description}
                        </Text>
                      </div>
                    </li>
                  ))}
                </ol>

                <SlackConnectButton
                  className="mt-8 rounded-none"
                  rightSection={<IconArrowUpRight />}
                  size={ButtonSize.Medium}
                >
                  Open Ando
                </SlackConnectButton>

                <div className="mt-10 border-border-default border-t pt-6">
                  <Text as="p" size={TextSize.Small} weight="medium">
                    After authorization
                  </Text>
                  <Text
                    as="p"
                    className="mt-2 text-pretty"
                    color="secondary"
                    size={TextSize.Small}
                  >
                    You return to Slack sync in Ando, where the connected Slack
                    workspace is confirmed and channel selection begins.
                  </Text>
                  <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                    <Link
                      className="focus-ring rounded-sm text-size-sm text-text-secondary underline underline-offset-4 hover:text-text-primary"
                      href="/security/privacy-policy"
                    >
                      Privacy policy
                    </Link>
                    <a
                      className="focus-ring rounded-sm text-size-sm text-text-secondary underline underline-offset-4 hover:text-text-primary"
                      href="mailto:hello@ando.so"
                    >
                      Get support at hello@ando.so
                    </a>
                  </div>
                </div>
              </section>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

function SlackAndoLockup() {
  return (
    <div
      aria-label="Slack and Ando"
      className="flex items-center gap-3"
      role="img"
    >
      <IconSlack className="text-icon-primary" size={IconSize.Large} />
      <span aria-hidden className="h-px w-6 bg-border-strong" />
      <Logo size={20} variant="mark" />
    </div>
  )
}

function SyncRelay() {
  return (
    <section aria-label="A Slack message synced to Ando">
      <div className="grid border-border-default border-y md:grid-cols-2">
        <RelayColumn label="Slack" meta="#launch-planning" />
        <RelayColumn ando label="Ando" meta="synced live" />
      </div>
    </section>
  )
}

function RelayColumn({
  ando = false,
  label,
  meta,
}: {
  ando?: boolean
  label: string
  meta: string
}) {
  return (
    <div className="border-border-subtle py-6 first:border-b md:px-6 md:first:border-b-0 md:first:border-r">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {ando ? (
            <Logo size={16} variant="mark" />
          ) : (
            <IconSlack size={IconSize.Small} />
          )}
          <Text as="p" size={TextSize.Small} weight="medium">
            {label}
          </Text>
        </div>
        <Text className="font-mono" color="tertiary" size={TextSize.XS}>
          {meta}
        </Text>
      </div>
      <Text as="p" className="mt-6 text-pretty" size={TEXT_BODY_SIZE}>
        The launch review moved to Thursday. I added the final checklist to the
        thread.
      </Text>
      <Text as="p" className="mt-3" color="tertiary" size={TextSize.XS}>
        Maya Chen · 9:42 AM
      </Text>
    </div>
  )
}

function SectionHeading({ children }: { children: string }) {
  return (
    <Heading as="h2" size={{ base: TextSize.XXL, md: TextSize.XXXL }}>
      {children}
    </Heading>
  )
}

function DetailRows({
  rows,
}: {
  rows: ReadonlyArray<{ title: string; description: string }>
}) {
  return (
    <div className="mt-6 border-border-default border-y">
      {rows.map((row) => (
        <div
          className="grid gap-2 border-border-subtle border-b py-5 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8"
          key={row.title}
        >
          <Text as="h3" size={TextSize.Medium} weight="medium">
            {row.title}
          </Text>
          <Text as="p" color="secondary" size={TextSize.Small}>
            {row.description}
          </Text>
        </div>
      ))}
    </div>
  )
}
