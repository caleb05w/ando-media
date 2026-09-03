"use client";

// The room's transcript — #general as the storyboard's CleanShot has it,
// then the ask and the reply that pay the film off. Rows are declared
// here with WHEN they land; scene.tsx drives each one's arrival per frame
// (opacity, a small rise, and for the late rows a height that grows so
// the transcript is pushed up rather than jumping).
//
// Markup follows /ando-stage's transcript (message-row-frame,
// message-view-sections, reactions, the run row), trimmed to what the film
// shows.

import { Avatar } from "../ando-stage/chrome";
import { Icon } from "../ando-stage/glyph";
import { CAST, type Actor, type Segment } from "../ando-stage/scenes";

export type Lands = "chat" | "send" | "reply";

export type RowDef = {
  key: string;
  who: Actor;
  time: string;
  lands: Lands;
  body: Segment[][];
  list?: Segment[][];
  reactions?: Array<{ emoji: string; count: number }>;
  replies?: { count: number; last: string; faces: Actor[] };
  /** The agent's run rides under this row. */
  run?: true;
};

/** What you ask, typed into the composer over the `ask` beat. */
export const ASK = "@Ando what's Sara cooking in #marketing?";

const ch = (text: string): Segment => ({ text, mention: true });
const at = (text: string): Segment => ({ text, mention: true });
const t = (text: string): Segment => ({ text });

export const ROWS: RowDef[] = [
  {
    key: "recap",
    who: CAST.ando,
    time: "11:02 AM",
    lands: "chat",
    body: [[t("Jam recap: Oliver, Sara and 5 others walked the demo flow. Two decisions and one open question, all in the thread.")]],
    replies: { count: 2, last: "today at 11:10 AM", faces: [CAST.oli, CAST.sara] },
  },
  {
    key: "oli",
    who: CAST.oli,
    time: "3:12 PM",
    lands: "chat",
    body: [[t("my favorite use cases for demo:")]],
    list: [
      [ch("#bugs"), t(" triage: "), at("@Oliver"), t(" in "), ch("#bugs"), t(" (thread expands to full screen via drag to scope human attention)")],
      [t("market research → "), ch("#market-observations"), t(": "), at("@Sara Du"), t(" asks “I saw something, how does it apply to my company”")],
      [t("automation to agent in "), ch("#errors"), t(": a message in "), ch("#no-access"), t(" leads to the agent proactively helping")],
      [t("create rule and execute in "), ch("#engineering"), t(": "), at("@Alex P"), t(" (conversational rule setup, nice table UI response)")],
    ],
    reactions: [{ emoji: "❤️", count: 3 }, { emoji: "👀", count: 1 }],
    replies: { count: 9, last: "just now", faces: [CAST.sara, CAST.aj] },
  },
  {
    key: "sara",
    who: CAST.sara,
    time: "3:27 PM",
    lands: "chat",
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
    body: [[t("Three things, all from "), ch("#marketing"), t(" this week:")]],
    list: [
      [t("A new landing hero, in review since Tuesday, with two comments from Oliver still open")],
      [t("The launch email, approved this morning and scheduled for Thursday")],
      [t("The affiliate wheel announcement, final pass done, export is one click now")],
    ],
  },
];

/** The agent's run under the ask: 0 not yet, 1 reading, 2 done. */
export type RunPhase = 0 | 1 | 2;

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

/** An agent run pinned under the message that spawned it (ando-stage RunRow). */
function RunRow({ who, phase }: { who: Actor; phase: RunPhase }) {
  const done = phase === 2;
  return (
    <div className="flex w-full items-center gap-2 pt-1">
      <span className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 shadow-[0_0_0_1px_var(--color-ando-border-alpha)]" style={{ background: done ? "var(--color-ando-bg-main)" : "var(--color-ando-bg-fill-subtle)" }}>
        <span className="relative flex size-[18px] shrink-0 items-center justify-center">
          <img src={who.avatar} alt="" className="size-[13px] rounded-full object-cover" />
          <svg width={18} height={18} viewBox="0 0 24 24" className="absolute inset-0" aria-hidden>
            <circle className={done ? undefined : "st-orbit"} cx="12" cy="12" r="11" fill="none" stroke={done ? "var(--color-ando-action-success)" : "#f59e0b"} strokeWidth={1.5} strokeDasharray={done ? undefined : "3.5 4"} strokeLinecap="round" />
          </svg>
        </span>
        <span className="kanso-text-label-12 truncate text-ando-fg-secondary">
          <span className="text-ando-fg-primary">{who.name}</span>
          {done ? " finished · read 3 threads and 2 files in #marketing" : " · reading #marketing"}
        </span>
        {done ? null : (
          <span className="relative h-[3px] w-14 shrink-0 overflow-hidden rounded-full bg-ando-bg-fill-muted">
            <span className="st-sweep absolute inset-y-0 left-0 w-1/3 rounded-full bg-ando-action-primary" />
          </span>
        )}
      </span>
    </div>
  );
}

export function RowView({ row, runPhase }: { row: RowDef; runPhase: RunPhase }) {
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
            {row.reactions ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
                {row.reactions.map((reaction) => (
                  <span key={reaction.emoji} className="inline-flex h-7 items-center justify-center whitespace-nowrap rounded-sm border border-transparent bg-ando-action-secondary pl-[6px] pr-[5px] kanso-text-label-14-md text-ando-fg-secondary">
                    <span className="inline-flex items-center gap-[3px]">
                      <span className="kanso-text-label-16 leading-none">{reaction.emoji}</span>
                      <span className="px-[2px] tabular-nums">{reaction.count}</span>
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
            {row.replies ? (
              <div className="flex items-center gap-2 pt-0.5">
                <span className="flex -space-x-1">
                  {row.replies.faces.map((face) => (
                    <img key={face.name} src={face.avatar} alt="" className="size-4 rounded-full object-cover ring-1 ring-white" />
                  ))}
                </span>
                <span className="kanso-text-label-12-md text-ando-fg-brand">{row.replies.count} replies</span>
                <span className="kanso-text-label-12 text-ando-fg-tertiary">Last reply {row.replies.last}</span>
                <Icon name="IconChevronRightSmall" size={12} className="text-ando-fg-tertiary" />
              </div>
            ) : null}
            {row.run && runPhase > 0 ? <RunRow who={CAST.ando} phase={runPhase} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
