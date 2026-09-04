import { notesRoute } from "../../../../lib/timeline-studio/notes-route";

// /agent-morph's composer notes → composer-notes.agent-morph.json at the
// repo root. Dev-only; see lib/timeline-studio/notes-route.ts.
export const { GET, POST } = notesRoute("composer-notes.agent-morph.json");
