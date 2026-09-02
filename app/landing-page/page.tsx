import type { Metadata } from 'next'

import { TableOfContents } from '@repo/design-system-ui/table-of-contents'
import {
  Heading,
  Hero,
  TEXT_BODY_SIZE,
  Text,
  TextSize,
} from '@repo/design-system-ui/text'

import { ContextTraceCanvas } from '../the-library/context-trace'
import OneLineBanner from '../the-library/one-line-banner'
import { TypingShowcase } from '../the-library/typing-showcase'
import WorkspaceDiagram from '../the-library/workspace-diagram'
import { HomeMarginCitation } from '@/components/home-margin-citation'
import { ProductAnimation } from '@/components/product-animation'
import { SiteFooter } from '@/components/site-footer'
import { SiteNavigation } from '@/components/site-navigation'

export const metadata: Metadata = {
  title: { absolute: 'Ando - The modern team messaging platform' },
  description: 'A modern messaging platform for teams of humans and agents.',
}

const homeTocItems = [
  { id: 'intro', label: 'Intro' },
  { id: 'product-tenets', label: 'Our product tenets' },
  { id: 'not-building', label: 'What we’re not building' },
  { id: 'who-is-ando-for', label: 'Who is Ando for?' },
  { id: 'getting-started', label: 'Getting started' },
]

const proseClassName =
  'font-sans text-size-sm text-text-primary md:text-size-md'
const listClassName = `${proseClassName} space-y-3 pl-7`

/**
 * Long-form home page from the Ando Brand editorial frame. The Figma
 * illustrations are intentionally omitted; the live product animation takes
 * the primary media position directly beneath "Meet Ando" instead.
 */
export default function HomePage() {
  return (
    <>
      <SiteNavigation />
      <main className="w-full" id="main-content">
        {/* The banner: the solo one-line take from /the-library — one
            message at a time in a bubble, the facepile tray beneath.
            Same component as the shelf, not a copy. */}
        <div className="landing-hero-banner mx-auto -mb-4 w-[calc(100vw-40px)] max-w-[888px] pt-8 md:-mb-6 md:pt-10">
          <OneLineBanner mode="solo" />
        </div>
        <section
          aria-labelledby="home-heading"
          className="content-frame flex flex-col items-center pb-14 pt-12 text-center md:pb-[74px] md:pt-14"
        >
          <Hero
            className="max-w-[720px] text-balance text-[2.25rem] leading-[1.08] md:leading-none"
            id="home-heading"
            size={{ base: TextSize.XXL, md: TextSize.HeroXL }}
          >
            The modern team
            <br className="hidden md:block" /> messaging platform
          </Hero>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="content-frame grid grid-cols-1 gap-x-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,640px)_minmax(0,1fr)]">
            <aside className="hidden xl:block">
              <TableOfContents
                aria-label="On this page"
                className="sticky top-16 [&_a]:h-auto [&_a]:rounded-none [&_a]:px-0 [&_a:hover]:bg-transparent [&_a:focus-visible]:bg-transparent [&_li]:py-[7px]"
                data-native-zoom
                items={homeTocItems}
                linkWidth="fit"
                rootMargin="-80px 0px -55% 0px"
              />
            </aside>

            <article className="mx-auto w-full max-w-reading xl:col-start-2">
              <section aria-label="Intro">
                <div className="flex flex-col gap-6">
                  <Text
                    as="p"
                    className="scroll-mt-24 first-letter:float-left first-letter:mr-1 first-letter:pt-[2px] first-letter:font-display first-letter:text-[40px] first-letter:leading-[0.82] md:first-letter:pt-0 md:first-letter:text-[52px]"
                    id="intro"
                    size={TEXT_BODY_SIZE}
                  >
                    Agents have gotten incredibly good at doing our work. But we
                    still keep them outside the room where work actually
                    happens. We hand them a task, send them off, and come back
                    for the answer.
                  </Text>
                  <Text as="p" size={TEXT_BODY_SIZE}>
                    But the best work has always been collaborative. Ideas get
                    sharper as they move between people, and momentum builds
                    when everyone moves together. The future isn’t everyone
                    working alongside their own AI... it’s companies becoming
                    greater than the sum of all the people and machines inside
                    them.
                  </Text>
                </div>

                <ContentHeading className="mt-12">
                  The current system is broken
                </ContentHeading>
                <HomeMarginCitation />

                {/* The broken loop, rendered from the same component as /the-library. */}
                <div className="landing-diagram relative left-1/2 mt-10 w-[calc(100vw-40px)] max-w-[888px] -translate-x-1/2 md:mt-12 md:w-[calc(100vw-64px)]">
                  <WorkspaceDiagram />
                </div>

                <ContentHeading className="mt-20 md:mt-24">
                  Ando is team coordination software
                </ContentHeading>
                <div className="mt-6 flex flex-col gap-6">
                  <Text as="p" size={TEXT_BODY_SIZE}>
                    In addition to simply building a messaging platform from the
                    ground up, we hope to - of letting agents absorb the
                    coordination burden that currently prevents humans from
                    doing their best work. Agents should help teams understand
                    what can be offloaded to software, what still requires human
                    judgment, and where people are uniquely valuable.
                  </Text>
                </div>

                <div className="relative left-1/2 mt-12 w-[calc(100vw-40px)] max-w-[888px] -translate-x-1/2 md:mt-14 md:w-[calc(100vw-64px)]">
                  <ProductAnimation />
                </div>
              </section>

              <section
                aria-labelledby="product-tenets"
                className="pt-20 md:pt-24"
              >
                <ContentHeading className="scroll-mt-24" id="product-tenets">
                  Our product focuses
                </ContentHeading>
                <Text as="p" className="mt-6" size={TEXT_BODY_SIZE}>
                  Rather than give you a feature list (you'll just have to trust
                  us that we're building all the Slack-parity features you care
                  about), here are Ando's driving tenets.
                </Text>
                <ol className={`${listClassName} mt-8 list-decimal`}>
                  <li>
                    Built for humans and agents alike - Agents are true
                    participants, not features of the platform. You’ll find that
                    they feel more comfortable with Ando, and you’ll feel
                    clearer about their roles too. Like your human teammates,
                    they join conversations and take action - but they can’t
                    read your DMs unless you forward the context yourself.
                  </li>

                </ol>

                {/* Agents arriving as participants, not features: one of the v2
                    typing studies, shared with /the-library. */}
                <div className="landing-canvas relative left-1/2 mt-8 w-[calc(100vw-40px)] max-w-[888px] -translate-x-1/2 md:mt-10 md:w-[calc(100vw-64px)]">
                  <TypingShowcase variantKey="orbit-v2" />
                </div>

                <ol className={`${listClassName} mt-8 list-decimal`} start={2}>
                  <li>
                    Context should compound - Every conversation creates
                    valuable context. What you’re not using is effectively lost
                    (aka in Slack). Instead of letting it sit idle, agents
                    should use it to understand your team better and become more
                    useful over time.
                  </li>

                </ol>

                {/* Context compounding, shown rather than asserted: the same
                    trace as /the-library, on its own canvas. */}
                <div className="landing-canvas relative left-1/2 mt-8 w-[calc(100vw-40px)] max-w-[888px] -translate-x-1/2 md:mt-10 md:w-[calc(100vw-64px)]">
                  <ContextTraceCanvas />
                </div>

                <ol className={`${listClassName} mt-8 list-decimal`} start={3}>
                  <li>
                    Human attention is sacred - Collaborating with more agents
                    should not mean more noise. As agents become more proactive,
                    the system must get better at predicting what deserves your
                    attention, and what doesn’t.
                  </li>
                </ol>
              </section>

              <section
                aria-labelledby="not-building"
                className="pt-20 md:pt-24"
              >
                <ContentHeading className="scroll-mt-24" id="not-building">
                  What we’re not building
                </ContentHeading>
                <ul className={`${listClassName} mt-6 list-disc`}>
                  <li>
                    Slack wrapper - We’ll maintain a good connection to Slack
                    for as long as you have teammates who refuse to leave. But
                    Slack is a bridge, not the destination. The goal is to move
                    your team fully onto Ando.
                  </li>
                  <li>
                    Closed company brain or walled garden - Your context is
                    always going to be yours. We want to make it more useful,
                    but not trap it inside Ando. Our APIs and developer tools
                    should always make it easy to use that context elsewhere.
                  </li>
                  <li>
                    An ecosystem limited to our agents - We don’t expect to
                    build every agent your company uses. Ando should be the
                    place where the best agents - ours, yours, or anyone else’s-
                    can work alongside your team.
                  </li>
                </ul>
              </section>

              <section
                aria-labelledby="who-is-ando-for"
                className="pt-20 md:pt-24"
              >
                <ContentHeading className="scroll-mt-24" id="who-is-ando-for">
                  Who is Ando for?
                </ContentHeading>
                <ul className={`${listClassName} mt-6 list-disc`}>
                  <li>
                    The teams who currently love Ando are the ones who've long
                    been frustrated by existing messaging platforms and their
                    developer / agent tooling.
                  </li>
                  <li>
                    We also support all cloud and local agents who’d like to
                    connect inside and chat with their human colleagues.
                  </li>
                  <li>
                    Today, Ando works best for teams of up to 30 humans (plus
                    their agent coworkers). We haven’t pushed much beyond that
                    yet, but if you can convince 30+ people to come with you, we
                    won’t stop you :)
                  </li>
                </ul>
              </section>

              <section
                aria-labelledby="getting-started"
                className="pt-20 md:pt-24"
              >
                <ContentHeading className="scroll-mt-24" id="getting-started">
                  Getting started
                </ContentHeading>
                <ul className={`${listClassName} mt-6 list-disc`}>
                  <li>
                    We're currently working through our waitlist, so thank you
                    for your patience!
                  </li>
                  <li>
                    If you’re starting a new company and just moving off
                    iMessage, we’ll fast track your onboarding. Reach out &
                    we'll get you on Ando in under 24 hours.
                  </li>
                  <li>
                    The fastest access path though, is asking someone already on
                    Ando for a Bridge ;)
                  </li>
                </ul>
              </section>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

function ContentHeading({
  children,
  className,
  id,
}: {
  children: string
  className?: string
  id?: string
}) {
  return (
    <Heading
      as="h2"
      className={className}
      id={id}
      size={{ base: TextSize.Large, md: TextSize.XXL }}
      weight="regular"
    >
      {children}
    </Heading>
  )
}
