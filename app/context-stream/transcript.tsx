"use client";

// The room's transcript — a short exchange in #general that shows how the
// agent works: a line from Oliver, Sara typing then landing, your ask to
// @Ando, the agent's trace under it (the product's TraceLine, shimmering
// through what it reads), "Ando is typing…", and a short reply with the
// run's duration filed under it. Rows are declared here with WHEN they
// land; scene.tsx drives each one's arrival per frame (opacity, a small
// rise, and for the late rows a height that grows so the transcript is
// pushed up rather than jumping).

import { Avatar } from "../ando-stage/chrome";
import { TraceLine, type TracePhases } from "../ando-stage/context-trace";
import { CAST, type Actor, type Segment } from "../ando-stage/scenes";
import type { Timing } from "./timing";

export type Lands = "chat" | "sara" | "send" | "reply";

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

/** What you ask, typed into the composer over the `ask` beat. */
export const ASK = "@Ando what's Sara cooking in #marketing?";

const ch = (text: string): Segment => ({ text, mention: true });
const t = (text: string): Segment => ({ text });

export const ROWS: RowDef[] = [
  {
    key: "oli",
    who: CAST.oli,
    time: "3:12 PM",
    lands: "chat",
    body: [[t("demo run-through is Thursday. who has the marketing cut?")]],
  },
  {
    key: "sara",
    who: CAST.sara,
    time: "3:27 PM",
    lands: "sara",
    body: [[t("check out what im cooking in "), ch("#marketing")]],
  },
  {
    key: "ask",
    who: CAST.caleb,
    time: "3:31 PM",
    lands: "send",
    body: [[{ text: "@Ando", mention: true, agent: true }, t(" what's Sara cooking in "), ch("#marketing"), t("?")]],
    run: true,
  },
  {
    key: "reply",
    who: CAST.ando,
    time: "3:31 PM",
    lands: "reply",
    body: [[t("Three things from "), ch("#marketing"), t(" this week:")]],
    list: [
      [t("New landing hero, in review since Tuesday")],
      [t("Launch email, scheduled for Thursday")],
      [t("Affiliate wheel announcement, final pass done")],
    ],
    runDone: true,
  },
];

/** The agent's run under the ask: 0 not yet, 1 reading, 2 done. */
export type RunPhase = 0 | 1 | 2;

/** Who the agent read on its way to the reply — the trace's facepile. */
export const READ_FROM: Actor[] = [CAST.sara, CAST.oli, CAST.aj];

/** The run's steps on the film clock, from the beats. */
export function tracePhasesFor(T: Timing): TracePhases {
  return {
    start: T.send + 0.3,
    steps: [
      { t: T.send + 0.3, label: "Starting agent session", icon: null },
      { t: T.send + 0.9, label: "Reading #marketing…", icon: "transcript" },
      { t: T.send + 2.2, label: "Drafting the reply…", icon: "write" },
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
            {showRunning || showDone ? <TraceLine agent={CAST.ando} participants={READ_FROM} phases={phases} vt={traceVt} onReply={showDone} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
