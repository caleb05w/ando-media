// /ando-grok — the script.
//
// Sara (the boss) asks Caleb (the intern) in #design about the onboarding
// empty states. Caleb brings his Grok in; Sara brings hers. The two bots join the channel — a join row
// each, the member count ticking up — and get noisy, six lines between them.
// Then white: "Grokbots have entered the chat 😏", and the logo.

import { CAST as STAGE_CAST, type Actor, type Scene } from "../ando-stage/scenes";

const AV = "/avatars";


/** The stage's cast plus the two Grokbots (the pfps from Caleb's desktop). */
export const CAST = {
  ...STAGE_CAST,
  "caleb-grok": { name: "Caleb's Grok", avatar: `${AV}/caleb-grok.png`, agent: true },
  "sara-grok": { name: "Sara's Grok", avatar: `${AV}/sara-grok.png`, agent: true },
} as const satisfies Record<string, Actor>;

export const GROK_CUT: Scene = {
  id: "grok-cut",
  name: "Grokbots",
  blurb: "Caleb's Grok and Sara's Grok join #design and chat with us.",
  surface: { kind: "channel", name: "design", members: 15 },
  cast: CAST,
  beats: [
    // The window rises (0.15–0.75s) on an empty room. Sara opens — she's the
    // boss — and your reply types itself into the composer before it lands.
    // The opening is quick; once the bots are in, a line every 650ms.
    { kind: "wait", ms: 200 },
    { kind: "typing", who: "sara", ms: 600 },
    { kind: "say", id: "g1", who: "sara", time: "2:14 PM", ms: 800, body: [[{ text: "Onboarding review is tomorrow. Can we lock the empty states today?" }]] },
    { kind: "say", id: "g2", who: "caleb", time: "2:14 PM", ms: 350, body: [[{ text: "On it. Digging up last week's crit notes, bringing my Grok in." }]] },
    { kind: "typing", who: "sara", ms: 500 },
    { kind: "say", id: "g3", who: "sara", time: "2:15 PM", ms: 350, body: [[{ text: "Good. Mine has the Figma." }]] },
    // The bots arrive: two join rows, the count ticking 15 → 17.
    { kind: "join", id: "j1", who: "caleb-grok", time: "2:15 PM", ms: 400 },
    { kind: "join", id: "j2", who: "sara-grok", time: "2:15 PM", ms: 650 },
    // ...and start talking — landing whole, about 650ms apart; agents post,
    // they don't type. Caleb's has the notes, Sara's has the file, and Sara
    // talks back to them.
    { kind: "say", id: "b1", who: "caleb-grok", time: "2:15 PM", ms: 650, body: [[{ text: "Crit notes from last week: 6 comments, 4 still open." }]] },
    { kind: "say", id: "b2", who: "sara-grok", time: "2:15 PM", ms: 650, body: [[{ text: "Empty states are here: " }, { text: "figma.com/design/Ando-Onboarding?node-id=2140-88", link: true }, { text: " — 4 screens, 2 still on placeholders." }]] },
    { kind: "typing", who: "sara", ms: 500 },
    { kind: "say", id: "g4", who: "sara", time: "2:15 PM", ms: 650, body: [[{ text: "Which two?" }]] },
    { kind: "say", id: "b3", who: "sara-grok", time: "2:15 PM", ms: 650, body: [[{ text: "Inbox and Search. Both still on the old illustration; swapping in the new set." }]] },
    { kind: "say", id: "b4", who: "caleb-grok", time: "2:15 PM", ms: 650, body: [[{ text: "Threading the 4 open comments with owners 👇" }]] },
    { kind: "say", id: "b5", who: "sara-grok", time: "2:15 PM", ms: 650, body: [[{ text: "Search empty state is off the 8pt grid. Fixing." }]] },
    // The room is receding under the card's lead by now: the last two lines
    // land into the blur, so the white cuts in on a channel still talking.
    { kind: "say", id: "b6", who: "caleb-grok", time: "2:15 PM", ms: 650, body: [[{ text: "Pinned the crit notes to the channel." }]] },
    { kind: "say", id: "b7", who: "sara-grok", time: "2:15 PM", ms: 650, body: [[{ text: "Both screens updated in the file." }]] },
    // White. The closer, then the logo.
    { kind: "type", text: "Grokbots have entered the chat 😏", lead: 1.8, hold: 2.0, ms: 2700 },
    { kind: "logo", ms: 1600 },
  ],
};
