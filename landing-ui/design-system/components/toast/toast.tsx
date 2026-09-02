import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { Text, TextSize } from '#components/text'
import { cn } from '#lib/cn'
import { easeSpring } from '#lib/motion'
import type { ToastState } from './types'

export interface ToastProps {
  /** The toast to show, or `null` for none. Pair with `useToast`. */
  toast: ToastState | null
  /**
   * Positions the overlay container. The base is a centered, click-through
   * strip (`absolute inset-x-0`); pass the vertical placement here (e.g.
   * `bottom-10`). Anchor it to a `relative` ancestor.
   */
  className?: string
}

/**
 * Transient status pill: blurs in over ~530ms, then evaporates - a 700ms fade
 * with the recipe's strongest blur (12px). Overlaid, so it never shifts the
 * surrounding layout. Under reduced motion it appears and disappears instantly.
 *
 * Stateless: the message, lifetime, and entrance replay are driven by the
 * `toast` prop - see `useToast`, which manages all three.
 */
export function Toast({ toast, className }: ToastProps) {
  const reduceMotion = useReducedMotion()
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 flex justify-center',
        className,
      )}
    >
      <AnimatePresence>
        {toast != null && (
          <motion.div
            animate={{
              opacity: 1,
              filter: 'blur(0px)',
              transition: { duration: 0.53, ease: easeSpring },
            }}
            className="rounded-full bg-border-danger/10 px-6 py-3"
            exit={
              reduceMotion
                ? undefined
                : {
                    opacity: 0,
                    filter: 'blur(12px)',
                    transition: { duration: 0.7, ease: 'easeOut' },
                  }
            }
            initial={reduceMotion ? false : { opacity: 0, filter: 'blur(4px)' }}
            key={toast.id}
            role="status"
          >
            <Text as="span" className="text-text-danger" size={TextSize.Small}>
              {toast.message}
            </Text>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
