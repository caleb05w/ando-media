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
      <main className="w-full max-w-3xl px-8 pb-24 pt-28">
        <h1 className="text-[17px] font-semibold leading-6 text-[#1a1817]">
          Projects &amp; writings
        </h1>
        <ul className="mt-16">
          {ENTRIES.map((entry) => (
            <li
              key={entry.href}
              className="border-b border-[#e7e5e4] last:border-b-0"
            >
              <Link href={entry.href} className="group block py-9">
                <span className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-[26px] font-light leading-9 text-[#78716c] transition-colors group-hover:text-[#1a1817]">
                    {entry.title}
                  </span>
                  {entry.tag ? (
                    <span className="text-[22px] font-light leading-9 text-[#ea580c]">
                      {entry.tag}
                    </span>
                  ) : null}
                </span>
                <span className="mt-2 block max-w-xl text-[14px] leading-5 text-[#a8a29e]">
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
