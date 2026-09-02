'use client'

import { useEffect, useRef } from 'react'

import { imgSkyGrid } from '../assets/figma'

const gridClass =
  'pointer-events-none absolute inset-0 block h-full w-full object-cover'

/**
 * Sky grid with a cursor-following spotlight that reveals a brighter copy over
 * the dim soft-light base (mirrors the believer-card lines layer). Pointer is
 * tracked on `window` and lerped each frame so the spotlight trails the cursor.
 */
export function SkyGridLayer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

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
      el.style.setProperty('--sky-grid-x', `${curX}px`)
      el.style.setProperty('--sky-grid-y', `${curY}px`)
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  const spotlightMask =
    'radial-gradient(300px circle at var(--sky-grid-x) var(--sky-grid-y), black 0%, transparent 70%)'

  return (
    <div
      ref={ref}
      data-hovering="false"
      // No z-index here: a stacking context would isolate the base's soft-light
      // blend from the sky canvas; layer stays behind the window via DOM order.
      className="group/sky-grid pointer-events-none absolute inset-0"
      style={{
        ['--sky-grid-x' as string]: '-9999px',
        ['--sky-grid-y' as string]: '-9999px',
      }}
    >
      {/* Dim base: always visible, soft-light against the live sky. */}
      <img
        src={imgSkyGrid}
        alt=""
        aria-hidden
        className={`${gridClass} mix-blend-soft-light`}
      />
      {/* Highlight: same grid, masked to the spotlight, fading in on hover. */}
      <img
        src={imgSkyGrid}
        alt=""
        aria-hidden
        className={`${gridClass} opacity-0 transition-opacity duration-300 ease-out group-data-[hovering=true]/sky-grid:opacity-100`}
        style={{ maskImage: spotlightMask, WebkitMaskImage: spotlightMask }}
      />
    </div>
  )
}
SkyGridLayer.displayName = 'SkyGridLayer'
