'use client'

import { useEffect, useRef } from 'react'

/** A single shortcut: which key (optionally + Cmd/Ctrl), and what to do when it fires. */
export interface HotkeyBinding {
  /** Character to match, case-insensitive (compared against event.key). */
  key: string
  /** Require the Cmd (mac) / Ctrl (win+linux) modifier. @default false (bare key) */
  mod?: boolean
  handler: (event: KeyboardEvent) => void
}

export interface UseHotkeysOptions {
  /** Turn all shortcuts off (e.g. while a modal you own is open). @default true */
  enabled?: boolean
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/** True when focus is in a text-entry context (don't fire while typing). */
function isEditableTarget(event: KeyboardEvent): boolean {
  const target = event.composedPath()[0]
  if (!(target instanceof Element)) {
    return false
  }
  return (
    EDITABLE_TAGS.has(target.tagName) ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

/**
 * True when an OPEN, VISIBLE modal owns the keyboard. Not `[role="menu"]` (the
 * always-mounted Base UI nav would disable shortcuts for good); visibility is
 * required so a closed `<dialog>` left in the DOM doesn't suppress everything.
 */
function aModalIsOpen(): boolean {
  const modal = document.querySelector<HTMLElement>(
    'dialog[open], [role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]',
  )
  return modal !== null && modal.offsetParent !== null
}

/**
 * Global keyboard shortcuts (a single key, optionally + the Cmd/Ctrl `mod`).
 * Mirrors use-scroll-spy: one window subscription in a single effect, a ref so
 * fresh handlers never re-subscribe, and a joined-string dep key so the listener
 * re-attaches only when the key SET changes.
 *
 * Matches `event.key` (the character typed, layout-aware) so the key that types
 * "a" fires on QWERTY/AZERTY/QWERTZ/Dvorak alike - not `event.code` (physical
 * position). keyCode is deprecated, kept only as the IME 229 sentinel.
 */
export function useHotkeys(
  bindings: HotkeyBinding[],
  options: UseHotkeysOptions = {},
): void {
  const { enabled = true } = options

  const bindingsRef = useRef(bindings)
  bindingsRef.current = bindings

  // '\0' can't collide with a single-char key; re-attach only on a key-set change.
  const keysKey = bindings.map((b) => b.key.toLowerCase()).join('\0')

  useEffect(() => {
    if (!enabled) {
      return
    }

    const matchKeys = keysKey ? new Set(keysKey.split('\0')) : new Set<string>()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return
      }
      if (event.isComposing || event.keyCode === 229) {
        return // IME / CJK composition
      }
      // Shift/Alt are never part of our shortcuts (Shift+A is a different intent).
      // Cmd/Ctrl is opt-in per binding via `mod`; CapsLock is fine (not a flag).
      if (event.altKey || event.shiftKey) {
        return
      }
      if (isEditableTarget(event) || aModalIsOpen()) {
        return
      }

      const pressed = event.key.toLowerCase()
      if (!matchKeys.has(pressed)) {
        return
      }
      // Cmd (mac) / Ctrl (win+linux) is the "mod" key; a bare binding wants none.
      const mod = event.metaKey || event.ctrlKey
      const binding = bindingsRef.current.find(
        (b) => b.key.toLowerCase() === pressed && (b.mod ?? false) === mod,
      )
      if (!binding) {
        return
      }
      event.preventDefault()
      binding.handler(event)
    }

    // Capture phase: fire before element handlers that call stopPropagation.
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
    }
  }, [keysKey, enabled])
}
