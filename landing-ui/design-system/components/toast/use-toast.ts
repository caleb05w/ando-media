import { useCallback, useEffect, useRef, useState } from 'react'

import type { ToastState } from './types'

/** How long a pill stays up before it auto-dismisses, in ms. */
const DEFAULT_DURATION = 2000

/**
 * Owns a single transient toast: its message, the AnimatePresence id, and the
 * auto-dismiss timer. Feed the returned `toast` to `<Toast>`.
 *
 * `showToast` restarts the clock on every call. While a pill is already up it
 * keeps the same id (so the pill updates in place instead of remounting -
 * remounting would replay the ~700ms blur-up exit and lag the next entrance on
 * rapid resubmits); once the pill has cleared, the next call mints a new id so
 * the entrance plays again.
 */
export function useToast(duration: number = DEFAULT_DURATION): {
  toast: ToastState | null
  showToast: (message: string) => void
  clearToast: () => void
} {
  const [toast, setToast] = useState<ToastState | null>(null)
  const idRef = useRef(0)

  // Each new toast (new object identity) restarts the clock.
  useEffect(() => {
    if (toast == null) {
      return
    }
    const timer = setTimeout(() => setToast(null), duration)
    return () => clearTimeout(timer)
  }, [toast, duration])

  const showToast = useCallback((message: string) => {
    setToast((prev) => {
      if (prev != null) {
        return { id: prev.id, message }
      }
      idRef.current += 1
      return { id: idRef.current, message }
    })
  }, [])

  const clearToast = useCallback(() => setToast(null), [])

  return { toast, showToast, clearToast }
}
