"use client";

// Sara, by the numbers — as the same card language as the sync deck.
// One card at a time on the bare page (no wash, no band): tab through
// with the arrows or by clicking the card, and the swap crosses the way
// the sync deck's does. Fun facts still open in place.
//
// Shelved: this drum was /affiliate's "What Sara's up to" section; the
// page carries its numbers as the hero's quiet stat row now.

import { useState } from "react";

import type { CSSProperties } from "react";

import { CardView, GlyphQuiet, GlyphTyping, GlyphVolley, type CardDef } from "../slack-sync-cards/cards";

/* Drawings in the deck's square vocabulary, each one saying what its
   stat says. Two come straight from the sync deck; the rest are built
   from the same 21px squares and glyph classes. */

/* Top sender — the team's squares light up and go quiet again; Sara's,
   standing above the row, never dims. */
const GlyphTopSender = (
  <div className="flex items-end gap-[12px]">
    {[0, 2].map((i) => (
      <div
        key={i}
        className="stat-crowd size-[14px] shrink-0 bg-[#2563eb]"
        style={{ "--i": i } as CSSProperties}
      />
    ))}
    <div className="-translate-y-[8px] size-[21px] shrink-0 bg-[#2563eb]" />
    {[3, 1].map((i) => (
      <div
        key={i}
        className="stat-crowd size-[14px] shrink-0 bg-[#2563eb]"
        style={{ "--i": i } as CSSProperties}
      />
    ))}
  </div>
);

/* Reactions — the emojis themselves, stamped on in rhythm the way a
   reaction row fills under a message. */
const GlyphReactions = (
  <div className="flex items-center gap-[12px]">
    {["🔥", "✅", "😂"].map((e, i) => (
      <span
        key={e}
        className="stat-react block text-[22px] leading-none"
        style={{ "--i": i } as CSSProperties}
      >
        {e}
      </span>
    ))}
  </div>
);

// Same grammar as the sync deck: drawing + header + body copy, nothing
// else on the card.
const NUMBER_CARDS: CardDef[] = [
  {
    id: "most-said",
    node: "new",
    name: "Most-said message",
    // a message mid-type — the indicator that precedes every "lets gooo"
    glyph: <Poster>{GlyphTyping}</Poster>,
    headline: "“lets gooo” — 214 times.",
    body: ["Sara’s most-said message this year. The o count varies."],
  },
  {
    id: "emojis",
    node: "new",
    name: "Most-used emojis",
    // reactions stamped under a message, one after another
    glyph: <Poster>{GlyphReactions}</Poster>,
    headline: "Fire, check, tears.",
    body: ["Her most-used emojis, in exactly that order."],
  },
  {
    id: "senders",
    node: "new",
    name: "Message senders",
    // one figure standing above the crowd
    glyph: <Poster>{GlyphTopSender}</Poster>,
    headline: "Top 3% of message senders.",
    body: ["Of the whole team. Sara shows up — the numbers agree."],
  },
  {
    id: "channel",
    node: "new",
    name: "Busiest channel",
    // the sync deck's own busiest-channel drawing: the grid lights up,
    // most of it goes quiet, the lived-in channels stay
    glyph: <Poster>{GlyphQuiet}</Poster>,
    headline: "# product is her busiest channel.",
    body: ["1,082 messages this year."],
  },
  {
    id: "words",
    node: "new",
    name: "Words with Yumi",
    // the volley — question and answer landing almost together
    glyph: <Poster>{GlyphVolley}</Poster>,
    headline: "12.4k words with Yumi.",
    body: ["Since March — briefs, patterns, and receipts."],
  },
];

// Solid white faces — on the dark stage the deck's 38%-glass ground
// would go murky, so the cards opt out of the glass. No shadow: the
// cards are drawn in vertical strips, and each strip casting its own
// would read as banding.
const CARD_FRAME = "!bg-white !backdrop-blur-none";

// The edge falloff, outermost band strongest: [blur px, mask fade stop %].
const EDGE_BLUR_BANDS: [number, number][] = [
  [2, 100],
  [6, 72],
  [13, 48],
  [24, 28],
  [36, 14],
];

/** Poster scale: the drawing grows toward the card's middle register. */
function Poster({ children }: { children: React.ReactNode }) {
  return <div className="scale-[1.9]">{children}</div>;
}

function Chevron({ flip = false }: { flip?: boolean }) {
  return (
    <svg aria-hidden className={flip ? "rotate-180" : ""} height="10" viewBox="0 0 6 10" width="6">
      <path d="M1 1l4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}

/* ── the drum ─────────────────────────────────────────────────────────── */
// The cards are not flat planes: each one is drawn in vertical strips
// placed on a real cylinder, so its surface visibly bends. The five
// stations close a FULL circle — the far side's cards show their blank
// backs through the ring — and the drum's rotation is continuous, so
// stepping around never teleports anything.

const CARD_W = 400;
const CARD_H = 531;
const N_STRIPS = 6;
// Ten stations close the circle with the cards tight against each
// other; the five stats each appear twice, 180° apart, so the same
// card never shows on the front side twice at once.
const N_STATIONS = 10;
const CARD_ARC = 32; // degrees of drum each card wraps around
const CARD_STEP = 36; // 10 stations × 36° = the full circle
const STRIP_W = CARD_W / N_STRIPS;
const RADIUS = CARD_W / (2 * Math.sin(((CARD_ARC / 2) * Math.PI) / 180));

export function NumbersDeck() {
  // pos is unbounded — the drum's total rotation, in stations. The
  // facing card is pos mod 5.
  const [pos, setPos] = useState(0);
  const [funFacts, setFunFacts] = useState<Record<string, boolean>>({});
  const total = NUMBER_CARDS.length;
  const station = ((pos % N_STATIONS) + N_STATIONS) % N_STATIONS;
  const index = station % total;

  const go = (dir: 1 | -1) => setPos((n) => n + dir);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full">
        <div className="relative h-[470px] w-full overflow-hidden" style={{ perspective: "1600px" }}>
          {/* the drum's hub — everything hangs off this point in 3D,
              scaled down as one object so the neighbours' neighbours
              peek in at the edges */}
          <div
            className="absolute inset-0"
            style={{ transform: `scale3d(0.8, 0.8, 0.8) translateZ(${-RADIUS + 70}px)`, transformStyle: "preserve-3d" }}
          >
            {Array.from({ length: N_STATIONS }, (_, st) => {
              const card = NUMBER_CARDS[st % total];
              // this station's signed offset from the facing one
              let rel = st - station;
              if (rel > N_STATIONS / 2) rel -= N_STATIONS;
              if (rel < -N_STATIONS / 2) rel += N_STATIONS;
              const centre = rel === 0;
              // faces on the drum's far side are invisible (their backs
              // show instead) — skip their card content entirely
              const faceLive = Math.abs(rel) <= 2;
              return Array.from({ length: N_STRIPS }, (_, strip) => {
                // station angle minus the drum's continuous rotation
                const phi = (st - pos) * CARD_STEP + (strip - (N_STRIPS - 1) / 2) * (CARD_ARC / N_STRIPS);
                const stripEdges = `${strip === 0 ? "border-l" : ""} ${strip === N_STRIPS - 1 ? "border-r" : ""}`;
                return (
                  <div key={`${st}-${strip}`} style={{ display: "contents" }}>
                    {/* the face */}
                    <div
                      className={`absolute left-1/2 top-1/2 cursor-pointer overflow-hidden border-y border-border-default bg-white ${stripEdges} transition-transform duration-300 ease-fast motion-reduce:transition-none`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("button")) return;
                        setPos((n) => n + (centre ? 1 : rel));
                      }}
                      style={{
                        backfaceVisibility: "hidden",
                        height: CARD_H,
                        margin: `${-CARD_H / 2}px 0 0 ${-(STRIP_W + 2.5) / 2}px`,
                        transform: `rotateY(${phi}deg) translateZ(${RADIUS}px)`,
                        width: STRIP_W + 2.5,
                        willChange: "transform",
                      }}
                    >
                      {/* the full card, shifted so this strip shows its slice */}
                      {faceLive ? (
                        <div
                          className="relative"
                          style={{ height: CARD_H, transform: `translateX(${-strip * STRIP_W}px)`, width: CARD_W }}
                        >
                          <CardView
                            card={card}
                            className={CARD_FRAME}
                            onToggleFunFact={
                              centre ? () => setFunFacts((f) => ({ ...f, [card.id]: !f[card.id] })) : undefined
                            }
                            position={(st % total) + 1}
                            showFunFact={funFacts[card.id]}
                            total={total}
                          />
                        </div>
                      ) : null}
                    </div>
                    {/* the back — a blank plate, visible when the card is
                        on the drum's far side */}
                    <div
                      className={`pointer-events-none absolute left-1/2 top-1/2 border-y border-border-subtle bg-surface-primary ${stripEdges} transition-transform duration-300 ease-fast motion-reduce:transition-none`}
                      style={{
                        backfaceVisibility: "hidden",
                        height: CARD_H,
                        margin: `${-CARD_H / 2}px 0 0 ${-(STRIP_W + 2.5) / 2}px`,
                        transform: `rotateY(${phi}deg) translateZ(${RADIUS}px) rotateY(180deg)`,
                        width: STRIP_W + 2.5,
                        willChange: "transform",
                      }}
                    />
                  </div>
                );
              });
            })}
          </div>
          {/* the frame's focus falls off progressively — three masked
              blur bands per side, each stronger and tighter to the
              edge, so the falloff reads as a lens rather than a step */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[24%]">
            {EDGE_BLUR_BANDS.map(([blur, stop]) => (
              <div
                key={blur}
                className="absolute inset-0"
                style={{
                  backdropFilter: `blur(${blur}px)`,
                  maskImage: `linear-gradient(to right, black, transparent ${stop}%)`,
                  WebkitMaskImage: `linear-gradient(to right, black, transparent ${stop}%)`,
                }}
              />
            ))}
            {/* and the light takes over — the cards fade into the page */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0) 75%)" }}
            />
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[24%]">
            {EDGE_BLUR_BANDS.map(([blur, stop]) => (
              <div
                key={blur}
                className="absolute inset-0"
                style={{
                  backdropFilter: `blur(${blur}px)`,
                  maskImage: `linear-gradient(to left, black, transparent ${stop}%)`,
                  WebkitMaskImage: `linear-gradient(to left, black, transparent ${stop}%)`,
                }}
              />
            ))}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to left, rgba(255,255,255,0.95), rgba(255,255,255,0) 75%)" }}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          aria-label="Previous card"
          className="flex size-8 items-center justify-center rounded-full border border-border-subtle text-text-secondary transition-colors duration-200 ease-fast hover:bg-surface-subtle hover:text-text-primary"
          onClick={() => go(-1)}
          type="button"
        >
          <Chevron flip />
        </button>
        <span className="font-mono text-[10px] leading-4 tracking-[0.08em] text-text-tertiary tabular-nums">
          {index + 1} / {total}
        </span>
        <button
          aria-label="Next card"
          className="flex size-8 items-center justify-center rounded-full border border-border-subtle text-text-secondary transition-colors duration-200 ease-fast hover:bg-surface-subtle hover:text-text-primary"
          onClick={() => go(1)}
          type="button"
        >
          <Chevron />
        </button>
      </div>
    </div>
  );
}
