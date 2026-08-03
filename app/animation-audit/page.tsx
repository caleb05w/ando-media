"use client";

// /animation-audit — every animation in the Ando repo, on one page.
//
// The point is partitioning: most motion should be ambient system motion that
// nobody notices, backed by tokens, and a much smaller set should be deliberate
// animations for moments worth noticing. Today there is no such split, so this
// page shows what exists, at what timing, applied to how many things.
//
// Nothing here is hand-written: the cards, the timings, and the counts all come
// from inventory.ts, which scripts/build-animation-audit.mjs extracts from the
// Ando repo. The squares play the real @keyframes, copied verbatim into
// generated-animations.css. Refresh both with `npm run audit:animations`.

import { useEffect, useMemo, useState } from "react";
import "./generated-animations.css";
import {
  ANIMATIONS,
  ORPHANS,
  STATS,
  type AnimationEntry,
} from "./inventory";

const FG = "#1a1817";

/** How often every non-looping demo restarts, in ms. Long enough for the
 *  slowest one-shot (a 2s highlight fade) to finish and be seen at rest. */
const CYCLE_MS = 3200;

/* --------------------------------- bits ---------------------------------- */

function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warn" | "bad";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-[#efeeec] text-[#58524e]",
    good: "bg-[#e7f4ec] text-[#146c3a]",
    warn: "bg-[#fdf0e3] text-[#9a4a06]",
    bad: "bg-[#fdeaea] text-[#a51b1b]",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-[7px] py-[2px] font-mono text-[10px] leading-[14px] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function Stat({
  value,
  label,
  detail,
  tone = "neutral",
}: {
  value: React.ReactNode;
  label: string;
  detail?: string;
  tone?: "neutral" | "warn" | "bad";
}) {
  const color =
    tone === "bad" ? "#a51b1b" : tone === "warn" ? "#9a4a06" : FG;
  return (
    <div className="rounded-[10px] bg-[#f5f5f4] p-[14px]">
      <p
        className="font-mono text-[22px] leading-[26px] tracking-[-0.02em]"
        style={{ color }}
      >
        {value}
      </p>
      <p className="mt-[4px] text-[12px] leading-[16px] font-medium text-[#1a1817]">
        {label}
      </p>
      {detail ? (
        <p className="mt-[2px] text-[11px] leading-[15px] text-[#8a827b]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function SpecRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-[10px] py-[3px]">
      <span className="w-[86px] shrink-0 text-[11px] leading-[15px] text-[#8a827b]">
        {label}
      </span>
      <span className="min-w-0 flex-1 font-mono text-[11px] leading-[15px] break-words text-[#1a1817]">
        {children}
      </span>
    </div>
  );
}

/* ------------------------------- the square ------------------------------- */

/** Plays one animation on a square, using the timing its real consumers use. */
function Stage({ entry, cycle }: { entry: AnimationEntry; cycle: number }) {
  const props = entry.properties;
  // Background-position animations (shimmer, sheen) only read against a
  // gradient; a flat fill would look completely static.
  const needsGradient =
    props.includes("background-position") || props.includes("background-image");
  const isLoop = entry.trigger === "loop";

  const style: React.CSSProperties = {
    animationName: entry.css,
    // The resolved value, so the demo plays even where the source reads a
    // token. Whether it came from a token is shown in the spec below.
    animationDuration: entry.duration ?? "300ms",
    animationTimingFunction:
      entry.easingKind === "unset" ? "ease" : (entry.easingRaw ?? entry.easing),
    animationDelay: entry.delay ?? "0s",
    animationIterationCount: entry.iteration ?? 1,
    animationFillMode: entry.fill ?? "both",
    background: needsGradient
      ? "linear-gradient(100deg,#e7e5e4 30%,#fafaf9 50%,#e7e5e4 70%)"
      : "#d6d3d1",
    backgroundSize: needsGradient ? "220% 100%" : undefined,
  };

  return (
    <div className="aa-stage flex h-[104px] items-center justify-center overflow-hidden rounded-[8px] bg-white">
      <div
        // Looping animations run continuously; everything else restarts on the
        // shared cycle, so any two cards can be compared beat for beat.
        key={isLoop ? "loop" : cycle}
        className="size-[52px] rounded-[8px]"
        style={style}
      />
    </div>
  );
}

/* -------------------------------- the card -------------------------------- */

function AnimationCard({
  entry,
  cycle,
}: {
  entry: AnimationEntry;
  cycle: number;
}) {
  const [manual, setManual] = useState(0);

  const freqTone =
    entry.frequency === "pervasive" || entry.frequency === "common"
      ? "neutral"
      : "neutral";

  return (
    <li className="flex flex-col rounded-[10px] bg-[#f5f5f4] p-[14px]">
      <button
        type="button"
        onClick={() => setManual((n) => n + 1)}
        className="cursor-pointer text-left"
        title="Replay"
      >
        <Stage entry={entry} cycle={cycle + manual} />
      </button>

      <div className="mt-[12px] flex items-start justify-between gap-[8px]">
        <p className="min-w-0 font-mono text-[12px] leading-[16px] font-medium break-all text-[#1a1817]">
          {entry.name}
        </p>
        <Badge>{entry.trigger}</Badge>
      </div>

      <div className="mt-[10px] border-t border-[#e7e5e4] pt-[8px]">
        <SpecRow label="Applied to">
          {entry.surface}
          <span className="text-[#8a827b]">
            {" · "}
            {entry.consumerCount} rule{entry.consumerCount === 1 ? "" : "s"}
          </span>
        </SpecRow>
        <SpecRow label="Frequency">
          {entry.callSites} call site{entry.callSites === 1 ? "" : "s"}{" "}
          <Badge tone={freqTone}>{entry.frequency}</Badge>
        </SpecRow>
        <SpecRow label="Timing">
          {entry.duration}
          {entry.durationKind === "token" ? (
            <>
              {" "}
              <Badge tone="good">token</Badge>
            </>
          ) : (
            <>
              {" "}
              <Badge tone="warn">hard-coded</Badge>
            </>
          )}
        </SpecRow>
        <SpecRow label="Easing">
          {entry.easing}
          {entry.easingKind === "token" ? (
            <>
              {" "}
              <Badge tone="good">token</Badge>
            </>
          ) : entry.easingKind === "app-local" ? (
            <>
              {" "}
              <Badge tone="warn">{entry.easingRaw}</Badge>
            </>
          ) : null}
        </SpecRow>
        <SpecRow label="Custom curve">
          {entry.customBezier ? (
            <>
              yes{" "}
              <Badge tone="warn">
                {entry.easingKind === "app-local"
                  ? "app-local curve"
                  : "bespoke bezier"}
              </Badge>
            </>
          ) : (
            <span className="text-[#58524e]">no — {entry.easing}</span>
          )}
        </SpecRow>
        <SpecRow label="Delay">
          {entry.delay ? (
            entry.delayKind === "computed" ? (
              <>
                {entry.delay.replace(/\s+/g, " ")}{" "}
                <Badge>staggered</Badge>
              </>
            ) : (
              entry.delay
            )
          ) : (
            <span className="text-[#8a827b]">none</span>
          )}
        </SpecRow>
        <SpecRow label="Animates">{entry.properties.join(", ")}</SpecRow>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-[4px] pt-[10px]">
        {!entry.reducedMotion ? (
          <Badge tone="bad">no reduced-motion</Badge>
        ) : null}
        {entry.brokenRefs.length ? (
          <Badge tone="bad">broken var</Badge>
        ) : null}
        {entry.variants.length > 1 ? (
          <Badge tone="warn">{entry.variants.length} timings</Badge>
        ) : null}
        {entry.properties.some((p) =>
          ["height", "width", "top", "left", "margin"].some((l) =>
            p.startsWith(l),
          ),
        ) ? (
          <Badge tone="warn">animates layout</Badge>
        ) : null}
      </div>

      <p className="mt-[8px] font-mono text-[10px] leading-[14px] break-all text-[#a8a29e]">
        {entry.file}:{entry.line}
      </p>
    </li>
  );
}

/* --------------------------------- page ----------------------------------- */

type GroupBy = "surface" | "trigger" | "frequency" | "duration";

const GROUPS: [GroupBy, string][] = [
  ["surface", "Surface"],
  ["trigger", "Trigger"],
  ["frequency", "Frequency"],
  ["duration", "Duration"],
];

function groupKey(entry: AnimationEntry, by: GroupBy): string {
  if (by === "surface") return entry.surface;
  if (by === "trigger") return entry.trigger;
  if (by === "frequency") return entry.frequency;
  const ms = entry.durationMs;
  if (ms == null) return "unknown";
  if (ms <= 150) return "≤ 150ms — micro";
  if (ms <= 300) return "151–300ms — standard";
  if (ms <= 800) return "301–800ms — expressive";
  return "> 800ms — ambient / loop";
}

export default function AnimationAuditPage() {
  const [cycle, setCycle] = useState(0);
  const [by, setBy] = useState<GroupBy>("surface");

  useEffect(() => {
    const id = setInterval(() => setCycle((n) => n + 1), CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, AnimationEntry[]>();
    for (const entry of ANIMATIONS) {
      const k = groupKey(entry, by);
      const list = map.get(k);
      if (list) list.push(entry);
      else map.set(k, [entry]);
    }
    for (const list of map.values())
      list.sort((a, b) => b.callSites - a.callSites);
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [by]);

  const topDurations = Object.entries(STATS.ambient.durations)
    .filter(([k]) => /^\d+$/.test(k))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const topBeziers = Object.entries(STATS.beziers).slice(0, 6);
  const transitions = Object.entries(STATS.ambient.transitions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="flex flex-1 justify-center bg-white">
      <main className="w-full max-w-[1180px] px-6 pb-24">
        {/* ------------------------------ header ------------------------------ */}
        <header className="pt-12">
          <h1 className="text-[24px] leading-[30px] font-medium tracking-[-0.02em] text-[#1a1817]">
            Animation audit
          </h1>
          <p className="mt-[8px] max-w-[62ch] text-[14px] leading-[21px] text-[#58524e]">
            Every animation in the Ando repo, playing at the timing its real
            consumers use. Extracted from {STATS.scannedFiles.toLocaleString()}{" "}
            files — nothing on this page is hand-written, so it can be
            regenerated instead of maintained.
          </p>
          <p className="mt-[10px] max-w-[62ch] text-[13px] leading-[20px] text-[#8a827b]">
            The goal is a partition: broad ambient motion that runs on tokens and
            nobody notices, plus a small deliberate library for moments worth
            noticing. What follows is the starting position.
          </p>
        </header>

        {/* ------------------------------ stats ------------------------------ */}
        <section className="mt-[28px] grid grid-cols-2 gap-[10px] md:grid-cols-4">
          <Stat
            value={STATS.live}
            label="Live animations"
            detail={`${STATS.totalKeyframes} defined`}
          />
          <Stat
            value={`${STATS.tokenBackedDuration}/${STATS.live}`}
            label="Token durations"
            detail="rest are hard-coded"
            tone="warn"
          />
          <Stat
            value={`${STATS.tokenBackedEasing}/${STATS.live}`}
            label="Token easings"
            detail="the system is not load-bearing"
            tone="bad"
          />
          <Stat
            value={`${STATS.appLocalEasing}/${STATS.live}`}
            label="App-local easings"
            detail="--ease-fast, not a token"
            tone="warn"
          />
          <Stat
            value={STATS.distinctDurations}
            label="Distinct durations"
            detail={`${STATS.distinctDurationSpellings} spellings, 3 tokens`}
            tone="warn"
          />
          <Stat
            value={STATS.distinctBeziers}
            label="Distinct curves"
            detail="2 easing tokens exist"
            tone="warn"
          />
          <Stat
            value={`${STATS.reducedMotionCovered}/${STATS.live}`}
            label="Reduced motion"
            detail={`${STATS.live - STATS.reducedMotionCovered} unhandled`}
            tone="bad"
          />
          <Stat
            value={STATS.orphans}
            label="Dead keyframes"
            detail="defined, never used"
            tone="bad"
          />
        </section>

        {/* ----------------------------- findings ---------------------------- */}
        <section className="mt-[28px] rounded-[10px] border border-[#f0e4d8] bg-[#fefaf6] p-[16px]">
          <h2 className="text-[13px] leading-[18px] font-medium text-[#1a1817]">
            What the extraction turned up
          </h2>
          <ul className="mt-[10px] flex flex-col gap-[8px] text-[13px] leading-[19px] text-[#58524e]">
            <li>
              <span className="font-medium text-[#a51b1b]">
                One animation never runs.
              </span>{" "}
              <code className="font-mono text-[12px]">
                ando-ui-pulse
              </code>{" "}
              is played with{" "}
              <code className="font-mono text-[12px]">
                var(--motion-duration-slow)
              </code>
              , which is not defined anywhere. An invalid duration invalidates
              the whole shorthand, so the flyout loading indicator sits still.
              Three Kanso transitions have the same problem with{" "}
              <code className="font-mono text-[12px]">
                --motion-duration-medium
              </code>
              .
            </li>
            <li>
              <span className="font-medium text-[#1a1817]">
                The token ladder and reality disagree.
              </span>{" "}
              Tokens define 120 / 180 / 300ms, but the most-used durations in
              the app are{" "}
              {topDurations
                .slice(0, 2)
                .map(([d, n]) => `${d}ms (${n}×)`)
                .join(" and ")}{" "}
              — neither is a token. Only {STATS.tokenBackedDuration} of{" "}
              {STATS.live} animations take their duration from one.
            </li>
            <li>
              <span className="font-medium text-[#1a1817]">
                {STATS.distinctDurations} durations, written{" "}
                {STATS.distinctDurationSpellings} ways.
              </span>{" "}
              <code className="font-mono text-[12px]">0.3s</code> and{" "}
              <code className="font-mono text-[12px]">300ms</code> are the same
              value spelled differently, which defeats grep-based auditing.
            </li>
            <li>
              <span className="font-medium text-[#1a1817]">
                The easing tokens are barely load-bearing.
              </span>{" "}
              Exactly {STATS.tokenBackedEasing} of {STATS.live} animations use a
              design-system easing token.{" "}
              <code className="font-mono text-[12px]">
                --motion-easing-exit
              </code>{" "}
              has zero consumers. Another {STATS.appLocalEasing} use{" "}
              <code className="font-mono text-[12px]">--ease-fast</code>, which
              reads like a token at the call site but is declared by hand in
              apps/web and credited in its own comment to a personal portfolio
              project. Two non-token curves dominate everything else:{" "}
              {topBeziers
                .slice(0, 2)
                .map(([b, n]) => `${b} (${n}×)`)
                .join(", ")}
              .
            </li>
            <li>
              <span className="font-medium text-[#1a1817]">
                Reduced-motion coverage is an allowlist.
              </span>{" "}
              It is a hand-maintained list of selectors, so{" "}
              {STATS.live - STATS.reducedMotionCovered} animations are simply
              not in it. New components opt out silently by default.
            </li>
          </ul>
        </section>

        {/* ----------------------------- controls ---------------------------- */}
        <div className="sticky top-0 z-10 -mx-6 mt-[28px] bg-white/85 px-6 py-[12px] backdrop-blur-[20px]">
          <div className="flex flex-wrap items-center justify-between gap-[10px]">
            <div className="inline-flex items-center gap-[2px] rounded-full bg-[#f5f5f4] p-[3px]">
              {GROUPS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBy(value)}
                  aria-pressed={by === value}
                  className={`rounded-full px-[12px] py-[5px] text-[12px] leading-[16px] transition-colors ease-fast ${
                    by === value
                      ? "bg-[#1a1817] text-white"
                      : "text-[#58524e] hover:text-[#1a1817]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCycle((n) => n + 1)}
              className="rounded-full bg-[#f5f5f4] px-[12px] py-[6px] text-[12px] leading-[16px] text-[#58524e] transition-colors ease-fast hover:bg-[#efeeec] hover:text-[#1a1817]"
            >
              Replay all
            </button>
          </div>
        </div>

        {/* ------------------------------ cards ------------------------------ */}
        {groups.map(([label, entries]) => (
          <section key={label} className="mt-[20px]">
            <div className="flex items-baseline gap-[8px]">
              <h2 className="text-[13px] leading-[18px] font-medium text-[#1a1817]">
                {label}
              </h2>
              <span className="font-mono text-[11px] text-[#a8a29e]">
                {entries.length}
              </span>
            </div>
            <ul className="mt-[10px] grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <AnimationCard key={entry.name} entry={entry} cycle={cycle} />
              ))}
            </ul>
          </section>
        ))}

        {/* --------------------------- ambient tier -------------------------- */}
        <section className="mt-[36px]">
          <h2 className="text-[16px] leading-[22px] font-medium tracking-[-0.01em] text-[#1a1817]">
            The other 90%
          </h2>
          <p className="mt-[6px] max-w-[62ch] text-[13px] leading-[20px] text-[#58524e]">
            The {STATS.live} animations above are the visible library. Most
            motion in the product is not a keyframe at all — it is a{" "}
            <code className="font-mono text-[12px]">transition-*</code> utility
            on a hover or state change. This is the ambient tier, and it is
            where a ruling would have the most leverage.
          </p>
          <div className="mt-[14px] grid grid-cols-1 gap-[10px] md:grid-cols-3">
            <div className="rounded-[10px] bg-[#f5f5f4] p-[14px]">
              <p className="text-[12px] leading-[16px] font-medium text-[#1a1817]">
                What transitions
              </p>
              <ul className="mt-[8px] flex flex-col gap-[3px]">
                {transitions.map(([k, n]) => (
                  <li
                    key={k}
                    className="flex items-baseline justify-between gap-[8px] font-mono text-[11px] leading-[16px]"
                  >
                    <span className="text-[#58524e]">transition-{k}</span>
                    <span className="text-[#1a1817]">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[10px] bg-[#f5f5f4] p-[14px]">
              <p className="text-[12px] leading-[16px] font-medium text-[#1a1817]">
                Durations used
              </p>
              <ul className="mt-[8px] flex flex-col gap-[3px]">
                {topDurations.map(([k, n]) => (
                  <li
                    key={k}
                    className="flex items-baseline justify-between gap-[8px] font-mono text-[11px] leading-[16px]"
                  >
                    <span className="text-[#58524e]">
                      duration-{k}
                      {["120", "180", "300"].includes(k) ? (
                        <span className="ml-[6px] text-[#146c3a]">token</span>
                      ) : null}
                    </span>
                    <span className="text-[#1a1817]">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[10px] bg-[#f5f5f4] p-[14px]">
              <p className="text-[12px] leading-[16px] font-medium text-[#1a1817]">
                Curves in the repo
              </p>
              <ul className="mt-[8px] flex flex-col gap-[3px]">
                {topBeziers.map(([k, n]) => (
                  <li
                    key={k}
                    className="flex items-baseline justify-between gap-[8px] font-mono text-[11px] leading-[16px]"
                  >
                    <span className="truncate text-[#58524e]" title={k}>
                      {k.replace("cubic-bezier", "")}
                    </span>
                    <span className="shrink-0 text-[#1a1817]">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ----------------------------- orphans ----------------------------- */}
        <section className="mt-[28px]">
          <h2 className="text-[16px] leading-[22px] font-medium tracking-[-0.01em] text-[#1a1817]">
            Dead keyframes
          </h2>
          <p className="mt-[6px] max-w-[62ch] text-[13px] leading-[20px] text-[#58524e]">
            {ORPHANS.length} keyframes are defined but never played. A few are
            deliberately parked for easy toggling; the rest are leftovers.
          </p>
          <ul className="mt-[12px] flex flex-col gap-[2px]">
            {ORPHANS.map((o) => (
              <li
                key={`${o.file}:${o.name}`}
                className="flex flex-wrap items-baseline gap-x-[10px] font-mono text-[11px] leading-[18px]"
              >
                <span className="text-[#1a1817]">{o.name}</span>
                <span className="text-[#a8a29e]">
                  {o.file}:{o.line}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-[36px] border-t border-[#f0efee] pt-[14px]">
          <p className="font-mono text-[11px] leading-[16px] text-[#a8a29e]">
            Generated from the Ando repo · {STATS.scannedFiles.toLocaleString()}{" "}
            files scanned · regenerate with{" "}
            <span className="text-[#58524e]">npm run audit:animations</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
