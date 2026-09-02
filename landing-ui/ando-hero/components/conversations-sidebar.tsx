import { motion } from 'motion/react'
import { useState } from 'react'

import {
  imgIconHashtag,
  imgIconsGroup,
  imgIconsGroup1,
  imgIconsGroup2,
  imgLine,
} from '../assets/figma'

function NotificationBadge({ count }: { count: string }) {
  return (
    <div className="backdrop-blur-[2px] bg-[#2563eb] content-stretch flex flex-col items-center justify-center relative rounded-[12px] shrink-0">
      <div className="relative shrink-0 size-[16px]">
        <div className="-translate-x-1/2 -translate-y-1/2 [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] [word-break:break-word] absolute flex flex-col font-medium justify-center leading-[0] left-[8px] size-[16px] text-[10px] text-center text-white top-[8px]">
          <p className="leading-[10px]">{count}</p>
        </div>
      </div>
    </div>
  )
}

/* Closed threads under #general: tree rows like the skeletons but with real titles. */
function ThreadRow({
  title,
  first,
  animated,
}: {
  title: string
  first: boolean
  animated: boolean
}) {
  // short elbow on the first row (hangs off the channel); tall one after, whose vertical reaches up across the row gap to the previous branch
  const inner = (
    <>
      <div className="h-[32px] relative shrink-0 w-[34px]">
        <div className="absolute h-[32px] right-[2px] top-0 w-[16px]">
          <div
            className={`absolute ${first ? 'inset-[-1.56%_0_0_-3.13%]' : 'inset-[-90.05%_0_0_-3.13%]'}`}
          >
            <img
              alt=""
              className="block max-w-none size-full"
              src={first ? imgIconsGroup1 : imgIconsGroup2}
            />
          </div>
        </div>
      </div>
      <div
        className="[word-break:break-word] flex flex-[1_0_0] flex-col font-normal justify-center leading-[0] min-w-px relative text-[rgba(0,0,0,0.55)] text-[14px]"
        style={{ fontFeatureSettings: '"liga" 0' }}
      >
        <p className="leading-[20px] w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {title}
        </p>
      </div>
    </>
  )
  const cls =
    'content-stretch flex gap-[6px] items-center relative shrink-0 w-full' // 6px gap + ~10px baked into the elbow asset = 16px from branch ink to title
  return animated ? (
    <GrowIn className={cls}>{inner}</GrowIn>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

/* Height-grow entrance that releases its clip on finish, so the tall elbow's vertical can rejoin the rail of the row above. */
function GrowIn({
  children,
  className,
}: {
  children: React.ReactNode
  className: string
}) {
  const [done, setDone] = useState(false)
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 32, opacity: 1 }}
      transition={{
        height: { duration: 0.3, ease: [0.3, 0.8, 0.3, 1] },
        opacity: { duration: 0.25, delay: 0.12 },
      }}
      onAnimationComplete={() => setDone(true)}
      style={{ overflow: done ? 'visible' : 'hidden' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ConversationsSidebar({
  threads = [],
  animated = false,
  compact = false,
}: {
  threads?: string[]
  animated?: boolean
  compact?: boolean
}) {
  // icon glyphs render as square skeletons (3px matches the adjacent bar skeletons); only the active channel's hashtag stays a real glyph since it labels real text
  const icon = () => (
    <div className="absolute bg-[rgba(0,0,0,0.06)] inset-0 rounded-[3px]" />
  )
  const w = compact ? 'w-[180px]' : 'w-[280px]' // narrower on mobile so more of the channel shows
  return (
    <div
      className={`bg-white content-stretch flex flex-col h-full items-start overflow-clip relative rounded-tl-[10px] rounded-tr-[6px] shadow-[0px_2px_8px_-2px_rgba(0,0,0,0.08)] shrink-0 ${w}`}
    >
      {/* Header: Conversations pill + skeleton tab + dots button */}
      <div
        className={`bg-white border-[rgba(0,0,0,0.03)] border-b border-solid content-stretch flex gap-[16px] h-[48px] items-center px-[16px] py-[12px] relative shrink-0 ${w}`}
      >
        <div className="content-stretch flex flex-[1_0_0] items-center min-w-px relative">
          {/* fixed 155 on desktop; fills the slot on mobile so it never overruns the dots button */}
          <div
            className={`bg-[rgba(0,0,0,0.03)] h-[16px] relative rounded-[3px] ${compact ? 'w-full' : 'shrink-0 w-[155px]'}`}
          />
        </div>
        <div className="content-stretch flex items-center p-[4px] relative rounded-[4px] shrink-0">
          <div className="relative shrink-0 size-[16px]">{icon()}</div>
        </div>
      </div>
      {/* Media strip skeleton */}
      <div className="content-stretch flex gap-[8px] isolate items-center pb-[12px] pt-[16px] px-[16px] relative shrink-0 w-full">
        <div className="bg-[rgba(0,0,0,0.03)] relative rounded-[6px] shrink-0 size-[64px] z-[5]" />
        <div className="bg-[rgba(0,0,0,0.03)] relative rounded-[6px] shrink-0 size-[64px] z-[4]" />
        <div className="bg-[rgba(0,0,0,0.03)] relative rounded-[6px] shrink-0 size-[64px] z-[3]" />
        <div className="bg-[rgba(0,0,0,0.03)] relative rounded-[6px] shrink-0 size-[64px] z-[2]" />
        <div className="bg-[rgba(0,0,0,0.03)] relative rounded-[6px] shrink-0 size-[64px] z-[1]" />
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] isolate items-center min-h-px p-[8px] relative w-full">
        {/* Folder section (skeletons) */}
        <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full z-[4]">
          <div className="content-stretch flex gap-[8px] h-[24px] items-center px-[8px] relative shrink-0 w-full">
            <div className="relative shrink-0 size-[16px]">{icon()}</div>
            <div className="bg-[rgba(0,0,0,0.03)] h-[14px] relative rounded-[3px] shrink-0 w-[65px]" />
          </div>
          <div className="content-stretch flex flex-col gap-[4px] isolate items-start relative shrink-0 w-full">
            <div className="content-stretch flex gap-[8px] h-[24px] items-center px-[8px] relative shrink-0 w-full z-[3]">
              <div className="relative shrink-0 size-[16px]">{icon()}</div>
              <div className="bg-[rgba(0,0,0,0.03)] h-[14px] relative rounded-[3px] shrink-0 w-[65px]" />
            </div>
            <div className="content-stretch flex gap-[12px] h-[32px] items-center pl-[24px] pr-[8px] py-[6px] relative rounded-[6px] shrink-0 w-full z-[2]">
              <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative">
                <div className="bg-[rgba(0,0,0,0.06)] relative rounded-[999px] shrink-0 size-[16px]" />
                <div className="bg-[rgba(0,0,0,0.03)] h-[16px] relative rounded-[3px] w-[100px] min-w-0 shrink" />
              </div>
              <NotificationBadge count="5" />
            </div>
            <div className="content-stretch flex h-[32px] items-center pl-[24px] pr-[8px] py-[6px] relative rounded-[6px] shrink-0 w-full z-[1]">
              <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative">
                <div className="bg-[rgba(0,0,0,0.06)] relative rounded-[999px] shrink-0 size-[16px]" />
                <div className="bg-[rgba(0,0,0,0.03)] h-[16px] relative rounded-[3px] w-[100px] min-w-0 shrink" />
              </div>
            </div>
          </div>
        </div>
        {/* Divider */}
        <div className="h-0 relative shrink-0 w-[256px] z-[3]">
          <div className="absolute inset-[-1px_0_0_0]">
            <img alt="" className="block max-w-none size-full" src={imgLine} />
          </div>
        </div>
        {/* Channels section */}
        <div className="content-stretch flex flex-col gap-[4px] isolate items-start relative shrink-0 w-full z-[2]">
          {/* #general - active channel */}
          <div className="bg-[rgba(0,0,0,0.06)] content-stretch flex gap-[8px] h-[32px] items-center px-[8px] py-[6px] relative rounded-[6px] shrink-0 w-full z-[7]">
            <div className="relative shrink-0 size-[16px]">
              {/* real hashtag glyph: this channel labels real text */}
              <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src={imgIconHashtag}
              />
            </div>
            <div
              className="[word-break:break-word] flex flex-[1_0_0] flex-col font-normal justify-center leading-[0] max-h-[16px] min-w-px overflow-hidden relative text-[rgba(0,0,0,0.87)] text-[14px] text-ellipsis"
              style={{ fontFeatureSettings: '"liga" 0' }}
            >
              <p className="leading-[20px]">general</p>
            </div>
          </div>
          {/* closed threads nest under the active channel */}
          {threads.map((t, i) => (
            <ThreadRow key={t} title={t} first={i === 0} animated={animated} />
          ))}
          {/* Channel with badge */}
          <div className="content-stretch flex gap-[12px] h-[32px] items-center px-[8px] py-[6px] relative rounded-[6px] shrink-0 w-full z-[6]">
            <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative">
              <div className="content-stretch flex items-center justify-center overflow-clip p-[4px] relative rounded-[2px] shrink-0 size-[16px]">
                <div className="relative shrink-0 size-[16px]">{icon()}</div>
              </div>
              <div className="bg-[rgba(0,0,0,0.03)] h-[16px] relative rounded-[3px] w-[100px] min-w-0 shrink" />
            </div>
          </div>
          {/* Active call row */}
          <div className="content-stretch flex items-start relative shrink-0 w-full z-[5]">
            <div className="h-[32px] relative shrink-0 w-[34px]">
              <div className="absolute h-[32px] right-[2px] top-0 w-[16px]">
                <div className="absolute inset-[-1.17%_0_0_-2.34%]">
                  <img
                    alt=""
                    className="block max-w-none size-full"
                    src={imgIconsGroup}
                  />
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-[1_0_0] gap-[6px] items-center min-w-px py-[6px] relative rounded-[6px] self-stretch">
              <div className="relative shrink-0 size-[16px]">{icon()}</div>
              <div className="content-stretch flex flex-[1_0_0] h-[16px] items-center ml-[-3px] min-w-px relative">
                <div className="bg-[#f0f0f0] border-[3px] border-solid border-white mr-[-8px] relative rounded-[999px] shrink-0 size-[22px]" />
                <div className="bg-[#f0f0f0] border-[3px] border-solid border-white mr-[-8px] relative rounded-[999px] shrink-0 size-[22px]" />
                <div className="bg-[#f0f0f0] border-[3px] border-solid border-white mr-[-8px] relative rounded-[999px] shrink-0 size-[22px]" />
                <div className="bg-[#f0f0f0] border-[3px] border-solid border-white mr-[-8px] relative rounded-[999px] shrink-0 size-[22px]" />
                <div className="bg-[#f0f0f0] border-[3px] border-solid border-white relative rounded-[999px] shrink-0 size-[22px]" />
              </div>
            </div>
          </div>
          {/* Sub-channel skeleton */}
          <div className="content-stretch flex gap-[8px] h-[32px] items-center px-[8px] py-[6px] relative rounded-[12px] shrink-0 w-full z-[4]">
            <div className="content-stretch flex items-center justify-center overflow-clip p-[4px] relative rounded-[2px] shrink-0 size-[16px]">
              <div className="relative shrink-0 size-[16px]">{icon()}</div>
            </div>
            <div className="bg-[rgba(0,0,0,0.03)] h-[16px] relative rounded-[3px] shrink-0 w-[52px]" />
          </div>
          {/* Threaded skeleton rows */}
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full z-[3]">
            <div className="h-[32px] relative shrink-0 w-[34px]">
              <div className="absolute h-[32px] right-[2px] top-0 w-[16px]">
                <div className="absolute inset-[-1.56%_0_0_-3.13%]">
                  <img
                    alt=""
                    className="block max-w-none size-full"
                    src={imgIconsGroup1}
                  />
                </div>
              </div>
            </div>
            <div className="bg-[rgba(0,0,0,0.03)] h-[16px] relative rounded-[3px] shrink-0 w-[155px]" />
          </div>
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full z-[2]">
            <div className="h-[32px] relative shrink-0 w-[34px]">
              <div className="absolute h-[32px] right-[2px] top-0 w-[16px]">
                <div className="absolute inset-[-90.05%_0_0_-3.13%]">
                  <img
                    alt=""
                    className="block max-w-none size-full"
                    src={imgIconsGroup2}
                  />
                </div>
              </div>
            </div>
            <div className="bg-[rgba(0,0,0,0.03)] h-[16px] relative rounded-[3px] shrink-0 w-[120px]" />
          </div>
          {/* Last channel skeleton */}
          <div className="content-stretch flex gap-[8px] h-[32px] items-center px-[8px] py-[6px] relative rounded-[12px] shrink-0 w-full z-[1]">
            <div className="relative shrink-0 size-[16px]">{icon()}</div>
            <div className="bg-[rgba(0,0,0,0.03)] h-[16px] relative rounded-[3px] shrink-0 w-[119px]" />
          </div>
        </div>
      </div>
    </div>
  )
}
