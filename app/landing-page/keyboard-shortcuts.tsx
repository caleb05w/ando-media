'use client'

import { useRouter } from 'next/navigation'

import { useHotkeys } from '@repo/design-system-ui/lib/use-hotkeys'

/** Single source of truth for the keycap label, `aria-keyshortcuts`, and the binding. */
export const GET_ACCESS_HOTKEY = 'A'

/**
 * Site-wide shortcuts (renders nothing). Bare "A" opens the verified waitlist
 * entry point on every page, whether or not a "Get access" button is present.
 *
 * `useHotkeys` already ignores the key while typing in a field or while the
 * dialog itself is open, so "A" never fires mid-edit or re-triggers in-flow.
 */
export function KeyboardShortcuts() {
  const router = useRouter()
  useHotkeys([
    { key: GET_ACCESS_HOTKEY, handler: () => router.push('/waitlist') },
  ])

  return null
}
