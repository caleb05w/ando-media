'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { AnnouncementPill } from '@repo/design-system-ui/announcement-pill'
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@repo/design-system-ui/button'
import { cn } from '@repo/design-system-ui/lib/cn'
import { Reveal, STAGGER_BLOCK } from '@repo/design-system-ui/reveal'
import { Text, TextColor, TextSize } from '@repo/design-system-ui/text'
import {
  TextField,
  type TextFieldActions,
} from '@repo/design-system-ui/text-field'
import {
  EMAIL_ERROR,
  EMAIL_INPUT_PROPS,
  isValidEmail,
  suggestEmailCorrection,
  WaitlistArrowButton,
} from '@repo/design-system-ui/waitlist-flow'

import { GetAccessButton } from './get-access-button'
import { ProductAnimation } from './product-animation'

// Hold AndoHero's chat until its Reveal has played: 2-block stagger + the
// default 0.8s tween, in ms. (AndoHero also waits until it's half in view.)
const HERO_GRAPHIC_REVEAL_DELAY = 2 * STAGGER_BLOCK
const HERO_GRAPHIC_REVEAL_MS = (HERO_GRAPHIC_REVEAL_DELAY + 0.8) * 1000
interface EmailSuggestionReview {
  key: string
  suggestion: string
}

function emailReviewKey(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Home page hero: announcement, display headline (and a mobile-only subtext),
 * an email field that hands off to verified waitlist access, and the embedded
 * `AndoHero` graphic. Desktop uses a 40/60 copy-and-demo split.
 *
 * The waitlist entry route decides whether the email belongs to a returning
 * member or a new signup before opening the form.
 */
export function SiteHero() {
  return (
    <section className="content-frame flex flex-col items-stretch gap-10 py-8 md:items-center md:gap-17 md:pt-16 md:pb-24 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12">
      {/* The above-the-fold cascade: blocks rise+unblur in on load, one block
          stagger (100ms) apart - the waitlist flow's signature, applied to the
          page: announcement, headline, email field, then graphic. */}
      <div className="flex w-full flex-col items-start gap-5 md:items-center md:gap-8 lg:items-start">
        <Reveal delay={3 * STAGGER_BLOCK}>
          <AnnouncementPill
            href="https://www.new-ontologies.com/posts/Ando"
            rel="noreferrer"
            target="_blank"
          >
            Read &ldquo;Ando: Building Slack from Scratch&rdquo;
          </AnnouncementPill>
        </Reveal>

        {/* The colour split is also the intentional desktop line break. */}
        <Reveal>
          <Text
            as="h1"
            font="display"
            size={{
              base: TextSize.XXL2,
              md: TextSize.Display,
              lg: TextSize.Hero,
            }}
            className="flex flex-col leading-[0.98] md:items-center md:text-center lg:items-start lg:text-left"
          >
            <span className="text-text-primary">The messaging platform</span>
            <span className="text-text-primary">for agent-pilled teams</span>
          </Text>
        </Reveal>

        {/* Subtext renders below `md` only (desktop has none); the visibility
            lives on the Reveal so the hidden block leaves no empty gap. */}
        <Reveal className="md:hidden" delay={STAGGER_BLOCK}>
          <Text as="p" color="secondary" font="display" size={TextSize.Large}>
            Bring your agents into the conversation. No walled gardens.
          </Text>
        </Reveal>

        <Reveal className="md:hidden" delay={2 * STAGGER_BLOCK}>
          <GetAccessButton size="medium">Get access</GetAccessButton>
        </Reveal>

        <Reveal
          className="hidden w-full md:block md:w-[584px] lg:w-4/5"
          delay={STAGGER_BLOCK}
        >
          <HeroEmailField />
        </Reveal>
      </div>

      {/* Opacity + rise only (no blur): animating a full-element blur over the
          953px WebGL canvas is a costly transient composite. */}
      <Reveal blur={0} className="w-full" delay={HERO_GRAPHIC_REVEAL_DELAY}>
        <ProductAnimation startDelay={HERO_GRAPHIC_REVEAL_MS} />
      </Reveal>
    </section>
  )
}

SiteHero.displayName = 'SiteHero'

/**
 * The design-system `TextField` + the waitlist's arrow `Button`, behaving like
 * the waitlist flow's first (email) screen: errors are deferred to submit (no
 * red-while-typing) and shown only as the red border + a row shake - no message.
 * A real `<form>` (Enter submits): a valid email opens the verified waitlist
 * entry with the email seeded; an invalid one shakes the row and reddens the
 * field, staying on the page so the user can fix it.
 */
function HeroEmailField() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  // Errors are deferred: the danger border paints nothing until a submit is
  // attempted, and typing clears the attempt again (mirrors the flow's screen).
  const [submitAttempted, setSubmitAttempted] = useState(false)
  // Replays `animate-shake` on the field row; cleared by its animationend.
  const [shaking, setShaking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [emailReview, setEmailReview] = useState<EmailSuggestionReview | null>(
    null,
  )
  const [dismissedEmailSuggestionKey, setDismissedEmailSuggestionKey] =
    useState<string | null>(null)
  // Lets a rejected submit of a never-touched field run its validator (which
  // otherwise only runs on change) so the danger border + message appear.
  const fieldActionsRef = useRef<TextFieldActions | null>(null)

  async function openWithEmail(value: string) {
    setSubmitting(true)
    router.push(`/waitlist?email=${encodeURIComponent(value)}`)
  }

  function showEmailSuggestionIfNeeded(value: string): boolean {
    const key = emailReviewKey(value)
    const suggestion = suggestEmailCorrection(value)
    if (suggestion == null || dismissedEmailSuggestionKey === key) {
      return false
    }

    setEmailReview({ key, suggestion })
    setSubmitAttempted(false)
    setShaking(false)
    return true
  }

  function acceptEmailSuggestion(review: EmailSuggestionReview) {
    const suggestionKey = emailReviewKey(review.suggestion)
    setEmail(review.suggestion)
    setEmailReview(null)
    setDismissedEmailSuggestionKey(suggestionKey)
    void openWithEmail(review.suggestion)
  }

  function keepReviewedEmail(review: EmailSuggestionReview) {
    setEmailReview(null)
    setDismissedEmailSuggestionKey(review.key)
    void openWithEmail(email.trim())
  }

  const emailValidationError =
    submitAttempted && emailReview == null && !isValidEmail(email.trim())
      ? EMAIL_ERROR
      : null

  return (
    // Desktop-only: the Figma mobile hero ends at the subtext (no email field
    // below `md`). The breakpoint visibility + width live on the wrapping
    // `Reveal`.
    <div className="w-full">
      <form
        // `noValidate` so the validator's customValidity doesn't trip the
        // browser's native bubble and block submit - onSubmit must fire for the
        // shake (and the valid-email handoff) to run.
        className="flex flex-col gap-3"
        noValidate
        onSubmit={async (event) => {
          event.preventDefault()
          if (submitting) {
            return
          }
          const trimmed = email.trim()
          if (isValidEmail(trimmed)) {
            if (showEmailSuggestionIfNeeded(trimmed)) {
              return
            }
            await openWithEmail(trimmed)
            return
          }
          setSubmitAttempted(true)
          setShaking(true)
          // An untouched field has never validated, so run it now to paint the
          // danger border.
          fieldActionsRef.current?.validate()
        }}
      >
        <div
          className={cn('flex items-center gap-2', shaking && 'animate-shake')}
          onAnimationEnd={() => setShaking(false)}
        >
          <div className="min-w-0 flex-1">
            <TextField
              {...EMAIL_INPUT_PROPS}
              actionsRef={fieldActionsRef}
              aria-label="Email address"
              onBlur={() => {
                // Empty on blur clears the deferred error (neutral).
                if (email.trim() === '') {
                  setSubmitAttempted(false)
                }
              }}
              onValueChange={(value) => {
                const key = emailReviewKey(value)
                setEmail(value)
                setSubmitAttempted(false)
                setEmailReview((review) =>
                  review?.key === key ? review : null,
                )
                setDismissedEmailSuggestionKey((dismissed) =>
                  dismissed === key ? dismissed : null,
                )
              }}
              placeholder="Enter your email"
              showError={submitAttempted}
              showErrorMessage={false}
              showSuccess={false}
              type="text"
              validate={(value) =>
                isValidEmail(String(value)) ? null : EMAIL_ERROR
              }
              value={email}
            />
          </div>
          {/* The same arrow button the waitlist text screens use, at the same 48px
              height (h-12). Wider than it is tall so the pill reads as a lozenge,
              not a circle, and centered against the taller field. */}
          <WaitlistArrowButton
            aria-label="Join the waitlist"
            className="h-[45px] shrink-0 md:h-12"
            disabled={submitting}
            loading={submitting}
            type="submit"
          />
        </div>
        {emailReview != null && (
          <div className="flex w-full gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-col items-center gap-3 px-4 text-center md:flex-row md:justify-center md:px-6">
                <Text
                  as="p"
                  className="max-w-full break-words"
                  color={TextColor.Tertiary}
                  size={TextSize.Small}
                >
                  Did you mean{' '}
                  <span className="text-text-primary">
                    {emailReview.suggestion}
                  </span>
                  ?
                </Text>
                <div className="flex max-w-full flex-wrap justify-center gap-2">
                  <Button
                    disabled={submitting}
                    onClick={() => acceptEmailSuggestion(emailReview)}
                    size={ButtonSize.Small}
                    type="button"
                    variant={ButtonVariant.Primary}
                  >
                    Use suggestion
                  </Button>
                  <Button
                    disabled={submitting}
                    onClick={() => keepReviewedEmail(emailReview)}
                    size={ButtonSize.Small}
                    type="button"
                    variant={ButtonVariant.Secondary}
                  >
                    Keep as typed
                  </Button>
                </div>
              </div>
            </div>
            <div aria-hidden className="w-16 shrink-0" />
          </div>
        )}
        {emailValidationError != null && (
          <div className="flex w-full gap-2">
            <div className="flex min-w-0 flex-1 justify-center px-4">
              <Text
                as="p"
                className="max-w-full text-center text-text-danger"
                size={TextSize.Small}
              >
                {emailValidationError}
              </Text>
            </div>
            <div aria-hidden className="w-16 shrink-0" />
          </div>
        )}
      </form>
    </div>
  )
}
