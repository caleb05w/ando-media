'use client'

import {
  type KeyboardEvent,
  type MouseEvent,
  useId,
  useRef,
  useState,
} from 'react'

import { Eyebrow, Text, TextColor, TextSize } from '#components/text'
import { cn, cva } from '#lib/cn'
import type { TableOfContentsProps } from './types'
import { useScrollSpy } from './use-scroll-spy'

const linkVariants = cva(
  [
    'flex h-8 items-center rounded-md px-3',
    // Hover/focus highlight instead of an outline ring (instant background).
    'outline-none hover:bg-surface-hover focus-visible:bg-surface-hover',
    'motion-reduce:transition-none',
  ],
  {
    defaultVariants: { active: false, width: 'full' },
    variants: {
      active: {
        // Fast fade-in; the slow fade-out leaves a staggered wake on long jumps.
        true: 'text-text-primary [transition:color_100ms_ease]',
        false: 'text-text-tertiary [transition:color_800ms_ease]',
      },
      width: {
        // Highlight spans the rail, or hugs the label (capped at the rail width).
        full: 'w-full',
        fit: 'w-fit max-w-full',
      },
    },
  },
)

const NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End'])

/**
 * In-page section navigation (a "table of contents" / "on this page" rail):
 * links to a document's sections that highlight the one in view and
 * smooth-scroll to it on click (instant under `prefers-reduced-motion`).
 *
 * Active tracking is automatic via an `IntersectionObserver` scroll-spy on the
 * section elements named by each item's `id`; pass `activeId` to control it. Set
 * `scroll-margin-top` on the targets to clear a sticky header. The list is one
 * tab stop: arrows move between links (looping), Home/End jump to the ends.
 */
export function TableOfContents({
  items,
  label,
  activeId,
  onActiveChange,
  rootMargin,
  linkWidth = 'full',
  className,
  'aria-label': ariaLabel,
  ref,
  ...props
}: TableOfContentsProps) {
  const labelId = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const isControlled = activeId !== undefined

  const spiedId = useScrollSpy({
    ids: items.map((item) => item.id),
    enabled: !isControlled,
    rootMargin,
    defaultActiveId: items[0]?.id ?? null,
    onChange: onActiveChange,
  })

  const active = isControlled ? activeId : spiedId

  // Roving tabindex: one tab stop, on the current section until a link is focused.
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const tabbableId = focusedId ?? active ?? items[0]?.id ?? null

  // Arrow-key focus movement, looping at the ends.
  const moveFocus = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (!NAVIGATION_KEYS.has(event.key)) {
      return
    }
    const links = Array.from(
      listRef.current?.querySelectorAll<HTMLAnchorElement>('a[data-toc-id]') ??
        [],
    )
    if (links.length === 0) {
      return
    }
    const activeElement = document.activeElement
    const from =
      activeElement instanceof HTMLAnchorElement
        ? links.indexOf(activeElement)
        : -1
    let to: number
    switch (event.key) {
      case 'ArrowDown':
        to = from < 0 ? 0 : (from + 1) % links.length
        break
      case 'ArrowUp':
        to =
          from < 0 ? links.length - 1 : (from - 1 + links.length) % links.length
        break
      case 'Home':
        to = 0
        break
      default:
        to = links.length - 1
    }
    event.preventDefault()
    links[to]?.focus()
  }

  // Smooth-scroll on click; self-contained (honors `scroll-margin-top`, no global CSS).
  const scrollToSection = (event: MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle modified clicks (new tab/window, download).
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    const id = event.currentTarget.dataset.tocId
    const target = id ? document.getElementById(id) : null
    if (!(id && target)) {
      return
    }
    event.preventDefault()
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    target.scrollIntoView({
      behavior: reduceMotion ? 'instant' : 'smooth',
      block: 'start',
    })
    // Shareable URL; pushState moves no scroll, so it doesn't fight the animation.
    window.history.pushState(null, '', `#${id}`)
    // Focus stays on the link: the rail is persistent nav you keep using.
  }

  return (
    <nav
      aria-label={label ? undefined : (ariaLabel ?? 'On this page')}
      aria-labelledby={label ? labelId : undefined}
      className={cn('flex flex-col gap-4', className)}
      ref={ref}
      {...props}
    >
      {label ? <Eyebrow id={labelId}>{label}</Eyebrow> : null}
      <ul className="flex flex-col" ref={listRef}>
        {items.map((item) => {
          const isActive = item.id === active
          return (
            <li key={item.id}>
              <a
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  linkVariants({ active: isActive, width: linkWidth }),
                )}
                data-toc-id={item.id}
                href={`#${item.id}`}
                onClick={scrollToSection}
                onFocus={() => setFocusedId(item.id)}
                onKeyDown={moveFocus}
                tabIndex={item.id === tabbableId ? 0 : -1}
              >
                <Text
                  as="span"
                  className="min-w-0"
                  color={TextColor.Inherit}
                  size={TextSize.XS}
                  truncate
                >
                  {item.label}
                </Text>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

TableOfContents.displayName = 'TableOfContents'
