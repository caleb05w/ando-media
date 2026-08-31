"use client";

// A single typing variant, looping, with no workbench chrome — so the
// landing page can show one of the studies without a second copy of the
// animation. All the real work still lives in /agent-typing-experience
// (variants + stage); this only drives the clock and picks the variant.

import { useEffect, useRef, useState } from "react";

import { Stage } from "../agent-typing-experience/stage";
import { cycleFrame, cycleMs, VARIANTS } from "../agent-typing-experience/variants";

export function TypingShowcase({
  variantKey = "orbit-v2",
  size = 120,
}: {
  /** key from ./variants — defaults to Orbit v2 · Spin-in */
  variantKey?: string;
  size?: number;
}) {
  const variant = VARIANTS.find((v) => v.key === variantKey) ?? VARIANTS[0];
  const [vt, setVt] = useState(0);
  const vtRef = useRef(0);
  const last = useRef<number | null>(null);

  useEffect(() => {
    // Honour reduced motion by holding the resolved frame rather than looping.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVt(cycleMs(variant));
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      // Clamped step: a backgrounded tab resumes where it left off instead
      // of fast-forwarding through the cycle.
      if (last.current != null) {
        vtRef.current += Math.min(now - last.current, 64);
      }
      last.current = now;
      setVt(vtRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      last.current = null;
    };
  }, [variant]);

  const { frame } = cycleFrame(variant, vt % cycleMs(variant));

  return (
    <figure className="m-0 flex flex-col items-center">
      <Stage frame={frame} size={size} avatarSrc={variant.avatar} />
    </figure>
  );
}
