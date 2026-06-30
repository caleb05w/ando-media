'use client'

import { useState, useRef, useMemo, useEffect } from 'react'

// ════════════════════════════════════════════════════════════════════════════
// Smart schedule parsing — one input understands recurrence + time together.
//   "every weekday at 9am" · "tomorrow at 5pm" · "monthly on the 1st" · "hourly"
// Time is optional; it defaults to 9:00am and we surface that it defaulted.
// ════════════════════════════════════════════════════════════════════════════

const DEFAULT_TIME = { h: 9, m: 0 }

const MONTHS = {}
;['january', 'february', 'march', 'april', 'may', 'june', 'july',
  'august', 'september', 'october', 'november', 'december'].forEach((m, i) => {
  MONTHS[m] = i
  MONTHS[m.slice(0, 3)] = i
})
MONTHS['sept'] = 8

const NL_WEEKDAYS = {}
;['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].forEach((d, i) => {
  NL_WEEKDAYS[d] = i
  NL_WEEKDAYS[d.slice(0, 3)] = i
})

const DOW = [
  ['sunday', 0], ['sun', 0], ['monday', 1], ['mon', 1], ['tuesday', 2], ['tues', 2], ['tue', 2],
  ['wednesday', 3], ['wed', 3], ['thursday', 4], ['thurs', 4], ['thu', 4], ['friday', 5], ['fri', 5],
  ['saturday', 6], ['sat', 6],
]

const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
const addYears = (d, n) => { const x = new Date(d); x.setFullYear(x.getFullYear() + n); return x }
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const endOfWeek = (today) => addDays(today, (5 - today.getDay() + 7) % 7)

// ── Clock parsing/formatting ────────────────────────────────────────────────
function parseClock(tok) {
  const t = tok.trim().toLowerCase().replace(/\s+/g, '')
  if (t === 'noon') return { h: 12, m: 0 }
  if (t === 'midnight') return { h: 0, m: 0 }
  let m = t.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/)
  if (m) { let h = +m[1] % 12; if (m[3] === 'pm') h += 12; return { h, m: m[2] ? +m[2] : 0 } }
  m = t.match(/^(\d{1,2}):(\d{2})$/)
  if (m && +m[1] < 24 && +m[2] < 60) return { h: +m[1], m: +m[2] }
  m = t.match(/^(\d{1,2})$/)
  if (m && +m[1] < 24) return { h: +m[1], m: 0 }
  return null
}

function fmtClock(t) {
  let h = t.h % 12 || 12
  return `${h}:${String(t.m).padStart(2, '0')}${t.h >= 12 ? 'pm' : 'am'}`
}

// "Jul 1, 2026"
const fmtDateLong = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// Pull a time out of the string, returning { time, rest } with the time removed.
function extractTime(s) {
  const cut = (m) => ({ time: parseClock(m[1]), rest: (s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim() })
  // "at 9", "at 9am", "at 5:23pm", "at noon"
  let m = s.match(/\bat\s+(noon|midnight|\d{1,2}:\d{2}\s*[ap]m|\d{1,2}\s*[ap]m|\d{1,2}:\d{2}|\d{1,2})\b/i)
  if (m) { const c = cut(m); if (c.time) return c }
  // standalone time token (requires am/pm or a colon, so "3" in "every 3 days" is safe)
  m = s.match(/\b(noon|midnight|\d{1,2}:\d{2}\s*[ap]m|\d{1,2}\s*[ap]m|\d{1,2}:\d{2})\b/i)
  if (m) { const c = cut(m); if (c.time) return c }
  return { time: null, rest: s }
}

function extractDays(s) {
  const out = []
  for (const [name, v] of DOW) {
    if (new RegExp(`\\b${name}s?\\b`).test(s) && !out.includes(v)) out.push(v)
  }
  return out.sort((a, b) => a - b)
}

// One-time date phrases: "tomorrow", "in 3 days", "Feb 9", "next monday", "2026-07-02"…
function parseOneTimeDate(raw, now) {
  if (!raw) return null
  let s = raw.trim().toLowerCase()
  if (!s) return null
  const today = startOfDay(now)

  if (s === 'today') return { date: today, kind: 'day' }
  if (s === 'tomorrow' || s === 'tmrw' || s === 'tmr') return { date: addDays(today, 1), kind: 'day' }
  if (s === 'next week') return { date: addDays(today, 7), kind: 'day' }
  if (s === 'next month') return { date: addMonths(today, 1), kind: 'day' }
  if (s === 'end of this week' || s === 'end of week') return { date: endOfWeek(today), kind: 'day' }

  let m = s.match(/^(?:(next)\s+)?([a-z]{3,9})$/)
  if (m && NL_WEEKDAYS[m[2]] !== undefined) {
    let diff = (NL_WEEKDAYS[m[2]] - today.getDay() + 7) % 7
    if (diff === 0 || m[1]) diff = diff === 0 ? 7 : diff
    return { date: addDays(today, diff), kind: 'day' }
  }

  m = s.match(/^in\s+(\d+)\s*(d|day|days|w|wk|wks|week|weeks|mo|month|months)$/)
  if (m) {
    const n = +m[1], u = m[2]
    if (/^d/.test(u)) return { date: addDays(today, n), kind: 'day' }
    if (/^w/.test(u)) return { date: addDays(today, n * 7), kind: 'day' }
    return { date: addMonths(today, n), kind: 'day' }
  }

  m = s.match(/^([a-z]{3,9})\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?$/)
  if (m && MONTHS[m[1]] !== undefined) return monthDayDate(MONTHS[m[1]], +m[2], m[3] ? +m[3] : null, today)
  m = s.match(/^(\d{1,2})\s+([a-z]{3,9})\.?(?:,?\s+(\d{4}))?$/)
  if (m && MONTHS[m[2]] !== undefined) return monthDayDate(MONTHS[m[2]], +m[1], m[3] ? +m[3] : null, today)
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return { date: startOfDay(new Date(+m[1], +m[2] - 1, +m[3])), kind: 'day' }
  m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/)
  if (m) { let y = m[3] ? +m[3] : today.getFullYear(); if (y < 100) y += 2000; return { date: startOfDay(new Date(y, +m[1] - 1, +m[2])), kind: 'day' } }
  return null
}

function monthDayDate(monthIdx, day, year, today) {
  let y = year ?? today.getFullYear()
  let d = startOfDay(new Date(y, monthIdx, day))
  if (year == null && d < today) d = startOfDay(new Date(y + 1, monthIdx, day))
  return { date: d, kind: 'day' }
}

// Parse a full schedule (recurrence + time). Returns a schedule object or null.
function parseSchedule(raw, now) {
  if (!raw || !raw.trim()) return null
  const { time, rest } = extractTime(raw.toLowerCase().trim())
  const s = rest.replace(/,/g, ' ').replace(/\s+and\s+/g, ' ').replace(/\s+/g, ' ').trim()
  const T = time || DEFAULT_TIME
  const dft = !time

  if (/^(hourly|every\s?hour|each\s?hour)$/.test(s)) return { type: 'hourly' }
  let m = s.match(/^every (\d+)\s*(?:m|min|mins|minute|minutes)$/); if (m) return { type: 'interval-mins', n: +m[1] }
  m = s.match(/^every (\d+) hours?$/); if (m) return { type: 'interval-hours', n: +m[1] }
  m = s.match(/^every (\d+) days?$/); if (m) return { type: 'interval-days', n: +m[1], time: T, defaultedTime: dft }
  m = s.match(/^every (\d+) weeks?$/); if (m) return { type: 'interval-days', n: +m[1] * 7, time: T, defaultedTime: dft }

  if (/\bweekdays?\b/.test(s)) return { type: 'weekly', days: [1, 2, 3, 4, 5], time: T, defaultedTime: dft }
  if (/\bweekends?\b/.test(s)) return { type: 'weekly', days: [0, 6], time: T, defaultedTime: dft }
  if (/^(daily|every\s?day|each\s?day)$/.test(s)) return { type: 'daily', time: T, defaultedTime: dft }

  const days = extractDays(s)
  const recurring = /\b(every|each)\b/.test(s) || /\b\w+days\b/.test(s) || days.length > 1
  if (days.length && recurring) return { type: 'weekly', days, time: T, defaultedTime: dft }

  if (/^(weekly|every\s?week|each\s?week)$/.test(s)) return { type: 'weekly', days: [now.getDay()], time: T, defaultedTime: dft }
  if (/^(monthly|every\s?month|each\s?month)$/.test(s)) return { type: 'monthly', monthDay: now.getDate(), time: T, defaultedTime: dft }
  m = s.match(/\b(\d{1,2})(?:st|nd|rd|th)\b/); if (m) return { type: 'monthly', monthDay: Math.min(31, +m[1]), time: T, defaultedTime: dft }

  const p = parseOneTimeDate(rest, now)
  if (p) {
    const d = new Date(p.date)
    if (time) d.setHours(T.h, T.m, 0, 0)
    else if (p.kind === 'day') d.setHours(DEFAULT_TIME.h, DEFAULT_TIME.m, 0, 0)
    return { type: 'once', date: d, defaultedTime: !time && p.kind === 'day' }
  }
  return null
}

// ── Derived: next run ───────────────────────────────────────────────────────
function nextRunFor(sch, now) {
  if (!sch) return null
  const T = sch.time
  switch (sch.type) {
    case 'hourly': { const d = new Date(now); d.setMinutes(0, 0, 0); if (d <= now) d.setHours(d.getHours() + 1); return d }
    case 'interval-mins': { const d = new Date(now); d.setSeconds(0, 0); do { d.setMinutes(d.getMinutes() + sch.n) } while (d <= now); return d }
    case 'interval-hours': { const d = new Date(now); d.setMinutes(0, 0, 0); do { d.setHours(d.getHours() + sch.n) } while (d <= now); return d }
    case 'daily': { const d = new Date(now); d.setHours(T.h, T.m, 0, 0); if (d <= now) d.setDate(d.getDate() + 1); return d }
    case 'interval-days': { const d = new Date(now); d.setHours(T.h, T.m, 0, 0); while (d <= now) d.setDate(d.getDate() + sch.n); return d }
    case 'weekly': {
      if (!sch.days.length) return null
      for (let i = 0; i < 8; i++) {
        const d = new Date(now); d.setDate(now.getDate() + i); d.setHours(T.h, T.m, 0, 0)
        if (sch.days.includes(d.getDay()) && d > now) return d
      }
      return null
    }
    case 'monthly': {
      let d = new Date(now.getFullYear(), now.getMonth(), sch.monthDay, T.h, T.m, 0, 0)
      if (d <= now) d = new Date(now.getFullYear(), now.getMonth() + 1, sch.monthDay, T.h, T.m, 0, 0)
      return d
    }
    case 'once': return sch.date
    default: return null
  }
}

// ── Human-readable description of a schedule rule ────────────────────────────
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x))
function describeDays(days) {
  if (days.length === 7) return 'Every day'
  if (sameSet(days, [1, 2, 3, 4, 5])) return 'Every weekday'
  if (sameSet(days, [0, 6])) return 'Every weekend'
  const n = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return 'Every ' + days.map((d) => n[d]).join(', ')
}
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
function describeSchedule(sch) {
  switch (sch.type) {
    case 'hourly': return 'Every hour'
    case 'interval-mins': return `Every ${sch.n} min`
    case 'interval-hours': return `Every ${sch.n} hours`
    case 'daily': return `Every day at ${fmtClock(sch.time)}`
    case 'interval-days': return `Every ${sch.n} days`
    case 'weekly': return describeDays(sch.days)
    case 'monthly': return `Monthly on the ${ordinal(sch.monthDay)}`
    case 'once': return sch.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    default: return ''
  }
}
const shortDate = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

// The field reads "Runs every ___", so users omit the leading "every". Try the
// literal text, then an "every"-prefixed reading, preferring the recurring one —
// but never for explicit one-time phrases ("next mon", "in 3 days", "Feb 9"…).
const MONTH_RE = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*'
function parseRunsEvery(value, now) {
  const s = value.trim()
  if (!s) return null
  const direct = parseSchedule(s, now)
  const oneTime =
    /^(every|each|next|in|on|tomorrow|today)\b/i.test(s) ||
    /\d{4}/.test(s) ||
    s.includes('/') ||
    new RegExp(`^${MONTH_RE}\\.?\\s+\\d{1,2}\\b`, 'i').test(s) ||
    new RegExp(`^\\d{1,2}\\s+${MONTH_RE}\\b`, 'i').test(s)
  if (!oneTime) {
    const prefixed = parseSchedule('every ' + s, now)
    if (prefixed && (!direct || direct.type === 'once')) return prefixed
  }
  return direct
}

// Surface several plausible readings of the input, Linear-style.
function interpretations(value, now) {
  const raw = value.trim()
  if (!raw || !now) return []
  const out = []
  const seen = new Set()
  const add = (phrase, label) => {
    const sch = parseRunsEvery(phrase, now)
    if (!sch) return
    const date = nextRunFor(sch, now)
    if (!date) return
    const key = `${sch.type}|${date.getTime()}`
    if (seen.has(key)) return
    seen.add(key)
    out.push({ phrase, schedule: sch, date, label: label || describeSchedule(sch) })
  }

  add(raw) // the literal reading (recurring-first via parseRunsEvery)

  // Bare number → every N days / monthly on the Nth / in N days
  const num = raw.match(/^(\d{1,3})$/)
  if (num) {
    const n = +num[1]
    add(`${n} days`, `Every ${n} days`)
    if (n >= 1 && n <= 31) add(`on the ${n}th`)
    add(`in ${n} days`, `In ${n} days`)
  }

  // Time only → offer the daily reading
  const t = extractTime(raw.toLowerCase())
  if (t.time && !t.rest) add(`day at ${raw}`)

  return out
}

// ── Quick chips ─────────────────────────────────────────────────────────────
const CHIPS = [
  { label: 'Custom', custom: true },
  { label: 'Hourly', phrase: 'hour', type: 'hourly' },
  { label: 'Daily', phrase: 'day at 9am', type: 'daily' },
  { label: 'Weekly', phrase: 'week', type: 'weekly' },
]
// Custom is the active chip whenever the schedule isn't one of the named presets.
const PRESET_TYPES = ['hourly', 'daily', 'weekly']

// ── Icons ───────────────────────────────────────────────────────────────────
const Svg = (p) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p} />
const CloseIcon = ({ className = '' }) => <Svg className={className}><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></Svg>
const ChevronDown = ({ className = '' }) => <Svg className={className}><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></Svg>
const fieldLabel = 'text-[12px] leading-4 text-[#1a1817]'
const inputBase = 'w-full rounded-md border-[0.5px] border-[#ebe9e8] bg-white px-2.5 py-2 text-[13px] leading-5 text-[#1a1817] outline-none placeholder:text-[#928c88] focus:border-[#d3d1ce]'

// ── Timezone ────────────────────────────────────────────────────────────────
const TZ_ZONES = ['America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York', 'UTC', 'Europe/London', 'Europe/Paris', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney']
function tzLabel(zone, now) {
  const part = (opt) => new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: opt }).formatToParts(now).find((p) => p.type === 'timeZoneName')?.value || ''
  const off = part('shortOffset').replace('GMT', 'UTC').replace('-', '−')
  return `${part('short')} — ${part('long')}${off ? `, ${off}` : ''}`
}
function detectZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'UTC' } }

// ── Smart schedule field ────────────────────────────────────────────────────
function ScheduleField({ value, onChange, now }) {
  const [open, setOpen] = useState(false)
  // The inline resolved date only shows once a value is committed (picked / Enter),
  // not live while the user is mid-type. The default value loads committed.
  const [committed, setCommitted] = useState(true)
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const schedule = useMemo(() => (now ? parseRunsEvery(value, now) : null), [value, now])
  const nextRun = useMemo(() => (now && schedule ? nextRunFor(schedule, now) : null), [schedule, now])
  const items = useMemo(() => interpretations(value, now), [value, now])
  const hasText = value.trim().length > 0

  const handleType = (v) => { onChange(v); setCommitted(false); setOpen(true) }
  const commit = (text) => { if (text !== undefined) onChange(text); setCommitted(true); setOpen(false) }
  const focusCustom = () => { onChange(''); setCommitted(false); setOpen(true); inputRef.current?.focus() }

  return (
    <div ref={ref} className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-col gap-1.5">
        <p className={fieldLabel}>Runs every</p>
        <div className="relative w-full">
          <div className="flex items-center gap-2 rounded-md border-[0.5px] border-[#ebe9e8] bg-white px-2.5 py-2 focus-within:border-[#d3d1ce]">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => handleType(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false)
                if (e.key === 'Enter' && items.length) { e.preventDefault(); commit(items[0].phrase) }
              }}
              spellCheck={false}
              placeholder="e.g. 10 days, weekday at 9am"
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-5 text-[#1a1817] outline-none placeholder:text-[#928c88]"
            />
            {!open && committed && nextRun && (
              <span className="shrink-0 text-[12px] leading-5 text-[#928c88]">
                {fmtDateLong(nextRun)} at {fmtClock({ h: nextRun.getHours(), m: nextRun.getMinutes() })}
              </span>
            )}
          </div>

          {/* Linear-style dropdown: surface several readings, commit on click */}
          {open && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-md border-[0.5px] border-[#ebe9e8] bg-white py-1 shadow-[0px_8px_24px_rgba(0,0,0,0.12)]">
              {items.length > 0 ? (
                items.map((it) => (
                  <button
                    key={it.phrase}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => commit(it.phrase)}
                    className="flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left hover:bg-[#f5f5f4]"
                  >
                    <span className="truncate text-[13px] leading-5 text-[#1a1817]">{it.label}</span>
                    <span className="shrink-0 text-[12px] leading-5 text-[#928c88]">{shortDate(it.date)}</span>
                  </button>
                ))
              ) : hasText ? (
                <p className="px-2.5 py-1.5 text-[11px] leading-[14px] text-[#928c88]">
                  Try &ldquo;10 days&rdquo; or &ldquo;weekday at 9am&rdquo;
                </p>
              ) : (
                <>
                  <p className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.6px] text-[#928c88]">Suggestions</p>
                  {CHIPS.filter((c) => !c.custom).map((c) => (
                    <button
                      key={c.label}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => commit(c.phrase)}
                      className="flex w-full items-center px-2.5 py-1.5 text-left hover:bg-[#f5f5f4]"
                    >
                      <span className="text-[12px] text-[#1a1817]">{c.label}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick chips — active = grey pill, inactive = plain text */}
      <div className="flex flex-wrap gap-1">
        {CHIPS.map((c) => {
          const active = c.custom
            ? !(schedule && PRESET_TYPES.includes(schedule.type))
            : schedule?.type === c.type
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => (c.custom ? focusCustom() : commit(c.phrase))}
              className={`rounded-full px-3 py-1 text-[12px] leading-4 transition-colors ${
                active ? 'bg-[#f5f5f4] text-[#1a1817]' : 'text-[#635d58] hover:bg-[#f5f5f4]'
              }`}
            >
              {c.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function AutomationTestPage() {
  const [open, setOpen] = useState(true)
  const [now, setNow] = useState(null)
  const [schedule, setSchedule] = useState('10 days')
  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [timezone, setTimezone] = useState('America/Los_Angeles')

  // Mount-time clock keeps SSR/client in sync; re-tick so "next run" stays fresh.
  useEffect(() => {
    setNow(new Date())
    setTimezone(detectZone())
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const tzOptions = useMemo(() => {
    if (!now) return []
    const zones = TZ_ZONES.includes(timezone) ? TZ_ZONES : [timezone, ...TZ_ZONES]
    return zones.map((z) => ({ value: z, label: tzLabel(z, now) }))
  }, [now, timezone])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F4] p-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-[#0f0d0d] px-3 py-1.5 text-[14px] text-white"
        >
          Open automation modal
        </button>
      ) : (
        <div
          className="flex w-[460px] flex-col rounded-[12px] bg-white"
          style={{ boxShadow: '0px 0px 0px 0.5px rgba(1,1,1,0.12), 0px 28px 32px 0px rgba(0,0,0,0.08)' }}
        >
          {/* Header */}
          <div className="flex w-full shrink-0 items-center justify-between gap-2 rounded-t-[12px] px-5 py-4">
            <p className="text-[15px] font-medium leading-5 text-[#1a1817]">Create automation</p>
            <button onClick={() => setOpen(false)} className="flex size-7 items-center justify-center rounded-md text-[#635d58] hover:bg-[#f5f5f4]" aria-label="Close">
              <CloseIcon />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-4 px-5 pb-5 pt-1">
            <div className="flex w-full flex-col gap-1.5">
              <p className={fieldLabel}>Name</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Meme sender"
                className={inputBase}
              />
            </div>

            <ScheduleField value={schedule} onChange={setSchedule} now={now} />

            <div className="flex w-full flex-col gap-1.5">
              <p className={fieldLabel}>Instructions</p>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={5}
                placeholder="e.g. Daily at 8:30am, summarize what changed in the PRs assigned to me since yesterday"
                className={`${inputBase} resize-none`}
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setAdvancedOpen((o) => !o)}
                className="flex items-center gap-1 self-start text-[12px] font-medium leading-4 text-[#2563eb]"
              >
                <ChevronDown className={`transition-transform ${advancedOpen ? '' : '-rotate-90'}`} />
                Advanced settings
              </button>

              {advancedOpen && (
                <div className="flex w-full flex-col gap-1.5">
                  <p className={fieldLabel}>Timezone</p>
                  <div className="relative w-full">
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full appearance-none rounded-md border-[0.5px] border-[#ebe9e8] bg-white px-2.5 py-2 pr-7 text-[12px] leading-4 text-[#1a1817] outline-none focus:border-[#d3d1ce]"
                    >
                      {tzOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#78716c]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex w-full shrink-0 items-center justify-end gap-2 rounded-b-[12px] border-t-[0.5px] border-[#ebe9e8] px-5 py-3">
            <button onClick={() => setOpen(false)} className="flex h-8 items-center rounded-md bg-[#f5f5f4] px-3 text-[14px] leading-5 text-[#1a1817] hover:bg-[#ebe9e8]">
              Cancel
            </button>
            <button className="flex h-8 items-center rounded-md bg-[#0f0d0d] px-3 text-[14px] leading-5 text-white hover:bg-[#1a1817]">
              Continue
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
