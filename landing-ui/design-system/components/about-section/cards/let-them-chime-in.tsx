'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

import { Avatar } from '../avatar'
import { IconCodeInsert, LinearMark } from '../icons'
import aj from '../media/aj.webp'
import chatYumi from '../media/chat-yumi.webp'

const EASE: [number, number, number, number] = [0.165, 0.84, 0.44, 1]

const LOOKING = 'Looking into this!'
const DIAGNOSIS =
  'Reproduced on both - images over 5 MB hit the crash. Filed it and tagged the composer team.'

// Agent typing speed (chars/sec), mirroring the Ando hero's deterministic CPS.
// The long diagnosis types a touch quicker so it doesn't drag.
const CPS = 45
const DIAGNOSIS_CPS = 54
const typeMs = (s: string, cps = CPS) => (s.length / cps) * 1000
const typeAt = (full: string, localMs: number, cps = CPS) =>
  localMs <= 0 ? '' : full.slice(0, Math.floor((localMs * cps) / 1000))

// Beat schedule (ms from when the card goes active), carrying over the hero's
// pacing: type "Looking" → check codebase (busy) → settle + type diagnosis →
// file chip → hold the finished thread, then hand off.
const T_LOOKING = 200
const T_CHECKING = T_LOOKING + typeMs(LOOKING) + 500
const T_CHECKED = T_CHECKING + 1400
const T_DIAGNOSIS = T_CHECKED + 200
const T_CHIP = T_DIAGNOSIS + typeMs(DIAGNOSIS, DIAGNOSIS_CPS) + 400
const T_DONE = T_CHIP + 2600

const block = (active: boolean) =>
  active
    ? {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: EASE },
      }
    : { initial: false as const, animate: { opacity: 1, y: 0 } }

/**
 * A thread where a human reports a bug and Yumi chimes in: types a reply, checks
 * the codebase (shimmering status that settles), types the diagnosis, then files
 * the Linear ticket. While `active` it plays the beat sequence once and calls
 * `onDone`; at rest it shows the finished thread.
 */
export function LetThemChimeIn({
  active,
  onDone,
}: {
  active: boolean
  onDone: () => void
}) {
  const [t, setT] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!active || reduceMotion) return
    setT(0)
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const elapsed = now - start
      setT(elapsed)
      if (elapsed < T_DONE) raf = requestAnimationFrame(tick)
      else onDone()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, reduceMotion, onDone])

  // At rest the whole thread is settled (everything visible, fully typed).
  const settled = !active
  const showYumi = settled || t >= T_LOOKING
  const checking = active && t >= T_CHECKING && t < T_CHECKED
  const checked = settled || t >= T_CHECKED
  const showDiagnosis = settled || t >= T_DIAGNOSIS
  const showChip = settled || t >= T_CHIP
  const lookingText = settled ? LOOKING : typeAt(LOOKING, t - T_LOOKING)
  const diagnosisText = settled
    ? DIAGNOSIS
    : typeAt(DIAGNOSIS, t - T_DIAGNOSIS, DIAGNOSIS_CPS)

  return (
    <div className="flex w-full flex-col gap-8">
      {/* AJ's message — always visible */}
      <div className="flex items-start gap-2.5">
        <Avatar src={aj} size={24} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-medium leading-5 text-[#24211f]">
              AJ
            </span>
            <span className="text-[12px] leading-4 text-[#78716c]">
              10:00 am
            </span>
          </div>
          <p className="text-[14px] leading-5 text-[#24211f]">
            found a bug. composer crashes when I paste an image from clipboard
            lol
          </p>
        </div>
      </div>

      {/* Yumi's section — types, works, replies, files. Exits + replays when the
          spotlight returns to this card. */}
      <AnimatePresence>
        {showYumi && (
          <motion.div
            key="yumi"
            initial={active ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="flex items-start gap-2.5"
          >
            <Avatar src={chatYumi} size={24} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[14px] font-medium leading-5 text-[#7c3aed]">
                  Yumi
                </span>
                <span className="text-[12px] leading-4 text-[#78716c]">
                  10:00 am
                </span>
              </div>
              {/* min-h-5 holds the line's height while it types (no layout shift) */}
              <p className="min-h-5 text-[14px] leading-5 text-[#24211f]">
                {lookingText}
              </p>

              {/* Status row: "Checking codebase..." (shimmer) settling to
                  "Checked codebase" — the Ando hero's exact busy→settled beat. */}
              {(checking || checked) && (
                <motion.div
                  {...block(active)}
                  className="flex items-center gap-2"
                >
                  <IconCodeInsert size={16} className="text-[#a8a29e]" />
                  {checking ? (
                    <span className="animate-text-shimmer text-[14px] leading-5">
                      Checking codebase...
                    </span>
                  ) : (
                    <span className="text-[14px] leading-5 text-[#928c88]">
                      Checked codebase
                    </span>
                  )}
                </motion.div>
              )}

              {/* Diagnosis — types out after the check settles */}
              {showDiagnosis && (
                <motion.p
                  {...block(active)}
                  className="min-h-5 text-[14px] leading-5 text-[#24211f]"
                >
                  {diagnosisText}
                </motion.p>
              )}

              {/* AND-214 — the filed ticket: rises + unblurs with a springy
                  scale pop (a "just filed" beat), exits on replay. */}
              <AnimatePresence>
                {showChip && (
                  <motion.button
                    key="chip"
                    type="button"
                    initial={
                      active
                        ? { opacity: 0, y: 6, scale: 0.92, filter: 'blur(4px)' }
                        : false
                    }
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      filter: 'blur(0px)',
                    }}
                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                    transition={
                      active
                        ? {
                            opacity: { duration: 0.2, ease: 'easeOut' },
                            filter: { duration: 0.25, ease: 'easeOut' },
                            y: { type: 'spring', stiffness: 420, damping: 24 },
                            scale: {
                              type: 'spring',
                              stiffness: 460,
                              damping: 17,
                              mass: 0.7,
                            },
                          }
                        : { duration: 0 }
                    }
                    style={{ originX: 0.15, originY: 1 }}
                    className="focus-ring inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-[18px] border border-border-subtle bg-surface-primary px-3 py-1.5 shadow-[0px_2px_8px_-4px_rgba(0,0,0,0.08)] transition-colors hover:bg-black/[0.04]"
                  >
                    <LinearMark size={16} />
                    <span className="text-[12px] font-medium leading-[18px] text-[#2563eb]">
                      AND-214
                    </span>
                    <span className="text-[12px] leading-[18px] text-black">
                      Composer paste crash
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

LetThemChimeIn.displayName = 'LetThemChimeIn'
