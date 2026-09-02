import type { Metadata } from 'next'

import { BelieversSection } from '@repo/design-system-ui/believers-section'
import { Reveal, STAGGER_BLOCK } from '@repo/design-system-ui/reveal'
import {
  Hero,
  TEXT_BODY_SIZE,
  Text,
  TextSize,
} from '@repo/design-system-ui/text'

import { SiteFooter } from '@/components/site-footer'
import { SiteNavigation } from '@/components/site-navigation'

export const metadata: Metadata = {
  title: { absolute: 'About · Ando' },
  description:
    'Ando is coordination software for people and machines, built with deliberate architecture to enable them to coexist and collaborate well.',
}

export default function AboutPage() {
  return (
    <>
      <SiteNavigation />
      <main>
        <section className="content-frame flex flex-col pt-12 pb-20 md:pt-14 md:pb-32">
          {/* The above-the-fold cascade: each block reveals on load, one block
              stagger (100ms) behind the last. */}
          <Reveal blur={10}>
            <Hero
              className="mx-auto max-w-reading text-balance text-center text-[2.25rem] leading-[1.08] md:leading-[0.96]"
              size={{
                base: TextSize.XXL,
                md: TextSize.Display,
                lg: TextSize.Hero,
              }}
            >
              We build spaces for people & agents
            </Hero>
          </Reveal>

          <Reveal blur={10} className="mt-8 md:mt-12" delay={STAGGER_BLOCK}>
            <div className="mx-auto flex max-w-reading flex-col gap-6">
              <Text as="p" className="text-pretty" size={TEXT_BODY_SIZE}>
                Language is what made human civilization possible: it let us
                transmit what was inside one mind to another, coordinate beyond
                ourselves, and build things no individual could build alone.
              </Text>
              <Text as="p" className="text-pretty" size={TEXT_BODY_SIZE}>
                Now machines can participate in language too. That’s a strange
                and exciting inflection point. For the first time, the systems
                we use to coordinate aren’t just connecting humans; they’re
                becoming participants themselves. We want agents to help
                organizations work better together: carrying context, moving
                work forward, and taking on more of the coordination overhead
                that consumes human attention. The point isn’t to automate the
                human out of the loop though. We want to harness what machines
                are good at so humans have more room for the things we’re
                uniquely good at.
              </Text>
              <Text as="p" className="text-pretty" size={TEXT_BODY_SIZE}>
                Ando exists to expand what humans are capable of as machines
                become more capable too. We’re starting with how teams
                coordinate.
              </Text>
            </div>
          </Reveal>

          {/* The carousel owns its small state transition; the section reveal
              remains opacity + rise only so the two motions do not compete. */}
          <Reveal
            blur={0}
            className="mt-[21px] w-full md:mt-[26px]"
            delay={2 * STAGGER_BLOCK}
            distance={20}
          >
            <BelieversSection />
          </Reveal>

          <Reveal blur={10} className="mt-4 md:mt-5" delay={3 * STAGGER_BLOCK}>
            <div className="mx-auto flex max-w-reading flex-col gap-6">
              <Text as="p" className="text-pretty" size={TEXT_BODY_SIZE}>
                We’re inspired by linguists, philosophers, and architects. Each
                gives us a different way of thinking about the same problem: how
                humans and machines might coexist and coordinate. Wittgenstein
                wrote about the limits of language; Nagel about the limits of
                knowing what it is like to be something else. Questions about
                understanding, subjectivity, and what one mind can know about
                another used to feel mostly philosophical. When you’re building
                software where humans and agents work alongside each other, they
                start to feel like product questions.
              </Text>
              <Text as="p" className="text-pretty" size={TEXT_BODY_SIZE}>
                Architecture is about designing environments for people to
                inhabit, which is part of why we’re named after Tadao Ando. An
                architect creates the conditions for what can happen inside a
                space without prescribing exactly what will. We think about
                software similarly. Teams may spend years inside the systems we
                build, and increasingly, agents will inhabit them too. We want
                to build that environment with the same care.
              </Text>
              <Text as="p" className="text-pretty" size={TEXT_BODY_SIZE}>
                We’re building Ando to last, so we’re patient about the
                decisions that compound (technical architecture, product
                primitives, and our team) and impatient about almost everything
                else.{' '}
              </Text>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
