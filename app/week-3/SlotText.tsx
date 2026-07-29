"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Front-loaded easing ported from the portfolio-v5 navbar slot roll.
const EASE = "cubic-bezier(0.62, 0.61, 0.02, 1)";

type Props = {
  /** The line to display. Change it and the component rolls to the new value. */
  message: string;
  /** Roll duration in ms. */
  durationMs?: number;
  /**
   * Classes for the (overflow-hidden) box. Set the height + line-height to match
   * your font so a single line fits exactly, e.g. "h-5 leading-5 text-sm".
   * Text alignment / color also go here and are inherited by the lines.
   */
  className?: string;
};

/**
 * Single-line vertical "slot" roll. The outgoing line rolls up and out
 * (translateY 0% → -100%) while the incoming line rises from below (100% → 0%),
 * inside an overflow-hidden box. The first line rolls in on mount; each new
 * `message` rolls to the next. Self-contained — no global CSS required.
 */
export default function SlotText({
  message,
  durationMs = 700,
  className = "",
}: Props) {
  const [pair, setPair] = useState({ out: "", in: message });
  const [rolled, setRolled] = useState(false); // false => "in" waiting below the box
  const [animate, setAnimate] = useState(false);
  const prev = useRef(message);
  const rafRef = useRef<number | null>(null);

  // Snap-then-roll: wait one painted frame in the "before" state, then enable
  // the transition and flip to "after" so the browser animates the change.
  const roll = useCallback(() => {
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setAnimate(true);
        setRolled(true);
      });
    });
  }, []);

  // Roll the first line up into place on mount.
  useEffect(() => {
    roll();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [roll]);

  // Roll to each new message.
  useEffect(() => {
    if (message === prev.current) return;
    const outgoing = prev.current;
    prev.current = message;

    setAnimate(false); // 1) snap to the "before" frame
    setPair({ out: outgoing, in: message });
    setRolled(false);

    roll(); // 2) next frame: roll to "after"

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [message, roll]);

  const transition = animate ? `transform ${durationMs}ms ${EASE}` : "none";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <span
        className="absolute inset-x-0 top-0 block"
        style={{
          transform: rolled ? "translateY(-100%)" : "translateY(0%)",
          transition,
        }}
      >
        {pair.out}
      </span>
      <span
        className="absolute inset-x-0 top-0 block"
        style={{
          transform: rolled ? "translateY(0%)" : "translateY(100%)",
          transition,
        }}
      >
        {pair.in}
      </span>
    </div>
  );
}
