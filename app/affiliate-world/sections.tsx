import { Heading, Text, TextSize } from "@repo/design-system-ui/text";
import Link from "next/link";

import { FooterGlobe } from "../affiliate/footer-globe";
import { ClaimHandle } from "./claim-handle";
import { WorldStepper } from "./world-stepper";

// The affiliate world's sections. The page is a claiming surface:
// the world seen whole (who's in), the members as numbered cards,
// and your name — the handle you claim holds your place in line.
// Styling follows the affiliate page's STYLE.md — the landing system
// verbatim.

// The world's numbers — the @sara stat grammar, aggregated: growth in
// the first two figures, the line itself in the third.
const WORLD_STATS: { label: string; value: string }[] = [
  { value: "+38", label: "Joined this week" },
  { value: "+11", label: "New workspaces" },
  { value: "1,204", label: "On the waitlist" },
];

// ── The members — each card a numbered door into their own page ────────
// Numbers are membership order: lower is earlier. Sara's door is real
// (/affiliate); the rest are cut for now.
const MEMBERS = [
  {
    name: "Sara",
    handle: "sara",
    no: "014",
    bio: "Founder of a seed-stage comms startup. Thinks in examples, keeps the receipts.",
    stat: "“lets gooo” · 214×",
    href: "/affiliate",
  },
  {
    name: "Oli",
    handle: "oli",
    no: "009",
    bio: "Engineering at the same startup. Blockers first, everything else can wait.",
    stat: "#eng-standup · 812",
    href: "#",
  },
  {
    name: "AJ",
    handle: "aj",
    no: "003",
    bio: "Sales. Every update arrives with an owner attached.",
    stat: "“closed” · 96×",
    href: "#",
  },
  {
    name: "Jordan",
    handle: "jordan",
    no: "021",
    bio: "Design. Turns Jams into flows before the standup.",
    stat: "🔥 · 1,033×",
    href: "#",
  },
];

function Avatar({ src, size = 24, className = "" }: { src: string; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`max-w-none rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** The landing page's section heading, verbatim: display face, Large→XXL. */
function ContentHeading({ children, id }: { children: string; id: string }) {
  return (
    <Heading as="h2" className="scroll-mt-24" id={id} size={{ base: TextSize.Large, md: TextSize.XXL }} weight="regular">
      {children}
    </Heading>
  );
}

/** The landing prose grid: 640px column centre, gutters breathing. */
function ProseGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="content-frame grid grid-cols-1 gap-x-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,640px)_minmax(0,1fr)]">
      <aside className="hidden xl:block" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ── the hero — the world seen whole, then your name ──────────────────── */
/* Exported: /claim mounts this block alone as the claiming page. */
export function WorldHeader() {
  return (
    <header className="flex flex-col items-center pt-16 text-center md:pt-20">
      {/* the world — the crowd as a globe in your hands (Brand
          3639-7178), a breath wider than the prose column; the page
          opens on the faces, unlabelled. The stepper under it pages
          through the arrangement iterations. */}
      <div className="w-full max-w-[500px] px-5 md:px-0">
        <WorldStepper />
      </div>
      <Heading as="h1" className="mt-12" size={{ base: TextSize.XXL, md: TextSize.XXL2 }} weight="regular">
        Join the Ando world.
      </Heading>
      <Text className="mt-4 max-w-[440px]" color="secondary" size={TextSize.Small}>
        The most agent-pilled startups are building their working worlds here. Claim your handle — it holds your name,
        and your place in line.
      </Text>
      <div className="mt-8">
        <ClaimHandle />
      </div>
    </header>
  );
}

/* ── the page ─────────────────────────────────────────────────────────── */

export function WorldView() {
  return (
    <div className="relative w-full">
      <ProseGrid>
        <WorldHeader />

        {/* the members — mini handle cards passing in one row */}
        <section aria-labelledby="the-members" className="pt-20 md:pt-24">
          <ContentHeading id="the-members">The members</ContentHeading>
          <Text className="mt-4" color="secondary" size={TextSize.Small}>
            Some of the people already inside — every handle is a working world of its own.
          </Text>
          {/* the membership's numbers — the @sara stat grammar: value in
              the display face, count folded into a quiet caption. Equal
              columns: the grid sizes every cell to the widest one. */}
          <dl className="mx-auto mt-8 grid w-fit auto-cols-fr grid-flow-col divide-x divide-border-subtle">
            {WORLD_STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse items-center gap-2 px-3 md:px-5">
                <dt className="whitespace-nowrap font-mono text-[9px] uppercase leading-4 tracking-[0.08em] text-text-tertiary md:text-[10px]">
                  {stat.label}
                </dt>
                <dd className="whitespace-nowrap font-display text-[21px] leading-[26px] text-text-primary">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {MEMBERS.map((person) => (
              <li key={person.handle}>
                <Link
                  className="group block h-full rounded-[10px] bg-white p-4 shadow-[0_0_0_0.5px_rgba(22,25,29,0.1),0_1px_3px_rgba(22,25,29,0.06)] transition-shadow duration-200 ease-fast hover:shadow-[0_0_0_0.5px_rgba(22,25,29,0.1),0_8px_24px_rgba(22,25,29,0.14)]"
                  href={person.href}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-2.5">
                      <Avatar src={`/avatars/${person.handle}.png`} size={36} />
                      <span className="flex min-w-0 flex-col">
                        <Text as="span" className="font-medium" size={TextSize.Small}>
                          {person.name}
                        </Text>
                        <Text as="span" color="tertiary" size={TextSize.XS}>
                          @{person.handle}
                        </Text>
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[9px] uppercase leading-4 tracking-[0.08em] text-text-tertiary">
                      Nº {person.no}
                    </span>
                  </span>
                  <Text as="span" className="mt-2.5 block" color="secondary" size={TextSize.XS}>
                    {person.bio}
                  </Text>
                  <span className="mt-3 flex items-baseline justify-between border-t-[0.5px] border-border-subtle pt-3">
                    <span className="font-mono text-[9px] uppercase leading-4 tracking-[0.08em] text-text-tertiary">
                      {person.stat}
                    </span>
                    <Text
                      as="span"
                      className="underline decoration-dotted underline-offset-2 group-hover:text-[#2563eb]"
                      color="tertiary"
                      size={TextSize.XS}
                    >
                      their world
                    </Text>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* the threshold — your name, then the horizon */}
        <section
          aria-label="Claim your handle"
          className="relative left-1/2 mt-12 flex w-[calc(100vw-40px)] max-w-[888px] -translate-x-1/2 flex-col items-center pt-24 text-center md:mt-16 md:w-[calc(100vw-64px)]"
          id="claim"
        >
          <p className="max-w-[420px] font-display text-[30px] leading-[40px] text-text-primary">
            Your working world is waiting.
          </p>
          <Text className="mt-3" color="secondary" size={TextSize.Small}>
            Claim your handle and hold your place in line.
          </Text>
          <div className="mt-6">
            <ClaimHandle />
          </div>
          {/* the horizon — the same crest that closes @sara's page:
              standing at the world's edge, this time from outside */}
          <div aria-hidden className="mt-3 h-[220px] w-full max-w-[840px] overflow-hidden">
            <div className="h-[440px] w-full">
              <FooterGlobe />
            </div>
          </div>
        </section>
      </ProseGrid>
    </div>
  );
}
