import { AnimatePresence, motion } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'

import {
  imgComposerDivider,
  imgIconBuildingBlocks,
  imgIconCrossMedium,
  imgIconEmojiSmile,
  imgIconGifSquare,
  imgIconPaperPlane,
  imgIconText1,
  imgIconThread,
  imgLine1,
  imgLine2,
  imgQuoteElbow,
  imgVector,
} from '../assets/figma'
import {
  Avatar,
  LinearChip,
  MentionPill,
  ReactionPill,
  type StatusIcon,
  StatusRow,
} from './primitives'

export type AgentPart =
  | { kind: 'text'; text: string; typing?: boolean; mention?: string } // mention = leading inline pill
  | { kind: 'status'; icon: StatusIcon; text: string; busy?: boolean }
  | { kind: 'chip'; ticket: string; title: string }
  | { kind: 'reaction'; emoji: string; count: number; purple?: boolean }
  | { kind: 'quote'; name: string; avatar: string; text: string }

export type ThreadReplyData = {
  id: string
  name: string
  nameColor?: string // '#7c3aed' for Ando
  avatar: string
  time: string
  parts: AgentPart[]
}

export type ThreadData = {
  parent: {
    name: string
    avatar: string
    time: string
    mention?: string
    personMention?: boolean
    text: string
  }
  separator: string // '1 reply' | '2 replies' | 'No replies'
  replies: ThreadReplyData[]
  title?: string // self-assigned after the first reply; falls back to "Thread"
  id?: string // identifies the thread so the mobile modal can look up its final content to reserve height
}

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.4, 1] as const },
}

function NameRow({
  name,
  nameColor,
}: {
  name: string
  nameColor?: string
  time?: string
}) {
  // timestamps currently hidden
  return (
    <div className="content-stretch flex flex-col h-[12px] items-start justify-center relative shrink-0">
      <div className="[word-break:break-word] content-stretch flex gap-[6px] items-baseline leading-[0] relative shrink-0 whitespace-nowrap">
        <div
          className="flex flex-col font-medium justify-center overflow-hidden relative shrink-0 text-[14px] text-ellipsis"
          style={{
            color: nameColor ?? 'rgba(0,0,0,0.87)',
            fontFeatureSettings: '"liga" 0',
          }}
        >
          <p className="leading-[20px]">{name}</p>
        </div>
      </div>
    </div>
  )
}

function BodyText({
  text,
  mention,
  animated,
}: {
  text: string
  typing?: boolean
  mention?: string
  animated?: boolean
}) {
  // typing accepted but carets disabled for agent text
  return (
    <div
      className="[word-break:break-word] flex flex-col font-normal justify-center leading-[0] min-w-full overflow-hidden relative shrink-0 text-[rgba(0,0,0,0.87)] text-[14px] text-ellipsis w-[min-content]"
      style={{ fontFeatureSettings: '"liga" 0' }}
    >
      <p className="leading-[20px]">
        {mention ? (
          // person mention pill - node 7388:55; bounces in before the text types
          <>
            <motion.span
              initial={animated ? { scale: 0.5, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                opacity: { duration: 0.08 },
                scale: {
                  type: 'spring',
                  stiffness: 620,
                  damping: 30,
                  mass: 0.7,
                },
              }}
              style={{ display: 'inline-block', transformOrigin: '20% 80%' }}
              className="bg-[#eff6ff] font-medium px-[2px] rounded-[2px] text-[#2563eb]"
            >
              {mention}
            </motion.span>{' '}
          </>
        ) : null}
        {text}
      </p>
    </div>
  )
}

/* TimelineSeparator - node 1642:2073 */
function TimelineSeparator({ label }: { label: string }) {
  return (
    <div className="content-stretch flex gap-[8px] items-center max-w-[1920px] px-[16px] py-[8px] relative shrink-0 w-full">
      <div
        className="[word-break:break-word] flex flex-col font-medium justify-center leading-[0] relative shrink-0 text-[10px] text-[rgba(0,0,0,0.55)] tracking-[0.8px] uppercase whitespace-nowrap"
        style={{ fontFeatureSettings: '"liga" 0' }}
      >
        <p className="leading-[14px]">{label}</p>
      </div>
      <div className="content-stretch flex flex-[1_0_0] items-center min-w-px relative">
        <div className="flex-[1_0_0] h-0 min-w-px relative">
          <div className="absolute inset-[-0.25px_0]">
            <img alt="" className="block max-w-none size-full" src={imgLine1} />
          </div>
        </div>
        <div className="flex-[1_0_0] h-0 min-w-px relative">
          <div className="absolute inset-[-0.25px_0]">
            <img alt="" className="block max-w-none size-full" src={imgLine1} />
          </div>
        </div>
        <div className="flex h-[10px] items-center justify-center relative shrink-0 w-0">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[10px]">
              <div className="absolute inset-[-0.25px_0]">
                <img
                  alt=""
                  className="block max-w-none size-full"
                  src={imgLine2}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Quote-reply context row - node 1642:4176 */
function QuoteRow({
  name,
  avatar,
  text,
}: {
  name: string
  avatar: string
  text: string
}) {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <div className="h-[16px] relative shrink-0 w-[24px]">
        <div className="absolute inset-[0_-18.23%_-27.34%_0]">
          <img
            alt=""
            className="block max-w-none size-full"
            src={imgQuoteElbow}
          />
        </div>
      </div>
      <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
        <div className="content-stretch flex items-center relative shrink-0">
          <Avatar src={avatar} size={16} />
        </div>
        <div
          className="[word-break:break-word] flex flex-col font-medium justify-center leading-[0] overflow-hidden relative shrink-0 text-[rgba(0,0,0,0.87)] text-[12px] text-ellipsis whitespace-nowrap"
          style={{ fontFeatureSettings: '"liga" 0' }}
        >
          <p className="leading-[16px]">{name}</p>
        </div>
        <div
          className="[word-break:break-word] flex flex-col font-normal justify-center leading-[0] overflow-hidden relative shrink-0 text-[rgba(0,0,0,0.63)] text-[12px] text-ellipsis whitespace-nowrap"
          style={{ fontFeatureSettings: '"liga" 0' }}
        >
          <p className="leading-[16px]">{text}</p>
        </div>
      </div>
    </div>
  )
}

function ReplyParts({
  parts,
  animated,
  afterLead,
}: {
  parts: AgentPart[]
  animated: boolean
  afterLead?: boolean
}) {
  return (
    <>
      {parts.map((part, i) => {
        switch (part.kind) {
          case 'text':
            // text after a status line sits tight: 4px, not the column's 8px
            return parts[i - 1]?.kind === 'status' ? (
              <div key={i} className="mt-[-4px] relative shrink-0 w-full">
                <BodyText
                  text={part.text}
                  typing={part.typing}
                  mention={part.mention}
                  animated={animated}
                />
              </div>
            ) : (
              <BodyText
                key={i}
                text={part.text}
                typing={part.typing}
                mention={part.mention}
                animated={animated}
              />
            )
          case 'status': {
            // status after text (incl. lead) sits at 4px to keep rhythm even; status under the name row tucks 1px tighter
            if (parts[i - 1]?.kind === 'text' || (i === 0 && afterLead)) {
              return (
                <div key={i} className="mt-[-4px] relative shrink-0">
                  <StatusRow
                    icon={part.icon}
                    text={part.text}
                    busy={part.busy}
                  />
                </div>
              )
            }
            if (i === 0) {
              return (
                <div key={i} className="mt-[-1px] relative shrink-0">
                  <StatusRow
                    icon={part.icon}
                    text={part.text}
                    busy={part.busy}
                  />
                </div>
              )
            }
            return (
              <StatusRow
                key={i}
                icon={part.icon}
                text={part.text}
                busy={part.busy}
              />
            )
          }
          case 'chip':
            return (
              <LinearChip
                key={i}
                ticket={part.ticket}
                title={part.title}
                animated={animated}
              />
            )
          case 'reaction':
            return (
              <div
                key={i}
                className="content-stretch flex gap-[4px] items-center relative shrink-0"
              >
                <ReactionPill
                  emoji={part.emoji}
                  count={part.count}
                  purple={part.purple}
                  animated={animated}
                />
              </div>
            )
          case 'quote':
            return null // rendered by the wrapper
        }
        return null // exhaustive above; satisfies the callback return check
      })}
    </>
  )
}

export function ThreadReply({
  reply,
  animated,
}: {
  reply: ThreadReplyData
  animated: boolean
}) {
  const quote = reply.parts.find((p) => p.kind === 'quote')
  const parts = reply.parts.filter((p) => p.kind !== 'quote')
  const lead = parts[0]?.kind === 'text' ? parts[0] : null
  const rest = parts.slice(lead ? 1 : 0)
  // shared anatomy: name + leading text sit tight (gap-4), heavier parts follow at gap-8
  const body = (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
      <Avatar src={reply.avatar} />
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative">
        <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
          <NameRow
            name={reply.name}
            nameColor={reply.nameColor}
            time={reply.time}
          />
          {lead && lead.kind === 'text' ? (
            <BodyText
              text={lead.text}
              typing={lead.typing}
              mention={lead.mention}
              animated={animated}
            />
          ) : null}
        </div>
        <ReplyParts parts={rest} animated={animated} afterLead={!!lead} />
      </div>
    </div>
  )
  const Wrapper = animated ? motion.div : 'div'
  const motionProps = animated ? fadeUp : {}
  if (quote && quote.kind === 'quote') {
    return (
      <Wrapper
        {...motionProps}
        className="content-stretch flex flex-col gap-[10px] items-start pb-[4px] pt-[6px] px-[16px] relative rounded-br-[6px] rounded-tr-[6px] shrink-0 w-full"
      >
        <QuoteRow name={quote.name} avatar={quote.avatar} text={quote.text} />
        {body}
      </Wrapper>
    )
  }
  return (
    <Wrapper
      {...motionProps}
      className="content-stretch flex pb-[6px] pt-[8px] px-[16px] relative shrink-0 w-full"
    >
      {body}
    </Wrapper>
  )
}

/* Full composer toolbar (matches main composer / thread frames 2103+) */
function ThreadComposer() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center p-[16px] relative shrink-0 w-full">
      <div className="bg-white content-stretch flex flex-col gap-[8px] isolate items-start overflow-clip p-[12px] relative rounded-[10px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06)] shrink-0 w-full">
        <div className="content-stretch flex h-[40px] items-start overflow-clip px-[4px] relative shrink-0 w-full z-[2]">
          <div
            className="[word-break:break-word] flex flex-col font-normal justify-center leading-[0] relative shrink-0 text-[rgba(0,0,0,0.45)] text-[14px] whitespace-nowrap"
            style={{ fontFeatureSettings: '"liga" 0' }}
          >
            <p className="leading-[20px]">Reply in thread</p>
          </div>
        </div>
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full z-[1]">
          <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
            <div className="content-stretch flex gap-[4px] h-[28px] items-center relative shrink-0">
              <div className="content-stretch flex items-center justify-center max-h-[28px] min-h-[28px] relative rounded-[6px] shrink-0 size-[28px]">
                <div className="overflow-clip relative shrink-0 size-[16px]">
                  <div className="absolute inset-[8.33%_20.83%]">
                    <img
                      alt=""
                      className="absolute block inset-0 max-w-none size-full"
                      src={imgVector}
                    />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex items-center justify-center max-h-[28px] min-h-[28px] relative rounded-[6px] shrink-0 size-[28px]">
                <div className="relative shrink-0 size-[16px]">
                  <img
                    alt=""
                    className="absolute block inset-0 max-w-none size-full"
                    src={imgIconText1}
                  />
                </div>
              </div>
              <div className="content-stretch flex items-center justify-center max-h-[28px] min-h-[28px] relative rounded-[6px] shrink-0 size-[28px]">
                <div className="relative shrink-0 size-[16px]">
                  <img
                    alt=""
                    className="absolute block inset-0 max-w-none size-full"
                    src={imgIconEmojiSmile}
                  />
                </div>
              </div>
              <div className="content-stretch flex items-center justify-center max-h-[28px] min-h-[28px] relative rounded-[6px] shrink-0 size-[28px]">
                <div className="relative shrink-0 size-[16px]">
                  <img
                    alt=""
                    className="absolute block inset-0 max-w-none size-full"
                    src={imgIconGifSquare}
                  />
                </div>
              </div>
            </div>
            {/* divider + agent tools - node 12688:8366 */}
            <div className="flex h-[16px] items-center justify-center relative shrink-0 w-0">
              <div className="-rotate-90 flex-none">
                <div className="h-0 relative w-[16px]">
                  <div className="absolute inset-[-1px_0_0_0]">
                    <img
                      alt=""
                      className="block max-w-none size-full"
                      src={imgComposerDivider}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex items-center justify-center max-h-[28px] min-h-[28px] relative rounded-[6px] shrink-0 size-[28px]">
              <div className="relative shrink-0 size-[16px]">
                <img
                  alt=""
                  className="absolute block inset-0 max-w-none size-full"
                  src={imgIconBuildingBlocks}
                />
              </div>
            </div>
          </div>
          <div className="relative rounded-[6px] shrink-0 size-[28px]">
            <div className="absolute left-[6px] size-[16px] top-[6px]">
              <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src={imgIconPaperPlane}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Thread panel - node 1642:2036 "Content Area" (350px, not 400 - narrowed per AJ). Slides open/closed. */
export function ThreadPanel({
  thread,
  animated,
}: {
  thread: ThreadData | null
  animated: boolean
}) {
  return (
    <AnimatePresence initial={false}>
      {thread && (
        <motion.div
          key="thread"
          initial={animated ? { width: 0 } : false}
          animate={{ width: 350 }}
          exit={{ width: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="h-full overflow-hidden shrink-0 relative"
        >
          {/* left-anchored so the panel slides in from the window edge as the wrapper opens */}
          <div className="absolute left-0 top-0 bg-white border-[rgba(0,0,0,0.04)] border-l border-solid content-stretch flex flex-col h-full items-center justify-between overflow-x-clip overflow-y-auto w-[350px]">
            <ThreadContent thread={thread} animated={animated} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* Shared white-card content (header + body) - the docked panel and the mobile modal both render this. */
function ThreadContent({
  thread,
  animated,
  showComposer = true,
}: {
  thread: ThreadData
  animated: boolean
  showComposer?: boolean
}) {
  return (
    <>
      {/* Header */}
      <div className="bg-white border-[rgba(0,0,0,0.04)] border-b border-solid content-stretch flex h-[48px] items-center overflow-clip px-[16px] py-[4px] relative shrink-0 w-full">
        <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-w-px py-[2px] relative">
          <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-center min-w-px relative">
            <div className="content-stretch flex flex-[1_0_0] items-center min-w-px relative">
              <div className="content-stretch flex items-center relative shrink-0">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                  <div className="relative shrink-0 size-[16px]">
                    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[16px] top-1/2">
                      <img
                        alt=""
                        className="absolute block inset-0 max-w-none size-full"
                        src={imgIconThread}
                      />
                    </div>
                  </div>
                  <div className="content-stretch flex items-baseline relative shrink-0">
                    {/* title rolls like the reaction counter when the thread renames itself */}
                    <div className="h-[20px] overflow-hidden relative w-[192px]">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.p
                          key={thread.title ?? 'Thread'}
                          initial={
                            animated
                              ? { opacity: 0, filter: 'blur(6px)' }
                              : false
                          }
                          animate={{ opacity: 1, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, filter: 'blur(6px)' }}
                          transition={{
                            duration: 0.35,
                            ease: 'easeInOut',
                          }}
                          className="[word-break:break-word] font-normal leading-[20px] overflow-hidden relative text-[rgba(0,0,0,0.87)] text-[14px] text-ellipsis w-full whitespace-nowrap"
                          style={{ fontFeatureSettings: '"liga" 0' }}
                        >
                          {thread.title ?? 'Thread'}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative shrink-0 size-[16px]">
              <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 rounded-[6px] size-[24px] top-1/2">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[16px] top-1/2">
                  <img
                    alt=""
                    className="absolute block inset-0 max-w-none size-full"
                    src={imgIconCrossMedium}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Body - fills the docked panel (flex-1, composer pinned bottom); content-height in the modal so it never clips */}
      <div
        className={`content-stretch flex flex-col items-start min-h-px relative w-full ${showComposer ? 'flex-[1_0_0] justify-between' : ''}`}
      >
        <div
          className={`content-stretch flex flex-col items-center min-h-px pt-[8px] relative w-full ${showComposer ? 'flex-[1_0_0]' : ''}`}
        >
          {/* Parent message */}
          <div className="content-stretch flex gap-[10px] items-start pb-[6px] pt-[8px] px-[16px] relative shrink-0 w-full">
            <Avatar src={thread.parent.avatar} />
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative">
              <NameRow name={thread.parent.name} time={thread.parent.time} />
              {thread.parent.mention ? (
                <div className="content-stretch flex gap-[4px] items-start relative shrink-0 w-full">
                  <MentionPill
                    label={thread.parent.mention}
                    person={thread.parent.personMention}
                  />
                  <div
                    className="[word-break:break-word] flex flex-col font-normal justify-center leading-[0] overflow-hidden relative shrink-0 text-[rgba(0,0,0,0.87)] text-[14px] text-ellipsis whitespace-nowrap"
                    style={{ fontFeatureSettings: '"liga" 0' }}
                  >
                    <p className="leading-[20px]">{thread.parent.text}</p>
                  </div>
                </div>
              ) : (
                <BodyText text={thread.parent.text} />
              )}
            </div>
          </div>
          <TimelineSeparator label={thread.separator} />
          {thread.replies.map((reply) => (
            <ThreadReply key={reply.id} reply={reply} animated={animated} />
          ))}
        </div>
        {showComposer ? <ThreadComposer /> : null}
      </div>
    </>
  )
}

/* Mobile: the thread floats as a modal anchored right (16px in), capped 350px wide. It reserves its
   FINAL height from the start (no growing as replies stream) by measuring a hidden copy of the
   thread's final content at the live width - so there's no void and nothing clips. */
export function ThreadModal({
  thread,
  final,
  animated,
}: {
  thread: ThreadData | null
  final?: ThreadData | null
  animated: boolean
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>()

  useLayoutEffect(() => {
    if (!final || !measureRef.current || !wrapRef.current) {
      setHeight(undefined)
      return
    }
    const measure = () => {
      if (measureRef.current)
        // +16 = bottom gap, matches the side gutter
        setHeight(
          Math.ceil(measureRef.current.getBoundingClientRect().height) + 16,
        )
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [final])

  return (
    <div
      ref={wrapRef}
      className="absolute bottom-[16px] right-[16px] z-30 w-[calc(100%-72px)] max-w-[350px] pointer-events-none"
    >
      {/* hidden full-content measurer - drives the reserved height for the current width */}
      {final ? (
        <div
          ref={measureRef}
          aria-hidden
          className="invisible absolute inset-x-0 top-0 flex flex-col"
        >
          <ThreadContent thread={final} animated={false} showComposer={false} />
        </div>
      ) : null}
      <AnimatePresence initial={false}>
        {thread && (
          <motion.div
            key="thread-modal"
            initial={animated ? { x: '120%' } : false}
            animate={{ x: 0 }}
            exit={{ x: '120%' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ height }}
            className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-[14px] bg-white shadow-[0px_12px_44px_-6px_rgba(0,0,0,0.22),0px_0px_0px_1px_rgba(0,0,0,0.06)]"
          >
            <ThreadContent
              thread={thread}
              animated={animated}
              showComposer={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
