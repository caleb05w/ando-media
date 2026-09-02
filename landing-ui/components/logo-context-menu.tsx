'use client'

import type { MouseEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import {
  IconArrowUpRight,
  IconCheckmark1Medium,
  IconSize,
} from '@repo/design-system-ui/icon'

const MENU_WIDTH = 208
const MENU_HEIGHT = 90
const VIEWPORT_MARGIN = 8

type LogoContextMenuState = {
  x: number
  y: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function CopyIcon() {
  return (
    <span aria-hidden className="relative block size-4">
      <span className="absolute top-0 right-0 size-2.5 border border-current" />
      <span className="absolute bottom-0 left-0 size-2.5 border border-current bg-surface-primary" />
    </span>
  )
}

function handleMenuNavigation(event: ReactKeyboardEvent<HTMLDivElement>) {
  if (!['ArrowDown', 'ArrowUp', 'End', 'Home'].includes(event.key)) {
    return
  }

  event.preventDefault()
  const items = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]',
    ),
  )
  if (items.length === 0) {
    return
  }

  const currentIndex = items.indexOf(
    document.activeElement as HTMLButtonElement,
  )
  let nextIndex = 0
  if (event.key === 'End') {
    nextIndex = items.length - 1
  } else if (event.key === 'ArrowDown') {
    nextIndex = (currentIndex + 1) % items.length
  } else if (event.key === 'ArrowUp') {
    nextIndex = (currentIndex - 1 + items.length) % items.length
  }
  items[nextIndex]?.focus()
}

/** Adds a compact two-action context menu to each site logo. */
export function useLogoContextMenu() {
  const rootRef = useRef<HTMLAnchorElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<LogoContextMenuState | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!menu) {
      return
    }

    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus({ preventScroll: true })

    const close = () => setMenu(null)
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
        rootRef.current?.focus({ preventScroll: true })
      }
    }

    window.addEventListener('pointerdown', close)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [menu])

  const onContextMenu = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) {
      return
    }

    event.preventDefault()
    const logoRect = event.currentTarget.getBoundingClientRect()
    const requestedX = event.clientX || logoRect.left
    const requestedY = event.clientY || logoRect.bottom + 4
    const maxX = Math.max(
      VIEWPORT_MARGIN,
      window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN,
    )
    const maxY = Math.max(
      VIEWPORT_MARGIN,
      window.innerHeight - MENU_HEIGHT - VIEWPORT_MARGIN,
    )

    setCopied(false)
    setMenu({
      x: clamp(requestedX, VIEWPORT_MARGIN, maxX),
      y: clamp(requestedY, VIEWPORT_MARGIN, maxY),
    })
  }

  const menuNode = menu ? (
    <div
      aria-label="Ando logo actions"
      className="fixed z-[100] w-52 divide-y divide-border-subtle border border-border-default bg-surface-primary p-1 shadow-[0_10px_28px_rgba(0,0,0,0.08)]"
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={handleMenuNavigation}
      onPointerDown={(event) => event.stopPropagation()}
      ref={menuRef}
      role="menu"
      style={{ left: menu.x, top: menu.y }}
    >
      <button
        className="flex h-10 w-full cursor-pointer items-center justify-between gap-4 px-3 text-left font-sans text-size-sm text-text-secondary transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-hover hover:text-text-primary focus-visible:bg-surface-hover focus-visible:text-text-primary focus-visible:outline-none active:scale-[0.98] motion-reduce:transition-none"
        onClick={(event) => {
          event.stopPropagation()
          const href = rootRef.current?.href
          if (href != null) {
            window.open(href, '_blank', 'noopener,noreferrer')
          }
          setMenu(null)
        }}
        role="menuitem"
        type="button"
      >
        <span>Open in new tab</span>
        <IconArrowUpRight
          aria-hidden
          className="shrink-0 text-icon-secondary"
          size={IconSize.Small}
        />
      </button>
      <button
        className="flex h-10 w-full cursor-pointer items-center justify-between gap-4 px-3 text-left font-sans text-size-sm text-text-secondary transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-hover hover:text-text-primary focus-visible:bg-surface-hover focus-visible:text-text-primary focus-visible:outline-none active:scale-[0.98] motion-reduce:transition-none"
        onClick={async (event) => {
          event.stopPropagation()
          const svg = rootRef.current?.querySelector('svg')
          if (!(svg instanceof SVGSVGElement)) {
            return
          }

          const markup = svg.hasAttribute('xmlns')
            ? svg.outerHTML
            : svg.outerHTML.replace(
                '<svg',
                '<svg xmlns="http://www.w3.org/2000/svg"',
              )
          await navigator.clipboard.writeText(markup)
          setCopied(true)
          window.setTimeout(() => setMenu(null), 350)
        }}
        role="menuitem"
        type="button"
      >
        <span>Copy SVG logo</span>
        {copied ? (
          <IconCheckmark1Medium
            aria-hidden
            className="shrink-0 text-icon-primary"
            size={IconSize.Small}
          />
        ) : (
          <span className="shrink-0 text-icon-secondary">
            <CopyIcon />
          </span>
        )}
      </button>
    </div>
  ) : null

  return { menuNode, onContextMenu, rootRef }
}
