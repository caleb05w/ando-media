// mini ando 2 — presentation explorations for the USE CASES around the
// little computer. The window itself is untouched (a frozen stand-in
// here); what varies is how the use cases are staged and articulated.
//
// The articulation thesis: every use case is personal. Each one is
// written in three registers — the name, what happens, and the piece
// of Sara that Yumi is using — so the copy itself carries the
// "personalized agent" idea without a diagram.

import { Text, TextSize } from "@repo/design-system-ui/text";

import { MiniWorld } from "./mini-world";
import { ObjectRecordPlayer } from "./record-player";

const FG_PRIMARY = "#1a1817";
const STROKE_WEAK = "#f0efee";

/* ── the articulated use cases — shared copy across variations ────────── */

const USE_CASES = [
  {
    title: "Catch up, your way",
    what: "Ask what you missed — Yumi answers in your shape. Sara gets three decisions, not thirty messages.",
    uses: "reading preference",
  },
  {
    title: "Jam → brief",
    what: "Yumi drafts the doc the way Sara writes them: decisions bolded, examples first.",
    uses: "writing style",
  },
  {
    title: "Receipts kept",
    what: "Every summary line links back to its source — Sara's standing rule, kept without asking.",
    uses: "standing rule",
  },
];

/* ── the stand-in window (the real MiniAndo is untouched) ─────────────── */

// The window alone — the real window's proportions (540 × 366), so the
// object explorations can hang it on any ground.
function StandInFrame({ maxW = 480, soft = false }: { maxW?: number; soft?: boolean }) {
  return (
    <div
      className={`flex aspect-[540/366] w-full flex-col overflow-hidden rounded-[12px] bg-white ${
        soft ? "shadow-[0_12px_32px_rgba(28,25,23,0.14)]" : "shadow-[0_18px_40px_rgba(23,68,130,0.28)]"
      }`}
      style={{ maxWidth: maxW }}
    >
        <div className="flex h-[22px] items-center gap-1.5 border-b border-[#e4e2e0] bg-[#ececeb] px-2.5">
          <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
          <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
          <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex h-[28px] items-center gap-[6px] border-b-[0.5px] px-3" style={{ borderColor: STROKE_WEAK }}>
          <span className="text-[10px] leading-none text-[#a8a29e]">#</span>
          <span className="text-[10px] font-medium leading-[14px]" style={{ color: FG_PRIMARY }}>
            general
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-2.5 px-3 py-3">
          <div className="flex items-start gap-[6px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/avatars/sara.png" alt="" className="mt-px size-[14px] max-w-none rounded-full object-cover" />
            <div>
              <p className="text-[9px] font-semibold leading-[12px]" style={{ color: FG_PRIMARY }}>
                Sara Du
              </p>
              <p className="text-[9.5px] leading-[13px] text-[#44403c]">yumi, what did I miss?</p>
            </div>
          </div>
          <div className="flex items-start gap-[6px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/avatars/agent-1.png" alt="" className="mt-px size-[14px] max-w-none rounded-full object-cover" />
            <div>
              <p className="text-[9px] font-semibold leading-[12px] text-[#2563eb]">Yumi</p>
              <p className="text-[9.5px] leading-[13px] text-[#44403c]">
                3 decisions while you were out — pricing v2 is a go.
              </p>
            </div>
          </div>
        </div>
        <div className="m-2 rounded-[8px] border-[0.5px] border-[#dedcda] px-2 pb-1.5 pt-1.5">
        <p className="text-[9px] leading-[12px] text-[#a8a29e]">Enter your message</p>
      </div>
    </div>
  );
}

function StandInWindow() {
  return (
    <div
      className="flex w-full justify-center rounded-[14px] px-6 py-8"
      style={{
        background: "radial-gradient(120% 140% at 18% 12%, #dcecfe 0%, #9cc7fb 45%, #62a4f4 100%)",
      }}
    >
      <StandInFrame />
    </div>
  );
}

function VariationTag({ children }: { children: string }) {
  return (
    <p className="font-mono text-[10px] uppercase leading-4 tracking-[0.18em] text-text-tertiary">{children}</p>
  );
}

/** The "piece of Sara in use" meta line — the articulation's third register. */
function UsesChip({ uses, active = true }: { uses: string; active?: boolean }) {
  return (
    <span
      className={`font-mono text-[9px] uppercase leading-4 tracking-[0.12em] ${active ? "text-[#2563eb]" : "text-text-tertiary"}`}
    >
      uses · {uses}
    </span>
  );
}

/* ── 01 · the rail, fully articulated ─────────────────────────────────── */
// The current side rail, but the active case opens all three registers:
// name → what happens → the piece of Sara in use.
function VariationArticulatedRail() {
  return (
    <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
      <div>
        <VariationTag>Use cases</VariationTag>
        <ul className="mt-1 flex flex-col">
          {USE_CASES.map((u, i) => {
            const active = i === 0;
            return (
              <li key={u.title} className="py-[7px]">
                <p
                  className={`font-sans text-size-sm leading-5 ${
                    active ? "font-medium text-text-primary" : "text-text-tertiary"
                  }`}
                >
                  {u.title}
                </p>
                {active ? (
                  <>
                    <p className="pt-1 font-sans text-size-xs leading-[18px] text-text-secondary">{u.what}</p>
                    <p className="pt-1">
                      <UsesChip uses={u.uses} />
                    </p>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
      <StandInWindow />
    </div>
  );
}

/* ── 02 · tabs over, caption under ────────────────────────────────────── */
// The switcher as a segmented row; the active case's articulation runs
// as one quiet caption line beneath the tabs.
function VariationTabsAndCaption() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center gap-1">
        {USE_CASES.map((u, i) => (
          <span
            key={u.title}
            className={`rounded-full px-3 py-1 font-sans text-size-xs leading-[18px] ${
              i === 0 ? "bg-[#f5f5f4] font-medium text-text-primary" : "text-text-tertiary"
            }`}
          >
            {u.title}
          </span>
        ))}
      </div>
      <Text className="mx-auto max-w-[440px] text-center" color="secondary" size={TextSize.XS}>
        {USE_CASES[0].what}
      </Text>
      <StandInWindow />
    </div>
  );
}

/* ── 03 · film caption under the stage ────────────────────────────────── */
// The window leads; beneath it, the current case as a one-line caption
// with the house index — a slideshow, not a menu.
function VariationFilmCaption() {
  return (
    <div className="flex flex-col gap-3">
      <StandInWindow />
      <div className="flex items-baseline justify-center gap-3">
        <span className="font-mono text-[10px] leading-4 tracking-[0.08em] text-[#2563eb]">01</span>
        <span className="font-sans text-size-sm font-medium leading-5 text-text-primary">{USE_CASES[0].title}</span>
        <span className="font-mono text-[10px] leading-4 tracking-[0.08em] text-text-tertiary">/ 03</span>
      </div>
      <Text className="mx-auto max-w-[440px] text-center" color="secondary" size={TextSize.XS}>
        {USE_CASES[0].what} <UsesChip uses={USE_CASES[0].uses} />
      </Text>
    </div>
  );
}

/* ── 04 · the ledger — all three articulated, one playing ─────────────── */
// Every case stays fully written out in a hairline-ruled ledger under
// the window; the playing one is marked. Nothing hides — the page reads
// as prose even if the motion never plays.
function VariationLedger() {
  return (
    <div className="flex flex-col gap-4">
      <StandInWindow />
      <ul className="flex flex-col divide-y divide-[#f0efee] border-y border-[#f0efee]">
        {USE_CASES.map((u, i) => {
          const active = i === 0;
          return (
            <li key={u.title} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 py-3">
              <div>
                <p
                  className={`font-sans text-size-sm leading-5 ${
                    active ? "font-medium text-text-primary" : "text-text-secondary"
                  }`}
                >
                  {u.title}
                  {active ? (
                    <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#2563eb]">playing</span>
                  ) : null}
                </p>
                <p className="pt-0.5 font-sans text-size-xs leading-[18px] text-text-tertiary">{u.what}</p>
              </div>
              <UsesChip uses={u.uses} active={active} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Sara, by the numbers — iterations ────────────────────────────────── */
// The same five facts as the live bento, restaged. Every variation keeps
// the architectural rule: hairlines, no containers.

const NUMBERS = [
  { label: "Most-said message", value: "“lets gooo”", detail: "214 times this year", face: "serif" },
  { label: "Most-used emojis", value: "🔥 ✅ 😂", detail: "in that order", face: "plain" },
  { label: "Message senders", value: "Top 3%", detail: "of the whole team", face: "mono" },
  { label: "Busiest channel", value: "# product", detail: "1,082 messages", face: "mono" },
  { label: "Words with Yumi", value: "12.4k", detail: "since March", face: "mono" },
] as const;

const numberFace = (face: string, size: "sm" | "lg") =>
  face === "serif"
    ? size === "lg"
      ? "font-display text-[26px] leading-8 text-text-primary"
      : "font-display text-[20px] leading-6 text-text-primary"
    : face === "mono"
      ? size === "lg"
        ? "font-mono text-[24px] leading-8 tabular-nums text-text-primary"
        : "font-mono text-[18px] leading-6 tabular-nums text-text-primary"
      : size === "lg"
        ? "text-[24px] leading-8"
        : "text-[17px] leading-6";

/* ── N1 · the strip — one row, hairline verticals ─────────────────────── */
// The landing stat-strip pattern: five facts shoulder to shoulder on one
// baseline, divided by vertical rules only.
function NumbersStrip() {
  return (
    <div className="grid grid-cols-2 border-y border-[#f0efee] sm:grid-cols-5 sm:divide-x sm:divide-[#f0efee]">
      {NUMBERS.map((n) => (
        <div key={n.label} className="flex flex-col gap-2 px-4 py-5 first:pl-0 last:pr-0">
          <p className="font-mono text-[9px] uppercase leading-4 tracking-[0.16em] text-text-tertiary">{n.label}</p>
          <p className={numberFace(n.face, "sm")}>{n.value}</p>
          <Text as="p" color="tertiary" size={TextSize.XS}>
            {n.detail}
          </Text>
        </div>
      ))}
    </div>
  );
}

/* ── N2 · the ledger — one fact per ruled row ─────────────────────────── */
// The "How Yumi works with Sara" row grammar carrying numbers: label
// left, the figure right, reading down like a table of contents.
function NumbersLedger() {
  return (
    <ul className="flex flex-col divide-y divide-[#f0efee] border-y border-[#f0efee]">
      {NUMBERS.map((n) => (
        <li key={n.label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3.5">
          <p className="font-mono text-[10px] uppercase leading-4 tracking-[0.16em] text-text-tertiary">{n.label}</p>
          <p className="flex items-baseline gap-3">
            <span className={numberFace(n.face, "sm")}>{n.value}</span>
            <Text as="span" color="tertiary" size={TextSize.XS}>
              {n.detail}
            </Text>
          </p>
        </li>
      ))}
    </ul>
  );
}

/* ── N3 · the marquee — one big fact, the rest a caption ──────────────── */
// The wrapped-poster read: the year's phrase set large in the display
// face, everything else one quiet mono line beneath it.
function NumbersMarquee() {
  return (
    <div className="flex flex-col items-center gap-5 border-y border-[#f0efee] py-10 text-center">
      <p className="font-mono text-[9px] uppercase leading-4 tracking-[0.16em] text-text-tertiary">
        Most-said message · 214 times this year
      </p>
      <p className="font-display text-[34px] leading-10 text-text-primary md:text-[42px] md:leading-[48px]">
        &ldquo;lets gooo&rdquo;
      </p>
      <p className="font-mono text-[11px] leading-5 tracking-[0.02em] text-text-secondary">
        🔥 ✅ 😂 · top 3% of senders · # product, 1,082 messages · 12.4k words with Yumi
      </p>
    </div>
  );
}

const NUMBER_VARIATIONS = [
  {
    tag: "n1 · the strip",
    note: "Five facts shoulder to shoulder, vertical rules only — the landing stat strip.",
    render: <NumbersStrip />,
  },
  {
    tag: "n2 · the ledger",
    note: "One fact per ruled row, label left and figure right — reads like a contents page.",
    render: <NumbersLedger />,
  },
  {
    tag: "n3 · the marquee",
    note: "The phrase of the year set large; every other number is one mono caption line.",
    render: <NumbersMarquee />,
  },
];

/* ── use cases as kept objects — intentionality explorations ──────────── */
// The thesis: a thing that has been KEPT — bound, filed, sleeved, hung,
// written down — signals intention in a way no layout can. Each mock
// stages the three use cases as a set of kept objects around the window.

const OBJECT_TITLES = ["Catching up", "Jams into briefs", "The receipts"];

/* ── o1 · the shelf of books ──────────────────────────────────────────── */
// Three cloth-bound volumes stand beside the stage; the one in use is
// pulled. A spine says someone bound this practice on purpose.
function ObjectBooks() {
  const BOOKS = [
    { title: OBJECT_TITLES[0], h: 168, tone: "#2563eb", ink: "#fcfcfc", pulled: true },
    { title: OBJECT_TITLES[1], h: 156, tone: "#e7e1d8", ink: "#57534e", pulled: false },
    { title: OBJECT_TITLES[2], h: 162, tone: "#ddd6cb", ink: "#57534e", pulled: false },
  ];
  return (
    <div className="grid grid-cols-1 items-end gap-10 sm:grid-cols-[auto_minmax(0,1fr)]">
      <div className="justify-self-center sm:justify-self-auto">
        <div className="flex items-end gap-[5px] px-3">
          {BOOKS.map((b) => (
            <div
              key={b.title}
              className={`flex items-center justify-center rounded-[3px] shadow-[inset_0_0_0_0.5px_rgba(28,25,23,0.10),inset_3px_0_4px_rgba(255,255,255,0.25)] ${
                b.pulled ? "-translate-y-2.5" : ""
              }`}
              style={{ background: b.tone, height: b.h, width: 36 }}
            >
              <span
                className="rotate-180 font-display text-[12.5px] tracking-[0.03em]"
                style={{ color: b.ink, writingMode: "vertical-rl" }}
              >
                {b.title}
              </span>
            </div>
          ))}
        </div>
        <div className="h-px bg-[#d6d1c9]" />
        <p className="pt-2.5 text-center font-mono text-[9px] uppercase leading-4 tracking-[0.16em] text-text-tertiary sm:text-left">
          Sara&apos;s practices · vol. 1–3
        </p>
      </div>
      <StandInWindow />
    </div>
  );
}

/* ── o2 · the card catalog ────────────────────────────────────────────── */
// Typed index cards in a drawer, tabbed and dated; the active card is
// raised. Nothing is more intentional than something filed.
function ObjectCards() {
  return (
    <div className="grid grid-cols-1 items-center gap-10 sm:grid-cols-[260px_minmax(0,1fr)]">
      <div className="justify-self-center sm:justify-self-auto">
        <div className="relative h-[158px] w-[248px]">
          {/* the cards behind — only their tabs show */}
          <div className="absolute left-[26px] top-[18px] h-[130px] w-[210px] rotate-[1.5deg] rounded-[6px] border-[0.5px] border-[#ddd8d1] bg-[#fbfaf7]" />
          <div className="absolute left-[14px] top-[10px] h-[136px] w-[216px] rotate-[-1deg] rounded-[6px] border-[0.5px] border-[#ddd8d1] bg-[#fdfcfa]" />
          {/* the card in hand */}
          <div className="absolute left-0 top-0 w-[224px] rounded-[6px] border-[0.5px] border-[#d9d4cc] bg-white shadow-[0_8px_20px_rgba(28,25,23,0.10)]">
            <div className="flex items-baseline justify-between border-b border-[#e9b8b4] px-3 pb-1.5 pt-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#44403c]">01 · Catch up</span>
              <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-text-tertiary">since Mar</span>
            </div>
            <div className="flex flex-col gap-[9px] px-3 pb-3.5 pt-2.5">
              <p className="font-mono text-[9.5px] leading-[13px] text-[#57534e]">Ask Yumi what you missed.</p>
              <p className="font-mono text-[9.5px] leading-[13px] text-[#57534e]">Answers arrive in Sara&apos;s shape.</p>
              <p className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-[#2563eb]">filed · reading preference</p>
            </div>
          </div>
        </div>
        {/* the drawer front */}
        <div className="mt-1 flex h-[40px] w-[248px] items-center justify-center rounded-[6px] bg-[#efeae2] shadow-[inset_0_0_0_0.5px_rgba(28,25,23,0.08)]">
          <span className="rounded-[3px] bg-white px-2 py-[3px] font-mono text-[8px] uppercase tracking-[0.16em] text-[#57534e] shadow-[inset_0_0_0_0.5px_rgba(28,25,23,0.12)]">
            Sara — uses
          </span>
        </div>
      </div>
      <StandInWindow />
    </div>
  );
}

/* ── o3 · the record crate ────────────────────────────────────────────── */
// Sleeves lean in a crate; the chosen one is out, vinyl showing.
// "Now playing" becomes literal and warm instead of demo-like.
function ObjectCrate() {
  return (
    <div className="grid grid-cols-1 items-end gap-10 sm:grid-cols-[auto_minmax(0,1fr)]">
      <div className="flex flex-col items-center gap-4 sm:items-start">
        {/* the sleeve out of the crate, disc peeking */}
        <div className="relative mr-10">
          <div className="absolute -right-9 top-1/2 size-[92px] -translate-y-1/2 rounded-full bg-[#1c1917] shadow-[0_6px_16px_rgba(28,25,23,0.25)]">
            <span className="absolute left-1/2 top-1/2 size-[30px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dcecfe]" />
            <span className="absolute left-1/2 top-1/2 size-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1c1917]" />
          </div>
          <div className="relative flex size-[112px] flex-col justify-between rounded-[2px] bg-[#2563eb] p-2.5 shadow-[inset_0_0_0_0.5px_rgba(28,25,23,0.12)]">
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#bfd7fb]">SD · 01</span>
            <span className="font-display text-[15px] leading-[18px] text-[#fcfcfc]">Catching up</span>
          </div>
        </div>
        {/* the crate with the rest */}
        <div className="flex h-[96px] items-end gap-1.5 rounded-[8px] border-[0.5px] border-[#ddd8d1] bg-[#faf9f7] px-3 pb-0 pt-2">
          <div className="h-[86px] w-[64px] rotate-[-4deg] rounded-t-[2px] bg-[#e7e1d8] shadow-[inset_0_0_0_0.5px_rgba(28,25,23,0.10)]" />
          <div className="h-[80px] w-[64px] rotate-[3deg] rounded-t-[2px] bg-[#ddd6cb] shadow-[inset_0_0_0_0.5px_rgba(28,25,23,0.10)]" />
        </div>
        <p className="font-mono text-[9px] uppercase leading-4 tracking-[0.16em] text-text-tertiary">
          Now playing · Catching up
        </p>
      </div>
      <StandInWindow />
    </div>
  );
}

/* ── o4 · the tokonoma ────────────────────────────────────────────────── */
// An alcove displays ONE thing at a time, surrounded by deliberate
// emptiness. Choosing what to display is the intentionality.
function ObjectTokonoma() {
  return (
    <div className="rounded-[14px] bg-[#faf9f8] px-6 py-16 sm:py-20">
      <div className="mx-auto flex w-full max-w-[380px] flex-col items-center">
        <StandInFrame maxW={340} soft />
        {/* the shelf the object rests on */}
        <div className="mt-6 h-px w-[240px] bg-[#ddd8d1]" />
        <p className="pt-5 text-center font-mono text-[9px] uppercase leading-4 tracking-[0.16em] text-text-secondary">
          01 · Catching up — on display this week
        </p>
      </div>
      <p className="pt-14 text-center font-sans text-size-xs leading-[18px] text-text-tertiary">
        also kept — Jams into briefs · The receipts
      </p>
    </div>
  );
}

/* ── o5 · the museum wall ─────────────────────────────────────────────── */
// The window hung as an exhibit, a placard beside it. Catalog numbers
// frame the mock as an artifact of a real life, curated by someone.
function ObjectMuseum() {
  return (
    <div className="rounded-[14px] bg-[#f4f2ef] px-6 py-12 sm:px-10 sm:py-14">
      <div className="mx-auto flex w-full max-w-[620px] flex-col items-center gap-8 sm:flex-row sm:items-end">
        <StandInFrame maxW={420} soft />
        <div className="w-[190px] shrink-0 border-[0.5px] border-[#ddd8d1] bg-white px-3.5 pb-4 pt-3">
          <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-text-tertiary">No. 01</p>
          <p className="pt-1.5 font-display text-[15px] leading-5 text-text-primary">Catching up</p>
          <p className="pt-2 font-sans text-[11px] leading-[16px] text-text-secondary">
            In daily use since March. Yumi answers in the owner&apos;s shape.
          </p>
          <p className="pt-2 font-mono text-[8.5px] uppercase tracking-[0.12em] text-[#2563eb]">
            uses · reading preference
          </p>
        </div>
      </div>
      <p className="pt-10 text-center font-mono text-[8.5px] uppercase leading-4 tracking-[0.16em] text-text-tertiary">
        No. 02 Jams into briefs · No. 03 The receipts
      </p>
    </div>
  );
}

/* ── o6 · the field notebook ──────────────────────────────────────────── */
// An open notebook beside the stage, the case in Sara's own hand — the
// trigger phrase underlined, notes on the facing page.
function ObjectNotebook() {
  return (
    <div className="grid grid-cols-1 items-center gap-10 sm:grid-cols-[minmax(0,1fr)_auto]">
      <StandInWindow />
      <div className="relative justify-self-center sm:justify-self-auto">
        {/* pages beneath the open spread */}
        <div className="absolute -bottom-1 left-1 h-full w-[288px] rounded-[8px] border-[0.5px] border-[#e2dccf] bg-[#fbf8f1]" />
        <div className="absolute -bottom-0.5 left-0.5 h-full w-[288px] rounded-[8px] border-[0.5px] border-[#e2dccf] bg-[#fdfbf6]" />
        {/* the open spread */}
        <div className="relative grid w-[288px] grid-cols-2 rounded-[8px] border-[0.5px] border-[#ddd6c6] bg-[#fffdf8] shadow-[0_10px_24px_rgba(28,25,23,0.10)]">
          <div className="border-r-[0.5px] border-[#eae4d6] px-3.5 pb-4 pt-3.5">
            <p className="font-display text-[14px] italic leading-[18px] text-[#44403c]">Catching up</p>
            <svg aria-hidden className="mt-1 h-[5px] w-[64px]" viewBox="0 0 64 5">
              <path d="M1 3 C 12 1, 22 5, 33 3 S 54 1, 63 3" fill="none" stroke="#b8b0a0" strokeLinecap="round" strokeWidth="1" />
            </svg>
            <p className="pt-3 font-mono text-[9px] leading-[14px] text-[#78716c]">&ldquo;yumi, what did I miss?&rdquo;</p>
            <p className="pt-3 font-sans text-[9.5px] italic leading-[14px] text-[#a8a29e]">every morning, first thing</p>
          </div>
          <div className="flex flex-col gap-2.5 px-3.5 pb-4 pt-4">
            {["three decisions, not thirty", "answers shaped like mine", "sources stay linked"].map((line) => (
              <p key={line} className="border-b-[0.5px] border-[#eae4d6] pb-1 font-sans text-[9.5px] leading-[13px] text-[#57534e]">
                — {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const OBJECT_VARIATIONS = [
  {
    tag: "o1 · the shelf of books",
    note: "Three bound volumes, the one in use pulled — a spine says someone bound this on purpose.",
    render: <ObjectBooks />,
  },
  {
    tag: "o2 · the card catalog",
    note: "Typed, tabbed, dated, filed — bureaucratic-tender proof of practice.",
    render: <ObjectCards />,
  },
  {
    tag: "o3 · the record crate",
    note: "Sleeves in a crate, the chosen one on the player — now playing, literally.",
    render: <ObjectCrate />,
  },
  {
    tag: "o3b · the record player, played",
    note: "Interactive: the world does not exist until you put a record on. Choosing is the gesture.",
    render: <ObjectRecordPlayer />,
  },
  {
    tag: "o4 · the tokonoma",
    note: "One case on display, the rest withheld — restraint as the signal of intent.",
    render: <ObjectTokonoma />,
  },
  {
    tag: "o5 · the museum wall",
    note: "The window hung as an exhibit with its placard — catalogued from a real life.",
    render: <ObjectMuseum />,
  },
  {
    tag: "o6 · the field notebook",
    note: "The case in Sara's own hand — trigger phrase underlined, notes on the facing page.",
    render: <ObjectNotebook />,
  },
];

/* ── the shelf ────────────────────────────────────────────────────────── */

const VARIATIONS = [
  {
    tag: "01 · the rail, fully articulated",
    note: "The active case opens all three registers: name, what happens, the piece of Sara in use.",
    render: <VariationArticulatedRail />,
  },
  {
    tag: "02 · tabs over, caption under",
    note: "Switcher as a segmented row; the articulation runs as one caption line.",
    render: <VariationTabsAndCaption />,
  },
  {
    tag: "03 · film caption",
    note: "The window leads; the case is captioned beneath like a slide — a show, not a menu.",
    render: <VariationFilmCaption />,
  },
  {
    tag: "04 · the ledger",
    note: "All three cases stay written out in a ruled list; the playing one is marked.",
    render: <VariationLedger />,
  },
];

export function MiniAndo2Explorations() {
  return (
    <div className="content-frame w-full pb-28">
      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-16 pt-16">
        <header className="flex flex-col gap-3">
          <Text as="h1" size={TextSize.Large} weight="medium">
            Use cases — presentation explorations
          </Text>
          <Text className="max-w-[560px]" color="secondary" size={TextSize.Small}>
            The window stays as-is; what varies is how the use cases around it are staged and articulated. Each
            case is written in three registers — the name, what happens, and the piece of Sara that Yumi is
            using — so the copy itself says &ldquo;personalized.&rdquo;
          </Text>
        </header>

        {VARIATIONS.map((v) => (
          <section key={v.tag} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <VariationTag>{v.tag}</VariationTag>
              <Text as="span" color="tertiary" size={TextSize.XS}>
                {v.note}
              </Text>
            </div>
            {v.render}
          </section>
        ))}

        <header className="flex flex-col gap-3 border-t border-[#f0efee] pt-16">
          <Text as="h2" size={TextSize.Large} weight="medium">
            Sara, by the numbers — iterations
          </Text>
          <Text className="max-w-[560px]" color="secondary" size={TextSize.Small}>
            The live bento&apos;s five facts, restaged. Same architectural rule throughout: hairlines, no
            containers.
          </Text>
        </header>

        {NUMBER_VARIATIONS.map((v) => (
          <section key={v.tag} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <VariationTag>{v.tag}</VariationTag>
              <Text as="span" color="tertiary" size={TextSize.XS}>
                {v.note}
              </Text>
            </div>
            {v.render}
          </section>
        ))}

        <header className="flex flex-col gap-3 border-t border-[#f0efee] pt-16">
          <Text as="h2" size={TextSize.Large} weight="medium">
            Use cases as kept objects
          </Text>
          <Text className="max-w-[560px]" color="secondary" size={TextSize.Small}>
            A thing that has been kept — bound, filed, sleeved, hung, written down — signals intention in a way
            no layout can. Six stagings of the three use cases as objects around the window.
          </Text>
        </header>

        {OBJECT_VARIATIONS.map((v) => (
          <section key={v.tag} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <VariationTag>{v.tag}</VariationTag>
              <Text as="span" color="tertiary" size={TextSize.XS}>
                {v.note}
              </Text>
            </div>
            {v.render}
          </section>
        ))}

        <header className="flex flex-col gap-3 border-t border-[#f0efee] pt-16">
          <Text as="h2" size={TextSize.Large} weight="medium">
            The mini world
          </Text>
          <Text className="max-w-[560px]" color="secondary" size={TextSize.Small}>
            The stage as a place, not a backdrop: a floor meets the sky at a horizon and the window stands on
            it, casting a shadow. The use cases are times of day — choosing one moves the light.
          </Text>
        </header>

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <VariationTag>w1 · a day in the world</VariationTag>
            <Text as="span" color="tertiary" size={TextSize.XS}>
              Dawn to catch up, noon for the brief, dusk for the receipts — the light is the switch.
            </Text>
          </div>
          <MiniWorld />
        </section>
      </div>
    </div>
  );
}
