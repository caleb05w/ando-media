import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import {
  Heading,
  Hero,
  TEXT_BODY_SIZE,
  Text,
  TextSize,
} from '@repo/design-system-ui/text'

import { SiteFooter } from '@/components/site-footer'
import { SiteNavigation } from '@/components/site-navigation'
import { hasManifestoAccess } from './access'
import { unlockManifesto } from './actions'

interface ManifestoSection {
  id: string
  title: string
  body: ReactNode
}

interface ManifestoPageProps {
  searchParams?: Promise<{
    error?: string | string[]
  }>
}

export const metadata: Metadata = {
  title: { absolute: 'Manifesto · Ando' },
  description: 'Ando’s manifesto on messaging for human-agent collaboration.',
  robots: {
    follow: false,
    index: false,
  },
}

export const dynamic = 'force-dynamic'

const manifestoSections: ManifestoSection[] = [
  {
    id: 'why-we-started-ando',
    title: 'Why We Started Ando',
    body: (
      <>
        <ManifestoParagraph>
          Every default work platform begins with an assumption about how teams
          operate. Email assumed work was formal, asynchronous, and
          document-like. Slack assumed work had become faster, more
          conversational, and more cross-functional... We started Ando on the
          premise that the next generation of teams will be composed of both
          humans and agents.
        </ManifestoParagraph>
        <ManifestoParagraph>
          Agents are already acting as powerful contributors across various
          types of work: coding, research, operations, support, GTM, etc. But
          most still operate in “single player” workflows, where one human
          prompts, reviews the output, and decides what happens next.
        </ManifestoParagraph>
        <ManifestoParagraph>
          Companies don't work that way. They're multiplayer systems where work
          moves through questions, decisions, handoffs, blockers, priorities,
          status updates, follow-ups, and changing context.{' '}
          <Underlined>
            And at a company, your best human coworkers do more than respond to
            instructions; they are proactive.
          </Underlined>{' '}
          They notice what's missing, identify opportunities to push the company
          forward, surface risks, ask piercing questions at the right time, and
          help move work forward. If we want agents to become A+ teammates, they
          need access to the same context that enables humans to operate that
          way. Today, most agent workflows are the equivalent of putting a
          colleague in a janitor’s closet, slipping instructions under the door
          on Post-it notes, and expecting exceptional work in return. They’re
          disconnected from the conversations, decisions, tradeoffs, and
          evolving context that shape how work actually gets done.
        </ManifestoParagraph>
        <ManifestoParagraph>
          In the future, the deeper opportunity is not just to let agents take
          on work, but also absorb the coordination burden that prevents humans
          from doing their best work. Agents should help teams understand what
          can be offloaded to software, what still requires human judgment, and
          where people are uniquely valuable.
        </ManifestoParagraph>
        <ManifestoParagraph>
          This is why messaging matters. Messaging is the intent layer of work.
          It’s where we brainstorm and decide what tasks to create. It’s where
          decisions get made, blockers surface, context accumulates, and work
          changes direction. In a human-only organization, messaging is mostly a
          communication tool. In a human-agent organization, it becomes the
          coordination layer between people, agents, context, and action.
        </ManifestoParagraph>
      </>
    ),
  },
  {
    id: 'what-were-building',
    title: 'What We’re Building (Product)',
    body: (
      <>
        <ManifestoParagraph>
          Incumbent messaging platforms were built over a decade ago, and were
          designed around human-only organizations. Agents were recently added
          on top of their bots architecture. But bots are very different; they
          don't have the permission models required of tool-using agents, they
          only respond when invoked, and fundamentally, they're not proactive
          participants in work.
        </ManifestoParagraph>
        <ManifestoParagraph>
          Ando is a team messaging platform designed from first principles to
          work better for agents. However, our focus is not on agent creation /
          orchestration. We operate on a BYOA (bring your own agent) model. Our
          job is to build the messaging platform where three modes of
          collaboration can happen effectively:
        </ManifestoParagraph>
        <NumberedList>
          <NumberedListItem>Human-to-human</NumberedListItem>
          <NumberedListItem>Human-to-agent</NumberedListItem>
          <NumberedListItem>Agent-to-agent</NumberedListItem>
        </NumberedList>
        <ManifestoParagraph>
          A major area of focus for us is memory, context, and proactive
          coordination. Agents become far more useful when can surprise us; by
          catching dropped threads, helping humans collaborate better, and
          identifying opportunities to offload work.
        </ManifestoParagraph>
        <ManifestoParagraph>
          We believe the next great communication platform should be designed
          around a few key principles:
        </ManifestoParagraph>
        <NumberedList>
          <NumberedListItem>
            <Strong>Agent-participatory</Strong>: It gives agents a first-class
            role in the messaging platform.
          </NumberedListItem>
          <NumberedListItem>
            <Strong>Attention-aware</Strong>: It routes information differently
            to humans and machines.
          </NumberedListItem>
          <NumberedListItem>
            <Strong>Action-oriented</Strong>: It helps work move forward instead
            of producing more messages.
          </NumberedListItem>
          <NumberedListItem>
            <Strong>Trustworthy</Strong>: It makes clear what agents saw, did,
            suggested, changed, and why.
          </NumberedListItem>
        </NumberedList>
      </>
    ),
  },
  {
    id: 'where-were-starting',
    title: 'Where We’re Starting (ICP)',
    body: (
      <>
        <ManifestoParagraph>
          The long-term opportunity spans orgs of every size, but the future
          arrives unevenly. We are starting with teams that are small, young,
          and AI-forward because they already yearn for an agent-first Slack
          and:
        </ManifestoParagraph>
        <NumberedList>
          <NumberedListItem>
            <Strong>Small teams care deeply about leverage.</Strong> Every
            person, workflow, and decision matters. They are often the first to
            adopt agents because they want to increase output without increasing
            headcount.
          </NumberedListItem>
          <NumberedListItem>
            <Strong>
              Young teams are less constrained by legacy workflows.
            </Strong>{' '}
            They are more willing to build around what is possible today instead
            of inheriting the communication patterns of the last decade.
          </NumberedListItem>
          <NumberedListItem>
            <Strong>
              AI-forward teams are already experimenting with new ways of
              working.
            </Strong>{' '}
            They use agents in coding, operations, research, support, and
            go-to-market workflows. They feel the limits of single-player agent
            tools first, and they know existing work messaging tools are a poor
            home for human-agent collaboration.
          </NumberedListItem>
        </NumberedList>
        <ManifestoParagraph>
          We are currently working with an alpha cohort of approximately 20
          teams that fit this profile. Over time, we expect to expand support to
          larger organizations as we learn how human-agent collaboration scales.
          Our goal is to support teams of up to fifty people by the end of this
          year, and self-serve onboarding for teams of up to one hundred people
          before opening general access.
        </ManifestoParagraph>
        <ManifestoParagraph>
          We are starting narrow because the behavior change is real. Replacing
          Slack is a change in how a team communicates, coordinates, and thinks
          about work. The right starting point is the small, agent-pilled team
          that already feels the future pulling them forward.
        </ManifestoParagraph>
      </>
    ),
  },
  {
    id: 'market-opportunity',
    title: 'Market Opportunity',
    body: (
      <>
        <ManifestoParagraph>
          Messaging has always been one of the largest software categories in
          the world. Slack went public then was acquired for $28B. Microsoft
          Teams does about $10B / year in ARR.
        </ManifestoParagraph>
        <ManifestoParagraph>
          The next generation of messaging platforms can be much larger because
          messaging sits upstream of nearly every system of work:
        </ManifestoParagraph>
        <ManifestoList>
          <ManifestoListItem>documents</ManifestoListItem>
          <ManifestoListItem>issue trackers</ManifestoListItem>
          <ManifestoListItem>CRMs</ManifestoListItem>
          <ManifestoListItem>project management tools</ManifestoListItem>
          <ManifestoListItem>systems of record</ManifestoListItem>
          <ManifestoListItem>internal workflows</ManifestoListItem>
          <ManifestoListItem>agent execution environments</ManifestoListItem>
        </ManifestoList>
        <ManifestoParagraph>
          Messaging is where work begins. It is where intent is expressed,
          context accumulates, priorities change, and people decide what should
          happen next. As agents become participants in organizations, messaging
          becomes the live interface between organizational intent and
          execution.
        </ManifestoParagraph>
        <ManifestoParagraph>
          The number of participants in a company will no longer be limited by
          the number of humans. The amount of useful communication will no
          longer be limited by human attention. The coordination layer will need
          to support people, agents, and eventually networks of agents
          collaborating across teams.
        </ManifestoParagraph>
        <ManifestoParagraph>
          That is why we believe the future market may be more than 10x the size
          of the market we see today. The first generation of work messaging
          captured human communication. The next generation will capture
          human-agent coordination.
        </ManifestoParagraph>
        <ManifestoParagraph>
          The biggest software companies are often born when a default
          assumption becomes obsolete. Slack emerged when email was no longer
          the right coordination layer for modern teams. Ando is being built
          because human-only messaging will no longer be the right coordination
          layer for modern organizations.
        </ManifestoParagraph>
        <ManifestoParagraph>
          The world is moving from teams of humans using software to teams of
          humans and software agents working together. That shift requires new
          infrastructure, new product primitives, new interaction patterns, and
          new norms for trust, attention, memory, and action. The category is
          unsettled. The interface is still emerging. The behaviors are being
          invented in real time.
        </ManifestoParagraph>
        <ManifestoParagraph>
          There is a rare chance to rebuild one of the default surfaces of work
          during a platform shift. That is what Ando exists to do.
        </ManifestoParagraph>
      </>
    ),
  },
  {
    id: 'how-we-work',
    title: 'Who we are & how we work',
    body: (
      <>
        <ManifestoParagraph>
          We’re building the Burj Khalifa (yes, expect plenty of architecture
          analogies here, we did name the company after Tadao Ando after all).
          For us, that means being highly ambitious while caring deeply about
          foundations, and balancing speed of execution with thoughtful
          architecting/blueprinting.
        </ManifestoParagraph>
        <ManifestoParagraph>
          It is not enough for Ando to simply “work,” or to reach parity with
          Slack. We’re building a messaging platform with agent-first primitives
          at its core, while also making the experience faster, calmer, and more
          sensible for humans. Ando should be good enough that people want to
          spend hours of their day in it, and feel compelled to bring their
          colleagues with them.
        </ManifestoParagraph>
        <ManifestoParagraph>
          Unseating Slack requires obsessive attention to detail. It means
          sweating things users may never consciously notice, but that make the
          product feel faster, clearer, and more delightful every day.
        </ManifestoParagraph>
        <ManifestoParagraph>
          We’re assembling a team with exceptionally high standards, who value
          the following:
        </ManifestoParagraph>
        <ManifestoList>
          <ManifestoListItem>
            <Strong>We want to do the best work of our lives here</Strong>: We
            share AI tricks, give candid feedback, and push each other to raise
            the bar (while having fun doing it). This lends itself to a very
            truth-seeking, all-cards-on-the-table culture.
          </ManifestoListItem>
          <ManifestoListItem>
            <Strong>Clear thinking starts with clear communication</Strong>:
            We’re very team-oriented. As much as we are agent-leveraged and get
            more done with fewer humans, the inter-human communication and
            ideation is critical. We treat this with respect, and so we think
            it’s important to be articulate, precise, and thoughtful in how we
            communicate. <Underlined>Human UX is important.</Underlined>
          </ManifestoListItem>
          <ManifestoListItem>
            <Strong>Long-term orientation</Strong>: These days, you can really
            tell apart who wants to make a quick buck vs who actually cares
            about cutting-edge technology. Similarly, you can tell who is
            thinking about what’s best for a wide base of users, vs orienting
            towards short-term revenue. We value people who understand how to
            make tradeoffs, but lean towards harder, long-term-leaning
            decisions.
          </ManifestoListItem>
          <ManifestoListItem>
            <Strong>Care &amp; craft</Strong>: The excellent teammate cares
            deeply about their craft and the people they do it with. This isn’t
            just a job, it’s building something meaningful together.
          </ManifestoListItem>
          <ManifestoListItem>
            <Strong>Low ego, high maturity, beginner’s mindset</Strong>:
            Everyone here wants to level up. Feedback is a muscle we train all
            the time.
          </ManifestoListItem>
        </ManifestoList>
      </>
    ),
  },
  {
    id: 'common-qa',
    title: 'Other common Q&A',
    body: (
      <ManifestoList>
        <ManifestoListItem>
          How big is the team?
          <ManifestoList nested>
            <ManifestoListItem>
              We’re currently 6 people, of which 4 of us work daily out of our
              office in SF (in Jackson Sq), and the others live across the US
              and visit about once a month. We also go to fun weeklong offsites
              every 4-6 months.
            </ManifestoListItem>
          </ManifestoList>
        </ManifestoListItem>
        <ManifestoListItem>
          Who are your backers &amp; how much have you raised?
          <ManifestoList nested>
            <ManifestoListItem>
              We’ve raised $20M from Accel (first backers of Slack), Index,
              Emergence, &amp; the founders of Decagon, Cognition, Mercor, &amp;
              more. All of our funding is unannounced as we prefer to keep a low
              profile.
            </ManifestoListItem>
          </ManifestoList>
        </ManifestoListItem>
        <ManifestoListItem>
          How large are you growing the team given the backing &amp; ambition?
          <ManifestoList nested>
            <ManifestoListItem>
              We don’t have hiring targets. Our goal is simply to bring on as
              many exceptional people as we can - people who care deeply, raise
              our standards, and push all of us to do better work.
            </ManifestoListItem>
            <ManifestoListItem>
              We’d rather remain small and work alongside people we deeply
              respect and genuinely enjoy than hire for the sake of appearing to
              make progress. In fact, we’d rather people be amazed by how much
              we accomplish with so few people than by how many people we have.
            </ManifestoListItem>
            <ManifestoListItem>
              Here are the roles we’re currently hiring for, we try to make the
              JDs very custom:{' '}
              <ManifestoLink href="https://jobs.ashbyhq.com/ando">
                https://jobs.ashbyhq.com/ando
              </ManifestoLink>
            </ManifestoListItem>
          </ManifestoList>
        </ManifestoListItem>
        <ManifestoListItem>
          When are you launching?
          <ManifestoList nested>
            <ManifestoListItem>
              It’s somewhat contrarian to take a deliberate approach to building
              at a time when everyone seems to be vibe coding their way to
              hockey-stick growth. But patience is essential when building a
              platform meant to last. That mindset is reflected in our name:
              Ando, after the architect. Great buildings require thoughtful
              design and strong foundations before they can scale.
            </ManifestoListItem>
            <ManifestoListItem>
              That said, the timeline is accelerating quickly. We expect to
              publicly launch within 3–4 quarters of beginning work,
              significantly faster than the 1.5–2+ years it took products like
              Slack and other messaging platforms from the previous generation
              to reach market.
            </ManifestoListItem>
          </ManifestoList>
        </ManifestoListItem>
      </ManifestoList>
    ),
  },
]

const tocItems = manifestoSections.map((section) => ({
  id: section.id,
  label: section.title,
}))

export default async function ManifestoPage({
  searchParams,
}: ManifestoPageProps) {
  const [hasAccess, params] = await Promise.all([
    hasManifestoAccess(),
    searchParams,
  ])

  if (!hasAccess) {
    const error = params?.error
    return (
      <ManifestoGate
        showError={Array.isArray(error) ? error.includes('1') : error === '1'}
      />
    )
  }

  return <ManifestoContent />
}

function ManifestoGate({ showError }: { showError: boolean }) {
  return (
    <>
      <SiteNavigation />
      <main className="w-full" id="main-content">
        <section className="content-frame flex min-h-[calc(100dvh-160px)] items-center py-16 md:py-24">
          <div className="mx-auto w-full max-w-reading">
            <Hero
              className="text-balance leading-[0.96]"
              size={{ base: TextSize.XXXL, md: TextSize.Display }}
            >
              Manifesto
            </Hero>
            <Text
              as="p"
              className="mt-6 text-pretty"
              color="secondary"
              size={TEXT_BODY_SIZE}
            >
              Enter the password to continue.
            </Text>

            <form
              action={unlockManifesto}
              autoComplete="off"
              className="mt-8 flex w-full flex-col gap-3"
              data-1p-ignore
              data-form-type="other"
              data-lpignore="true"
            >
              <label className="sr-only" htmlFor="manifesto-password">
                Password
              </label>
              <input
                autoComplete="off"
                className="h-12 w-full border border-border-default bg-transparent px-4 font-sans text-size-md text-text-primary outline-hidden placeholder:text-text-tertiary caret-border-active focus:border-border-active"
                data-1p-ignore
                data-form-type="other"
                data-lpignore="true"
                id="manifesto-password"
                name="password"
                placeholder="Password"
                required
                type="password"
              />
              {showError ? (
                <Text as="p" color="secondary" size={TextSize.Small}>
                  That password didn’t match.
                </Text>
              ) : null}
              <button
                className="inline-flex h-12 items-center justify-center bg-surface-inverse px-5 font-sans text-size-md font-medium text-text-inverse transition-colors hover:bg-text-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-border-active focus-visible:outline-offset-2"
                type="submit"
              >
                Continue
              </button>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

function ManifestoContent() {
  return (
    <>
      <SiteNavigation />
      <main className="w-full" id="main-content">
        <section className="content-frame py-12 md:py-20">
          <div className="grid grid-cols-1 gap-x-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,640px)_minmax(0,1fr)]">
            <aside className="hidden xl:block">
              <nav
                aria-label="Manifesto sections"
                className="sticky top-32 flex max-h-[calc(100dvh-10rem)] flex-col items-start gap-3 overflow-y-auto pr-4"
              >
                <Text color="tertiary" size={TextSize.XS}>
                  On this page
                </Text>
                {tocItems.map((item) => (
                  <a
                    className="focus-ring rounded-sm text-size-sm text-text-secondary transition-colors hover:text-text-primary"
                    href={`#${item.id}`}
                    key={item.id}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </aside>

            <article className="w-full max-w-reading xl:col-start-2">
              <header className="pb-16 md:pb-20">
                <Hero
                  className="text-balance leading-[0.96]"
                  size={{ base: TextSize.XXXL, md: TextSize.Display }}
                >
                  Manifesto
                </Hero>
                <Text
                  as="p"
                  className="mt-8 text-pretty"
                  color="tertiary"
                  size={TextSize.Small}
                >
                  Please keep confidential. This document was last updated
                  September 1, 2026.
                </Text>
              </header>

              <div className="flex flex-col gap-14 md:gap-16">
                {manifestoSections.map((section) => (
                  <ManifestoArticleSection key={section.id} section={section} />
                ))}
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

function ManifestoArticleSection({ section }: { section: ManifestoSection }) {
  return (
    <section
      aria-labelledby={`${section.id}-heading`}
      className="flex scroll-mt-32 flex-col gap-4"
      id={section.id}
    >
      <Heading
        as="h2"
        className="w-full max-w-none text-pretty"
        id={`${section.id}-heading`}
        size={{ base: TextSize.XXL, md: TextSize.XXXL }}
      >
        {section.title}
      </Heading>
      <div className="flex flex-col gap-4">{section.body}</div>
    </section>
  )
}

function ManifestoParagraph({ children }: { children: ReactNode }) {
  return (
    <Text
      as="p"
      className="text-pretty"
      color="secondary"
      size={TEXT_BODY_SIZE}
    >
      {children}
    </Text>
  )
}

function ManifestoList({
  children,
  nested = false,
}: {
  children: ReactNode
  nested?: boolean
}) {
  return (
    <ul className={nested ? 'mt-2 flex flex-col gap-2' : 'flex flex-col gap-3'}>
      {children}
    </ul>
  )
}

function ManifestoListItem({ children }: { children: ReactNode }) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
      <Text
        aria-hidden
        as="span"
        className="select-none"
        color="secondary"
        size={TEXT_BODY_SIZE}
      >
        &bull;
      </Text>
      <Text
        as="div"
        className="text-pretty"
        color="secondary"
        size={TEXT_BODY_SIZE}
      >
        {children}
      </Text>
    </li>
  )
}

function NumberedList({ children }: { children: ReactNode }) {
  return (
    <ol className="ml-5 flex list-decimal flex-col gap-3 pl-2 font-sans marker:font-medium marker:text-text-secondary">
      {children}
    </ol>
  )
}

function NumberedListItem({ children }: { children: ReactNode }) {
  return (
    <li className="pl-1">
      <Text
        as="div"
        className="text-pretty"
        color="secondary"
        size={TEXT_BODY_SIZE}
      >
        {children}
      </Text>
    </li>
  )
}

function ManifestoLink({
  children,
  href,
}: {
  children: ReactNode
  href: string
}) {
  return (
    <a
      className="font-medium text-text-primary underline decoration-border-strong decoration-1 underline-offset-4 transition-colors hover:text-text-strong"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  )
}

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-medium text-text-primary">{children}</strong>
}

function Underlined({ children }: { children: ReactNode }) {
  return (
    <span className="text-text-primary underline decoration-border-strong decoration-1 underline-offset-4">
      {children}
    </span>
  )
}
