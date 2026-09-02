'use client'

import Image from 'next/image'
import { useImperativeHandle, useRef, useState } from 'react'

import { IconChevronLeftMedium, IconChevronRightMedium } from '#components/icon'
import { Text, TextColor, TextFont, TextSize } from '#components/text'
import { cn } from '#lib/cn'
import { AccelLogo } from '../believer-card/media/accel-logo'
import { EmergenceLogo } from '../believer-card/media/emergence-logo'
import { IndexVenturesLogo } from '../believer-card/media/index-ventures-logo'
import ivanZhou from '../believer-card/media/ivan-zhou.webp'
import santiSubotovsky from '../believer-card/media/santi-subotovsky.webp'
import sofiaDolfe from '../believer-card/media/sofia-dolfe.webp'
import type { Believer, BelieversSectionProps } from './types'

/** The three investor perspectives shown in the About-page carousel. */
const DEFAULT_BELIEVERS: Believer[] = [
  {
    avatar: <Image alt="" src={sofiaDolfe} />,
    logo: <IndexVenturesLogo aria-hidden="true" />,
    name: 'Sofia Dolfe',
    organization: 'Index Ventures',
    quote:
      '“Ando is to become the interface layer where teams and AI systems coordinate at scale.”',
  },
  {
    avatar: <Image alt="" src={ivanZhou} />,
    logo: <AccelLogo aria-hidden="true" />,
    name: 'Ivan Zhou',
    organization: 'Accel',
    quote:
      '“The next generation of teams will need messaging designed around humans and agents.”',
  },
  {
    avatar: <Image alt="" src={santiSubotovsky} />,
    logo: <EmergenceLogo aria-hidden="true" />,
    name: 'Santi Subotovsky',
    organization: 'Emergence Capital',
    quote:
      '“We believe the next era of productivity requires a platform built for real human–AI collaboration.”',
  },
]

/**
 * One investor quote at a time, with deliberate visitor-controlled navigation.
 * Every quote remains mounted in the same grid cell so the stage never jumps
 * in height as the active item changes.
 */
export function BelieversSection({
  believers = DEFAULT_BELIEVERS,
  className,
  ref,
  ...props
}: BelieversSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  useImperativeHandle(ref, () => sectionRef.current as HTMLElement)

  const count = believers.length
  const activeIndex = active % Math.max(count, 1)

  const selectPrevious = () => {
    setActive((current) => (current - 1 + count) % count)
  }

  const selectNext = () => {
    setActive((current) => (current + 1) % count)
  }

  return (
    <section
      aria-label="Investor perspectives"
      className={cn('w-full', className)}
      ref={sectionRef}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-[768px] flex-col items-center justify-center py-2.5 text-center">
        {count === 0 ? null : (
          <>
            <div aria-live="polite" className="grid w-full">
              {believers.map((believer, index) => (
                <figure
                  aria-hidden={index !== activeIndex}
                  className={cn(
                    'col-start-1 row-start-1 flex flex-col items-center justify-center transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transform-none motion-reduce:transition-opacity',
                    index === activeIndex
                      ? 'relative z-10 translate-y-0 opacity-100'
                      : 'pointer-events-none translate-y-1 opacity-0',
                  )}
                  key={believer.name}
                >
                  <div className="mb-6 flex h-6 items-center justify-center [&_svg]:h-full [&_svg]:w-auto [&_svg]:overflow-visible [&_svg]:brightness-0 md:mb-8 md:h-7">
                    {believer.logo}
                  </div>
                  <blockquote className="w-full">
                    <Text
                      as="p"
                      className="text-balance leading-[1.08]"
                      font={TextFont.Display}
                      size={{
                        base: TextSize.Large,
                        md: TextSize.XXL,
                        lg: TextSize.XXXL,
                      }}
                    >
                      {believer.quote}
                    </Text>
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 text-left md:mt-8">
                    <span className="size-9 shrink-0 overflow-hidden rounded-full bg-surface-secondary [&_img]:size-full [&_img]:object-cover">
                      {believer.avatar}
                    </span>
                    <span className="flex flex-col">
                      <Text
                        as="span"
                        size={{ base: TextSize.Small, md: TextSize.Medium }}
                      >
                        {believer.name}
                      </Text>
                      <Text
                        as="span"
                        color={TextColor.Tertiary}
                        size={TextSize.XS}
                      >
                        {believer.organization}
                      </Text>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>

            {count > 1 ? (
              <div className="relative z-20 mt-6 flex items-center gap-4 md:mt-8">
                <button
                  aria-label="Previous quote"
                  className="focus-ring inline-flex size-9 items-center justify-center rounded-sm text-text-tertiary transition-[color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-text-primary active:scale-[0.97] motion-reduce:transition-colors"
                  onClick={selectPrevious}
                  type="button"
                >
                  <IconChevronLeftMedium />
                </button>
                <Text
                  as="span"
                  className="min-w-12 font-mono"
                  color={TextColor.Tertiary}
                  size={TextSize.XS}
                >
                  {String(activeIndex + 1).padStart(2, '0')} /{' '}
                  {String(count).padStart(2, '0')}
                </Text>
                <button
                  aria-label="Next quote"
                  className="focus-ring inline-flex size-9 items-center justify-center rounded-sm text-text-tertiary transition-[color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-text-primary active:scale-[0.97] motion-reduce:transition-colors"
                  onClick={selectNext}
                  type="button"
                >
                  <IconChevronRightMedium />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}

BelieversSection.displayName = 'BelieversSection'
