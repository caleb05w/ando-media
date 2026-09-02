import type { WaitlistAnswers } from './types'

// Persists the in-progress waitlist session so a half-filled form survives a
// close/reopen - even after navigating to another page. Scoped to the browser
// session (sessionStorage): the draft clears when the tab closes, so partial
// contact details don't linger indefinitely. Swap to localStorage if the draft
// should outlive the session.
const STORAGE_KEY = 'ando:waitlist-draft'

/** A remembered, in-progress waitlist session. */
export interface WaitlistDraft {
  /**
   * Furthest screen reached, so the flow reopens there with every prior screen
   * counted as visited (the header's back chevron replays them).
   */
  step: number
  /** The answers entered so far. */
  answers: WaitlistAnswers
}

const EMPTY_DRAFT: WaitlistDraft = { step: 0, answers: {} }

function isAnswers(value: unknown): value is WaitlistAnswers {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDraft(value: unknown): value is WaitlistDraft {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const draft = value as Record<string, unknown>
  return typeof draft.step === 'number' && isAnswers(draft.answers)
}

/** The saved draft, or an empty one (no saved session, or storage unavailable). */
export function readWaitlistDraft(): WaitlistDraft {
  if (typeof window === 'undefined') {
    return EMPTY_DRAFT
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw == null ? null : JSON.parse(raw)
    return isDraft(parsed) ? parsed : EMPTY_DRAFT
  } catch {
    // SSR, private mode, or malformed JSON: start from a clean draft.
    return EMPTY_DRAFT
  }
}

/** Saves the draft; best-effort (a no-op when storage is blocked/full). */
export function writeWaitlistDraft(draft: WaitlistDraft): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // Storage blocked (private mode) or full: persistence is best-effort.
  }
}
