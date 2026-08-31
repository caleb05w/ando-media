// The uses — Ando's day, printed small enough to keep. Four pieces of
// working-world ephemera after the Japanese print references: the
// resident agent's meishi, a pharmacy card for the morning catch-up,
// a recipe card for jam → brief, and a sachet label for the receipts.
// Each card is one use case in the members' own words; the caption
// under each card names it, gallery-style. Ink on white, one quiet
// colour per card, no motion.

const CARD =
  "flex h-full flex-col rounded-[6px] bg-white p-4 shadow-[0_0_0_0.5px_rgba(22,25,29,0.1),0_1px_3px_rgba(22,25,29,0.06)] transition-shadow duration-200 ease-fast hover:shadow-[0_0_0_0.5px_rgba(22,25,29,0.1),0_8px_24px_rgba(22,25,29,0.14)]";
const EYEBROW = "font-mono text-[8px] uppercase leading-3 tracking-[0.08em] text-text-tertiary";
const MICRO = "font-mono text-[9px] leading-4 tracking-[0.02em] text-text-secondary";

/** A dotted leader row — the recipe card's ingredient grammar. */
function Leader({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={MICRO}>{label}</span>
      <span aria-hidden className="mb-[3px] flex-1 border-b border-dotted border-[#d3d3cf]" />
      <span className={MICRO}>{value}</span>
    </span>
  );
}

/** A redacted contact row — the meishi's mail · web · tel grammar. */
function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className={`${EYEBROW} w-7 shrink-0`}>{label}</span>
      <span aria-hidden className={`${MICRO} select-none blur-[3px]`}>
        {value}
      </span>
    </span>
  );
}

/** The agent's mark — the speech-bubble smiley, cut in ink. */
function AgentGlyph() {
  return (
    <svg aria-hidden className="h-14 w-14" fill="none" viewBox="0 0 48 48">
      <rect height="29" rx="9" stroke="#1a1817" strokeWidth="2.5" width="38" x="5" y="5" />
      <path d="M14 33.5 L10.5 42 L21 33.5" fill="#fff" stroke="#1a1817" strokeLinejoin="round" strokeWidth="2.5" />
      <circle cx="18.5" cy="16.5" fill="#1a1817" r="2" />
      <circle cx="29.5" cy="16.5" fill="#1a1817" r="2" />
      <path d="M16.5 23.5 q7.5 7 15 0" stroke="#1a1817" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  );
}

/* ── the four cards ───────────────────────────────────────────────────── */

function MeishiCard() {
  return (
    <div className={CARD}>
      <span className="flex items-baseline justify-between">
        <span className={EYEBROW}>Meishi</span>
        <span className={EYEBROW}>Nº 001</span>
      </span>
      <span className="flex flex-1 items-center justify-center py-3">
        <AgentGlyph />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className={EYEBROW}>Resident agent</span>
        <span className="font-display text-[17px] leading-6 text-text-primary">Yumi</span>
        <span className={`${MICRO} text-text-tertiary`}>@yumi</span>
      </span>
      <span className="mt-3 flex flex-col gap-1 border-t-[0.5px] border-border-subtle pt-2.5">
        <ContactRow label="mail" value="yumi@ando.so" />
        <ContactRow label="web" value="ando.so/@yumi" />
        <ContactRow label="tel" value="always around" />
      </span>
    </div>
  );
}

// The cross spells the errand: catch, filled while you slept.
const CROSS_TILES: (string | null)[] = [null, "c", null, "a", "t", "c", null, "h", null];

function PharmacyCard() {
  return (
    <div className={CARD}>
      <span className="flex items-baseline justify-between">
        <span className={EYEBROW}>Pharmacy</span>
        <span className={EYEBROW}>8:04 am</span>
      </span>
      <span className="flex flex-1 items-center justify-center py-3">
        <span className="grid grid-cols-3 gap-[3px]">
          {CROSS_TILES.map((letter, i) =>
            letter === null ? (
              <span className="size-7" key={i} />
            ) : (
              <span
                className="flex size-7 items-center justify-center bg-[#2fc355] font-mono text-[12px] lowercase leading-none text-white"
                key={i}
              >
                {letter}
              </span>
            ),
          )}
        </span>
      </span>
      <span className="flex flex-col gap-1 border-t-[0.5px] border-border-subtle pt-2.5">
        <Leader label="asked" value="“what did I miss?”" />
        <Leader label="filled" value="3 decisions" />
        <Leader label="refills" value="every morning" />
      </span>
    </div>
  );
}

function RecipeCard() {
  return (
    <div className={CARD}>
      <span className="flex items-baseline justify-between">
        <span className="font-display text-[15px] leading-5 text-text-primary">Jam → Brief</span>
        <span className={EYEBROW}>Nº 12</span>
      </span>
      <span className="mt-2.5 flex flex-col gap-1 border-t-[0.5px] border-border-subtle pt-2.5">
        <Leader label="voice jam" value="22 min" />
        <Leader label="people" value="4" />
        <Leader label="decisions" value="3" />
        <Leader label="receipts" value="all" />
      </span>
      <span className="mt-auto flex flex-col gap-1 pt-3">
        <span className={EYEBROW}>Method</span>
        <span className="font-display text-[11px] leading-4 text-text-secondary">
          Shake well in #design. Strain onto one page, decisions bolded. Serve before the standup.
        </span>
      </span>
    </div>
  );
}

function SachetCard() {
  return (
    <div className={CARD}>
      <span className="flex items-baseline justify-between">
        <span className={EYEBROW}>#7055 · Special</span>
        <span className={EYEBROW}>120g</span>
      </span>
      <span className="flex flex-1 items-center justify-center py-3">
        <span className="size-10 rounded-full bg-[#e3a7ab]" />
      </span>
      <span className="flex flex-col items-center gap-0.5 text-center">
        <span className="font-display text-[17px] leading-6 text-text-primary">Receipts</span>
        <span className={`${MICRO} text-text-tertiary`}>kept · 1,204</span>
      </span>
      <span className="mt-3 border-t-[0.5px] border-border-subtle pt-2.5 text-center">
        <span className={EYEBROW}>every line links back to its source</span>
      </span>
    </div>
  );
}

/* ── the shelf of four ────────────────────────────────────────────────── */

const CARDS: { id: string; caption: string; card: React.ReactNode }[] = [
  { id: "meishi", caption: "an agent on staff", card: <MeishiCard /> },
  { id: "pharmacy", caption: "catch up in seconds", card: <PharmacyCard /> },
  { id: "recipe", caption: "jam → brief", card: <RecipeCard /> },
  { id: "sachet", caption: "the receipts, kept", card: <SachetCard /> },
];

export function UseCards() {
  return (
    <ul className="relative left-1/2 grid w-[calc(100vw-40px)] max-w-[888px] -translate-x-1/2 grid-cols-2 gap-x-4 gap-y-6 md:w-[calc(100vw-64px)] lg:grid-cols-4">
      {CARDS.map((entry) => (
        <li className="mx-auto flex w-full max-w-[224px] flex-col gap-2.5" key={entry.id}>
          <div className="aspect-[55/86]">{entry.card}</div>
          <p className="text-center font-mono text-[9px] uppercase leading-4 tracking-[0.08em] text-text-tertiary">
            {entry.caption}
          </p>
        </li>
      ))}
    </ul>
  );
}
