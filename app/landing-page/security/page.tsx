import type { Metadata } from 'next'
import Link from 'next/link'

import { IconArrowUpRight } from '@repo/design-system-ui/icon'
import {
  Hero,
  TEXT_BODY_SIZE,
  Text,
  TextSize,
} from '@repo/design-system-ui/text'

import { SecuritySubNavigation } from '@/components/security-sub-navigation'
import { SiteFooter } from '@/components/site-footer'
import { SiteNavigation } from '@/components/site-navigation'

export const metadata: Metadata = {
  title: { absolute: 'Security · Ando' },
  description:
    'How Ando protects customer data through access controls, secure development, monitoring, and independent assurance.',
}

const SECURITY_PRACTICES = [
  {
    title: 'Access control',
    description:
      'We limit access to systems and customer data based on job responsibilities, protect privileged access, and review access regularly.',
  },
  {
    title: 'Data protection',
    description:
      'We use encryption in transit and at rest, manage secrets outside source control, and minimize access to customer data.',
  },
  {
    title: 'Secure development',
    description:
      'Production changes are peer reviewed, checked automatically, and deployed through controlled release processes.',
  },
  {
    title: 'Monitoring and response',
    description:
      'We monitor production services, retain security-relevant logs, and maintain procedures for investigating and responding to incidents.',
  },
  {
    title: 'Vulnerability management',
    description:
      'We scan dependencies and infrastructure, prioritize findings by risk, and track remediation to completion.',
  },
  {
    title: 'Vendor oversight',
    description:
      'We assess service providers that handle company or customer data and review their security posture throughout the relationship.',
  },
] as const

const SECURITY_RESOURCES = [
  {
    href: '/security/privacy-policy',
    label: 'Privacy policy',
    description: 'How Ando collects, uses, and protects personal information.',
  },
  {
    href: '/security/terms-of-service',
    label: 'Terms of service',
    description: 'The terms governing access to and use of Ando.',
  },
  {
    href: '/security/sub-processors',
    label: 'Sub-processors',
    description: 'The service providers that help us deliver Ando.',
  },
  {
    href: '/.well-known/security.txt',
    label: 'Vulnerability disclosure',
    description: 'How security researchers can report a suspected issue.',
  },
] as const

const PAGE_SECTIONS = [
  { href: '#assurance', label: 'Independent assurance' },
  { href: '#practices', label: 'Security practices' },
  { href: '#resources', label: 'Policies and reporting' },
] as const

/** Public overview of Ando's security program and customer-facing commitments. */
export default function SecurityPage() {
  return (
    <>
      <SiteNavigation />
      <SecuritySubNavigation active="overview" />
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
              <header className="pb-8 md:pb-12">
                <Hero
                  className="leading-[0.96]"
                  size={{ base: TextSize.XXXL, md: TextSize.Display }}
                >
                  Security
                </Hero>
                <Text
                  as="p"
                  className="mt-7 text-pretty"
                  color="secondary"
                  size={TEXT_BODY_SIZE}
                >
                  Ando is where people and agents work together. We protect the
                  conversations and context entrusted to us with safeguards
                  designed into how we build and operate the service.
                </Text>
                <Text
                  as="p"
                  className="mt-5 text-pretty"
                  color="secondary"
                  size={TEXT_BODY_SIZE}
                >
                  To report a suspected vulnerability or ask a question about
                  our security program, email{' '}
                  <a
                    className="focus-ring rounded-sm underline underline-offset-3 hover:text-text-primary"
                    href="mailto:hello@ando.so?subject=Security%20inquiry"
                  >
                    hello@ando.so
                  </a>
                  .
                </Text>
                <Text
                  as="p"
                  className="mt-8"
                  color="tertiary"
                  size={TextSize.Small}
                >
                  Last reviewed{' '}
                  <time dateTime="2026-08-03">August 3, 2026</time>
                </Text>
              </header>

              <section className="scroll-mt-32" id="assurance">
                <SectionHeading>Independent assurance</SectionHeading>
                <Text
                  as="p"
                  className="mt-5 text-pretty"
                  color="secondary"
                  size={TEXT_BODY_SIZE}
                >
                  Independent review helps us verify that the controls we
                  describe are operating as intended. Supporting documentation
                  is available to qualified customers and prospects on request.
                </Text>

                <dl className="mt-6 border-border-default border-y">
                  <AssuranceRow
                    label="SOC 2 Type I"
                    status="Completed July 2026"
                  />
                  <AssuranceRow
                    label="SOC 2 Type II"
                    status="Observation period in progress"
                  />
                </dl>
              </section>

              <section className="mt-8 scroll-mt-32 md:mt-10" id="practices">
                <SectionHeading>Security practices</SectionHeading>
                <Text
                  as="p"
                  className="mt-4 text-pretty"
                  color="secondary"
                  size={TEXT_BODY_SIZE}
                >
                  Our program evolves with Ando, our customers, and the threat
                  landscape. These practices span how we grant access, write
                  software, operate infrastructure, and work with service
                  providers.
                </Text>

                <div className="mt-6 border-border-default border-y">
                  {SECURITY_PRACTICES.map((practice) => (
                    <div
                      className="grid gap-2 border-border-subtle border-b py-5 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8"
                      key={practice.title}
                    >
                      <Text as="h3" size={TextSize.Medium} weight="medium">
                        {practice.title}
                      </Text>
                      <Text
                        as="p"
                        className="text-pretty"
                        color="secondary"
                        size={TEXT_BODY_SIZE}
                      >
                        {practice.description}
                      </Text>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-8 scroll-mt-32 md:mt-10" id="resources">
                <SectionHeading>Policies and reporting</SectionHeading>

                <nav
                  aria-label="Security resources"
                  className="mt-6 border-border-default border-y"
                >
                  {SECURITY_RESOURCES.map((resource) => (
                    <Link
                      className="group focus-ring grid gap-2 border-border-subtle border-b py-5 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-start md:gap-8"
                      href={resource.href}
                      key={resource.href}
                    >
                      <Text as="span" size={TextSize.Medium} weight="medium">
                        {resource.label}
                      </Text>
                      <Text as="span" color="secondary" size={TextSize.Small}>
                        {resource.description}
                      </Text>
                      <IconArrowUpRight
                        aria-hidden
                        className="hidden text-icon-secondary transition-[color,transform] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-icon-primary md:block"
                      />
                    </Link>
                  ))}
                </nav>

                <div className="mt-10 flex flex-col items-start gap-3">
                  <Text as="h3" size={TextSize.Large} weight="medium">
                    Need security documentation?
                  </Text>
                  <Text
                    as="p"
                    className="max-w-[560px] text-pretty"
                    color="secondary"
                    size={TEXT_BODY_SIZE}
                  >
                    Customers and qualified prospects can contact us to request
                    security reports or ask questions about our program.
                  </Text>
                  <a
                    className="focus-ring mt-1 rounded-sm text-size-sm underline underline-offset-4 hover:text-text-secondary"
                    href="mailto:hello@ando.so?subject=Security%20documentation%20request"
                  >
                    Contact security
                  </a>
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

function SectionHeading({ children }: { children: string }) {
  return (
    <Text as="h2" size={{ base: TextSize.Medium, md: TextSize.Large }}>
      {children}
    </Text>
  )
}

function AssuranceRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="grid gap-1 border-border-subtle border-b py-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-8">
      <dt>
        <Text as="span" size={TextSize.Medium} weight="medium">
          {label}
        </Text>
      </dt>
      <dd>
        <Text as="span" color="secondary" size={TextSize.Small}>
          {status}
        </Text>
      </dd>
    </div>
  )
}
