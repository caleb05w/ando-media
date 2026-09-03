import { notesRoute } from "../../../../lib/timeline-studio/notes-route";

// /context-stream's composer notes → composer-notes.context-stream.json at
// the repo root. Dev-only; see lib/timeline-studio/notes-route.ts.
export const { GET, POST } = notesRoute("composer-notes.context-stream.json");
