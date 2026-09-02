'use client'

import { useEffect, useRef } from 'react'

import { cn } from '#lib/cn'
import { BelieverCardLines } from './lines'
import { BelieverCardLinesAlign } from './types'

/**
 * Which slice of the shared row-wide pattern this card reveals; the `-2px`
 * cancels the clip wrapper's inset. Applied to both copies so they register.
 */
const linesAlignClass: Record<BelieverCardLinesAlign, string> = {
  [BelieverCardLinesAlign.Start]: 'left-[-2px]',
  [BelieverCardLinesAlign.Center]: 'left-1/2 -translate-x-1/2',
  [BelieverCardLinesAlign.End]: 'right-[-2px]',
}

const linesClass = 'absolute top-[-2px] h-[447.85px] w-[1343.5px] max-w-none'

/**
 * Hover strength of the highlight, per card (keyed by `lines` = row position).
 * The first two cards (red, dark green) hold full opacity; the third (olive)
 * eases down so the highlight reads consistently against each accent fill.
 */
const highlightHoverClass: Record<BelieverCardLinesAlign, string> = {
  [BelieverCardLinesAlign.Start]:
    'group-data-[hovering=true]/believer-lines:opacity-100',
  [BelieverCardLinesAlign.Center]:
    'group-data-[hovering=true]/believer-lines:opacity-100',
  [BelieverCardLinesAlign.End]:
    'group-data-[hovering=true]/believer-lines:opacity-80',
}

/**
 * Lines layer + cursor-following highlight: a dim soft-light base grid, plus a
 * brighter copy revealed only inside a radial spotlight that trails the pointer.
 *
 * Tracked on `window` since the layer is `pointer-events:none`, then lerped each
 * frame so the spotlight trails rather than snaps. The highlight's mask isolates
 * it from the soft-light backdrop, so it reads as a crisp lit grid. Clipped 2px
 * inside the card so the grid never bleeds through the frame stroke; plain
 * `overflow-hidden` keeps the base's soft-light blend (no stacking context).
 */
export function BelieverCardLinesLayer({
  highlighted,
  lines,
}: {
  /** Whether the card is carrying the active color treatment. */
  highlighted: boolean
  /** Which slice of the shared lines pattern this card reveals. */
  lines: BelieverCardLinesAlign
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !highlighted) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const smoothing = prefersReducedMotion ? 1 : 0.14

    let raf = 0
    let targetX = 0
    let targetY = 0
    let curX = 0
    let curY = 0
    let hasPointer = false

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const rect = el.getBoundingClientRect()
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom

      if (inside) {
        targetX = e.clientX - rect.left
        targetY = e.clientY - rect.top
        if (!hasPointer) {
          curX = targetX
          curY = targetY
          hasPointer = true
          el.dataset.hovering = 'true'
        }
      } else if (hasPointer) {
        hasPointer = false
        el.dataset.hovering = 'false'
      }
    }

    const tick = () => {
      curX += (targetX - curX) * smoothing
      curY += (targetY - curY) * smoothing
      el.style.setProperty('--believer-lines-x', `${curX}px`)
      el.style.setProperty('--believer-lines-y', `${curY}px`)
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [highlighted])

  const spotlightMask =
    'radial-gradient(280px circle at var(--believer-lines-x) var(--believer-lines-y), black 0%, transparent 70%)'

  return (
    <div
      ref={ref}
      data-hovering="false"
      className={cn(
        'group/believer-lines pointer-events-none absolute inset-[2px] overflow-hidden rounded-[22px] transition-opacity duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
        highlighted ? 'opacity-100' : 'opacity-25',
      )}
      style={{
        ['--believer-lines-x' as string]: '-9999px',
        ['--believer-lines-y' as string]: '-9999px',
      }}
    >
      {/* Dim base: always visible, soft-light against the card. */}
      <BelieverCardLines
        className={cn(
          linesClass,
          'mix-blend-soft-light',
          linesAlignClass[lines],
        )}
      />
      {/* Highlight: same grid, masked to the spotlight, fading in on hover. */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-300 ease-out',
          highlightHoverClass[lines],
        )}
        style={{ maskImage: spotlightMask, WebkitMaskImage: spotlightMask }}
      >
        <BelieverCardLines className={cn(linesClass, linesAlignClass[lines])} />
      </div>
    </div>
  )
}
BelieverCardLinesLayer.displayName = 'BelieverCardLinesLayer'
