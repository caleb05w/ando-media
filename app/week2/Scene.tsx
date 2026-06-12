"use client";

import { useEffect, useState } from "react";
import FlipBoard from "./FlipBoard";
import Countdown from "./Countdown";

const DAY = 86400;
const START_VALUE = 10;
const END_VALUE = 5;

// One virtual countdown drives both displays: the card shows the whole days
// remaining, the timer shows the exact D:H:M:S to the very same moment, so the
// two can never disagree. The clock accelerates — the further it counts, the
// faster the flips arrive.
const R_START = (START_VALUE + 1) * DAY - 1; // card reads 10, with ~a full first day
const R_END = END_VALUE * DAY; //               freezes at 05D : 00 : 00 : 00
const SPAN = R_START - R_END;
const LEAD_MS = 0;
const DURATION_MS = 6500;

// Cubic ease-in-out: derivative starts at 0.8 (fast), peaks ~40% through
// (1.3×), then decelerates — last 3–4 flips noticeably slow down.
// Coefficients: a=-1.1, b=1.3, c=0.8  →  ease(0)=0, ease(1)=1
const ease = (u: number) => -1.1 * u * u * u + 1.3 * u * u + 0.8 * u;

export default function Scene() {
  const [remaining, setRemaining] = useState(R_START);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let raf = 0;
    let begin = 0;
    let animEndTime = 0;
    const tick = (now: number) => {
      if (!begin) begin = now + LEAD_MS;
      if (now >= begin) {
        const u = Math.min((now - begin) / DURATION_MS, 1);
        if (u < 1) {
          setRemaining(R_START - SPAN * ease(u));
        } else {
          // Animation done — real-time countdown from R_END
          if (!animEndTime) animEndTime = now;
          setRemaining(Math.max(0, R_END - (now - animEndTime) / 1000));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const cardValue = Math.max(END_VALUE, Math.floor(remaining / DAY));

  return (
    <>
      <FlipBoard value={cardValue} onComplete={() => setRevealed(true)} />
      <Countdown seconds={remaining} visible={revealed} />
    </>
  );
}
