"use client";

// /context-stream — "everything becomes context", the film.
//
// Ando-Brand 3963-1564, storyboard to motion. A cloud of dots (messages,
// docs, files, images) pulls into one line; the line starts to flow and
// more things curve in and join it; an agent lands on the stream; and the
// product builds itself around that exact line — the composer first, on
// the line's own y, then the chat, then the sidebar — until you ask the
// agent something and it answers out of everything it just read. Then the
// logo.
//
// One virtual clock drives all of it (scene.tsx), so the studio underneath
// (lib/timeline-studio) can drag every beat, scrub both ways, hold a frame
// and pin notes — they land in composer-notes.context-stream.json.

import { Studio } from "../../lib/timeline-studio/studio";
import { lanesFor, totalFor } from "./lanes";
import { ContextStreamScene } from "./scene";
import { DEFAULT_TIMING } from "./timing";

const LANES = lanesFor();

export default function ContextStreamPage() {
  return (
    <Studio
      defaultTiming={DEFAULT_TIMING}
      lanes={LANES}
      notesUrl="/context-stream/api/notes"
      savesKey="context-stream-composer-saves"
      scope="film"
      span={Math.ceil(totalFor(DEFAULT_TIMING))}
      title="Timeline · agent context"
      total={totalFor}
    >
      {({ timing, hooks, run, replay }) => <ContextStreamScene key={run} timing={timing} hooks={hooks} onReplay={replay} />}
    </Studio>
  );
}
