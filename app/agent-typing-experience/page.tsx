"use client";

// /agent-typing-experience — the typing indicator becoming an agent, nine
// ways, built from the Agent trace storyboard (Figma Db5PC5Ai4JAB9cmho2HcOn,
// section 146-6104) and tuned in review. All motion data and frame builders
// live in ./variants — this file is the presentation: a library grid of
// every variant running live at 1:1 (60px), then a full section per variant
// with a 240px stage, controls, at-size checks, and a keyframe strip.

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductPanel, PANEL_W } from "./product-panel";
import { Stage } from "./stage";
import {
  cycleFrame,
  cycleMs,
  typingFrame,
  VARIANTS,
  type PhaseName,
  type Variant,
  TYPE_MS,
} from "./variants";

/* --------------------------------- clocks ---------------------------------- */

// One rAF driving a virtual-time state. The step is clamped so a
// backgrounded tab (rAF paused) resumes where it left off instead of
// fast-forwarding through the cycle.
function useVirtualTime(speedRef: React.MutableRefObject<number>) {
  const [vt, setVt] = useState(0);
  const vtRef = useRef(0);
  const last = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      if (last.current != null) {
        vtRef.current += Math.min(now - last.current, 64) * speedRef.current;
      }
      last.current = now;
      setVt(vtRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speedRef]);

  const set = useCallback((ms: number) => {
    vtRef.current = ms;
  }, []);

  return { vt, set };
}

function useCycle(variant: Variant) {
  const speedRef = useRef(1);
  const [slow, setSlow] = useState(false);
  const { vt, set } = useVirtualTime(speedRef);
  const state = cycleFrame(variant, vt % cycleMs(variant));
  return {
    ...state,
    slow,
    toggleSlow: () =>
      setSlow((s) => {
        speedRef.current = s ? 1 : 0.25;
        return !s;
      }),
    replay: () => set(0),
    skipToMorph: () => set(TYPE_MS),
  };
}

/* --------------------------------- render ---------------------------------- */


function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[6px] border border-[#ebe9e8] bg-white ${className}`}>
      {children}
    </div>
  );
}

/* --------------------------------- library --------------------------------- */

// One shared clock + speed toggle for a wall of tiles.
function useSharedClock() {
  const speedRef = useRef(1);
  const [slow, setSlow] = useState(false);
  const { vt, set } = useVirtualTime(speedRef);
  const toggleSlow = () =>
    setSlow((s) => {
      speedRef.current = s ? 1 : 0.25;
      return !s;
    });
  return { vt, set, slow, toggleSlow };
}

function ClockControls({
  slow,
  toggleSlow,
  replay,
}: {
  slow: boolean;
  toggleSlow: () => void;
  replay: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="font-mono text-[11px] leading-4 text-[#8a827b] transition-colors hover:text-[#1a1817]"
        onClick={replay}
      >
        replay all
      </button>
      <button
        type="button"
        aria-pressed={slow}
        className={`font-mono text-[11px] leading-4 transition-colors hover:text-[#1a1817] ${
          slow ? "text-[#1a1817] underline" : "text-[#8a827b]"
        }`}
        onClick={toggleSlow}
      >
        ¼ speed
      </button>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d={dir === "right" ? "M6.5 3.5 12 9l-5.5 5.5" : "M11.5 3.5 6 9l5.5 5.5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The showcase deck: one full-viewport screen holding a card, arrow keys
// (or the chevrons) tab through one animation per slide, and the last
// slide is the whole group together. The loop restarts from the typing
// wave on every slide change.
function ShowcaseDeck({
  variants,
  onVariantChange,
}: {
  variants: Variant[];
  onVariantChange?: (v: Variant) => void;
}) {
  const [slide, setSlide] = useState(0);
  const total = variants.length + 1; // + the all-together finale
  const { vt, set } = useSharedClock();

  useEffect(() => {
    set(0);
    onVariantChange?.(variants[Math.min(slide, variants.length - 1)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide, set]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setSlide((s) => Math.min(total - 1, s + 1));
      if (e.key === "ArrowLeft") setSlide((s) => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const isFinale = slide === variants.length;
  const nav =
    "absolute top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full text-[#b5afaa] transition-colors hover:text-[#1a1817] disabled:opacity-0";

  return (
    <section className="flex h-screen w-full items-center justify-center">
      <div className="relative flex h-[76vh] w-[min(1100px,90%)] items-center justify-center rounded-[10px] border border-[#ebe9e8] bg-white">
        {isFinale ? (
          <div className="flex max-w-[900px] flex-wrap items-center justify-center gap-x-12 gap-y-10 px-16">
            {variants.map((v) => {
              const { frame } = cycleFrame(v, vt % cycleMs(v));
              return (
                <div key={v.key} className="flex flex-col items-center gap-3">
                  <Stage frame={frame} size={150} avatarSrc={v.avatar} />
                  <p className="text-center font-mono text-[11px] leading-4 text-[#8a827b]">
                    {v.num} {v.title}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <Stage
              frame={cycleFrame(variants[slide], vt % cycleMs(variants[slide])).frame}
              size={300}
              avatarSrc={variants[slide].avatar}
            />
            <p className="text-center font-mono text-[11px] leading-4 text-[#8a827b]">
              {variants[slide].num} {variants[slide].title}
            </p>
          </div>
        )}

        <button
          type="button"
          aria-label="Previous"
          className={`${nav} left-4`}
          disabled={slide === 0}
          onClick={() => setSlide((s) => Math.max(0, s - 1))}
        >
          <Chevron dir="left" />
        </button>
        <button
          type="button"
          aria-label="Next"
          className={`${nav} right-4`}
          disabled={slide === total - 1}
          onClick={() => setSlide((s) => Math.min(total - 1, s + 1))}
        >
          <Chevron dir="right" />
        </button>

        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-[6px]">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setSlide(i)}
              className={`size-[6px] rounded-full transition-colors ${
                i === slide ? "bg-[#1a1817]" : "bg-[#e0ddda] hover:bg-[#b5afaa]"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Every variant at 1:1 on one shared clock — the comparison wall. Cycle
// lengths differ, so after the first loop the morphs land at different
// moments and the grid stays lively. Tiles jump to their full study on the
// right tab.
function Library({ onOpen }: { onOpen: (v: Variant) => void }) {
  const { vt, set, slow, toggleSlow } = useSharedClock();
  return (
    <Card className="flex flex-col gap-4 px-6 py-6">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium leading-[18px] text-[#1a1817]">
          Library
          <span className="ml-2 font-normal text-[#8a827b]">
            every variant at 1:1 — click a tile for its full study
          </span>
        </p>
        <ClockControls slow={slow} toggleSlow={toggleSlow} replay={() => set(0)} />
      </div>
      {GROUPS.map(({ key, label }) => (
        <div key={key} className="flex flex-col gap-2">
          <p className={`font-mono text-[10px] leading-4 ${key === "archive" ? "text-[#b5afaa]" : "text-[#8a827b]"}`}>
            {label}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {VARIANTS.filter((v) => v.group === key).map((v) => {
              const { frame } = cycleFrame(v, vt % cycleMs(v));
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => onOpen(v)}
                  className={`flex flex-col items-center gap-2 rounded-[6px] border border-[#f0efee] px-2 pb-2 pt-4 transition-colors hover:border-[#d9d6d4] ${
                    key === "archive" ? "opacity-60 hover:opacity-100" : ""
                  }`}
                >
                  <Stage frame={frame} size={60} avatarSrc={v.avatar} />
                  <p className="text-center font-mono text-[10px] leading-4 text-[#8a827b]">
                    {v.num} {v.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </Card>
  );
}

/* --------------------------------- sections -------------------------------- */

const BUTTON =
  "flex h-8 items-center justify-center rounded-[6px] border border-[rgba(16,16,16,0.08)] bg-white px-3 text-xs leading-4 text-[#58524e] transition-colors hover:text-[#1a1817]";

const PHASE: Record<PhaseName, string> = {
  typing: "typing",
  morph: "morph",
  agent: "agent",
  reset: "reset",
};

const WAVE_CELLS = [0, 150, 300, 450, 600, 750, 900].map((t) => ({
  label: t === 900 ? "900ms" : `${String(t).padStart(3, "0")}ms`,
  t,
}));

const GROUPS: { key: "v1" | "v2" | "v3" | "demo" | "archive"; label: string; note?: string }[] = [
  { key: "v1", label: "v1 — shared arrival (spring + shudder + ring-down)" },
  {
    key: "demo",
    label: "tewt demo — host-tinted arrivals",
    note: "The v2 arrivals resolving into test-tewt: the dots take on the host pfp's blue mid-transition, and the disc lands on it before the face fades in.",
  },
  {
    key: "v2",
    label: "v2 — tailored arrivals",
    note: "Same travels as v1, but each profile arrival matches its morph's character: knockback, soft bloom, spin-in, beat bounce, swallow.",
  },
  {
    key: "v3",
    label: "v3 — at scale (toned down)",
    note: "The v2 principles at indoor volume for showing small and in crowds: excursions within ~8 units, no trails, overshoot under 3%, no rattle, faster landings.",
  },
  {
    key: "archive",
    label: "Archive",
    note: "Retired studies, kept for reference.",
  },
];

// The keyframe strip is static per variant — memo'd so the 60fps clock
// re-renders only the live stages, not ~16 SVGs per section per frame.
const Strip = memo(function Strip({ variant }: { variant: Variant }) {
  const strip = useMemo(
    () => [
      ...WAVE_CELLS.map(({ label, t }) => ({ label, frame: typingFrame(t) })),
      ...variant.stripMorph.map(({ label, t }) => ({ label, frame: variant.morph(t) })),
    ],
    [variant],
  );
  return (
    <Card className="flex flex-col gap-3 px-6 py-6">
      <p className="text-xs font-medium leading-[18px] text-[#1a1817]">
        Keyframes
        <span className="ml-2 font-normal text-[#8a827b]">
          re-rendered from the live tracks — one wave loop, then the morph
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {strip.map(({ label, frame: f }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="rounded-[4px] border border-[#f0efee]">
              <Stage frame={f} size={56} avatarSrc={variant.avatar} />
            </div>
            <p className="font-mono text-[10px] leading-4 text-[#8a827b]">{label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
});

function VariantSection({ variant }: { variant: Variant }) {
  const { frame, phase, slow, toggleSlow, replay, skipToMorph } = useCycle(variant);

  return (
    <section id={`v-${variant.key}`} className="flex scroll-mt-6 flex-col gap-4">
      <div className="flex flex-col gap-1 pt-2">
        <h2 className="text-sm font-medium leading-5 text-[#1a1817]">
          <span className="mr-2 font-mono text-[11px] text-[#8a827b]">{variant.num}</span>
          {variant.title}
        </h2>
        <p className="max-w-[560px] text-xs leading-[18px] text-[#58524e]">{variant.blurb}</p>
      </div>

      <Card className="flex flex-col items-center gap-6 px-6 py-14">
        <Stage frame={frame} size={240} avatarSrc={variant.avatar} />
        <div className="flex items-center gap-2">
          <button type="button" className={BUTTON} onClick={replay}>
            Replay
          </button>
          <button type="button" className={BUTTON} onClick={skipToMorph}>
            Skip to morph
          </button>
          <button
            type="button"
            className={BUTTON}
            aria-pressed={slow}
            style={slow ? { background: "#1a1817", color: "#fff", borderColor: "#1a1817" } : undefined}
            onClick={toggleSlow}
          >
            ¼ speed
          </button>
          <span className="w-14 text-right font-mono text-[11px] leading-4 text-[#8a827b]">
            {PHASE[phase]}
          </span>
        </div>
      </Card>

      <div className="flex gap-4">
        <Card className="flex flex-1 flex-col items-center gap-3 px-6 py-8">
          <Stage frame={frame} size={60} avatarSrc={variant.avatar} />
          <p className="font-mono text-[11px] leading-4 text-[#8a827b]">1:1 — 60px frame</p>
        </Card>
        <Card className="flex flex-1 flex-col items-center gap-3 px-6 py-8">
          <Stage frame={frame} size={120} avatarSrc={variant.avatar} />
          <p className="font-mono text-[11px] leading-4 text-[#8a827b]">2× — review size</p>
        </Card>
      </div>

      <Strip variant={variant} />
    </section>
  );
}

const TABS = [
  ["v3", "v3"],
  ["demo", "Tewt"],
  ["v2", "v2"],
  ["v1", "v1"],
  ["archive", "Archive"],
  ["library", "Library"],
] as const;

type Tab = (typeof TABS)[number][0];

export default function AgentTypingExperience() {
  const [tab, setTab] = useState<Tab>("v3");
  const [inProduct, setInProduct] = useState(false);
  const [deckVariant, setDeckVariant] = useState<Variant | null>(null);

  // A library tile opens its variant's group tab and scrolls to the study
  // once that tab's sections have mounted.
  const openVariant = (v: Variant) => {
    setTab(v.group);
    requestAnimationFrame(() => {
      document.getElementById(`v-${v.key}`)?.scrollIntoView({ block: "start" });
    });
  };

  const isGroupTab = tab !== "library";
  const panelOpen = inProduct && isGroupTab;

  return (
    <main
      className="min-h-screen bg-[#fafaf9] pb-20"
      style={panelOpen ? { paddingRight: PANEL_W } : undefined}
    >
      {/* Same floating switcher as the home directory, riding over the
          showcase as a fixed overlay. */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center gap-2 pt-6"
        style={panelOpen ? { paddingRight: PANEL_W } : undefined}
      >
        <div className="pointer-events-auto inline-flex items-center gap-[2px] rounded-full bg-white/85 p-[3px] shadow-[0px_0px_0px_1px_rgba(81,76,71,0.12),0px_8px_8px_-4px_rgba(22,25,29,0.03),0px_20px_24px_-4px_rgba(22,25,29,0.08)] backdrop-blur-[20px]">
          {TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value);
                window.scrollTo({ top: 0 });
              }}
              aria-pressed={tab === value}
              className={`rounded-full px-[14px] py-[6px] text-[12px] leading-[16px] transition-colors ${
                tab === value
                  ? "bg-[#1a1817] text-white"
                  : "text-[#58524e] hover:text-[#1a1817]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {isGroupTab && (
          <div className="pointer-events-auto inline-flex items-center rounded-full bg-white/85 p-[3px] shadow-[0px_0px_0px_1px_rgba(81,76,71,0.12),0px_8px_8px_-4px_rgba(22,25,29,0.03),0px_20px_24px_-4px_rgba(22,25,29,0.08)] backdrop-blur-[20px]">
            <button
              type="button"
              aria-pressed={inProduct}
              onClick={() => setInProduct((p) => !p)}
              className={`rounded-full px-[14px] py-[6px] text-[12px] leading-[16px] transition-colors ${
                inProduct
                  ? "bg-[#1a1817] text-white"
                  : "text-[#58524e] hover:text-[#1a1817]"
              }`}
            >
              In product
            </button>
          </div>
        )}
      </div>

      {panelOpen && <ProductPanel variant={deckVariant ?? undefined} />}

      {tab === "library" ? (
        <div className="mx-auto flex w-full max-w-[932px] flex-col gap-6 px-8 pt-24">
          <header className="flex flex-col gap-1">
            <h1 className="text-sm font-medium leading-5 text-[#1a1817]">
              Agent typing experience
            </h1>
            <p className="max-w-[560px] text-xs leading-[18px] text-[#58524e]">
              Every take at 1:1 on one clock. Click a tile to open its full
              study.
            </p>
          </header>
          <Library onOpen={openVariant} />
        </div>
      ) : (
        <>
          <ShowcaseDeck
            key={tab}
            variants={VARIANTS.filter((v) => v.group === tab)}
            onVariantChange={setDeckVariant}
          />
          <div className="mx-auto flex w-full max-w-[932px] flex-col gap-6 px-8 pt-10">
            {VARIANTS.filter((v) => v.group === tab).map((v) => (
              <VariantSection key={v.key} variant={v} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
