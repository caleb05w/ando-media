"use client";

// /slack-sync-cards — the post-sync "Wrapped" deck, built from July Sprints.
//
//   Deck            one card at a time; left/right arrows move between them.
//                   Both the outgoing and incoming card stay mounted during a
//                   swap so the whole card travels rather than the shell
//                   sitting still while its contents change.
//   Show all cards  bird's-eye grid of every card at 0.62 scale, captioned
//                   with the Figma node each one came from.
//
// Card content and the shared card shell live in ./cards.

import { useCallback, useEffect, useState } from "react";
// DialKit is parked while the deck is presented clean — see layout.tsx, where
// <DialRoot /> is commented out alongside this.
// import { useDialKit, type TransitionConfig } from "dialkit";
import { CARDS, INSIGHT_CARDS, CardView, type CardDef } from "./cards";
import {
  AmbientWash,
  CardPreview,
  DECK,
  ShowAllCards,
} from "./show-all";

/** CSS `animation-timing-function` can't express a spring, so a spring from the
    control's Physics tab falls back to the committed curve. */
// function motion(curve: TransitionConfig, fallbackSeconds: number) {
//   return curve.type === "easing"
//     ? {
//         duration: `${curve.duration}s`,
//         ease: `cubic-bezier(${curve.ease.join(", ")})`,
//       }
//     : { duration: `${fallbackSeconds}s`, ease: "cubic-bezier(0.2, 0, 0, 1)" };
// }

type Tab = "deck" | "shuffle" | "all";

type DeckState = {
  index: number;
  /** The card on its way out, still mounted so the swap can cross. */
  leaving: number | null;
  dir: 1 | -1;
};

/** The shuffle tab's pool: both decks, minus anything archived. */
const SHUFFLE_POOL = [...INSIGHT_CARDS, ...CARDS.filter((c) => !c.archived)];

/** How long each card holds before the shuffle tab advances. */
const SHUFFLE_INTERVAL_MS = 7000;

function shuffledIndexes(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export default function SlackSyncCardsPage() {
  const [tab, setTab] = useState<Tab>("deck");
  const [deck, setDeck] = useState<DeckState>({ index: 0, leaving: null, dir: 1 });
  const [shuffle, setShuffle] = useState<DeckState>({ index: 0, leaving: null, dir: 1 });
  /* Identity order until the tab is opened: shuffling belongs to the client
     clock, so it never happens during render (see the phase-lock rule). */
  const [order, setOrder] = useState<number[]>(() =>
    SHUFFLE_POOL.map((_, i) => i)
  );
  const [funFacts, setFunFacts] = useState<Record<string, boolean>>({});
  /* Archived cards have no slot in the running order, so they open in place
     rather than jumping into the deck. */
  const [preview, setPreview] = useState<CardDef | null>(null);

  /* DialKit is parked. The panel published these values as CSS variables on
     the page root; without it the committed defaults in globals.css hold —
     they are the same numbers the dials were seeded with.

  const dials = useDialKit("Glyph animations", {
    typing: {
      // 0.84s of bounce + ~1s of rest. See the glyph-type keyframe.
      curve: { type: "easing", duration: 1.84, ease: [0.2, 0, 0, 1] },
      stagger: [0.16, 0, 1, 0.01],
    },
    agents: {
      curve: { type: "easing", duration: 8, ease: [0.2, 0, 0, 1] },
      stagger: [1.6, 0, 6, 0.1],
    },
    swap: { curve: { type: "easing", duration: 3.2, ease: [0.2, 0, 0, 1] } },
    ghosted: { curve: { type: "easing", duration: 4.5, ease: [0.2, 0, 0, 1] } },
    palette: {
      color1: { type: "color", default: "#2563eb" },
      color2: { type: "color", default: "#6b8fea" },
      color3: { type: "color", default: "#7d8a66" },
      color4: { type: "color", default: "#ebdc85" },
      color5: { type: "color", default: "#6c9fc4" },
    },
  });

  const typing = motion(dials.typing.curve, 1.84);
  const agents = motion(dials.agents.curve, 8);
  const swap = motion(dials.swap.curve, 3.2);
  const ghosted = motion(dials.ghosted.curve, 4.5);

  const dialVars = {
    "--glyph-type-duration": typing.duration,
    "--glyph-type-ease": typing.ease,
    "--glyph-type-stagger": `${dials.typing.stagger}s`,
    "--glyph-cycle-duration": agents.duration,
    "--glyph-cycle-ease": agents.ease,
    "--glyph-cycle-stagger": `${dials.agents.stagger}s`,
    "--glyph-swap-duration": swap.duration,
    "--glyph-swap-ease": swap.ease,
    "--glyph-ghost-duration": ghosted.duration,
    "--glyph-ghost-ease": ghosted.ease,
    "--glyph-c1": dials.palette.color1,
    "--glyph-c2": dials.palette.color2,
    "--glyph-c3": dials.palette.color3,
    "--glyph-c4": dials.palette.color4,
    "--glyph-c5": dials.palette.color5,
  } as CSSProperties;
  */

  const toggleFunFact = useCallback((id: string) => {
    setFunFacts((f) => ({ ...f, [id]: !f[id] }));
  }, []);

  const go = useCallback(
    (delta: 1 | -1) => {
      const step = (length: number) => (s: DeckState) => {
        const next = Math.min(Math.max(s.index + delta, 0), length - 1);
        if (next === s.index) return s;
        return { index: next, leaving: s.index, dir: delta };
      };
      if (tab === "shuffle") setShuffle(step(SHUFFLE_POOL.length));
      else setDeck(step(DECK.length));
    },
    [tab]
  );

  /* Entering the shuffle tab deals a fresh order and starts from the top.
     Client-only by construction: the tab can't be active during hydration. */
  useEffect(() => {
    if (tab !== "shuffle") return;
    setOrder(shuffledIndexes(SHUFFLE_POOL.length));
    setShuffle({ index: 0, leaving: null, dir: 1 });
  }, [tab]);

  /* Autoplay — every 7s the shuffle deck advances, wrapping back to the top
     of the same order so a full pass shows each card exactly once. */
  useEffect(() => {
    if (tab !== "shuffle") return;
    const timer = setInterval(() => {
      setShuffle((s) => ({
        index: (s.index + 1) % SHUFFLE_POOL.length,
        leaving: s.index,
        dir: 1,
      }));
    }, SHUFFLE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [tab]);

  useEffect(() => {
    if (tab === "all" || preview) return;
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
  }, [go, tab, preview]);

  /* The deck and shuffle tabs share the carousel; only the card list and the
     cursor differ. The shuffle tab reads its cards through the dealt order. */
  const isCarousel = tab !== "all";
  const carouselCards =
    tab === "shuffle" ? order.map((i) => SHUFFLE_POOL[i]) : DECK;
  const carousel = tab === "shuffle" ? shuffle : deck;
  const setCarousel = tab === "shuffle" ? setShuffle : setDeck;
  const suffix = carousel.dir === 1 ? "next" : "prev";

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#dfdcd4]">
      <AmbientWash />

      <div className="relative z-10 flex shrink-0 justify-center px-6 pt-8 pb-6">
        <div className="inline-flex items-center gap-[2px] rounded-full bg-white/35 p-[3px] backdrop-blur-[20px]">
          {(
            [
              ["deck", "Insight cards"],
              ["shuffle", "Shuffle play"],
              ["all", "Show all cards"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              aria-pressed={tab === value}
              className={`rounded-full px-[14px] py-[6px] text-[12px] leading-[16px] transition-colors ease-fast ${
                tab === value
                  ? "bg-white/85 text-[#1a1817]"
                  : "text-[#58524e] hover:text-[#1a1817]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isCarousel ? (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-[28px] pb-16">
          <div className="relative h-[531px] w-[400px] max-w-full">
            {carousel.leaving !== null && (
              <CardView
                key={`leaving-${tab}-${carousel.leaving}`}
                card={carouselCards[carousel.leaving]}
                position={carousel.leaving + 1}
                total={carouselCards.length}
                showFunFact={funFacts[carouselCards[carousel.leaving].id]}
                onToggleFunFact={() =>
                  toggleFunFact(carouselCards[carousel.leaving!].id)
                }
                className={`deck-out-${suffix}`}
                onAnimationEnd={() =>
                  setCarousel((s) => ({ ...s, leaving: null }))
                }
              />
            )}
            <CardView
              key={`current-${tab}-${carousel.index}`}
              card={carouselCards[carousel.index]}
              position={carousel.index + 1}
              total={carouselCards.length}
              showFunFact={funFacts[carouselCards[carousel.index].id]}
              onToggleFunFact={() =>
                toggleFunFact(carouselCards[carousel.index].id)
              }
              className={`deck-in-${suffix}`}
            />
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex-1 overflow-y-auto px-8 pb-16">
          <ShowAllCards
            funFacts={funFacts}
            onOpenInsight={(i) => {
              setDeck({ index: i, leaving: null, dir: 1 });
              setTab("deck");
            }}
            onPreview={(card) => setPreview(card)}
          />
        </div>
      )}

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
