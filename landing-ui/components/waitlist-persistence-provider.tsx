'use client'

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@repo/design-system-ui/button'
import { Dialog } from '@repo/design-system-ui/dialog'
import { IconCheckCircle2, IconSize } from '@repo/design-system-ui/icon'
import {
  TEXT_BODY_SIZE,
  Text,
  TextColor,
  TextFont,
  TextSize,
} from '@repo/design-system-ui/text'
import {
  DONE_STEP,
  type WaitlistAdvance,
  type WaitlistAnswers,
  type WaitlistBeforeAdvanceResult,
  type WaitlistBeforeOpenResult,
  type WaitlistProgress,
  WaitlistProvider,
} from '@repo/design-system-ui/waitlist-flow'

const SUBMISSION_ID_STORAGE_KEY = 'ando:waitlist-submission-id'
const SAVE_DEBOUNCE_MS = 500
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

interface WaitlistProgressResponse {
  alreadyJoined?: unknown
  answers?: unknown
  completed?: unknown
  savedAt?: unknown
  stepIndex?: unknown
  submissionId?: unknown
}

type SaveProgressResult =
  | { data?: WaitlistProgressResponse; ok: true }
  | { ok: false }

function readSubmissionId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return window.sessionStorage.getItem(SUBMISSION_ID_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeSubmissionId(submissionId: string): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.sessionStorage.setItem(SUBMISSION_ID_STORAGE_KEY, submissionId)
  } catch {
    // sessionStorage can be unavailable in private modes; the server still
    // deduplicates by email, so this only affects same-session targeting.
  }
}

function clearTimer(timer: ReturnType<typeof setTimeout> | null): void {
  if (timer != null) {
    clearTimeout(timer)
  }
}

function hasSavableEmail(answers: WaitlistAnswers): boolean {
  const email = answers.email
  return typeof email === 'string' && EMAIL_PATTERN.test(email.trim())
}

function isWaitlistAnswers(value: unknown): value is WaitlistAnswers {
  if (typeof value !== 'object' || value == null || Array.isArray(value)) {
    return false
  }
  return Object.values(value).every(
    (answer) =>
      typeof answer === 'string' ||
      (Array.isArray(answer) &&
        answer.every((item) => typeof item === 'string')),
  )
}

function clampStep(step: unknown): number | null {
  return typeof step === 'number' && Number.isFinite(step)
    ? Math.min(Math.max(Math.trunc(step), 0), DONE_STEP)
    : null
}

function responseAnswers(
  response: WaitlistProgressResponse | undefined,
  fallback: WaitlistAnswers,
): WaitlistAnswers {
  return isWaitlistAnswers(response?.answers) ? response.answers : fallback
}

function responseStep(
  response: WaitlistProgressResponse | undefined,
): number | null {
  return clampStep(response?.stepIndex)
}

function responseAlreadyJoined(
  response: WaitlistProgressResponse | undefined,
): boolean {
  return response?.alreadyJoined === true
}

function progressFromAdvance(advance: WaitlistAdvance): WaitlistProgress {
  return {
    answers: advance.answers,
    step: advance.toStep,
    stepId: advance.toStepId,
  }
}

function CompletedWaitlistDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Popup
        className="h-auto min-h-[360px] rounded-none border border-border-default font-sans shadow-none md:h-auto md:min-h-0 md:max-w-lg"
        label="Waitlist complete"
      >
        <Dialog.Header end={<Dialog.Close className="rounded-none" />} />
        <Dialog.Body className="items-center justify-center px-6 py-12 text-center md:py-16">
          <div className="flex size-16 items-center justify-center rounded-full bg-surface-success text-text-inverse">
            <IconCheckCircle2 size={IconSize.Large} />
          </div>
          <Text
            as="h2"
            className="mt-8"
            font={TextFont.Sans}
            size={{ base: TextSize.XL, md: TextSize.XXL }}
            weight="medium"
          >
            You’re all set.
          </Text>
          <Text
            className="mt-4 max-w-sm"
            color={TextColor.Tertiary}
            size={TEXT_BODY_SIZE}
          >
            You already completed the waitlist form. We’ll be in touch soon.
          </Text>
          <Button
            className="mt-10 rounded-none"
            onClick={() => onOpenChange(false)}
            size={ButtonSize.Medium}
            variant={ButtonVariant.Primary}
          >
            Close
          </Button>
        </Dialog.Body>
      </Dialog.Popup>
    </Dialog>
  )
}

function AlreadyJoinedWaitlistDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Popup
        className="h-auto min-h-[340px] rounded-none border border-border-default font-sans shadow-none md:h-auto md:min-h-0 md:max-w-lg"
        label="Already on waitlist"
      >
        <Dialog.Header end={<Dialog.Close className="rounded-none" />} />
        <Dialog.Body className="items-center justify-center px-6 py-12 text-center md:py-14">
          <div className="flex size-16 items-center justify-center rounded-full bg-surface-success text-text-inverse">
            <IconCheckCircle2 size={IconSize.Large} />
          </div>
          <Text
            as="h2"
            className="mt-8"
            font={TextFont.Sans}
            size={{ base: TextSize.XL, md: TextSize.XXL }}
            weight="medium"
          >
            You’re already on the list.
          </Text>
          <Text
            className="mt-4 max-w-sm"
            color={TextColor.Tertiary}
            size={TEXT_BODY_SIZE}
          >
            We found an earlier signup for this email. Keep going to update your
            answers for the new form.
          </Text>
          <Button
            className="mt-10 rounded-none"
            onClick={() => onOpenChange(false)}
            size={ButtonSize.Medium}
            variant={ButtonVariant.Primary}
          >
            Update answers
          </Button>
        </Dialog.Body>
      </Dialog.Popup>
    </Dialog>
  )
}

export function WaitlistPersistenceProvider({
  children,
}: {
  children: ReactNode
}) {
  const [alreadyJoinedDialogOpen, setAlreadyJoinedDialogOpen] = useState(false)
  const [completedDialogOpen, setCompletedDialogOpen] = useState(false)
  const alreadyJoinedNoticeEmailRef = useRef<string | null>(null)
  const submissionIdRef = useRef<string | null>(readSubmissionId())
  const latestProgressRef = useRef<WaitlistProgress | null>(null)
  const lastStepRef = useRef<number | null>(null)
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveProgress = useCallback(
    async (progress: WaitlistProgress): Promise<SaveProgressResult> => {
      if (!hasSavableEmail(progress.answers)) {
        return { ok: true } satisfies SaveProgressResult
      }

      const request: Promise<SaveProgressResult> = saveQueueRef.current.then(
        async () => {
          let response: Response
          try {
            response = await fetch('/api/waitlist/progress', {
              body: JSON.stringify({
                answers: progress.answers,
                stepId: progress.stepId,
                stepIndex: progress.step,
                submissionId: submissionIdRef.current ?? undefined,
              }),
              headers: { 'Content-Type': 'application/json' },
              method: 'POST',
            })
          } catch {
            return { ok: false } satisfies SaveProgressResult
          }

          if (!response.ok) {
            return { ok: false } satisfies SaveProgressResult
          }

          const body = (await response.json()) as WaitlistProgressResponse
          if (typeof body.submissionId === 'string') {
            submissionIdRef.current = body.submissionId
            writeSubmissionId(body.submissionId)
          }
          return { data: body, ok: true } satisfies SaveProgressResult
        },
      )

      saveQueueRef.current = request.catch(() => undefined)
      return request
    },
    [],
  )

  const showAlreadyJoinedDialog = useCallback(
    (
      response: WaitlistProgressResponse | undefined,
      fallback: WaitlistAnswers,
    ) => {
      if (!responseAlreadyJoined(response) || response?.completed === true) {
        return
      }

      const answers = responseAnswers(response, fallback)
      const email =
        typeof answers.email === 'string'
          ? answers.email.trim().toLowerCase()
          : ''
      const noticeKey = email === '' ? 'unknown' : email
      if (alreadyJoinedNoticeEmailRef.current === noticeKey) {
        return
      }

      alreadyJoinedNoticeEmailRef.current = noticeKey
      setAlreadyJoinedDialogOpen(true)
    },
    [],
  )

  const scheduleProgressSave = useCallback(
    (progress: WaitlistProgress) => {
      latestProgressRef.current = progress

      if (!hasSavableEmail(progress.answers)) {
        return
      }

      const stepChanged = lastStepRef.current !== progress.step
      lastStepRef.current = progress.step
      clearTimer(timerRef.current)

      if (stepChanged) {
        timerRef.current = null
        void saveProgress(progress)
        return
      }

      timerRef.current = setTimeout(() => {
        const latest = latestProgressRef.current
        timerRef.current = null
        if (latest != null) {
          void saveProgress(latest)
        }
      }, SAVE_DEBOUNCE_MS)
    },
    [saveProgress],
  )

  const flushProgress = useCallback(
    async (
      progress: WaitlistProgress,
      {
        gate,
        waitForResponse = false,
      }: { gate: boolean; waitForResponse?: boolean },
    ): Promise<SaveProgressResult> => {
      latestProgressRef.current = progress
      clearTimer(timerRef.current)
      timerRef.current = null

      if (!hasSavableEmail(progress.answers)) {
        return { ok: true } satisfies SaveProgressResult
      }

      if (gate || waitForResponse || submissionIdRef.current == null) {
        return saveProgress(progress)
      }

      void saveProgress(progress)
      return { ok: true } satisfies SaveProgressResult
    },
    [saveProgress],
  )

  const handleBeforeOpen = useCallback(
    async (progress: WaitlistProgress): Promise<WaitlistBeforeOpenResult> => {
      const result = await flushProgress(progress, {
        gate: submissionIdRef.current == null,
        waitForResponse: true,
      })
      if (!result.ok) {
        return false
      }
      if (result.data?.completed === true) {
        setCompletedDialogOpen(true)
        return { open: false }
      }
      showAlreadyJoinedDialog(result.data, progress.answers)
      const step = responseStep(result.data)
      if (result.data != null) {
        return {
          answers: responseAnswers(result.data, progress.answers),
          step: Math.max(step ?? progress.step, progress.step),
        }
      }
      return true
    },
    [flushProgress, showAlreadyJoinedDialog],
  )

  const handleBeforeAdvance = useCallback(
    async (advance: WaitlistAdvance): Promise<WaitlistBeforeAdvanceResult> => {
      const result = await flushProgress(progressFromAdvance(advance), {
        gate: submissionIdRef.current == null,
        waitForResponse: true,
      })
      if (!result.ok) {
        return false
      }
      if (result.data?.completed === true) {
        setCompletedDialogOpen(true)
        return { advance: false, close: true }
      }
      showAlreadyJoinedDialog(result.data, advance.answers)
      const step = responseStep(result.data)
      if (
        responseAlreadyJoined(result.data) &&
        step != null &&
        advance.fromStepId === 'email'
      ) {
        return {
          answers: responseAnswers(result.data, advance.answers),
          step,
        }
      }
      if (step != null && step > advance.toStep) {
        return {
          answers: responseAnswers(result.data, advance.answers),
          step,
        }
      }
      return true
    },
    [flushProgress, showAlreadyJoinedDialog],
  )

  useEffect(() => {
    return () => clearTimer(timerRef.current)
  }, [])

  return (
    <>
      <WaitlistProvider
        onBeforeAdvance={handleBeforeAdvance}
        onBeforeOpen={handleBeforeOpen}
        onProgressChange={scheduleProgressSave}
      >
        {children}
      </WaitlistProvider>
      <CompletedWaitlistDialog
        onOpenChange={setCompletedDialogOpen}
        open={completedDialogOpen}
      />
      <AlreadyJoinedWaitlistDialog
        onOpenChange={setAlreadyJoinedDialogOpen}
        open={alreadyJoinedDialogOpen}
      />
    </>
  )
}

WaitlistPersistenceProvider.displayName = 'WaitlistPersistenceProvider'
