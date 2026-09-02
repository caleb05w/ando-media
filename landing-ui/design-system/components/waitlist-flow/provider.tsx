'use client'

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'

import { readWaitlistDraft, writeWaitlistDraft } from './draft-storage'
import { stepIdFor } from './screens'
import type {
  WaitlistAnswers,
  WaitlistBeforeOpenResult,
  WaitlistOpenOverride,
  WaitlistProgress,
} from './types'
import { WaitlistFlow, type WaitlistFlowProps } from './waitlist-flow'

/** Options for `useWaitlist()` - which screen to open on, and any seeded answers. */
export interface OpenWaitlistOptions {
  /** Screen index to open on (0 = the email screen). @default 0 */
  step?: number
  /** Pre-filled answers, e.g. `{ email }` from the hero field. @default {} */
  answers?: WaitlistAnswers
  /** Start a fresh, non-persisted session for an explicitly controlled preview. */
  preview?: boolean
}

/** Opens the waitlist dialog from the site's email entry points. */
export type OpenWaitlist = (options?: OpenWaitlistOptions) => Promise<boolean>

const WaitlistContext = createContext<OpenWaitlist | null>(null)

function isOpenOverride(
  result: WaitlistBeforeOpenResult | undefined,
): result is WaitlistOpenOverride {
  return typeof result === 'object' && result !== null
}

/**
 * Hosts a single `WaitlistFlow` and hands every descendant an `openWaitlist`
 * function via `useWaitlist()`. Wrap the page content so the navigation "Get
 * access" button and other email entry points drive the one dialog.
 *
 * Opening updates the requested `step` / `answers` and flips the dialog open;
 * `WaitlistFlow` re-seeds itself from those on the close->open edge (without a
 * remount, so the Dialog keeps its enter animation). That's how the hero opens
 * straight onto the name screen with the email already filled.
 *
 * `onJoin` / `onBonus` are the two submit boundaries (fired at the confirmation
 * and the end); wire them to persist each payload once there's a backend.
 *
 * Progress (the furthest screen reached + the answers so far) is persisted
 * session-scoped and read back when the dialog reopens, so a half-filled form
 * resumes where the user left off - across closes and across page navigations,
 * landing on the last screen with the prior ones replayable. The draft lives
 * outside React state (no per-keystroke render of the page tree under the
 * provider); only opening reads it.
 *
 * Explicit preview sessions start clean and bypass persistence hooks so local
 * design and flow QA do not depend on a configured backend.
 */
export function WaitlistProvider({
  children,
  onJoin,
  onBonus,
  onBeforeOpen,
  onBeforeAdvance,
  onProgressChange,
}: {
  children: ReactNode
  onJoin?: WaitlistFlowProps['onJoin']
  onBonus?: WaitlistFlowProps['onBonus']
  onBeforeOpen?: (
    progress: WaitlistProgress,
  ) => WaitlistBeforeOpenResult | Promise<WaitlistBeforeOpenResult>
  onBeforeAdvance?: WaitlistFlowProps['onBeforeAdvance']
  onProgressChange?: WaitlistFlowProps['onProgressChange']
}) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<{
    step: number
    answers: WaitlistAnswers
    preview: boolean
  }>({ step: 0, answers: {}, preview: false })

  const openWaitlist = useCallback<OpenWaitlist>(
    async (options) => {
      // Resume the saved draft: reopen on the furthest screen reached with the
      // answers so far. A caller-supplied step/answers wins (e.g. the hero opens
      // straight onto the name screen with its freshly typed email).
      const preview = options?.preview === true
      const draft = preview ? { answers: {}, step: 0 } : readWaitlistDraft()
      const nextConfig = {
        step: options?.step ?? draft.step,
        answers: { ...draft.answers, ...options?.answers },
      }
      const openResult = preview
        ? true
        : ((await onBeforeOpen?.({
            answers: nextConfig.answers,
            step: nextConfig.step,
            stepId: stepIdFor(nextConfig.step),
          })) ?? true)
      if (openResult === false) {
        return false
      }
      if (isOpenOverride(openResult) && openResult.open === false) {
        return false
      }
      const resolvedConfig = isOpenOverride(openResult)
        ? {
            step: openResult.step ?? nextConfig.step,
            answers: {
              ...nextConfig.answers,
              ...openResult.answers,
            },
            preview,
          }
        : { ...nextConfig, preview }
      setConfig(resolvedConfig)
      setOpen(true)
      return true
    },
    [onBeforeOpen],
  )

  const handleProgressChange = useCallback(
    (progress: WaitlistProgress) => {
      writeWaitlistDraft(progress)
      onProgressChange?.(progress)
    },
    [onProgressChange],
  )

  return (
    <WaitlistContext.Provider value={openWaitlist}>
      {children}
      <WaitlistFlow
        initialAnswers={config.answers}
        initialStep={config.step}
        onBonus={onBonus}
        onBeforeAdvance={config.preview ? undefined : onBeforeAdvance}
        onJoin={onJoin}
        onOpenChange={setOpen}
        onProgressChange={config.preview ? undefined : handleProgressChange}
        open={open}
      />
    </WaitlistContext.Provider>
  )
}

/**
 * Returns `openWaitlist(options?)`. Must be called under a `WaitlistProvider`.
 */
export function useWaitlist(): OpenWaitlist {
  const context = useContext(WaitlistContext)
  if (context == null) {
    throw new Error('useWaitlist must be used within a <WaitlistProvider>')
  }
  return context
}
