"use client";

// The one-line hero — the conversation shown one message at a time, in a
// single centred line: face, name, words. The past isn't a stack of rows
// eating the hero's height; it's a small facepile gathering under the
// line, the way read-receipts already taught people "these people are in
// this thread." Tadao's turn holds longest, and the 👍 gathers in the
// tray beneath it, counting up as the team reacts one by one.
//
// Distilled out of the /comms-banner exploration (now retired); the solo
// take is the one that shipped, mounted on /landing-page's hero.

import { useEffect, useState, useSyncExternalStore } from "react";

import { Stage } from "../agent-typing-experience/stage";
import { typingFrame, VARIANTS } from "../agent-typing-experience/variants";
import "./one-line-banner.css";

type Person = { name: string; avatar: string; agent?: boolean };

const SARA: Person = { name: "Sara", avatar: "/avatars/sara.png" };
const OLI: Person = { name: "Oli", avatar: "/avatars/oli.png" };
const AJ: Person = { name: "AJ", avatar: "/avatars/aj.png" };
const TADAO: Person = { name: "Tadao", avatar: "/avatars/agent-2.png", agent: true };

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/** Phase counter on timeouts. beats: [phase, at-ms]; phase -1 = exhale.
 *  Reduced motion holds finalPhase — derived, never set from the effect. */
function useLoop(beats: [number, number][], cycle: number, finalPhase: number) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const [out, setOut] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const timers = new Set<number>();
    const schedule = () => {
      for (const [p, at] of beats) {
        timers.add(
          window.setTimeout(() => {
            if (p < 0) setOut(true);
            else setPhase(p);
          }, at),
        );
      }
      timers.add(
        window.setTimeout(() => {
          setOut(false);
          setPhase(0);
          schedule();
        }, cycle),
      );
    };
    schedule();
    return () => timers.forEach((t) => window.clearTimeout(t));
    // beats/cycle are module-scope constants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return {
    phase: reduced ? finalPhase : phase,
    out: reduced ? false : out,
  };
}

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

/** The message text, typed. `on` = actively typing (a caret riding the
 *  edge); `full` = sent (whole sentence, no ceremony) — also the resting
 *  and reduced-motion state. The rhythm is human, not a metronome — the
 *  agents-guide's prompt-typing grammar (variable per-char delay),
 *  compressed to fit the banner's beat windows: quick bursts, a breath
 *  while finding the next word, the occasional mid-word hitch. The send
 *  beat still lands the full sentence, so an unlucky run of pauses can
 *  never leave a message half-typed.
 *  The parent keys this component on the typing/sent flip, so each
 *  typing session mounts fresh with the counter at zero — no ref reads,
 *  no stale-count flash at loop restart. */
function TypeText({ text, on, full }: { text: string; on: boolean; full: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!on) return;
    let n = 0;
    let t = 0;
    const step = () => {
      n = Math.min(n + 1, text.length);
      setCount(n);
      if (n >= text.length) return;
      let d = 10 + Math.random() * 18; // the burst
      if (text[n - 1] === " ") {
        d += Math.random() * 45; // the breath between words
      } else if (Math.random() < 0.05) {
        d += 70 + Math.random() * 80; // the hitch
      }
      t = window.setTimeout(step, d);
    };
    t = window.setTimeout(step, 60);
    return () => window.clearTimeout(t);
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
  // The reactions pile on the way people actually react: a beat to read,
  // then quick, slightly irregular taps — not a metronome.
  [9, 10400], // the first 👍
  [10, 10950], // …a second, right behind it…
  [11, 11700], // …and a third.
  [-1, 15150], // exhale — the reel clears before the loop restarts
];

export default function OneLineBanner({
  mode = "duo",
}: {
  /** duo: two slots, no tray. solo: one slot, facepile tray beneath. */
  mode?: "duo" | "solo";
}) {
  const { phase, out } = useLoop(HL_BEATS, 16200, 11);
  // Index of the line on stage; -1 during the reset breath.
  const cur = phase === 0 ? -1 : Math.min(Math.floor((phase - 1) / 2), 3);
  // The reaction count: one 👍 per beat once Tadao's message has landed.
  const reactions = Math.min(Math.max(phase - 8, 0), 3);
  return (
    <section
      className={`hl-banner hl-${mode}${out ? " is-out" : ""}`}
      aria-label="A conversation with Tadao in it"
    >
      <div className="hl-lines">
        {SCRIPT.map((line, i) => {
          // Two on stage: the current line in the bottom slot, the one
          // before it dimmed above — the question stays visible while
          // its answer types. The clear is the reel's own gesture: on
          // the exhale the line rolls out through the top first, and
          // the tray follows a beat later.
          const state =
            out || phase === 0
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
              </span>
            </span>
          );
        })}
      </div>
      {mode === "solo" ? (
        <div className="hl-meta">
          <span className="hl-trail" aria-hidden>
            {SCRIPT.slice(0, 3).map((line, i) => {
              // Entering, the faces gather left to right; on the exhale
              // they slip away last-in-first-out, trailing the line.
              const delay = out ? `${140 + (2 - i) * 60}ms` : `${i * 70}ms`;
              return (
                <span
                  key={i}
                  className={`hl-tslot${!out && i < cur ? " is-in" : ""}`}
                  style={{ transitionDelay: delay }}
                >
                  <img src={line.who.avatar} alt="" style={{ transitionDelay: delay }} />
                </span>
              );
            })}
          </span>
          {/* The reaction, in the tray rather than the message: it counts
              up one beat at a time — people reacting, not a badge. The
              number is keyed so each increment lands with its own pop. */}
          <span className={`hl-chip${!out && reactions > 0 ? "" : " is-hidden"}`}>
            👍 <b key={reactions}>{reactions || 1}</b>
          </span>
        </div>
      ) : null}
    </section>
  );
}
