"use client";

// /comms-banner — the banner exploration. The live take (one line at a
// time, mounted on /landing-page's hero) leads the page; every retired
// take sits below it in the archive, still running, so the whole road
// stays walkable. The originality budget was always spent inside the
// affordances every chat tool already taught people, never on chrome:
//
//   01 · the rows            — the baseline take: four rows, AJ's 👍.
//   02 · already typing      — "AJ and Tadao are typing…": the agent's
//                              proactivity carried entirely by the most
//                              traditional affordance there is.
//   03 · the read            — the agent visibly reads the thread first:
//                              the phrases that depend on each other get
//                              selection-swept, then Tadao answers.
//   04 · the follow-through  — a date divider, then Tadao actually does
//                              what it said: the promise kept the next
//                              morning is the pitch.
//   05 · the structure       — humans are columns, Tadao is the beam: the
//                              rows keep their chat register but stand at
//                              three column lines, and the agent draws
//                              across them as the one blue member that
//                              makes the frame stand.
//   06 · the foundation      — a section cut. The conversation happens
//                              above ground; what Tadao holds — the piles
//                              and the noted facts — sits in the poché
//                              below, and its reply surfaces from there.
//   07 · the light           — concrete-dark banner, dim rows; Tadao's
//                              arrival is the illumination that makes the
//                              whole conversation legible.
//   08 · the return          — second person: the banner is the feeling
//                              of coming back. "While you were out" and a
//                              three-line catch-up where the handoffs are
//                              already handled.
//   09 · the subtraction     — the anti-noise thesis made visible: a pile
//                              of coordination pings collapses into the
//                              four messages that mattered, and a quiet
//                              tally names what never reached you.
//   10 · the candidate       — the distillation, built against the real
//                              criteria: easy to read, easy to understand,
//                              unmistakably a messaging platform. Rows at
//                              banner scale, no empty frames, one twist
//                              (the typing indicator), fast cycle.
//
// Choreography stays phase counters on timeouts; visible is the base
// style and .is-hidden the exception, so nothing collapses if the
// compositor starves.

import CandidateBanner from "./candidate-banner";
import OneLineBanner from "./one-line-banner";
import { TADAO, Chip, OLI, AJ, SARA, Row, Tag, useLoop } from "./shared";
import type { Person } from "./shared";

/* --------------------------- 01 · the rows -------------------------------- */

const T1_BEATS: [number, number][] = [
  [1, 500],
  [2, 1950],
  [3, 3400],
  [4, 5300],
  [5, 6650],
  [-1, 12600],
];

function TakeRows() {
  const { phase, out } = useLoop(T1_BEATS, 13600, 5);
  return (
    <section className="cb-banner" aria-label="Banner 01 — the rows">
      <div className={`cb-thread${out ? " is-out" : ""}`}>
        <Row who={SARA} time="3:14 PM" shown={phase >= 1} text={["think we can ship this thurs?"]} />
        <Row who={OLI} time="3:14 PM" shown={phase >= 2} text={["if design signs off tomorrow"]} />
        <Row who={AJ} time="3:15 PM" shown={phase >= 3} text={["yep, I can review in the morning"]} />
        <Row
          who={TADAO}
          time="3:15 PM"
          shown={phase >= 4}
          text={["I'll check back after AJ's review and keep Oli posted."]}
        >
          <Chip shown={phase >= 5} />
        </Row>
      </div>
    </section>
  );
}

/* ------------------------ 02 · already typing ----------------------------- */
// The typing indicator does all the work: AJ starts typing, then "AJ
// and Tadao are typing…" — nobody summoned it, it is already composing.

const T2_BEATS: [number, number][] = [
  [1, 500],
  [2, 1900],
  [3, 2800], // AJ is typing…
  [4, 4100], // AJ and Tadao are typing…
  [5, 5600], // AJ's row lands; Tadao is still typing…
  [6, 7300], // Tadao's row lands
  [7, 8500],
  [-1, 14600],
];

function TakeTyping() {
  const { phase, out } = useLoop(T2_BEATS, 15600, 7);
  const typing =
    phase === 3 ? "AJ is typing" : phase === 4 ? "AJ and Tadao are typing" : phase === 5 ? "Tadao is typing" : null;
  return (
    <section className="cb-banner" aria-label="Banner 02 — already typing">
      <div className={`cb-thread${out ? " is-out" : ""}`}>
        <Row who={SARA} time="3:14 PM" shown={phase >= 1} text={["think we can ship this thurs?"]} />
        <Row who={OLI} time="3:14 PM" shown={phase >= 2} text={["if design signs off tomorrow"]} />
        <Row who={AJ} time="3:15 PM" shown={phase >= 5} text={["yep, I can review in the morning"]} />
        <Row
          who={TADAO}
          time="3:15 PM"
          shown={phase >= 6}
          text={["I'll check back after AJ's review and keep Oli posted."]}
        >
          <Chip shown={phase >= 7} />
        </Row>
        {/* Reserved line, so the indicator never reflows the thread. */}
        <div className={`cb-typing${typing ? "" : " is-hidden"}`}>
          {typing}
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

/* --------------------------- 03 · the read -------------------------------- */
// Before Tadao speaks, it visibly reads: the three phrases that depend on
// each other get selection-swept in thread order, then the answer lands.

const T3_BEATS: [number, number][] = [
  [1, 400],
  [2, 1700],
  [3, 3000],
  [4, 5000], // mark: ship this thurs
  [5, 5750], // mark: design signs off tomorrow
  [6, 6500], // mark: review in the morning
  [7, 7700], // Tadao
  [8, 9000],
  [-1, 15200],
];

function TakeRead() {
  const { phase, out } = useLoop(T3_BEATS, 16200, 8);
  return (
    <section className="cb-banner" aria-label="Banner 03 — the read">
      <div className={`cb-thread${out ? " is-out" : ""}`}>
        <Row
          who={SARA}
          time="3:14 PM"
          shown={phase >= 1}
          text={["think we can ", { mark: "ship this thurs", lit: phase >= 4 }, "?"]}
        />
        <Row
          who={OLI}
          time="3:14 PM"
          shown={phase >= 2}
          text={["if ", { mark: "design signs off tomorrow", lit: phase >= 5 }, ""]}
        />
        <Row
          who={AJ}
          time="3:15 PM"
          shown={phase >= 3}
          text={["yep, I can ", { mark: "review in the morning", lit: phase >= 6 }, ""]}
        />
        <Row
          who={TADAO}
          time="3:15 PM"
          shown={phase >= 7}
          text={["I'll check back after AJ's review and keep Oli posted."]}
        >
          <Chip shown={phase >= 8} />
        </Row>
      </div>
    </section>
  );
}

/* ----------------------- 04 · the follow-through -------------------------- */
// The banner where the promise is kept. A date divider — the most mundane
// affordance in any chat — becomes the punchline: the next morning, Tadao
// actually did the thing.

const T4_BEATS: [number, number][] = [
  [1, 400],
  [2, 1600],
  [3, 2800],
  [4, 4400], // Tadao's promise
  [5, 8400], // the divider — time passes
  [6, 9400], // the promise kept
  [7, 10900],
  [-1, 16800],
];

function TakeFollowThrough() {
  const { phase, out } = useLoop(T4_BEATS, 17800, 7);
  return (
    <section className="cb-banner" aria-label="Banner 04 — the follow-through">
      <div className={`cb-thread is-anchored${out ? " is-out" : ""}`}>
        <Row who={SARA} time="3:14 PM" shown={phase >= 1} text={["think we can ship this thurs?"]} />
        <Row who={OLI} time="3:14 PM" shown={phase >= 2} text={["if design signs off tomorrow"]} />
        <Row who={AJ} time="3:15 PM" shown={phase >= 3} text={["yep, I can review in the morning"]} />
        <Row
          who={TADAO}
          time="3:15 PM"
          shown={phase >= 4}
          text={["I'll check back after AJ's review and keep Oli posted."]}
        />
        <div className={`cb-slot${phase >= 5 ? "" : " is-hidden"}`}>
          <div className="cb-slot-inner">
            <div className="cb-divider">
              <span className="cb-divider-line" />
              <span className="cb-divider-label">tomorrow · 9:04 am</span>
              <span className="cb-divider-line" />
            </div>
          </div>
        </div>
        <Row
          who={TADAO}
          time="9:04 AM"
          shown={phase >= 6}
          text={["AJ signed off — Oli, you're clear for Thursday."]}
        >
          <Chip shown={phase >= 7} />
        </Row>
      </div>
    </section>
  );
}



/* --------------------------- 05 · the structure ---------------------------- */
// Orthogonal only — the architectural signature is the right angle. Three
// grey column lines rise, a message standing at each; then one blue beam
// draws across all three and Tadao's row rides it. The agent is the member
// that ties the frame together; remove it and these are three posts.

const ST_COLS = [8, 41, 74]; // column x, % of the stage
const ST_BEATS: [number, number][] = [
  [1, 400],
  [2, 1900],
  [3, 3400],
  [4, 5300], // the beam
  [5, 6400], // Tadao, on the beam
  [-1, 13000],
];

function StMsg({
  who,
  time,
  text,
  shown,
  style,
}: {
  who: Person;
  time: string;
  text: string;
  shown: boolean;
  style: React.CSSProperties;
}) {
  return (
    <div className={`st-msg${shown ? "" : " is-hidden"}`} style={style}>
      <div className="cb-meta">
        <img className="st-face" src={who.avatar} alt="" />
        <span className={`cb-name${who.agent ? " is-agent" : ""}`}>{who.name}</span>
        <span className="cb-time">{time}</span>
      </div>
      <p className="st-text">{text}</p>
    </div>
  );
}

function TakeStructure() {
  const { phase, out } = useLoop(ST_BEATS, 14000, 5);
  return (
    <section className="cb-banner" aria-label="Banner 05 — the structure">
      <div className={`st-stage${out ? " is-out" : ""}`}>
        {ST_COLS.map((x, i) => (
          <span
            key={x}
            className={`st-col${phase >= i + 1 ? "" : " is-hidden"}`}
            style={{ left: `${x}%` }}
          />
        ))}
        <span className={`st-beam${phase >= 4 ? "" : " is-hidden"}`} />
        {ST_COLS.map((x, i) => (
          <span
            key={`j${x}`}
            className={`st-joint${phase >= 4 ? "" : " is-hidden"}`}
            style={{ left: `calc(${x}% - 1.5px)`, transitionDelay: `${180 + i * 160}ms` }}
          />
        ))}
        <StMsg
          who={SARA}
          time="3:14 PM"
          text="think we can ship this thurs?"
          shown={phase >= 1}
          style={{ left: "calc(8% + 14px)", top: 38 }}
        />
        <StMsg
          who={OLI}
          time="3:14 PM"
          text="if design signs off tomorrow"
          shown={phase >= 2}
          style={{ left: "calc(41% + 14px)", top: 108 }}
        />
        <StMsg
          who={AJ}
          time="3:15 PM"
          text="yep, I can review in the morning"
          shown={phase >= 3}
          style={{ left: "calc(74% + 14px)", top: 56 }}
        />
        <StMsg
          who={TADAO}
          time="3:15 PM"
          text="I'll check back after AJ's review and keep Oli posted."
          shown={phase >= 5}
          style={{ left: "calc(8% + 14px)", top: 244 }}
        />
      </div>
    </section>
  );
}

/* -------------------------- 06 · the foundation ---------------------------- */
// A section cut. The chat happens above ground, unchanged; each message
// drives a pile down through the ground line, and what Tadao is holding
// sits noted in the poché — hatched earth, small plates. Its reply does
// not arrive from off-screen: it surfaces.

const FD_PILES = [
  { x: 150, top: 60, note: "thurs" },
  { x: 340, top: 106, note: "signoff · tomorrow" },
  { x: 510, top: 152, note: "review · 9 am" },
];
const FD_BEATS: [number, number][] = [
  [1, 400],
  [2, 1700],
  [3, 3000],
  [4, 4500], // pile + note, Sara
  [5, 5100], // pile + note, Oli
  [6, 5700], // pile + note, AJ
  [7, 7100], // Tadao surfaces
  [-1, 13800],
];

function FdRow({
  who,
  time,
  text,
  shown,
  rising,
}: {
  who: Person;
  time: string;
  text: string;
  shown: boolean;
  rising?: boolean;
}) {
  return (
    <div className={`fd-row${rising ? " is-rising" : ""}${shown ? "" : " is-hidden"}`}>
      <img className="st-face" src={who.avatar} alt="" />
      <div className="cb-meta">
        <span className={`cb-name${who.agent ? " is-agent" : ""}`}>{who.name}</span>
        <span className="cb-time">{time}</span>
      </div>
      <p className="fd-text">{text}</p>
    </div>
  );
}

function TakeFoundation() {
  const { phase, out } = useLoop(FD_BEATS, 14800, 7);
  return (
    <section className="cb-banner" aria-label="Banner 06 — the foundation">
      <div className="fd-earth" aria-hidden />
      <div className={`fd-stage${out ? " is-out" : ""}`}>
        {FD_PILES.map((pile, i) => (
          <span
            key={pile.x}
            className={`fd-pile${phase >= i + 4 ? "" : " is-hidden"}`}
            style={{ left: pile.x, top: pile.top, height: 208 - pile.top }}
          />
        ))}
        {FD_PILES.map((pile, i) => (
          <span
            key={`n${pile.x}`}
            className={`fd-note${phase >= i + 4 ? "" : " is-hidden"}${phase >= 7 ? " is-spent" : ""}`}
            style={{ left: pile.x, top: 219 }}
          >
            {pile.note}
          </span>
        ))}
        <div className="fd-rows">
          <FdRow who={SARA} time="3:14 PM" text="think we can ship this thurs?" shown={phase >= 1} />
          <FdRow who={OLI} time="3:14 PM" text="if design signs off tomorrow" shown={phase >= 2} />
          <FdRow who={AJ} time="3:15 PM" text="yep, I can review in the morning" shown={phase >= 3} />
          <FdRow
            who={TADAO}
            time="3:15 PM"
            text="I'll check back after AJ's review and keep Oli posted."
            shown={phase >= 7}
            rising
          />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- 07 · the light ------------------------------- */
// Concrete-dark banner; the rows arrive barely lit — present, unread.
// Tadao's arrival is the light: a soft flood fades up and the whole
// conversation becomes legible at once. The agent is not another voice
// here; it is the thing that lets you see the room.

const LT_BEATS: [number, number][] = [
  [1, 500],
  [2, 1900],
  [3, 3300],
  [4, 5300], // Tadao + the light
  [5, 6700],
  [-1, 13000],
];

function TakeLight() {
  const { phase, out } = useLoop(LT_BEATS, 14000, 5);
  return (
    <section className="cb-banner lt-take" aria-label="Banner 07 — the light">
      <div className={`lt-glow${phase >= 4 ? "" : " is-hidden"}`} aria-hidden />
      <div className={`cb-thread lt-thread${phase >= 4 ? "" : " is-dim"}${out ? " is-out" : ""}`}>
        <Row who={SARA} time="3:14 PM" shown={phase >= 1} text={["think we can ship this thurs?"]} />
        <Row who={OLI} time="3:14 PM" shown={phase >= 2} text={["if design signs off tomorrow"]} />
        <Row who={AJ} time="3:15 PM" shown={phase >= 3} text={["yep, I can review in the morning"]} />
        <Row
          who={TADAO}
          time="3:15 PM"
          shown={phase >= 4}
          text={["I'll check back after AJ's review and keep Oli posted."]}
        >
          <Chip shown={phase >= 5} />
        </Row>
      </div>
    </section>
  );
}


/* ----------------------------- 08 · the return ----------------------------- */
// Every other take watches someone else's team. This one is addressed to
// the reader: you were out, and the coordination happened anyway. One
// divider, one message from Tadao whose lines arrive as it composes them,
// and a thumbs-up that stands in for you.

const RT_LINES = [
  "AJ's review landed \u2014 design approved.",
  "I caught Oli up on the pricing decision.",
  "Thursday is still on.",
];
const RT_BEATS: [number, number][] = [
  [1, 500], // while you were out
  [2, 1700], // Tadao + first line
  [3, 3200],
  [4, 4500],
  [5, 6000], // your 👍
  [-1, 12600],
];

function TakeReturn() {
  const { phase, out } = useLoop(RT_BEATS, 13600, 5);
  return (
    <section className="cb-banner" aria-label="Banner 08 — the return">
      <div className={`cb-thread${out ? " is-out" : ""}`}>
        <div className={`cb-slot${phase >= 1 ? "" : " is-hidden"}`}>
          <div className="cb-slot-inner">
            <div className="cb-divider">
              <span className="cb-divider-line" />
              <span className="cb-divider-label">while you were out · 14 hrs</span>
              <span className="cb-divider-line" />
            </div>
          </div>
        </div>
        <div className={`cb-slot${phase >= 2 ? "" : " is-hidden"}`}>
          <div className="cb-slot-inner">
            <div className="cb-row">
              <img className="cb-face" src={TADAO.avatar} alt="" />
              <div className="cb-body">
                <div className="cb-meta">
                  <span className="cb-name is-agent">Tadao</span>
                  <span className="cb-time">9:02 AM</span>
                </div>
                {RT_LINES.map((line, i) => (
                  <div key={i} className={`cb-slot${phase >= i + 2 ? "" : " is-hidden"}`}>
                    <div className="cb-slot-inner">
                      <p className="cb-text rt-line">{line}</p>
                    </div>
                  </div>
                ))}
                <Chip shown={phase >= 5} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- 09 · the subtraction -------------------------- */
// The pitch is what DOESN'T happen. The banner opens as the pile everyone
// recognizes — bumps, re-ups, who-owns-this — then the pile drains and
// the four messages that mattered stand at full size, with a quiet tally
// of what never reached you.

const SB_NOISE = [
  [SARA, "who owns the launch copy?"],
  [OLI, "bumping this ^"],
  [AJ, "wait, which doc are we in?"],
  [OLI, "did we ever decide on pricing?"],
  [SARA, "@here anyone seen AJ today?"],
  [AJ, "same thread as yesterday?"],
  [OLI, "circling back before EOD"],
  [SARA, "status on the design review?"],
  [AJ, "can someone loop in Oli?"],
  [OLI, "+1"],
  [SARA, "re-upping — still blocked"],
  [AJ, "lol wrong channel, sorry"],
] as const;

const SB_BEATS: [number, number][] = [
  [1, 400], // the pile pours in
  [2, 4300], // the pile drains; the four that mattered stand up
  [3, 6000], // the tally
  [-1, 12800],
];

function TakeSubtraction() {
  const { phase, out } = useLoop(SB_BEATS, 13800, 3);
  const collapsed = phase >= 2;
  return (
    <section className="cb-banner" aria-label="Banner 09 — the subtraction">
      <div className={`cb-thread${out ? " is-out" : ""}`}>
        {SB_NOISE.map(([who, text], i) => (
          <div
            key={i}
            className={`cb-slot${phase >= 1 && !collapsed ? "" : " is-hidden"}`}
            style={{ transitionDelay: collapsed ? `${i * 40}ms` : `${i * 90}ms` }}
          >
            <div className="cb-slot-inner">
              <div className="sb-noise">
                <img src={who.avatar} alt="" />
                <span className="sb-noise-name">{who.name}</span>
                <span className="sb-noise-text">{text}</span>
              </div>
            </div>
          </div>
        ))}
        <div style={{ transitionDelay: collapsed ? "420ms" : "0ms" }} className={`cb-slot${collapsed ? "" : " is-hidden"}`}>
          <div className="cb-slot-inner">
            <div>
              <Row who={SARA} time="3:14 PM" shown={collapsed} text={["think we can ship this thurs?"]} />
              <Row who={OLI} time="3:14 PM" shown={collapsed} text={["if design signs off tomorrow"]} />
              <Row who={AJ} time="3:15 PM" shown={collapsed} text={["yep, I can review in the morning"]} />
              <Row
                who={TADAO}
                time="3:15 PM"
                shown={collapsed}
                text={["I'll check back after AJ's review and keep Oli posted."]}
              />
              <p className={`sb-tally${phase >= 3 ? "" : " is-hidden"}`}>
                the other {SB_NOISE.length} never reached you
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* -------------------------------- page ------------------------------------ */

export default function CommsBanner() {
  return (
    <main className="cb-field bg-gray-100">
      <Tag>live · solo — mounted on /landing-page</Tag>
      <OneLineBanner mode="solo" />

      <div className="cb-archive">
        <span className="cb-archive-line" />
        archive
        <span className="cb-archive-line" />
      </div>

      <Tag>01 · the rows</Tag>
      <TakeRows />
      <Tag>02 · already typing</Tag>
      <TakeTyping />
      <Tag>03 · the read</Tag>
      <TakeRead />
      <Tag>04 · the follow-through</Tag>
      <TakeFollowThrough />
      <Tag>05 · the structure</Tag>
      <TakeStructure />
      <Tag>06 · the foundation</Tag>
      <TakeFoundation />
      <Tag>07 · the light</Tag>
      <TakeLight />
      <Tag>08 · the return</Tag>
      <TakeReturn />
      <Tag>09 · the subtraction</Tag>
      <TakeSubtraction />
      <Tag>10 · the candidate</Tag>
      <CandidateBanner />
      <Tag>11 · the reel — two slots, retired</Tag>
      <OneLineBanner mode="duo" />
    </main>
  );
}
