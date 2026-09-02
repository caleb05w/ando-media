import { IconArrowUpRight } from '#components/icon'
import { Surface, SurfaceRadius, SurfaceVariant } from '#components/surface'
import { Display, Text, Title } from '#components/text'
import { cn } from '#lib/cn'
import { ClaudeStoryMark, NewOntologiesStoryMark } from './marks'
import type { StoriesSectionProps, Story } from './types'

const DEFAULT_HEADING = 'Featured stories'

const DEFAULT_STORIES: Story[] = [
  {
    date: 'April 26, 2026',
    href: 'https://claude.com/blog/claude-managed-agents-memory',
    image: <ClaudeStoryMark />,
    source: 'Claude',
    title: 'Built-in memory for Claude Managed Agents',
  },
  {
    date: 'April 26, 2026',
    href: 'https://www.new-ontologies.com/posts/Ando',
    image: <NewOntologiesStoryMark />,
    source: 'New Ontologies',
    title: 'Ando: Building Slack from Scratch',
  },
]

/**
 * "Featured stories": a `surface-secondary` card with a `Display` heading over a
 * list of external story links. 2-up from `md`, stacked below; padding ramps to
 * the 1728px frame at `xl`. Each link reveals an up-right arrow on hover/focus.
 */
export function StoriesSection({
  heading = DEFAULT_HEADING,
  stories = DEFAULT_STORIES,
  className,
  ref,
  ...props
}: StoriesSectionProps) {
  return (
    <section
      className={cn('flex w-full flex-col p-4 sm:p-6 lg:p-8', className)}
      ref={ref}
      {...props}
    >
      <Surface
        className="flex w-full flex-col gap-10 overflow-clip px-6 py-12 sm:gap-12 sm:px-10 sm:py-16 md:px-16 lg:gap-16 lg:px-24 lg:py-20 xl:px-40 xl:py-24"
        radius={SurfaceRadius.Small}
        variant={SurfaceVariant.Flat}
      >
        <Display className="text-balance" size={{ base: '3xl', lg: '4xl' }}>
          {heading}
        </Display>
        <ul className="flex w-full flex-col gap-6 md:flex-row md:gap-16">
          {stories.map((story) => (
            <li
              className="flex min-w-0 flex-1 border-border-subtle border-t pt-6 first:border-t-0 first:pt-0 md:border-t-0 md:pt-0"
              key={story.href}
            >
              {/* `-m-3 p-3` (+ width bump) pads the focus ring while keeping content column-aligned. */}
              <a
                className="group -m-3 flex w-[calc(100%+1.5rem)] flex-col items-start gap-8 rounded-2xl p-3 no-underline focus-ring"
                href={story.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="size-16 shrink-0">{story.image}</div>
                <div className="flex flex-col gap-4">
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Text as="span" size="md">
                        {story.source}
                      </Text>
                      <Text
                        as="span"
                        className="whitespace-nowrap"
                        color="tertiary"
                        size="md"
                      >
                        {story.date}
                      </Text>
                    </div>
                    <IconArrowUpRight className="mt-0.5 size-5 shrink-0 text-text-tertiary opacity-0 transition-opacity duration-150 ease-[ease] group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
                  </div>
                  <Title as="h3" className="max-w-96 text-pretty">
                    {story.title}
                  </Title>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </Surface>
    </section>
  )
}

StoriesSection.displayName = 'StoriesSection'
