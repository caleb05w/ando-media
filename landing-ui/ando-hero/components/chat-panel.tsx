import { motion } from 'motion/react'
import { useState } from 'react'

import {
  imgComposerDivider,
  imgIconBuildingBlocks,
  imgIconEmojiSmile,
  imgIconGifSquare,
  imgIconHashtag3,
  imgIconPaperPlane,
  imgIconText1,
  imgRectangle243,
  imgSubtract,
  imgVector,
  imgVector1,
  imgVector2,
} from '../assets/figma'
import { Avatar, Caret, MentionPill, ReactionPill } from './primitives'
import { type ThreadData, ThreadPanel } from './thread-panel'

export type ChatMessage = {
  id: string
  name: string
  time: string
  text: string
  avatar: string
  mention?: string // leading mention pill
  personMention?: boolean // blue person pill (7388:55) vs purple agent pill
  typing?: boolean // live-typing caret
  reaction?: { emoji: string; count: number; purple?: boolean } // purple = agent-flavored reaction
  stub?: { label: string; avatars: string[] } // reply stub under the message
  divider?: string // date divider above the message (12711:1577)
}

/* Message divider - node 12711:1577. */
function MessageDivider({ label }: { label: string }) {
  const rule =
    'bg-[rgba(0,0,0,0.08)] flex-[1_0_0] h-px min-w-px relative rounded-[999px]'
  const cap =
    'bg-[rgba(0,0,0,0.08)] h-[10px] relative rounded-[999px] shrink-0 w-px'
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] pl-[16px] relative shrink-0 w-full">
      <div className="content-stretch flex gap-[10px] h-[24px] items-center relative shrink-0 w-full">
        <div className="content-stretch flex flex-[1_0_0] h-[10px] items-center min-w-px relative">
          <div className={cap} />
          <div className={rule} />
        </div>
        <div className="content-stretch flex items-center relative shrink-0">
          <p
            className="[word-break:break-word] font-medium leading-[14px] relative shrink-0 text-[rgba(0,0,0,0.55)] text-[10px] tracking-[0.8px] uppercase whitespace-nowrap"
            style={{ fontFeatureSettings: '"liga" 0' }}
          >
            {label}
          </p>
        </div>
        <div className="content-stretch flex flex-[1_0_0] h-[10px] items-center min-w-px relative">
          <div className={rule} />
          <div className={cap} />
        </div>
      </div>
    </div>
  )
}

// Incoming messages scale in. The scale curve is matched to SlotGrow's height
// tween (same duration + ease) so the visual size tracks the slot exactly - no
// clip, and no spill over the row above mid-grow.
const enterTransition = {
  opacity: { duration: 0.18, ease: 'easeOut' },
  scale: { duration: 0.3, ease: [0.3, 0.8, 0.3, 1] as const },
} as const

// Slot growth: height animates 0 → auto so older messages get pushed up by
// layout flow, making overlap impossible. clip=false + anchorBottom keeps the
// child pinned to the slot's bottom edge and never clips it, so an entering
// message scales up out of the composer line with no cut.
function SlotGrow({
  children,
  className,
  marginTo,
  duration = 0.3,
  clip = true,
  anchorBottom = false,
}: {
  children: React.ReactNode
  className?: string
  marginTo?: number
  duration?: number
  clip?: boolean
  anchorBottom?: boolean
}) {
  const [done, setDone] = useState(false)
  // clip=false never hides; clip=true hides only while the height tween runs
  const overflow = !clip || done ? 'visible' : 'hidden'
  return (
    <motion.div
      initial={{
        height: 0,
        ...(marginTo !== undefined ? { marginTop: 0 } : null),
      }}
      animate={{
        height: 'auto',
        ...(marginTo !== undefined ? { marginTop: marginTo } : null),
      }}
      transition={{ duration, ease: [0.3, 0.8, 0.3, 1] }}
      onAnimationComplete={() => setDone(true)}
      style={{ overflow }}
      className={`${anchorBottom ? 'flex flex-col justify-end' : ''} ${className ?? ''}`}
    >
      {children}
    </motion.div>
  )
}

/* Reply stub row - node 1642:2390 (single) / 1642:4053 (pile). */
function ReplyStub({
  label,
  avatars,
  animated,
}: {
  label: string
  avatars: string[]
  animated: boolean
}) {
  const inner = (
    <div className="content-stretch flex gap-[6px] h-[16px] items-center relative rounded-[4px] shrink-0">
      <div className="content-stretch flex items-center ml-[-3px] relative shrink-0">
        {/* -3px ring offset so faces align to the text line */}
        {avatars.map((src, i) => (
          <motion.div
            key={src}
            initial={animated ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 480,
              damping: 16,
              mass: 0.7,
            }}
            className={`border-[3px] border-solid border-white relative rounded-[999px] shrink-0 size-[22px] ${i < avatars.length - 1 ? 'mr-[-8px]' : ''}`}
          >
            <img
              alt=""
              className="absolute inset-0 max-w-none object-contain pointer-events-none rounded-[999px] size-full"
              src={src}
            />
          </motion.div>
        ))}
      </div>
      <div
        className="[word-break:break-word] flex flex-col font-medium justify-center leading-[0] relative shrink-0 text-[#2563eb] text-[12px] whitespace-nowrap"
        style={{ fontFeatureSettings: '"liga" 0' }}
      >
        <p className="leading-[18px]">{label}</p>
      </div>
    </div>
  )
  const row = (
    <div className="content-stretch flex gap-[2px] items-center px-[16px] py-[6px] relative shrink-0 w-full">
      <div className="h-[12px] relative shrink-0 w-[32px]" />
      {animated ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.3, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            opacity: { duration: 0.15 },
            scale: { type: 'spring', stiffness: 480, damping: 16, mass: 0.7 },
            rotate: { type: 'spring', stiffness: 480, damping: 18 },
          }}
          style={{ originX: 0, originY: 0.5 }}
        >
          {inner}
        </motion.div>
      ) : (
        inner
      )}
      {/* loop + horizontal drawn by the message row's connector glyph above */}
    </div>
  )
  if (!animated) return row
  return (
    <SlotGrow className="w-full" duration={0.25}>
      {row}
    </SlotGrow>
  )
}

function MessageItem({
  message,
  animated,
}: {
  message: ChatMessage
  animated: boolean
}) {
  // reaction pill grows its slot when animating; static otherwise
  let reactionNode: React.ReactNode = null
  if (message.reaction) {
    reactionNode = animated ? (
      <SlotGrow marginTo={8} duration={0.25} clip={false} anchorBottom>
        {/* clip=false so neither the pill nor its burst particles get cut at the slot edge */}
        <ReactionPill
          emoji={message.reaction.emoji}
          count={message.reaction.count}
          purple={message.reaction.purple}
          animated
          burstDelay={0.28}
        />
      </SlotGrow>
    ) : (
      <div className="mt-[8px]">
        <ReactionPill
          emoji={message.reaction.emoji}
          count={message.reaction.count}
          purple={message.reaction.purple}
          animated={false}
        />
      </div>
    )
  }
  const row = (
    <div
      className={`content-stretch flex gap-[10px] items-start px-[16px] relative shrink-0 w-full ${message.stub ? 'pb-[6px] pt-[8px]' : 'py-[6px]'}`}
    >
      {message.stub ? (
        // one continuous glyph: stretchy vertical (plain div, so no SVG distortion
        // when the message wraps) fused to a fixed loop-curl + horizontal
        <div className="absolute bottom-[-21px] left-[20.5px] top-[42px] w-[20.5px]">
          <div className="absolute bottom-[3.5px] left-[7px] top-0 w-[1px] bg-[rgba(0,0,0,0.17)]" />
          <svg
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-[8px] w-[20.5px]"
            viewBox="0 0 20.5 8"
            fill="none"
          >
            <path
              d="M7.5 4A3.5 3.5 0 1 1 4 0.5H20.5"
              stroke="rgba(0,0,0,0.17)"
            />
          </svg>
        </div>
      ) : null}
      <Avatar src={message.avatar} />
      <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-w-px relative">
        <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-col h-[12px] items-start justify-center relative shrink-0">
            <div className="[word-break:break-word] content-stretch flex gap-[6px] items-baseline leading-[0] relative shrink-0 whitespace-nowrap">
              <div
                className="flex flex-col font-medium justify-center overflow-hidden relative shrink-0 text-[rgba(0,0,0,0.87)] text-[14px] text-ellipsis"
                style={{ fontFeatureSettings: '"liga" 0' }}
              >
                <p className="leading-[20px]">{message.name}</p>
              </div>
            </div>
          </div>
          {message.mention ? (
            <div className="content-stretch flex gap-[4px] items-start relative shrink-0 w-full">
              <MentionPill
                label={message.mention}
                person={message.personMention}
              />
              <div
                className="[word-break:break-word] flex flex-col font-normal justify-center leading-[0] overflow-hidden relative shrink-0 text-[rgba(0,0,0,0.87)] text-[14px] text-ellipsis whitespace-nowrap"
                style={{ fontFeatureSettings: '"liga" 0' }}
              >
                <p className="leading-[20px]">{message.text}</p>
              </div>
            </div>
          ) : (
            <div
              className="[word-break:break-word] flex flex-col font-normal justify-center leading-[0] min-w-full overflow-hidden relative shrink-0 text-[rgba(0,0,0,0.87)] text-[14px] text-ellipsis w-[min-content]"
              style={{ fontFeatureSettings: '"liga" 0' }}
            >
              <p className="leading-[20px]">
                {message.text}
                {message.typing ? <Caret /> : null}
              </p>
            </div>
          )}
        </div>
        {reactionNode}
      </div>
    </div>
  )

  const group = (
    <>
      {message.divider ? <MessageDivider label={message.divider} /> : null}
      {row}
      {message.stub ? (
        <ReplyStub
          label={message.stub.label}
          avatars={message.stub.avatars}
          animated={animated}
        />
      ) : null}
    </>
  )

  if (!animated) {
    return (
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        {group}
      </div>
    )
  }
  return (
    <SlotGrow className="shrink-0 w-full" clip={false} anchorBottom>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={enterTransition}
        style={{ originX: 0, originY: 1 }} // grow up from the bottom edge - no slide under the composer
        className="content-stretch flex flex-col items-start relative w-full"
      >
        {group}
      </motion.div>
    </SlotGrow>
  )
}

function SkeletonMessage({ textWidth }: { textWidth: number }) {
  return (
    <div className="content-stretch flex gap-[10px] items-start px-[16px] py-[6px] relative shrink-0 w-full">
      <div className="bg-[rgba(0,0,0,0.04)] relative rounded-[99px] shrink-0 size-[24px]" />
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative">
        <div className="bg-[rgba(0,0,0,0.08)] h-[12px] relative rounded-[3px] shrink-0 w-[57px]" />
        <div
          className="bg-[rgba(0,0,0,0.04)] h-[20px] relative rounded-[3px] shrink-0 max-w-full"
          style={{ width: textWidth }}
        />
      </div>
    </div>
  )
}

function SkeletonReactions({ borderColor }: { borderColor: string }) {
  return (
    <div className="content-stretch flex gap-[2px] items-center px-[16px] py-[6px] relative shrink-0 w-full">
      <div className="h-[12px] relative shrink-0 w-[32px]" />
      <div className="content-stretch flex gap-[8px] h-[16px] items-center relative rounded-[4px] shrink-0">
        <div className="content-stretch flex items-center ml-[-3px] relative shrink-0">
          <div
            className="border-[3px] border-solid mr-[-8px] relative rounded-[999px] shrink-0 size-[22px]"
            style={{
              backgroundColor:
                borderColor === '#fdfdfc' ? '#f5f5f4' : '#f0f0f0',
              borderColor,
            }}
          />
          <div
            className="border-[3px] border-solid mr-[-8px] relative rounded-[999px] shrink-0 size-[22px]"
            style={{
              backgroundColor:
                borderColor === '#fdfdfc' ? '#f5f5f4' : '#f0f0f0',
              borderColor,
            }}
          />
          <div
            className="border-[3px] border-solid relative rounded-[999px] shrink-0 size-[22px]"
            style={{
              backgroundColor:
                borderColor === '#fdfdfc' ? '#f5f5f4' : '#f0f0f0',
              borderColor,
            }}
          />
        </div>
        <div className="bg-[rgba(0,0,0,0.04)] h-[16px] relative rounded-[3px] shrink-0 w-[123px]" />
      </div>
      <div className="absolute left-[20.37px] size-[8px] top-[13.13px]">
        <img
          alt=""
          className="absolute block inset-0 max-w-none size-full"
          src={imgRectangle243}
        />
      </div>
    </div>
  )
}

/* Scrolled-up history: Peter's clipped message + skeleton placeholders. */
function MessageHistory() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      {/* Peter - real text, mostly clipped above the fold */}
      <div className="content-stretch flex gap-[10px] items-start px-[16px] py-[6px] relative shrink-0 w-full">
        <div className="relative rounded-[3px] shrink-0 size-[24px]">
          <div className="absolute left-0 size-[24px] top-0">
            <img
              alt=""
              className="absolute block inset-0 max-w-none size-full"
              height="24"
              src={imgSubtract}
              width="24"
            />
          </div>
        </div>
        <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start leading-[0] min-w-px relative">
          <div className="content-stretch flex gap-[6px] h-[12px] items-center relative shrink-0 whitespace-nowrap">
            <div
              className="flex flex-col font-medium justify-center overflow-hidden relative shrink-0 text-[rgba(0,0,0,0.86)] text-[14px] text-ellipsis"
              style={{ fontFeatureSettings: '"liga" 0' }}
            >
              <p className="leading-[20px]">Peter</p>
            </div>
            <div
              className="flex flex-col font-normal justify-center overflow-hidden relative shrink-0 text-[rgba(0,0,0,0.53)] text-[12px] text-ellipsis"
              style={{ fontFeatureSettings: '"liga" 0' }}
            >
              <p className="leading-[18px]">5:35 pm</p>
            </div>
          </div>
          <div
            className="flex flex-col font-normal justify-center min-w-full overflow-hidden relative shrink-0 text-[rgba(0,0,0,0.86)] text-[14px] text-ellipsis w-[min-content]"
            style={{ fontFeatureSettings: '"liga" 0' }}
          >
            <p className="leading-[20px]">{`Sounds great! I'm in.`}</p>
          </div>
        </div>
      </div>
      <SkeletonMessage textWidth={799} />
      <SkeletonMessage textWidth={294} />
      <SkeletonMessage textWidth={88} />
      <SkeletonMessage textWidth={647} />
      {/* Group with thread line + reactions */}
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="content-stretch flex gap-[10px] items-start px-[16px] py-[6px] relative shrink-0 w-full">
            <div className="absolute bottom-[-13.5px] h-[45.5px] left-[28px] w-[12px]">
              <div className="absolute inset-[-1.04%_-4.17%]">
                <img
                  alt=""
                  className="block max-w-none size-full"
                  src={imgVector1}
                />
              </div>
            </div>
            <div className="bg-[rgba(0,0,0,0.04)] relative rounded-[99px] shrink-0 size-[24px]" />
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative">
              <div className="bg-[rgba(0,0,0,0.08)] h-[12px] relative rounded-[3px] shrink-0 w-[57px]" />
              <div className="bg-[rgba(0,0,0,0.04)] h-[20px] relative rounded-[3px] shrink-0 w-[208px]" />
              <div className="bg-[rgba(0,0,0,0.04)] h-[20px] relative rounded-[3px] shrink-0 w-[123px]" />
            </div>
          </div>
          <SkeletonReactions borderColor="#fdfdfc" />
        </div>
      </div>
      <SkeletonMessage textWidth={260} />
      <SkeletonMessage textWidth={198} />
      <SkeletonMessage textWidth={494} />
      <SkeletonMessage textWidth={386} />
      <SkeletonMessage textWidth={236} />
      {/* Second group with shorter thread line */}
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        <div className="content-stretch flex gap-[10px] items-start px-[16px] py-[6px] relative shrink-0 w-full">
          <div className="absolute bottom-[-13.5px] h-[21.5px] left-[28px] w-[12px]">
            <div className="absolute inset-[-1.96%_-4.17%]">
              <img
                alt=""
                className="block max-w-none size-full"
                src={imgVector2}
              />
            </div>
          </div>
          <div className="bg-[rgba(0,0,0,0.04)] relative rounded-[99px] shrink-0 size-[24px]" />
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative">
            <div className="bg-[rgba(0,0,0,0.08)] h-[12px] relative rounded-[3px] shrink-0 w-[57px]" />
            <div className="bg-[rgba(0,0,0,0.04)] h-[20px] relative rounded-[3px] shrink-0 w-[208px]" />
          </div>
        </div>
        <SkeletonReactions borderColor="#ffffff" />
      </div>
    </div>
  )
}

function Composer() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center p-[16px] relative shrink-0 w-full">
      <div className="bg-white content-stretch flex flex-col gap-[8px] isolate items-start overflow-clip p-[12px] relative rounded-[10px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06)] shrink-0 w-full">
        <div className="content-stretch flex h-[40px] items-start overflow-clip px-[4px] relative shrink-0 w-full z-[2]">
          <div
            className="[word-break:break-word] flex flex-col font-normal justify-center leading-[0] relative shrink-0 text-[rgba(0,0,0,0.45)] text-[14px] whitespace-nowrap"
            style={{ fontFeatureSettings: '"liga" 0' }}
          >
            <p className="leading-[20px]">Send a message in #general</p>
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
            {/* divider + agent tools - 12688:8366 */}
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
            <div className="absolute left-[6px] size-[16px] top-[5.5px]">
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

export function ChatPanel({
  messages,
  thread,
  animated = true,
  dockThread = true,
}: {
  messages: ChatMessage[]
  thread: ThreadData | null
  animated?: boolean
  dockThread?: boolean // false on mobile - the thread renders as a floating modal instead
}) {
  return (
    <div className="bg-white border border-solid border-white content-stretch flex h-full items-start overflow-clip flex-[1_0_0] min-w-px relative rounded-tl-[6px] shadow-[0px_2px_8px_-2px_rgba(0,0,0,0.08)]">
      {/* Channel column - squeezes when the thread opens, down to a 350px floor */}
      <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start min-w-[350px] relative">
        {/* #general header */}
        <div className="bg-white border-[rgba(0,0,0,0.04)] border-b border-solid content-stretch flex gap-[40px] h-[48px] items-center overflow-clip px-[16px] py-[4px] relative shrink-0 w-full">
          <div className="content-stretch flex flex-[1_0_0] gap-[10px] h-[28px] items-center min-w-px relative">
            <div className="overflow-clip relative rounded-[4px] shrink-0 size-[24px]">
              <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex items-center justify-center left-1/2 overflow-clip p-[4px] rounded-[2px] size-[16px] top-[calc(50%-0.5px)]">
                <div className="relative shrink-0 size-[16px]">
                  <img
                    alt=""
                    className="absolute block inset-0 max-w-none size-full"
                    src={imgIconHashtag3}
                  />
                </div>
              </div>
            </div>
            <div
              className="[word-break:break-word] flex flex-col font-normal justify-center leading-[0] max-h-[16px] overflow-hidden relative shrink-0 text-[rgba(0,0,0,0.87)] text-[14px] text-ellipsis whitespace-nowrap"
              style={{ fontFeatureSettings: '"liga" 0' }}
            >
              <p className="leading-[20px]">general</p>
            </div>
          </div>
          <div className="bg-[rgba(0,0,0,0.08)] h-[16px] relative rounded-[3px] shrink-0 w-[45px]" />
        </div>
        {/* Messages + composer */}
        <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-h-px overflow-clip relative w-full">
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start justify-end min-h-px pr-[16px] relative w-full">
            <MessageHistory />
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                animated={animated}
              />
            ))}
          </div>
          <Composer />
        </div>
      </div>
      <ThreadPanel thread={dockThread ? thread : null} animated={animated} />
    </div>
  )
}
