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
    href: "/multi-select",
    title: "Message multi-select",
    tag: "(Prototype)",
    brief:
      "Drag across messages to block-select them, Notion-style — corner checkmarks, shift-click ranges, edge auto-scroll, and an A/B toggle for the action bar.",
  },
  {
    href: "/agent-working",
    title: "Agent working",
    tag: "(Prototype)",
    brief:
      "@mention an agent to spawn a run — inline session chips, ringed corner presence, an Active/Complete flyout with stop and rerun, and a tool-call trace modal.",
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
