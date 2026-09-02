'use client'

import { useEffect, useRef, useState } from 'react'

/** Options for {@link useScrollSpy}. */
export interface UseScrollSpyOptions {
  /**
   * Ids of the section elements to track, in document order. The list must be
   * referentially comparable by value (a new array with the same ids is fine);
   * the observer is only rebuilt when the set of ids actually changes.
   */
  ids: string[]
  /**
   * `IntersectionObserver` `rootMargin` defining the activation band - the slice
   * of the viewport in which a section counts as "current". The default is a
   * tall band whose top edge is pinned a fixed 80px below the viewport top -
   * just past where a clicked section comes to rest (its `scroll-margin-top`) -
   * so the active section is the topmost one whose box reaches past that line.
   * Anchoring the top edge in pixels rather than as a viewport percentage keeps
   * even short sections selectable at every viewport height: a percentage band
   * sits a fixed *fraction* down the viewport, so on tall screens it can fall
   * entirely below a short section once it is scrolled to the top, leaving the
   * next (taller) section as the topmost match - the off-by-one this avoids.
   * @default '-80px 0px 0px 0px'
   */
  rootMargin?: string
  /** Turn the observer off (e.g. when the active section is controlled). */
  enabled?: boolean
  /** Active id used for the server render and until the observer first runs. */
  defaultActiveId?: string | null
  /** Called whenever the detected active section changes. */
  onChange?: (id: string | null) => void
}

/**
 * Tracks which section is currently in view as the page scrolls (scroll-spy).
 *
 * Built on `IntersectionObserver` rather than a scroll listener, so there are no
 * per-frame layout reads. When several sections sit in the activation band at
 * once it picks the topmost in document order; when none do it keeps the last
 * active section (rather than flickering to nothing). A short final section that
 * never reaches the band is pinned once the page is scrolled to the bottom.
 */
export function useScrollSpy({
  ids,
  rootMargin = '-80px 0px 0px 0px',
  enabled = true,
  defaultActiveId = null,
  onChange,
}: UseScrollSpyOptions): string | null {
  const [activeId, setActiveId] = useState<string | null>(defaultActiveId)

  // Mirror of `activeId` so the observer/scroll callbacks can compare against
  // the current value without re-subscribing, and a stable handle to the latest
  // `onChange` so passing a fresh callback each render never rebuilds the observer.
  const activeRef = useRef<string | null>(defaultActiveId)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Join the ids so the effect re-runs only when the *set* changes, not when the
  // caller passes a fresh array of identical ids. Newline is a safe separator:
  // element ids (which also feed `#id` hrefs and getElementById) never hold one.
  const idsKey = ids.join('\n')

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') {
      return
    }

    const sectionIds = idsKey ? idsKey.split('\n') : []
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) {
      return
    }

    const intersecting = new Map<string, boolean>()

    const commit = (next: string | null) => {
      if (next === activeRef.current) {
        return
      }
      activeRef.current = next
      setActiveId(next)
      onChangeRef.current?.(next)
    }

    const sync = () => {
      const topmost = sectionIds.find((id) => intersecting.get(id)) ?? null
      if (topmost) {
        commit(topmost)
        return
      }
      // Nothing in the band: pin the last section at the very bottom of the
      // page (a short final section can never reach the band), otherwise keep
      // the previous active section.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4
      if (atBottom) {
        commit(sectionIds.at(-1) ?? activeRef.current)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          intersecting.set(entry.target.id, entry.isIntersecting)
        }
        sync()
      },
      { rootMargin, threshold: 0 },
    )
    for (const el of elements) {
      observer.observe(el)
    }

    // The observer only fires on band crossings, so it cannot react to the final
    // pixels of scroll where a short last section rests below the band. A passive,
    // rAF-throttled pass re-evaluates just that bottom case; it reads the cached
    // intersection map (no per-section layout work).
    let frame = 0
    const onScroll = () => {
      if (frame) {
        return
      }
      frame = requestAnimationFrame(() => {
        frame = 0
        sync()
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) {
        cancelAnimationFrame(frame)
      }
    }
  }, [idsKey, rootMargin, enabled])

  return activeId
}
