"use client";

// o3b — the record player, played. The little world does not exist
// until a record is deliberately put on: choose a sleeve, the disc
// lands on the platter and spins, and the mini ando fades in beside it,
// playing that case. No autoplay, no reel — the resting state is an
// empty platter and a quiet dashed outline. Intent is the interaction.

import { useEffect, useState, useSyncExternalStore } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

const FG_PRIMARY = "#1a1817";
const STROKE_WEAK = "#f0efee";

type RecordCase = {
  id: string;
  title: string;
  channel: string;
  sara: string;
  yumi: string;
  tone: string;
  ink: string;
};

const RECORDS: RecordCase[] = [
  {
    id: "catchup",
    title: "Catching up",
    channel: "general",
    sara: "yumi, what did I miss?",
    yumi: "3 decisions while you were out — pricing v2 is a go.",
    tone: "#2563eb",
    ink: "#fcfcfc",
  },
  {
    id: "briefs",
    title: "Jams into briefs",
    channel: "design",
    sara: "can you brief this jam up?",
    yumi: "Drafted from the Jam — decisions bolded.",
    tone: "#e7e1d8",
    ink: "#57534e",
  },
  {
    id: "receipts",
    title: "The receipts",
    channel: "bugs",
    sara: "summarize, but keep the originals",
    yumi: "Posted — every line links back to its source.",
    tone: "#ddd6cb",
    ink: "#57534e",
  },
];

// Beats once a record is on: 1 world fades in · 2 Sara's message lands ·
// 3 Yumi answers — then the record just keeps spinning.
const BEATS: [number, number][] = [
  [1, 350],
  [2, 1500],
  [3, 2600],
];

/** A landing message pushes the ones above it up — the house slot. */
function MsgSlot({ who, text, shown }: { who: "sara" | "yumi"; text: string; shown: boolean }) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-fast ${
        shown ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`flex items-start gap-[6px] pt-2.5 transition-all duration-300 ease-fast ${
            shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={who === "sara" ? "/avatars/sara.png" : "/avatars/agent-1.png"}
            alt=""
            className="mt-px size-[14px] max-w-none rounded-full object-cover"
          />
          <div className="min-w-0">
            <p
              className="text-[9px] font-semibold leading-[12px]"
              style={{ color: who === "yumi" ? "#2563eb" : FG_PRIMARY }}
            >
              {who === "sara" ? "Sara Du" : "Yumi"}
            </p>
            <p className="text-[9.5px] leading-[13px] text-[#44403c]">{text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The world's window — the stand-in frame, but alive to the beats. */
function WorldWindow({ record, beat }: { record: RecordCase; beat: number }) {
  return (
    <div className="flex aspect-[540/366] w-full max-w-[420px] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_18px_40px_rgba(23,68,130,0.28)]">
      <div className="flex h-[22px] items-center gap-1.5 border-b border-[#e4e2e0] bg-[#ececeb] px-2.5">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
      </div>
      <div className="flex h-[28px] items-center gap-[6px] border-b-[0.5px] px-3" style={{ borderColor: STROKE_WEAK }}>
        <span className="text-[10px] leading-none text-[#a8a29e]">#</span>
        <span className="text-[10px] font-medium leading-[14px]" style={{ color: FG_PRIMARY }}>
          {record.channel}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-end overflow-hidden px-3 pb-3">
        <MsgSlot who="sara" text={record.sara} shown={beat >= 2} />
        <MsgSlot who="yumi" text={record.yumi} shown={beat >= 3} />
      </div>
      <div className="m-2 rounded-[8px] border-[0.5px] border-[#dedcda] px-2 pb-1.5 pt-1.5">
        <p className="text-[9px] leading-[12px] text-[#a8a29e]">Enter your message</p>
      </div>
    </div>
  );
}

export function ObjectRecordPlayer() {
  const [rec, setRec] = useState<number | null>(null);
  const [run, setRun] = useState(0);
  const [beat, setBeat] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (rec === null || reduced) return;
    const timers = [window.setTimeout(() => setBeat(0), 0)];
    timers.push(...BEATS.map(([b, at]) => window.setTimeout(() => setBeat(b), at)));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [rec, run, reduced]);

  const record = rec === null ? null : RECORDS[rec];
  const shownBeat = reduced ? 3 : beat;
  const worldOn = record !== null && shownBeat >= 1;

  return (
    <div className="grid grid-cols-1 items-center gap-10 sm:grid-cols-[212px_minmax(0,1fr)]">
      <div className="flex flex-col items-center">
        {/* the crate — choosing is the whole gesture */}
        <div className="flex items-end gap-1.5">
          {RECORDS.map((r, i) => {
            const on = i === rec;
            return (
              <button
                key={r.id}
                className={`flex size-[64px] flex-col justify-between rounded-[2px] p-1.5 text-left shadow-[inset_0_0_0_0.5px_rgba(28,25,23,0.12)] transition-transform duration-200 ease-fast ${
                  on ? "-translate-y-1.5" : "hover:-translate-y-0.5"
                }`}
                onClick={() => {
                  setRec(i);
                  setRun((n) => n + 1);
                }}
                style={{ background: r.tone }}
                type="button"
              >
                <span className="font-mono text-[7px] uppercase tracking-[0.12em]" style={{ color: r.ink, opacity: 0.7 }}>
                  SD·{String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-[10.5px] leading-[12px]" style={{ color: r.ink }}>
                  {r.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* the player */}
        <div className="mt-4 rounded-[10px] bg-[#f0ece5] p-4 shadow-[inset_0_0_0_0.5px_rgba(28,25,23,0.08)]">
          <div className="relative flex size-[128px] items-center justify-center rounded-full bg-[#e3ddd2]">
            {record ? (
              <div
                className={`relative size-[118px] rounded-full bg-[#1c1917] ${
                  reduced ? "" : "animate-[spin_2.4s_linear_infinite]"
                }`}
              >
                <span className="absolute inset-[9px] rounded-full border border-[#2e2a26]" />
                <span className="absolute inset-[18px] rounded-full border border-[#2e2a26]" />
                <span
                  className="absolute left-1/2 top-1/2 flex size-[38px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
                  style={{ background: record.tone }}
                >
                  <span className="size-[3.5px] rounded-full bg-[#1c1917]" />
                </span>
                {/* a glint so the spin reads */}
                <span className="absolute left-1/2 top-[4px] h-[3px] w-[10px] -translate-x-1/2 rounded-full bg-[#3a3531]" />
              </div>
            ) : (
              <span className="size-[5px] rounded-full bg-[#c6bfb2]" />
            )}
          </div>
        </div>

        <p className="pt-3 text-center font-mono text-[9px] uppercase leading-4 tracking-[0.16em] text-text-tertiary">
          {record ? `now playing · ${record.title}` : "put a record on"}
        </p>
      </div>

      {/* the world — nothing, until the record plays it into being */}
      <div className="relative">
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center rounded-[14px] border-[0.5px] border-dashed border-[#d6d1c9] transition-opacity duration-500 ${
            worldOn ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="font-mono text-[9px] uppercase leading-4 tracking-[0.16em] text-text-tertiary">
            the world appears when a record plays
          </p>
        </div>
        <div
          className={`flex justify-center rounded-[14px] p-8 transition-all duration-700 ease-fast sm:p-10 ${
            worldOn ? "scale-100 opacity-100" : "scale-[0.97] opacity-0"
          }`}
          style={{
            background: "radial-gradient(120% 140% at 18% 12%, #dcecfe 0%, #9cc7fb 45%, #62a4f4 100%)",
          }}
        >
          {record ? (
            <WorldWindow key={`${rec}-${run}`} record={record} beat={shownBeat} />
          ) : (
            /* holds the height while the world is unborn */
            <div className="aspect-[540/366] w-full max-w-[420px]" />
          )}
        </div>
      </div>
    </div>
  );
}
