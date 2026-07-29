"use client";

import { useEffect, useState } from "react";

/**
 * Cycles through `messages` on an interval while `active` is true, returning the
 * current message. Resets to the first when inactive. Pair the return value with
 * <SlotText/> to get rolling loader copy:
 *
 *   const msg = useCyclingMessages(STEPS, { active: creating });
 *   {creating && <SlotText message={msg} className="h-5 leading-5 text-sm" />}
 */
export function useCyclingMessages(
  messages: string[],
  { active, intervalMs = 2200 }: { active: boolean; intervalMs?: number }
): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, messages.length]);

  return messages[index] ?? "";
}
