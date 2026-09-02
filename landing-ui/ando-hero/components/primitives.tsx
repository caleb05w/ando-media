import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import {
  imgIconCodeInsert,
  imgIconLinear,
  imgIconLoadingCircle,
  imgIconMagnifyingGlass3,
} from '../assets/figma'

/* Springy chip/reaction pop with a tiny tilt. */
const chipSpring = {
  opacity: { duration: 0.15, ease: 'easeOut' },
  scale: { type: 'spring', stiffness: 480, damping: 16, mass: 0.7 },
  rotate: { type: 'spring', stiffness: 480, damping: 18 },
} as const

export function PopIn({
  children,
  className,
  burst,
  burstDelay,
}: {
  children: React.ReactNode
  className?: string
  burst?: string
  burstDelay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, rotate: -4 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={chipSpring}
      style={{ originX: 0.2, originY: 1 }}
      className={className}
    >
      {children}
      {burst ? <Burst emoji={burst} delay={burstDelay} /> : null}
    </motion.div>
  )
}

/* Emoji particles exploding radially upward. CSS-driven (see .emoji-burst): Motion keyframes proved fragile across render paths. Fired in waves, one per count tick. */
const WAVE_N = 3
function Burst({
  emoji,
  delay = 0,
  wave = 0,
}: {
  emoji: string
  delay?: number
  wave?: number
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-[14px] top-[4px]"
    >
      {Array.from({ length: WAVE_N }, (_, i) => {
        // deterministic fan, rotated per wave
        const angle =
          ((-90 + (i - 1) * 38 + (((wave * 23) % 29) - 14)) * Math.PI) / 180
        const dist = 50 + ((i + wave) % 3) * 16
        const dx = Math.cos(angle) * dist
        const dy = Math.sin(angle) * dist - 14
        const rot = ((i + wave) % 2 ? 1 : -1) * (18 + i * 9)
        const size = 13 + ((i + wave * 2) % 3) * 3
        return (
          <span
            key={i}
            className="absolute emoji-burst"
            style={
              {
                fontSize: size,
                left: i * 6,
                animationDelay: `${delay}s`, // all particles launch together
                '--bx': `${dx}px`,
                '--by': `${dy}px`,
                '--br': `${rot}deg`,
              } as React.CSSProperties
            }
          >
            {emoji}
          </span>
        )
      })}
    </div>
  )
}

/* Ticks 1 → N; digit display and burst waves both ride it. */
function useRollingCount(to: number, run: boolean) {
  const [n, setN] = useState(run ? 1 : to)
  useEffect(() => {
    if (!run || n >= to) return
    const t = setTimeout(() => setN((v) => v + 1), n === 1 ? 420 : 260) // first beat lands, then steady ticks
    return () => clearTimeout(t)
  }, [n, to, run])
  return n
}

function RollingDigit({ n, purple }: { n: number; purple?: boolean }) {
  return (
    <div className="h-[16px] overflow-hidden relative w-full">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={n}
          initial={{ y: 13, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -13, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 700, damping: 38 }}
          className={`[word-break:break-word] font-medium leading-[16px] relative text-[12px] ${purple ? 'text-[#7c3aed]' : 'text-[rgba(0,0,0,0.87)]'} text-center w-full`}
          style={{ fontFeatureSettings: '"liga" 0' }}
        >
          {n}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

/* Reaction pill - node 1642:1344 (channel) / in-thread identical. */
export function ReactionPill({
  emoji,
  count,
  animated,
  burstDelay,
  purple,
}: {
  emoji: string
  count: number
  animated: boolean
  burstDelay?: number
  purple?: boolean
}) {
  const n = useRollingCount(count, animated)
  const inner = (
    <>
      <p
        className="[word-break:break-word] font-normal leading-[20px] overflow-hidden relative shrink-0 text-[14px] text-[rgba(0,0,0,0.87)] text-center text-ellipsis whitespace-nowrap"
        style={{ fontFeatureSettings: '"liga" 0' }}
      >
        {emoji}
      </p>
      <div className="content-stretch flex flex-col items-center justify-center px-[4px] relative shrink-0 w-[16px]">
        {animated ? (
          <RollingDigit n={n} purple={purple} />
        ) : (
          <p
            className={`[word-break:break-word] font-medium leading-[16px] overflow-hidden relative shrink-0 text-[12px] ${purple ? 'text-[#7c3aed]' : 'text-[rgba(0,0,0,0.87)]'} text-center text-ellipsis w-full`}
            style={{ fontFeatureSettings: '"liga" 0' }}
          >
            {count}
          </p>
        )}
      </div>
    </>
  )
  const pill = `${purple ? 'bg-[#f5f3ff]' : 'bg-[rgba(0,0,0,0.05)]'} content-stretch flex gap-[2px] h-[24px] items-center justify-center overflow-clip pl-[8px] pr-[6px] py-px relative rounded-[16px] shrink-0`
  if (!animated) return <div className={pill}>{inner}</div>
  return (
    <PopIn className={`${pill} !overflow-visible`}>
      {inner}
      {/* one particle wave per count tick */}
      {Array.from({ length: n }, (_, w) => (
        <Burst
          key={w}
          emoji={emoji}
          wave={w}
          delay={w === 0 ? burstDelay : 0}
        />
      ))}
    </PopIn>
  )
}

/* Linear ticket chip - node 1642:2488 "mcp tool". */
export function LinearChip({
  ticket,
  title,
  animated,
}: {
  ticket: string
  title: string
  animated: boolean
}) {
  const inner = (
    <>
      <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
        <div className="relative shrink-0 size-[16px]">
          <img
            alt=""
            className="absolute block inset-0 max-w-none size-full"
            src={imgIconLinear}
          />
        </div>
        <div
          className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both] [word-break:break-word] flex flex-col font-medium justify-center leading-[0] overflow-hidden relative shrink-0 text-[12px] text-[#2563eb] text-ellipsis whitespace-nowrap"
          style={{ fontFeatureSettings: '"liga" 0' }}
        >
          <p className="leading-[18px]">{ticket}</p>
        </div>
      </div>
      <div
        className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both] [word-break:break-word] flex flex-col font-normal justify-center leading-[0] min-w-0 overflow-hidden relative text-[12px] text-[rgba(0,0,0,0.63)]"
        style={{ fontFeatureSettings: '"liga" 0' }}
      >
        <p className="leading-[18px] overflow-hidden text-ellipsis whitespace-nowrap">
          {title}
        </p>
      </div>
    </>
  )
  // hugs its content, but caps at the parent width and truncates the title rather than overflowing
  const pill =
    'bg-white content-stretch flex gap-[8px] h-[24px] items-center overflow-clip pl-[8px] pr-[12px] relative rounded-[44px] shadow-[0px_0px_1px_0.5px_rgba(0,0,0,0.08),0px_1px_2px_-1px_rgba(0,0,0,0.08),0px_3px_6px_-3px_rgba(0,0,0,0.08)] w-fit max-w-full'
  if (!animated) return <div className={pill}>{inner}</div>
  return <PopIn className={pill}>{inner}</PopIn>
}

/* @Ando mention pill - node 1642:2831. */
export function MentionPill({
  label,
  person,
}: {
  label: string
  person?: boolean
}) {
  // purple = agent, blue = person (7388:55)
  return (
    <div
      className={`${person ? 'bg-[#eff6ff]' : 'bg-[#f5f3ff]'} content-stretch flex h-[20px] items-center justify-center px-[2px] relative rounded-[2px] shrink-0`}
    >
      <div
        className={`[word-break:break-word] flex flex-col font-medium justify-center leading-[0] overflow-hidden relative shrink-0 text-[14px] ${person ? 'text-[#2563eb]' : 'text-[#7c3aed]'} text-center text-ellipsis whitespace-nowrap`}
        style={{ fontFeatureSettings: '"liga" 0' }}
      >
        <p className="leading-[20px] overflow-hidden text-ellipsis">{label}</p>
      </div>
    </div>
  )
}

/* Agent status row - spinner (1642:2089), code-insert (1642:2483), magnifier (1642:3252). */
export type StatusIcon = 'spinner' | 'code' | 'search'
const STATUS_ICONS: Record<StatusIcon, string> = {
  spinner: imgIconLoadingCircle,
  code: imgIconCodeInsert,
  search: imgIconMagnifyingGlass3,
}

export function StatusRow({
  icon,
  text,
  busy,
}: {
  icon: StatusIcon
  text: string
  busy?: boolean
}) {
  const img = (
    <img
      alt=""
      className="absolute block inset-0 max-w-none size-full"
      src={STATUS_ICONS[icon]}
    />
  )
  let iconMotion = ''
  if (icon === 'spinner') iconMotion = 'status-spin'
  else if (icon === 'search' && busy) iconMotion = 'status-wiggle'
  return (
    // gap reads ~2px wider than set: glyphs ink ~2.4px short of their 16px box
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
      <div className={`relative shrink-0 size-[16px] ${iconMotion}`}>{img}</div>
      <div
        className={`[word-break:break-word] flex flex-col font-normal justify-center leading-[0] overflow-hidden relative shrink-0 text-[14px] text-ellipsis whitespace-nowrap ${busy || icon === 'spinner' ? 'status-shimmer' : 'text-[rgba(0,0,0,0.45)]'}`}
        style={{ fontFeatureSettings: '"liga" 0' }}
      >
        <p className="leading-[20px]">{text}</p>
      </div>
    </div>
  )
}

/* 24px round avatar. */
export function Avatar({ src, size = 24 }: { src: string; size?: number }) {
  return (
    <div
      className="overflow-clip relative rounded-[999px] shrink-0"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute left-0 top-0"
        style={{ width: size, height: size }}
      >
        <img
          alt=""
          className="absolute block inset-0 max-w-none size-full"
          height={size}
          src={src}
          width={size}
        />
      </div>
    </div>
  )
}

/* Typing caret for the agent's live-typed text. */
export function Caret() {
  return (
    <motion.span
      aria-hidden
      className="inline-block w-[1.5px] h-[13px] bg-[rgba(0,0,0,0.36)] align-[-2px] ml-[1px]"
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 0.8, times: [0, 0.5, 0.5, 1], repeat: Infinity }}
    />
  )
}
