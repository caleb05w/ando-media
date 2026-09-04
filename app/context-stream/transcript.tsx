"use client";

// The room's transcript — the exchange the agent is answering, already
// there when the interface builds around it: a line from Oliver, Sara's
// line, your ask to @Tadao with the agent's trace under it (the product's
// TraceLine, shimmering through what it reads), and then the reply, short,
// with the run's duration filed under it. Rows are declared here with WHEN
// they land; scene.tsx drives each one's arrival per frame.

import { Avatar } from "../ando-stage/chrome";
import { TraceLine, type TracePhases } from "../ando-stage/context-trace";
import { AVATAR } from "../agent-typing-experience/variants";
import { CAST, type Actor, type Segment } from "../ando-stage/scenes";
import { taskAt } from "./agents";
import type { Timing } from "./timing";

/** The film's agent — the face /the-library's typing indicator resolves
 *  into, so the reply row shows the same one. */
export const AGENT: Actor = { name: "Tadao", avatar: AVATAR, agent: true };
/** The agent the pull-back lands on: the last face the film's agent wore, typing in the composer. */
export const CODEX: Actor = { name: "Codex", avatar: "/agents/codex.png", agent: true };
/** A pile disc, on the library's pattern: a small mark on a coloured disc. */
function HashDisc() {
  return (
    <span className="flex size-full items-center justify-center bg-ando-bg-fill-muted">
      <svg width="10" height="10" viewBox="0 0 14 14" aria-hidden>
        <path d="M5.4 2.5l-1.2 9M9.8 2.5l-1.2 9M2.6 5.3h9.2M2.2 8.7h9.2" fill="none" stroke="#58524e" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
function TicketDisc() {
  return (
    <span className="flex size-full items-center justify-center bg-[#5E6AD2]">
      <svg width="10" height="10" viewBox="0 0 14 14" aria-hidden>
        <rect x="2.2" y="2.2" width="9.6" height="9.6" rx="2" fill="none" stroke="#fff" strokeWidth="1.5" />
        <path d="M4.6 7.2l1.7 1.7 3.2-3.6" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export type Lands = "chat" | "reply";

export type RowDef = {
  key: string;
  who: Actor;
  time: string;
  lands: Lands;
  body: Segment[][];
  list?: Segment[][];
  /** The agent's run rides under this row while it works… */
  run?: true;
  /** …and moves under this one, as a duration, once it has replied. */
  runDone?: true;
};

const ch = (text: string): Segment => ({ text, mention: true });
const t = (text: string): Segment => ({ text });

/** The agents in the room: the two that spoke first in the film, and the
 *  one still typing. They chime in on their own — nobody tags them. */
export const GROK: Actor = { name: "Grok", avatar: "/agents/grok.svg", agent: true };
export const CLAUDE: Actor = { name: "Claude", avatar: "/agents/claude.png", agent: true };
export const ROWS: RowDef[] = [
  {
    key: "sara",
    who: CAST.sara,
    time: "3:27 PM",
    lands: "chat",
    body: [[t("check out what im cooking in "), ch("#marketing")]],
  },
  {
    key: "grok",
    who: GROK,
    time: "3:27 PM",
    lands: "chat",
    body: [[t("Just read it. The new landing hero is the strongest thing in there — in review since Tuesday.")]],
  },
  {
    key: "caleb",
    who: CAST.caleb,
    time: "3:28 PM",
    lands: "chat",
    body: [[t("does the affiliate wheel make the launch email?")]],
  },
  {
    key: "claude",
    who: CLAUDE,
    time: "3:28 PM",
    lands: "reply",
    body: [[t("It does. Final pass went through this morning, so I've slotted it into Thursday's draft.")]],
  },
];

/** How the chat rows stagger in after `chat` — with air between them. */
export const CHAT_LEAD = 0.4;
export const CHAT_STAGGER = 0.9;

/** The agent's run under the ask: 0 not yet, 1 reading, 2 done. */
export type RunPhase = 0 | 1 | 2;

/** Who the agent read on its way to the reply — the trace's facepile. */
export const READ_FROM: Actor[] = [CAST.sara, CAST.oli, CAST.aj];

/** When the run starts: once the ask has landed. (No row runs one now — the agents just talk — but the trace is here for a script that wants it.) */
export const runStart = (T: Timing) => T.chat + CHAT_LEAD + CHAT_STAGGER + 0.5;

/** The value-prop run, beneath the agent after "Everything becomes context":
 *  the library's context-trace copy on the product's trace line, one task
 *  at a time — each by a different agent, see agents.ts — the sources
 *  piled inline where they are read. Never done — it folds back into the
 *  agent while still drafting. */
export function valuePhasesFor(T: Timing): TracePhases {
  return {
    start: T.trace + 0.3,
    // A job per agent — different jobs, not one job handed around: Grok,
    // Claude, Codex — each line rolls in as its agent's face lands. The
    // reply is drafted where the question is: in the chat.
    steps: [
      { t: taskAt(T, 0), label: "Reading the channels…", icon: "read", pile: [<HashDisc key="a" />, <HashDisc key="b" />, <HashDisc key="c" />] },
      { t: taskAt(T, 1), label: "Creating tickets…", icon: "write", pile: [<TicketDisc key="a" />, <TicketDisc key="b" />, <TicketDisc key="c" />] },
      { t: taskAt(T, 2), label: "Catching up on the jams…", icon: "transcript" },
    ],
    done: T.collapse + 10,
  };
}

/** The run's steps on the film clock, from the beats. */
export function tracePhasesFor(T: Timing): TracePhases {
  const start = runStart(T);
  return {
    start,
    steps: [
      { t: start, label: "Starting agent session", icon: null },
      { t: start + 0.5, label: "Reading #marketing…", icon: "transcript" },
      { t: start + 1.7, label: "Drafting the reply…", icon: "write" },
    ],
    done: T.reply - 0.05,
  };
}

function Inline({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((segment, i) =>
        segment.mention ? (
          <span key={i} className={`ando-inline-chip rounded-xs ${segment.agent ? "bg-ando-action-agent-tag text-ando-fg-on-agent-tag" : "bg-ando-bg-brand/10 text-ando-fg-brand"}`}>{segment.text}</span>
        ) : segment.link ? (
          <span key={i} className="text-ando-fg-brand">{segment.text}</span>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </>
  );
}

export function RowView({ row, runPhase, phases, traceVt }: { row: RowDef; runPhase: RunPhase; phases: TracePhases; /** the film clock, coarsely — only the trace's seconds read it */ traceVt: number }) {
  const showRunning = row.run === true && runPhase === 1;
  const showDone = row.runDone === true && runPhase === 2;
  return (
    <div className="relative min-w-0 rounded-md px-4 py-1.5">
      <div className="flex min-w-0 w-full items-start gap-2">
        <span data-row-avatar className="relative block shrink-0" style={{ width: 32, height: 32 }}>
          <Avatar actor={row.who} size={32} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-baseline gap-x-1.5 pb-0.5">
            <span className="kanso-text-label-14-md text-ando-fg-primary">{row.who.name}</span>
            <span className="kanso-text-label-12 text-ando-fg-tertiary">{row.time}</span>
          </div>
          <div className="flex min-w-0 w-full flex-col gap-2">
            {row.body.map((paragraph, i) => (
              <p key={i} className="kanso-text-label-14 m-0 whitespace-pre-wrap break-words text-ando-fg-primary"><Inline segments={paragraph} /></p>
            ))}
            {row.list ? (
              <ul className="m-0 flex list-disc flex-col gap-1 pl-5">
                {row.list.map((item, i) => (
                  <li key={i} className="kanso-text-label-14 text-ando-fg-primary"><Inline segments={item} /></li>
                ))}
              </ul>
            ) : null}
            {showRunning || showDone ? <TraceLine agent={AGENT} participants={READ_FROM} phases={phases} vt={traceVt} onReply={showDone} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
