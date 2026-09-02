'use client'

import { useLayoutEffect, useRef, useState } from 'react'

import { TEXT_BODY_SIZE, Text } from '@repo/design-system-ui/text'

const SOURCE_URL = 'https://www.new-ontologies.com/posts/Ando'

/**
 * The homepage source paragraph and its responsive citation. Mobile keeps the
 * source in flow directly beneath the paragraph; desktop positions the same
 * source from the superscript's rendered box so it stays aligned when the
 * paragraph reflows or the webfont finishes loading.
 */
export function HomeMarginCitation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLElement>(null)
  const [noteTop, setNoteTop] = useState<number | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (container == null) {
      return
    }

    let active = true
    const measure = () => {
      if (
        !active ||
        containerRef.current == null ||
        markerRef.current == null
      ) {
        return
      }

      const containerRect = containerRef.current.getBoundingClientRect()
      const markerRect = markerRef.current.getBoundingClientRect()
      const nextTop = markerRect.top - containerRect.top
      setNoteTop((current) =>
        current != null && Math.abs(current - nextTop) < 0.5
          ? current
          : nextTop,
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    window.addEventListener('resize', measure)
    void document.fonts.ready.then(measure)

    return () => {
      active = false
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div className="relative mt-4" ref={containerRef}>
      <Text as="p" size={TEXT_BODY_SIZE}>
        Unfortunately, existing messaging platforms have held us back from what
        should be possible when people and agents are truly working in flow.
        This is why we are working on “the new Slack”
        <sup
          className="ml-0.5 align-super text-size-2xs text-text-tertiary md:text-size-xs"
          ref={markerRef}
        >
          <a
            aria-label="View source 1"
            className="rounded-sm hit-area-2 focus-ring xl:hidden"
            href="#ando-source-mobile"
          >
            1
          </a>
          <a
            aria-label="View source 1"
            className="hidden rounded-sm focus-ring xl:inline"
            href="#ando-source-desktop"
          >
            1
          </a>
        </sup>
      </Text>

      <aside
        aria-label="Source for the new Slack"
        className="mt-3 scroll-mt-24 font-sans text-size-sm text-text-secondary xl:hidden"
        id="ando-source-mobile"
      >
        <CitationLink />
      </aside>

      <aside
        aria-label="Source for the new Slack"
        className="absolute left-[calc(100%+2.5rem)] hidden w-[330px] font-sans text-size-sm text-text-secondary xl:block"
        id="ando-source-desktop"
        style={{
          top: noteTop ?? 0,
          visibility: noteTop == null ? 'hidden' : 'visible',
        }}
      >
        <CitationLink />
      </aside>
    </div>
  )
}

HomeMarginCitation.displayName = 'HomeMarginCitation'

function CitationLink() {
  return (
    <a
      className="underline underline-offset-2 transition-colors duration-150 hover:text-text-tertiary motion-reduce:transition-none"
      href={SOURCE_URL}
      rel="noreferrer"
      target="_blank"
    >
      <sup className="relative top-0 align-baseline text-size-2xs text-text-tertiary md:text-size-xs">
        1
      </sup>{' '}
      Nicole Seah, “Ando: Building Slack from Scratch,” New Ontologies, April
      21, 2026
    </a>
  )
}
