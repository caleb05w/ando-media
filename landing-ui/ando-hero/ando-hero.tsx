'use client'

import { MotionConfig } from 'motion/react'
import {
  lazy,
  memo,
  type RefObject,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  avatarAlexPhoto,
  avatarAndo,
  avatarCaleb,
  avatarGraemePhoto,
  avatarSaraPhoto,
  imgSubtract1,
  imgSubtract3,
  miniAndo,
} from './assets/figma'
import { type ChatMessage, ChatPanel } from './components/chat-panel'
import { ConversationsSidebar } from './components/conversations-sidebar'
import { SideNav } from './components/side-nav'
import { SkyGridLayer } from './components/sky-grid-layer'
import {
  type AgentPart,
  type ThreadData,
  ThreadModal,
  type ThreadReplyData,
} from './components/thread-panel'
import { Titlebar } from './components/titlebar'

/** Join truthy class strings (no tailwind-merge: the branches emit disjoint utilities). */
const join = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(' ')

// lazy WebGL2 sky: hero paints first, and `background`-off consumers never load it
const SoraBackground = lazy(() =>
  import('./components/sora-background').then((m) => ({
    default: m.SoraBackground,
  })),
)

/* the cast & the script */

const ANDO_PURPLE = '#7c3aed'

const M = {
  oliver: {
    id: 'oliver',
    name: 'Oliver',
    time: '10:00 am',
    text: 'morning all! ☕️',
    avatar: imgSubtract1,
  },
  sara: {
    id: 'sara',
    name: 'Sara',
    time: '10:00 am',
    text: 'deploy went out clean last night! 🎉',
    avatar: avatarSaraPhoto,
  },
  aj: {
    id: 'aj',
    name: 'AJ',
    time: '10:00 am',
    text: 'found a bug. composer crashes when I paste an image from clipboard lol',
    avatar: imgSubtract3,
  },
  graeme: {
    id: 'graeme-coffee',
    name: 'Graeme',
    time: '10:02 am',
    mention: '@Caleb',
    personMention: true,
    text: "Let's grab some coffee",
    avatar: avatarGraemePhoto,
  },
  caleb: {
    id: 'caleb',
    name: 'Caleb',
    time: '10:02 am',
    text: 'yesss',
    avatar: avatarCaleb,
  },
} satisfies Record<string, ChatMessage>

const FIRE = { emoji: '🔥', count: 3 }
const AJ_STUB = { label: '2 replies', avatars: [avatarAlexPhoto, miniAndo] }
const AJ_STUB_FINAL = {
  label: '5 replies',
  avatars: [avatarAlexPhoto, miniAndo, avatarGraemePhoto],
}
const ALEX_REPLY = () =>
  humanReply(
    'alex-r',
    'Alex',
    avatarAlexPhoto,
    'uh oh - repro on mac or everywhere?',
  )
const TXT = {
  looking: 'Looking into this!',
  checkingCode: 'Checking codebase...',
  checkedCode: 'Checked codebase',
  bugResult:
    'Reproduced on both - images over 5 MB hit the crash. Filed it and tagged the composer team.',
  offer: "you're the DRI - want me to fix it and open a PR?",
  allGood: "All good Yumi, I'll take it from here",
}

const CHIP_214 = { ticket: 'AND-214', title: 'Composer paste crash' }

const andoReply = (id: string, parts: AgentPart[]): ThreadReplyData => ({
  id,
  name: 'Yumi',
  nameColor: ANDO_PURPLE,
  avatar: avatarAndo,
  time: '10:00 am',
  parts,
})
const humanReply = (
  id: string,
  name: string,
  avatar: string,
  text: string,
): ThreadReplyData => ({
  id,
  name,
  avatar,
  time: '10:00 am',
  parts: [{ kind: 'text', text }],
})

const BUG_PARENT = {
  name: 'AJ',
  avatar: imgSubtract3,
  time: '10:00 am',
  text: M.aj.text,
}
/* Final state of each thread - the mobile modal measures these (hidden) to reserve its height so it
   never grows as replies stream in. Keyed by ThreadData.id. */
const THREAD_FINALS: Record<string, ThreadData> = {
  bug: {
    parent: BUG_PARENT,
    separator: '5 replies',
    title: 'Composer paste crash',
    replies: [
      ALEX_REPLY(),
      andoReply('a1', [
        { kind: 'text', text: TXT.looking },
        { kind: 'status', icon: 'code', text: TXT.checkedCode },
        { kind: 'text', text: TXT.bugResult },
        { kind: 'chip', ...CHIP_214 },
        { kind: 'text', mention: '@Graeme', text: TXT.offer },
      ]),
      {
        ...humanReply('graeme', 'Graeme', avatarGraemePhoto, TXT.allGood),
        parts: [
          { kind: 'text', text: TXT.allGood },
          { kind: 'reaction', emoji: '👍', count: 1, purple: true },
        ],
      },
    ],
  },
}

/* ---------- the timeline: scene state is a pure function of time ---------- */

type Scene = {
  messages: ChatMessage[]
  thread: ThreadData | null
  threads?: string[]
} // threads = closed-thread titles under #design

const CPS = 55 // agent typing chars/sec (deterministic so the timeline is scrubbable)
const typeDur = (s: string) => Math.ceil((s.length * 1000) / CPS)
const typed = (full: string, t0: number, now: number) => {
  const n = Math.min(
    full.length,
    Math.max(0, Math.floor(((now - t0) * CPS) / 1000)),
  )
  return { text: full.slice(0, n), typing: n < full.length }
}

type Beat = {
  t: number
  dur?: number
  label: string
  apply: (d: Scene, t0: number, now: number) => void
}

const patchMsg = (d: Scene, id: string, patch: Partial<ChatMessage>) => {
  d.messages = d.messages.map((m) => (m.id === id ? { ...m, ...patch } : m))
}
const setReply = (d: Scene, id: string, parts: AgentPart[]) => {
  if (d.thread)
    d.thread = {
      ...d.thread,
      replies: d.thread.replies.map((r) => (r.id === id ? { ...r, parts } : r)),
    }
}
const addReply = (d: Scene, r: ThreadReplyData) => {
  if (d.thread) d.thread = { ...d.thread, replies: [...d.thread.replies, r] }
}

const BEATS: Beat[] = [
  {
    t: 500,
    label: 'Oliver checks in',
    apply: (d) => {
      d.messages.push({ ...M.oliver, divider: 'Today' })
    },
  },
  {
    t: 1300,
    label: 'Sara arrives',
    apply: (d) => {
      d.messages.push(M.sara)
    },
  },
  {
    t: 2150,
    label: '🔥 on the deploy',
    apply: (d) => patchMsg(d, 'sara', { reaction: FIRE }),
  },
  {
    t: 3100,
    label: 'AJ reports the bug',
    apply: (d) => {
      d.messages.push(M.aj)
    },
  },
  {
    t: 4400,
    label: 'Ando opens a thread',
    apply: (d) => {
      d.thread = {
        parent: BUG_PARENT,
        separator: 'No replies',
        replies: [],
        id: 'bug',
      }
    },
  },
  {
    t: 5400,
    label: 'Alex asks in the thread',
    apply: (d) => {
      if (d.thread) d.thread = { ...d.thread, separator: '1 reply' }
      addReply(d, ALEX_REPLY())
      patchMsg(d, 'aj', {
        stub: { label: '1 reply', avatars: [avatarAlexPhoto] },
      })
    },
  },
  {
    t: 6700,
    dur: typeDur(TXT.looking),
    label: 'Ando: looking into this',
    apply: (d, t0, now) => {
      if (d.thread) d.thread = { ...d.thread, separator: '2 replies' }
      const { text, typing } = typed(TXT.looking, t0, now)
      addReply(d, andoReply('a1', [{ kind: 'text', text, typing }]))
      patchMsg(d, 'aj', { stub: AJ_STUB }) // channel stub mirrors the thread
    },
  },
  {
    t: 7400,
    label: 'Ando gets to work',
    apply: (d) =>
      setReply(d, 'a1', [
        { kind: 'text', text: TXT.looking },
        { kind: 'status', icon: 'code', text: TXT.checkingCode, busy: true },
      ]),
  },
  // threads name themselves from context once the first reply is in
  {
    t: 8600,
    label: 'Thread renames itself',
    apply: (d) => {
      if (d.thread) d.thread.title = 'Composer paste crash'
    },
  },
  {
    t: 9400,
    dur: typeDur(TXT.bugResult),
    label: 'Ando: diagnosis',
    apply: (d, t0, now) => {
      if (d.thread) d.thread = { ...d.thread, separator: '3 replies' }
      patchMsg(d, 'aj', {
        stub: { label: '3 replies', avatars: [avatarAlexPhoto, miniAndo] },
      })
      const { text, typing } = typed(TXT.bugResult, t0, now)
      setReply(d, 'a1', [
        { kind: 'text', text: TXT.looking },
        { kind: 'status', icon: 'code', text: TXT.checkedCode },
        { kind: 'text', text, typing },
      ])
    },
  },
  {
    t: 11600,
    label: 'AND-214 filed',
    apply: (d) =>
      setReply(d, 'a1', [
        { kind: 'text', text: TXT.looking },
        { kind: 'status', icon: 'code', text: TXT.checkedCode },
        { kind: 'text', text: TXT.bugResult },
        { kind: 'chip', ...CHIP_214 },
      ]),
  },
  {
    t: 12200,
    dur: typeDur(TXT.offer) + 250,
    label: 'Yumi pings the DRI',
    apply: (d, t0, now) => {
      if (d.thread) d.thread = { ...d.thread, separator: '4 replies' }
      // pill settles first (t0+250), then the question types out
      const { text, typing } = typed(TXT.offer, t0 + 250, now)
      setReply(d, 'a1', [
        { kind: 'text', text: TXT.looking },
        { kind: 'status', icon: 'code', text: TXT.checkedCode },
        { kind: 'text', text: TXT.bugResult },
        { kind: 'chip', ...CHIP_214 },
        { kind: 'text', mention: '@Graeme', text, typing },
      ])
      patchMsg(d, 'aj', {
        stub: { label: '4 replies', avatars: [avatarAlexPhoto, miniAndo] },
      })
    },
  },
  {
    t: 13900,
    label: 'Graeme takes it',
    apply: (d) => {
      if (d.thread) d.thread = { ...d.thread, separator: '5 replies' }
      addReply(
        d,
        humanReply('graeme', 'Graeme', avatarGraemePhoto, TXT.allGood),
      )
      patchMsg(d, 'aj', { stub: AJ_STUB_FINAL })
    },
  },
  {
    t: 14600,
    label: 'Yumi reacts 👍',
    apply: (d) =>
      setReply(d, 'graeme', [
        { kind: 'text', text: TXT.allGood },
        { kind: 'reaction', emoji: '👍', count: 1, purple: true },
      ]),
  },
  {
    t: 15500,
    label: 'Thread closes',
    apply: (d) => {
      d.thread = null
      d.threads?.push('Composer paste crash')
    },
  },
  {
    t: 16100,
    label: 'Graeme wants coffee',
    apply: (d) => {
      d.messages.push(M.graeme)
    },
  },
  {
    t: 17200,
    label: 'Caleb: yesss',
    apply: (d) => {
      d.messages.push(M.caleb)
    },
  },
]

const HOLD = 4000
const LAST_BEAT = BEATS[BEATS.length - 1]
const DURATION = (LAST_BEAT ? LAST_BEAT.t : 0) + HOLD

function sceneAt(time: number): Scene {
  const d: Scene = { messages: [], thread: null, threads: [] }
  for (const b of BEATS) if (time >= b.t) b.apply(d, b.t, time)
  return d
}

/* Signature changes only when the rendered scene would - clock runs at 60fps without re-rendering. */
function sceneSig(time: number): string {
  let sig = ''
  for (const b of BEATS) {
    if (time < b.t) break
    sig += `${b.t}:`
    // Typing beats: sig tracks displayed char count, frozen once typing done.
    // Clamp elapsed time at b.dur (both ms) before converting to chars - the old
    // Math.min(b.dur, chars) compared ms vs chars, so it never engaged and the
    // sig churned every frame.
    if (b.dur)
      sig += `${Math.floor((Math.min(time - b.t, b.dur) * CPS) / 1000)}:`
  }
  return sig
}

/* ---------- app ---------- */

export type AndoHeroProps = {
  /** Render the generative WebGL2 cloud-sky behind the window (off by default so the runtime isn't loaded). */
  background?: boolean
  /**
   * Embed as a contained, height-capped graphic card instead of a standalone
   * full-viewport hero: root drops `min-h-screen` + padding and the window drops
   * its `min-w-[940px]` cap, so the consumer's `className` sizes/clips the card.
   * Default `false` keeps the full-bleed layout.
   */
  contained?: boolean
  /**
   * Hold the chat timeline this many ms before its first play, so it doesn't run
   * behind a still-fading card. It also always waits until the hero is half in
   * view. @default 0
   */
  startDelay?: number
  /** Appended to the root wrapper (the faux-desktop framing). */
  className?: string
}

export function AndoHero({
  background = false,
  contained = false,
  startDelay = 0,
  className,
}: AndoHeroProps) {
  const [reduced, setReduced] = useState(false)
  // Below `lg` the contained card switches to the mobile layout (compact
  // sidebar + the thread as a floating modal). Keyed off the same viewport
  // breakpoint the `contained` classes + the consumer card use, so they agree.
  const [belowLg, setBelowLg] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef(0)
  const [scene, setScene] = useState<Scene>(() => sceneAt(0))
  const sigRef = useRef(sceneSig(0))
  // Mobile layout is only meaningful for the embedded (contained) card; the
  // standalone hero keeps its 940px desktop floor at every width.
  const mobile = contained && belowLg

  const syncScene = useCallback((t: number) => {
    timeRef.current = t
    const sig = sceneSig(t)
    if (sig !== sigRef.current) {
      sigRef.current = sig
      setScene(sceneAt(t))
    }
  }, [])

  // Track the `lg` (1024px) breakpoint; matchMedia is read in an effect so the
  // component stays SSR-safe (first paint is the desktop layout, then it flips).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const update = () => setBelowLg(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    // window read here (not module scope) so the component is SSR-safe
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true)
      syncScene(DURATION - 1) // hold on the final frame
      return
    }

    // Gate the rAF: run only when the hero is >=50% in view (IO) and the tab is
    // visible. `startDelay` holds the first start until the on-load fade-in has
    // played. Re-stamping `last` on resume skips the paused span.
    const root = rootRef.current
    const useIO = !!root && 'IntersectionObserver' in window
    let raf = 0
    let last = 0
    // Start hidden only when an observer will flip us on; else default to running.
    let onScreen = !useIO
    let pageVisible = !document.hidden
    // Gates the first start only; the timer below flips it after the fade-in.
    let revealed = startDelay <= 0

    const tick = (now: number) => {
      const dt = now - last
      last = now
      let t = timeRef.current + dt
      if (t >= DURATION) t = 0
      syncScene(t)
      raf = requestAnimationFrame(tick)
    }
    const start = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }
    const sync = () => {
      if (onScreen && pageVisible && revealed) start()
      else stop()
    }

    const io =
      useIO && root
        ? new IntersectionObserver(
            (entries) => {
              const entry = entries[entries.length - 1]
              if (entry) onScreen = entry.intersectionRatio >= 0.5
              sync()
            },
            { threshold: 0.5 },
          )
        : null
    if (io && root) io.observe(root)

    const onVisibility = () => {
      pageVisible = !document.hidden
      sync()
    }
    document.addEventListener('visibilitychange', onVisibility)

    const revealTimer = revealed
      ? null
      : setTimeout(() => {
          revealed = true
          sync()
        }, startDelay)

    sync()
    return () => {
      stop()
      io?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      if (revealTimer) clearTimeout(revealTimer)
    }
  }, [startDelay, syncScene])

  let layoutClass =
    'min-h-screen items-center justify-center gap-[24px] py-[40px]'
  if (contained) {
    layoutClass = mobile
      ? 'h-full items-start justify-start p-0'
      : 'h-full items-center justify-center p-[96px]'
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={rootRef}
        className={join(
          'ando-hero relative flex flex-col overflow-hidden',
          // Standalone: full-viewport, centered. Contained: fill the card.
          // Phones crop away the app rail/sidebar so the main conversation stays
          // visible; `sm` restores the reference stage's 32px sky gutter. Desktop
          // is inset and centered so the sky frames the window.
          layoutClass,
          className,
        )}
      >
        {background ? (
          <>
            <Suspense fallback={null}>
              <SoraBackground occluderRef={windowRef} />
            </Suspense>
            {/* Figma "Vector" grid soft-light blended over the sky (above canvas,
                below the window), plus a cursor-following spotlight. */}
            <SkyGridLayer />
          </>
        ) : null}
        {mobile ? (
          <div className="absolute top-[32px] right-[32px] -left-[200px] sm:left-[32px]">
            <Window
              scene={scene}
              animated={!reduced}
              contained
              occluderRef={windowRef}
              compact
              dockThread={false}
              mobile
            />
          </div>
        ) : (
          <Window
            scene={scene}
            animated={!reduced}
            contained={contained}
            occluderRef={windowRef}
            compact={false}
            dockThread
          />
        )}
        {/* Mobile: the docked thread panel won't fit, so it floats as a modal
            pinned to the card's visible bottom-right (always on-screen even as the
            app bleeds off the right). `final` reserves its height up-front. */}
        {mobile ? (
          <ThreadModal
            thread={scene.thread}
            final={scene.thread ? THREAD_FINALS[scene.thread.id ?? ''] : null}
            animated={!reduced}
          />
        ) : null}
      </div>
    </MotionConfig>
  )
}

const Window = memo(function Window({
  scene,
  animated,
  contained = false,
  occluderRef,
  compact = false,
  dockThread = true,
  mobile = false,
}: {
  scene: Scene
  animated: boolean
  contained?: boolean
  occluderRef?: RefObject<HTMLDivElement | null>
  compact?: boolean
  dockThread?: boolean
  mobile?: boolean
}) {
  // Standalone: centered window capped to the viewport. Contained desktop fills
  // the content width at native height. Contained mobile uses the reference
  // floor: side nav (48) + compact sidebar (180) + chat floor (350) = 578px,
  // so narrow cards clip the app's right edge instead of compressing the chat.
  let sizing = 'w-[min(1136px,calc(100vw-64px))] min-w-[940px] h-[745px]'
  if (contained)
    sizing = mobile
      ? 'h-[745px] w-[max(100%,578px)] min-w-0'
      : 'w-full min-w-0 h-[745px]'
  return (
    <div
      className={join(
        'bg-[rgba(255,255,255,0.8)] content-stretch flex flex-col gap-[8px] items-start overflow-clip relative rounded-[10px] shadow-[0px_4px_16px_-2px_rgba(0,0,0,0.08),0px_12px_40px_-8px_rgba(0,0,0,0.16),0px_0px_0px_0.5px_rgba(0,0,0,0.02)]',
        sizing,
      )}
    >
      <Titlebar />
      <SideNav />
      {/* Only the content columns are opaque; titlebar + nav rail are unfilled so
          the sky stays behind them. The sky reads its occlusion rect from THIS
          element (left-48/top-28), not the whole window, so those strips aren't blanked. */}
      <div
        ref={occluderRef}
        className="absolute content-stretch flex gap-[6px] items-center left-[48px] right-0 top-[28px] bottom-0"
      >
        <ConversationsSidebar
          threads={scene.threads}
          animated={animated}
          compact={compact}
        />
        <ChatPanel
          messages={scene.messages}
          thread={scene.thread}
          animated={animated}
          dockThread={dockThread}
        />
      </div>
    </div>
  )
})
