import type { ReactNode } from 'react'

import {
  Hero,
  TEXT_BODY_SIZE,
  Text,
  TextSize,
} from '@repo/design-system-ui/text'

/* -------------------------------------------------------------------------- *
 * Prose primitives
 *
 * Token-bound building blocks for long-form legal copy (Terms, Privacy, ...).
 * Running text shares the site's responsive sans measure and secondary color
 * tier; defined terms and lead-in labels lift to `text-primary` Medium.
 * -------------------------------------------------------------------------- */

/** A body paragraph using the site's standard responsive reading scale. */
export function Para({ children }: { children: ReactNode }) {
  return (
    <Text className="text-pretty" color="secondary" size={TEXT_BODY_SIZE}>
      {children}
    </Text>
  )
}

/**
 * An emphasised in-text keyword - a defined term (e.g. "Account") or a lead-in
 * label (e.g. "Severability."). Rendered with `<b>` (stylistic offset, no added
 * importance) at Medium weight + `text-primary`, the brand's emphasis tier.
 */
export function Term({ children }: { children: ReactNode }) {
  return <b className="font-medium text-text-primary">{children}</b>
}

/**
 * A bullet item: a plain string (also used as its React key, so each must be
 * unique within a list), or `{ key, content }` for nodes carrying emphasis.
 */
export type DocListItem = string | { key: string; content: ReactNode }

/**
 * A bulleted list set on the relaxed legal line, with hanging indent. Markers
 * are drawn manually (and hidden from assistive tech) so the bullet colour
 * tracks the body tier; the `<ul>`/`<li>` semantics carry the list meaning.
 */
export function DocList({ items }: { items: DocListItem[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const key = typeof item === 'string' ? item : item.key
        const content = typeof item === 'string' ? item : item.content
        return (
          <li className="flex items-start gap-3" key={key}>
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
              className="flex-1 text-pretty"
              color="secondary"
              size={TEXT_BODY_SIZE}
            >
              {content}
            </Text>
          </li>
        )
      })}
    </ul>
  )
}

/* -------------------------------------------------------------------------- *
 * Document layout
 * -------------------------------------------------------------------------- */

/** A single document section. Omit `number` for an unnumbered intro section. */
export interface LegalSection {
  /** Anchor id; the TOC links to `#${id}` and the section carries it. */
  id: string
  /** Section title (TOC label + heading text, prefixed by `number` if set). */
  title: string
  /** 1-based section number; omit for the intro (renders no visible heading). */
  number?: number
  /** Section body: `Para` / `DocList` blocks, spaced 16px by the section. */
  body: ReactNode
}

export interface LegalDocumentProps {
  /** Page title, rendered as the single `<h1>`. */
  title: string
  /** Machine + human "last updated" date. */
  lastUpdated: { iso: string; label: string }
  /** Overline label above the table-of-contents rail. */
  tocLabel: string
  /** Sections in document order; the TOC mirrors this order. */
  sections: LegalSection[]
}

/**
 * Responsive long-form legal document using the Security overview's 640px
 * reading column and compact left-hand contents index.
 */
export function LegalDocument({
  title,
  lastUpdated,
  tocLabel,
  sections,
}: LegalDocumentProps) {
  const tocItems = sections.map((section) => ({
    id: section.id,
    label: section.title,
  }))

  return (
    <main className="w-full" id="main-content">
      <section className="content-frame py-12 md:py-20">
        <div className="grid grid-cols-1 gap-x-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,640px)_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <nav
              aria-label={`${tocLabel} sections`}
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
            <header className="pb-8 md:pb-10">
              <Hero
                className="text-balance leading-[0.96]"
                size={{ base: TextSize.XXXL, md: TextSize.Display }}
              >
                {title}
              </Hero>
              <Text className="mt-8" color="tertiary" size={TextSize.Small}>
                Last updated{' '}
                <time dateTime={lastUpdated.iso}>{lastUpdated.label}</time>
              </Text>
            </header>

            <div className="flex flex-col gap-7 md:gap-8">
              {sections.map((section) => {
                const headingId = `${section.id}-heading`
                return (
                  <section
                    aria-labelledby={headingId}
                    className="flex scroll-mt-32 flex-col gap-4"
                    id={section.id}
                    key={section.id}
                  >
                    {section.number == null ? (
                      <h2 className="sr-only" id={headingId}>
                        {section.title}
                      </h2>
                    ) : (
                      <Text
                        as="h2"
                        className="text-pretty"
                        id={headingId}
                        size={{ base: TextSize.Medium, md: TextSize.Large }}
                      >
                        {section.number}. {section.title}
                      </Text>
                    )}
                    {section.body}
                  </section>
                )
              })}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
