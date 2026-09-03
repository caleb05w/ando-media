import { promises as fs } from "node:fs";
import path from "node:path";

// Composer notes — the agentation idea without the copy-paste: the timeline
// studio POSTs its pinned annotations to a page's notes route and they land
// in a JSON file at the repo root, where Claude reads them directly ("check
// my composer notes"). One file per page so notes never mix. Dev-only: a
// deployed filesystem wouldn't hold the write anyway.
//
//   // app/<page>/api/notes/route.ts
//   export const { GET, POST } = notesRoute("composer-notes.<page>.json");

export function notesRoute(fileName: string) {
  const FILE = path.join(process.cwd(), fileName);
  const guard = () =>
    process.env.NODE_ENV === "production" ? Response.json({ error: "dev only" }, { status: 403 }) : null;

  async function GET() {
    const denied = guard();
    if (denied) return denied;
    try {
      return Response.json(JSON.parse(await fs.readFile(FILE, "utf8")));
    } catch {
      return Response.json([]);
    }
  }

  async function POST(request: Request) {
    const denied = guard();
    if (denied) return denied;
    const notes = await request.json();
    if (!Array.isArray(notes)) {
      return Response.json({ error: "expected an array" }, { status: 400 });
    }
    await fs.writeFile(FILE, `${JSON.stringify(notes, null, 2)}\n`);
    return Response.json({ ok: true, count: notes.length });
  }

  return { GET, POST };
}
