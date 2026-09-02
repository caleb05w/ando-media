"use client";

// The one-line hero — the conversation shown one message at a time, in a
// single centred line: face, name, words. The past isn't a stack of rows
// eating the hero's height; it's a small facepile gathering under the
// line, the way read-receipts already taught people "these people are in
// this thread." Tadao's turn holds longest and takes the 👍. The whole
// thing costs about half the vertical space of the stacked take.

import { useEffect, useState } from "react";

import { Stage } from "../agent-typing-experience/stage";
import { typingFrame, VARIANTS } from "../agent-typing-experience/variants";
import { TADAO, OLI, AJ, SARA, useLoop } from "./shared";
import type { Person } from "./shared";

// `dots` marks the one human line that announces itself with the plain
// ellipsis; `bot` marks Tadao, whose arrival is its own species: the
// typing-dot wave from /agent-typing-experience, a shimmering
// "thinking…", then the suction-v3 draw-in resolving the indicator into
// its face — and the message lands whole. Humans typewrite; the bot
// thinks, then sends.
const SCRIPT: { who: Person; text: string; dots?: boolean; bot?: boolean }[] = [
  { who: SARA, text: "hey team — do we think we can still ship this thursday?" },
  { who: OLI, text: "should be doable, but only if design signs off tomorrow" },
  { who: AJ, text: "yep, I can take the design review first thing tomorrow", dots: true },
  { who: TADAO, text: "I'll check back after AJ's review and keep Oli posted.", bot: true },
];

// Tadao's arrival: dot-wave + status for THINK_MS, then the v3 morph.
const SUCTION = VARIANTS.find((v) => v.key === "suction-v3")!;
const THINK_MS = 1500;

// What the bot is actually doing, narrated — the working-trace register,
// not a generic "thinking…". Two beats inside the think window.
const STATUSES = ["reading the thread…", "drafting a follow-up…"];

function BotStatus() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const iv = window.setInterval(
      () => setI((n) => Math.min(n + 1, STATUSES.length - 1)),
      780,
    );
    return () => window.clearInterval(iv);
  }, []);
  return <span className="hl-think is-on">{STATUSES[i]}</span>;
}

/** Tadao's live indicator — the wave, then the draw-in, resolved into its
 *  face. Runs one pass on mount (the parent keys it to Tadao's turn);
 *  reduced motion parks on the resolved face immediately. */
function TadaoArrival() {
  const [frame, setFrame] = useState(() => typingFrame(0));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTimeout(() => setFrame(SUCTION.morph(SUCTION.morphMs)), 0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = now - t0;
      setFrame(
        t < THINK_MS
          ? typingFrame(t)
          : SUCTION.morph(Math.min(t - THINK_MS, SUCTION.morphMs)),
      );
      if (t < THINK_MS + SUCTION.morphMs) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span className="hl-stagewrap">
      <Stage frame={frame} size={44} crop avatarSrc={TADAO.avatar} />
    </span>
  );
}

const CHAR_MS = 26;

/** The message text, typed. `on` = actively typing (reveals a character
 *  every CHAR_MS with a caret riding the edge); `full` = sent (whole
 *  sentence, no ceremony) — also the resting and reduced-motion state.
 *  The parent keys this component on the typing/sent flip, so each
 *  typing session mounts fresh with the counter at zero — no ref reads,
 *  no stale-count flash at loop restart. */
function TypeText({ text, on, full }: { text: string; on: boolean; full: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!on) return;
    let n = 0;
    const iv = window.setInterval(() => {
      n = Math.min(n + 1, text.length);
      setCount(n);
      if (n >= text.length) window.clearInterval(iv);
    }, CHAR_MS);
    return () => window.clearInterval(iv);
  }, [on, text]);

  const shown = full ? text : on ? text.slice(0, count) : "";
  return (
    <span className="hl-text">
      {shown}
      {on && !full && count < text.length ? (
        <span className="hl-caret" aria-hidden />
      ) : null}
    </span>
  );
}

// Every line is two beats: typing, then sent. The human half is
// deliberately brisk — the agent is the protagonist, and it has to be on
// stage inside the first-glance window (~6s), not the second act of a
// 19-second film. Odd phases are typing, even phases the send; Tadao
// enters at 6.4s and owns the rest of the cycle.
const HL_BEATS: [number, number][] = [
  [1, 400], // Sara types…
  [2, 1900],
  [3, 2700], // Oli types…
  [4, 4300],
  [5, 5100], // AJ's ellipsis…
  [6, 6100],
  [7, 7000], // Tadao thinks…
  [8, 9300],
  [9, 10500], // the 👍
];

export default function OneLineBanner({
  mode = "duo",
}: {
  /** duo: two slots, no tray. solo: one slot, facepile tray beneath. */
  mode?: "duo" | "solo";
}) {
  const { phase } = useLoop(HL_BEATS, 16200, 9);
  // Index of the line on stage; -1 during the reset breath.
  const cur = phase === 0 ? -1 : Math.min(Math.floor((phase - 1) / 2), 3);
  return (
    <section className={`hl-banner hl-${mode}`} aria-label="A conversation with Tadao in it">
      <div className="hl-lines">
        {SCRIPT.map((line, i) => {
          // Two on stage: the current line in the bottom slot, the one
          // before it dimmed above — the question stays visible while
          // its answer types. The clear is the reel's own gesture: at
          // phase 0 everything rolls out through the top, the bottom
          // slot a beat behind the one above it.
          const state =
            phase === 0
              ? " is-past"
              : i === cur
                ? " is-current"
                : i === cur - 1
                  ? mode === "duo"
                    ? " is-prev"
                    : " is-past"
                  : i < cur
                    ? " is-past"
                    : " is-future";
          const typing = i === cur && phase === 2 * i + 1;
          const sent = phase >= 2 * i + 2;
          return (
            <span
              key={i}
              style={
                phase === 0 && i === SCRIPT.length - 1
                  ? { transitionDelay: "110ms" }
                  : undefined
              }
              className={`hl-line${state}${
                typing && line.dots ? " is-typing" : ""
              }${typing && line.bot ? " is-musing" : ""}${
                sent && (line.dots || line.bot) ? " is-sent" : ""
              }`}
            >
              {line.bot && (typing || sent) && phase !== 0 ? (
                <TadaoArrival key="live" />
              ) : (
                <img className="hl-face" src={line.who.avatar} alt="" />
              )}
              <span className={`hl-name${line.who.agent ? " is-agent" : ""}`}>
                {line.who.name}
              </span>
              <span className="hl-msg">
                {line.dots ? (
                  <span className="hl-dots" aria-hidden>
                    <span />
                    <span />
                    <span />
                  </span>
                ) : null}
                {line.bot && typing ? <BotStatus key="status" aria-hidden /> : null}
                <TypeText
                  key={typing && !line.dots && !line.bot ? "typing" : "idle"}
                  text={line.text}
                  on={typing && !line.dots && !line.bot}
                  full={sent}
                />
                {line.bot ? (
                  <span className={`cb-chip hl-chip${phase >= 9 ? "" : " is-hidden"}`}>
                    👍 <b>1</b>
                  </span>
                ) : null}
              </span>
            </span>
          );
        })}
      </div>
      {mode === "solo" ? (
        <div className="hl-meta">
          <span className="hl-trail" aria-hidden>
            {SCRIPT.slice(0, 3).map((line, i) => (
              <span
                key={i}
                className={`hl-tslot${i < cur ? " is-in" : ""}`}
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <img src={line.who.avatar} alt="" style={{ transitionDelay: `${i * 70}ms` }} />
              </span>
            ))}
          </span>
        </div>
      ) : null}
    </section>
  );
}
