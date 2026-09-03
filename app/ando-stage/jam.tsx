"use client";

// Jam — the product's voice/video call, as it shows up in three places:
// the header control (jam-popover/jam-header-controls.tsx), the call cards
// in the transcript (message-list/message/jam-call-card/*), and the docked
// panel on the right (jam-panel/index.tsx, docked-stage.tsx,
// participant-tile.tsx, call-controls.tsx, jam-panel-tabs.tsx). Classes are
// the production strings; the LiveKit room is the only thing not here.

import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode, useState } from "react";
import { TypingIndicator } from "./typing";
import { Icon } from "./glyph";
import { Avatar } from "./chrome";
import { Landing } from "./landing";
import { motion } from "motion/react";
import type { Actor } from "./scenes";

export type TranscriptSegment = { who: Actor; text: string; final: boolean };

/** The live-call glyph, animated: IconVoiceHigh's five bars, breathing. */
export function VoiceGlyph({ className = "" }: { className?: string }) {
  const bars = [
    { x: 3, h: 6, d: 0, dur: 940 },
    { x: 7.5, h: 14, d: 160, dur: 820 },
    { x: 12, h: 18, d: 320, dur: 1000 },
    { x: 16.5, h: 12, d: 90, dur: 880 },
    { x: 21, h: 5, d: 240, dur: 960 },
  ];
  return (
    <svg aria-hidden width={16} height={16} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x - 1} y={12 - bar.h / 2} width={2} height={bar.h} rx={1} fill="currentColor" className="st-voice-bar" style={{ ["--st-voice-delay" as string]: `${bar.d}ms`, ["--st-voice-duration" as string]: `${bar.dur}ms` }} />
      ))}
    </svg>
  );
}

/** Seconds after the call appears before you pop in, and before the tools follow. */
const YOU_JOIN = 0.5;
const TOOLS_IN = YOU_JOIN + 0.5;

/** `participants` are who is in the call; when `joined`, you are first. */
export type JamCall = { id: string; startedAt: number; endedAt: number | null; participants: Actor[]; joined: boolean };

/** resolve-call-description.ts — "You" leads when you are in; otherwise the
 *  others are named plainly. */
function describeLive(call: JamCall): string {
  const names = call.participants.map((actor, index) => (call.joined && index === 0 ? "You" : actor.name));
  if (!call.joined) {
    if (names.length === 0) return "Waiting for others to join...";
    if (names.length === 1) return `${names[0]} is jamming...`;
    if (names.length === 2) return `${names[0]} & ${names[1]} are jamming...`;
  }
  if (names.length === 1) return "Waiting for others...";
  if (names.length === 2) return `${names[0]} & ${names[1]} are jamming...`;
  const remaining = names.length - 2;
  return `${names[0]}, ${names[1]} & ${remaining} ${remaining === 1 ? "other" : "others"} are jamming...`;
}
function describeEnded(call: JamCall): string {
  const names = call.participants.map((actor, index) => (index === 0 ? "You" : actor.name));
  if (names.length === 1) return `${names[0]} joined.`;
  if (names.length === 2) return `${names[0]} and ${names[1]} joined.`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} joined.`;
}
export function describeJoinEvent(call: JamCall): string {
  const names = call.participants.map((actor) => actor.name);
  if (names.length === 1) return `${names[0]} joined the jam.`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} joined the jam.`;
}

function formatCallDuration(startedAt: number, now: number): string {
  const total = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/** Wall-clock timer for a live Jam. A scripted Jam passes `elapsed` (seconds
 *  off the stage clock) instead, so scrubbing the timeline scrubs the timer. */
function useCallDuration(startedAt: number, elapsed?: number): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (elapsed != null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [elapsed]);
  if (elapsed != null) return formatCallDuration(0, elapsed * 1000);
  return formatCallDuration(startedAt, now);
}

function clockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/* ------------------------------ header control ------------------------------ */

/** JamHeaderButtonGroup. Idle: two secondary xs pills with a hairline gap.
 *  Active: one split control in action-success, participants beside the
 *  headphones, the caret sharing the fill. */
export function JamHeaderControl({ active, ringing = false, participants, onClick }: { active: boolean; /** A Jam is calling: the headphones ring like a phone until you pick up. */ ringing?: boolean; participants: Actor[]; onClick: () => void }) {
  // Idle → calling is a morph, not a swap: the green floods out from the
  // headphones, the pill grows to seat the faces as they spring in, the
  // seam opens, and the whole pill gives one small bounce. Motion's layout
  // animation carries the width; the flood is a clip-path reveal on a green
  // layer under the icon; everything else rides a spring.
  const FLOOD = { type: "spring", stiffness: 260, damping: 30 } as const;
  const SEAT = { type: "spring", stiffness: 520, damping: 30 } as const;
  const ink = active ? "text-ando-fg-white" : "text-ando-fg-secondary";
  return (
    <motion.span
      layout
      transition={{ layout: SEAT }}
      className={`ando-button-group relative select-none shrink-0 ${active ? "" : "gap-px"}`}
      data-orientation="horizontal"
      aria-label="Jam controls"
      animate={{ scale: active ? [1, 1.06, 1] : 1 }}
      style={{ transformOrigin: "20% 50%" }}
    >
      <motion.button
        layout
        transition={{ layout: SEAT }}
        type="button"
        onClick={onClick}
        aria-label={active ? "Open Jam" : "Start Jam"}
        className={`ando-button relative overflow-hidden rounded-l-sm rounded-r-[1px] transition-colors duration-300 ${active ? "group/jam gap-2 py-1 pl-1.5 pr-1" : "w-7 px-0"} ${ink}`}
        data-variant="secondary"
        data-size="xs"
      >
        {/* The green, flooding out from the headphones. */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-ando-action-success"
          initial={false}
          animate={{ clipPath: active ? "circle(160% at 14px 50%)" : "circle(0% at 14px 50%)" }}
          transition={FLOOD}
        />
        <span className={`relative z-10 inline-flex ${ringing ? "st-ring" : ""}`}>
          <Icon name="IconHeadphones" size={16} fill={active ? "filled" : "outlined"} className="text-current" />
        </span>
        {active ? (
          <motion.span
            layout
            className="relative z-10 ando-avatar-group pr-1"
            style={{ ["--ando-avatar-group-overlap" as string]: "4px", ["--ando-avatar-group-ring-width" as string]: "1.5px", ["--color-ando-bg-main" as string]: "var(--color-ando-action-success)" }}
            initial={{ opacity: 0, x: -10, scale: 0.6 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ ...SEAT, delay: 0.08 }}
          >
            {participants.slice(0, 3).map((actor) => <Avatar key={actor.name} actor={actor} size={16} />)}
          </motion.span>
        ) : null}
      </motion.button>
      {active ? <motion.span layout className="ando-separator ando-button-group__separator" data-orientation="vertical" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} /> : null}
      <motion.span
        layout
        transition={{ layout: SEAT }}
        className={`ando-button ando-button-group__caret relative overflow-hidden px-0 rounded-l-[1px] rounded-r-sm transition-colors duration-300 ${ink}`}
        data-variant="secondary"
        data-size="xs"
        style={{ width: 24 }}
        aria-hidden
      >
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-ando-action-success"
          initial={false}
          animate={{ clipPath: active ? "circle(200% at -20px 50%)" : "circle(0% at -20px 50%)" }}
          transition={{ ...FLOOD, delay: 0.05 }}
        />
        <span className="relative z-10 inline-flex"><Icon name="IconChevronDownSmall" size={12} /></span>
      </motion.span>
    </motion.span>
  );
}

/* --------------------------------- cards ---------------------------------- */

/** active-jam-call-card.tsx */
export function ActiveJamCallCard({ call, muted, elapsed, onToggleMute, onEnd, onJoin }: { call: JamCall; muted: boolean; elapsed?: number; onToggleMute: () => void; onEnd: () => void; onJoin: () => void }) {
  const duration = useCallDuration(call.startedAt, elapsed);
  return (
    <div data-jam-card className="ando-card max-w-96 gap-0 bg-ando-bg-main px-3 py-2 select-none cursor-pointer" data-edge="border">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex h-4 items-center gap-1.5">
            <VoiceGlyph className="text-ando-fg-success" />
            <span className="kanso-text-label-12-md text-ando-fg-success">{duration}</span>
          </div>
          <span className="kanso-text-label-12 flex items-center h-4 text-ando-fg-secondary">{describeLive(call)}</span>
        </div>
        {!call.joined ? (
          /* Not in the call: the product shows a single outline Join. */
          <button type="button" onClick={(event) => { event.stopPropagation(); onJoin(); }} data-jam-join className="ando-button" data-variant="outline" data-size="md">Join</button>
        ) : (
        <div className="flex items-center gap-2">
          <button type="button" aria-label={muted ? "Unmute call" : "Mute call"} onClick={(event) => { event.stopPropagation(); onToggleMute(); }} className="ando-button size-9 p-0 bg-ando-bg-fill-muted text-ando-stone-600 border-transparent hover:bg-ando-action-ghost-hover hover:border-transparent" data-variant="outline" data-size="md">
            <Icon name={muted ? "IconMicrophoneOff" : "IconMicrophone"} fill="filled" />
          </button>
          <button type="button" aria-label="Leave call" onClick={(event) => { event.stopPropagation(); onEnd(); }} className="ando-button size-9 p-0" data-variant="destructive" data-size="md">
            <Icon name="IconCall" fill="filled" className="rotate-[135deg]" />
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

/** ended-jam-call-card.tsx */
export function EndedJamCallCard({ call }: { call: JamCall }) {
  const mins = call.endedAt == null ? 0 : Math.floor((call.endedAt - call.startedAt) / 60000);
  const durationText = call.endedAt == null ? "Jam ended." : mins < 1 ? "Jam lasted less than a minute." : `Jam lasted ${mins}m.`;
  return (
    <div className="ando-card relative block w-full max-w-96 overflow-hidden gap-0 bg-ando-bg-main px-3 py-2" data-edge="border">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex h-4 items-center gap-1.5">
            <Icon name="IconHeadphones" size={14} fill="filled" />
            <span className="kanso-text-label-12-md text-ando-fg-primary">{durationText}</span>
          </div>
          <span className="flex items-center h-4 kanso-text-label-12 text-ando-fg-secondary">{describeEnded(call)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Icon name="IconVideo" size={16} className="text-ando-fg-secondary" />
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- panel ---------------------------------- */

function ControlGroup({ on, icon, label }: { on: boolean; icon: Parameters<typeof Icon>[0]["name"]; label: string }) {
  const bg = on ? "bg-ando-action-primary-on-dark hover:bg-ando-action-primary-on-dark-hover" : "bg-ando-action-secondary-on-dark hover:bg-ando-action-secondary-on-dark-hover";
  return (
    <div className="relative flex gap-px">
      <button type="button" aria-label={label} className={`flex items-center justify-center h-9 w-8 rounded-l-md rounded-r-[1px] text-ando-fg-white cursor-pointer transition-colors ${bg}`}>
        <Icon name={icon} fill="filled" />
      </button>
      <button type="button" aria-label={`Select ${label.toLowerCase()} device`} className={`flex items-center justify-center h-9 w-[18px] rounded-r-md rounded-l-[1px] text-ando-fg-white cursor-pointer transition-colors ${bg}`}>
        <Icon name="IconChevronDownSmall" />
      </button>
    </div>
  );
}

/** docked-stage.tsx + participant-tile.tsx + call-controls.tsx + jam-panel-tabs.tsx */
/** participant-tile.tsx: while a participant is speaking, their avatar wears
 *  a green-500 ring with a soft 4px halo (the tile itself only borders when
 *  video is on). */
/** The production ring, animated here as speech (stage.css st-speak-ring). */
const SPEAKING_RING = "st-speaking";

/** Keeps a list pinned to its newest line while that line's slot is still
 *  growing (landing.tsx, 300ms): one write is not enough, the bottom keeps
 *  moving, so it is chased for the length of the entrance. */
function chaseBottom(list: HTMLDivElement | null, ms = 380) {
  if (!list) return;
  const started = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    list.scrollTop = list.scrollHeight;
    if (now - started < ms) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/** Curve and length of every move the panel makes between its phases. */
export const JAM_MOVE = "700ms cubic-bezier(0.2, 0, 0, 1)";

export function JamPanel({ call, target, muted, elapsed, tab, transcript, speaking, onTab, onToggleMute, onEnd, onCollapse, docked = true, slideIn = true, lowerHeight = null, composer = true, thread = null, threadCount = 0, scripted = null, typing = null, onSend }: { call: JamCall; target: string; muted: boolean; elapsed?: number; tab: "thread" | "transcript"; transcript: TranscriptSegment[]; /** whoever is mid-sentence right now */ speaking: Actor | null; onTab: (tab: "thread" | "transcript") => void; onToggleMute: () => void; onEnd: () => void; onCollapse: () => void; /** In its column (hairline on the left) rather than floating over the room. */ docked?: boolean; /** Arrive with the product's slide — a live jam; a scripted one is carried by its stage. */ slideIn?: boolean; /** The thread/transcript section's height in px, animated; null lets it fill. */ lowerHeight?: number | null; /** The thread composer at the panel's foot — only once it is docked. */ composer?: boolean; /** Rows in the Jam's thread, after the join event. */ thread?: ReactNode; threadCount?: number; /** A line the script is typing into the thread composer. */ scripted?: string | null; /** whoever is typing into the thread — the indicator rides over the composer */ typing?: Actor | null; /** Your own line, sent from the thread composer. */ onSend?: (text: string) => void }) {
  const duration = useCallDuration(call.startedAt, elapsed);
  // transcripts-list.tsx TranscriptAutoFollow: the list stays pinned to the
  // newest segment as they land (and when the tab opens onto a backlog).
  const transcriptRef = useRef<HTMLDivElement>(null);
  const lastText = transcript[transcript.length - 1]?.text ?? "";
  useEffect(() => chaseBottom(transcriptRef.current), [transcript.length, lastText, tab]);
  const threadRef = useRef<HTMLDivElement>(null);
  useEffect(() => chaseBottom(threadRef.current), [threadCount, tab, typing]);
  // While the section unfolds or docks (its height eases over JAM_MOVE), a
  // list taller than its box would show its top until the box outgrew it,
  // then snap to the bottom. Pin it to the bottom for the whole move.
  useEffect(() => {
    const stopA = chaseBottom(transcriptRef.current, 800);
    const stopB = chaseBottom(threadRef.current, 800);
    return () => { stopA?.(); stopB?.(); };
  }, [lowerHeight]);
  // The thread composer is real: your draft, or the script's line riding
  // over a read-only editor (the same arrangement as the room's composer).
  const [draft, setDraft] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [composerGrown, setComposerGrown] = useState(false);
  const shown = scripted ?? draft;
  const canSend = shown.trim().length > 0;
  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.style.height = "";
    editor.style.height = `${editor.scrollHeight}px`;
  }, [shown, composer]);
  const submit = useCallback(() => {
    const text = draft.trim();
    if (text.length === 0 || !onSend) return;
    onSend(text);
    setDraft("");
    const editor = editorRef.current;
    if (editor) editor.style.height = "";
  }, [draft, onSend]);
  // The active tab's fill is one pill that springs across to whichever tab
  // is pressed. It is placed by value (offsetLeft/offsetWidth — layout px,
  // untouched by the hero's scale), not by Motion's layout projection: a
  // projected element under a scaled, height-transitioning ancestor
  // re-measures every frame and jitters.
  const tabClass = (active: boolean, extra: string) => `ando-tabs__trigger relative cursor-pointer border-b-0 pb-0 h-7 px-2 flex items-center rounded-md space-x-0 hover:bg-ando-bg-fill-muted ${active ? "border-transparent" : ""} ${extra}`;
  const tabsRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  useLayoutEffect(() => {
    const el = tabsRef.current?.querySelector<HTMLElement>(`[data-jam-tab="${tab}"]`);
    if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth });
  }, [tab]);
  return (
    <div className={`${slideIn ? "st-panel-in " : ""}flex flex-col h-full shrink-0 bg-ando-bg-elevated ${docked ? "border-l border-ando-border-default" : ""}`} style={{ width: "var(--ando-desktop-side-panel-width)" }} data-agent-surface="jam-panel">
      {/* Docked stage */}
      <div className="flex flex-col relative select-none bg-ando-bg-dark shrink-0" data-jam-stage>
        <motion.div className="ando-surface-header" data-variant="overlay" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2, ease: [0.2, 0, 0, 1] }}>
          <div className="flex items-center justify-between w-full">
            <button type="button" onClick={onCollapse} aria-label="Close jam panel" className="text-ando-fg-white transition-opacity hover:opacity-80"><Icon name="IconSidebarLeftArrow" className="-scale-x-100" /></button>
            <div className="flex items-center space-x-2 select-none">
              <VoiceGlyph className="text-ando-green-500" />
              <span className="kanso-text-label-11 text-ando-green-500">{duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Fullscreen" className="text-ando-fg-white transition-opacity hover:opacity-80"><Icon name="IconFullScreen" /></button>
            </div>
          </div>
        </motion.div>
        <div className="flex flex-col space-y-4 px-4 pb-4">
          <div className="w-full overflow-hidden" style={{ height: 184 }}>
            {/* participant-grid.tsx sidebar layout: ≤2 side by side, equal, full height */}
            {/* Whoever was here first has the whole width; you pop in (you just
                joined, half a second in) and shoulder them aside — your tile
                grows from nothing on a Dynamic-Island spring (damping ratio
                ~0.5: the width overshoots and rebounds, so theirs is shoved
                past halfway and springs back) while theirs gives way. Only once
                you've landed do the controls spring up beneath, one after
                another. */}
            <div className="h-full flex flex-row gap-2">
              {call.participants.slice(0, 2).map((actor, index) => {
                const you = index === 0 && call.joined;
                return (
                  <motion.div
                    key={actor.name}
                    className="group relative min-w-0 rounded-md overflow-hidden h-full bg-ando-dark-700 flex items-center justify-center transition-colors duration-150"
                    data-agent-speaking={speaking === actor ? "true" : "false"}
                    initial={you ? { flexBasis: "0%", flexGrow: 0, opacity: 0, scale: 0.5 } : { flexBasis: "0%", flexGrow: 1, opacity: 1, scale: 1 }}
                    animate={{ flexBasis: "0%", flexGrow: 1, opacity: 1, scale: 1 }}
                    transition={you ? { flexGrow: { type: "spring", stiffness: 260, damping: 16, delay: YOU_JOIN }, scale: { type: "spring", stiffness: 300, damping: 15, delay: YOU_JOIN + 0.05 }, opacity: { duration: 0.2, delay: YOU_JOIN + 0.05 } } : { duration: 0 }}
                    style={{ transformOrigin: "50% 50%" }}
                  >
                    {/* The ring landing on someone gives their avatar a little pop. */}
                    <motion.div className={`rounded-full overflow-hidden size-16 transition-[box-shadow] duration-150 ${speaking === actor ? SPEAKING_RING : ""}`} animate={{ scale: speaking === actor ? [1, 1.1, 1] : 1 }} transition={{ duration: 0.45, times: [0, 0.35, 1], ease: [0.2, 0, 0, 1] }}><Avatar actor={actor} size={64} /></motion.div>
                    <div className="absolute bottom-1 left-1 right-1 flex min-w-0">
                      <div className="flex h-5 min-w-0 max-w-full items-center gap-0.5 overflow-hidden rounded-sm bg-ando-black/25 py-0 pl-1 pr-1 backdrop-blur-[8px]">
                        <span className="flex size-3 items-center justify-center text-ando-fg-white"><Icon name={index === 0 && muted ? "IconMicrophoneOff" : "IconMicrophone"} size={12} fill="filled" /></span>
                        <div className="min-w-0 px-0.5"><span className="kanso-text-label-11 block truncate whitespace-nowrap text-ando-fg-white">{index === 0 ? `${actor.name} (you)` : actor.name}</span></div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div className="shrink-0">
            <div className="flex items-center justify-center gap-3">
              {[
                <div key="mic" onClick={onToggleMute} role="presentation"><ControlGroup on={!muted} icon={muted ? "IconMicrophoneOff" : "IconMicrophone"} label={muted ? "Unmute" : "Mute"} /></div>,
                <ControlGroup key="video" on={false} icon="IconVideoOff" label="Start video" />,
                <button key="share" type="button" aria-label="Share screen" className="flex items-center justify-center size-9 rounded-md text-ando-fg-white cursor-pointer transition-colors bg-ando-action-secondary-on-dark hover:bg-ando-action-secondary-on-dark-hover"><Icon name="IconShareScreen" fill="filled" /></button>,
                <button key="react" type="button" aria-label="React" className="flex items-center justify-center size-9 rounded-md bg-ando-action-secondary-on-dark text-ando-fg-white shadow-md transition-colors hover:bg-ando-action-secondary-on-dark-hover cursor-pointer"><Icon name="IconEmojiSmile" fill="filled" /></button>,
                <button key="end" type="button" onClick={onEnd} aria-label="End call" className="flex items-center justify-center size-9 rounded-md bg-ando-action-danger-on-dark hover:bg-ando-action-danger-on-dark-hover text-ando-fg-white cursor-pointer transition-colors"><Icon name="IconCall" fill="filled" className="rotate-[135deg]" /></button>,
              ].map((control, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.4, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ opacity: { duration: 0.16, delay: TOOLS_IN + i * 0.07 }, scale: { type: "spring", stiffness: 520, damping: 20, delay: TOOLS_IN + i * 0.07 }, y: { type: "spring", stiffness: 520, damping: 24, delay: TOOLS_IN + i * 0.07 } }}>
                  {control}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Thread / Live transcript — folded away while the call is the hero, unfolding to a set height, then filling the column. */}
      <div className={`flex flex-col bg-ando-bg-main border-t border-ando-border-default ${lowerHeight == null ? "flex-1 min-h-0" : "shrink-0 overflow-hidden"}`} style={lowerHeight == null ? undefined : { height: lowerHeight, transition: `height ${JAM_MOVE}` }} data-jam-lower>
        <div className="ando-surface-header">
          <div ref={tabsRef} className="ando-tabs__list relative flex items-center space-x-0 gap-3 border-b-0">
            {pill ? <motion.span aria-hidden className="absolute top-0 h-7 rounded-md bg-ando-bg-fill-muted" initial={false} animate={{ x: pill.x, width: pill.w }} transition={{ type: "spring", stiffness: 520, damping: 34 }} /> : null}
            <button type="button" onClick={() => onTab("thread")} data-jam-tab="thread" className={tabClass(tab === "thread", "text-ando-fg-primary")} data-state={tab === "thread" ? "active" : "inactive"}>
              <span className="kanso-text-label-12-md relative inline-flex items-center gap-1.5"><Icon name="IconThread" fill={tab === "thread" ? "filled" : "outlined"} />Thread</span>
            </button>
            <button type="button" onClick={() => onTab("transcript")} data-jam-tab="transcript" className={tabClass(tab === "transcript", "text-ando-rose-600 hover:text-ando-rose-600")} data-state={tab === "transcript" ? "active" : "inactive"}>
              <span className="kanso-text-label-12-md relative inline-flex items-center gap-1.5"><Icon name="IconSquareLinesBottom" fill={tab === "transcript" ? "filled" : "outlined"} />Live transcript</span>
            </button>
          </div>
        </div>
        {tab === "transcript" ? (
          /* transcripts-list.tsx: p-4, rows spaced 3, xs avatar, name label-11, text label-12 — the latest still being spoken reads italic. */
          <div ref={transcriptRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 gap-3" data-jam-transcript>
            {/* Bottom-anchored, as the room's transcript is: a new line lands at the composer and pushes the rest up. */}
            <div aria-hidden className="mt-auto shrink-0" />
            {transcript.length === 0 ? (
              <div className="flex h-full items-center justify-center kanso-text-label-12 text-ando-fg-secondary">Listening…</div>
            ) : transcript.map((segment, index) => (
              <Landing key={index} className="shrink-0">
                <div className="flex space-x-2">
                  <div className="shrink-0 pt-0.5"><Avatar actor={segment.who} size={20} /></div>
                  <div className="flex flex-col space-y-0.5 min-w-0">
                    <span className="kanso-text-label-11 text-ando-fg-secondary">{segment.who.name}</span>
                    <span className={`kanso-text-label-12 ${segment.final ? "" : "text-ando-fg-secondary italic"}`}>{segment.text}</span>
                  </div>
                </div>
              </Landing>
            ))}
          </div>
        ) : (
        /* The typing indicator's clearance eases in and out on the landing curve (as the room's does), so the last row is never under it. */
        <div ref={threadRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3" style={{ paddingBottom: typing ? 40 : 0, transition: "padding-bottom 300ms cubic-bezier(0.3, 0.8, 0.3, 1)" }} data-jam-thread>
          {/* Bottom-anchored like the room: a reply lands at the composer and pushes the join event up. */}
          <div aria-hidden className="mt-auto shrink-0" />
          {/* system-message/index.tsx: join event */}
          <div className="flex items-center gap-3 py-1 -ml-4 pl-4 text-ando-fg-secondary hover:bg-ando-bg-fill-subtle rounded-r-md">
            <div className="flex shrink-0 items-center justify-center bg-ando-bg-fill-muted rounded" style={{ width: 32, height: 32 }}>
              <Icon name="IconArrowRight" size={20} stroke="2" className="text-ando-fg-success shrink-0" />
            </div>
            <div className="min-w-0 kanso-text-label-14">
              {call.participants.map((actor, index) => (
                <span key={actor.name}>
                  {index > 0 ? (index === call.participants.length - 1 ? " and " : ", ") : ""}
                  <span className="kanso-text-label-14-md text-ando-fg-primary">{actor.name}</span>
                </span>
              ))}
              {" joined the jam."}
              <span className="kanso-text-label-12 text-ando-fg-tertiary inline ml-1.5">{clockTime(call.startedAt)}</span>
            </div>
          </div>
          {thread ? <div className="flex flex-col pt-1 pb-2">{thread}</div> : null}
        </div>
        )}
        {/* Thread composer, compact, with the broadcast option. It grows in
            on the panel's own curve when the panel docks, so the list above
            it is never shoved: the section and the composer open together. */}
        {/* Only the thread has a composer — the live transcript is read-only. It grows in
            once, when the panel docks; a tab switch shows it in place. */}
        {composer && tab === "thread" ? <motion.div className={`relative z-10 flex flex-col space-y-2 px-4 pb-4 pt-2 ${composerGrown ? "" : "overflow-hidden"}`} initial={composerGrown ? false : { height: 0, paddingBottom: 0, paddingTop: 0 }} animate={{ height: "auto", paddingBottom: 16, paddingTop: 8 }} transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] }} onAnimationComplete={() => setComposerGrown(true)}>
          <div className="relative flex flex-col">
          {typing ? <TypingIndicator actor={typing} /> : null}
          <div className="flex flex-col bg-ando-bg-input rounded-lg shadow-[0_0_0_1px_var(--color-ando-border-alpha)] overflow-hidden">
            {/* The editor is shorter than the room's so the whole box, with its "Also send to" row, is the same height. */}
            <div className="relative min-h-[58px]" data-jam-editor>
              {/* Text at label-14 (the product's editor is 16; 14 reads better beside the messages on film), placeholder label-14 tertiary. */}
              {scripted != null ? (
                <div aria-hidden className="kanso-text-label-14 pointer-events-none absolute inset-x-0 top-0 whitespace-pre-wrap break-words px-5 pt-3 pb-1 text-ando-fg-primary">
                  {scripted}
                  <span className="st-caret ml-px inline-block h-[16px] w-px translate-y-[3px] bg-ando-fg-primary" />
                </div>
              ) : shown.length === 0 ? (
                <span className="kanso-text-label-14 pointer-events-none absolute left-5 top-3 text-ando-fg-tertiary">Enter your message</span>
              ) : null}
              <textarea
                ref={editorRef}
                value={shown}
                readOnly={scripted != null}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    submit();
                  }
                }}
                rows={1}
                aria-label="Message the jam thread"
                className={`kanso-text-label-14 block w-full resize-none bg-transparent px-5 pt-3 pb-1 outline-none ${scripted != null ? "text-transparent caret-transparent" : "text-ando-fg-primary"}`}
              />
            </div>
            <div className="px-3 pt-1">
              <label className="flex min-w-0 select-none items-center space-x-2 pl-1">
                <span className="ando-checkbox flex size-4 shrink-0 items-center justify-center rounded-xs border border-ando-border-strong bg-ando-bg-main" data-state="unchecked" aria-hidden />
                <span className="kanso-text-label-12 min-w-0 truncate text-ando-fg-secondary">{"Also send to "}<span className="text-ando-fg-primary">{target}</span></span>
              </label>
            </div>
            <div className="flex items-center justify-between pb-3 px-2 pt-1">
              <div className="flex items-center">
                {(["IconPaperclip1", "Aa", "IconEmojiSmile", "IconGif"] as const).map((item) => (
                  <span key={item} className="ando-button h-7 w-7 shrink-0 !p-0" data-variant="ghost" data-size="sm" aria-hidden>
                    {item === "Aa" ? <span className="flex h-4 w-4 items-center justify-center kanso-text-label-14-sb">Aa</span> : <Icon name={item} />}
                  </span>
                ))}
              </div>
              <div>
                <span className="ando-button-group shrink-0" data-orientation="horizontal">
                  <button type="button" onClick={submit} disabled={!canSend} data-jam-send aria-label="Send to the jam thread" className={`ando-button w-7 px-0 ${canSend ? "" : "cursor-not-allowed !bg-ando-bg-fill-muted"}`} data-size="sm"><Icon name="IconPaperPlane" fill="filled" size={16} className={canSend ? "text-ando-fg-reverse" : "text-ando-fg-tertiary"} /></button>
                  <span className="ando-button-group__separator" />
                  <span className="ando-button ando-button-group__caret px-0 cursor-not-allowed bg-ando-bg-fill-muted text-ando-fg-tertiary" data-size="sm" style={{ width: 24 }} aria-hidden><Icon name="IconChevronDownSmall" size={12} /></span>
                </span>
              </div>
            </div>
          </div>
          </div>
        </motion.div> : null}
      </div>
    </div>
  );
}
