"use client";

// How anything lands in a list on the stage — one entrance for channel
// messages, thread replies and live-transcript lines alike, lifted from
// the landing page's hero (landing-ui/ando-hero/components/chat-panel.tsx
// SlotGrow): the row's slot grows from nothing on the hero's curve, so
// whatever is around it is moved by layout rather than sliding, and the
// row fades in. It holds its top edge and clips while the slot opens, so
// it reveals in reading order, then releases the clip.
//
// The slot's target height is measured here in layout px (offsetHeight)
// and animated to that number. Motion's own `height: "auto"` measures
// through getBoundingClientRect, which includes any ancestor scale — under
// the Jam hero's 1.2× that overshot every slot by 20% and then snapped
// back when the animation resolved to auto.

import { animate } from "motion";
import { useLayoutEffect, useRef, type ReactNode } from "react";

/** The landing hero's entrance curve for anything that lands. */
export const LAND_EASE = [0.3, 0.8, 0.3, 1] as const;
export const LAND_MS = 300;
const FADE_MS = 180;

/** The opposite of a landing: whatever is inside folds away on the same
 *  curve — its height (and the flex gap above it, `gap` px) to nothing —
 *  so the rows around it move once, smoothly, instead of jumping when it
 *  unmounts. It stays in the tree at zero height. */
export function Leaving({ children, gap = 0 }: { children: ReactNode; gap?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = el.offsetHeight;
    el.style.overflow = "hidden";
    const fold = animate(el, { height: [from, 0], marginTop: [0, -gap], opacity: [1, 0] }, { duration: LAND_MS / 1000, ease: [...LAND_EASE] });
    return () => fold.stop();
  }, [gap]);
  return <div ref={ref} className="flex w-full flex-col">{children}</div>;
}

export function Landing({ children, className = "", anchor = "top", gap = 0, from = 0, ...rest }: { children: ReactNode; className?: string; /** Which edge the row holds while the slot grows. */ anchor?: "top" | "bottom"; /** The flex gap (px) the parent puts above this slot: it grows in with the slot instead of appearing whole. */ gap?: number; /** The slot's starting height: the clearance a typing indicator held (dropped the same frame), so what is above moves once. */ from?: number } & Record<`data-${string}`, string | undefined>) {
  const slotRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const slot = slotRef.current;
    const inner = innerRef.current;
    if (!slot || !inner) return;
    const target = inner.offsetHeight;
    slot.style.overflow = "hidden";
    const grow = animate(slot, gap > 0 ? { height: [from, target], marginTop: [-gap, 0] } : { height: [from, target] }, { duration: LAND_MS / 1000, ease: [...LAND_EASE] });
    const fade = animate(inner, { opacity: [0, 1] }, { duration: FADE_MS / 1000, ease: "easeOut" });
    grow.then(() => {
      slot.style.height = "auto";
      slot.style.overflow = "visible";
    });
    return () => {
      grow.stop();
      fade.stop();
    };
  }, [gap, from]);
  return (
    <div ref={slotRef} className={`flex w-full flex-col ${anchor === "top" ? "justify-start" : "justify-end"} ${className}`} style={{ height: from, overflow: "hidden", marginTop: gap > 0 ? -gap : undefined }} {...rest}>
      <div ref={innerRef} className="flex w-full flex-col" style={{ opacity: 0 }}>
        {children}
      </div>
    </div>
  );
}
