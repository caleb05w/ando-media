"use client";

// /ando-grok — Grokbots join the channel.
//
// The stage (app/ando-stage) running one script: scene.ts. The Studio
// underneath scrubs it both ways; notes land in composer-notes.ando-grok.json.

import { StagePage } from "../ando-stage/page";
import { GROK_CUT } from "./scene";

export default function AndoGrok() {
  return <StagePage scenes={[GROK_CUT]} notesUrl="/ando-grok/api/notes" savesKey="ando-grok-composer-saves" />;
}
