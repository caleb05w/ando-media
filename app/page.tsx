import Link from "next/link";

// / — directory of every page in the app, one row per prototype.

type Entry = {
  href: string;
  title: string;
  tag?: string;
  brief: string;
};

const ENTRIES: Entry[] = [
  {
    href: "/slack-sync-cards",
    title: "Slack sync cards",
    tag: "(WIP)",
    brief:
      "The post-sync Wrapped deck — frosted glass cards built from Figma, arrow keys to move between slides, and a fun fact tucked behind an eye toggle.",
  },
  {
    href: "/agents",
    title: "Agents directory",
    tag: "(WIP)",
    brief:
      "The agents table from July Sprints with a Table / Cards switch — rows become tiles with a status-dot avatar, channel chips, connected apps, and working toggles.",
  },
  {
    href: "/agent-flyout",
    title: "Agent flyout",
    tag: "(Prototype)",
    brief:
      "Active agents compress above the composer, then fly out into per-agent detail — four iterations (v2 rollup, rows, cards, console) with working / needs-input / failed / success states, stop CTAs, and tool traces.",
  },
  {
    href: "/multi-select",
    title: "Message multi-select",
    tag: "(Prototype)",
    brief:
      "Drag across messages to block-select them, Notion-style — corner checkmarks, shift-click ranges, edge auto-scroll, and an A/B toggle for the action bar.",
  },
  {
    href: "/channel",
    title: "Channel view",
    tag: "(Demo)",
    brief:
      "The #design channel with agent handoff — drag to multi-select messages, Send to Agent to spawn agents that work or fail (tracked in a bottom-right stack), plus a working composer.",
  },
  {
    href: "/agent-working",
    title: "Agent working",
    tag: "(Prototype)",
    brief:
      "@mention an agent to spawn a run — inline session chips, ringed corner presence, an Active/Complete flyout with stop and rerun, and a tool-call trace modal.",
  },
  {
    href: "/agent-interactions",
    title: "Agent motion studies",
    tag: "(Motion)",
    brief:
      "Sixteen looping motion studies for the agent working, completion, and failure states — Dynamic Island, watchOS-breathe, and Chrome-downloads inspired.",
  },
  {
    href: "/automation-test",
    title: "Create automation",
    brief:
      "Automation modal with natural-language scheduling — combobox, parser, invalid states, and compound schedules.",
  },
  {
    href: "/week2",
    title: "Split-flap calendar",
    brief: "Countdown calendar with a split-flap board and 3D sky scene.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 justify-center bg-white">
      <main className="w-full max-w-xl px-6 pb-20 pt-24">
        <h1 className="text-[14px] font-medium leading-5 text-[#1a1817]">
          Projects &amp; writings
        </h1>
        <ul className="mt-10">
          {ENTRIES.map((entry) => (
            <li
              key={entry.href}
              className="border-b border-[#f0efee] last:border-b-0"
            >
              <Link href={entry.href} className="group block py-5">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[16px] leading-6 text-[#58524e] transition-colors group-hover:text-[#1a1817]">
                    {entry.title}
                  </span>
                  {entry.tag ? (
                    <span className="text-[13px] leading-6 text-[#ea580c]">
                      {entry.tag}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-[13px] leading-[18px] text-[#a8a29e]">
                  {entry.brief}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
