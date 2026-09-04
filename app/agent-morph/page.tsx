"use client";

// /agent-morph — the agent becoming Grok, Claude and Codex, alone.
//
// The change of face lifted out of /context-stream so it can be tuned on
// its own, in the typing indicator's own language (app/agent-typing-
// experience): a mark leaves by melting back into the dots, the dots
// type, and the next mark arrives by one of the library's morphs — a
// different one for each mark, and the marks are never broken up. One
// virtual clock drives it (scene.tsx), so the studio underneath can drag
// every beat, set how long the dots type between faces, scrub both ways
// and hold a frame. The chip bar top-left picks each mark's morph, the
// leave and the tint (settings.ts).

import { useMemo } from "react";
import { Studio } from "../../lib/timeline-studio/studio";
import { Controls } from "./controls";
import { lanesFor, totalFor } from "./lanes";
import { AgentMorphScene } from "./scene";
import { arriveMsFor, leaveMsFor, useSettings } from "./settings";
import { DEFAULT_TIMING } from "./timing";

export default function AgentMorphPage() {
  const [settings, update] = useSettings();
  // Each bar's fixed part: the mark before it leaving, this mark arriving.
  const lanes = useMemo(
    () =>
      lanesFor({
        claude: (leaveMsFor(settings, "grok") + arriveMsFor(settings, "claude")) / 1000,
        codex: (leaveMsFor(settings, "claude") + arriveMsFor(settings, "codex")) / 1000,
      }),
    [settings],
  );
  return (
    <>
      <Studio
        defaultTiming={DEFAULT_TIMING}
        lanes={lanes}
        notesUrl="/agent-morph/api/notes"
        savesKey="agent-morph-composer-saves"
        scope="morph"
        span={Math.ceil(totalFor(DEFAULT_TIMING))}
        title="Timeline · agent morph"
        total={totalFor}
        snapshot={() => ({ arrive: { grok: settings.arrive.grok.key, claude: settings.arrive.claude.key, codex: settings.arrive.codex.key }, leave: settings.leave, start: settings.start, via: settings.via, tempo: settings.tempo, tint: settings.tint })}
      >
        {({ timing, hooks, run, replay }) => <AgentMorphScene key={run} timing={timing} settings={settings} hooks={hooks} onReplay={replay} />}
      </Studio>
      <Controls settings={settings} onChange={update} />
    </>
  );
}
