"use client";

// /ando-stage — a stage for launch material.
//
// The Ando window, rebuilt on the product stylesheet (product-ui/) and the
// product's icons, running a scripted conversation instead of a live one.
// Pick a scene, hit play, and the room fills in beat by beat: people type,
// messages and files land, reactions pop, agents start runs under the
// message that spawned them and post back what they found.
//
// Every frame is a pure function of (scene, cursor) — see `stageAt` — and the
// cursor is a pure function of the Studio's virtual clock (`cursorAt`), so
// the timeline runs both ways: scrubbing back un-lands messages, closes a
// Jam, and puts the typing dots back. The Studio (lib/timeline-studio) owns
// play, pause, speed, seek, notes and takes; this file owns the room.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Studio, type Hooks } from "../../lib/timeline-studio/studio";
import { lanesFor } from "./lanes";
import "./stage.css";
import { Avatar, Composer, ConversationHeader, Sidebar } from "./chrome";
import { Icon } from "./glyph";
import { ScriptControl, type ScriptLine } from "./script";
import { TraceLine, type TracePhases } from "./context-trace";
import { ActiveJamCallCard, EndedJamCallCard, JAM_MOVE, JamHeaderControl, JamPanel, type JamCall, type TranscriptSegment } from "./jam";
import { JamStage, lowerHeightFor, type JamPhase } from "./jam-stage";
import { Landing, Leaving } from "./landing";
import { ContextCard, LETTERS_OFFSET, LogoCard, MARK_OFFSET, TypeCard, FACE_LAND, LINE_EXIT, TYPE_EXIT, WORD_CADENCE, WORD_LAND, anchorSelector, autoPoseAt, pressesOf, backOut, contextAt, ease, easeInOut, logoAt, seg, shotScale, shotsAt, typeCardAt, type ContextOn, type TypeCardOn } from "./cards";
import { ME, SCENES, beatKey, cursorAt, defaultTiming, jamElapsedAt, pointerAt, scriptedDraftAt, scriptedDraftInThread, totalFor, type Actor, type Attachment, type LaunchCard, type Scene, type Segment, type Surface, type Timing } from "./scenes";

/** Where each cursor beat aims, in the live DOM. */
const CURSOR_TARGETS = {
  "jam-button": '[aria-label="Start Jam"], [aria-label="Open Jam"]',
  "join-button": "[data-jam-join]",
  composer: "[data-stage-editor]",
  "transcript-tab": '[data-jam-tab="transcript"]',
  "hang-up": '[aria-label="End call"]',
  "send-button": "[data-stage-send]",
  "thread-tab": '[data-jam-tab="thread"]',
  "thread-send": "[data-jam-send]",
} as const;

/** The brand cursor set — glyph, size, and the hotspot offset (mini-ando.tsx). */
const CURSOR_GLYPHS = {
  arrow: { src: "/cursors/cursor-arrow.svg", w: 16, h: 22, dx: -2, dy: -1 },
  pointer: { src: "/cursors/cursor-hand.svg", w: 19, h: 20, dx: -7, dy: -1 },
  text: { src: "/cursors/cursor-ibeam.svg", w: 13, h: 22, dx: -6.5, dy: -10 },
} as const;

/** Room the Studio pill needs at the foot of the window. */
const STUDIO_CLEARANCE = 72;
/** image-sizing.ts */
const MAX_IMAGE_WIDTH = 360;
const MAX_IMAGE_HEIGHT = 300;

/* ----------------------------- the reducer ----------------------------- */

type Reaction = { emoji: string; count: number };
type Run = { run: string; who: Actor; task: string; done: boolean };
/** An agent's one-line live trace under the message that prompted it. */
type Trace = { run: string; who: Actor; label: string; icon: "read" | "write" | "transcript" | null; done: boolean; tool: string | null; /** the row is the agent's own reply */ onReply: boolean; /** the run has moved on to the reply — the line folds away under the ask */ leaving?: boolean };


/** Seconds before a type card in which the UI recedes (blur, dim, scale down). */
const CARD_LEAD = 0.6;
/** The stage-clock second of the next type card still ahead of `vt` (null when none). */
function nextTypeCardAt(scene: Scene, T: Timing, vt: number): number | null {
  for (let index = 0; index < scene.beats.length; index += 1) {
    if (scene.beats[index].kind !== "type") continue;
    const t = T[beatKey(index)];
    if (t > vt) return t;
  }
  return null;
}

/** Agent lines type out at this pace once they land (the landing hero: 55 cps; faster here so a recap fits its beat). */
const TYPE_CPS = 110;

type Row =
  | { kind: "mark"; key: string; label: string; tone?: "attention"; beat?: string }
  | {
      kind: "message";
      key: string;
      who: Actor;
      time: string;
      body?: Segment[][];
      card?: LaunchCard;
      attachment?: Attachment;
      jam?: JamCall;
      /** Agent runs under this message: a finished one that moved onto the
       *  agent's reply, and/or a live one started from it. */
      traces: Trace[];
      reactions: Reaction[];
      runs: Run[];
      /** Same author as the row above, close in time: the product collapses
       *  the header and shows the time on hover instead (a "burst"). */
      burst: boolean;
      /** Timing key of the beat that landed this row — the Studio's spotlight target. */
      beat?: string;
      /** Stage-clock second this line landed, when it types out rather than arriving whole. */
      typedAt?: number;
      /** Already there when the film opens: no entrance. */
      still?: boolean;
      /** Lands where a typing indicator was: the slot starts at that clearance. */
      replacesTyping?: boolean;
    };

type MessageRow = Extract<Row, { kind: "message" }>;

/** A message you sent from the composer. `at` is the cursor it landed at, so
 *  it keeps its place in the transcript as the scene plays on around it —
 *  and scrubs away with everything after that beat. */
type Sent = { id: string; body: string; time: string; at: number; jam?: JamCall; /** cast handle; you when absent */ who?: string; /** sent from the Jam panel's thread composer */ thread?: true };

type StageState = { rows: Row[]; /** the Jam panel's thread */ thread: Row[]; /** the DM the script opens */ dm: Row[]; /** what the room shows */ surface: Surface; /** DM handles gone unread */ unreadDms: string[]; /** the sidebar is in the window (it arrives with the first DM) */ sidebar: boolean; typing: Actor | null; /** the typing indicator belongs over the Jam thread's composer */ typingInThread: boolean; /** talking, before the transcript has caught up */ speaking: Actor | null; scriptedJam: JamCall | null; /** the scripted Jam is ringing in the header, not yet in the transcript */ ringing: boolean; /** where a scripted Jam panel sits — see jam-stage.tsx */ jamPhase: JamPhase; tab: "thread" | "transcript"; transcript: TranscriptSegment[] };

function stageAt(scene: Scene, cursor: number, sent: Sent[], now: number, T: Timing): StageState {
  let scriptedJam: JamCall | null = null;
  let ringing = false;
  let speakingNow: Actor | null = null;
  let pendingJamRow: { row: MessageRow; id: string } | null = null;
  let jamPhase: JamPhase = "docked";
  let tab: "thread" | "transcript" = "thread";
  const transcript: TranscriptSegment[] = [];
  const rows: Row[] = [];
  const thread: Row[] = [];
  const dm: Row[] = [];
  let surface: Surface = scene.surface;
  let unreadDms: string[] = [];
  let sidebar = false;
  const messages = new Map<string, MessageRow>();
  const runs = new Map<string, Run>();
  const push = (row: MessageRow, id: string, into: Row[] = rows) => {
    const prev = into[into.length - 1];
    row.burst = prev?.kind === "message" && prev.who === row.who && prev.runs.length === 0 && !prev.card && !prev.jam && !row.jam;
    into.push(row);
    messages.set(id, row);
  };
  const base = (who: Actor, time: string): MessageRow => ({ kind: "message", key: "", who, time, reactions: [], runs: [], traces: [], burst: false });
  const me = scene.cast[ME];
  const landSent = (at: number) => {
    for (const message of sent) {
      if (message.at !== at) continue;
      const who = (message.who && scene.cast[message.who]) || me;
      if (message.jam) push({ ...base(who, message.time), key: message.id, jam: message.jam }, message.id);
      else push({ ...base(who, message.time), key: message.id, body: message.body.split("\n").map((line) => [{ text: line }]) }, message.id, message.thread ? thread : rows);
    }
  };

  if (scene.beats.length === 0 && sent.length > 0) rows.push({ kind: "mark", key: "mark-today", label: "TODAY" });
  landSent(0);
  scene.beats.slice(0, cursor).forEach((beat, index) => {
    switch (beat.kind) {
      case "mark":
        rows.push({ kind: "mark", key: `mark-${index}`, label: beat.label, tone: beat.tone, beat: beatKey(index) });
        break;
      case "jam-start": {
        // Scripted Jams run on the stage clock (the timer is fed from it);
        // the card is authored by whoever opened it, and you are not in it
        // until a jam-join beat. Scrubbing back removes the whole thing.
        const call: JamCall = { id: beat.id, startedAt: now, endedAt: null, participants: beat.participants.map((handle) => scene.cast[handle]), joined: beat.participants[0] === ME };
        scriptedJam = call;
        const row: MessageRow = { ...base(scene.cast[beat.participants[0]], beat.time), key: beat.id, jam: call, beat: beatKey(index) };
        if (beat.ring) {
          // Rings in the header until you pick up; the card waits.
          ringing = true;
          pendingJamRow = { row, id: beat.id };
        } else {
          push(row, beat.id);
        }
        break;
      }
      case "jam-answer":
        ringing = false;
        if (pendingJamRow) { push(pendingJamRow.row, pendingJamRow.id); pendingJamRow = null; }
        break;
      case "jam-join":
        // Joining while it rings is the pick-up too: the card lands now.
        ringing = false;
        if (pendingJamRow) { push(pendingJamRow.row, pendingJamRow.id); pendingJamRow = null; }
        if (scriptedJam && !scriptedJam.joined) {
          scriptedJam.joined = true;
          scriptedJam.participants = [me, ...scriptedJam.participants.filter((actor) => actor !== me)];
          jamPhase = "hero";
        }
        break;
      case "jam-deploy":
        if (scriptedJam) jamPhase = "deploy";
        if (beat.tab) tab = beat.tab;
        break;
      case "jam-dock":
        jamPhase = "docked";
        break;
      case "jam-end":
        if (scriptedJam) { scriptedJam.endedAt = now; scriptedJam = null; }
        break;
      case "cursor":
      case "title":
      case "camera":
      case "type":
      case "context":
      case "logo":
        break;
      case "tab":
        tab = beat.tab;
        break;
      case "speak":
        speakingNow = scene.cast[beat.who];
        break;
      case "transcript":
        speakingNow = null;
        for (const segment of transcript) segment.final = true;
        transcript.push({ who: scene.cast[beat.who], text: beat.text, final: false });
        break;
      case "trace": {
        const row = messages.get(beat.on);
        if (!row) break;
        const existing = row.traces.find((trace) => trace.run === beat.run);
        if (existing) { existing.label = beat.label; existing.icon = beat.icon ?? null; }
        else row.traces.push({ run: beat.run, who: scene.cast[beat.who], label: beat.label, icon: beat.icon ?? null, done: false, tool: null, onReply: false });
        break;
      }
      case "trace-done": {
        for (const row of messages.values()) for (const trace of row.traces) if (trace.run === beat.run) { trace.done = true; trace.tool = beat.tool; }
        break;
      }
      case "typing":
        break;
      case "say": {
        const row: MessageRow = { ...base(scene.cast[beat.who], beat.time), key: beat.id, body: beat.body, beat: beatKey(index), typedAt: beat.typed ? T[beatKey(index)] : undefined, still: T[beatKey(index)] <= 0.5, replacesTyping: index > 0 && scene.beats[index - 1].kind === "typing" };
        // A finished run moves from the ask onto the agent's reply; runs already
        // sitting on a reply stay where they are.
        for (const other of messages.values()) {
          const moving = other.traces.filter((trace) => trace.done && !trace.onReply && trace.who === row.who);
          if (moving.length > 0) {
            // The finished run leaves the ask — folding away as the reply lands,
            // so the rows above move once — and the reply carries no "worked for" line.
            other.traces = other.traces.map((trace) => (moving.includes(trace) ? { ...trace, leaving: true } : trace));
          }
        }
        push(row, beat.id, beat.thread ? thread : beat.room === "dm" ? dm : rows);
        break;
      }
      case "sidebar":
        sidebar = true;
        break;
      case "dm-unread":
        if (!unreadDms.includes(beat.who)) unreadDms = [...unreadDms, beat.who];
        sidebar = true;
        break;
      case "surface":
        surface = beat.to;
        if (beat.to.kind === "dm") { const who = beat.to.who; unreadDms = unreadDms.filter((handle) => handle !== who); }
        break;
      case "card":
        push({ ...base(scene.cast[beat.who], beat.time), key: beat.id, card: beat.card, beat: beatKey(index) }, beat.id);
        break;
      case "attach":
        push({ ...base(scene.cast[beat.who], beat.time), key: beat.id, body: beat.body, attachment: beat.attachment, beat: beatKey(index) }, beat.id);
        break;
      case "react":
        messages.get(beat.on)?.reactions.push({ emoji: beat.emoji, count: beat.count });
        break;
      case "agent": {
        const run: Run = { run: beat.run, who: scene.cast[beat.who], task: beat.task, done: false };
        runs.set(beat.run, run);
        messages.get(beat.on)?.runs.push(run);
        break;
      }
      case "agent-done": {
        const run = runs.get(beat.run);
        if (run) run.done = true;
        push({ ...base(run?.who ?? scene.cast.ando, beat.time), key: beat.id, body: beat.body }, beat.id);
        break;
      }
    }
    landSent(index + 1);
  });

  // You never see your own indicator — your lines type in the composer instead.
  const last = cursor > 0 ? scene.beats[cursor - 1] : null;
  return { rows, thread, dm, surface, unreadDms, sidebar, typing: last?.kind === "typing" && last.who !== ME ? scene.cast[last.who] : null, typingInThread: last?.kind === "typing" && last.thread === true, speaking: last?.kind === "speak" ? speakingNow : null, scriptedJam, ringing, jamPhase, tab, transcript };
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

function fitImage(width: number, height: number) {
  let w = width, h = height;
  if (w > MAX_IMAGE_WIDTH) { h = h * (MAX_IMAGE_WIDTH / w); w = MAX_IMAGE_WIDTH; }
  if (h > MAX_IMAGE_HEIGHT) { w = w * (MAX_IMAGE_HEIGHT / h); h = MAX_IMAGE_HEIGHT; }
  return { width: Math.round(w), height: Math.round(h) };
}

/* ------------------------------ transcript ------------------------------ */

function Body({ body, caret = false }: { body: Segment[][]; /** the line is still being written — a caret rides its last letter */ caret?: boolean }) {
  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-2">
      {body.map((paragraph, pIndex) => {
        const p = (
        <p key={pIndex} className="kanso-text-label-14 m-0 whitespace-pre-wrap break-words text-ando-fg-primary">
          {paragraph.map((segment, sIndex) =>
            segment.mention ? (
              <span key={sIndex} className={`ando-inline-chip rounded-xs ${segment.agent ? "bg-ando-action-agent-tag text-ando-fg-on-agent-tag" : "bg-ando-bg-brand/10 text-ando-fg-brand"}`}>{segment.text}</span>
            ) : segment.link ? (
              <span key={sIndex} className="text-ando-fg-brand underline-offset-2 hover:underline">{segment.text}</span>
            ) : (
              <span key={sIndex}>{segment.text}</span>
            ),
          )}
          {caret && pIndex === body.length - 1 ? <span className="st-caret ml-px inline-block h-[15px] w-px translate-y-[3px] bg-ando-fg-primary" aria-hidden /> : null}
        </p>
        );
        // While a line is being written, each paragraph after the first
        // lands (slot + gap growing) the moment the writing reaches it.
        return caret && pIndex > 0 ? <Landing key={pIndex} gap={8}>{p}</Landing> : p;
      })}
    </div>
  );
}

/** image-attachment-presentation.tsx / video-attachment.tsx on the
 *  file-preview primitive: filename · size label, then the framed media. */
function AttachmentView({ attachment }: { attachment: Attachment }) {
  const fit = fitImage(attachment.width, attachment.height);
  const caption = `${attachment.filename} · ${formatFileSize(attachment.bytes)}`;
  return (
    <div className="ando-file-preview" style={{ ["--ando-file-preview-width" as string]: `${fit.width}px` }}>
      <span className="ando-file-preview__label kanso-text-label-12 truncate text-ando-fg-tertiary">{caption}</span>
      <div
        className="ando-file-preview__viewport group/attachment relative overflow-hidden rounded after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_var(--color-ando-border-alpha-light)]"
        style={{ width: fit.width, height: fit.height, background: attachment.type === "video" ? "#000" : "var(--color-ando-bg-fill-subtle)" }}
      >
        <img src={attachment.type === "image" ? attachment.src : attachment.poster} alt={attachment.filename} className="absolute inset-0 h-full w-full object-cover" />
        {attachment.type === "video" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-black/32 text-ando-white backdrop-blur-[4px]" aria-label="Play video">
              <Icon name="IconPlay" size={16} fill="filled" />
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const BANDS: Record<LaunchCard["band"], { tint: string; cells: string[] }> = {
  spark: { tint: "rgba(37,99,235,0.06)", cells: ["#2563eb", "#6b8fea", "#2563eb", "#6c9fc4", "#2563eb"] },
  ticket: { tint: "rgba(235,220,133,0.18)", cells: ["#ebdc85", "#d9b04a", "#ebdc85", "#c99a3c", "#ebdc85"] },
  grid: { tint: "rgba(120,113,108,0.08)", cells: ["#78716c", "#a8a29e", "#78716c", "#57534e", "#a8a29e"] },
};

/** The launch post — link-preview-card geometry (rounded-lg, hairline). */
function LaunchPost({ card }: { card: LaunchCard }) {
  const band = BANDS[card.band];
  return (
    <div className="mt-1 max-w-[440px] overflow-hidden rounded-lg bg-ando-bg-main shadow-[0_0_0_1px_var(--color-ando-border-alpha)]">
      <div className="flex h-[92px] items-end justify-center gap-2 px-5 pb-5" style={{ background: band.tint }}>
        {band.cells.map((color, index) => (
          <span key={index} className="st-band-cell block w-3 rounded-[3px]" style={{ background: color, height: [18, 34, 46, 28, 20][index], ["--i" as string]: index }} />
        ))}
      </div>
      <div className="flex flex-col gap-2 px-4 py-3">
        <span className="kanso-text-overline-11 text-ando-fg-brand">{card.eyebrow}</span>
        <span className="kanso-text-label-16-md text-ando-fg-primary">{card.title}</span>
        <span className="kanso-text-label-13 text-ando-fg-secondary">{card.blurb}</span>
        {card.bullets ? (
          <ul className="mt-1 flex flex-col gap-1.5">
            {card.bullets.map((bullet) => (
              <li key={bullet} className="kanso-text-label-13 flex items-start gap-2 text-ando-fg-secondary">
                <span className="mt-[7px] size-1 shrink-0 rounded-full bg-ando-fg-tertiary" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {card.cta ? (
          <span className="ando-button mt-2 w-fit gap-1.5" data-size="sm">
            {card.cta}
            <Icon name="IconArrowRight" size={14} className="text-ando-fg-reverse" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** An agent run pinned under the message that spawned it. */
function RunRow({ run }: { run: Run }) {
  return (
    <div className="flex w-full items-center gap-2 pt-1">
      <span className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 shadow-[0_0_0_1px_var(--color-ando-border-alpha)]" style={{ background: run.done ? "var(--color-ando-bg-main)" : "var(--color-ando-bg-fill-subtle)" }}>
        <span className="relative flex size-[18px] shrink-0 items-center justify-center">
          <img src={run.who.avatar} alt="" className="size-[13px] rounded-full object-cover" />
          <svg width={18} height={18} viewBox="0 0 24 24" className="absolute inset-0" aria-hidden>
            <circle className={run.done ? undefined : "st-orbit"} cx="12" cy="12" r="11" fill="none" stroke={run.done ? "var(--color-ando-action-success)" : "#f59e0b"} strokeWidth={1.5} strokeDasharray={run.done ? undefined : "3.5 4"} strokeLinecap="round" />
          </svg>
        </span>
        <span className="kanso-text-label-12 truncate text-ando-fg-secondary">
          <span className="text-ando-fg-primary">{run.who.name}</span>
          {run.done ? " finished · " : " · "}
          {run.task}
        </span>
        {run.done ? null : (
          <span className="relative h-[3px] w-14 shrink-0 overflow-hidden rounded-full bg-ando-bg-fill-muted">
            <span className="st-sweep absolute inset-y-0 left-0 w-1/3 rounded-full bg-ando-action-primary" />
          </span>
        )}
      </span>
    </div>
  );
}

/** message-reactions-presentation.tsx + emoji-pill-presentation.tsx */
function ReactionRow({ reactions }: { reactions: Reaction[] }) {
  return (
    <div className="flex flex-col items-start gap-1.5 pt-1.5 pb-0.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {reactions.map((reaction) => (
          <span key={reaction.emoji} className="st-react-in group/emoji-pill inline-flex h-7 w-fit items-center justify-center whitespace-nowrap rounded-sm border border-transparent bg-ando-action-secondary pl-[6px] pr-[5px] kanso-text-label-14-md font-medium text-ando-fg-secondary">
            <span className="inline-flex items-center gap-[3px]">
              <span className="relative inline-flex min-h-5 min-w-5 items-center justify-center leading-none"><span className="kanso-text-label-16 leading-none">{reaction.emoji}</span></span>
              <span className="inline-flex justify-center px-[2px] tabular-nums">{reaction.count}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

type TitleCard = { eyebrow?: string; sub?: string; headline: string; opacity: number };

/** Each run's steps and end, off the current timing. */
function tracePhasesFor(scene: Scene, timing: Timing): Record<string, TracePhases> {
  const out: Record<string, TracePhases> = {};
  scene.beats.forEach((beat, index) => {
    const t = timing[beatKey(index)];
    if (beat.kind === "trace") {
      const cur = out[beat.run] ?? { start: t, steps: [], done: Number.POSITIVE_INFINITY };
      out[beat.run] = { ...cur, steps: [...cur.steps, { t, label: beat.label, icon: beat.icon ?? null }] };
    }
    if (beat.kind === "trace-done" && out[beat.run]) out[beat.run] = { ...out[beat.run], done: t };
  });
  return out;
}

/** The title card over the app at `vt`, faded in and out, or null. */
function titleCardAt(scene: Scene, timing: Timing, vt: number): TitleCard | null {
  for (let index = 0; index < scene.beats.length; index += 1) {
    const beat = scene.beats[index];
    if (beat.kind !== "title") continue;
    const local = vt - timing[beatKey(index)];
    if (local < -0.05 || local > beat.hold) continue;
    // A hard cut, both ways — the poster lands, then it is gone.
    return { eyebrow: beat.eyebrow, sub: beat.sub, headline: beat.headline, opacity: 1 };
  }
  return null;
}

type JamActions = { muted: boolean; toggleMute: () => void; end: () => void; join: () => void; /** stage-clock seconds for a scripted Jam */ elapsed?: number; tracePhases: Record<string, TracePhases>; traceParticipants: Actor[]; traceVt: number; /** the clock typed lines read */ typeVt: number };

/** message-row-frame.tsx + message-view-sections.tsx */
/** The first `n` characters of a body, paragraph and segment structure kept. */
function sliceBody(body: Segment[][], n: number): Segment[][] {
  let left = n;
  const out: Segment[][] = [];
  for (const paragraph of body) {
    // The first paragraph is always there (empty, with the caret) so the row
    // has its line box — and its height — before the first letter.
    if (left <= 0 && out.length > 0) break;
    const p: Segment[] = [];
    for (const segment of paragraph) {
      if (left <= 0) break;
      const take = Math.min(left, segment.text.length);
      p.push({ ...segment, text: segment.text.slice(0, take) });
      left -= take;
    }
    out.push(p);
    left -= 1; // the paragraph break
  }
  return out;
}
const bodyLength = (body: Segment[][]) => body.reduce((n, paragraph) => n + paragraph.reduce((m, segment) => m + segment.text.length, 0) + 1, -1);

/** message-row-frame.tsx + message-view-sections.tsx. Lands the way the
 *  landing hero's rows do: the slot grows from nothing so what is above is
 *  pushed up by layout, and the row fades in — no scale. The row holds its
 *  top edge and clips while the slot grows, so it reveals in reading
 *  order (avatar, name, then the line) rather than last line first. */
function MessageRowView({ row, jamActions, anchor = "top", clearance = 36 }: { row: MessageRow; jamActions: JamActions; /** The list's typing-indicator clearance (px): a row replacing the indicator starts its slot there. */ clearance?: number; /** Which edge the row holds while its slot grows: bottom in a bottom-anchored transcript (what is above is pushed up), top in a top-anchored list like the Jam thread (the row reveals downward). */ anchor?: "bottom" | "top" }) {
  const activeCall = row.jam != null && row.jam.endedAt == null;
  // A typed line reveals itself at TYPE_CPS from the second it landed.
  const total = row.body ? bodyLength(row.body) : 0;
  const shown = row.typedAt != null && row.body ? Math.min(total, Math.max(0, Math.floor((jamActions.typeVt - row.typedAt) * TYPE_CPS))) : total;
  const typing = row.typedAt != null && shown < total;
  const body = row.body && row.typedAt != null ? sliceBody(row.body, shown) : row.body;
  // Rows that were there when the film opened do not land; they are simply there.
  const Slot = row.still ? StillSlot : Landing;
  return (
    <Slot anchor={anchor} from={row.replacesTyping ? clearance : 0} data-beat={row.beat} data-row-id={row.key}>
      {/* message-row-frame.tsx: a live call row wears the success wash and a 2px success edge */}
      <div className={`group relative min-w-0 -ml-4 px-4 py-1.5 ${activeCall ? "pl-3.5 pb-1.5 bg-ando-bg-success-subtle border-l-2 border-l-ando-action-success rounded-l-none rounded-r-md" : "rounded-r-md hover:bg-ando-bg-fill-subtle"}`}>
        <div className="flex min-w-0 w-full max-w-full items-start gap-2 overflow-visible">
          {row.burst ? (
            <div className="relative h-5 w-8 shrink-0 overflow-visible">
              <span className="kanso-text-label-11 absolute right-0 top-1/2 -translate-y-1/2 select-none whitespace-nowrap tabular-nums text-ando-fg-tertiary opacity-0 group-hover:opacity-100">{row.time}</span>
            </div>
          ) : (
            <Avatar actor={row.who} size={32} />
          )}
          <div className="flex min-w-0 flex-1 flex-col overflow-visible">
            {row.burst ? null : (
              <div className="flex flex-wrap items-baseline gap-x-1.5 pb-0.5">
                <span className="kanso-text-label-14-md text-ando-fg-primary">{row.who.name}</span>
                <span className="kanso-text-label-12 text-ando-fg-tertiary">{row.time}</span>
              </div>
            )}
            <div className="flex min-w-0 w-full max-w-full flex-col gap-2">
              {body ? <Body body={body} caret={typing} /> : null}
              {row.card ? <LaunchPost card={row.card} /> : null}
              {row.attachment ? <div className="pt-1.5"><AttachmentView attachment={row.attachment} /></div> : null}
              {row.jam ? (row.jam.endedAt == null ? <ActiveJamCallCard call={row.jam} muted={jamActions.muted} elapsed={jamActions.elapsed} onToggleMute={jamActions.toggleMute} onEnd={jamActions.end} onJoin={jamActions.join} /> : <EndedJamCallCard call={row.jam} />) : null}
              {row.reactions.length > 0 ? <ReactionRow reactions={row.reactions} /> : null}
              {row.traces.map((trace) => jamActions.tracePhases[trace.run] ? (trace.leaving ? <Leaving key={trace.run} gap={8}><TraceLine agent={trace.who} participants={jamActions.traceParticipants} phases={jamActions.tracePhases[trace.run]} vt={jamActions.traceVt} onReply={trace.onReply} /></Leaving> : <Landing key={trace.run} gap={8}><TraceLine agent={trace.who} participants={jamActions.traceParticipants} phases={jamActions.tracePhases[trace.run]} vt={jamActions.traceVt} onReply={trace.onReply} /></Landing>) : null)}
              {row.runs.map((run) => <RunRow key={run.run} run={run} />)}
            </div>
          </div>
        </div>
      </div>
    </Slot>
  );
}

function StillSlot({ children, className = "", ...rest }: { children: React.ReactNode; className?: string; anchor?: "top" | "bottom"; from?: number } & Record<`data-${string}`, string | undefined>) {
  const { anchor: _anchor, from: _from, ...attrs } = rest as { anchor?: "top" | "bottom"; from?: number } & Record<`data-${string}`, string | undefined>;
  void _anchor; void _from;
  return <div className={`flex w-full flex-col ${className}`} {...attrs}>{children}</div>;
}

/** message-timeline-divider */
function MarkRow({ label, tone, beat }: { label: string; tone?: "attention"; beat?: string }) {
  return (
    <div className="st-land ando-message-timeline-divider" data-tone={tone} data-beat={beat} role="separator">
      <span className="ando-message-timeline-divider__line ando-message-timeline-divider__line--start"><span className="ando-message-timeline-divider__cap" /><span className="ando-message-timeline-divider__rule" /></span>
      <span className="ando-message-timeline-divider__label"><span className="ando-message-timeline-divider__label-primary kanso-text-overline-11">{label}</span></span>
      <span className="ando-message-timeline-divider__line ando-message-timeline-divider__line--end"><span className="ando-message-timeline-divider__rule" /><span className="ando-message-timeline-divider__cap" /></span>
    </div>
  );
}

/* --------------------------------- page --------------------------------- */

export default function AndoStage() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = SCENES[sceneIndex];
  const lanes = useMemo(() => lanesFor(scene), [scene]);
  const total = useMemo(() => totalFor(scene), [scene]);
  const timing = useMemo(() => defaultTiming(scene), [scene]);
  const cycleScene = useCallback(() => setSceneIndex((index) => (index + 1) % SCENES.length), []);

  if (scene.beats.length === 0) {
    // Nothing to direct: the room alone, live.
    return <Stage key={scene.id} scene={scene} hooks={null} timing={timing} onCycleScene={cycleScene} />;
  }
  return (
    <Studio
      key={scene.id}
      defaultTiming={timing}
      lanes={lanes}
      notesUrl="/ando-stage/api/notes"
      savesKey={`ando-stage-composer-saves:${scene.id}:${scene.beats.length}`}
      scope={scene.id}
      span={Math.ceil(total(timing))}
      title={`Timeline · ${scene.name}`}
      total={total}
    >
      {({ timing: edited, hooks, run }) => (
        // A restored take may predate beats added since; defaults fill the gaps.
        <Stage key={`${scene.id}:${run}`} scene={scene} hooks={hooks} timing={{ ...timing, ...edited }} onCycleScene={cycleScene} />
      )}
    </Studio>
  );
}

function Stage({ scene, hooks, timing, onCycleScene }: { scene: Scene; hooks: Hooks | null; timing: Timing; onCycleScene: () => void }) {
  const [cursor, setCursor] = useState(0);
  // The script control stays out of the frame unless asked for (`h`).
  const [chromeHidden, setChromeHidden] = useState(true);
  const [sent, setSent] = useState<Sent[]>([]);
  // Seconds a scripted Jam has been open, off the stage clock (null: none).
  const [jamElapsed, setJamElapsed] = useState<number | null>(null);
  const elapsedRef = useRef<number | null>(null);
  // The trace card reads the clock at 10Hz — its motion is CSS; it only needs
  // the phase to move.
  const [traceVt, setTraceVt] = useState(0);
  const traceVtRef = useRef(0);
  // Typed agent lines read the clock at 30Hz.
  const [typeVt, setTypeVt] = useState(0);
  const typeVtRef = useRef(0);
  // The title card is a hard cut, so it is written the frame the beat lands —
  // not on the 10Hz clock the trace line rides.
  const [titleCard, setTitleCard] = useState<TitleCard | null>(null);
  const titleRef = useRef<string | null>(null);
  // The cut's cards: mounted on the beat (a hard cut), moved per frame.
  const [typeCard, setTypeCard] = useState<TypeCardOn | null>(null);
  const typeKeyRef = useRef<string | null>(null);
  const [logoOn, setLogoOn] = useState(false);
  const logoOnRef = useRef(false);
  // The agent's context trace between the type card and the cut back; it
  // reads its own local time off this ref every frame.
  const [contextCard, setContextCard] = useState<ContextOn | null>(null);
  const contextKeyRef = useRef<string | null>(null);
  const contextLocalRef = useRef(0);
  // The camera: the whole room on one transform, posed every frame from the
  // shot that is on. `cameraPose` is what was last applied, so an anchor's
  // screen rect can be brought back to room px; `anchorCache` keeps the last
  // place each anchor was seen for the frames it is not in the DOM.
  const cameraRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const cameraPose = useRef({ tx: 0, ty: 0, s: 1 });
  const anchorCache = useRef(new Map<string, { x: number; y: number }>());
  // The panel tab you clicked yourself overrides the script's until the next tab beat.
  const [tabOverride, setTabOverride] = useState<"thread" | "transcript" | null>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const cursorGlyphRef = useRef<HTMLImageElement>(null);
  // Where the pointer actually is, and where the current glide left from.
  // A glide starts from the pointer's real position — not from a target that
  // may have moved or gone (the Join button after you join) — so every move
  // is continuous. The origin is captured when a new cursor beat begins.
  const pointerPos = useRef<{ x: number; y: number } | null>(null);
  const pointerGlide = useRef<{ at: number; origin: { x: number; y: number } } | null>(null);
  // Wall time the current take started.
  const [mounted] = useState(() => Date.now());
  // The live Jam: which sent entry carries it, whether the panel is docked
  // open, and the local mute. Ending it freezes the card into "Jam lasted".
  const [jamId, setJamId] = useState<string | null>(null);
  const [jamPanelOpen, setJamPanelOpen] = useState<boolean | null>(null);
  const [jamMuted, setJamMuted] = useState(false);

  const total = scene.beats.length;
  const { rows, thread, dm, surface, unreadDms, sidebar, typing, typingInThread, speaking: talking, scriptedJam, ringing, jamPhase, tab: scriptedTab, transcript } = useMemo(() => stageAt(scene, cursor, sent, mounted, timing), [scene, cursor, sent, mounted, timing]);
  const rowRef = useRef<HTMLDivElement>(null);
  // The Jam panel's column: measured so its thread section can be a set
  // height in every phase (px to px animates; px to auto would jump).
  const [rowH, setRowH] = useState(0);
  const [jamStageH, setJamStageH] = useState(0);
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const measure = () => {
      setRowH(el.clientHeight);
      const stage = el.querySelector<HTMLElement>("[data-jam-stage]");
      if (stage) setJamStageH(stage.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // Re-measure whenever the panel mounts or changes phase: the call stage
    // is only in the DOM once you have joined, and the docked thread
    // section is sized from its height.
  }, [scriptedJam?.id, scriptedJam?.joined, ringing, jamId, jamPhase]);
  const jamTab = tabOverride ?? scriptedTab;
  // The newest transcript segment is still being said; its speaker is live.
  const lastSegment = transcript[transcript.length - 1];
  const speaking = talking ?? (lastSegment && !lastSegment.final ? lastSegment.who : null);
  const scriptedTabRef = useRef(scriptedTab);
  useEffect(() => {
    if (scriptedTabRef.current !== scriptedTab) { scriptedTabRef.current = scriptedTab; setTabOverride(null); }
  }, [scriptedTab]);

  const sentJustNow = useRef(false);
  const land = useCallback((entries: Array<Omit<Sent, "time" | "at">>) => {
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const at = Math.min(cursor, total);
    sentJustNow.current = true;
    setSent((current) => [...current, ...entries.map((entry) => ({ ...entry, time, at }))]);
  }, [cursor, total]);
  const send = useCallback((text: string) => land([{ id: `sent-${Date.now()}`, body: text }]), [land]);
  const sendThread = useCallback((text: string) => land([{ id: `thread-${Date.now()}`, body: text, thread: true }]), [land]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollFrame = useRef<number | null>(null);

  // Hand-driven: `behavior: "smooth"` is silently dropped in some embedded
  // browsers, and a transcript that glides on one machine and snaps on
  // another is useless for capture.
  const followBottom = useCallback((animate: boolean) => {
    const element = scrollRef.current;
    if (!element) return;
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    const target = element.scrollHeight - element.clientHeight;
    const from = element.scrollTop;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduced || Math.abs(target - from) < 2) {
      element.scrollTop = target;
      scrollFrame.current = null;
      return;
    }
    // Rows grow their slot over 300ms (the landing hero's entrance), so the
    // bottom keeps moving while we chase it: track the live maximum each
    // frame for the length of that entrance, then ease onto the final one.
    const started = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / 380);
      const live = element.scrollHeight - element.clientHeight;
      const eased = 1 - Math.pow(1 - t, 3);
      element.scrollTop = t < 0.85 ? live : from + (live - from) * eased;
      scrollFrame.current = t < 1 ? requestAnimationFrame(tick) : null;
    };
    scrollFrame.current = requestAnimationFrame(tick);
    void target;
  }, []);

  useEffect(() => () => { if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current); }, []);

  // Scripted lines land as their speakers, in order, after everything already said.
  const appendScript = useCallback((lines: ScriptLine[]) => {
    const now = Date.now();
    land(lines.map((line, index) => ({ id: `script-${now}-${index}`, body: line.text, who: line.who })));
  }, [land]);
  const clearConversation = useCallback(() => { setSent([]); setJamId(null); setJamPanelOpen(null); }, []);

  // Starting a Jam sends its card the way a typed message sends: same path,
  // same slot at the end of the transcript, same clock.
  const startJam = useCallback(() => {
    const now = Date.now();
    const id = `jam-${now}`;
    land([{ id, body: "", jam: { id, startedAt: now, endedAt: null, participants: [scene.cast[ME]], joined: true } }]);
    setJamId(id);
    setJamMuted(false);
    setJamPanelOpen(true);
  }, [land, scene.cast]);
  const endJam = useCallback(() => {
    const endedAt = Date.now();
    setSent((current) => current.map((entry) => (entry.id === jamId && entry.jam ? { ...entry, jam: { ...entry.jam, endedAt } } : entry)));
    setJamId(null);
    setJamPanelOpen(null);
  }, [jamId]);
  const liveJam = sent.find((entry) => entry.id === jamId)?.jam ?? null;
  const jamCall = scriptedJam ?? liveJam;
  // A scripted Jam docks its panel while it runs; a live one opens on start
  // and can be collapsed.
  const panelOpen = scriptedJam != null ? scriptedJam.joined && !ringing && jamPanelOpen !== false : jamPanelOpen === true;
  // Joining a scripted Jam by hand just opens the panel; the script decides when you are in.
  // Each run's moments, off the current timing: first trace beat, the one
  // that reads the transcript, the one that drafts, and trace-done.
  const tracePhases = tracePhasesFor(scene, timing);
  const traceParticipants = useMemo(() => {
    const start = scene.beats.find((beat) => beat.kind === "jam-start");
    const joiner = scene.beats.some((beat) => beat.kind === "jam-join") ? [scene.cast[ME]] : [];
    return start && start.kind === "jam-start" ? [...joiner, ...start.participants.map((handle) => scene.cast[handle])] : [scene.cast[ME]];
  }, [scene]);
  const jamActions: JamActions = { muted: jamMuted, toggleMute: () => setJamMuted((current) => !current), end: endJam, join: () => setJamPanelOpen(true), elapsed: scriptedJam ? (jamElapsed ?? 0) : undefined, tracePhases, traceParticipants, traceVt, typeVt };
  // The room as shown: the scene with whatever surface the script has opened.
  const room = useMemo<Scene>(() => ({ ...scene, surface }), [scene, surface]);
  const jamTarget = scene.surface.kind === "channel" ? `#${scene.surface.name}` : scene.cast[scene.surface.who].name;

  // The driver: one rAF loop, one virtual clock, the cursor derived from it
  // every frame in both directions. Timing lives in a ref so a drag re-times
  // live without restarting the clock; only the Studio's run key resets vt.
  const timingRef = useRef(timing);
  useEffect(() => { timingRef.current = timing; }, [timing]);
  const cursorRef = useRef(0);
  const [scriptedDraft, setScriptedDraft] = useState<string | null>(null);
  const draftRef = useRef<string | null>(null);
  // Where the typed line is going: the Jam thread's composer or the room's.
  const [draftInThread, setDraftInThread] = useState(false);
  const draftInThreadRef = useRef(false);
  useEffect(() => {
    if (!hooks) return;
    let raf = 0;
    let vt = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const T = timingRef.current;
      const speed = hooks.pausedRef.current ? 0 : hooks.speedRef.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (hooks.seekRef.current != null) {
        vt = Math.max(0, hooks.seekRef.current);
        hooks.seekRef.current = null;
      } else {
        vt = Math.min(totalFor(scene)(T), vt + dt * speed);
      }
      hooks.onTick(vt);
      const next = cursorAt(scene, T, vt);
      if (next !== cursorRef.current) { cursorRef.current = next; setCursor(next); }
      const draft = scriptedDraftAt(scene, T, vt);
      if (draft !== draftRef.current) { draftRef.current = draft; setScriptedDraft(draft); }
      const inThread = draft != null && scriptedDraftInThread(scene, T, vt);
      if (inThread !== draftInThreadRef.current) { draftInThreadRef.current = inThread; setDraftInThread(inThread); }
      const elapsed = jamElapsedAt(scene, T, vt);
      if (elapsed !== elapsedRef.current) { elapsedRef.current = elapsed; setJamElapsed(elapsed); }
      const coarse = Math.floor(vt * 10) / 10;
      if (coarse !== traceVtRef.current) { traceVtRef.current = coarse; setTraceVt(coarse); }
      const fine = Math.floor(vt * 30) / 30;
      if (fine !== typeVtRef.current) { typeVtRef.current = fine; setTypeVt(fine); }
      const card = titleCardAt(scene, T, vt);
      const cardKey = card ? card.headline : null;
      if (cardKey !== titleRef.current) { titleRef.current = cardKey; setTitleCard(card); }

      // The type card: cut in on the beat, each word landing on its own time.
      const tc = typeCardAt(scene, T, vt);
      const tcKey = tc?.key ?? null;
      if (tcKey !== typeKeyRef.current) { typeKeyRef.current = tcKey; setTypeCard(tc); }
      if (tc) {
        const lines = Array.from(document.querySelectorAll<HTMLElement>("[data-type-line]"));
        if (lines.length > 0) {
          const local = vt - tc.t;
          // Each face pops in with the word (of the first line) it is keyed to.
          const faces = Array.from(document.querySelectorAll<HTMLElement>("[data-type-faces] [data-face]"));
          faces.forEach((face) => {
            const on = Number(face.dataset.on ?? 0);
            const p = seg(local, on * WORD_CADENCE, FACE_LAND);
            face.style.opacity = `${Math.min(1, p * 3)}`;
            face.style.transform = `translateY(${10 * (1 - ease(p))}px) scale(${0.6 + 0.4 * backOut(p)})`;
          });
          // The card as a whole lifts away after its last line's hold.
          const exit = easeInOut(seg(local, tc.hold, TYPE_EXIT));
          lines.forEach((line, li) => {
            const start = tc.starts[li];
            const words = Array.from(line.querySelectorAll<HTMLElement>("[data-word]"));
            // The line sits centred at its full width from the start; each
            // word rises out of a blur into its place (no sideways slide, and
            // the line never re-centres as words arrive — that stepped).
            words.forEach((word, i) => {
              const p = ease(seg(local, start + i * WORD_CADENCE, WORD_LAND));
              word.style.opacity = `${p}`;
              word.style.transform = `translateY(${(1 - p) * 16}px) scale(${0.96 + 0.04 * p})`;
              word.style.filter = `blur(${(1 - p) * 8}px)`;
            });
            // The whole line settles up into its seat with its first word.
            const settle = ease(seg(local, start, WORD_LAND + 0.2));
            // A line that has had its hold lifts and blurs away above the next;
            // the last line leaves with the card. The lift eases both ways.
            const last = li === lines.length - 1;
            const gone = last ? exit : easeInOut(seg(local, tc.ends[li], LINE_EXIT));
            // Only one ghost at a time: a lifted line is gone for good once the line after it leaves too.
            const buried = li + 1 < lines.length - 1 ? easeInOut(seg(local, tc.ends[li + 1], LINE_EXIT)) : li + 1 === lines.length - 1 ? exit : 0;
            const lift = last ? 28 : 110;
            line.style.transform = `translateY(${12 * (1 - settle) - lift * gone}px)`;
            line.style.opacity = `${last ? 1 - gone : (1 - 0.85 * gone) * (1 - buried)}`;
            line.style.filter = last ? "none" : `blur(${6 * gone}px)`;
          });
          // The stack lifts with the first line.
          const stack = document.querySelector<HTMLElement>("[data-type-faces]");
          if (stack) {
            const gone = lines.length > 1 ? easeInOut(seg(local, tc.ends[0], LINE_EXIT)) : exit;
            const buried = lines.length > 2 ? easeInOut(seg(local, tc.ends[1], LINE_EXIT)) : lines.length === 2 ? exit : 0;
            stack.style.transform = `translateY(${-(lines.length > 1 ? 110 : 28) * gone}px)`;
            stack.style.opacity = `${lines.length > 1 ? (1 - 0.85 * gone) * (1 - buried) : 1 - gone}`;
            stack.style.filter = lines.length > 1 ? `blur(${6 * gone}px)` : "none";
          }
          // The white goes with the last line, so the next shot shows through.
          const card = document.querySelector<HTMLElement>("[data-type-card]");
          if (card) card.style.opacity = `${1 - exit}`;
        }
      }

      // The context card: mounted on its beat; its clock is a ref it reads itself.
      const cc = contextAt(scene, T, vt);
      const ccKey = cc?.key ?? null;
      if (ccKey !== contextKeyRef.current) { contextKeyRef.current = ccKey; setContextCard(cc); }
      contextLocalRef.current = cc ? vt - cc.t : 0;

      // The logo: cut in, whole, and hold. No motion.
      const logoT = logoAt(scene, T, vt);
      const on = logoT != null;
      if (on !== logoOnRef.current) { logoOnRef.current = on; setLogoOn(on); }
      if (logoT != null) {
        const mark = document.querySelector<HTMLElement>("[data-logo-mark]");
        const letters = document.querySelector<HTMLElement>("[data-logo-letters]");
        if (mark && letters) {
          mark.style.opacity = "1";
          mark.style.transform = `translate(${MARK_OFFSET.x}px, ${MARK_OFFSET.y}px)`;
          letters.style.opacity = "1";
          letters.style.transform = `translate(${LETTERS_OFFSET.x}px, ${LETTERS_OFFSET.y}px)`;
        }
      }

      // The window pops up from the bottom as the film opens: 0.97 → 1, quick.
      const win = windowRef.current;
      if (win) {
        // The window rises 20px into place, no scale, on a quartic ease-out.
        const p = 1 - Math.pow(1 - seg(vt, 0.15, 0.6), 4);
        // ...and in the CARD_LEAD before a type card cuts in, the whole UI
        // recedes: it blurs, dims and eases down a touch, so the card lands
        // on something already letting go. It is back the frame the card is
        // up (the card covers it) — so the card's exit reveals it whole.
        const next = nextTypeCardAt(scene, T, vt);
        const recede = next == null ? 0 : easeInOut(seg(vt, next - CARD_LEAD, CARD_LEAD));
        win.style.opacity = `${Math.min(1, p * 1.6) * (1 - 0.4 * recede)}`;
        win.style.transform = `translateY(${20 * (1 - p)}px) scale(${1 - 0.04 * recede})`;
        win.style.filter = recede > 0 ? `blur(${8 * recede}px)` : "none";
      }

      // The camera. Every anchor is read from live layout and brought back
      // to room px through the pose last applied; a cut snaps, a shot change
      // glides over 0.9s, and within a shot the push runs on its own ease.
      const cam = cameraRef.current;
      if (cam) {
        const { cur, prev } = shotsAt(scene, T, vt, totalFor(scene)(T));
        {
          const W = cam.clientWidth;
          const H = cam.clientHeight;
          const pose0 = cameraPose.current;
          const resolve = (at: string) => {
            const el = document.querySelector<HTMLElement>(anchorSelector(at as Parameters<typeof anchorSelector>[0]));
            if (el) {
              const r = el.getBoundingClientRect();
              const c = { x: (r.left + r.width / 2 - pose0.tx) / pose0.s, y: (r.top + r.height / 2 - pose0.ty) / pose0.s };
              anchorCache.current.set(at, c);
              return c;
            }
            return anchorCache.current.get(at) ?? { x: W / 2, y: H / 2 };
          };
          let s = 1;
          let c = { x: W / 2, y: H / 2 };
          if (cur) {
            // A camera beat is on: the shot is the author's.
            const now = { s: shotScale(cur, vt), c: resolve(cur.at) };
            s = now.s;
            c = now.c;
            if (!cur.cut && prev) {
              const from = { s: shotScale(prev, cur.t), c: resolve(prev.at) };
              const g = ease(seg(vt, cur.t, 0.9));
              s = from.s + (now.s - from.s) * g;
              c = { x: from.c.x + (now.c.x - from.c.x) * g, y: from.c.y + (now.c.y - from.c.y) * g };
            }
          } else {
            // Otherwise the camera follows the presses, Screen Studio style.
            const auto = autoPoseAt(pressesOf(scene, T), vt, resolve, { x: W / 2, y: H / 2 });
            s = auto.s;
            c = auto.c;
          }
          let tx = W / 2 - c.x * s;
          let ty = H / 2 - c.y * s;
          if (s >= 1) {
            tx = Math.min(0, Math.max(W - W * s, tx));
            ty = Math.min(0, Math.max(H - H * s, ty));
          }
          cam.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
          cameraPose.current = { tx, ty, s };
        }
      }
      // The pointer: per-frame writes, measured from live layout (nothing it
      // aims at is transformed, so rects are safe to read every frame).
      const pointer = pointerRef.current;
      if (pointer) {
        const pose = pointerAt(scene, T, vt);
        if (!pose) {
          pointer.style.opacity = "0";
        } else {
          const aim = (target: string | null) => {
            const selector = target == null ? null : target.startsWith("dm:") ? `[data-sidebar-dm="${target.slice(3)}"]` : CURSOR_TARGETS[target as keyof typeof CURSOR_TARGETS];
            const el = selector ? document.querySelector<HTMLElement>(selector) : null;
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return target === "composer" ? { x: r.left + 28, y: r.top + 22 } : { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          };
          const to = aim(pose.to);
          if (to) {
            // New beat: leave from where we are. Scrubbed into a beat cold,
            // the best guess is the previous target's live position, then
            // the composer — where a hand rests between moves.
            if (pointerGlide.current == null || pointerGlide.current.at !== pose.at) {
              const rest = aim(pose.from) ?? aim("composer") ?? { x: to.x + 160, y: to.y + 120 };
              pointerGlide.current = { at: pose.at, origin: pose.progress < 0.02 && pointerPos.current ? pointerPos.current : rest };
            }
            const from = pointerGlide.current.origin;
            // The house ease, and a touch of arc so a long move reads as a
            // hand travelling rather than a value tweening.
            const e = 1 - Math.pow(1 - pose.progress, 2.2);
            const arc = Math.sin(Math.PI * pose.progress) * Math.min(24, Math.hypot(to.x - from.x, to.y - from.y) * 0.06);
            const x = from.x + (to.x - from.x) * e;
            const y = from.y + (to.y - from.y) * e - arc;
            pointerPos.current = { x, y };
            pointer.style.opacity = "1";
            pointer.style.transform = `translate(${x}px, ${y}px) scale(${cameraPose.current.s * (1 - 0.15 * pose.press)})`;
            const glyph = cursorGlyphRef.current;
            const c = CURSOR_GLYPHS[pose.glyph];
            if (glyph && glyph.getAttribute("src") !== c.src) { glyph.src = c.src; glyph.width = c.w; glyph.height = c.h; glyph.style.margin = `${c.dy}px 0 0 ${c.dx}px`; }
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [hooks, scene]);

  // `typing` is a dep on purpose: the indicator slot adds clearance under the
  // transcript, and the last message must ride up out from under it.
  useEffect(() => {
    const own = sentJustNow.current;
    sentJustNow.current = false;
    followBottom(cursor !== 0 && !own);
  }, [cursor, sent.length, typing, followBottom]);

  // The Studio owns space, scrub and speed. The stage keeps two keys: `h`
  // hides the script control for a clean frame, `s` swaps scene.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-stage-editor], input, textarea, [contenteditable]")) return;
      if (event.key === "h" || event.key === "H") setChromeHidden((current) => !current);
      if (event.key === "s" || event.key === "S") onCycleScene();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCycleScene]);

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-[#0f1113] text-ando-fg-primary">
      {/* The frame (Ando-Brand 3972-4994): a 16:9 canvas on the sky, letterboxed to the
          viewport, with the window inset in it — 79% wide, 83% tall, centred. */}
      <div
        data-stage-canvas
        className="absolute left-1/2 overflow-hidden"
        style={{ top: `calc((100dvh - ${hooks && !chromeHidden ? STUDIO_CLEARANCE : 0}px) / 2)`, width: `min(100vw, calc((100dvh - ${hooks && !chromeHidden ? STUDIO_CLEARANCE : 0}px) * 16 / 9))`, aspectRatio: "16 / 9", transform: "translate(-50%, -50%)" }}
      >
        <img src="/ando-stage/sky.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      {/* The camera: the whole room on one transform (cards.tsx). */}
      <div ref={cameraRef} className="absolute inset-0 will-change-transform" style={{ transformOrigin: "0 0" }}>
      {/* The window. It arrives as the film opens (the driver writes its entrance). */}
      <div ref={windowRef} data-stage-window className="absolute overflow-hidden rounded-xl bg-ando-bg-main" style={{ left: "10.4%", top: "8.4%", width: "79.2%", height: "83.2%", boxShadow: "0 24px 64px rgba(15,17,19,0.22), 0 0 0 1px rgba(15,17,19,0.06)", opacity: 0 }}>
      {/* No top bar and no rail: the sidebar, the room and the panel are the whole window. */}
      <div ref={rowRef} className="relative flex h-full min-h-0">
        {/* The sidebar stays out of the window until the first DM lands, then slides in with the unread row. */}
        <div className="shrink-0 overflow-hidden" style={{ width: sidebar ? 354 : 0, transition: "width 700ms cubic-bezier(0.2, 0, 0, 1)" }}>
          <Sidebar scene={room} unreadDms={unreadDms} />
        </div>
        {/* layout.tsx: main content card, 1px hairline from the panel */}
        <main data-stage-main className="relative flex min-w-0 flex-1 flex-col overflow-clip bg-ando-bg-main" style={{ boxShadow: "-1px 0 0 var(--color-ando-border-default)" }}>
          <ConversationHeader scene={room} jamControl={<JamHeaderControl active={jamCall != null} ringing={ringing} participants={jamCall?.participants ?? [scene.cast[ME]]} onClick={() => (jamCall == null ? startJam() : setJamPanelOpen((open) => !open))} />} />
          {/* The typing indicator's clearance eases in and out on the landing curve, so the transcript never jumps when someone stops typing and their line lands. */}
          <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4" style={{ paddingBottom: typing && !typingInThread ? 44 : 8, transition: typing && !typingInThread ? "padding-bottom 300ms cubic-bezier(0.3, 0.8, 0.3, 1)" : "none" }}>
            <div aria-hidden className="mt-auto shrink-0" />
            {(surface.kind === "dm" ? dm : rows).map((row) => row.kind === "mark" ? <MarkRow key={row.key} label={row.label} tone={row.tone} beat={row.beat} /> : <MessageRowView key={row.key} row={row} jamActions={jamActions} />)}
          </div>
          <Composer scene={room} typing={typingInThread ? null : typing} onSend={send} scripted={draftInThread ? null : scriptedDraft} />
        </main>
        {jamCall != null && jamCall.endedAt == null && panelOpen ? (
          <>
            {/* The panel's column opens in the layout as it docks. */}
            <div aria-hidden className="shrink-0" style={{ width: jamPhase === "docked" ? "var(--ando-desktop-side-panel-width)" : 0, transition: `width ${JAM_MOVE}` }} />
            <JamStage phase={jamPhase} row={rowRef}>
              <JamPanel
                call={jamCall}
                target={jamTarget}
                muted={jamMuted}
                elapsed={jamActions.elapsed}
                tab={jamTab}
                transcript={transcript}
                speaking={speaking}
                onTab={setTabOverride}
                onToggleMute={jamActions.toggleMute}
                onEnd={scriptedJam ? () => setJamPanelOpen(false) : endJam}
                onCollapse={() => setJamPanelOpen(false)}
                docked={jamPhase === "docked"}
                slideIn={scriptedJam == null}
                lowerHeight={scriptedJam ? lowerHeightFor(jamPhase, rowH, jamStageH) : null}
                composer={jamPhase === "docked"}
                scripted={draftInThread ? scriptedDraft : null}
                typing={typingInThread ? typing : null}
                onSend={sendThread}
                threadCount={thread.length}
                thread={thread.map((row) => row.kind === "mark" ? <MarkRow key={row.key} label={row.label} tone={row.tone} beat={row.beat} /> : <MessageRowView key={row.key} row={row} jamActions={jamActions} anchor="top" clearance={40} />)}
              />
            </JamStage>
          </>
        ) : null}
      </div>
      </div>
      </div>
      </div>

      {titleCard ? (
        <div className="pointer-events-none fixed inset-0 z-[80] flex flex-col items-center justify-center gap-3 bg-[#fafaf9] text-[#1a1817]" aria-hidden>
          {titleCard.eyebrow ? <span className="font-mono text-[12px] uppercase leading-4 tracking-[0.14em] text-[#58524e]">{titleCard.eyebrow}</span> : null}
          {titleCard.sub ? <span className="text-[15px] leading-5 text-[#58524e]">{titleCard.sub}</span> : null}
          <span className="mt-3 text-[44px] leading-[1.1] tracking-[-0.01em]" style={{ fontFamily: "'Times New Roman', Times, Georgia, serif" }}>{titleCard.headline}</span>
        </div>
      ) : null}
      {typeCard ? <TypeCard card={typeCard} /> : null}
      {contextCard ? <ContextCard localRef={contextLocalRef} hold={contextCard.hold} /> : null}
      {logoOn ? <LogoCard /> : null}
      {/* Your pointer, when the script moves it. The brand cursor set from
          /public/cursors (see app/affiliate/mini-ando.tsx); hotspot offsets
          ride the translate point. */}
      {hooks ? (
        <div ref={pointerRef} className="pointer-events-none fixed left-0 top-0 z-[70] opacity-0 will-change-transform" style={{ transformOrigin: "0 0" }} aria-hidden>
          <img ref={cursorGlyphRef} src={CURSOR_GLYPHS.arrow.src} alt="" width={CURSOR_GLYPHS.arrow.w} height={CURSOR_GLYPHS.arrow.h} className="max-w-none drop-shadow-sm" style={{ margin: `${CURSOR_GLYPHS.arrow.dy}px 0 0 ${CURSOR_GLYPHS.arrow.dx}px` }} />
        </div>
      ) : null}
      <ScriptControl cast={scene.cast} onAppend={appendScript} onClear={clearConversation} hidden={chromeHidden} sceneName={scene.name} onCycleScene={onCycleScene} />

    </div>
  );
}
