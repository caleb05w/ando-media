import { notesRoute } from "../../../../lib/timeline-studio/notes-route";

// /ando-stage's composer notes → composer-notes.ando-stage.json at the repo
// root. Dev-only; see lib/timeline-studio/notes-route.ts.
export const { GET, POST } = notesRoute("composer-notes.ando-stage.json");
