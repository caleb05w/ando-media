'use client'

import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@repo/design-system-ui/button'
import { Reveal, STAGGER_BLOCK } from '@repo/design-system-ui/reveal'
import {
  Display,
  Text,
  TextColor,
  TextSize,
  TextWeight,
} from '@repo/design-system-ui/text'
import { TextField } from '@repo/design-system-ui/text-field'
import {
  useWaitlist,
  WAITLIST_AUTOFILL_SUPPRESSION_PROPS,
} from '@repo/design-system-ui/waitlist-flow'

import { CalendlyScheduler } from '@/components/waitlist/calendly-scheduler'
import type {
  WaitlistAccessResponse,
  WaitlistAnswerSummary,
  WaitlistCodeResponse,
  WaitlistInviteDetail,
  WaitlistInviteResponse,
  WaitlistOnboardingResponse,
  WaitlistStatusData,
  WaitlistVerificationResponse,
} from '@/lib/waitlist-status-types'
import { WAITLIST_PREVIEW_CODE_STORAGE_KEY } from '@/lib/waitlist-status-types'

const DEMO_CODE = '246810'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
const REFERRAL_MYSTERY_TARGET = 20
const REFERRAL_MYSTERY_STEPS = Array.from(
  { length: REFERRAL_MYSTERY_TARGET },
  (_, index) => index + 1,
)
const TEAM_ONBOARDING_TARGET = 5
const TEAM_ONBOARDING_STEPS = [1, 2, 3, 4, 5] as const
const UNLOCK_PARTICLES = [
  { color: '#7ebf9d', delay: 0, rotate: -24, x: -112, y: -70 },
  { color: '#f2b66d', delay: 35, rotate: 18, x: -78, y: -98 },
  { color: '#8caee8', delay: 65, rotate: -12, x: -38, y: -118 },
  { color: '#e98f88', delay: 15, rotate: 28, x: 4, y: -106 },
  { color: '#9d8ad0', delay: 50, rotate: -20, x: 48, y: -116 },
  { color: '#7ebf9d', delay: 80, rotate: 22, x: 91, y: -92 },
  { color: '#f2b66d', delay: 20, rotate: -16, x: 118, y: -56 },
  { color: '#8caee8', delay: 70, rotate: 14, x: -94, y: -38 },
  { color: '#e98f88', delay: 40, rotate: -28, x: 78, y: -42 },
] as const

const inputClassName =
  'h-12 rounded-none border border-border-default bg-transparent px-4 text-size-md shadow-none! md:h-12 md:px-4 md:text-size-md focus:border-text-strong'
const accessGateInputClassName =
  'h-[58px] rounded-none border border-border-default bg-transparent px-4 text-size-md shadow-none! md:h-[58px] md:px-4 md:text-size-md focus:border-text-strong'
const selectClassName =
  'focus-ring h-12 w-full appearance-none rounded-none border border-border-default bg-transparent px-4 text-size-md text-text-primary outline-none'
const textAreaClassName =
  'focus-ring min-h-32 w-full resize-y rounded-none border border-border-default bg-transparent px-4 py-3 text-size-md text-text-primary outline-none placeholder:text-text-tertiary'
const textActionClassName =
  'focus-ring cursor-pointer rounded-sm text-size-sm text-text-secondary underline decoration-border-default underline-offset-4 transition-colors duration-150 hover:text-text-primary hover:decoration-border-strong disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none'

type AccessStep = 'checking' | 'code' | 'email' | 'status'
type NoticeArea = 'invite' | 'onboarding' | 'settings' | 'work'
type WorkEmailStep = 'closed' | 'code' | 'email'

interface ActionNotice {
  area: NoticeArea
  message: string
  tone?: 'danger'
}

interface ApiErrorBody {
  error?: unknown
}

function demoStatus(): WaitlistStatusData {
  return {
    answers: {
      agents: ['Codex', 'Claude'],
      agentUsage: 'All day, every day',
      company: 'Ando',
      companySize: '11-50',
      communicationTool: 'Slack',
      linkedinUrl: 'https://linkedin.com/in/saradu',
      name: 'Sara Du',
      referralSource: 'Friend or colleague',
      role: 'Product and design',
      teammatesCount: '6-20',
      useCase:
        'Make it easier for agents and teammates to share context without duplicating work.',
    },
    contactEmail: 'sara@example.com',
    externalInvitesAccepted: 1,
    externalInviteUrl: 'http://localhost:3000/waitlist?ref=preview-sara',
    invites: [
      { email: 'mina@ando.so', kind: 'team', status: 'accepted' },
      { email: 'alex@example.com', kind: 'external', status: 'accepted' },
      { email: 'jordan@studio.co', kind: 'external', status: 'pending' },
    ],
    invitesAccepted: 2,
    invitesPending: 1,
    joinedAt: '2026-06-17T16:00:00.000Z',
    onboarding: { bookedAt: null, state: 'eligible' },
    priorityPoints: 4,
    teamDomain: 'ando.so',
    teamInvitesAccepted: 1,
    teamMembers: [
      { id: 'mina', initials: 'MK', name: 'Mina K.' },
      { id: 'jon', initials: 'JB', name: 'Jon B.' },
      { id: 'ari', initials: 'AP', name: 'Ari P.' },
      { id: 'noah', initials: 'NW', name: 'Noah W.' },
    ],
    teamSize: 5,
    teamVisible: true,
    workEmail: 'sara@ando.so',
  }
}

async function apiError(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null
  return typeof body?.error === 'string' ? body.error : fallback
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'there'
}

function domainFromEmail(email: string): string {
  return email.slice(email.lastIndexOf('@') + 1).toLowerCase()
}

function inviteEmailsFromInput(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  )
}

function initialAccessState(
  demo: boolean,
  initialStep: 'code' | 'email',
): AccessStep {
  if (demo) {
    return 'email'
  }
  return initialStep === 'code' ? 'code' : 'checking'
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Text
      as="label"
      className="mb-2 block"
      color={TextColor.Secondary}
      size={TextSize.Small}
    >
      {children}
    </Text>
  )
}

function InlineNotice({
  area,
  notice,
}: {
  area: NoticeArea
  notice: ActionNotice | null
}) {
  if (notice?.area !== area) {
    return null
  }

  return (
    <Text
      className={notice.tone === 'danger' ? 'text-text-danger' : undefined}
      color={notice.tone === 'danger' ? undefined : TextColor.Secondary}
      role="status"
      size={TextSize.Small}
    >
      {notice.message}
    </Text>
  )
}

function UnlockedIcon() {
  return (
    <svg
      aria-hidden
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Unlocked</title>
      <path
        d="M6.25 8V6.75a3.75 3.75 0 0 1 7.22-1.43M5.25 8h9.5v8h-9.5V8Z"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.4"
      />
    </svg>
  )
}

function UnlockCelebration({ onComplete }: { onComplete: () => void }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {UNLOCK_PARTICLES.map((particle, index) => (
        <span
          className="waitlist-unlock-particle"
          key={`${particle.x}-${particle.y}`}
          onAnimationEnd={
            index === UNLOCK_PARTICLES.length - 1 ? onComplete : undefined
          }
          style={
            {
              '--unlock-rotate': `${particle.rotate}deg`,
              '--unlock-x': `${particle.x}px`,
              '--unlock-y': `${particle.y}px`,
              animationDelay: `${particle.delay}ms`,
              backgroundColor: particle.color,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

function InviteBreakdown({
  externalAccepted,
  invites,
  pending,
  teamAccepted,
}: {
  externalAccepted: number
  invites: WaitlistInviteDetail[]
  pending: number
  teamAccepted: number
}) {
  const tooltipId = useId()
  const detailGroups = [
    {
      emails: invites
        .filter(
          (invite) => invite.kind === 'team' && invite.status === 'accepted',
        )
        .map((invite) => invite.email),
      label: 'Teammates',
    },
    {
      emails: invites
        .filter(
          (invite) =>
            invite.kind === 'external' && invite.status === 'accepted',
        )
        .map((invite) => invite.email),
      label: 'Outside your team',
    },
    {
      emails: invites
        .filter((invite) => invite.status === 'pending')
        .map((invite) => invite.email),
      label: 'Pending',
    },
  ]
  const hasEmailDetails = detailGroups.some((group) => group.emails.length > 0)

  return (
    <div className="group relative mt-2 inline-block">
      <button
        aria-describedby={tooltipId}
        className="focus-ring cursor-help rounded-sm border-border-strong border-b border-dotted py-1 text-left text-size-sm text-text-secondary transition-colors duration-150 hover:text-text-primary motion-reduce:transition-none"
        type="button"
      >
        {teamAccepted} teammate{teamAccepted === 1 ? '' : 's'} ·{' '}
        {externalAccepted} outside your team · {pending} pending
      </button>
      <div
        className="pointer-events-none invisible absolute bottom-full left-0 z-20 mb-2 w-[min(320px,calc(100vw-3rem))] border border-border-default bg-surface-primary p-3 opacity-0 shadow-lg transition-[opacity,visibility] duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100 motion-reduce:transition-none md:right-full md:bottom-auto md:left-auto md:top-1/2 md:mr-3 md:mb-0 md:-translate-y-1/2"
        id={tooltipId}
        role="tooltip"
      >
        {hasEmailDetails ? (
          <div className="grid gap-3">
            {detailGroups
              .filter((group) => group.emails.length > 0)
              .map((group) => (
                <div key={group.label}>
                  <p className="text-size-xs text-text-tertiary">
                    {group.label}
                  </p>
                  <ul className="mt-1 grid gap-1">
                    {group.emails.map((email) => (
                      <li
                        className="break-all font-mono text-size-xs text-text-primary"
                        key={`${group.label}-${email}`}
                      >
                        {email}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-size-xs text-text-secondary">
            No invitation emails yet.
          </p>
        )}
      </div>
    </div>
  )
}

function GoalProgress({
  current,
  externalAccepted,
  invites,
  label,
  message,
  pending,
  steps,
  teamAccepted,
  total,
}: {
  current: number
  externalAccepted: number
  invites: WaitlistInviteDetail[]
  label: string
  message?: string
  pending: number
  steps: readonly number[]
  teamAccepted: number
  total: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <Text weight={TextWeight.Medium}>{label}</Text>
        <Text color={TextColor.Secondary} size={TextSize.Small}>
          {current} of {total}
        </Text>
      </div>
      <div
        aria-label={`${current} of ${total} ${label.toLowerCase()}`}
        className="mt-4 grid gap-1.5"
        role="img"
        style={{
          gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
        }}
      >
        {steps.map((step) => (
          <span
            className={`h-1.5 ${step <= current ? 'bg-border-strong' : 'bg-border-default'}`}
            key={step}
          />
        ))}
      </div>
      {message != null && (
        <Text
          className="mt-3"
          color={TextColor.Secondary}
          size={TextSize.Small}
        >
          {message}
        </Text>
      )}
      <InviteBreakdown
        externalAccepted={externalAccepted}
        invites={invites}
        pending={pending}
        teamAccepted={teamAccepted}
      />
    </div>
  )
}

export function WaitlistExperience({
  autoOpenSignup,
  demo,
  forceNew,
  initialEmail,
  initialStep,
  referralCode,
}: {
  autoOpenSignup: boolean
  demo: boolean
  forceNew: boolean
  initialEmail: string
  initialStep: 'code' | 'email'
  referralCode: string
}) {
  const openWaitlist = useWaitlist()
  const [step, setStep] = useState<AccessStep>(() =>
    initialAccessState(demo || forceNew, initialStep),
  )
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [previewCode, setPreviewCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<WaitlistStatusData | null>(null)
  const autoOpenStartedRef = useRef(false)

  const loadStatus = useCallback(async (): Promise<boolean> => {
    if (demo) {
      setStatus(demoStatus())
      setStep('status')
      return true
    }
    const response = await fetch('/api/waitlist/status')
    if (!response.ok) {
      setStep('email')
      return false
    }
    setStatus((await response.json()) as WaitlistStatusData)
    setStep('status')
    return true
  }, [demo])

  useEffect(() => {
    if (!demo && !forceNew && initialStep !== 'code') {
      void loadStatus()
    }
  }, [demo, forceNew, initialStep, loadStatus])

  useEffect(() => {
    if (!autoOpenSignup || autoOpenStartedRef.current) {
      return
    }

    autoOpenStartedRef.current = true
    setBusy(true)
    void openWaitlist({
      answers: {
        email: initialEmail,
        referral_code: referralCode,
      },
      preview: forceNew,
      step: 1,
    }).then((opened) => {
      setBusy(false)
      if (!opened) {
        setError('Could not open the signup form. Try again.')
      }
    })
  }, [autoOpenSignup, forceNew, initialEmail, openWaitlist, referralCode])

  useEffect(() => {
    if (initialStep !== 'code') {
      return
    }
    const storedCode = window.sessionStorage.getItem(
      WAITLIST_PREVIEW_CODE_STORAGE_KEY,
    )
    if (storedCode != null) {
      setPreviewCode(storedCode)
      window.sessionStorage.removeItem(WAITLIST_PREVIEW_CODE_STORAGE_KEY)
    }
  }, [initialStep])

  useEffect(() => {
    if (step === 'status') {
      window.scrollTo({ behavior: 'auto', top: 0 })
    }
  }, [step])

  async function openSignup(signupEmail: string) {
    const opened = await openWaitlist({
      answers: {
        email: signupEmail,
        ...(referralCode === '' ? {} : { referral_code: referralCode }),
      },
      preview: forceNew,
      step: 1,
    })
    setBusy(false)
    if (!opened) {
      setError('Could not open the signup form. Try again.')
    }
  }

  async function requestCode() {
    const normalized = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(normalized)) {
      setError('Enter a valid email address.')
      return
    }

    setBusy(true)
    setError(null)
    if (forceNew) {
      await openSignup(normalized)
      return
    }
    if (demo) {
      setPreviewCode(DEMO_CODE)
      setStep('code')
      setBusy(false)
      return
    }

    const response = await fetch('/api/waitlist/access/request', {
      body: JSON.stringify({ email: normalized }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    if (!response.ok) {
      setError(await apiError(response, 'Could not send a verification code.'))
      setBusy(false)
      return
    }
    const body = (await response.json()) as WaitlistAccessResponse
    if (body.state === 'signup') {
      await openSignup(body.email)
      return
    }
    setPreviewCode(body.previewCode ?? null)
    setStep('code')
    setBusy(false)
  }

  async function verifyCode() {
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the six-digit code.')
      return
    }

    setBusy(true)
    setError(null)
    if (demo) {
      if (code !== DEMO_CODE) {
        setError('That code does not match.')
        setBusy(false)
        return
      }
      await loadStatus()
      setBusy(false)
      return
    }

    const response = await fetch('/api/waitlist/access/verify', {
      body: JSON.stringify({ code, email }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    if (!response.ok) {
      setError(await apiError(response, 'Could not verify that code.'))
      setBusy(false)
      return
    }
    const body = (await response.json()) as WaitlistVerificationResponse
    if (body.state === 'signup') {
      await openSignup(body.email)
      return
    }
    await loadStatus()
    setBusy(false)
  }

  return (
    <>
      {step === 'checking' && <CheckingState />}
      {(step === 'email' || step === 'code') && (
        <AccessGate
          busy={busy}
          code={code}
          demo={demo}
          email={email}
          error={error}
          onCodeChange={(value) => {
            setCode(value.replace(/\D/g, '').slice(0, 6))
            setError(null)
          }}
          onEmailChange={(value) => {
            setEmail(value)
            setError(null)
          }}
          onRequest={() => void requestCode()}
          onVerify={() => void verifyCode()}
          previewCode={previewCode}
          step={step}
        />
      )}
      {step === 'status' && status != null && (
        <StatusExperience
          demo={demo}
          onStatusChange={setStatus}
          status={status}
        />
      )}
    </>
  )
}

function CheckingState() {
  return (
    <main className="content-frame flex min-h-[70vh] items-center justify-center py-20">
      <Text color={TextColor.Tertiary}>Checking your waitlist status…</Text>
    </main>
  )
}

function AccessGate({
  busy,
  code,
  demo,
  email,
  error,
  onCodeChange,
  onEmailChange,
  onRequest,
  onVerify,
  previewCode,
  step,
}: {
  busy: boolean
  code: string
  demo: boolean
  email: string
  error: string | null
  onCodeChange: (value: string) => void
  onEmailChange: (value: string) => void
  onRequest: () => void
  onVerify: () => void
  previewCode: string | null
  step: 'code' | 'email'
}) {
  return (
    <main className="content-frame flex min-h-[calc(100dvh-80px)] items-center justify-center py-16 md:py-24">
      <div className="flex w-full max-w-[520px] flex-col items-center text-center">
        <Reveal>
          <Display
            className="font-sans text-balance leading-[1.05]"
            size={{ base: TextSize.XXL2, md: TextSize.XXXL }}
          >
            {step === 'email' ? 'Check your waitlist status' : 'Enter code'}
          </Display>
        </Reveal>

        <Reveal className="mt-8 w-full" delay={STAGGER_BLOCK}>
          <form
            autoComplete="off"
            data-1p-ignore
            data-bwignore="true"
            data-form-type="other"
            data-lpignore="true"
            data-protonpass-ignore="true"
            onSubmit={(event) => {
              event.preventDefault()
              if (step === 'email') {
                onRequest()
              } else {
                onVerify()
              }
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="min-w-0">
                <TextField
                  {...WAITLIST_AUTOFILL_SUPPRESSION_PROPS}
                  autoComplete={step === 'code' ? 'one-time-code' : 'off'}
                  className={
                    step === 'code'
                      ? `${accessGateInputClassName} font-mono tracking-[0.3em]`
                      : accessGateInputClassName
                  }
                  inputMode={step === 'code' ? 'numeric' : 'email'}
                  label={
                    step === 'email' ? 'Email address' : 'Verification code'
                  }
                  onValueChange={
                    step === 'email' ? onEmailChange : onCodeChange
                  }
                  placeholder={step === 'email' ? 'Enter your email' : '000000'}
                  showError={error != null}
                  showErrorMessage={false}
                  showSuccess={false}
                  type="text"
                  value={step === 'email' ? email : code}
                />
              </div>
              <Button
                className="w-full rounded-none border border-border-strong bg-surface-primary text-text-primary hover:bg-surface-hover hover:text-text-primary active:bg-surface-pressed"
                disabled={busy}
                isLoading={busy}
                size={ButtonSize.Large}
                type="submit"
                variant={ButtonVariant.Secondary}
              >
                {step === 'email' ? 'Continue' : 'Check status'}
              </Button>
            </div>

            {error != null && (
              <Text className="mt-3 text-text-danger" size={TextSize.Small}>
                {error}
              </Text>
            )}
            {step === 'code' && (
              <button
                className="focus-ring mt-5 cursor-pointer rounded-sm px-1 py-1 text-size-sm text-text-secondary transition-[color,opacity] duration-150 hover:text-text-primary disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
                disabled={busy}
                onClick={onRequest}
                type="button"
              >
                Resend code
              </button>
            )}
          </form>
        </Reveal>

        {step === 'code' && (demo || previewCode != null) && (
          <Reveal delay={2 * STAGGER_BLOCK}>
            <Text
              className="mt-6"
              color={TextColor.Tertiary}
              size={TextSize.Small}
            >
              {demo ? 'Local preview' : 'Local code'} · use code{' '}
              <span className="font-mono text-text-primary">
                {demo ? DEMO_CODE : previewCode}
              </span>
            </Text>
          </Reveal>
        )}
      </div>
    </main>
  )
}

function StatusExperience({
  demo,
  onStatusChange,
  status,
}: {
  demo: boolean
  onStatusChange: (status: WaitlistStatusData) => void
  status: WaitlistStatusData
}) {
  const [workStep, setWorkStep] = useState<WorkEmailStep>('closed')
  const [workEmail, setWorkEmail] = useState(status.workEmail ?? '')
  const [workCode, setWorkCode] = useState('')
  const [workPreviewCode, setWorkPreviewCode] = useState<string | null>(null)
  const [workError, setWorkError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false)
  const [notice, setNotice] = useState<ActionNotice | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingAnswers, setEditingAnswers] = useState(false)
  const [answers, setAnswers] = useState(status.answers)
  const [schedulerOpen, setSchedulerOpen] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const copyFeedbackTimeoutRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (copyFeedbackTimeoutRef.current != null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current)
      }
    },
    [],
  )

  async function refreshStatus() {
    if (demo) {
      return
    }
    const response = await fetch('/api/waitlist/status')
    if (response.ok) {
      onStatusChange((await response.json()) as WaitlistStatusData)
    }
  }

  async function requestWorkCode() {
    const normalized = workEmail.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(normalized)) {
      setWorkError('Enter a valid work email.')
      return
    }
    setBusyAction('work')
    setWorkError(null)
    if (demo) {
      setWorkPreviewCode(DEMO_CODE)
      setWorkStep('code')
      setBusyAction(null)
      return
    }
    const response = await fetch('/api/waitlist/work-email/request', {
      body: JSON.stringify({ email: normalized }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    if (!response.ok) {
      setWorkError(await apiError(response, 'Could not send the code.'))
      setBusyAction(null)
      return
    }
    const body = (await response.json()) as WaitlistCodeResponse
    setWorkPreviewCode(body.previewCode ?? null)
    setWorkStep('code')
    setBusyAction(null)
  }

  async function verifyWorkCode() {
    if (!/^\d{6}$/.test(workCode)) {
      setWorkError('Enter the six-digit code.')
      return
    }
    setBusyAction('work')
    setWorkError(null)
    if (demo) {
      if (workCode !== DEMO_CODE) {
        setWorkError('That code does not match.')
        setBusyAction(null)
        return
      }
      const normalized = workEmail.trim().toLowerCase()
      onStatusChange({
        ...status,
        priorityPoints:
          status.priorityPoints + (status.workEmail == null ? 2 : 0),
        teamDomain: domainFromEmail(normalized),
        workEmail: normalized,
      })
      setNotice({
        area: 'work',
        message: 'Work email verified. Your team connection is ready.',
      })
      setWorkStep('closed')
      setWorkCode('')
      setBusyAction(null)
      return
    }
    const response = await fetch('/api/waitlist/work-email/verify', {
      body: JSON.stringify({ code: workCode, email: workEmail }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    if (!response.ok) {
      setWorkError(await apiError(response, 'Could not verify that code.'))
      setBusyAction(null)
      return
    }
    await refreshStatus()
    setNotice({
      area: 'work',
      message: 'Work email verified. Your team connection is ready.',
    })
    setWorkStep('closed')
    setBusyAction(null)
  }

  async function sendInvite() {
    const emails = inviteEmailsFromInput(inviteEmail)
    const invalidEmails = emails.filter((email) => !EMAIL_PATTERN.test(email))
    if (emails.length === 0 || invalidEmails.length > 0) {
      setNotice({
        area: 'invite',
        message:
          emails.length > 1
            ? 'Enter valid email addresses separated by commas.'
            : 'Enter a valid email address first.',
        tone: 'danger',
      })
      return
    }
    setBusyAction('invite')
    setNotice(null)
    if (demo) {
      const invites = emails.map((email) => ({
        email,
        kind:
          status.teamDomain != null &&
          domainFromEmail(email) === status.teamDomain
            ? ('team' as const)
            : ('external' as const),
        status: 'pending' as const,
      }))
      onStatusChange({
        ...status,
        invites: [...status.invites, ...invites],
        invitesPending: status.invitesPending + invites.length,
      })
      setInviteEmail('')
      setNotice({
        area: 'invite',
        message: `${invites.length} invitation${invites.length === 1 ? '' : 's'} ready to share.`,
      })
      setBusyAction(null)
      return
    }

    const successes: WaitlistInviteResponse[] = []
    const failedEmails: string[] = []
    let firstErrorMessage: string | null = null
    for (const email of emails) {
      try {
        const response = await fetch('/api/waitlist/invites', {
          body: JSON.stringify({ email }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        if (!response.ok) {
          failedEmails.push(email)
          firstErrorMessage ??= await apiError(
            response,
            'Could not create the invitation.',
          )
          continue
        }
        successes.push((await response.json()) as WaitlistInviteResponse)
      } catch {
        failedEmails.push(email)
        firstErrorMessage ??= 'Could not create the invitation.'
      }
    }

    setInviteEmail(failedEmails.join(', '))
    if (successes.length === 0) {
      setNotice({
        area: 'invite',
        message: firstErrorMessage ?? 'Could not create the invitation.',
        tone: 'danger',
      })
      setBusyAction(null)
      return
    }

    if (failedEmails.length > 0) {
      setNotice({
        area: 'invite',
        message: `${successes.length} invitation${successes.length === 1 ? '' : 's'} sent. ${failedEmails.length} could not be sent.`,
        tone: 'danger',
      })
    } else if (successes.length === 1) {
      const invite = successes[0]
      if (invite == null) {
        setBusyAction(null)
        return
      }
      await navigator.clipboard.writeText(invite.inviteUrl).catch(() => {})
      let message = 'Referral invitation sent and link copied.'
      if (invite.previewDelivery) {
        message =
          'Invite link copied. Email delivery is not configured in this environment.'
      } else if (invite.kind === 'team') {
        message = 'Teammate invitation sent and link copied.'
      }
      setNotice({ area: 'invite', message })
    } else {
      const previewCount = successes.filter(
        (invite) => invite.previewDelivery,
      ).length
      setNotice({
        area: 'invite',
        message:
          previewCount === successes.length
            ? `${successes.length} invite links created. Email delivery is not configured in this environment.`
            : `${successes.length} invitations sent.`,
      })
    }
    setBusyAction(null)
    await refreshStatus()
  }

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(status.externalInviteUrl)
      setNotice(null)
      setInviteLinkCopied(true)
      if (copyFeedbackTimeoutRef.current != null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current)
      }
      copyFeedbackTimeoutRef.current = window.setTimeout(() => {
        setInviteLinkCopied(false)
        copyFeedbackTimeoutRef.current = null
      }, 1800)
    } catch {
      setNotice({
        area: 'invite',
        message: 'Could not copy the invite link.',
        tone: 'danger',
      })
    }
  }

  async function saveAnswers() {
    setBusyAction('answers')
    setNotice(null)
    if (demo) {
      onStatusChange({ ...status, answers })
      setEditingAnswers(false)
      setNotice({ area: 'settings', message: 'Answers updated.' })
      setBusyAction(null)
      return
    }
    const response = await fetch('/api/waitlist/status', {
      body: JSON.stringify(answers),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    })
    if (!response.ok) {
      setNotice({
        area: 'settings',
        message: await apiError(response, 'Could not save the answers.'),
        tone: 'danger',
      })
      setBusyAction(null)
      return
    }
    onStatusChange((await response.json()) as WaitlistStatusData)
    setEditingAnswers(false)
    setNotice({ area: 'settings', message: 'Answers updated.' })
    setBusyAction(null)
  }

  function unlockOnboarding(event: ReactMouseEvent<HTMLButtonElement>) {
    const shouldCelebrate =
      event.detail > 0 &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setNotice(null)
    setCelebrating(shouldCelebrate)
    setSchedulerOpen(true)

    window.setTimeout(
      () => {
        const scheduler = document.getElementById('onboarding-scheduler')
        scheduler?.focus({ preventScroll: true })
        scheduler?.scrollIntoView({
          behavior: shouldCelebrate ? 'smooth' : 'auto',
          block: 'start',
        })
      },
      shouldCelebrate ? 180 : 0,
    )
  }

  async function recordOnboardingBooking(booking: {
    eventUri: string
    inviteeUri: string
  }) {
    if (busyAction === 'onboarding') {
      return
    }
    setBusyAction('onboarding')
    setNotice(null)

    if (demo) {
      onStatusChange({
        ...status,
        onboarding: {
          bookedAt: new Date().toISOString(),
          state: 'scheduled',
        },
      })
      setSchedulerOpen(false)
      setCelebrating(false)
      setNotice({ area: 'onboarding', message: 'Onboarding scheduled.' })
      setBusyAction(null)
      return
    }

    const response = await fetch('/api/waitlist/onboarding', {
      body: JSON.stringify(booking),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    if (!response.ok) {
      setNotice({
        area: 'onboarding',
        message: await apiError(response, 'Could not save the booking.'),
        tone: 'danger',
      })
      setBusyAction(null)
      return
    }

    const body = (await response.json()) as WaitlistOnboardingResponse
    onStatusChange({ ...status, onboarding: body.onboarding })
    setSchedulerOpen(false)
    setCelebrating(false)
    setNotice({ area: 'onboarding', message: 'Onboarding scheduled.' })
    setBusyAction(null)
  }

  const connectedTeamSize =
    status.workEmail == null
      ? 0
      : (status.teamSize ?? status.teamMembers.length + 1)
  const visibleTeamProgress = Math.min(
    connectedTeamSize,
    TEAM_ONBOARDING_TARGET,
  )
  const teammatesUntilOnboarding = Math.max(
    0,
    TEAM_ONBOARDING_TARGET - connectedTeamSize,
  )
  const teamIsReady = teammatesUntilOnboarding === 0
  const onboardingState =
    status.onboarding?.state ?? (teamIsReady ? 'eligible' : 'locked')
  const visibleReferralProgress = Math.min(
    status.invitesAccepted,
    REFERRAL_MYSTERY_TARGET,
  )

  let teamProgressMessage = 'Add your work email to start matching your team.'
  if (onboardingState === 'completed') {
    teamProgressMessage = 'Onboarding complete.'
  } else if (onboardingState === 'scheduled') {
    teamProgressMessage = 'Onboarding scheduled.'
  } else if (status.workEmail != null && teamIsReady) {
    teamProgressMessage = 'Onboarding unlocked.'
  } else if (status.workEmail != null && teammatesUntilOnboarding === 1) {
    teamProgressMessage = 'Invite 1 more teammate to unlock onboarding.'
  } else if (status.workEmail != null) {
    teamProgressMessage = `Invite ${teammatesUntilOnboarding} more teammates to unlock onboarding.`
  }

  function openWorkEmailEditor() {
    setSettingsOpen(true)
    setWorkStep('email')
    setWorkError(null)
    setNotice(null)
  }

  function toggleSettings() {
    const nextOpen = !settingsOpen
    setSettingsOpen(nextOpen)
    setNotice(null)

    if (!nextOpen) {
      setWorkStep('closed')
      setEditingAnswers(false)
      setAnswers(status.answers)
    }
  }

  const inviteControls = (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void sendInvite()
        }}
      >
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <TextField
            className={inputClassName}
            label="Email addresses"
            multiple
            onValueChange={setInviteEmail}
            placeholder="person@company.com, person@example.com"
            showError={false}
            showSuccess={false}
            type="email"
            value={inviteEmail}
          />
          <Button
            className="h-12 rounded-none px-6"
            isLoading={busyAction === 'invite'}
            type="submit"
          >
            Invite →
          </Button>
        </div>
      </form>

      <div className="mt-4">
        <button
          aria-label={
            inviteLinkCopied ? 'Invite link copied' : 'Copy invite link'
          }
          className="focus-ring inline-flex cursor-pointer rounded-sm py-1 text-size-sm text-text-secondary underline decoration-border-default underline-offset-4 transition-colors duration-150 hover:text-text-primary hover:decoration-border-strong motion-reduce:transition-none"
          onClick={() => void copyReferralLink()}
          type="button"
        >
          <span aria-live="polite" className="grid text-left">
            <span
              className={`col-start-1 row-start-1 transition-opacity duration-150 motion-reduce:transition-none ${inviteLinkCopied ? 'opacity-0' : 'opacity-100'}`}
            >
              Copy invite link
            </span>
            <span
              className={`col-start-1 row-start-1 transition-opacity duration-150 motion-reduce:transition-none ${inviteLinkCopied ? 'opacity-100' : 'opacity-0'}`}
            >
              ✓ Copied
            </span>
          </span>
        </button>
      </div>

      {notice?.area === 'invite' && (
        <div className="mt-3">
          <InlineNotice area="invite" notice={notice} />
        </div>
      )}
    </>
  )

  return (
    <main>
      <section
        className="content-frame pt-10 pb-12 md:pt-16 md:pb-16"
        id="status"
      >
        <div className="mx-auto w-full max-w-[600px]">
          {teamIsReady ? (
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 size-2 shrink-0 rounded-full bg-surface-success"
              />
              <div>
                <Text
                  color={TextColor.Secondary}
                  size={TextSize.XXS}
                  uppercase
                  weight={TextWeight.Medium}
                >
                  Onboarding unlocked
                </Text>
                <Text
                  as="h1"
                  className="mt-2 text-balance leading-[1.05]"
                  size={{ base: TextSize.XXL, md: TextSize.XXXL }}
                >
                  Your workspace is ready
                </Text>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full bg-surface-success"
              />
              <Text
                as="h1"
                size={{ base: TextSize.Large, md: TextSize.XL }}
                weight={TextWeight.Medium}
              >
                You’re on the list, {firstName(status.answers.name)}.
              </Text>
            </div>
          )}
          <div className="mt-2 ml-5">
            <button
              aria-controls="waitlist-settings"
              aria-expanded={settingsOpen}
              className="focus-ring inline-flex items-center rounded-sm py-1 text-size-sm text-text-tertiary transition-colors duration-150 hover:text-text-primary motion-reduce:transition-none"
              onClick={toggleSettings}
              type="button"
            >
              <span>Manage waitlist details</span>
            </button>
          </div>

          {settingsOpen && (
            <div
              className="mt-3 border-border-default border-y"
              id="waitlist-settings"
            >
              <div className="py-5">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <Text
                      as="h3"
                      size={TextSize.Medium}
                      weight={TextWeight.Medium}
                    >
                      Work email
                    </Text>
                    <Text
                      className="mt-1"
                      color={TextColor.Tertiary}
                      size={TextSize.Small}
                    >
                      {status.workEmail ?? 'Not added yet'}
                    </Text>
                  </div>
                  {workStep === 'closed' && (
                    <button
                      className={`${textActionClassName} shrink-0`}
                      onClick={openWorkEmailEditor}
                      type="button"
                    >
                      {status.workEmail == null ? 'Add' : 'Edit'}
                    </button>
                  )}
                </div>

                {workStep !== 'closed' && (
                  <form
                    className="mt-4 border-border-default border-t pt-4"
                    onSubmit={(event) => {
                      event.preventDefault()
                      if (workStep === 'email') {
                        void requestWorkCode()
                      } else {
                        void verifyWorkCode()
                      }
                    }}
                  >
                    <FieldLabel>
                      {workStep === 'email'
                        ? 'Email address'
                        : 'Verification code'}
                    </FieldLabel>
                    <TextField
                      className={
                        workStep === 'code'
                          ? `${inputClassName} font-mono tracking-[0.3em]`
                          : inputClassName
                      }
                      inputMode={workStep === 'code' ? 'numeric' : 'email'}
                      label={
                        workStep === 'email'
                          ? 'Work email'
                          : 'Work email verification code'
                      }
                      onValueChange={(value) => {
                        if (workStep === 'email') {
                          setWorkEmail(value)
                        } else {
                          setWorkCode(value.replace(/\D/g, '').slice(0, 6))
                        }
                        setWorkError(null)
                      }}
                      placeholder={
                        workStep === 'email' ? 'you@company.com' : '000000'
                      }
                      showError={false}
                      showSuccess={false}
                      value={workStep === 'email' ? workEmail : workCode}
                    />
                    {workPreviewCode != null && workStep === 'code' && (
                      <Text
                        className="mt-3"
                        color={TextColor.Tertiary}
                        size={TextSize.Small}
                      >
                        Local code: {workPreviewCode}
                      </Text>
                    )}
                    {workError != null && (
                      <Text
                        className="mt-3 text-text-danger"
                        size={TextSize.Small}
                      >
                        {workError}
                      </Text>
                    )}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        className="rounded-none"
                        isLoading={busyAction === 'work'}
                        type="submit"
                      >
                        {workStep === 'email' ? 'Send code' : 'Verify email'}
                      </Button>
                      <button
                        className={textActionClassName}
                        onClick={() => {
                          setWorkStep('closed')
                          setWorkError(null)
                        }}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {notice?.area === 'work' && (
                  <div className="mt-3">
                    <InlineNotice area="work" notice={notice} />
                  </div>
                )}
              </div>

              <div className="border-border-default border-t py-5">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <Text
                      as="h3"
                      size={TextSize.Medium}
                      weight={TextWeight.Medium}
                    >
                      Previous answers
                    </Text>
                    {!editingAnswers && (
                      <Text
                        className="mt-1"
                        color={TextColor.Tertiary}
                        size={TextSize.Small}
                      >
                        Update the information from your original signup.
                      </Text>
                    )}
                  </div>
                  {!editingAnswers && (
                    <button
                      aria-expanded={false}
                      className={`${textActionClassName} shrink-0`}
                      onClick={() => setEditingAnswers(true)}
                      type="button"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingAnswers && (
                  <AnswersForm
                    answers={answers}
                    busy={busyAction === 'answers'}
                    onAnswersChange={setAnswers}
                    onCancel={() => {
                      setAnswers(status.answers)
                      setEditingAnswers(false)
                    }}
                    onSave={() => void saveAnswers()}
                  />
                )}
              </div>

              {notice?.area === 'settings' && (
                <div className="border-border-default border-t py-4">
                  <InlineNotice area="settings" notice={notice} />
                </div>
              )}
            </div>
          )}

          <div className="mt-8 scroll-mt-28" id="team">
            <div>
              {!teamIsReady && (
                <GoalProgress
                  current={visibleTeamProgress}
                  externalAccepted={status.externalInvitesAccepted}
                  invites={status.invites}
                  label={teamProgressMessage}
                  pending={status.invitesPending}
                  steps={TEAM_ONBOARDING_STEPS}
                  teamAccepted={status.teamInvitesAccepted}
                  total={TEAM_ONBOARDING_TARGET}
                />
              )}

              {status.workEmail == null && (
                <div className="mt-5">
                  <Button
                    className="w-full rounded-none"
                    onClick={openWorkEmailEditor}
                    type="button"
                  >
                    Add your work email
                  </Button>
                </div>
              )}

              {onboardingState === 'eligible' &&
                (!schedulerOpen || celebrating) && (
                  <div className="relative">
                    {celebrating && (
                      <UnlockCelebration
                        onComplete={() => setCelebrating(false)}
                      />
                    )}
                    <Button
                      className="w-full rounded-none border border-border-strong bg-surface-primary text-text-primary hover:bg-surface-hover hover:text-text-primary active:scale-[0.97] active:bg-surface-pressed"
                      disabled={schedulerOpen}
                      onClick={unlockOnboarding}
                      rightSection={<UnlockedIcon />}
                      type="button"
                      variant={ButtonVariant.Secondary}
                    >
                      Schedule Onboarding
                    </Button>
                  </div>
                )}

              {onboardingState === 'eligible' && schedulerOpen && (
                <div
                  className="mt-6 scroll-mt-24 outline-none"
                  id="onboarding-scheduler"
                  tabIndex={-1}
                >
                  <Text
                    as="h3"
                    size={TextSize.Large}
                    weight={TextWeight.Medium}
                  >
                    Choose an onboarding time
                  </Text>
                  <Text
                    className="mt-1"
                    color={TextColor.Secondary}
                    size={TextSize.Small}
                  >
                    Pick a time with Sara.
                  </Text>
                  <div className="mt-4">
                    <CalendlyScheduler
                      onScheduled={(booking) =>
                        void recordOnboardingBooking(booking)
                      }
                    />
                  </div>
                  <div className="mt-3">
                    <InlineNotice area="onboarding" notice={notice} />
                  </div>
                </div>
              )}

              {(onboardingState === 'scheduled' ||
                onboardingState === 'completed') && (
                <div className="mt-5">
                  {onboardingState === 'scheduled' && (
                    <Text color={TextColor.Secondary} size={TextSize.Small}>
                      Calendly sent the details and rescheduling link by email.
                    </Text>
                  )}
                  <div className="mt-3">
                    <InlineNotice area="onboarding" notice={notice} />
                  </div>
                </div>
              )}

              <div className={`scroll-mt-24 ${teamIsReady ? 'mt-12' : ''}`}>
                {teamIsReady && (
                  <Text
                    as="h2"
                    size={TextSize.Large}
                    weight={TextWeight.Medium}
                  >
                    Keep going
                  </Text>
                )}

                {teamIsReady && (
                  <div className="mt-5 border border-border-default bg-transparent p-4">
                    <GoalProgress
                      current={visibleReferralProgress}
                      externalAccepted={status.externalInvitesAccepted}
                      invites={status.invites}
                      label="Mystery goal"
                      pending={status.invitesPending}
                      steps={REFERRAL_MYSTERY_STEPS}
                      teamAccepted={status.teamInvitesAccepted}
                      total={REFERRAL_MYSTERY_TARGET}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 scroll-mt-24" id="invites">
            {inviteControls}
          </div>
        </div>
      </section>
    </main>
  )
}

function updateAnswer<K extends keyof WaitlistAnswerSummary>(
  answers: WaitlistAnswerSummary,
  key: K,
  value: WaitlistAnswerSummary[K],
): WaitlistAnswerSummary {
  return { ...answers, [key]: value }
}

function AnswersForm({
  answers,
  busy,
  onAnswersChange,
  onCancel,
  onSave,
}: {
  answers: WaitlistAnswerSummary
  busy: boolean
  onAnswersChange: (answers: WaitlistAnswerSummary) => void
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <form
      className="mt-5 grid gap-6 border-border-default border-t pt-5 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <AnswerTextField
        label="Full name"
        value={answers.name}
        onChange={(value) =>
          onAnswersChange(updateAnswer(answers, 'name', value))
        }
      />
      <AnswerTextField
        label="LinkedIn"
        value={answers.linkedinUrl}
        onChange={(value) =>
          onAnswersChange(updateAnswer(answers, 'linkedinUrl', value))
        }
      />
      <AnswerTextField
        label="Company"
        value={answers.company}
        onChange={(value) =>
          onAnswersChange(updateAnswer(answers, 'company', value))
        }
      />
      <AnswerTextField
        label="Role"
        value={answers.role}
        onChange={(value) =>
          onAnswersChange(updateAnswer(answers, 'role', value))
        }
      />
      <AnswerSelect
        label="Company size"
        onChange={(value) =>
          onAnswersChange(updateAnswer(answers, 'companySize', value))
        }
        options={[
          '',
          'Just me',
          '2-10',
          '11-50',
          '51-200',
          '201-1,000',
          '1,000+',
        ]}
        value={answers.companySize}
      />
      <AnswerSelect
        label="Agent usage"
        onChange={(value) =>
          onAnswersChange(updateAnswer(answers, 'agentUsage', value))
        }
        options={[
          '',
          'Not using them yet',
          'Experimenting',
          'In a few workflows',
          'All day, every day',
        ]}
        value={answers.agentUsage}
      />
      <AnswerTextField
        label="Team communication"
        value={answers.communicationTool}
        onChange={(value) =>
          onAnswersChange(updateAnswer(answers, 'communicationTool', value))
        }
      />
      <AnswerTextField
        label="Agents used (comma-separated)"
        value={answers.agents.join(', ')}
        onChange={(value) =>
          onAnswersChange(
            updateAnswer(
              answers,
              'agents',
              value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            ),
          )
        }
      />
      <AnswerTextField
        label="Intended team size"
        value={answers.teammatesCount}
        onChange={(value) =>
          onAnswersChange(updateAnswer(answers, 'teammatesCount', value))
        }
      />
      <AnswerTextField
        label="How you heard about Ando"
        value={answers.referralSource}
        onChange={(value) =>
          onAnswersChange(updateAnswer(answers, 'referralSource', value))
        }
      />
      <div className="md:col-span-2">
        <FieldLabel>What you want Ando to solve</FieldLabel>
        <textarea
          className={textAreaClassName}
          onChange={(event) =>
            onAnswersChange(
              updateAnswer(answers, 'useCase', event.currentTarget.value),
            )
          }
          value={answers.useCase}
        />
      </div>
      <div className="flex flex-wrap gap-3 md:col-span-2">
        <Button className="rounded-none" isLoading={busy} type="submit">
          Save changes
        </Button>
        <Button
          className="rounded-none"
          onClick={onCancel}
          type="button"
          variant={ButtonVariant.Secondary}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

function AnswerTextField({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <TextField
        className={inputClassName}
        label={label}
        onValueChange={onChange}
        showError={false}
        showSuccess={false}
        value={value}
      />
    </div>
  )
}

function AnswerSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: string[]
  value: string
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        aria-label={label}
        className={selectClassName}
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option || 'none'} value={option}>
            {option || 'Choose one'}
          </option>
        ))}
      </select>
    </div>
  )
}

WaitlistExperience.displayName = 'WaitlistExperience'
