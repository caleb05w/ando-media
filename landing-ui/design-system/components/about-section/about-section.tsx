'use client'

import { useInView, useReducedMotion } from 'motion/react'
import { type KeyboardEvent, useCallback, useRef, useState } from 'react'

import { cn } from '#lib/cn'
import { BringYourOwnAgents } from './cards/bring-your-own-agents'
import { LetThemChimeIn } from './cards/let-them-chime-in'
import { ShareContext } from './cards/share-context'
import { FeatureCard } from './feature-card'
import type { AboutSectionProps } from './types'

/**
 * AboutSection - the "About Ando" feature row: three FeatureCards, each with a
 * live product-UI preview above its caption.
 *
 * The cards perform in sequence, left to right: one card is "active" at a time
 * and plays its animation, then hands off to the next via `onDone`. The
 * highlight (taller card, blue ring, caption sat lower) follows the active card
 * so the focused styling itself tells you which preview is currently running.
 * On desktop exactly one card is always the tall 512px, so the row height stays
 * constant as the spotlight moves.
 *
 * The sequence only runs while the section is in view and motion is allowed;
 * otherwise every card renders its settled (finished) state with the first card
 * highlighted.
 */
export function AboutSection({ className, ...props }: AboutSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { margin: '-15%' })
  const reduceMotion = useReducedMotion()
  const [active, setActive] = useState(0)

  const playing = isInView && !reduceMotion
  const advance = useCallback(() => setActive((a) => (a + 1) % 3), [])
  const selectCard = useCallback((index: number) => setActive(index), [])
  const selectCardWithKeyboard = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, index: number) => {
      if (
        event.key !== 'Enter' &&
        event.key !== ' ' &&
        event.key !== 'Spacebar'
      ) {
        return
      }

      event.preventDefault()
      selectCard(index)
    },
    [selectCard],
  )

  return (
    <section
      ref={ref}
      className={cn(
        // `md:min-h-[512px]` pins the row to the tall-card height so the section
        // never sags when both cards dip below 512px mid-transition (which would
        // shift the whole container); the shorter card just centers inside it.
        'flex flex-col gap-2 md:min-h-[512px] md:flex-row md:items-center',
        className,
      )}
      {...props}
    >
      <FeatureCard
        aria-label="Show Bring your own agents"
        aria-pressed={active === 0}
        className="md:min-w-0 md:flex-1"
        description="Add your existing cloud or CLI agents to Ando so they can work alongside you. Note: Ando isn’t an agent orchestration platform."
        heading="Bring your own agents"
        highlighted={active === 0}
        onClick={() => selectCard(0)}
        onKeyDown={(event) => selectCardWithKeyboard(event, 0)}
        role="button"
        tabIndex={0}
      >
        <BringYourOwnAgents active={playing && active === 0} onDone={advance} />
      </FeatureCard>

      <FeatureCard
        aria-label="Show Share context"
        aria-pressed={active === 1}
        className="md:min-w-0 md:flex-1"
        description="Conversations, decisions, files, and tools are all in one place so agents understand the work around them, not just the last message they were sent."
        heading="Share context"
        highlighted={active === 1}
        onClick={() => selectCard(1)}
        onKeyDown={(event) => selectCardWithKeyboard(event, 1)}
        role="button"
        tabIndex={0}
      >
        <ShareContext active={playing && active === 1} onDone={advance} />
      </FeatureCard>

      <FeatureCard
        aria-label="Show Let them chime in"
        aria-pressed={active === 2}
        className="md:min-w-0 md:flex-1"
        description="Agents can proactively hop into conversations and threads when they have something useful to add. They abide by the etiquette they observe."
        heading="Let them chime in"
        highlighted={active === 2}
        onClick={() => selectCard(2)}
        onKeyDown={(event) => selectCardWithKeyboard(event, 2)}
        role="button"
        tabIndex={0}
      >
        <LetThemChimeIn active={playing && active === 2} onDone={advance} />
      </FeatureCard>
    </section>
  )
}

AboutSection.displayName = 'AboutSection'
