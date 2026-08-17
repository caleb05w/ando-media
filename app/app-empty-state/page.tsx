"use client";

// /app-empty-state — recreation of the Apps empty state from August Sprints
// (Figma 535-9744), with the storyboarded icon carousel (539-9880) running
// live: five connectable apps take turns popping up through the slot,
// hanging in the air on a shared tilt, then tipping over and falling back
// behind the fade — tip first, then drop, like a real object going over an
// edge.
//
// The motion is a DialKit Timeline: each keyframe segment is its own clip
// row in the dock (arc / tip), so bars can be dragged,
// resized, scrubbed, and their endpoint values + curves edited visually.
// The tile just binds the composed clip values every frame. One timeline
// pass = one app's slot; the icon swaps on each loop wrap.
//
// The arc's legs chain (each leg starts where the last ended), so y has
// no duplicated endpoints. Keep tip's start aligned with the arc's fall
// leg by eye — they're separate rows on purpose so the topple can lead
// the drop.

import { useEffect, useRef, useState } from "react";
import { useDialTimeline, DialTimeline } from "dialkit";
import "./app-empty-state.css";

const FG_PRIMARY = "#1a1817";
const FG_TERTIARY = "#928c88";
const CARD_BORDER = "#ebe9e8";
const BUTTON_BORDER = "rgba(16, 16, 16, 0.08)";

// The rotation — order is the order they fly in. All full-bleed app-icon
// tiles (bg baked into the asset).
const APPS = [
  { key: "github", name: "GitHub", src: "/images/github-logo.png" },
  { key: "linear", name: "Linear", src: "/images/linear-logo.png" },
  { key: "sentry", name: "Sentry", src: "/images/sentry-logo.png" },
  { key: "notion", name: "Notion", src: "/images/notion-logo.png" },
  { key: "granola", name: "Granola", src: "/images/granola-logo.png" },
];

// IconPlusMedium stand-in — the Figma asset URL expires, so the glyph is
// drawn inline: 16 grid, 1.5 stroke, inset 18.75% (3px) like the original.
function IconPlus({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 3.5V12.5M3.5 8H12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AppEmptyState() {
  // OFFICIAL tuned values — DialKit dock 2026-08-12 (Copy → defaults).
  // One slot of the carousel: 0.2s beat, then rise 0.6s (ease-out)
  // straight into fall 0.5s (accelerating gravity) — the ease-out's slow
  // finish against the gravity curve's slow start reads as the hang.
  // Meanwhile tip sweeps one long −50° → +76° roll (0.36–1.33s) whose
  // curve accelerates again near the end, so the spin picks up as it
  // drops.
  //
  // TODO(production): DialKit's clip.current values are the scrubbable authoring preview.
  // Replace them with equivalent real Motion animations using the tuned timeline
  // timings and transitions, then remove useDialTimeline and <DialTimeline />.
  const tl = useDialTimeline(
    "App empty state",
    {
      // 0.4s past the fall = breathing room before the next app launches
      duration: 1.6,
      // The vertical arc, one clip in three legs. Legs chain, so no
      // duplicated endpoints — drag a boundary in the dock to retime.
      arc: {
        at: 0.2,
        from: { y: 54 },
        steps: [
          {
            duration: 0.6,
            to: { y: -9 },
            transition: { type: "easing", duration: 0.6, ease: [0, 0, 0.58, 1] },
          },
          {
            duration: 0.5,
            to: { y: 60 },
            transition: { type: "easing", duration: 0.5, ease: [0.55, 0, 1, 0.45] },
          },
        ],
      },
      // one continuous roll across the whole flight
      tip: {
        at: 0.36,
        duration: 0.97,
        from: { rotate: -50 },
        to: { rotate: 76 },
        transition: {
          type: "easing",
          duration: 0.97,
          ease: [0, 0.42, 0.91, 0.39],
        },
      },
    },
    // id is versioned: bump it whenever the clip/leg structure changes,
    // because persisted dock edits are keyed by leg index and stale
    // values from an old structure silently override the new defaults.
    { id: "app-empty-state-v2", persist: true, loop: true },
  );

  // The arc clip owns y outright; tip owns rotate (before it starts,
  // `current` holds its `from` — the entry tilt).
  const y = tl.arc.current.y;
  const rotate = tl.tip.current.rotate;

  // Advance to the next app each time the playhead wraps.
  const [appIndex, setAppIndex] = useState(0);
  const prevTime = useRef(0);
  useEffect(() => {
    if (tl.playing && tl.time < prevTime.current - 0.5) {
      setAppIndex((i) => (i + 1) % APPS.length);
    }
    prevTime.current = tl.time;
  }, [tl.time, tl.playing]);

  const app = APPS[appIndex];

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafaf9] p-8">
      <div
        className="flex w-full max-w-[932px] flex-col items-center justify-center gap-[10px] rounded-[6px] border bg-white px-6 py-32"
        style={{ borderColor: CARD_BORDER }}
      >
        {/* The slot: clipped stage the tile pops through, with the white
            fog along its bottom edge it emerges from and sinks back into. */}
        <div className="aes-stage">
          <div
            className="aes-app"
            style={{ transform: `translateY(${y}px) rotate(${rotate}deg)` }}
          >
            <div className="aes-tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={app.src} alt={app.name} />
            </div>
          </div>
          <div className="aes-fade" />
        </div>

        <div className="flex max-w-[420px] flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1 text-center">
            <p
              className="text-sm font-medium leading-5"
              style={{ color: FG_PRIMARY }}
            >
              No apps connected yet
            </p>
            <p
              className="text-xs leading-[18px]"
              style={{ color: FG_PRIMARY }}
            >
              Add apps to supercharge your agent&rsquo;s capabilities.
            </p>
          </div>
          <button
            type="button"
            className="flex h-8 items-center justify-center gap-0.5 rounded-[6px] border bg-white px-1.5"
            style={{ borderColor: BUTTON_BORDER, color: FG_TERTIARY }}
          >
            <IconPlus />
            <span className="px-1 text-xs leading-4">Add Apps</span>
          </button>
        </div>
      </div>
      <DialTimeline />
    </main>
  );
}
