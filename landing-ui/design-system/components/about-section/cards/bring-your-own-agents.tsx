'use client'

import { Menu } from '@base-ui/react/menu'
import { Switch } from '@base-ui/react/switch'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Image, { type StaticImageData } from 'next/image'
import { useEffect, useState } from 'react'

import { Avatar } from '../avatar'
import { IconDotsHorizontal } from '../icons'
import aj from '../media/aj.webp'
import claude from '../media/claude.webp'
import cortana from '../media/cortana.webp'
import devin from '../media/devin.webp'
import jordan from '../media/jordan.webp'
import oli from '../media/oli.webp'
import sara from '../media/sara.webp'
import tadao from '../media/tadao.webp'
import yumi from '../media/yumi.webp'

interface BadgeData {
  id: string
  avatarSrc: StaticImageData
  label: string
}

interface AgentData {
  id: string
  name: string
  role: string
  avatarSrc: StaticImageData
  /** When true, wraps the avatar in a white tile so circular marks read as square icons. */
  tileAvatar?: boolean
  /** Source/owner chips shown under the role. */
  badges?: BadgeData[]
}

const EASE: [number, number, number, number] = [0.165, 0.84, 0.44, 1]

function AgentIcon({ src, tile }: { src: StaticImageData; tile?: boolean }) {
  if (tile) {
    // Circular brand marks need a white square container to match the square-tile
    // style used by the other agent logos.
    return (
      <div className="flex shrink-0 self-start items-center justify-center rounded-[6px] border border-black/[0.06] bg-white p-[4px]">
        <Image
          alt=""
          className="rounded-full"
          height={16}
          src={src}
          style={{ height: 16, width: 16 }}
          width={16}
        />
      </div>
    )
  }
  return <Avatar src={src} size={24} className="self-start rounded-[4px]" />
}

/**
 * The icon + name/role + tags + controls of one agent, with no outer box so the
 * caller owns the framing (the persistent spotlight container vs. a flat peek).
 * When `revealTags` the source/owner chips fade up with a blur as their own beat,
 * after the row has slid into the spotlight.
 */
function AgentRowContent({
  name,
  role,
  avatarSrc,
  tileAvatar,
  badges,
  revealTags,
}: AgentData & { revealTags?: boolean }) {
  return (
    <div className="flex w-full items-center gap-3">
      <AgentIcon src={avatarSrc} tile={tileAvatar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[14px] leading-5 text-[#24211f]">{name}</span>
        <span className="text-[12px] leading-[18px] text-[#635d58]">
          {role}
        </span>

        {badges && badges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {badges.map((b, i) => (
              // Fade the chips in behind a blur (no scale/overshoot). They keep
              // their layout box throughout, so reserving the height never shifts
              // the row.
              <motion.span
                key={b.id}
                initial={
                  revealTags ? { opacity: 0, filter: 'blur(2px)' } : false
                }
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={
                  revealTags
                    ? { delay: 0.22 + i * 0.07, duration: 0.45, ease: EASE }
                    : { duration: 0 }
                }
                className="inline-flex items-center gap-1 rounded bg-[#f5f5f4] px-1.5 py-0.5"
              >
                <Avatar src={b.avatarSrc} size={12} />
                <span className="text-[10px] leading-[18px] text-[#24211f]">
                  {b.label}
                </span>
              </motion.span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-[3px] flex shrink-0 items-center gap-1 self-start">
        <Switch.Root
          aria-label={`Toggle ${name}`}
          defaultChecked
          className="focus-ring relative inline-flex h-[14px] w-[23px] shrink-0 cursor-pointer items-center rounded-full bg-black/15 p-[2px] transition-colors data-[checked]:bg-[#2563eb]"
        >
          <Switch.Thumb className="size-[10px] rounded-full bg-white transition-transform data-[checked]:translate-x-[9px]" />
        </Switch.Root>
        <Menu.Root>
          <Menu.Trigger
            aria-label="Agent options"
            className="focus-ring flex size-5 cursor-pointer items-center justify-center rounded text-[#635d58] transition-colors hover:bg-black/[0.04] data-[popup-open]:bg-black/[0.04]"
          >
            <IconDotsHorizontal size={14} />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner align="end" className="z-50" sideOffset={4}>
              <Menu.Popup className="min-w-[160px] origin-[var(--transform-origin)] rounded-xl border border-border-subtle bg-surface-primary p-1 text-[#24211f] shadow-[0px_8px_24px_-8px_rgba(0,0,0,0.18)] outline-none transition-[opacity,scale] duration-200 ease-out data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none">
                <Menu.Item className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[13px] leading-5 outline-none select-none data-[highlighted]:bg-black/[0.04]">
                  Configure
                </Menu.Item>
                <Menu.Item className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[13px] leading-5 outline-none select-none data-[highlighted]:bg-black/[0.04]">
                  Duplicate
                </Menu.Item>
                <Menu.Item className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[13px] leading-5 text-text-danger outline-none select-none data-[highlighted]:bg-black/[0.04]">
                  Remove
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>
    </div>
  )
}

/** A dimmed neighbour above/below the spotlight; its agent swaps with a soft slide. */
function PeekRow({ agent, animate }: { agent: AgentData; animate: boolean }) {
  return (
    // Transparent 1px border matches the spotlight box's content inset so avatars
    // line up across all three rows.
    <div className="rounded-2xl border border-transparent p-3">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={agent.id}
          initial={animate ? { opacity: 0, y: 16, filter: 'blur(3px)' } : false}
          animate={{ opacity: 0.45, y: 0, filter: 'blur(0px)' }}
          exit={
            animate
              ? { opacity: 0, y: -16, filter: 'blur(3px)' }
              : { opacity: 0 }
          }
          transition={
            animate ? { duration: 0.55, ease: EASE } : { duration: 0 }
          }
        >
          {/* Tags belong to the spotlight only - keeping peeks tag-free holds every
              neighbour at one height, so the spotlight box's top never drifts. */}
          <AgentRowContent {...agent} badges={undefined} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

const AGENTS: AgentData[] = [
  {
    id: 'yumi',
    name: 'Yumi',
    role: 'Project management maestro',
    avatarSrc: yumi,
    badges: [{ id: 'sara', avatarSrc: sara, label: 'Added by Sara' }],
  },
  {
    id: 'tadao',
    name: 'Tadao',
    role: 'Workspace-wide helper',
    avatarSrc: tadao,
    badges: [{ id: 'oli', avatarSrc: oli, label: 'Added by Oli' }],
  },
  {
    id: 'claude',
    name: 'Claude',
    role: 'AI coding assistant',
    avatarSrc: claude,
    tileAvatar: true,
    badges: [{ id: 'aj', avatarSrc: aj, label: 'Added by AJ' }],
  },
  {
    id: 'devin',
    name: 'Devin',
    role: 'AI software engineer',
    avatarSrc: devin,
    tileAvatar: true,
    badges: [{ id: 'aj', avatarSrc: aj, label: 'Added by AJ' }],
  },
  {
    id: 'cortana',
    name: 'Cortana',
    role: 'Helps crush bugs',
    avatarSrc: cortana,
    badges: [{ id: 'jordan', avatarSrc: jordan, label: 'Added by Jordan' }],
  },
]

const N = AGENTS.length

// The spotlight rests on the tagged agent (the hero frame); the active loop runs
// the full roster and returns here, so deactivating never jumps.
const REST_INDEX = 1
const STEP_MS = 1300

/**
 * The agent roster. The white spotlight container stays fixed; while `active` the
 * next agent slides up into it every {@link STEP_MS}, its source/owner tags fade up
 * after it lands, and after one full loop back to the starting agent it hands the
 * sequence on via `onDone`. At rest it holds the three-row spotlight window.
 */
export function BringYourOwnAgents({
  active,
  onDone,
}: {
  active: boolean
  onDone: () => void
}) {
  const [beat, setBeat] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!active || reduceMotion) return
    setBeat(0)
    let b = 0
    let timer: ReturnType<typeof setTimeout>
    const advance = () => {
      b++
      setBeat(b)
      // b === N means we've looped back to REST_INDEX; hold, then hand off.
      timer = setTimeout(b < N ? advance : onDone, STEP_MS)
    }
    timer = setTimeout(advance, STEP_MS)
    return () => clearTimeout(timer)
  }, [active, reduceMotion, onDone])

  // Centre walks the roster from REST_INDEX and lands back on it at b === N.
  const center = active ? (REST_INDEX + beat) % N : REST_INDEX
  const prev = AGENTS[(center - 1 + N) % N]
  const next = AGENTS[(center + 1) % N]
  const centerAgent = AGENTS[center]

  if (!centerAgent || !prev || !next) return null

  const animate = active && !reduceMotion

  return (
    <div className="flex w-full flex-col gap-2">
      <PeekRow agent={prev} animate={animate} />

      {/* Persistent spotlight: the box never re-mounts, so it stays put while the
          agent content slides through it and the box height settles via `layout`. */}
      <motion.div
        layout
        className="rounded-2xl border border-border-subtle bg-surface-primary p-3 shadow-[0px_2px_8px_-4px_rgba(0,0,0,0.08)]"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={center}
            initial={
              animate ? { opacity: 0, y: 24, filter: 'blur(4px)' } : false
            }
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={
              animate
                ? { opacity: 0, y: -24, filter: 'blur(4px)' }
                : { opacity: 0 }
            }
            transition={
              animate ? { duration: 0.55, ease: EASE } : { duration: 0 }
            }
          >
            <AgentRowContent {...centerAgent} revealTags={animate} />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <PeekRow agent={next} animate={animate} />
    </div>
  )
}

BringYourOwnAgents.displayName = 'BringYourOwnAgents'
