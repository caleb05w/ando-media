import { TableOfContents } from "@repo/design-system-ui/table-of-contents";
import { Heading, Text, TextSize } from "@repo/design-system-ui/text";

import { FooterGlobe } from "./footer-globe";
import { MiniAndo } from "./mini-ando";

// The affiliate page's sections — shared between /affiliate (the real
// page) and /affiliate/lab (the exploration bench). Styling follows
// ./STYLE.md — the landing system verbatim.

const saraTocItems = [
  { id: "this-week-with-yumi", label: "This week with Yumi" },
  { id: "how-yumi-works", label: "How Yumi works with Sara" },
];

const COLLABORATORS = [
  {
    name: "Oli",
    handle: "oli",
    avatar: "/avatars/oli.png",
    bio: "Engineering at the same comms startup. Blockers first, everything else can wait.",
  },
  {
    name: "AJ",
    handle: "aj",
    avatar: "/avatars/aj.png",
    bio: "Sales. Every update arrives with an owner attached.",
  },
  {
    name: "Jordan",
    handle: "jordan",
    avatar: "/avatars/jordan.png",
    bio: "Design. Turns Jams into flows before the standup.",
  },
  {
    name: "Alex",
    handle: "alex",
    avatar: "/avatars/alex.png",
    bio: "Ops. Keeps the launch dates honest.",
  },
];

// The numbers deck, reduced to its facts — counted from a year in
// Ando, approved by her. The value speaks in the display face; the
// count rides the caption.
const HERO_STATS: { label: string; value: string; emoji?: boolean }[] = [
  { value: "“lets gooo”", label: "Most said · 214×" },
  { value: "🔥 ✅ 😂", label: "Most used reactions", emoji: true },
  { value: "#product", label: "Most active channel · 1,082" },
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

/** The landing prose grid: 640px column centre; optional sticky rail left. */
function ProseGrid({ items, children }: { items?: { id: string; label: string }[]; children: React.ReactNode }) {
  return (
    <div className="content-frame grid grid-cols-1 gap-x-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,640px)_minmax(0,1fr)]">
      <aside className="hidden pt-16 xl:block">
        {items ? (
          <TableOfContents
            aria-label="On this page"
            className="sticky top-16 [&_a]:h-auto [&_a]:rounded-none [&_a]:px-0 [&_a:hover]:bg-transparent [&_a:focus-visible]:bg-transparent [&_li]:py-[7px]"
            items={items}
            linkWidth="fit"
            rootMargin="-80px 0px -55% 0px"
          />
        ) : null}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}


/* ── profile hero — shared by both views ──────────────────────────────── */

/* One avatar with its profile card: the card opens beneath, centred,
   after a beat of hover intent; the pt-2 bridges the hover gap so it
   holds while read. Hover only — nothing to click, nothing pins. */
function PersonAvatar({ person, size = 24 }: { person: (typeof COLLABORATORS)[number]; size?: number }) {
  return (
    <span className="group/avatar relative cursor-default hover:z-10">
      <Avatar
        src={person.avatar}
        size={size}
        className="border-2 border-white transition-[filter] duration-150 ease-fast group-hover/avatar:brightness-90"
      />
      <span className="invisible absolute left-1/2 top-full z-30 block w-[236px] -translate-x-1/2 translate-y-1 pt-2 opacity-0 transition-all duration-200 ease-fast group-hover/avatar:visible group-hover/avatar:translate-y-0 group-hover/avatar:opacity-100 group-hover/avatar:delay-150">
        <span className="block cursor-default rounded-[10px] bg-white p-3.5 text-left shadow-[0_0_0_0.5px_rgba(22,25,29,0.1),0_8px_24px_rgba(22,25,29,0.14)]">
          <span className="flex items-center gap-2.5">
            <Avatar src={person.avatar} size={36} />
            <span className="flex min-w-0 flex-col">
              <Text as="span" className="font-medium" size={TextSize.Small}>
                {person.name}
              </Text>
              <Text as="span" color="tertiary" size={TextSize.XS}>
                @{person.handle}
              </Text>
            </span>
          </span>
          <Text as="span" className="mt-2.5 block" color="secondary" size={TextSize.XS}>
            {person.bio}
          </Text>
        </span>
      </span>
    </span>
  );
}

/* Figma 3639:6130 — the works-with cell joined to the access button,
   back in the hero's flow: beneath the stat row, closing the hero.
   The avatars keep their hover profile cards. */
function AccessCluster() {
  return (
    <div className="mt-6 flex items-stretch">
      <div className="flex items-center gap-2 border border-border-subtle bg-white p-2.5">
        <Text color="secondary" size={TextSize.Small}>
          Works with
        </Text>
        <span className="flex -space-x-[6px]">
          {COLLABORATORS.slice(0, 3).map((person) => (
            <PersonAvatar key={person.name} person={person} size={22} />
          ))}
        </span>
      </div>
      <a
        className="flex items-center bg-[#242424] px-3 font-sans text-size-sm tracking-[-0.02em] text-[#fcfcfc] transition-colors ease-fast hover:bg-[#1a1817]"
        href="#"
      >
        Get access
      </a>
    </div>
  );
}

function ProfileHero() {
  return (
    <header className="flex flex-col items-center gap-4 pt-40 text-center">
      <Avatar src="/avatars/sara.png" size={84} className="shadow-[0_0_0_1px_rgba(28,25,23,0.06)]" />
      <div>
        <Heading as="h1" size={{ base: TextSize.XXL, md: TextSize.XXL2 }} weight="regular">
          Sara
        </Heading>
        <Text color="secondary" size={TextSize.Small}>
          @sara
        </Text>
      </div>
      <Text className="max-w-[440px]" color="secondary" size={TextSize.Small}>
        Founder of a seed-stage comms startup. I think in examples, decide in diagrams, and keep the receipts.
      </Text>
      {/* her numbers, rudimentary — the deck's stats (the drum itself
          is shelved in /the-library) as editorial figures: the value
          in the display face, the count folded into a quiet caption,
          nothing but a hairline between them */}
      {/* equal columns: the row is a grid sized to its widest cell, so
          all three categories share one width and the hairlines sit at
          even intervals */}
      <dl className="mx-auto mt-8 grid w-fit auto-cols-fr grid-flow-col divide-x divide-border-subtle">
        {HERO_STATS.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse items-center gap-2 px-3 md:px-5">
            <dt className="whitespace-nowrap font-mono text-[9px] uppercase leading-4 tracking-[0.08em] text-text-tertiary md:text-[10px]">
              {stat.label}
            </dt>
            <dd
              className={
                stat.emoji
                  ? "whitespace-nowrap text-[18px] leading-[26px] tracking-[0.14em]"
                  : "whitespace-nowrap font-display text-[21px] leading-[26px] text-text-primary"
              }
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
      <AccessCluster />
    </header>
  );
}

/* ── this week with Yumi — the pulse (parked on @sara) ────────────────── */
// The Strava register on the landing grid: one blue trace, flat when the
// week is quiet, needle peaks where the work happened. One column per
// day; each day's cluster, gridline, and label share a centre.

const PULSE_BASE = 180;
const DAY_W = 640 / 7;
const dayX = (i: number) => (i + 0.5) * DAY_W;

const PULSE_SPIKES: [number, number][] = [
  // Tue — the brief
  [dayX(1) - 24, 45], [dayX(1) - 11, 90], [dayX(1), 148], [dayX(1) + 12, 55], [dayX(1) + 24, 24],
  // Wed — murmurs
  [dayX(2) - 13, 12], [dayX(2) + 12, 9],
  // Thu — the pattern
  [dayX(3) - 25, 48], [dayX(3) - 12, 92], [dayX(3), 158], [dayX(3) + 13, 66], [dayX(3) + 26, 28],
  // Fri — the diagram, the loudest day
  [dayX(4) - 26, 44], [dayX(4) - 13, 118], [dayX(4), 168], [dayX(4) + 12, 86], [dayX(4) + 25, 36],
  // the weekend tail
  [dayX(5) - 18, 22], [dayX(5), 13], [dayX(5) + 16, 30], [dayX(6) - 12, 17], [dayX(6) + 8, 11],
];

const PULSE_PATH = (() => {
  let d = `M 0 ${PULSE_BASE} L 95 ${PULSE_BASE}`;
  for (const [x, h] of PULSE_SPIKES) {
    d += ` L ${x - 3} ${PULSE_BASE} L ${x} ${PULSE_BASE - h} L ${x + 3} ${PULSE_BASE}`;
  }
  return d + ` L 640 ${PULSE_BASE}`;
})();

const PULSE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const WEEK_OUTCOMES = [
  { day: "Tue", title: "Turned a Jam into a product brief" },
  { day: "Thu", title: "Found a recurring pattern in customer feedback" },
  { day: "Fri", title: "Helped prepare a diagram for the engineering team" },
];

function WeekPulse() {
  return (
    <div className="py-2">
      <svg className="w-full" viewBox="0 0 640 212" aria-label="Activity with Yumi this week">
        {/* the plot grid: one full-height vertical per day, sitting on
            the same centre as its label and its cluster of spikes */}
        {PULSE_DAYS.map((day, i) => (
          <line key={day} x1={dayX(i)} x2={dayX(i)} y1="0" y2={PULSE_BASE} stroke="#f0efee" strokeWidth="1" />
        ))}
        {[60, 120].map((y) => (
          <line key={y} x1="0" x2="640" y1={y} y2={y} stroke="#f0efee" strokeWidth="1" />
        ))}
        <line x1="0" x2="640" y1={PULSE_BASE} y2={PULSE_BASE} stroke="#e7e5e4" strokeWidth="1" />
        <path d={PULSE_PATH} fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round" />
        {PULSE_DAYS.map((day, i) => (
          <text
            key={day}
            x={dayX(i)}
            y="204"
            className="fill-[#a8a29e] font-mono"
            fontSize="9"
            letterSpacing="0.08em"
            textAnchor="middle"
          >
            {day}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ── how Yumi works with Sara (parked on @sara) ───────────────────────── */
// The warm public framing — how they work together, not "what the
// agent knows." Each line carries its evidence summary for the quiet
// "why Yumi thinks this" disclosure; no private messages shown.

const HOW_YUMI_WORKS = [
  {
    point: "Sara prefers diagrams when ideas become complicated.",
    why: "In the last month, Sara asked for a visual four times once a thread passed roughly twenty messages.",
  },
  {
    point: "She likes to begin with concrete examples.",
    why: "Briefs that opened with a real customer quote were the ones Sara approved without edits.",
  },
  {
    point: "She often asks Yumi to preserve the original source material.",
    why: "Sara's most repeated instruction: link the source next to every summary line.",
  },
  {
    point: "Yumi knows which projects and collaborators matter most right now.",
    why: "Spring launch and customer feedback carry most of Sara's recent activity, with Oli and AJ closest to it.",
  },
];

/* ── the affiliate page — ando.so/@sara ───────────────────────────────── */

export function MiniAndoView() {
  return (
    <div className="relative w-full">
      <ProseGrid>
        <ProfileHero />

        <section aria-labelledby="inside-saras-ando" className="pt-16 md:pt-20">
          <ContentHeading id="inside-saras-ando">Inside Sara&apos;s Ando</ContentHeading>
          <Text className="mt-4" color="secondary" size={TextSize.Small}>
            Sara organizes Ando around product, customer feedback, and the people she works with most. Yumi joins her
            Jams and helps turn conversations into decisions.
          </Text>
          {/* two-up media band — breaks out of the prose column where
              the gutters have the room; the landing's long breath
              between prose and media */}
          <div className="relative left-1/2 w-[calc(100vw-40px)] max-w-[888px] -translate-x-1/2 md:w-[calc(100vw-64px)] mt-10 md:mt-12">
            <MiniAndo />
          </div>
        </section>

        {/* the closing — the statement, the invite, and the world
            itself: a dome of rings rising from the page's bottom edge,
            inhabited. Title above, CTA under it, horizon below. */}
        <section
          aria-label="Join Sara"
          className="relative left-1/2 mt-12 flex w-[calc(100vw-40px)] max-w-[888px] -translate-x-1/2 flex-col items-center pt-24 text-center md:mt-16 md:w-[calc(100vw-64px)]"
        >
          <p className="max-w-[420px] font-display text-[30px] leading-[40px] text-text-primary">
            Sara is building her working world in Ando.
          </p>
          <a
            className="mt-6 flex w-fit items-center bg-[#242424] px-4 py-2.5 font-sans text-size-sm tracking-[-0.02em] text-[#fcfcfc] transition-colors ease-fast hover:bg-[#1a1817]"
            href="#"
          >
            Build yours
          </a>
          {/* the horizon — only the dome's crest clears the page edge
              (Figma shows ~220px of sphere); it hugs the CTA at 12px */}
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

/* ── @sara — the parking lot for sections in progress ─────────────────── */

export function SaraArchiveView() {
  return (
    <div className="relative w-full pb-28">
      <ProseGrid items={saraTocItems}>
        <ProfileHero />

        {/* this week with Yumi — the pulse, then the outcomes */}
        <section aria-labelledby="this-week-with-yumi" className="pt-16 md:pt-20">
          <ContentHeading id="this-week-with-yumi">This week with Yumi</ContentHeading>
          <div className="mt-6">
            <WeekPulse />
          </div>
          {/* the outcomes — the exact row grammar of "How Yumi works
              with Sara": plain prose rows on hairline dividers */}
          <ul className="mt-4 flex flex-col divide-y divide-border-subtle">
            {WEEK_OUTCOMES.map((o) => (
              <li key={o.day} className="py-3.5 first:pt-0 last:pb-0">
                <span className="font-sans text-size-sm text-text-primary md:text-size-md">{o.title}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* how Yumi works with Sara — the warm framing */}
        <section aria-labelledby="how-yumi-works" className="pt-20 md:pt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <ContentHeading id="how-yumi-works">How Yumi works with Sara</ContentHeading>
            <Text
              className="flex items-center gap-1.5 rounded-full border border-border-default px-2.5 py-1"
              color="secondary"
              size={TextSize.XS}
            >
              <Avatar src="/avatars/sara.png" size={14} />
              Approved by Sara
            </Text>
          </div>
          <div className="mt-4">
            <ul className="flex flex-col divide-y divide-border-subtle">
              {HOW_YUMI_WORKS.map((item) => (
                <li key={item.point} className="py-3.5 first:pt-0 last:pb-0">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 [&::-webkit-details-marker]:hidden">
                      <span className="font-sans text-size-sm text-text-primary md:text-size-md">{item.point}</span>
                      <Text
                        as="span"
                        className="shrink-0 underline decoration-dotted underline-offset-2 group-open:text-[#2563eb]"
                        color="tertiary"
                        size={TextSize.XS}
                      >
                        why Yumi thinks this
                      </Text>
                    </summary>
                    <Text className="mt-2 rounded-lg bg-surface-subtle px-4 py-3" color="secondary" size={TextSize.XS}>
                      {item.why}{" "}
                      <Text as="span" color="tertiary" size={TextSize.XS}>
                        Summarized from working together — no private messages shown.
                      </Text>
                    </Text>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </ProseGrid>
    </div>
  );
}
