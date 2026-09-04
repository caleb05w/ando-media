// /ando-grok — the script.
//
// Sara (the boss) asks Caleb (the intern) in #design how the onboarding flow
// is looking. Caleb brings his Grok in to post storyboards; Sara brings hers
// to share the scripts — and then leaves the two bots to it. The two bots join the channel — a join row
// each, the member count ticking up — and get noisy, six lines between them.
// Then white: "Grokbots, now in your Ando channels", and the logo.

import { CAST as STAGE_CAST, type Actor, type Attachment, type Scene } from "../ando-stage/scenes";

const AV = "/avatars";


/** The stage's cast plus the two Grokbots (the pfps from Caleb's desktop). */
export const CAST = {
  ...STAGE_CAST,
  "caleb-grok": { name: "Caleb's Grok", avatar: `${AV}/caleb-grok.png`, agent: true },
  "sara-grok": { name: "Sara's Grok", avatar: `${AV}/sara-grok.png`, agent: true },
} as const satisfies Record<string, Actor>;

/** The four screens Caleb's Grok posts: storyboard frames cut from
 *  Ando-Brand 3866-1505 (public/ando-grok/screens). Sizes are the files'. */
const SCREENS: Attachment[] = [
  { type: "image", filename: "onboarding-01.png", bytes: 176661, src: "/ando-grok/screens/onboarding-01.png", width: 700, height: 392 },
  { type: "image", filename: "onboarding-02.png", bytes: 5466, src: "/ando-grok/screens/onboarding-02.png", width: 309, height: 186 },
  { type: "image", filename: "onboarding-03.png", bytes: 45697, src: "/ando-grok/screens/onboarding-03.png", width: 1200, height: 600 },
  { type: "image", filename: "onboarding-04.png", bytes: 129088, src: "/ando-grok/screens/onboarding-04.png", width: 1200, height: 604 },
];

export const GROK_CUT: Scene = {
  id: "grok-cut",
  name: "Grokbots",
  blurb: "Caleb's Grok and Sara's Grok join #design and chat with us.",
  surface: { kind: "channel", name: "design", members: 15 },
  cast: CAST,
  beats: [
    // The window rises (0.15–0.75s) on an empty room. Sara opens — she's the
    // boss — and your reply types itself into the composer over her line's
    // dwell (4.9s is what ~120 characters need at typing pace) before it lands.
    { kind: "wait", ms: 300 },
    { kind: "typing", who: "sara", ms: 900 },
    { kind: "say", id: "g1", who: "sara", time: "2:14 PM", ms: 4900, body: [[{ text: "so how's the new onboarding flow looking? can we lock it in before i start putting together the X stuff?" }]] },
    { kind: "say", id: "g2", who: "caleb", time: "2:14 PM", ms: 400, body: [[{ text: "yea, it's coming together, let me pull my grokbot in though to keep you posted on the latest storyboards as i finish this up" }]] },
    { kind: "typing", who: "sara", ms: 900 },
    { kind: "say", id: "g3", who: "sara", time: "2:15 PM", ms: 500, body: [[{ text: "cool lemme bring mine too to share some of the scripts we're brainstorming - that way you can adjust the frames as you go" }]] },
    // The bots arrive: one join row for both, the count ticking 15 → 17.
    { kind: "join", id: "j1", who: ["caleb-grok", "sara-grok"], time: "2:15 PM", ms: 1000 },
    // ...and start talking — landing whole, about 650ms apart; agents post,
    // they don't type. Caleb's brings the screens (the four get a look).
    {
      kind: "attach", id: "b1", who: "caleb-grok", time: "2:15 PM", ms: 1300,
      body: [[{ text: "here are the four screens Caleb & i are still correcting from crit" }]],
      attachment: SCREENS,
    },
    { kind: "say", id: "b2", who: "sara-grok", time: "2:15 PM", ms: 700, body: [[{ text: "yea, we're missing the screen showing how app connections work, make sure to include the Shared vs Personal breakdown" }]] },
    { kind: "say", id: "b3", who: "sara-grok", time: "2:15 PM", ms: 700, body: [[{ text: "and then sara had some thoughts on some additional storylines, we're still cooking" }]] },
    { kind: "typing", who: "sara", ms: 700 },
    { kind: "say", id: "g4", who: "sara", time: "2:15 PM", ms: 650, body: [[{ text: "go ahead and share them w caleb and discuss without me actually, im going into a meeting" }]] },
    // The room is receding under the card's lead by now: the last two lines
    // land into the blur, so the white cuts in on a channel still talking.
    { kind: "say", id: "b4", who: "sara-grok", time: "2:15 PM", ms: 650, body: [[{ text: "cool, so we need the other variant of onboarding that shows how external agents work" }]] },
    { kind: "say", id: "b5", who: "sara-grok", time: "2:15 PM", ms: 650, body: [[{ text: "which means we need 8 extra frames we can pull from our Onboarding file" }]] },
    // White. The closer, then the logo.
    { kind: "type", text: "Grokbots, now in your Ando channels", lead: 1.8, hold: 2.0, ms: 2700 },
    { kind: "logo", ms: 2100 },
  ],
};
