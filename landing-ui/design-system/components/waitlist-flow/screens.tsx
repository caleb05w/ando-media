import {
  type FormProgressStep,
  FormProgressStepStatus,
} from '#components/form-progress'
import {
  IconClaudeai,
  IconDevin,
  IconDiscord,
  IconFill,
  IconHermes,
  IconInboxEmpty,
  IconLinear,
  IconMicrosoftTeams,
  IconNotion,
  IconOpenaiCodex,
  IconOpenclaw,
  IconSlack,
} from '#components/icon'
import type {
  WaitlistAnswers,
  WaitlistScreen,
  WaitlistStaticScreen,
} from './types'

// The TLD must be at least two letters: there are no single-letter TLDs (ICANN
// requires 2+), so this rejects typos like "x@company.c" without dropping any
// real address. Letters-only keeps the final segment a real TLD rather than a
// trailing dot-number; punycode IDN TLDs ("xn--p1ai") are out of scope here.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

/** The waitlist's email error copy, shared so the hero field can reuse it. */
export const EMAIL_ERROR = 'Oops! Please enter a valid email address.'

const COMMON_EMAIL_DOMAIN_CORRECTIONS: Record<string, string> = {
  'aol.co': 'aol.com',
  'aol.con': 'aol.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.cmo': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.ocm': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'hotmail.cmo': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.ocm': 'hotmail.com',
  'icloud.cmo': 'icloud.com',
  'icloud.co': 'icloud.com',
  'icloud.con': 'icloud.com',
  'icloud.ocm': 'icloud.com',
  'me.co': 'me.com',
  'outlook.cmo': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outlook.ocm': 'outlook.com',
  'yahoo.cmo': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.ocm': 'yahoo.com',
}

function suggestedEmailDomain(domain: string): string | null {
  const knownCorrection = COMMON_EMAIL_DOMAIN_CORRECTIONS[domain]
  if (knownCorrection != null) {
    return knownCorrection
  }

  if (domain.endsWith('.comm')) {
    return `${domain.slice(0, -5)}.com`
  }

  for (const typo of ['.con', '.cmo', '.ocm']) {
    if (domain.endsWith(typo)) {
      return `${domain.slice(0, -typo.length)}.com`
    }
  }

  return null
}

export const WAITLIST_AUTOFILL_SUPPRESSION_PROPS = {
  autoCapitalize: 'none',
  autoComplete: 'off',
  autoCorrect: 'off',
  'data-1p-ignore': 'true',
  'data-bwignore': 'true',
  'data-form-type': 'other',
  'data-lpignore': 'true',
  'data-protonpass-ignore': 'true',
  spellCheck: false,
} as const

export const EMAIL_INPUT_PROPS = {
  ...WAITLIST_AUTOFILL_SUPPRESSION_PROPS,
  inputMode: 'email',
} as const

/**
 * Whether `value` is a valid work email by the waitlist's own rule. Exported so
 * the hero email field can decide whether to open the flow straight onto the
 * name screen (valid) or land on the email screen for the user to fix it.
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

export function suggestEmailCorrection(value: string): string | null {
  const trimmed = value.trim()
  if (!isValidEmail(trimmed)) {
    return null
  }

  const atIndex = trimmed.lastIndexOf('@')
  const local = trimmed.slice(0, atIndex)
  const domain = trimmed.slice(atIndex + 1).toLowerCase()
  const suggestion = suggestedEmailDomain(domain)
  if (suggestion == null || suggestion === domain) {
    return null
  }

  return `${local}@${suggestion}`
}

export const LINKEDIN_PROFILE_PREFIX = 'linkedin.com/in/'

const LINKEDIN_HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{1,99}$/i
const LINKEDIN_PROFILE_PATTERN =
  /^(?:https?:\/\/)?(?:[a-z0-9-]+\.)*linkedin\.com\/in\/([^/?#]+)\/?(?:[?#].*)?$/i
const LINKEDIN_ERROR = 'Enter a LinkedIn profile URL or handle'

// Past this, an embedded company name would wrap the title onto a second line
// on mobile, so the questions fall back to the generic "this company" instead.
const MAX_COMPANY_NAME_LENGTH = 24

/** Company name typed earlier, for the questions that embed it ("What's your
 * role at X?"). Empty -> "your company"; over the length cap -> "this company". */
function companyFrom(answers: WaitlistAnswers): string {
  const raw = answers.company
  const name = typeof raw === 'string' ? raw.trim() : ''
  if (!name) {
    return 'your company'
  }
  return name.length > MAX_COMPANY_NAME_LENGTH ? 'this company' : name
}

function requiredText(message: string) {
  return (value: string) => (value.trim() === '' ? message : null)
}

export function normalizeLinkedInUrl(value: string): string | null {
  const raw = value.trim().replace(/^@/, '')
  if (!raw) {
    return null
  }

  const candidate = raw.includes('linkedin.com/')
    ? raw
    : `${LINKEDIN_PROFILE_PREFIX}${raw}`
  const match = LINKEDIN_PROFILE_PATTERN.exec(candidate)
  const handle = match?.[1]?.trim()
  if (handle == null || !LINKEDIN_HANDLE_PATTERN.test(handle)) {
    return null
  }

  return `https://${LINKEDIN_PROFILE_PREFIX}${handle}`
}

export function isLinkedInUrlInput(value: string): boolean {
  return /(?:^https?:\/\/|linkedin\.com\/)/i.test(value.trim())
}

export const DONE_SCREEN: WaitlistStaticScreen = { kind: 'done', id: 'done' }

/**
 * Every screen from the May 2026 brand frames, in flow order: the "Your info"
 * questions, the waitlist confirmation, then the "Bonus" questions. Titles and
 * placeholders are lifted from the frames; the dropdown option lists aren't
 * specified in the design (no open-popup frame), so they're authored here -
 * "Directory" (the one example value shown) leads the source list.
 */
export const SCREENS: readonly WaitlistScreen[] = [
  {
    kind: 'text',
    id: 'email',
    title: 'What’s your work email?',
    placeholder: 'x@company.com',
    // Keep the email field as a text input with inputMode=email. iOS Safari's
    // native email input has awkward text-range selection handles for partial
    // edits; custom validation below supplies the semantics we need.
    type: 'text',
    validate: (value) => (isValidEmail(value) ? null : EMAIL_ERROR),
  },
  {
    kind: 'text',
    id: 'name',
    title: 'What’s your full name?',
    placeholder: 'Tadao Ando',
    validate: (value) =>
      value.trim() === '' ? 'Oops! Please enter your full name.' : null,
  },
  {
    kind: 'text',
    id: 'linkedin',
    title: 'What’s your LinkedIn?',
    placeholder: 'username',
    prefix: LINKEDIN_PROFILE_PREFIX,
    // Required: empty is rejected; handles and full LinkedIn profile URLs pass.
    validate: (value) => {
      const trimmed = value.trim()
      if (trimmed === '') {
        return LINKEDIN_ERROR
      }
      return normalizeLinkedInUrl(trimmed) == null ? LINKEDIN_ERROR : null
    },
  },
  {
    kind: 'select',
    id: 'source',
    title: 'How did you hear about Ando?',
    options: [
      'Directory',
      'Search engine',
      'Social media',
      'Friend or colleague',
      'Other',
    ],
  },
  {
    kind: 'text',
    id: 'source_other',
    title: 'Where did you hear about Ando?',
    placeholder: 'Tell us where',
    validate: requiredText('Tell us where you heard about Ando.'),
  },
  { kind: 'confirmation', id: 'confirmation' },
  {
    kind: 'text',
    id: 'company',
    title: 'Enter your company’s name',
    placeholder: 'Pied Piper',
    validate: (value) =>
      value.trim() === '' ? 'Oops! Please enter your company’s name.' : null,
  },
  {
    kind: 'text',
    id: 'role',
    title: (answers) => `What’s your role at ${companyFrom(answers)}?`,
    placeholder: 'Agent whisperer',
    validate: (value) =>
      value.trim() === '' ? 'Oops! Please enter your role.' : null,
  },
  {
    kind: 'select',
    id: 'size',
    title: (answers) => `How big is ${companyFrom(answers)}?`,
    options: ['Just me', '2-10', '11-50', '51-200', '201-1,000', '1,000+'],
  },
  {
    kind: 'select',
    id: 'communicate',
    title: 'Where does your team communicate?',
    options: [
      'Slack',
      'Microsoft Teams',
      'Discord',
      'Linear',
      'Notion',
      'Email',
      'Other',
    ],
    valueIcons: {
      Slack: <IconSlack />,
      'Microsoft Teams': <IconMicrosoftTeams />,
      Discord: <IconDiscord />,
      Linear: <IconLinear />,
      Notion: <IconNotion />,
      Email: <IconInboxEmpty fill={IconFill.Filled} />,
    },
  },
  {
    kind: 'text',
    id: 'communicate_other',
    title: 'What does your team use to communicate?',
    placeholder: 'Tell us what you use',
    validate: requiredText('Tell us what your team uses.'),
  },
  {
    kind: 'select',
    id: 'usage',
    title: 'How are you using agents today?',
    options: [
      'Not using them yet',
      'Experimenting',
      'In a few workflows',
      'All day, every day',
    ],
  },
  {
    kind: 'multiselect',
    id: 'agents',
    title: 'What kinds of agents do you use?',
    options: [
      'Codex',
      'Claude',
      'Devin',
      'OpenClaw',
      'Hermes',
      'Custom harnesses',
    ],
    // 'Custom harnesses' is intentionally icon-less and collects details next.
    valueIcons: {
      Codex: <IconOpenaiCodex />,
      Claude: <IconClaudeai />,
      Devin: <IconDevin />,
      OpenClaw: <IconOpenclaw />,
      Hermes: <IconHermes />,
    },
  },
  {
    kind: 'text',
    id: 'agents_other',
    title: 'What custom harnesses do you use?',
    placeholder: 'Tell us what you use',
    validate: requiredText('Tell us what custom harnesses you use.'),
  },
  {
    kind: 'select',
    id: 'teammates',
    title: 'How many teammates do you want to use Ando with?',
    options: ['Just me', '2-5', '6-20', '21-50', '50+'],
  },
  {
    kind: 'textarea',
    id: 'solve',
    title: 'Anything else you want Ando to solve? (optional)',
    placeholder: 'Write a response',
  },
  DONE_SCREEN,
]

const CONFIRMATION_STEP = SCREENS.findIndex(
  (screen) => screen.kind === 'confirmation',
)
export const DONE_STEP = SCREENS.length - 1
// Question counts on either side of the confirmation ("Your info" / "Bonus").
const INFO_COUNT = CONFIRMATION_STEP
const BONUS_COUNT = DONE_STEP - CONFIRMATION_STEP - 1

export function stepIdFor(step: number): string {
  return SCREENS[step]?.id ?? DONE_SCREEN.id
}

function hasAnswerValue(
  answers: WaitlistAnswers,
  id: string,
  option: string,
): boolean {
  const value = answers[id]
  return Array.isArray(value) ? value.includes(option) : value === option
}

export function isStepAvailable(
  step: number,
  answers: WaitlistAnswers,
): boolean {
  const screen = SCREENS[step]
  if (screen == null) {
    return false
  }

  switch (screen.id) {
    case 'source_other':
      return hasAnswerValue(answers, 'source', 'Other')
    case 'communicate_other':
      return hasAnswerValue(answers, 'communicate', 'Other')
    case 'agents':
      return answers.usage !== 'Not using them yet'
    case 'agents_other':
      return (
        answers.usage !== 'Not using them yet' &&
        hasAnswerValue(answers, 'agents', 'Custom harnesses')
      )
    default:
      return true
  }
}

export function nextAvailableStep(
  step: number,
  answers: WaitlistAnswers,
  limit = DONE_STEP,
): number | null {
  for (let next = step + 1; next <= Math.min(limit, DONE_STEP); next++) {
    if (isStepAvailable(next, answers)) {
      return next
    }
  }
  return null
}

export function previousAvailableStep(
  step: number,
  answers: WaitlistAnswers,
): number | null {
  for (let previous = step - 1; previous >= 0; previous--) {
    if (isStepAvailable(previous, answers)) {
      return previous
    }
  }
  return null
}

export function nearestAvailableStep(
  step: number,
  answers: WaitlistAnswers,
): number {
  if (isStepAvailable(step, answers)) {
    return step
  }

  return (
    previousAvailableStep(step, answers) ??
    nextAvailableStep(step, answers) ??
    0
  )
}

// The answer-bearing screens (the static confirmation/done hold none), split by
// section so each submit boundary gets only its own answers.
const ANSWER_KINDS = new Set(['text', 'select', 'multiselect', 'textarea'])

function sectionFieldIds(start: number, end: number): string[] {
  return SCREENS.slice(start, end)
    .filter((screen) => ANSWER_KINDS.has(screen.kind))
    .map((screen) => screen.id)
}

const JOIN_FIELD_IDS = sectionFieldIds(0, CONFIRMATION_STEP)
const BONUS_FIELD_IDS = sectionFieldIds(CONFIRMATION_STEP + 1, SCREENS.length)

function pickAnswers(answers: WaitlistAnswers, ids: string[]): WaitlistAnswers {
  const picked: WaitlistAnswers = {}
  for (const id of ids) {
    const value = answers[id]
    if (value !== undefined) {
      picked[id] = value
    }
  }
  return picked
}

/** The waitlist-join answers (email, name, LinkedIn, source). */
export function joinAnswersFrom(answers: WaitlistAnswers): WaitlistAnswers {
  return pickAnswers(answers, JOIN_FIELD_IDS)
}

/** The bonus answers (company, role, size, and the agent questions). */
export function bonusAnswersFrom(answers: WaitlistAnswers): WaitlistAnswers {
  return pickAnswers(answers, BONUS_FIELD_IDS)
}

export function titleFor(
  screen: WaitlistScreen,
  answers: WaitlistAnswers,
): string {
  if (!('title' in screen)) {
    return ''
  }
  return typeof screen.title === 'function'
    ? screen.title(answers)
    : screen.title
}

/** Footer progress for each screen; transitions animate in place because the
 * dialog (and the `FormProgress` instance) stays mounted across screens. The
 * active arc fills one notch per question, only completing with the section. */
export function progressFor(step: number): {
  current?: number
  steps: FormProgressStep[]
} {
  if (step < CONFIRMATION_STEP) {
    return {
      steps: [
        {
          id: 'info',
          label: 'Your info',
          status: FormProgressStepStatus.Active,
          progress: (step + 1) / (INFO_COUNT + 1),
        },
        {
          id: 'bonus',
          label: 'Bonus',
          status: FormProgressStepStatus.Upcoming,
        },
      ],
    }
  }
  const joined: FormProgressStep = {
    id: 'info',
    label: 'Joined waitlist',
    status: FormProgressStepStatus.Complete,
  }
  if (step === CONFIRMATION_STEP) {
    return {
      current: 0,
      steps: [
        joined,
        {
          id: 'bonus',
          label: 'Bonus',
          status: FormProgressStepStatus.Upcoming,
        },
      ],
    }
  }
  if (step === DONE_STEP) {
    return {
      current: 1,
      steps: [
        joined,
        {
          id: 'bonus',
          label: 'Bonus',
          status: FormProgressStepStatus.Complete,
        },
      ],
    }
  }
  return {
    steps: [
      joined,
      {
        id: 'bonus',
        label: 'Bonus',
        status: FormProgressStepStatus.Active,
        progress: (step - CONFIRMATION_STEP) / (BONUS_COUNT + 1),
      },
    ],
  }
}
