"use client";

// /bubble-murmuration — login exploration.
//
// The auth screen is caleb-sandbox 72:620, built faithfully and left alone.
// Two logo treatments, floating toggle to compare:
//
//   01 Tiles — the living glyph-mark (./loader): the Ando mark assembled from
//      letter-stamp tiles — glyphs swapping, tones shimmering, butter sparks
//      wandering the ink. Submitting breaks the mass apart, gathers it into a
//      disc of type, and resolves it back into the mark (the Jax arc).
//   02 Chips — the prior state: the icon tile on a dashed rail with #, @, /
//      chips docked around it, turning and breathing as one.
//
// (The old sign-in flock lives on in ./murmuration, unused but kept.)

import { useRef, useState, type CSSProperties } from "react";
import { GlyphMark } from "./loader";
import "./brand-motion.css";

/* ------------------------------ chips treatment ---------------------------- */

function AndoMark({ size = 24, fill = "#1a1817" }: { size?: number; fill?: string }) {
  return (
    <svg
      width={size}
      height={size * (29.3515 / 28)}
      viewBox="0 0 28 29.3515"
      fill="none"
      aria-hidden
    >
      <path
        d="M24.9333 0.000156721C26.6269 0.000156721 27.9999 1.37305 28 3.06666V18.4C28 20.0937 26.627 21.4668 24.9333 21.4668H19.8894C19.7468 21.4668 19.6103 21.5239 19.5101 21.6253L11.9519 29.2717C11.7844 29.4412 11.4955 29.3226 11.4955 29.0843V17.5935C11.4955 17.3188 11.6167 17.0579 11.8265 16.8806L18.8125 10.9754L19.6137 10.2661C19.9697 9.95075 19.7648 9.37113 19.3054 9.33526L19.2602 9.33348H8.53792C8.16975 9.33349 7.87124 9.63201 7.87122 10.0002V20.9334C7.87121 21.228 7.63244 21.4667 7.33791 21.4668H3.06672C1.37305 21.4668 0 20.0937 0 18.4V3.06666C7.61762e-05 1.37305 1.3731 0.000156721 3.06672 0.000156721H24.9333Z"
        fill={fill}
      />
    </svg>
  );
}

const CHIPS = ["#", "@", "/"];
const DOTS = [0, 1, 2];

function Convergence() {
  return (
    <div className="relative size-[225px]">
      <svg viewBox="0 0 225 225" className="bm-rail absolute inset-0 h-full w-full">
        <circle
          cx={112.5}
          cy={112.5}
          r={87}
          fill="none"
          stroke="rgba(26,24,23,0.22)"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
      </svg>

      <div className="bm-conv-spin">
        {CHIPS.map((glyph, i) => (
          <div
            key={glyph}
            className="absolute top-1/2 left-1/2 size-0"
            style={{ transform: `rotate(${i * 120}deg)` }}
          >
            <div
              className="bm-conv-arm size-0"
              style={{ "--delay": `${i * 0.12}s` } as CSSProperties}
            >
              {/* Zero-size wrappers: rotating an auto-width div about its
                  corner displaces content differently per angle. */}
              <div className="size-0" style={{ transform: `rotate(${-i * 120}deg)` }}>
                <div className="bm-conv-counter size-0">
                  <div className="bm-chip">
                    <span className="text-[15px] leading-none font-medium text-[#1a1817]">
                      {glyph}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {DOTS.map((i) => (
          <div
            key={`d${i}`}
            className="absolute top-1/2 left-1/2 size-0"
            style={{ transform: `rotate(${60 + i * 120}deg)` }}
          >
            <div
              className="bm-conv-arm size-0"
              style={{ "--delay": `${0.3 + i * 0.12}s` } as CSSProperties}
            >
              <div className="bm-dot" style={{ background: "#6c9fc4" }} />
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="bm-enter-mark">
          <div className="bm-icon-tile">
            <AndoMark size={36} fill="#f4f2ef" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- page ----------------------------------- */

const MODES = [
  { id: "tiles", n: "01", label: "Tiles" },
  { id: "chips", n: "02", label: "Chips" },
] as const;

type Mode = (typeof MODES)[number]["id"];

export default function LoginExplorationPage() {
  const [mode, setMode] = useState<Mode>("tiles");
  const [loading, setLoading] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);
  /* The submit sequence lives in the tiles engine; in chips mode the buttons
     are visual only. */
  const submit = () => {
    if (mode === "tiles") setLoading(true);
  };

  const fade = (visible: boolean) =>
    `transition-opacity duration-500 ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-white">
      {mode === "tiles" && (
        <GlyphMark run={loading} originRef={slotRef} onDone={() => setLoading(false)} />
      )}

      {/* Prototype chrome — not part of the design. */}
      <div className="absolute top-6 left-1/2 z-40 -translate-x-1/2">
        <div className="inline-flex items-center gap-[2px] rounded-full border border-[#e7e5e2] bg-white p-[3px]">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id);
                setLoading(false);
              }}
              aria-pressed={mode === m.id}
              className={`rounded-full px-[14px] py-[6px] text-[12px] leading-[16px] transition-colors ease-fast ${
                mode === m.id
                  ? "bg-[#1a1817] text-white"
                  : "text-[#58524e] hover:text-[#1a1817]"
              }`}
            >
              <span className={`mr-[6px] ${mode === m.id ? "opacity-50" : "opacity-40"}`}>
                {m.n}
              </span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Figma 72:620, unchanged apart from the logo slot. */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-[540px] flex-col items-center">
          <div
            ref={slotRef}
            className="flex h-[240px] w-full items-center justify-center pb-4"
          >
            {mode === "chips" && <Convergence />}
          </div>

          <p className={`text-[20px] leading-7 text-[#1a1817] ${fade(!loading)}`}>
            Login to Ando
          </p>

          <div className={`flex w-full flex-col items-start px-12 pt-8 ${fade(!loading)}`}>
            <input
              type="email"
              placeholder="Enter your email"
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              className="h-11 w-full rounded-[6px] border border-[#ebe9e8] bg-white pr-4 pl-[10px] text-[14px] text-[#1a1817] placeholder:text-[#78716c] focus:border-[rgba(16,16,16,0.25)] focus:outline-none"
            />
            <div className="flex w-full flex-col gap-4 pt-4">
              <div className="flex w-full items-center gap-3">
                <div className="h-px flex-1 bg-[#ebe9e8]" />
                <span className="text-[12px] leading-4 text-[#58524e]">or</span>
                <div className="h-px flex-1 bg-[#ebe9e8]" />
              </div>
              <button
                type="button"
                onClick={submit}
                className="flex h-11 w-full items-center justify-center gap-[6px] rounded-[6px] border border-[#ebe9e8] transition-colors ease-fast hover:bg-[#fafaf9]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- committed Figma asset at its designed size */}
                <img
                  src="/bubble-murmuration/google-g.png"
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 object-cover"
                />
                <span className="text-[14px] leading-5 font-medium text-[#1a1817]">
                  Continue with Google
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`flex min-h-[64px] w-full items-start justify-center gap-6 pb-8 ${fade(!loading)}`}
      >
        <span className="cursor-pointer text-[12px] leading-4 text-[#78716c]">
          Terms of Service
        </span>
        <span className="cursor-pointer text-[12px] leading-4 text-[#78716c]">
          Privacy Policy
        </span>
      </div>
    </div>
  );
}
