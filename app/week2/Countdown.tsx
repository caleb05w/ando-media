"use client";

import { Fragment, useEffect, useState } from "react";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function SlotDigit({ value }: { value: number }) {
  return (
    <span className="inline-block h-[1.2em] overflow-hidden align-bottom">
      <span
        className="block transition-transform duration-[220ms]"
        style={{
          transform: `translateY(${-value * 1.2}em)`,
          transitionTimingFunction: "cubic-bezier(0.34, 1.4, 0.64, 1)",
        }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="block h-[1.2em] leading-[1.2em]">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

function SlotUnit({ text }: { text: string }) {
  return (
    <span className="inline-flex">
      {[...text].map((ch, i) =>
        /\d/.test(ch) ? (
          <SlotDigit key={i} value={Number(ch)} />
        ) : (
          <span key={i} className="leading-[1.2em]">
            {ch}
          </span>
        )
      )}
    </span>
  );
}

const UNIT_DELAYS = [0, 70, 140, 210]; // stagger ms

export default function Countdown({ seconds, visible }: { seconds: number; visible: boolean }) {
  const s = Math.floor(Math.max(0, seconds));
  const units = [
    `${String(Math.floor(s / 86400)).padStart(2, "0")}D`,
    `${String(Math.floor(s / 3600) % 24).padStart(2, "0")}H`,
    `${String(Math.floor(s / 60) % 60).padStart(2, "0")}M`,
    `${String(s % 60).padStart(2, "0")}S`,
  ];

  // Staggered entrance triggered when card lands on 5
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const timers = [
      setTimeout(() => setPhase(1), 600),   // after container delay starts
      setTimeout(() => setPhase(2), 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 flex flex-col items-center gap-4 text-center text-[14.4px] text-black"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translate(-50%, -50%) scale(1)"
          : "translate(-50%, calc(-50% + 32px)) scale(0.91)",
        transition: "opacity 0.85s 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 1s 0.5s cubic-bezier(0.34, 1.15, 0.64, 1)",
      }}
    >
      {/* Title — slides up after card enters */}
      <p
        className="font-mono"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        NEW LANDING PAGE
      </p>

      {/* Timer units — stagger in after title */}
      <div className="flex items-center gap-6 opacity-60">
        {units.map((u, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <span
                style={{
                  opacity: phase >= 2 ? 1 : 0,
                  transform: phase >= 2 ? "translateY(0)" : "translateY(6px)",
                  transition: `opacity 0.45s ${UNIT_DELAYS[i] + 60}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.45s ${UNIT_DELAYS[i] + 60}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                }}
              >
                :
              </span>
            )}
            <span
              style={{
                opacity: phase >= 2 ? 1 : 0,
                transform: phase >= 2 ? "translateY(0)" : "translateY(6px)",
                transition: `opacity 0.45s ${UNIT_DELAYS[i]}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.5s ${UNIT_DELAYS[i]}ms cubic-bezier(0.34, 1.3, 0.64, 1)`,
              }}
            >
              <SlotUnit text={u} />
            </span>
          </Fragment>
        ))}
      </div>

    </div>
  );
}
