import Link from 'next/link'

import {
  Hero,
  TEXT_BODY_SIZE,
  Text,
  TextColor,
  TextSize,
} from '@repo/design-system-ui/text'

import { SiteFooter } from '@/components/site-footer'
import { SiteNavigation } from '@/components/site-navigation'
import type { FriendOfAndoProfile } from '@/lib/friends-of-ando'
import { SlackSyncCards } from './slack-sync-cards'

const ctaClassName =
  'inline-flex h-12 items-center justify-center bg-surface-inverse px-5 font-sans text-size-md font-medium text-text-inverse transition-colors duration-150 hover:bg-text-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-border-active focus-visible:outline-offset-2 motion-reduce:transition-none'

export function FriendOfAndoPage({
  profile,
}: {
  profile: FriendOfAndoProfile
}) {
  const waitlistHref = `/waitlist?ref=${encodeURIComponent(profile.referralCode)}`

  return (
    <>
      <SiteNavigation referralCode={profile.referralCode} />
      <main id="main-content">
        <section className="content-frame pt-14 pb-16 md:pt-20 md:pb-24">
          <div className="mx-auto max-w-[760px] text-center">
            <SlackSyncCards />
            <Text
              className="mt-10"
              color={TextColor.Secondary}
              size={TextSize.Small}
            >
              ando.so/@{profile.handle}
            </Text>
            <Hero
              className="mt-5 text-balance leading-[1.02]"
              size={{ base: TextSize.XXL2, md: TextSize.Hero }}
            >
              @{profile.handle} is inviting you to Ando
            </Hero>
            <Text
              as="p"
              className="mx-auto mt-6 max-w-reading text-pretty"
              color={TextColor.Secondary}
              size={TEXT_BODY_SIZE}
            >
              A messaging platform where people and agents share context, move
              work forward, and stay in the same conversation.
            </Text>
            <div className="mt-8 flex justify-center">
              <Link className={ctaClassName} href={waitlistHref}>
                Get access →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

FriendOfAndoPage.displayName = 'FriendOfAndoPage'
