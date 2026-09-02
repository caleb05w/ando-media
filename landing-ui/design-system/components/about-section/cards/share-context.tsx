'use client'

import { Collapsible } from '@base-ui/react/collapsible'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { enterAt, screenExit } from '#lib/motion'
import { Avatar } from '../avatar'
import { IconCall, IconFolder, IconHashtag, IconHashtagLock } from '../icons'
import call1 from '../media/call-1.webp'
import call2 from '../media/call-2.webp'
import call3 from '../media/call-3.webp'
import call4 from '../media/call-4.webp'

const CALL_AVATARS = [
  { id: 'c1', src: call1 },
  { id: 'c2', src: call2 },
  { id: 'c3', src: call3 },
  { id: 'c4', src: call4 },
]
// How long each phase lasts before advancing (ms). The call assembles first
// (label → four avatars join → Join button), then the unread badges spring in
// quickly one after another - so notifications land just after the call animation,
// never during it. phase: 0 label | 1-4 avatars | 5 Join | 6-8 notifications | 9 hold
const PHASE_DELAYS = [
  1400, 250, 250, 250, 480, 380, 240, 240, 320, 2200,
] as const
const TOTAL_PHASES = PHASE_DELAYS.length

// Connector hairline. Opaque (overlapping segments never double-darken) + a
// warm light grey that reads at the same weight everywhere. `transform-gpu`
// snaps each 1px line to its own pixel-aligned layer so the rendered width
// stays consistent instead of softening on sub-pixel boundaries.
const LINE = 'bg-[#dcd8d4] transform-gpu'

// ---------------------------------------------------------------------------
// Small parts
// ---------------------------------------------------------------------------

/** Three pulsing dots — the "call is starting" indicator beside the label. */
function LoadingDots() {
  const reduce = useReducedMotion()
  return (
    <span className="inline-flex items-center gap-[3px]">
      {['d0', 'd1', 'd2'].map((id, i) => (
        <motion.span
          key={id}
          className="size-[3px] rounded-full bg-[#a8a29e]"
          animate={reduce ? undefined : { opacity: [0.25, 1, 0.25] }}
          transition={
            reduce
              ? undefined
              : {
                  duration: 1.2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                  delay: i * 0.18,
                }
          }
        />
      ))}
    </span>
  )
}

function NotificationBadge({
  count,
  visible,
}: {
  count: number
  visible: boolean
}) {
  const reduce = useReducedMotion()
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          initial={reduce ? false : { scale: 0, opacity: 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  // Spring in with a subtle overshoot so the unread count pops,
                  // not fades (matches the house "scale pop").
                  scale: {
                    type: 'spring',
                    stiffness: 460,
                    damping: 17,
                    mass: 0.7,
                  },
                  opacity: { duration: 0.15, ease: 'easeOut' },
                }
          }
          className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] px-[3px] text-[10px] font-semibold leading-none text-white"
        >
          {/* On retina the subpixel grid renders the numeral low-and-right, so
              nudge it 0.25px up and 0.25px left there; non-retina sits at baseline. */}
          <span className="text-center [@media(min-resolution:2dppx)]:-translate-x-[0.25px] [@media(min-resolution:2dppx)]:-translate-y-[0.25px]">
            {count}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ChannelRow({
  icon,
  label,
  badge,
}: {
  icon: ReactNode
  label: string
  badge?: ReactNode
}) {
  return (
    <button
      type="button"
      className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-xl pl-6 pr-2 text-left outline-none transition-colors hover:bg-black/[0.04] focus-visible:bg-black/[0.04]"
    >
      {icon}
      <span className="flex-1 text-[14px] leading-5 text-[#24211f]">
        {label}
      </span>
      {badge}
    </button>
  )
}

/** Horizontal elbow stub only — the vertical rail is drawn by the parent. */
function ElbowConnector() {
  return (
    <div className="relative w-[34px] shrink-0">
      <span className={`absolute left-[15px] top-1/2 h-px w-[14px] ${LINE}`} />
    </div>
  )
}

function ThreadRow({ label, badge }: { label: string; badge?: ReactNode }) {
  return (
    <div className="flex items-stretch pl-4">
      <ElbowConnector />
      <button
        type="button"
        className="flex h-8 flex-1 cursor-pointer items-center justify-between rounded-md px-2 text-left outline-none transition-colors hover:bg-black/[0.04] focus-visible:bg-black/[0.04]"
      >
        <span className="text-[14px] leading-5 text-[#24211f]">{label}</span>
        {badge}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * The shared #design channel. While `active` it plays the call sequence -
 * "A call started" → people join one by one → Join button → notifications fill
 * the threads - then hands off via `onDone`. At rest it shows the settled state:
 * everyone already in the call and the unread badges present.
 */
export function ShareContext({
  active,
  onDone,
}: {
  active: boolean
  onDone: () => void
}) {
  const [phase, setPhase] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!active || reduceMotion) return
    setPhase(0)
    let i = 0
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      i++
      if (i < TOTAL_PHASES) {
        setPhase(i)
        timer = setTimeout(tick, PHASE_DELAYS[i] ?? 2000)
      } else {
        onDone()
      }
    }
    timer = setTimeout(tick, PHASE_DELAYS[0])
    return () => clearTimeout(timer)
  }, [active, reduceMotion, onDone])

  // At rest the call has settled: everyone is in and the unreads are present.
  const settled = !active
  const avatarCount = settled ? 4 : Math.min(phase, 4)
  const showCallLabel = active && phase === 0
  const showJoin = active && phase >= 5
  // The phone rings while the call is forming (label + avatars), then calms.
  const ringing = active && phase <= 4
  // Unread badges land only once the call has assembled (phase >= 6).
  const badge = (threshold: number) => settled || phase >= threshold

  return (
    <div className="flex w-full flex-col gap-2">
      {/* Panel A — active channel header + live call row */}
      <div className="flex flex-col gap-1 rounded-2xl border border-border-subtle bg-surface-primary p-3 shadow-[0px_2px_8px_-4px_rgba(0,0,0,0.08)]">
        {/* Active channel bar */}
        <div className="flex h-8 items-center gap-2.5 rounded-[3px] bg-black/[0.04] pl-4 pr-2">
          <IconHashtag size={16} className="text-[#24211f]" />
          <span className="text-[14px] leading-5 text-[#24211f]">design</span>
        </div>

        {/* Call row — fixed h-8 prevents the Join button's height from shifting the layout */}
        <div className="flex items-stretch pl-2">
          <div className="relative h-8 w-[34px] shrink-0">
            <span className={`absolute left-[15px] top-0 h-1/2 w-px ${LINE}`} />
            <span
              className={`absolute left-[15px] top-1/2 h-px w-[14px] ${LINE}`}
            />
          </div>

          <div className="flex h-8 flex-1 items-center justify-between pr-2">
            <div className="flex items-center gap-2.5">
              {/* The call icon buzzes like a ringing phone while the call forms. */}
              <motion.span
                className="inline-flex"
                style={{ transformOrigin: '50% 50%' }}
                animate={
                  ringing && !reduceMotion
                    ? { rotate: [0, -12, 10, -8, 6, -3, 0] }
                    : { rotate: 0 }
                }
                transition={
                  ringing && !reduceMotion
                    ? {
                        duration: 0.6,
                        ease: 'easeInOut',
                        repeat: Number.POSITIVE_INFINITY,
                        repeatDelay: 0.55,
                      }
                    : { duration: 0.2 }
                }
              >
                <IconCall size={16} className="text-[#78716c]" />
              </motion.span>

              {/* Phase 0: shimmering "A call started" + pulsing dots; phases 1+: growing avatar stack */}
              <AnimatePresence mode="wait" initial={false}>
                {showCallLabel ? (
                  <motion.span
                    key="label"
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex items-center gap-1.5"
                  >
                    <span className="animate-text-shimmer text-[13px] leading-[18px]">
                      A call started
                    </span>
                    <LoadingDots />
                  </motion.span>
                ) : (
                  <motion.div
                    key="avatars"
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center"
                  >
                    <AnimatePresence initial={false}>
                      {CALL_AVATARS.slice(0, avatarCount).map(
                        ({ id, src }, i) => (
                          <motion.div
                            key={id}
                            animate={{ scale: 1, opacity: 1 }}
                            initial={
                              reduceMotion ? false : { scale: 0.4, opacity: 0 }
                            }
                            transition={
                              reduceMotion
                                ? { duration: 0 }
                                : {
                                    // Spring in with a very subtle overshoot as
                                    // each person joins, instead of a flat fade.
                                    scale: {
                                      type: 'spring',
                                      stiffness: 480,
                                      damping: 28,
                                      mass: 0.7,
                                    },
                                    opacity: {
                                      duration: 0.18,
                                      ease: 'easeOut',
                                    },
                                  }
                            }
                            className={i < avatarCount - 1 ? '-mr-1' : ''}
                          >
                            <Avatar src={src} size={18} />
                          </motion.div>
                        ),
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Join button — appears once all four avatars have joined. Rises +
                unblurs + fades on the shared waitlist entrance recipe (not a
                scale pop), exiting on the faster shared exit timing. */}
            <AnimatePresence initial={false}>
              {showJoin && (
                <motion.button
                  key="join"
                  type="button"
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, y: 8, filter: 'blur(6px)' }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    transition: reduceMotion ? { duration: 0 } : enterAt(0),
                  }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          y: -6,
                          filter: 'blur(6px)',
                          transition: screenExit,
                        }
                  }
                  className="focus-ring inline-flex cursor-pointer items-center rounded-full bg-[#008236] px-3 py-1 text-[12px] font-medium leading-[18px] text-white transition-colors hover:bg-[#00702e]"
                >
                  Join
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Panel B — collapsible folder/channel tree */}
      <Collapsible.Root
        defaultOpen
        className="rounded-t-2xl border border-b-0 border-border-subtle px-3 pb-2 pt-3"
      >
        {/* `inert`: this folder toggle is decorative-only - drop it from pointer,
            keyboard and the a11y tree even though the rest of the mockup stays live. */}
        <Collapsible.Trigger
          inert
          aria-label="Toggle folder"
          className="focus-ring flex h-6 w-full cursor-pointer items-center gap-2 rounded px-2"
        >
          <IconFolder size={16} className="text-[#635d58]" />
          <span className="h-[14px] w-[65px] rounded bg-black/[0.04]" />
        </Collapsible.Trigger>

        <Collapsible.Panel className="flex flex-col gap-0.5 overflow-hidden pt-0.5">
          {/* #general + its thread children — relative so one solid rail spans them */}
          <div className="relative flex flex-col">
            {/* Vertical rail: starts just below the #general row (so it doesn't
                cross the # glyph) down to the center of the last thread. */}
            <div
              className={`absolute bottom-[16px] left-[31px] top-[32px] w-px ${LINE}`}
            />

            <ChannelRow
              icon={<IconHashtag size={16} className="text-[#24211f]" />}
              label="general"
              badge={<NotificationBadge count={5} visible={badge(6)} />}
            />
            <ThreadRow
              label="Landing page discussion"
              badge={<NotificationBadge count={2} visible={badge(7)} />}
            />
            <ThreadRow
              label="Lunch time!!"
              badge={<NotificationBadge count={1} visible={badge(8)} />}
            />
          </div>

          <ChannelRow
            icon={<IconHashtagLock size={16} className="text-[#24211f]" />}
            label="june-onsite"
          />
        </Collapsible.Panel>
      </Collapsible.Root>
    </div>
  )
}

ShareContext.displayName = 'ShareContext'
