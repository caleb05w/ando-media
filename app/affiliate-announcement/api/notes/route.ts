import { promises as fs } from 'node:fs'
import path from 'node:path'

// Composer notes — the agentation idea without the copy-paste: the
// timeline studio POSTs its pinned annotations here and they land in
// composer-notes.json at the repo root, where Claude reads them
// directly ("check my composer notes"). Dev-only: the archive never
// deploys, and a deployed filesystem wouldn't hold the write anyway.

const FILE = path.join(process.cwd(), 'composer-notes.json')

const guard = () =>
  process.env.NODE_ENV === 'production'
    ? Response.json({ error: 'dev only' }, { status: 403 })
    : null

export async function GET() {
  const denied = guard()
  if (denied) return denied
  try {
    return Response.json(JSON.parse(await fs.readFile(FILE, 'utf8')))
  } catch {
    return Response.json([])
  }
}

export async function POST(request: Request) {
  const denied = guard()
  if (denied) return denied
  const notes = await request.json()
  if (!Array.isArray(notes)) {
    return Response.json({ error: 'expected an array' }, { status: 400 })
  }
  await fs.writeFile(FILE, `${JSON.stringify(notes, null, 2)}\n`)
  return Response.json({ ok: true, count: notes.length })
}
