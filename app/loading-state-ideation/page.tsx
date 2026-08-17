"use client";

// /loading-state-ideation — the comparison board for rethinking how Ando
// says "working". Left column is always the SHIPPED loading state, ported
// exactly from the design system; right column is the proposed counterpart
// at the same size and speed, so every idea is judged against an honest
// baseline. Empty slots are open briefs.
//
//   Spinner  — ando/packages/ui/src/components/spinner. A <span> with
//     .ando-spinner (1s linear infinite rotate) wrapping the
//     IconLoadingCircle glyph: a 30%-opacity track ring plus a
//     quarter-arc head, 1.5 stroke, on a 24 grid. Ships at 12/16/20/24.
//     Reduced motion doesn't stop it — it slows to 8s.
//   Skeleton — the other half of the story: a pulsing block that stands
//     in for content whose shape is already known.
//
// First proposal in the right column: the Blend burst, measured off the
// reference capture in ~/Desktop/:animation-test — a six-ray sparkle
// that spins in eased bursts and rests between them, instead of an arc
// grinding round a track forever.

import { Fragment } from "react";
import "./loading-state-ideation.css";

const FG_PRIMARY = "#1a1817";
const FG_SECONDARY = "#58524e";
const FG_TERTIARY = "#78716c";
const STROKE_WEAK = "#f0efee";
const BG_TERTIARY = "#f5f5f4";

// Sampled straight from the JiggleUI video frames, not eyeballed: the
// page ground, the pill's text ink, and the dot grey.
const JIGGLE_GROUND = "#f3f3f3";
const JIGGLE_TEXT = "#242424";
const JIGGLE_DOTS = "#8e8e8e";

// IconLoadingCircle, verbatim from the icon registry
// (round-outlined-radius-1-stroke-1.5). Track ring at 0.3 opacity, then
// the quarter arc that reads as the head.
function IconLoadingCircle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21.25 12C21.25 17.1086 17.1086 21.25 12 21.25C6.89137 21.25 2.75 17.1086 2.75 12C2.75 6.89137 6.89137 2.75 12 2.75C17.1086 2.75 21.25 6.89137 21.25 12Z"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1.5"
      />
      <path
        d="M21.25 12C21.25 17.1086 17.1086 21.25 12 21.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// The Spinner component itself — same markup and a11y contract as the
// shipped one (role=status, aria-label, data-slot).
function Spinner({ label = "Loading", size = 16 }: { label?: string; size?: number }) {
  return (
    <span className="ando-spinner" data-slot="spinner" role="status" aria-label={label}>
      <IconLoadingCircle size={size} />
    </span>
  );
}

// The Blend burst. Same contract as Spinner: sized in px, colored by
// currentColor, role=status. The field is 1em square; the six-ray fan
// and the burst-and-rest spin live in the stylesheet.
function Burst({ label = "Loading", size = 16 }: { label?: string; size?: number }) {
  return (
    <span
      className="jburst"
      role="status"
      aria-label={label}
      style={{ fontSize: size }}
    >
      <i />
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

// The pill exactly as it appears in the recording: white on the video's
// grey ground, text ink and dot grey sampled from its frames.
function PreparingPill() {
  return (
    <span
      className="flex items-center gap-3 rounded-full bg-white py-3 pl-[18px] pr-4"
      style={{ boxShadow: "0px 2px 10px rgba(0,0,0,0.06), 0px 0px 0.5px 0.5px rgba(0,0,0,0.03)" }}
    >
      <span className="text-[14px] leading-5" style={{ color: JIGGLE_TEXT }}>
        Preparing questions...
      </span>
      <span style={{ color: JIGGLE_DOTS }}>
        <Burst size={16} label="Preparing questions" />
      </span>
    </span>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[13px] font-medium leading-5" style={{ color: FG_PRIMARY }}>
          {title}
        </h2>
        {note ? (
          <p className="text-[13px] leading-5" style={{ color: FG_TERTIARY }}>
            {note}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

// A labelled specimen tile — the loader on its own ground so size and
// weight read cleanly.
function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex h-20 w-full items-center justify-center rounded-[10px]"
        style={{ background: BG_TERTIARY, color: FG_PRIMARY }}
      >
        {children}
      </div>
      <span className="font-mono text-[11px] leading-4" style={{ color: FG_TERTIARY }}>
        {label}
      </span>
    </div>
  );
}

// An open brief: the right-hand slot before it has an occupant.
function EmptySlot() {
  return (
    <div
      className="flex h-full min-h-16 items-center justify-center rounded-[10px] border-[0.5px] border-dashed"
      style={{ borderColor: "#e7e5e4" }}
    >
      <span className="text-[13px] leading-5" style={{ color: "#a8a29e" }}>
        Nothing yet
      </span>
    </div>
  );
}

// The comparison scaffold: shipped on the left, proposed on the right,
// row by row so each pair shares a baseline and a height. A null right
// cell renders as an open brief.
function CompareGrid({ rows }: { rows: [React.ReactNode, React.ReactNode | null][] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      <span className="font-mono text-[11px] uppercase leading-4" style={{ color: FG_TERTIARY }}>
        Shipped
      </span>
      <span className="font-mono text-[11px] uppercase leading-4" style={{ color: FG_TERTIARY }}>
        Proposed
      </span>
      {rows.map(([left, right], i) => (
        <Fragment key={i}>
          <div className="min-w-0">{left}</div>
          <div className="min-w-0">{right ?? <EmptySlot />}</div>
        </Fragment>
      ))}
    </div>
  );
}

export default function LoadingStateIdeationPage() {
  return (
    <div className="flex flex-1 justify-center bg-white">
      <main className="w-full max-w-4xl px-6 pb-24 pt-14">
        <header className="flex flex-col gap-2 pb-10">
          <h1 className="text-[20px] font-medium leading-7" style={{ color: FG_PRIMARY }}>
            Loading state ideation
          </h1>
          <p className="text-[14px] leading-5" style={{ color: FG_SECONDARY }}>
            Shipped on the left, proposals on the right — every idea judged at the same
            size and speed as the thing it wants to replace.
          </p>
        </header>

        <div className="flex flex-col gap-14">
          <Section
            title="Spinner"
            note="Left: packages/ui — a rotating quarter-arc over a dimmed track ring, always moving. Right: the Blend burst from the reference capture — a pulse wave travels through the rays, a beat, one long eased turn, then genuine stillness until the next breath."
          >
            <CompareGrid
              rows={[
                [
                  <div key="l" className="grid grid-cols-4 gap-3">
                    <Tile label="12">
                      <Spinner size={12} />
                    </Tile>
                    <Tile label="16">
                      <Spinner size={16} />
                    </Tile>
                    <Tile label="20">
                      <Spinner size={20} />
                    </Tile>
                    <Tile label="24">
                      <Spinner size={24} />
                    </Tile>
                  </div>,
                  <div key="r" className="grid grid-cols-4 gap-3">
                    <Tile label="12">
                      <Burst size={12} />
                    </Tile>
                    <Tile label="16">
                      <Burst size={16} />
                    </Tile>
                    <Tile label="20">
                      <Burst size={20} />
                    </Tile>
                    <Tile label="24">
                      <Burst size={24} />
                    </Tile>
                  </div>,
                ],
              ]}
            />
          </Section>

          <Section
            title="In context"
            note="Where a loader actually shows up. The pill on the right is the recording's specimen verbatim — ground, ink, and dot grey sampled from its frames."
          >
            <CompareGrid
              rows={[
                [
                  <div
                    key="l"
                    className="flex h-full items-center gap-2 rounded-[10px] border-[0.5px] px-4 py-3.5"
                    style={{ borderColor: STROKE_WEAK }}
                  >
                    <span style={{ color: FG_TERTIARY }}>
                      <Spinner size={16} />
                    </span>
                    <span className="text-[14px] leading-5" style={{ color: FG_SECONDARY }}>
                      Loading conversation…
                    </span>
                  </div>,
                  <div
                    key="r"
                    className="flex h-full items-center justify-center rounded-[10px] px-4 py-3.5"
                    style={{ background: JIGGLE_GROUND }}
                  >
                    <PreparingPill />
                  </div>,
                ],
                [
                  <div
                    key="l"
                    className="flex h-full items-center gap-3 rounded-[10px] border-[0.5px] px-4 py-3.5"
                    style={{ borderColor: STROKE_WEAK }}
                  >
                    <span
                      className="flex items-center gap-2 rounded-[8px] px-3 py-1.5 text-[13px] leading-5 text-white"
                      style={{ background: FG_PRIMARY }}
                    >
                      <Spinner size={12} label="Saving" />
                      Saving
                    </span>
                    <span
                      className="flex items-center gap-2 rounded-[8px] border-[0.5px] px-3 py-1.5 text-[13px] leading-5"
                      style={{ borderColor: STROKE_WEAK, color: FG_SECONDARY }}
                    >
                      <Spinner size={12} />
                      Send
                    </span>
                  </div>,
                  null,
                ],
                [
                  <div
                    key="l"
                    className="flex h-40 items-center justify-center rounded-[10px] border-[0.5px]"
                    style={{ borderColor: STROKE_WEAK, color: FG_TERTIARY }}
                  >
                    <Spinner size={20} />
                  </div>,
                  null,
                ],
              ]}
            />
          </Section>

          <Section
            title="Skeleton"
            note="The other shipped answer: when the shape of what's coming is already known, Ando holds the space instead of spinning."
          >
            <CompareGrid
              rows={[
                [
                  <div
                    key="l"
                    className="flex flex-col gap-3 rounded-[10px] border-[0.5px] px-4 py-3.5"
                    style={{ borderColor: STROKE_WEAK }}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="size-8 animate-pulse rounded-full bg-[#f5f5f4]" />
                      <span className="flex flex-col gap-1.5">
                        <span className="block h-3 w-24 animate-pulse rounded-[4px] bg-[#f5f5f4]" />
                        <span className="block h-3 w-40 animate-pulse rounded-[4px] bg-[#f5f5f4]" />
                      </span>
                    </span>
                    <span className="block h-3 w-full animate-pulse rounded-[4px] bg-[#f5f5f4]" />
                    <span className="block h-3 w-2/3 animate-pulse rounded-[4px] bg-[#f5f5f4]" />
                  </div>,
                  null,
                ],
              ]}
            />
          </Section>

          <Section title="The spec" note="What any replacement is measured against.">
            <dl
              className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-[10px] px-4 py-3.5 text-[13px] leading-5"
              style={{ background: BG_TERTIARY }}
            >
              {[
                ["Motion", "rotate 360°, 1s, linear, infinite"],
                ["Reduced motion", "slows to 8s — never stops"],
                ["Geometry", "24 grid, 1.5 stroke, round cap on the head"],
                ["Track", "same ring at 0.3 opacity"],
                ["Head", "quarter arc, 3 o'clock → 6 o'clock"],
                ["Color", "currentColor — inherits its context"],
                ["Sizes", "12 · 16 · 20 · 24"],
              ].map(([term, value]) => (
                <div key={term} className="contents">
                  <dt style={{ color: FG_TERTIARY }}>{term}</dt>
                  <dd className="font-mono text-[12px]" style={{ color: FG_SECONDARY }}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section
            title="Burst spec"
            note="Measured off the reference capture (240fps CleanShot) with the keyframe-extraction tool, so the replica is accountable to something."
          >
            <dl
              className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-[10px] px-4 py-3.5 text-[13px] leading-5"
              style={{ background: BG_TERTIARY }}
            >
              {[
                ["Anatomy", "6 identical rays, even 60° fan; dash 0.27 × field, radius 0.23 → 0.50"],
                ["Motif", "pop wave in-and-out → beat → 240° turn at full extension → rest; every 3426ms"],
                ["Pop", "400ms ease-out dive to 0.72× radius, ~330ms release, no hold; staggered 70ms per spoke"],
                ["Spin", "≈240° in ~1.5s — fast middle, long settling tail, zero overshoot (peak = final)"],
                ["Easing", "pop (0.55, 0.77, 0, 0.44) · release (0.64, 0.31, 0.01, 0.59) · spin (0.55, 0.5, 0.04, 0.6)"],
                ["Audit", "all three curves least-squares fitted to per-frame samples; residuals ≤ 0.04"],
                ["Cycle", "240° lands congruent on the 60° fan, so every loop closes seamlessly"],
                ["Reduced motion", "slows to 27s — never stops"],
                ["Color", "currentColor; white on #fe3e00 in the capture"],
              ].map(([term, value]) => (
                <div key={term} className="contents">
                  <dt style={{ color: FG_TERTIARY }}>{term}</dt>
                  <dd className="font-mono text-[12px]" style={{ color: FG_SECONDARY }}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>
      </main>
    </div>
  );
}
