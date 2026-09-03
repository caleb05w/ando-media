"use client";

// The product's typing indicator, as it sits above the composer:
// app/common/components/typing-indicator.tsx + typing-indicator-dots.tsx.
// Three 4px dots breathing on a 0.9s cycle, 140ms apart, then the name —
// ink for a member, #7C3AED for an agent — and a muted " is typing...".
// The whole line rides on a gradient from the main background so it fades
// the transcript out behind it rather than sitting on a hard edge.

import { motion, useReducedMotion, type Variants } from "motion/react";
import { isAgent, type Actor } from "./scenes";

const DOTS = [0, 1, 2] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 3, transition: { duration: 0.12, ease: "easeOut" } },
  visible: { opacity: 1, y: 0, transition: { duration: 0.14, ease: "easeOut" } },
};

const dotsContainerVariants: Variants = {
  hidden: { opacity: 0, width: 0, x: 4, transition: { duration: 0.12, ease: "easeIn", when: "afterChildren", staggerChildren: 0.035, staggerDirection: -1 } },
  visible: { opacity: 1, width: "auto", x: 0, transition: { duration: 0.16, ease: "easeOut", staggerChildren: 0.05, delayChildren: 0.03 } },
};

const dotVariants: Variants = {
  hidden: { opacity: 0, scale: 0.4, y: 2 },
  visible: (index: number) => ({
    opacity: [0.45, 1, 0.45],
    scale: [1, 1.12, 1],
    y: [0, -1.5, 0],
    transition: { delay: index * 0.14, duration: 0.9, ease: "easeInOut", repeat: Infinity },
  }),
};

const reducedMotionDotVariants: Variants = {
  hidden: { opacity: 0, scale: 0.4, y: 2 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
};

function TypingIndicatorDots() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.span aria-hidden initial="hidden" animate="visible" exit="hidden" variants={dotsContainerVariants} className="flex h-5 shrink-0 items-center justify-center gap-0.5 overflow-hidden text-ando-fg-secondary">
      {DOTS.map((index) => (
        <motion.span key={index} custom={index} variants={reduceMotion ? reducedMotionDotVariants : dotVariants} className="size-1 rounded-full bg-current" />
      ))}
    </motion.span>
  );
}

/** Mount inside a `relative` wrapper directly above the composer box. */
export function TypingIndicator({ actor }: { actor: Actor }) {
  return (
    <motion.div
      key={actor.name}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={containerVariants}
      // bottom-full would end exactly on the composer's top edge and the
      // opaque foot of the gradient would paint over its 1px ring — the
      // corner disappears. Sit 3px above it instead; the product's slot has
      // the region's padding under it for the same reason.
      className="pointer-events-none absolute bottom-[calc(100%+3px)] left-0 flex h-9 w-full items-end overflow-hidden bg-linear-to-t from-ando-bg-main from-45% to-transparent pb-1.5 pl-1 pt-1"
      role="status"
      aria-label={`${actor.name} is typing`}
    >
      <div className="pointer-events-auto flex cursor-default items-center space-x-1.5 kanso-text-label-14">
        <TypingIndicatorDots />
        <span aria-hidden className="inline-flex min-w-0 items-baseline">
          <span className={isAgent(actor) ? "text-[#7C3AED]" : "text-ando-fg-primary"}>{actor.name}</span>
          {/* NBSP: the suffix is its own flex item, and a flex item drops a leading
              ordinary space. The product survives this by wrapping every
              character in its own span. */}
          <span className="text-ando-fg-secondary">{"\u00A0is typing..."}</span>
        </span>
      </div>
    </motion.div>
  );
}
