'use client'

import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

/** The advance/retreat arrow keys for each axis. */
const ORIENTATION_KEYS = {
  vertical: { next: 'ArrowDown', prev: 'ArrowUp' },
  horizontal: { next: 'ArrowRight', prev: 'ArrowLeft' },
} as const

/** Anything focusable-by-default we'd want arrows to land on. */
const DEFAULT_SELECTOR = 'a[href], button:not([disabled])'

export interface ArrowFocusOptions {
  /** CSS selector for the navigable items. @default 'a[href], button:not([disabled])' */
  selector?: string
  /** Which arrows move focus. `both` accepts either axis. @default 'vertical' */
  orientation?: 'vertical' | 'horizontal' | 'both'
  /** Wrap past the ends (last -> first, first -> last). @default true */
  wrap?: boolean
}

/**
 * Roving-focus arrow navigation for a container's `onKeyDown`. On the matching
 * arrow keys, moves focus to the next/previous item (matched by `selector`)
 * inside `event.currentTarget`; from outside the set, the advance key lands on
 * the first item and the retreat key on the last. Other keys are left untouched
 * (Tab, Escape, typing, etc.).
 *
 * Returns `true` when it moved focus (and called `preventDefault`), so a caller
 * can branch on it; ignoring the return value is fine.
 */
export function arrowFocusNavigate(
  event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent,
  options: ArrowFocusOptions = {},
): boolean {
  const {
    selector = DEFAULT_SELECTOR,
    orientation = 'vertical',
    wrap = true,
  } = options

  const axes =
    orientation === 'both'
      ? [ORIENTATION_KEYS.vertical, ORIENTATION_KEYS.horizontal]
      : [ORIENTATION_KEYS[orientation]]

  let direction: 1 | -1 | 0 = 0
  for (const axis of axes) {
    if (event.key === axis.next) direction = 1
    else if (event.key === axis.prev) direction = -1
  }
  if (direction === 0) return false

  const container = event.currentTarget
  if (!(container instanceof HTMLElement)) return false
  const items = Array.from(container.querySelectorAll<HTMLElement>(selector))
  if (items.length === 0) return false

  event.preventDefault()

  const current = items.indexOf(document.activeElement as HTMLElement)
  let next: number
  if (current === -1) {
    // No item focused yet: enter from the matching end.
    next = direction === 1 ? 0 : items.length - 1
  } else {
    next = current + direction
    if (wrap) {
      next = (next + items.length) % items.length
    } else if (next < 0 || next >= items.length) {
      return true // At an end without wrap: consume the key, stay put.
    }
  }
  items[next]?.focus()
  return true
}
