"use client";

// The script control. Paste lines like
//
//   {sara}: "Can you send me the invite page one more time?"
//   {caleb}: Here — this is the body copy I liked.
//   {ando}: Updated the invite page.
//
// and each becomes a message from that cast member, in order, appended to
// whatever is already in the transcript — so a conversation can be built up
// a few lines at a time. Braces and quotes are optional; a line with no
// `name:` prefix continues the previous speaker.

import { useState } from "react";
import { Icon } from "./glyph";
import { Avatar } from "./chrome";
import type { Actor } from "./scenes";

export type ScriptLine = { who: string; text: string };

const LINE = /^\s*(?:\{\s*@?([\w-]+)\s*\}|@?([\w-]+))\s*:\s*(.*)$/;

/** Returns the lines it could place, and the handles it could not. */
export function parseScript(source: string, cast: Record<string, Actor>): { lines: ScriptLine[]; unknown: string[] } {
  const lines: ScriptLine[] = [];
  const unknown = new Set<string>();
  let current: string | null = null;
  for (const raw of source.split(/\r?\n/)) {
    if (raw.trim().length === 0) continue;
    const match = LINE.exec(raw);
    let who: string | null = current;
    let text = raw.trim();
    if (match) {
      const handle = (match[1] ?? match[2]).toLowerCase();
      if (cast[handle]) {
        who = handle;
        text = match[3].trim();
      } else if (match[1] != null) {
        // Braced but not in the cast: say so rather than silently posting it as someone else.
        unknown.add(handle);
        continue;
      }
    }
    if (who == null) continue;
    text = text.replace(/^["“]([\s\S]*)["”]$/, "$1").trim();
    if (text.length === 0) continue;
    lines.push({ who, text });
    current = who;
  }
  return { lines, unknown: [...unknown] };
}

export function ScriptControl({ cast, onAppend, onClear, hidden, sceneName, onCycleScene }: { cast: Record<string, Actor>; onAppend: (lines: ScriptLine[]) => void; onClear: () => void; hidden: boolean; sceneName: string; onCycleScene: () => void }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("");
  const [note, setNote] = useState<string | null>(null);
  if (hidden) return null;

  const run = () => {
    const { lines, unknown } = parseScript(source, cast);
    if (lines.length > 0) onAppend(lines);
    setNote(
      unknown.length > 0
        ? `No one called ${unknown.map((h) => `{${h}}`).join(", ")} — skipped.`
        : lines.length === 0
          ? "Nothing to add. Lines look like {sara}: text"
          : null,
    );
    if (lines.length > 0) setSource("");
  };

  return (
    <div className="fixed right-4 top-11 z-40 flex flex-col items-end gap-2">
      {open ? (
        <div className="st-director-in flex w-[420px] max-w-[calc(100vw-32px)] flex-col gap-2.5 rounded-[14px] bg-white/92 p-3 shadow-[0px_0px_0px_1px_rgba(81,76,71,0.12),0px_8px_8px_-4px_rgba(22,25,29,0.03),0px_20px_24px_-4px_rgba(22,25,29,0.08)] backdrop-blur-[20px]">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[10px] uppercase leading-4 tracking-[0.08em] text-[#8a827b]">Script</span>
            <button type="button" onClick={onCycleScene} title="Swap scene (S)" className="rounded-full px-2 py-1 font-mono text-[10px] uppercase leading-4 tracking-[0.06em] text-[#8a827b] transition-colors hover:bg-[#f5f5f4] hover:text-[#1a1817]">{`Scene · ${sceneName}`}</button>
            <button type="button" onClick={onClear} className="rounded-full px-2 py-1 font-mono text-[10px] uppercase leading-4 tracking-[0.06em] text-[#8a827b] transition-colors hover:bg-[#f5f5f4] hover:text-[#1a1817]">Clear conversation</button>
          </div>
          <div className="flex flex-wrap gap-1 px-1">
            {Object.entries(cast).map(([handle, actor]) => (
              <button
                key={handle}
                type="button"
                title={actor.name}
                onClick={() => setSource((current) => `${current}${current.length === 0 || current.endsWith("\n") ? "" : "\n"}{${handle}}: `)}
                className="flex items-center gap-1.5 rounded-full bg-[#f5f5f4] py-[3px] pl-[3px] pr-2 font-mono text-[10px] leading-4 text-[#58524e] transition-colors hover:bg-[#ebe9e8] hover:text-[#1a1817]"
              >
                <Avatar actor={actor} size={16} />
                {`{${handle}}`}
              </button>
            ))}
          </div>
          <textarea
            value={source}
            onChange={(event) => { setSource(event.target.value); setNote(null); }}
            onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); run(); } }}
            data-stage-editor
            rows={7}
            spellCheck={false}
            placeholder={'{sara}: "Can you send me the invite page one more time?"\n{caleb}: Here — this is the body copy I liked.'}
            className="w-full resize-y rounded-[8px] bg-white px-3 py-2 font-mono text-[12px] leading-[18px] text-[#1a1817] shadow-[0px_0px_0px_1px_rgba(81,76,71,0.14)] outline-none placeholder:text-[#b9b5b2] focus:shadow-[0px_0px_0px_1px_rgba(81,76,71,0.3)]"
          />
          <div className="flex items-center gap-2 px-1">
            <button type="button" onClick={run} className="rounded-full bg-[#1a1817] px-3 py-[6px] text-[12px] leading-4 text-white transition-transform hover:scale-[1.02]">Add to conversation</button>
            <span className="font-mono text-[10px] leading-4 text-[#a8a29e]">⌘↩</span>
            {note ? <span className="ml-auto truncate text-[11px] leading-4 text-[#8a827b]">{note}</span> : null}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full bg-white/85 py-1.5 pl-2.5 pr-3 font-mono text-[10px] uppercase leading-4 tracking-[0.08em] text-[#58524e] shadow-[0px_0px_0px_1px_rgba(81,76,71,0.12),0px_8px_8px_-4px_rgba(22,25,29,0.03),0px_20px_24px_-4px_rgba(22,25,29,0.08)] backdrop-blur-[20px] transition-colors hover:text-[#1a1817]"
      >
        <Icon name="IconPencil" size={12} />
        {open ? "Close" : "Script"}
      </button>
    </div>
  );
}
