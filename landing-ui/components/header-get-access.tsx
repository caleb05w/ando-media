'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import {
  useWaitlist,
  WAITLIST_AUTOFILL_SUPPRESSION_PROPS,
  WaitlistArrowButton,
} from '@repo/design-system-ui/waitlist-flow'

import type { WaitlistAccessResponse } from '@/lib/waitlist-status-types'
import { WAITLIST_PREVIEW_CODE_STORAGE_KEY } from '@/lib/waitlist-status-types'
import { GetAccessButton } from './get-access-button'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

interface ApiErrorBody {
  error?: unknown
}

async function apiError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null
  return typeof body?.error === 'string'
    ? body.error
    : 'Could not check that email. Try again.'
}

/**
 * Desktop header entry point. The CTA reveals an email field in place, then
 * sends new people into the existing signup modal and returning members to the
 * verification-code page that unlocks their waitlist status.
 */
export function HeaderGetAccess({
  referralCode = '',
}: {
  referralCode?: string
}) {
  const router = useRouter()
  const openWaitlist = useWaitlist()
  const inputRef = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function expand() {
    setExpanded(true)
    setError(null)
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  function collapse() {
    if (busy) {
      return
    }
    setExpanded(false)
    setError(null)
  }

  async function submit() {
    const normalized = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(normalized)) {
      setError('Enter a valid email address.')
      inputRef.current?.focus()
      return
    }

    setBusy(true)
    setError(null)
    const response = await fetch('/api/waitlist/access/request', {
      body: JSON.stringify({ email: normalized }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    }).catch(() => null)

    if (response == null) {
      setError('Could not check that email. Try again.')
      setBusy(false)
      return
    }

    if (!response.ok) {
      const message = await apiError(response)
      // Keep the local unconfigured preview usable without changing the real
      // new-vs-existing branch used by configured environments.
      if (
        response.status === 503 &&
        message === 'Waitlist access is not configured.'
      ) {
        const opened = await openWaitlist({
          answers: {
            email: normalized,
            ...(referralCode === '' ? {} : { referral_code: referralCode }),
          },
          preview: true,
          step: 1,
        })
        setBusy(false)
        if (opened) {
          setExpanded(false)
          setEmail('')
          return
        }
        setError('Could not open the signup form. Try again.')
        return
      }
      setError(message)
      setBusy(false)
      return
    }

    const body = (await response.json()) as WaitlistAccessResponse
    if (body.state === 'signup') {
      setBusy(false)
      const opened = await openWaitlist({
        answers: {
          email: body.email,
          ...(referralCode === '' ? {} : { referral_code: referralCode }),
        },
        step: 1,
      })
      if (opened) {
        setExpanded(false)
        setEmail('')
        return
      }
      setError('Could not open the signup form. Try again.')
      return
    }

    if (body.previewCode != null) {
      window.sessionStorage.setItem(
        WAITLIST_PREVIEW_CODE_STORAGE_KEY,
        body.previewCode,
      )
    }
    router.push(`/waitlist?email=${encodeURIComponent(normalized)}&mode=verify`)
  }

  return (
    <div className="relative block h-11 w-(--header-access-width) shrink-0 [--header-access-width:136px] md:h-[45px] md:[--header-access-width:160px]">
      <GetAccessButton
        aria-hidden={expanded || undefined}
        className={`absolute inset-0 h-11 w-full rounded-none transition-opacity ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none md:h-[45px] ${
          expanded
            ? 'pointer-events-none opacity-0 duration-100'
            : 'opacity-100 duration-150'
        }`}
        onClick={(event) => {
          event.preventDefault()
          expand()
        }}
        size={{ base: 'small', md: 'medium' }}
        tabIndex={expanded ? -1 : 0}
      >
        Get access →
      </GetAccessButton>

      <form
        aria-hidden={!expanded || undefined}
        autoComplete="off"
        className={`absolute top-0 right-0 z-10 flex h-11 w-[calc(100vw-80px)] max-w-[304px] items-center rounded-none border bg-surface-primary transition-[border-color,clip-path,opacity] ease-[cubic-bezier(0.23,1,0.32,1)] focus-within:border-border-strong motion-reduce:transition-none md:h-[45px] ${
          error == null ? 'border-border-default' : 'border-border-danger'
        } ${
          expanded
            ? 'pointer-events-auto opacity-100 duration-200'
            : 'pointer-events-none opacity-0 duration-150'
        }`}
        data-1p-ignore
        data-bwignore="true"
        data-form-type="other"
        data-lpignore="true"
        data-protonpass-ignore="true"
        style={{
          clipPath: expanded
            ? 'inset(0 0 0 0)'
            : 'inset(0 0 0 calc(100% - var(--header-access-width)))',
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            collapse()
          }
        }}
        onSubmit={(event) => {
          event.preventDefault()
          if (!busy) {
            void submit()
          }
        }}
      >
        <label className="sr-only" htmlFor="header-waitlist-email">
          Email address
        </label>
        <input
          {...WAITLIST_AUTOFILL_SUPPRESSION_PROPS}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-size-sm text-text-primary outline-none placeholder:text-text-tertiary"
          disabled={busy}
          id="header-waitlist-email"
          inputMode="email"
          onChange={(event) => {
            setEmail(event.target.value)
            setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              collapse()
            }
          }}
          placeholder="Enter your email"
          ref={inputRef}
          tabIndex={expanded ? 0 : -1}
          type="email"
          value={email}
        />
        <WaitlistArrowButton
          aria-label="Continue"
          className="h-full w-[52px] shrink-0 rounded-none bg-surface-inverse text-text-inverse hover:bg-tonal-100/90 active:bg-tonal-100 [&_svg[role=status]]:text-text-inverse"
          disabled={!expanded}
          loading={busy}
          tabIndex={expanded ? 0 : -1}
          type="submit"
        />

        {error != null && expanded ? (
          <p
            aria-live="polite"
            className="absolute top-[calc(100%+8px)] right-0 w-full rounded-none border border-border-subtle bg-surface-primary px-3 py-2 text-size-xs text-text-danger"
          >
            {error}
          </p>
        ) : null}
      </form>
    </div>
  )
}

HeaderGetAccess.displayName = 'HeaderGetAccess'
