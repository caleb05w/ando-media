"use client";

// w1 — a day in Sara's world. The stage is a PLACE, not a backdrop:
// a floor plane meets the sky at a horizon, the window stands on it and
// casts a shadow. The three use cases are times of day — choosing one
// doesn't switch a slide, it moves the light. Dawn for catching up,
// noon for the brief, dusk for the receipts. The change arrives slowly,
// at the threshold of noticing.

import { useState } from "react";

const FG_PRIMARY = "#1a1817";
const STROKE_WEAK = "#f0efee";

type DayTime = {
  id: string;
  label: string;
  title: string;
  channel: string;
  sara: string;
  yumi: string;
  sky: string;
  floor: string;
  // the light: where the window's shadow falls, and how hard
  shadow: { x: number; sx: number; o: number };
};

export const TIMES: DayTime[] = [
  {
    id: "morning",
    label: "Morning",
    title: "Catch up in seconds",
    channel: "general",
    sara: "yumi, what did I miss?",
    yumi: "3 decisions while you were out — pricing v2 is a go.",
    sky: "linear-gradient(180deg, #c9ddf4 0%, #e9dcc9 72%, #f2ddc2 100%)",
    floor: "#e4d6c4",
    shadow: { x: -30, sx: 1.35, o: 0.16 },
  },
  {
    id: "midday",
    label: "Midday",
    title: "Jam → brief",
    channel: "design",
    sara: "can you brief this jam up?",
    yumi: "Drafted from the Jam — decisions bolded.",
    sky: "linear-gradient(180deg, #74acf5 0%, #b6d5fb 70%, #dcecfe 100%)",
    floor: "#d6e7fb",
    shadow: { x: 0, sx: 0.92, o: 0.2 },
  },
  {
    id: "evening",
    label: "Evening",
    title: "Receipts kept",
    channel: "bugs",
    sara: "summarize, but keep the originals",
    yumi: "Posted — every line links back to its source.",
    sky: "linear-gradient(180deg, #5f719a 0%, #a68ba1 68%, #e2ab8e 100%)",
    floor: "#96878f",
    shadow: { x: 32, sx: 1.45, o: 0.28 },
  },
];

/** The window, frozen mid-use — same proportions as the real one. */
export function WorldFrame({ time }: { time: DayTime }) {
  return (
    <div className="relative flex aspect-[540/366] w-full flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_10px_30px_rgba(28,25,23,0.18)]">
      <div className="flex h-[22px] items-center gap-1.5 border-b border-[#e4e2e0] bg-[#ececeb] px-2.5">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
      </div>
      <div className="flex h-[28px] items-center gap-[6px] border-b-[0.5px] px-3" style={{ borderColor: STROKE_WEAK }}>
        <span className="text-[10px] leading-none text-[#a8a29e]">#</span>
        <span className="text-[10px] font-medium leading-[14px]" style={{ color: FG_PRIMARY }}>
          {time.channel}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-2.5 px-3 py-3">
        <div className="flex items-start gap-[6px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/avatars/sara.png" alt="" className="mt-px size-[14px] max-w-none rounded-full object-cover" />
          <div>
            <p className="text-[9px] font-semibold leading-[12px]" style={{ color: FG_PRIMARY }}>
              Sara Du
            </p>
            <p className="text-[9.5px] leading-[13px] text-[#44403c]">{time.sara}</p>
          </div>
        </div>
        <div className="flex items-start gap-[6px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/avatars/agent-1.png" alt="" className="mt-px size-[14px] max-w-none rounded-full object-cover" />
          <div>
            <p className="text-[9px] font-semibold leading-[12px] text-[#2563eb]">Yumi</p>
            <p className="text-[9.5px] leading-[13px] text-[#44403c]">{time.yumi}</p>
          </div>
        </div>
      </div>
      <div className="m-2 rounded-[8px] border-[0.5px] border-[#dedcda] px-2 pb-1.5 pt-1.5">
        <p className="text-[9px] leading-[12px] text-[#a8a29e]">Enter your message</p>
      </div>
    </div>
  );
}

export function MiniWorld() {
  const [idx, setIdx] = useState(0);
  const time = TIMES[idx];

  return (
    <div className="flex flex-col">
      <div className="relative overflow-hidden rounded-[14px]">
        {/* the skies — every time of day is always here; the chosen one
            is simply the one the light favors right now */}
        {TIMES.map((t, i) => (
          <div
            key={t.id}
            className={`absolute inset-0 transition-opacity duration-[1600ms] ease-linear motion-reduce:duration-0 ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-x-0 top-0 h-[74%]" style={{ background: t.sky }} />
            {/* the floor — the horizon is where it meets the sky */}
            <div className="absolute inset-x-0 bottom-0 h-[26%]" style={{ background: t.floor }} />
          </div>
        ))}

        <div className="relative flex justify-center px-6 pb-16 pt-12 sm:pb-20 sm:pt-16">
          <div className="relative w-full max-w-[420px]">
            {/* the shadow the light writes on the floor */}
            <div
              className="absolute -bottom-5 left-1/2 h-[14px] w-[86%] rounded-[50%] bg-[#1c1917] blur-[9px] transition-all duration-[1600ms] ease-linear motion-reduce:duration-0"
              style={{
                opacity: time.shadow.o,
                transform: `translateX(calc(-50% + ${time.shadow.x}px)) scaleX(${time.shadow.sx})`,
              }}
            />
            <WorldFrame time={time} />
          </div>
        </div>
      </div>

      {/* the day — three times, three cases */}
      <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 pt-6">
        {TIMES.map((t, i) => {
          const active = i === idx;
          return (
            <button
              key={t.id}
              className="flex flex-col items-center gap-0.5 text-center"
              onClick={() => setIdx(i)}
              type="button"
            >
              <span
                className={`font-mono text-[9px] uppercase leading-4 tracking-[0.16em] transition-colors duration-300 ${
                  active ? "text-[#2563eb]" : "text-text-tertiary"
                }`}
              >
                {t.label}
              </span>
              <span
                className={`font-sans text-size-sm leading-5 transition-colors duration-300 ${
                  active ? "font-medium text-text-primary" : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {t.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
