"use client";

// Card definitions for the post-sync "Wrapped" deck (Figma: July Sprints).
//
// The Figma canvas holds 14 frames but only 7 distinct cards — the rest are
// duplicates and alternate treatments. Each entry below records the node it
// came from so the grid view can trace back.
//
// The frames drift on vertical rhythm (some justify-between, some
// justify-center) and on headline scale (20px regular / 22px / 24px medium).
// CardView normalises both: a fixed top slot, an optically centred middle, and
// a fixed bottom slot, so a headline lands at the same height on every card.

import type { CSSProperties, ReactNode } from "react";

/* ---------------------------------- icons --------------------------------- */
// Exact path data exported from the Figma components, recoloured to
// currentColor so they inherit the card's foreground token.

export function IconEyeOpen() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2.66667C10.5861 2.66669 13.1053 4.21271 14.7876 7.165C15.0826 7.68267 15.0826 8.31733 14.7876 8.83507C13.1053 11.7873 10.5861 13.3333 8 13.3333C5.41395 13.3333 2.89477 11.7873 1.21246 8.83493C0.91746 8.31727 0.91746 7.6826 1.21246 7.16493C2.89477 4.21264 5.41395 2.66665 8 2.66667ZM5.58335 8C5.58335 6.66531 6.66533 5.58333 8 5.58333C9.33473 5.58333 10.4167 6.66531 10.4167 8C10.4167 9.33467 9.33473 10.4167 8 10.4167C6.66533 10.4167 5.58335 9.33467 5.58335 8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconEyeClosed() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.86423 5.42426C4.37645 3.81637 6.20021 3.03501 8.00007 3.03499C9.79987 3.03498 11.6236 3.8163 13.1358 5.42414C13.325 5.62529 13.6414 5.63499 13.8425 5.4458C14.0437 5.25661 14.0534 4.94018 13.8642 4.73903C12.1829 2.95139 10.1034 2.03498 8 2.03499C5.8966 2.03501 3.8171 2.95147 2.13578 4.73916C1.94659 4.94031 1.95629 5.25675 2.15745 5.44593C2.35861 5.63512 2.67504 5.62541 2.86423 5.42426Z"
        fill="currentColor"
      />
      <path
        d="M2.86423 8.3374C2.67504 8.13627 2.3586 8.12653 2.15745 8.31573C1.95629 8.50493 1.94659 8.82133 2.13578 9.02247C2.97181 9.9114 3.90629 10.5849 4.89321 11.0374L4.07211 12.3961C3.92928 12.6325 4.00509 12.9398 4.24143 13.0827C4.47776 13.2255 4.78513 13.1497 4.92796 12.9133L5.84259 11.3999C6.38655 11.5673 6.9414 11.6707 7.50007 11.7093V13.5C7.50007 13.7761 7.72387 14 8.00007 14C8.2762 14 8.50007 13.7761 8.50007 13.5V11.7093C9.0152 11.6737 9.52713 11.5829 10.0303 11.4378L11.0914 12.9429C11.2505 13.1685 11.5625 13.2225 11.7881 13.0634C12.0139 12.9043 12.0678 12.5923 11.9087 12.3666L11.0041 11.0836C12.0289 10.6313 12.9993 9.9422 13.8642 9.02247C14.0534 8.82133 14.0437 8.50493 13.8425 8.31573C13.6414 8.12653 13.325 8.13627 13.1358 8.3374C11.6235 9.94527 9.7998 10.7266 8 10.7266C6.20018 10.7266 4.37643 9.94527 2.86423 8.3374Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconArrowLeftRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.7156 11.9916C14.1712 11.536 14.1712 10.7973 13.7156 10.3417L11.5203 8.14647C11.3251 7.9512 11.0085 7.9512 10.8132 8.14647C10.6179 8.34173 10.6179 8.65827 10.8132 8.85353L12.6263 10.6667H2.5001C2.22396 10.6667 2.0001 10.8905 2.0001 11.1667C2.0001 11.4428 2.22396 11.6667 2.5001 11.6667H12.6263L10.8132 13.4798C10.6179 13.6751 10.6179 13.9916 10.8132 14.1869C11.0085 14.3821 11.3251 14.3821 11.5203 14.1869L13.7156 11.9916ZM14.0001 4.83333C14.0001 4.55719 13.7763 4.33333 13.5001 4.33333H3.37387L5.18699 2.52022C5.38225 2.32496 5.38225 2.00837 5.18699 1.81311C4.99173 1.61785 4.67514 1.61785 4.47988 1.81311L2.28462 4.00837C1.82901 4.46399 1.82901 5.20268 2.28462 5.65829L4.47988 7.85353C4.67514 8.0488 4.99173 8.0488 5.18699 7.85353C5.38225 7.65827 5.38225 7.34173 5.18699 7.14647L3.37387 5.33333H13.5001C13.7763 5.33333 14.0001 5.10947 14.0001 4.83333Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* --------------------------------- glyphs --------------------------------- */
// One vocabulary across the deck: 21px squares in the selected-stroke blue,
// dimmed to 40% when a card is about absence.

function Sq({ dim }: { dim?: boolean }) {
  return (
    <div className={`size-[21px] shrink-0 bg-[#2563eb] ${dim ? "opacity-40" : ""}`} />
  );
}

const GlyphOne = (
  <Sq />
);

/* Cold open — three squares bouncing, the way a typing indicator does. */
const GlyphTyping = (
  <div className="flex items-center gap-[12px]">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="glyph-type size-[21px] shrink-0 bg-[#2563eb]"
        style={{ "--i": i } as CSSProperties}
      />
    ))}
  </div>
);

/* Agents used — each square sits at a different point in the palette cycle,
   so the four read as four distinct agents rather than one block.
   The animation itself is on DialKit: curve and duration come from an easing
   control, and the five palette stops feed the keyframe through CSS variables.
   Layout stays in Tailwind — only the motion is editable. */
const GlyphQuad = (
  <div className="flex flex-col gap-[12px]">
    {[
      [0, 1],
      [2, 3],
    ].map((row, r) => (
      <div key={r} className="flex items-center gap-[12px]">
        {row.map((i) => (
          <div
            key={i}
            className="glyph-cycle size-[21px] shrink-0"
            // --i drives this square's slot in the stagger; the interval
            // itself is a dialled variable, so CSS does the multiplication.
            style={{ "--i": i } as CSSProperties}
          />
        ))}
      </div>
    ))}
  </div>
);

/* Delegation — the main square fires two smaller ones out to their slots.
   Each --shoot-from is the distance back to the main square's centre, so both
   launch from the same point: 21px main + 12px gap + 14px square puts their
   centres 29.5px and 55.5px away. */
const GlyphSplit = (
  <div className="flex items-center gap-[12px]">
    <div className="size-[21px] shrink-0 bg-[#2563eb]" />
    <div
      className="glyph-shoot size-[14px] shrink-0 bg-[#2563eb]"
      style={{ "--shoot-from": "-29.5px", "--i": 0 } as CSSProperties}
    />
    <div
      className="glyph-shoot size-[14px] shrink-0 bg-[#2563eb]"
      style={{ "--shoot-from": "-55.5px", "--i": 1 } as CSSProperties}
    />
  </div>
);

/* Context switching — the pair keeps trading places. */
const GlyphSwitch = (
  <div className="flex items-center gap-[12px] text-[#1a1817]">
    <div className="glyph-swap-l size-[21px] shrink-0 bg-[#2563eb]" />
    <IconArrowLeftRight />
    <div className="glyph-swap-r size-[21px] shrink-0 bg-[#2563eb]" />
  </div>
);

/* Ghosted — full brand blue, a shudder, then it dims out. */
const GlyphAbsent = <div className="glyph-ghost size-[21px] shrink-0 bg-[#2563eb]" />;

/* Cover — one square drifting the palette, to introduce the colour language. */
const GlyphDrift = <div className="glyph-cycle size-[21px] shrink-0 bg-[#2563eb]" />;

/* Celebration — the sync landed. The core square gathers itself, pops, and
   throws four smaller squares out like confetti; they tumble as they fade.
   Each bit's flight is its own vector (--cx/--cy/--cr), all launched from the
   core's centre on the same beat the pop lands. */
const CHEER_BITS = [
  { x: "-30px", y: "-26px", r: "-135deg" },
  { x: "28px", y: "-30px", r: "120deg" },
  { x: "-26px", y: "24px", r: "-100deg" },
  { x: "30px", y: "22px", r: "150deg" },
];
const GlyphCelebrate = (
  <div className="relative">
    <div className="glyph-cheer-core size-[21px] shrink-0 bg-[#2563eb]" />
    {CHEER_BITS.map((b, i) => (
      <div
        key={i}
        className="glyph-cheer-bit absolute left-1/2 top-1/2 -ml-[5px] -mt-[5px] size-[10px] bg-[#2563eb]"
        style={{ "--cx": b.x, "--cy": b.y, "--cr": b.r } as CSSProperties}
      />
    ))}
  </div>
);

/* Person — a lit seat beside one that hasn't been claimed yet. The empty seat
   breathes: present, waiting, not off. */
const GlyphInvite = (
  <div className="flex items-center gap-[12px]">
    <Sq />
    <div
      className="glyph-breathe size-[21px] shrink-0 bg-[#2563eb]"
      style={{ "--i": 0 } as CSSProperties}
    />
  </div>
);

/* Latest message — four squares go dark in sequence; the fifth never does. */
const GlyphLightsOut = (
  <div className="flex items-center gap-[12px]">
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        className="glyph-lightsout size-[21px] shrink-0 bg-[#2563eb]"
        style={{ "--i": i } as CSSProperties}
      />
    ))}
    <div className="size-[21px] shrink-0 bg-[#2563eb]" />
  </div>
);

/* Reply latency — the answer lands almost on top of the question. */
const GlyphVolley = (
  <div className="flex items-center gap-[12px]">
    {[0, 1].map((i) => (
      <div
        key={i}
        className="glyph-volley size-[21px] shrink-0 bg-[#2563eb]"
        style={{ "--i": i } as CSSProperties}
      />
    ))}
  </div>
);

/* Joined but never spoke — twelve channels light up, ten go quiet again.
   The two you actually talk in carry no animation, so they simply stay. */
const SPOKEN_IN = new Set([3, 8]);
const GlyphQuiet = (
  <div className="grid grid-cols-6 gap-[8px]">
    {Array.from({ length: 12 }, (_, i) =>
      SPOKEN_IN.has(i) ? (
        <div key={i} className="size-[12px] shrink-0 bg-[#2563eb]" />
      ) : (
        <div
          key={i}
          className="glyph-quiet size-[12px] shrink-0 bg-[#2563eb]"
          style={{ "--i": i } as CSSProperties}
        />
      ),
    )}
  </div>
);

/* The repeat question — the same message, stamped in again and again. Each
   square slams down (oversized, then pressed flat), the row fills in rhythm,
   and then it clears in the same order it arrived — a queue that never learns.
   The delay stagger does both ends: later squares land later and leave later. */
const GlyphStamp = (
  <div className="flex items-center gap-[12px]">
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="glyph-stamp size-[21px] shrink-0 bg-[#2563eb]"
        style={{ "--i": i } as CSSProperties}
      />
    ))}
  </div>
);

/* Ending — a settled 2×2 block, breathing in a slow wave. Nothing arrives,
   nothing leaves: the sync is done and everything is where it lives now. */
const GlyphSettled = (
  <div className="grid grid-cols-2 gap-[12px]">
    {[0, 1, 3, 2].map((i, slot) => (
      <div
        key={slot}
        className="glyph-breathe size-[21px] shrink-0 bg-[#2563eb]"
        // Clockwise wave: the stagger order walks the grid corner by corner.
        style={{ "--i": i } as CSSProperties}
      />
    ))}
  </div>
);

/* After hours — a week of squares; the weekend two never settle. */
const GlyphAfterHours = (
  <div className="flex items-end gap-[8px]">
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} className="size-[14px] shrink-0 bg-[#2563eb] opacity-[0.22]" />
    ))}
    {[0, 1].map((i) => (
      <div
        key={`w${i}`}
        className="glyph-breathe size-[14px] shrink-0 bg-[#2563eb]"
        style={{ "--i": i } as CSSProperties}
      />
    ))}
  </div>
);

/* ------------------------------- definitions ------------------------------ */

export type CardDef = {
  id: string;
  /** Figma node this card is built from. */
  node: string;
  /** Working name, from the section headers in Figma. */
  name: string;
  overline?: string;
  glyph?: ReactNode;
  /** Small label sitting directly above the headline. */
  eyebrow?: string;
  headline: string;
  body?: string[];
  funFact?: string;
  /** Action pill in the bottom slot — insight cards end on a verb. */
  cta?: string;
  /** Divider-separated points. Gives several lines of copy room to breathe
      instead of stacking them as one dense paragraph. */
  stats?: string[];
  /** Drops the headline to 18px, for cards carrying a lot below it. */
  compactHeadline?: boolean;
  /** The cover is a title card, not a numbered step in the deck. */
  hideCounter?: boolean;
  /** Kept for reference but out of the deck — the stat isn't derivable from
      the Slack Web API. See archivedNote for the specific reason. */
  archived?: boolean;
  /** Why it's out. Shown when the card is opened from the archive. */
  archivedNote?: string;
};

export const CARDS: CardDef[] = [
  {
    id: "cover",
    node: "new",
    name: "Cover",
    overline: "Congrats on your Slack retirement!",
    glyph: GlyphDrift,
    eyebrow: "Your Slack archetype",
    headline: "Air-Traffic Controller",
    body: ["You never sent the most messages. You just made sure everyone else’s landed."],
    hideCounter: true,
  },
  {
    id: "cold-open",
    node: "18375:158",
    name: "The cold open",
    glyph: GlyphTyping,
    headline: "You sent 2,847 messages.",
    body: [
      "Across 14 synced channels, from March 3 to June 1. Most of them didn’t need you specifically.",
    ],
    funFact: "That’s enough Slack to fill 3 Lord of the Ring books",
  },
  {
    id: "agents",
    node: "18377:29201",
    name: "Agents used",
    glyph: GlyphQuad,
    headline: "You worked with 4 Slack agents.",
    body: [
      "Two AI agents, plus two automations doing their best. Imagine four that actually knew your work.",
    ],
  },
  {
    id: "never-spoke",
    node: "new",
    name: "Joined but never spoke",
    glyph: GlyphQuiet,
    headline: "You’re in 47 channels. You’ve spoken in 6.",
    body: [
      "The other 41 just needed somewhere to put you. An agent can sit in all 47 and speak in the 6.",
    ],
  },
  {
    id: "reply-latency",
    node: "new",
    name: "Reply latency",
    glyph: GlyphVolley,
    headline: "You replied in under two minutes, 61% of the time.",
    body: [
      "Fast is a kind of availability. An agent can be available so that you don’t have to be.",
    ],
  },
  {
    id: "after-hours",
    node: "new",
    name: "After hours",
    glyph: GlyphAfterHours,
    headline: "31% of your messages happened after hours.",
    body: [
      "Evenings, weekends, and one memorable Sunday. None of it needed to happen while you were awake.",
    ],
  },
  {
    id: "latest-message",
    node: "new",
    name: "Latest message",
    glyph: GlyphLightsOut,
    headline: "Your latest message was 2:14am.",
    body: ["March 9. An agent would have closed it by 2:15."],
    funFact: "41 of your messages were sent after midnight.",
  },
  {
    id: "delegation",
    node: "18393:24",
    name: "Delegation behavior",
    archived: true,
    archivedNote:
      "Slack has no concept of a piece of work, an assignment, or a completion. “68% delegatable” would be an LLM judging message content — no Web API method returns anything close.",
    glyph: GlyphSplit,
    headline: "You delegated 23 pieces of work.",
    stats: [
      "Mostly research and writing. Almost never follow-up.",
      "68% of your work was delegatable.",
      "You actually delegated 23%. That leaves a 45-point opportunity.",
    ],
    // "Optional joke" from this card's spec block on the canvas.
    funFact: "You did the work of 1.7 people. Both were you.",
  },
  {
    id: "slack-age",
    node: "18400:41",
    name: "Slack age",
    glyph: GlyphOne,
    headline: "You Slack like a 26-year-old.",
    body: [
      "Short messages. Fast follow-ups. Punctuation optional. Your agents learn to write like this.",
    ],
  },
  {
    id: "context-switching",
    node: "18401:38",
    name: "Context switching",
    archived: true,
    archivedNote:
      "Member analytics has no per-message channel, so this needs full conversations.history — rate-limited to ~1 request/min for new apps. And it would only count messages sent, never the reading that context switching actually consists of.",
    glyph: GlyphSwitch,
    headline: "You switched channels 6.4 times an hour.",
    body: ["Your attention had more tabs than your browser."],
  },
  {
    id: "ghosted",
    node: "18401:91",
    name: "Ghosted",
    archived: true,
    archivedNote:
      "Cut from the running order: the deck already ends on a forward-looking note, and a card about being ignored lands badly right before one about moving in. Kept because the stat is real and the glyph is the best in the set.",
    glyph: GlyphAbsent,
    headline: "You were ghosted 17 times.",
    body: [
      "You asked a question. Nobody ever replied.",
      "There was no agent in the room. There is now.",
    ],
  },
  {
    id: "share",
    node: "18401:133",
    name: "Final share card",
    archived: true,
    archivedNote:
      "Cut from the running order: it's a share artifact, not an insight — it summarises the deck rather than telling you something new, and its four stat rows still carry placeholder Xs.",
    headline: "After X hours of Slacking, I’m finally retiring",
    compactHeadline: true,
    // Archetype and the funny line now open the deck on the cover card, so
    // they're deliberately absent here.
    stats: [
      "X agent score before Ando",
      "23% actually delegated",
      "11 active messaging hours",
      "Slack age: 26",
    ],
  },
];

/* ----------------------------- insight track ------------------------------ */
// The live carousel. Where the Wrapped deck looks backward (what your Slack
// was), these look forward — every stat is exact and already computed at sync
// time, and every card except the overview ends on a verb.

export const INSIGHT_CARDS: CardDef[] = [
  {
    id: "overview",
    node: "new",
    name: "Overview",
    glyph: GlyphCelebrate,
    headline: "Your Slack made it.",
    body: ["48,392 messages, 23 channels, 247 custom emoji. Zero left behind."],
  },
  {
    id: "connect-linear",
    node: "new",
    name: "Connect an app",
    glyph: GlyphSwitch,
    headline: "You mentioned Linear 214 times.",
    body: ["Connect it and agents can read and update those issues."],
    // cta: "Connect Linear",
  },
  {
    id: "invite-sara",
    node: "new",
    name: "Person",
    glyph: GlyphTyping,
    headline: "Sara Du sent over 1,200 messages.",
    body: ["That’s a lot. If they’re not here yet, you should invite them!"],
    // cta: "Invite Sara",
  },
  {
    id: "repeat-question",
    node: "new",
    name: "The repeat question",
    glyph: GlyphStamp,
    headline: "The same question got asked 34 times.",
    body: [
      "“Where’s the staging login?” An agent learns the answer once and never gets tired of giving it.",
    ],
    // cta: "Teach an agent",
  },
  {
    id: "busiest-agent",
    node: "new",
    name: "Busiest channel",
    glyph: GlyphQuiet,
    headline: "#engineering is your busiest channel — 8,200 messages.",
    body: ["Add an agent to keep up with it."],
    // cta: "Add an agent",
  },
  {
    id: "wrap",
    node: "new",
    name: "Ending",
    glyph: GlyphSettled,
    headline: "You’re all moved in.",
    body: ["48,392 messages have made a new home."],
    // cta: "Meet your agents",
  },
];

/* -------------------------------- card view ------------------------------- */

const OVERLINE =
  "w-full text-center text-[10px] font-medium leading-[14px] tracking-[1px] uppercase";

/** Softens the fun fact's clip edge. The 10px matches the trailing padding on
    the text, so a fully-open row fades over the padding and not the words. */
const FADE_EDGE = "linear-gradient(to bottom, #000 calc(100% - 10px), transparent 100%)";

export function CardView({
  card,
  position,
  total,
  showFunFact,
  onToggleFunFact,
  className = "",
  onAnimationEnd,
  asThumbnail = false,
  hideCounter = false,
}: {
  card: CardDef;
  position: number;
  total: number;
  showFunFact?: boolean;
  onToggleFunFact?: () => void;
  className?: string;
  onAnimationEnd?: () => void;
  /** Grid tiles are wrapped in their own button, so the fun-fact control has
      to render as static markup — a button inside a button is invalid HTML. */
  asThumbnail?: boolean;
  /** Archived cards have no position in the deck, so they show no number. */
  hideCounter?: boolean;
}) {
  // The stat list is a general treatment now, so headline scale is its own
  // flag rather than being inferred from the presence of stats.
  const compact = Boolean(card.compactHeadline);

  return (
    <div
      onAnimationEnd={onAnimationEnd}
      className={`absolute inset-0 flex flex-col items-center rounded-[8px] bg-white/[0.38] px-[64px] pt-[32px] pb-[24px] backdrop-blur-[28px] ${className}`}
    >
      {/* Fixed top slot keeps the middle optically centred whether or not a
          card carries an overline. */}
      <div className="h-[14px] w-full shrink-0">
        {card.overline ? (
          <p className={`${OVERLINE} text-[#1a1817]`}>{card.overline}</p>
        ) : null}
      </div>

      {/* Cards carrying a stat list need the glyph closer in — 48px of air plus
          three divided points doesn't fit the middle slot. */}
      <div
        className={`flex w-full flex-1 flex-col items-center justify-center ${
          card.stats ? "gap-[28px]" : "gap-[48px]"
        }`}
      >
        {card.glyph ? <div className="shrink-0">{card.glyph}</div> : null}
        <div className="flex w-full flex-col gap-[12px]">
          {card.eyebrow ? (
            <p className={`${OVERLINE} text-[#78716c]`}>{card.eyebrow}</p>
          ) : null}
          <p
            className={`w-full text-center font-medium leading-[1.2] text-[#1a1817] ${
              compact ? "text-[18px]" : "text-[24px]"
            }`}
          >
            {card.headline}
          </p>
          {card.body?.map((line) => (
            <p
              key={line}
              className="w-full text-center text-[14px] leading-[20px] text-[#78716c]"
            >
              {line}
            </p>
          ))}
        </div>
        {card.stats ? (
          <div className="flex w-full flex-col">
            {card.stats.map((stat, i) => (
              <div key={stat} className="w-full">
                {i > 0 ? (
                  <div className="px-[32px] py-[10px]">
                    <div className="h-[0.5px] w-full bg-[#58524e]" />
                  </div>
                ) : null}
                <p className="w-full text-center text-[14px] leading-[20px] text-[#58524e]">
                  {stat}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Fixed bottom slot, mirroring the top. */}
      <div className="min-h-[16px] w-full shrink-0">
        {card.cta ? (
          <div className="flex w-full justify-center">
            {asThumbnail ? (
              /* Grid tiles are buttons themselves — render the pill inert. */
              <div className="rounded-full bg-[#1a1817] px-[16px] py-[8px] text-[12px] leading-[16px] text-white">
                {card.cta}
              </div>
            ) : (
              <button
                type="button"
                className="rounded-full bg-[#1a1817] px-[16px] py-[8px] text-[12px] leading-[16px] text-white transition-opacity ease-fast hover:opacity-85"
              >
                {card.cta}
              </button>
            )}
          </div>
        ) : null}
        {card.funFact ? (
          <div className="flex w-full flex-col gap-[12px]">
            {asThumbnail ? (
              <div className="flex w-full items-center justify-center gap-[8px] text-[12px] leading-[16px] text-[#1a1817]">
                {showFunFact ? <IconEyeOpen /> : <IconEyeClosed />}
                <span className="whitespace-nowrap">Fun fact</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onToggleFunFact}
                aria-expanded={Boolean(showFunFact)}
                className="flex w-full items-center justify-center gap-[8px] text-[12px] leading-[16px] text-[#1a1817] transition-opacity ease-fast hover:opacity-70"
              >
                {showFunFact ? <IconEyeOpen /> : <IconEyeClosed />}
                <span className="whitespace-nowrap">Fun fact</span>
              </button>
            )}
            {/* Two channels, the way the chip stack does it: the slot opens
                (the grid row), then the fact arrives into it.

                The clip edge is masked with a gradient so the line fades out
                where it's cut instead of being sliced mid-glyph. The trailing
                padding below the text is what makes that safe: the fade is
                anchored to the wrapper's bottom, so once the row is fully open
                it lands on the padding and leaves the text at full strength. */}
            <div
              className={`grid transition-[grid-template-rows] duration-[280ms] ease-fast ${
                showFunFact ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div
                className="overflow-hidden"
                style={{
                  maskImage: FADE_EDGE,
                  WebkitMaskImage: FADE_EDGE,
                }}
              >
                <p
                  className={`w-full pb-[10px] text-center text-[12px] leading-[16px] text-[#1a1817] transition-opacity duration-200 ${
                    showFunFact ? "funfact-arrive" : "opacity-0"
                  }`}
                >
                  {card.funFact}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Top-left, sitting above the overline. Still absolutely placed so it
          never steals height from a card's layout — and moving it up leaves the
          bottom slot entirely to the fun fact. */}
      {card.hideCounter || hideCounter ? null : (
        <div className="absolute inset-x-0 top-0 px-[24px] py-[12px]">
          <p className="text-[10px] leading-[16px] text-[#58524e]">
            {position}/{total}
          </p>
        </div>
      )}
    </div>
  );
}
