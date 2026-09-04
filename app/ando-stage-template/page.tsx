"use client";

// /ando-stage-template — the Ando window, live, with nothing directed.
//
// The stage (/ando-stage) with a scene that has no beats: no studio, no
// camera, no cards, no keyframes. Everything the Jams cut uses is here to
// pick up by hand — type into the composer, start a Jam from the headphones,
// join it, dock the panel, switch between its thread and transcript — so a
// new film can start from the real UI rather than from a blank page.

import { StagePage } from "../ando-stage/page";
import { CAST, type Scene } from "../ando-stage/scenes";

const TEMPLATE: Scene = {
  id: "template",
  name: "Template",
  blurb: "The Ando window, live. Type, start a Jam, join it.",
  surface: { kind: "channel", name: "marketing", members: 9 },
  cast: CAST,
  beats: [],
};

export default function AndoStageTemplate() {
  return <StagePage scenes={[TEMPLATE]} notesUrl="/ando-stage/api/notes" savesKey="ando-stage-template-composer-saves" />;
}
