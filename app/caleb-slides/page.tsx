"use client";

// /caleb-slides — a showcase deck.
//
// The running order is every insight card, one per slide, closing on the
// bird's-eye grid of the whole set. Slides ride the same direction-aware swap
// the insight deck uses (deck-in-* / deck-out-* in globals.css): both the
// outgoing and incoming slide stay mounted through a change, so the slide
// travels rather than the frame sitting still while its contents swap.
//
// Left/right arrows move between slides. The grid slide is a full-page scroll
// pane — it takes focus when it lands, so up/down scroll it while left/right
// keep moving the deck.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CardView,
  ownAnimationEnd,
  type CardDef,
} from "../slack-sync-cards/cards";
import {
  AmbientWash,
  CardPreview,
  DECK,
  ShowAllCards,
} from "../slack-sync-cards/show-all";
import {
  ChannelWelcome,
  DmWelcome,
  FitFrame,
  OauthBefore,
  OauthConnect,
} from "./ando-mockups";

type Slide =
  | { kind: "card"; card: CardDef; position: number }
  | { kind: "all" }
  /** A fixed-size app frame, scaled down to fit the stage. */
  | {
      kind: "mock";
      name: string;
      width: number;
      height: number;
      render: () => React.ReactNode;
    };

const SLIDES: Slide[] = [
  ...DECK.map((card, i) => ({ kind: "card" as const, card, position: i + 1 })),
  { kind: "all" as const },
  {
    kind: "mock",
    name: "Channel welcome",
    width: 1110,
    height: 861,
    render: () => <ChannelWelcome />,
  },
  {
    kind: "mock",
    name: "DM welcome",
    width: 1110,
    height: 813,
    render: () => <DmWelcome />,
  },
  {
    kind: "mock",
    name: "OAuth handoff — before",
    width: 1512,
    height: 861,
    render: () => <OauthBefore />,
  },
  {
    kind: "mock",
    name: "OAuth handoff",
    width: 1512,
    height: 861,
    render: () => <OauthConnect />,
  },
];

type DeckState = {
  index: number;
  /** The slide on its way out, still mounted so the swap can cross. */
  leaving: number | null;
  dir: 1 | -1;
};

export default function CalebSlidesPage() {
  const [deck, setDeck] = useState<DeckState>({
    index: 0,
    leaving: null,
    dir: 1,
  });
  const [funFacts, setFunFacts] = useState<Record<string, boolean>>({});
  /* Wrapped and archived cards have no slot in the running order, so they open
     in place rather than becoming slides. */
  const [preview, setPreview] = useState<CardDef | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleFunFact = useCallback((id: string) => {
    setFunFacts((f) => ({ ...f, [id]: !f[id] }));
  }, []);

  const go = useCallback((delta: 1 | -1) => {
    setDeck((s) => {
      const next = Math.min(Math.max(s.index + delta, 0), SLIDES.length - 1);
      if (next === s.index) return s;
      return { index: next, leaving: s.index, dir: delta };
    });
  }, []);

  /* The overlay owns the keyboard while it's up — Esc closes it there. */
  useEffect(() => {
    if (preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, preview]);

  /* Without focus the grid pane can't be scrolled from the keyboard, and the
     window has nowhere else useful to put it on this page. */
  const current = SLIDES[deck.index];
  useEffect(() => {
    if (current.kind === "all" && !preview) {
      scrollRef.current?.focus({ preventScroll: true });
    }
  }, [current, preview]);

  const suffix = deck.dir === 1 ? "next" : "prev";

  const renderSlide = (i: number, leaving: boolean) => {
    const slide = SLIDES[i];
    const anim = leaving ? `deck-out-${suffix}` : `deck-in-${suffix}`;
    const retire = leaving
      ? ownAnimationEnd(() => setDeck((s) => ({ ...s, leaving: null })))
      : undefined;

    if (slide.kind === "mock") {
      return (
        <div
          key={`${leaving ? "leaving" : "current"}-${i}`}
          className={`absolute inset-0 p-8 ${anim}`}
          onAnimationEnd={retire}
        >
          <FitFrame width={slide.width} height={slide.height}>
            <div className="overflow-hidden rounded-[12px] shadow-[0px_0px_0px_1px_rgba(81,76,71,0.12),0px_20px_24px_-4px_rgba(22,25,29,0.08)]">
              {slide.render()}
            </div>
          </FitFrame>
        </div>
      );
    }

    if (slide.kind === "card") {
      return (
        <div
          key={`${leaving ? "leaving" : "current"}-${i}`}
          className="absolute inset-0 flex items-center justify-center px-8"
        >
          <div className="relative h-[531px] w-[400px] max-w-full">
            <CardView
              card={slide.card}
              position={slide.position}
              total={DECK.length}
              showFunFact={funFacts[slide.card.id]}
              onToggleFunFact={() => toggleFunFact(slide.card.id)}
              className={anim}
              onAnimationEnd={retire}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        key={`${leaving ? "leaving" : "current"}-${i}`}
        /* Only the live pane takes the ref — a leaving copy would steal it. */
        ref={leaving ? undefined : scrollRef}
        tabIndex={-1}
        className={`absolute inset-0 overflow-y-auto px-8 pb-16 outline-none ${anim}`}
        onAnimationEnd={retire}
      >
        <ShowAllCards
          funFacts={funFacts}
          onOpenInsight={(target) =>
            setDeck((s) =>
              target === s.index
                ? s
                : { index: target, leaving: s.index, dir: -1 }
            )
          }
          onPreview={(card) => setPreview(card)}
        />
      </div>
    );
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#dfdcd4]">
      <AmbientWash />

      {/* The stage clips the swap so a travelling slide never widens the page. */}
      <div className="relative z-10 flex-1 overflow-hidden">
        {deck.leaving !== null && renderSlide(deck.leaving, true)}
        {renderSlide(deck.index, false)}
      </div>

      {preview && (
        <CardPreview
          card={preview}
          showFunFact={funFacts[preview.id]}
          onToggleFunFact={() => toggleFunFact(preview.id)}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
