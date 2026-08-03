"use client";

// The bird's-eye view of every card, plus the two things that always travel
// with it: the ambient wash the glass cards refract against, and the overlay a
// reference card opens into.
//
// Shared surface — /slack-sync-cards renders it as a tab, /caleb-slides as a
// full-page slide — so it lives here rather than inside either route.

import { useEffect } from "react";
import { CARDS, INSIGHT_CARDS, CardView, type CardDef } from "./cards";

/** The live track is the insight cards. The Wrapped deck stays in the grid as
    reference (it opens in the overlay, not the carousel), and archived cards
    keep their own dimmed section below it. */
export const DECK = INSIGHT_CARDS;
export const WRAPPED = CARDS.filter((c) => !c.archived);
export const ARCHIVED = CARDS.filter((c) => c.archived);

const CARD_W = 400;
const CARD_H = 531;
const GRID_SCALE = 0.62;

const GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] justify-items-center gap-x-6 gap-y-10";

/** Leaves the tile untouched at rest; archived tiles come back to full colour
    on hover. Kept as whole class strings so the two transition shorthands
    never end up on the same element. */
const THUMB_PLAIN =
  "block cursor-pointer transition-transform ease-fast hover:-translate-y-1";
const THUMB_DIMMED =
  "block cursor-pointer opacity-55 grayscale-[0.35] transition-[opacity,transform,filter] ease-fast hover:-translate-y-1 hover:opacity-100 hover:grayscale-0";

export function AmbientWash() {
  return (
    <>
      {/* Ambient wash — the cards are glass (38% white over a 28px backdrop
          blur), so they need something behind them to refract. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(60% 55% at 22% 18%, #f3ece1 0%, transparent 70%)",
            "radial-gradient(55% 50% at 82% 26%, #cfd9cb 0%, transparent 72%)",
            "radial-gradient(70% 60% at 68% 88%, #b9c6cd 0%, transparent 75%)",
            "radial-gradient(50% 45% at 12% 82%, #e3d9c6 0%, transparent 70%)",
          ].join(","),
        }}
      />
      {/* Figma applies a NOISE effect alongside the background blur. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <p className="shrink-0 text-[10px] leading-[14px] font-medium tracking-[1px] text-[#58524e] uppercase">
        {children}
      </p>
      <div className="h-[0.5px] flex-1 bg-[#58524e]/25" />
    </div>
  );
}

/** A full-size card drawn at grid scale. The button is sized to the scaled
    box while the card inside keeps its real 400×531 geometry, so nothing in
    CardView has to know it's being shown small. */
function Thumb({
  card,
  position,
  showFunFact,
  hideCounter = false,
  dimmed = false,
  onClick,
  title,
}: {
  card: CardDef;
  position: number;
  showFunFact?: boolean;
  hideCounter?: boolean;
  dimmed?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={dimmed ? THUMB_DIMMED : THUMB_PLAIN}
      style={{ width: CARD_W * GRID_SCALE, height: CARD_H * GRID_SCALE }}
    >
      <div
        className="relative origin-top-left"
        style={{
          width: CARD_W,
          height: CARD_H,
          transform: `scale(${GRID_SCALE})`,
        }}
      >
        <CardView
          card={card}
          position={position}
          total={DECK.length}
          showFunFact={showFunFact}
          asThumbnail
          hideCounter={hideCounter}
        />
      </div>
    </button>
  );
}

function Caption({
  title,
  node,
  muted = false,
}: {
  title: string;
  node: string;
  muted?: boolean;
}) {
  return (
    <div className="max-w-[248px] text-center">
      <p
        className={`text-[12px] leading-[16px] ${muted ? "text-[#58524e]" : "text-[#1a1817]"}`}
      >
        {title}
      </p>
      <p className="mt-[2px] font-mono text-[10px] leading-[14px] text-[#8a827b]">
        {node}
      </p>
    </div>
  );
}

/** The grid itself, with no scroll container of its own — the caller decides
    what it sits in (a tab pane here, a full-page slide there). */
export function ShowAllCards({
  funFacts,
  onOpenInsight,
  onPreview,
}: {
  funFacts: Record<string, boolean>;
  /** Insight tiles jump into the running order at that index. */
  onOpenInsight: (index: number) => void;
  /** Everything else has no slot in the order, so it opens in place. */
  onPreview: (card: CardDef) => void;
}) {
  return (
    <div className="mx-auto max-w-[1240px]">
      <SectionLabel>Insight cards</SectionLabel>
      <div className={GRID}>
        {DECK.map((card, i) => (
          <div key={card.id} className="flex flex-col items-center gap-3">
            <Thumb
              card={card}
              position={i + 1}
              showFunFact={funFacts[card.id]}
              onClick={() => onOpenInsight(i)}
              title={`Open ${card.name}`}
            />
            <Caption title={`${i + 1}. ${card.name}`} node={card.node} />
          </div>
        ))}
      </div>

      {/* The retired Wrapped deck — reference, not the running order. Full
          colour, but tiles open the overlay rather than the carousel. */}
      <div className="mt-16">
        <SectionLabel>Wrapped deck</SectionLabel>
        <div className={GRID}>
          {WRAPPED.map((card) => (
            <div key={card.id} className="flex flex-col items-center gap-3">
              <Thumb
                card={card}
                position={0}
                showFunFact={funFacts[card.id]}
                hideCounter
                onClick={() => onPreview(card)}
                title={`Preview ${card.name}`}
              />
              <Caption title={card.name} node={card.node} muted />
            </div>
          ))}
        </div>
      </div>

      {ARCHIVED.length > 0 && (
        <div className="mt-16">
          <SectionLabel>Archived</SectionLabel>
          <div className={GRID}>
            {ARCHIVED.map((card) => (
              <div key={card.id} className="flex flex-col items-center gap-3">
                <Thumb
                  card={card}
                  position={0}
                  showFunFact={funFacts[card.id]}
                  hideCounter
                  dimmed
                  onClick={() => onPreview(card)}
                  title={`Open ${card.name}`}
                />
                <Caption title={card.name} node={card.node} muted />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** A single card blown back up to full size over a dimmed page, with the note
    explaining why it isn't in the running order. */
export function CardPreview({
  card,
  showFunFact,
  onToggleFunFact,
  onClose,
}: {
  card: CardDef;
  showFunFact?: boolean;
  onToggleFunFact: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      /* Fixed, not absolute: the page root grows past the viewport when the
         grid is long, so an absolute overlay would centre off-screen. */
      className="fixed inset-0 z-20 flex items-center justify-center gap-[40px] bg-[#1a1817]/25 px-8 backdrop-blur-[6px]"
      onClick={onClose}
      role="presentation"
    >
      {/* Stop the card itself from dismissing; the backdrop and Esc do. */}
      <div
        className="relative h-[531px] w-[400px] max-w-full shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <CardView
          card={card}
          position={0}
          total={DECK.length}
          showFunFact={showFunFact}
          onToggleFunFact={onToggleFunFact}
          hideCounter
          className="deck-in-next"
        />
      </div>

      <div
        className="w-[300px] shrink-0 text-[#f3ece1]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] leading-[14px] font-medium tracking-[1px] uppercase opacity-70">
          {card.archived ? "Archived" : "Wrapped deck"}
        </p>
        <p className="mt-[6px] text-[18px] leading-[1.2] font-medium">
          {card.name}
        </p>
        {card.archivedNote ? (
          <p className="mt-[12px] text-[13px] leading-[19px] opacity-80">
            {card.archivedNote}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="mt-[20px] rounded-full bg-[#f3ece1] px-[16px] py-[8px] text-[12px] leading-[16px] text-[#1a1817] transition-opacity ease-fast hover:opacity-85"
        >
          Close
        </button>
      </div>
    </div>
  );
}
