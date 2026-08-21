"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Stepper, weekLabel, weekRange } from "./stepper";

// / — directory of every page in the app, split across two shelves behind a
// floating switcher: Projects (prototypes and experiments) and Slides (dated
// decks). Rows are styled after the Ando onboarding cards in
// /caleb-slides/ando-mockups — grey rounded card, title over brief, chevron.

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
    href: "/agent-typing-experience",
    week: "2026-08-17",
    title: "Agent typing experience",
    tag: "(Motion)",
    brief:
      "The typing indicator becoming an agent — five keepers in three takes (v1 shares one spring-and-shudder arrival; v2 tailors each profile arrival to its morph; v3 tones the same principles down for at-scale use), an archive of retired studies, and a live 1:1 library grid for comparing them. Built from the Agent trace storyboard.",
  },
  {
    href: "/inline-multi-select",
    week: "2026-08-17",
    title: "Inline multi-select",
    tag: "(Prototype)",
    brief:
      "An agent-rendered choice card inside the Ando channel — multi-select answers, a custom option, two-step navigation, and the selected-but-locked return state from the onboarding exploration.",
  },
  {
    href: "/trace-canvas",
    week: "2026-08-17",
    title: "Inline trace — blank canvas",
    tag: "(Sandbox)",
    brief:
      "This week's working copy of the inline agent trace on a blank message canvas — no sidebars, just the interfaces. A floating switcher flips between #channel, DM (with Tadao), and Thread (channel + 400px thread panel side by side, the small-screen check). Each surface keeps its own transcript; the agent machinery rides along in all three.",
  },
  {
    href: "/app-empty-state",
    week: "2026-08-10",
    title: "App empty state",
    tag: "(Motion)",
    brief:
      "The “No apps connected yet” card with a live icon carousel — five apps take turns popping up through the slot on a shared tilt, hanging mid-air, then rotating back level and sinking behind the fade. Storyboarded in August Sprints.",
  },
  {
    href: "/loading-state-ideation",
    week: "2026-08-10",
    title: "Loading state ideation",
    tag: "(Motion)",
    brief:
      "The baseline board for rethinking how Ando says “working” — the shipped spinner ported exactly from packages/ui at every size and in context, the skeleton alternative, and the spec any replacement has to beat.",
  },
  {
    href: "/trace-test",
    week: "2026-08-10",
    title: "Trace test",
    tag: "(Sandbox)",
    brief:
      "A working copy of Sticky inline agent presence — same shell and agent layer, kept separate so ideas can be tried without disturbing the shipped route.",
  },
  {
    href: "/agent-inline-trace",
    week: "2026-08-10",
    title: "Sticky inline agent presence",
    tag: "(Prototype)",
    brief:
      "A tiny live agent face rides the sentence that invoked it — hover for labeled Stop / Restart / Clear, click to summon it in the Active agents panel — and docks onto the corner rail whenever its message scrolls away. Unseen completions stay railed until you view the answer, stopped agents park in place, Esc cancels your latest send, and the Agents panel sets response time.",
  },
  {
    href: "/ando-draft-messages",
    week: "2026-08-03",
    title: "Suggested drafts",
    tag: "(Prototype)",
    brief:
      "The draft-suggestion form factor from July Sprints — a capped list above the composer where the index badge becomes a return glyph on the active row, the chevron expands and the row body stages. Arrow keys move, enter stages, escape unwinds.",
  },
  {
    href: "/animation-audit",
    week: "2026-08-03",
    title: "Animation audit",
    tag: "(Motion)",
    brief:
      "Every animation in the Ando repo on one page, playing at the timing its real consumers use — frequency, easing, duration, delay, and what it is applied to. Extracted from the codebase, not written by hand.",
  },
  {
    href: "/bubble-murmuration",
    week: "2026-08-03",
    title: "Login explorations",
    tag: "(Motion)",
    brief:
      "The Ando login screen with the Convergence logo treatment — #, @, and / chips fly in and dock on a dashed rail around the icon tile, then the formation turns and breathes as one. UI untouched; only the logo moves.",
  },
  {
    href: "/slack-sync-cards",
    week: "2026-07-20",
    title: "Slack sync cards",
    tag: "(WIP)",
    brief:
      "The post-sync Wrapped deck — frosted glass cards built from Figma, arrow keys to move between slides, and a fun fact tucked behind an eye toggle.",
  },
  {
    href: "/agents",
    week: "2026-07-27",
    title: "Agents directory",
    tag: "(WIP)",
    brief:
      "The agents table from July Sprints with a Table / Cards switch — rows become tiles with a status-dot avatar, channel chips, connected apps, and working toggles.",
  },
  {
    href: "/agent-flyout",
    week: "2026-07-20",
    title: "Agent flyout",
    tag: "(Prototype)",
    brief:
      "Active agents compress above the composer, then fly out into per-agent detail — four iterations (v2 rollup, rows, cards, console) with working / needs-input / failed / success states, stop CTAs, and tool traces.",
  },
  {
    href: "/multi-select",
    week: "2026-07-13",
    title: "Message multi-select",
    tag: "(Prototype)",
    brief:
      "Drag across messages to block-select them, Notion-style — corner checkmarks, shift-click ranges, edge auto-scroll, and an A/B toggle for the action bar.",
  },
  {
    href: "/channel",
    week: "2026-07-20",
    title: "Channel view",
    tag: "(Demo)",
    brief:
      "The #design channel with agent handoff — drag to multi-select messages, Send to Agent to spawn agents that work or fail (tracked in a bottom-right stack), plus a working composer.",
  },
  {
    href: "/agent-working",
    week: "2026-07-20",
    title: "Agent working",
    tag: "(Prototype)",
    brief:
      "@mention an agent to spawn a run — inline session chips, ringed corner presence, an Active/Complete flyout with stop and rerun, and a tool-call trace modal.",
  },
  {
    href: "/agent-interactions",
    week: "2026-07-20",
    title: "Agent motion studies",
    tag: "(Motion)",
    brief:
      "Sixteen looping motion studies for the agent working, completion, and failure states — Dynamic Island, watchOS-breathe, and Chrome-downloads inspired.",
  },
  {
    href: "/automation-test",
    week: "2026-06-29",
    title: "Create automation",
    brief:
      "Automation modal with natural-language scheduling — combobox, parser, invalid states, and compound schedules.",
  },
  {
    href: "/week2",
    week: "2026-06-08",
    title: "Split-flap calendar",
    brief: "Countdown calendar with a split-flap board and 3D sky scene.",
  },
];

const SLIDES: Entry[] = [
  {
    href: "/caleb-slides",
    title: "Caleb slides",
    date: "July 31, 2026",
    brief:
      "A showcase deck — every insight card as its own slide, a full-page grid of the whole set, then the channel, DM, and OAuth mockups. Arrow keys move between slides on the insight-deck swap.",
  },
];

const TABS = [
  ["projects", "Projects"],
  ["slides", "Slides"],
] as const;

type Tab = (typeof TABS)[number][0];

function EntryCard({ entry }: { entry: Entry }) {
  return (
    <Link
      href={entry.href}
      className="flex items-center gap-[16px] rounded-[10px] bg-[#f5f5f4] p-[16px] transition-colors ease-fast hover:bg-[#efeeec]"
    >
      <div className="min-w-0 flex-1 text-[14px] leading-[20px]">
        <p className="font-medium text-[#1a1817]">
          {entry.title}
          {entry.tag ? (
            <span className="ml-[8px] font-normal text-[#ea580c]">
              {entry.tag}
            </span>
          ) : null}
        </p>
        <p className="mt-[2px] text-[#58524e]">{entry.brief}</p>
      </div>
      {entry.date ? (
        <p className="shrink-0 font-mono text-[11px] leading-[16px] text-[#8a827b]">
          {entry.date}
        </p>
      ) : null}
      {/* Same exported chevron the Ando cards use. */}
      <img
        alt=""
        src="/caleb-slides/chevron-right.svg"
        className="size-[18px] shrink-0"
      />
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
      <main className="w-full max-w-xl px-6 pb-20">
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
        <ul className="mt-4 flex flex-col gap-[12px]">
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
