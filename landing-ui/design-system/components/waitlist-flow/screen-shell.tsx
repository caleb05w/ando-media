import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode, Ref } from 'react'

import { Text, TextFont, TextSize } from '#components/text'
import { cn } from '#lib/cn'
import { enterAt, STAGGER_WORD, screenExit } from './motion'

/**
 * One screen's animated shell. Children stagger their own entrances; the
 * shell exits as a unit (fade, blur-up, 16px rise) while `popLayout` pins it
 * in place so the incoming screen animates concurrently underneath. Under
 * reduced motion the screen is removed instantly (no exit prop) - all
 * channels disabled, not just transforms.
 */
export function Screen({
  ref,
  className,
  children,
}: {
  /** popLayout needs the node to pin the exiting screen in place. */
  ref?: Ref<HTMLDivElement>
  className?: string
  children: ReactNode
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={cn('flex min-h-0 flex-1 flex-col', className)}
      exit={
        reduceMotion ? undefined : { opacity: 0, y: -16, filter: 'blur(8px)' }
      }
      ref={ref}
      transition={screenExit}
    >
      {children}
    </motion.div>
  )
}

/** Standard block entrance: rise + unblur on the shared timing. */
export function Rise({
  delay = 0,
  blur = 8,
  distance = 16,
  slow = false,
  className,
  children,
}: {
  delay?: number
  /** Blur tier by element size: 4 words, 8 buttons, 10 text blocks. */
  blur?: number
  distance?: number
  /** Finale cadence (the done screen): 1.5s tweens instead of 1s. */
  slow?: boolean
  className?: string
  children: ReactNode
}) {
  // `initial={false}` renders settled in place - no entrance of any kind.
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      className={className}
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: distance, filter: `blur(${blur}px)` }
      }
      transition={enterAt(delay, { slow })}
    >
      {children}
    </motion.div>
  )
}

/**
 * The question heading, entering per word: each word rises and unblurs on
 * the shared curve, 25ms behind the previous (the signature ripple). The
 * split copy is aria-hidden behind a single sr-only original.
 */
export function StaggeredTitle({ text }: { text: string }) {
  const reduceMotion = useReducedMotion()
  const words = text.split(' ')
  // Repeated words get occurrence-numbered keys ("the-0", "the-1"); the list
  // is static per screen, so identity by word+occurrence is stable.
  const occurrences = new Map<string, number>()
  return (
    <Text
      as="h2"
      className="text-balance text-center"
      font={TextFont.Sans}
      size={{ base: TextSize.XL, md: TextSize.XXL }}
      weight="medium"
    >
      <span className="sr-only">{text}</span>
      {words.map((word, index) => {
        const occurrence = occurrences.get(word) ?? 0
        occurrences.set(word, occurrence + 1)
        return (
          <motion.span
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            aria-hidden
            className="inline-block whitespace-pre"
            initial={
              reduceMotion ? false : { opacity: 0, y: 16, filter: 'blur(4px)' }
            }
            key={`${word}-${occurrence}`}
            transition={enterAt(index * STAGGER_WORD)}
          >
            {index < words.length - 1 ? `${word} ` : word}
          </motion.span>
        )
      })}
    </Text>
  )
}
