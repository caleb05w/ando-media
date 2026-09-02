"use client";

// Take 10 — the candidate — as its own component, so /landing-page can
// mount the same banner /comms-banner shows as a study. Optimized for a
// 2-second glance: type a step larger than the product (a banner is read
// at distance), the first message lands almost immediately so no random
// glance catches an empty frame, and the only twist kept is the one
// nobody needs explained — "Tadao is typing…" before anyone asked it
// anything.

import { TADAO, Chip, OLI, AJ, SARA, Row, useLoop } from "./shared";

// No exhale beat: as hero media this banner must never sit empty, so the
// reset is the reader's own grammar — the thread collapses (slots to 0)
// and the first message of the next pass grows straight back in. Motion,
// not a blank frame.
const EZ_BEATS: [number, number][] = [
  [1, 500],
  [2, 1800],
  [3, 3100],
  [4, 4000], // Tadao is typing… — unprompted
  [5, 5500],
  [6, 6700],
];

export default function CandidateBanner() {
  const { phase } = useLoop(EZ_BEATS, 12200, 6);
  return (
    <section className="cb-banner ez-take" aria-label="A conversation with Tadao in it">
      <div className={`cb-thread${phase === 0 ? " is-clearing" : ""}`}>
        <Row who={SARA} time="3:14 PM" shown={phase >= 1} text={["think we can ship this thurs?"]} />
        <Row who={OLI} time="3:14 PM" shown={phase >= 2} text={["if design signs off tomorrow"]} />
        <Row who={AJ} time="3:15 PM" shown={phase >= 3} text={["yep, I can review in the morning"]} />
        <Row
          who={TADAO}
          time="3:15 PM"
          shown={phase >= 5}
          text={["I'll check back after AJ's review and keep Oli posted."]}
        >
          <Chip shown={phase >= 6} />
        </Row>
        <div className={`cb-typing${phase === 4 ? "" : " is-hidden"}`}>
          Tadao is typing
          <span className="cb-dots" aria-hidden>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      </div>
    </section>
  );
}
