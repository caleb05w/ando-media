"use client";

// How anything lands in a list on the stage — one entrance for channel
// messages, thread replies and live-transcript lines alike, lifted from
// the landing page's hero (landing-ui/ando-hero/components/chat-panel.tsx
// SlotGrow): the row's slot grows from nothing on the hero's curve, so
// whatever is around it is moved by layout rather than sliding, and the
// row fades in. It holds its top edge and clips while the slot opens, so
// it reveals in reading order, then releases the clip.

import { motion } from "motion/react";
import { useState, type ReactNode } from "react";

/** The landing hero's entrance curve for anything that lands. */
export const LAND_EASE = [0.3, 0.8, 0.3, 1] as const;
export const LAND_MS = 300;

export function Landing({ children, className = "", anchor = "top", ease = LAND_EASE, ...rest }: { children: ReactNode; className?: string; /** Which edge the row holds while the slot grows. */ anchor?: "top" | "bottom"; /** The slot's growth curve. Lines that arrive as fast as they grow — a live transcript — want `"linear"`: an ease-out that dies just as the next line kicks makes the whole list pulse. */ ease?: readonly [number, number, number, number] | "linear" } & Record<`data-${string}`, string | undefined>) {
  const [grown, setGrown] = useState(false);
  return (
    <motion.div
      className={`flex w-full flex-col ${anchor === "top" ? "justify-start" : "justify-end"} ${className}`}
      style={{ overflow: grown ? "visible" : "hidden" }}
      initial={{ height: 0 }}
      animate={{ height: "auto" }}
      transition={{ duration: LAND_MS / 1000, ease: ease === "linear" ? "linear" : ([...ease] as [number, number, number, number]) }}
      onAnimationComplete={() => setGrown(true)}
      {...rest}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ opacity: { duration: 0.18, ease: "easeOut" } }} className="flex w-full flex-col">
        {children}
      </motion.div>
    </motion.div>
  );
}
