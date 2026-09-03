# Timeline Studio — the composer

The canonical, lane-generic timeline editor for any animation that is a
pure function of one virtual clock. `studio.tsx` is the whole UI;
`notes-route.ts` is the dev-only API that syncs pinned notes to a JSON
file at the repo root. Origin: the affiliate announcement's WheelStudio
(`app/affiliate-announcement/world-wheel.tsx`), generalised for
`/logo-motion` (`app/logo-motion/{scene,lanes,page}.tsx` is the worked
example).

Edit the UI HERE and every page that imports it gets the change. The
`timeline-studio` skill (~/.claude/skills/timeline-studio) only points at
this folder — it carries no copy — so nothing else needs updating.

Import it by RELATIVE path (`../../lib/timeline-studio/studio` from a
route folder) — this repo's `@/lib/*` alias is mapped to
`landing-ui/lib`, so `@/lib/timeline-studio/…` does not resolve.

Chrome (after Caleb's Sep 2 review): notes are a KEYBIND — hover the
timeline for an amber follower and press `n` to drop a note there (or
anywhere on the page, at the clock); the bookmark opens the TAKES modal
(name + save, load / copy / delete); undo, reset and copy are Central
icons; speed is a `1×` field that appears when the clock is hovered; every
control has a hover TOOLTIP (label + shortcut) via the `Tip` wrapper,
portalled to <body> in a fixed layer so it always sits ABOVE the control
and nothing clips it — no hint legend; there is no replay button (click the scene,
or any grab replays on release).

Mount: `<Studio lanes defaultTiming total savesKey notesUrl scope title
snapshot>{({ timing, hooks, run, replay }) => <Scene key={run} … />}
</Studio>`; the driver reads `hooks` every frame (see the skill's
`references/driver-pattern.md`).
