"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Stepper, weekLabel, weekRange } from "./stepper";

// / — directory of every page in the app, split across two shelves behind a
// floating switcher: Projects (prototypes and experiments) and Slides (dated
// decks). Each card carries a live thumbnail of its route — the page itself
// rendered in a scaled-down iframe — so a visitor can tell projects apart
// without reading. Titles stay under five words, briefs under twelve.

type Entry = {
  href: string;
  title: string;
  tag?: string;
  brief: string;
  /** Slides are dated; projects are not. */
  date?: string;
  /** Monday of the week the route was first committed, YYYY-MM-DD. Derived
   *  from git history — see the Weeks stepper below. Projects with no commit
   *  yet (still uncommitted) sit in the current week. */
  week?: string;
};

const PROJECTS: Entry[] = [
  {
    href: "/ando-grok",
    week: "2026-08-31",
    title: "Ando, Grok cut",
    tag: "Motion",
    brief: "The Ando window, still — a storyboard starts here.",
  },
  {
    href: "/context-stream",
    week: "2026-08-31",
    title: "Agent context",
    tag: "Motion",
    brief: "Dots become a stream, the stream becomes the app.",
  },
  {
    href: "/ando-stage",
    week: "2026-08-31",
    title: "Jams launch",
    tag: "Prototype",
    brief: "Scripted launch conversations in the real Ando window.",
  },
  {
    href: "/affiliate-announcement",
    week: "2026-08-31",
    title: "Affiliate announcement",
    tag: "Prototype",
    brief: "The wheel + its timeline studio + one-click mp4 export.",
  },
  {
    href: "/affiliate-world",
    week: "2026-08-31",
    title: "Affiliate world",
    tag: "Prototype",
    brief: "The bubble map, the members, and claiming your @handle.",
  },
  {
    href: "/claim",
    week: "2026-08-31",
    title: "Claim your handle",
    tag: "Prototype",
    brief: "The username claim alone — bubble map, statement, field.",
  },
  {
    href: "/slack-disintegration",
    week: "2026-08-24",
    title: "Slack disintegration",
    tag: "Motion",
    brief: "Slack becomes the little Ando computer — dust, mosaic, or grid reveal.",
  },
  {
    href: "/affiliate",
    week: "2026-08-24",
    title: "Affiliate page",
    tag: "Prototype",
    brief: "ando.so/@sara — a personal invite page, P0.",
  },
  {
    href: "/the-harness",
    week: "2026-08-24",
    title: "The harness",
    tag: "Motion",
    brief: "Ando as a ring — every line of work threads through it.",
  },
  {
    href: "/the-library",
    week: "2026-08-24",
    title: "The library",
    tag: "Reference",
    brief: "The homepage media components, all on one shelf.",
  },
  {
    href: "/landing-page",
    week: "2026-08-24",
    title: "Ando home page",
    tag: "Reference",
    brief: "The live marketing site on the real design system.",
  },
  {
    href: "/landing-page-animations",
    week: "2026-08-17",
    title: "Landing animations",
    tag: "Motion",
    brief: "Scaffold band for the landing page motion studies.",
  },
  {
    href: "/agent-typing-experience",
    week: "2026-08-17",
    title: "Agent typing",
    tag: "Motion",
    brief: "Typing indicator morphs into an agent — five keepers.",
  },
  {
    href: "/inline-multi-select",
    week: "2026-08-17",
    title: "Inline multi-select",
    tag: "Prototype",
    brief: "Agent choice cards with per-intent follow-up flows.",
  },
  {
    href: "/trace-canvas",
    week: "2026-08-17",
    title: "Trace canvas",
    tag: "Sandbox",
    brief: "Inline agent trace on channel, DM, and thread.",
  },
  {
    href: "/app-empty-state",
    week: "2026-08-10",
    title: "App empty state",
    tag: "Motion",
    brief: "Empty apps card with a live icon carousel.",
  },
  {
    href: "/loading-state-ideation",
    week: "2026-08-10",
    title: "Loading states",
    tag: "Motion",
    brief: "The shipped spinner, skeletons, and the spec to beat.",
  },
  {
    href: "/trace-test",
    week: "2026-08-10",
    title: "Trace test",
    tag: "Sandbox",
    brief: "Scratch copy of sticky agent presence for experiments.",
  },
  {
    href: "/agent-inline-trace",
    week: "2026-08-10",
    title: "Sticky agent presence",
    tag: "Prototype",
    brief: "A live agent face rides the message that invoked it.",
  },
  {
    href: "/ando-draft-messages",
    week: "2026-08-03",
    title: "Suggested drafts",
    tag: "Prototype",
    brief: "Keyboard-first draft suggestions above the composer.",
  },
  {
    href: "/animation-audit",
    week: "2026-08-03",
    title: "Animation audit",
    tag: "Motion",
    brief: "Every Ando animation, playing at its real timing.",
  },
  {
    href: "/bubble-murmuration",
    week: "2026-08-03",
    title: "Login explorations",
    tag: "Motion",
    brief: "Logo chips fly in, dock, and breathe as one.",
  },
  {
    href: "/agents",
    week: "2026-07-27",
    title: "Agents directory",
    tag: "WIP",
    brief: "The agents table with a table / cards switch.",
  },
  {
    href: "/slack-sync-cards",
    week: "2026-07-20",
    title: "Slack sync cards",
    tag: "WIP",
    brief: "Post-sync Wrapped deck in frosted glass.",
  },
  {
    href: "/agent-flyout",
    week: "2026-07-20",
    title: "Agent flyout",
    tag: "Prototype",
    brief: "Compressed agent chips fly out into per-agent detail.",
  },
  {
    href: "/channel",
    week: "2026-07-20",
    title: "Channel view",
    tag: "Demo",
    brief: "The #design channel with drag-select and agent handoff.",
  },
  {
    href: "/agent-working",
    week: "2026-07-20",
    title: "Agent working",
    tag: "Prototype",
    brief: "@mention an agent to spawn and track a run.",
  },
  {
    href: "/agent-interactions",
    week: "2026-07-20",
    title: "Agent motion studies",
    tag: "Motion",
    brief: "Sixteen looping studies of working, done, and failed.",
  },
  {
    href: "/multi-select",
    week: "2026-07-13",
    title: "Message multi-select",
    tag: "Prototype",
    brief: "Drag across messages to block-select them, Notion-style.",
  },
  {
    href: "/automation-test",
    week: "2026-06-29",
    title: "Create automation",
    brief: "Automation modal with natural-language scheduling.",
  },
  {
    href: "/week2",
    week: "2026-06-08",
    title: "Split-flap calendar",
    brief: "Countdown calendar: split-flap board and 3D sky.",
  },
];

const SLIDES: Entry[] = [
  {
    href: "/caleb-slides",
    title: "Caleb slides",
    date: "July 31, 2026",
    brief: "Every insight card as a slide, plus product mockups.",
  },
];

const TABS = [
  ["projects", "Projects"],
  ["slides", "Slides"],
] as const;

type Tab = (typeof TABS)[number][0];

/** The route itself, rendered small. A 400%-sized iframe scaled to 1/4 shows
 *  each page at a ~1300px desktop viewport inside a card-width thumbnail.
 *  Inert on purpose — clicks belong to the card link, not the preview. */
function EntryCanvas({ href }: { href: string }) {
  return (
    <div className="pointer-events-none relative aspect-[16/10] overflow-hidden rounded-[6px] bg-white shadow-[0px_0px_0px_1px_rgba(81,76,71,0.08)]">
      <iframe
        src={href}
        title=""
        aria-hidden
        tabIndex={-1}
        loading="lazy"
        className="absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-[0.25] border-0 bg-white"
      />
    </div>
  );
}

function EntryCard({ entry }: { entry: Entry }) {
  return (
    <Link
      href={entry.href}
      className="flex flex-col gap-[10px] rounded-[10px] bg-[#f5f5f4] p-[10px] transition-colors ease-fast hover:bg-[#efeeec]"
    >
      <EntryCanvas href={entry.href} />
      <div className="min-w-0 px-[4px] pb-[4px] text-[13px] leading-[18px]">
        <p className="flex items-baseline gap-[8px]">
          <span className="truncate font-medium text-[#1a1817]">
            {entry.title}
          </span>
          {entry.tag ? (
            <span className="shrink-0 font-mono text-[10px] uppercase leading-[16px] tracking-[0.04em] text-[#8a827b]">
              {entry.tag}
            </span>
          ) : null}
          {entry.date ? (
            <span className="ml-auto shrink-0 font-mono text-[10px] leading-[16px] text-[#8a827b]">
              {entry.date}
            </span>
          ) : null}
        </p>
        <p className="mt-[2px] truncate text-[#58524e]">{entry.brief}</p>
      </div>
    </Link>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("projects");

  // Weeks come from git — each route's first-commit date, collapsed to the
  // Monday of that week. Newest first, so the current week reads first and
  // opens selected; "All" sits at the end as the escape hatch rather than the
  // default, since the page is usually opened to see what just shipped.
  const weeks = useMemo(() => {
    const set = new Set(
      PROJECTS.map((p) => p.week).filter((w): w is string => Boolean(w)),
    );
    return [...set].sort().reverse();
  }, []);

  const [week, setWeek] = useState<string>(() => weeks[0] ?? "all");

  const steps = useMemo(
    () => [
      ...weeks.map((w) => ({
        value: w,
        label: weekLabel(w),
        title: weekRange(w),
      })),
      { value: "all", label: "All" },
    ],
    [weeks],
  );

  const entries =
    tab === "slides"
      ? SLIDES
      : week === "all"
        ? PROJECTS
        : PROJECTS.filter((p) => p.week === week);

  return (
    <div className="flex flex-1 justify-center bg-white">
      <main className="w-full max-w-3xl px-6 pb-20">
        <div className="sticky top-0 z-10 flex justify-center pt-10 pb-6">
          <div className="inline-flex items-center gap-[2px] rounded-full bg-white/85 p-[3px] shadow-[0px_0px_0px_1px_rgba(81,76,71,0.12),0px_8px_8px_-4px_rgba(22,25,29,0.03),0px_20px_24px_-4px_rgba(22,25,29,0.08)] backdrop-blur-[20px]">
            {TABS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                aria-pressed={tab === value}
                className={`rounded-full px-[14px] py-[6px] text-[12px] leading-[16px] transition-colors ease-fast ${
                  tab === value
                    ? "bg-[#1a1817] text-white"
                    : "text-[#58524e] hover:text-[#1a1817]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {/* Weeks only apply to Projects — Slides carry their own dates. */}
        {tab === "projects" ? (
          <Stepper
            steps={steps}
            active={week}
            onChange={setWeek}
            ariaLabel="Filter projects by week"
          />
        ) : null}
        <ul className="mt-4 grid grid-cols-1 gap-[16px] sm:grid-cols-2">
          {entries.map((entry) => (
            <li key={entry.href}>
              <EntryCard entry={entry} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
