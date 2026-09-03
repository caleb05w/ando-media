// /ando-stage — the scripts.
//
// A scene is a surface (a channel or a DM) plus an ordered list of beats.
// Playback applies beats 0..cursor and renders the result, so every frame is
// a pure function of one integer — scrubbing backwards lands on exactly the
// state playing forwards produced. Beat `ms` is the beat's own dwell.

const AV = "/avatars";

export type Actor = { name: string; avatar: string; agent?: true };

export type Segment = { text: string; link?: boolean; mention?: boolean; /** an @-mention of an agent reads in agent purple */ agent?: boolean };

export type LaunchCard = {
  eyebrow: string;
  title: string;
  blurb: string;
  bullets?: string[];
  cta?: string;
  band: "spark" | "ticket" | "grid";
};

export type Attachment =
  | { type: "image"; filename: string; bytes: number; src: string; width: number; height: number }
  | { type: "video"; filename: string; bytes: number; poster: string; width: number; height: number };

export type Beat =
  | { kind: "mark"; label: string; ms: number; tone?: "attention" }
  /** Someone opens a Jam. `participants` are who is in it at that moment;
   *  the card is authored by the first. You are in it only after `jam-join`. */
  | { kind: "jam-start"; id: string; time: string; participants: string[]; /** Rings in the header first; the card lands on `jam-answer`. */ ring?: true; ms: number }
  /** You pick up without joining yet: the ringing stops and the Jam card
   *  lands in the transcript. A `jam-join` while ringing does both at once. */
  | { kind: "jam-answer"; ms: number }
  /** You press Join: you enter the call and the panel docks. */
  | { kind: "jam-join"; ms: number }
  | { kind: "jam-end"; ms: number }
  /** The panel, alone and centred since you joined, unfolds its thread and
   *  live transcript beneath the call. */
  | { kind: "jam-deploy"; /** Which tab the unfolded panel opens on (thread by default). */ tab?: "thread" | "transcript"; ms: number }
  /** The room comes back and the panel takes its seat on the right. */
  | { kind: "jam-dock"; ms: number }
  /** Your pointer travels to a control (and presses it). Pure in the clock:
   *  the glide runs over the beat's first 0.9s, both directions. */
  | { kind: "cursor"; to: CursorTarget; glyph: "arrow" | "pointer" | "text"; press?: boolean; /** The camera pulls in around the target as the cursor sets off for it — `true` for the default 1.6×, or a scale (cards.tsx autoPoseAt). */ zoom?: true | number; ms: number }
  /** The Jam panel switches tab. */
  | { kind: "tab"; tab: "thread" | "transcript"; ms: number }
  /** Someone is talking — the ring on their tile — with nothing transcribed yet. */
  | { kind: "speak"; who: string; ms: number }
  /** A live-transcript segment lands (the newest one reads as still being spoken). */
  | { kind: "transcript"; who: string; text: string; ms: number }
  /** An agent run under message `on`, its activity line updating per beat. */
  | { kind: "trace"; run: string; on: string; who: string; label: string; icon?: "read" | "write" | "transcript"; ms: number }
  | { kind: "trace-done"; run: string; tool: string; ms: number }
  /** The camera: a shot. Opens at `scale` looking at `at`, and pushes in by
   *  `push` over the shot (until the next camera beat). `cut` snaps there;
   *  otherwise it glides from where it was. */
  | { kind: "camera"; at: CameraAnchor; scale: number; push?: number; cut?: boolean; ms: number }
  /** A type card: cut to white, the line arrives word by word, held `hold` seconds. */
  | { kind: "type"; text: string; hold: number; /** Cast handles shown as an avatar stack above the line — they pop in first. */ faces?: string[]; ms: number }
  /** The agent reading the jam: the library's context trace on white, run
   *  from its start for `hold` seconds, then a fade back to the room. */
  | { kind: "context"; hold: number; ms: number }
  /** The end: cut to white, the mark bounces in, the wordmark lands beside it. */
  | { kind: "logo"; ms: number }
  /** A full-frame title card over the app, held for `hold` seconds. */
  | { kind: "title"; eyebrow?: string; sub?: string; headline: string; hold: number; ms: number }
  | { kind: "typing"; who: string; ms: number }
  | { kind: "say"; id: string; who: string; time: string; body: Segment[][]; /** Lands in the Jam panel's thread, not the room. */ thread?: true; /** Lands in a DM (see the `surface` beat), not the channel. */ room?: "dm"; /** Types out character by character from the moment it lands (an agent writing), instead of arriving whole. */ typed?: true; ms: number }
  /** A DM goes unread in the sidebar. */
  | { kind: "dm-unread"; who: string; ms: number }
  /** The room switches to another conversation. */
  | { kind: "surface"; to: Surface; ms: number }
  | { kind: "card"; id: string; who: string; time: string; card: LaunchCard; ms: number }
  /** A file lands. Optional body posts as the message text above it. */
  | { kind: "attach"; id: string; who: string; time: string; body?: Segment[][]; attachment: Attachment; ms: number }
  | { kind: "react"; on: string; emoji: string; count: number; ms: number }
  | { kind: "agent"; run: string; on: string; who: string; task: string; ms: number }
  | { kind: "agent-done"; run: string; id: string; time: string; body: Segment[][]; ms: number };

/** What the main pane is: a channel (hashtag, member count) or a 1:1 DM
 *  (the other person's avatar and name, headphones instead of members). */
export type CursorTarget = "jam-button" | "join-button" | "composer" | "transcript-tab" | "thread-tab" | "hang-up" | "send-button" | "thread-send" | `dm:${string}`;

/** Where the camera looks: a control, the panel, the room, or a message (`row:<id>`). */
export type CameraAnchor = CursorTarget | "panel" | "jam-transcript" | "room" | `row:${string}`;

export type Surface =
  | { kind: "channel"; name: string; members: number; private?: boolean }
  | { kind: "dm"; who: string };

export type SidebarRow =
  | { kind: "channel"; name: string; private?: boolean; unread?: boolean; muted?: boolean }
  | { kind: "dm"; who: string; online?: boolean };

export type SidebarSection = { label: string; rows: SidebarRow[]; addRow?: boolean; /** Folded shut, so the sidebar stays quiet. */ collapsed?: true };

export type Scene = {
  id: string;
  name: string;
  blurb: string;
  surface: Surface;
  cast: Record<string, Actor>;
  beats: Beat[];
};

/** The mark is the brand's own (Ando-Brand 3932-109), not an agent face. */
export const ANDO_MARK = "/ando-stage/ando-mark.svg";
export const WORKSPACE = { name: "Ando Corp.", mark: ANDO_MARK };
export const ME = "caleb";

export const CAST = {
  sara: { name: "Sara Du", avatar: `${AV}/sara.png` },
  caleb: { name: "Caleb Wu", avatar: `${AV}/caleb.png` },
  oli: { name: "Oliver", avatar: `${AV}/oli.png` },
  aj: { name: "AJ", avatar: `${AV}/aj.png` },
  alex: { name: "Alex", avatar: `${AV}/alex.png` },
  ando: { name: "Ando", avatar: ANDO_MARK, agent: true },
  scout: { name: "Scout", avatar: `${AV}/agent-2.png`, agent: true },
  tadao: { name: "Tadao", avatar: `${AV}/agent-1.png`, agent: true },
} as const satisfies Record<string, Actor>;

export function isAgent(actor: Actor): boolean {
  return actor.agent === true;
}

/** The rail's sections, built from the cast. The active row is whichever
 *  matches the scene's surface. */
export const SIDEBAR: SidebarSection[] = [
  { label: "Channels", rows: [], addRow: true },
  { label: "Favorites", rows: [{ kind: "dm", who: "tadao", online: true }, { kind: "dm", who: "aj", online: true }, { kind: "dm", who: "oli", online: false }, { kind: "dm", who: "sara", online: true }] },
  // Folded, as in Caleb's own sidebar: the room stays quiet so a new DM reads.
  { label: "Core", collapsed: true, rows: [{ kind: "channel", name: "launch", unread: true }, { kind: "channel", name: "general" }, { kind: "channel", name: "design" }, { kind: "channel", name: "bugs" }] },
  { label: "Secondary", collapsed: true, rows: [{ kind: "channel", name: "sf-team", private: true }, { kind: "channel", name: "social" }, { kind: "channel", name: "daily-updates", muted: true }, { kind: "channel", name: "gratitude" }] },
];

export const SIDEBAR_LOOSE: SidebarRow[] = [
  { kind: "channel", name: "team", private: true },
  { kind: "channel", name: "ando-wins" },
  { kind: "channel", name: "slack" },
  { kind: "channel", name: "marketing" },
  { kind: "channel", name: "studio" },
  { kind: "dm", who: "alex" },
  { kind: "channel", name: "access" },
];

/* ------------------------------- scenes ------------------------------- */

const LAUNCH_DAY: Scene = {
  id: "launch-day",
  name: "Launch day",
  blurb: "The announcement lands in #launch and the room reacts.",
  surface: { kind: "channel", name: "launch", members: 24 },
  cast: CAST,
  beats: [
    { kind: "mark", label: "TODAY", ms: 900 },
    { kind: "typing", who: "sara", ms: 1100 },
    {
      kind: "card", id: "m1", who: "sara", time: "9:02 AM", ms: 2800,
      card: {
        band: "spark", eyebrow: "New in Ando", title: "Agents in every conversation",
        blurb: "Mention an agent anywhere you already talk and it works in the thread — reading the channel, doing the task, posting what it found.",
        bullets: ["Runs stay pinned to the message that started them", "Every result is a message anyone can read and reply to", "No new surface to learn — it is the conversation"],
        cta: "Read the announcement",
      },
    },
    { kind: "react", on: "m1", emoji: "🎉", count: 7, ms: 520 },
    { kind: "react", on: "m1", emoji: "🚀", count: 4, ms: 460 },
    { kind: "typing", who: "caleb", ms: 850 },
    {
      kind: "attach", id: "m2", who: "caleb", time: "9:03 AM", ms: 2600,
      body: [[{ text: "Demo video is up. Cut is 41 seconds." }]],
      attachment: { type: "video", filename: "agents-launch-cut-final.mp4", bytes: 18_400_000, poster: "/ando-stage/demo-still.svg", width: 720, height: 450 },
    },
    { kind: "say", id: "m3", who: "aj", time: "9:04 AM", ms: 1800, body: [[{ text: "Embargo lifts in eight minutes. Press list is queued." }]] },
    { kind: "agent", run: "r1", on: "m1", who: "scout", task: "Watching launch mentions across the web", ms: 2900 },
    { kind: "typing", who: "oli", ms: 900 },
    { kind: "say", id: "m4", who: "oli", time: "9:11 AM", ms: 1900, body: [[{ text: "Signups just crossed a thousand for the hour." }]] },
    {
      kind: "agent-done", run: "r1", id: "m5", time: "9:32 AM", ms: 2900,
      body: [[{ text: "First thirty minutes of the launch:" }], [{ text: "1,904 signups · 61% from the demo video" }], [{ text: "212 mentions, 8 of them from accounts over 50k" }], [{ text: "Top question, asked 34 times: “does it work with my existing channels?”" }]],
    },
    { kind: "react", on: "m5", emoji: "👀", count: 3, ms: 520 },
    { kind: "typing", who: "sara", ms: 1000 },
    { kind: "say", id: "m6", who: "sara", time: "9:33 AM", ms: 2400, body: [[{ text: "That last one is the follow-up post. " }, { text: "@caleb", mention: true }, { text: " can you queue it for noon?" }]] },
    { kind: "say", id: "m7", who: "caleb", time: "9:33 AM", ms: 1800, body: [[{ text: "On it." }]] },
  ],
};

const FOUNDER_DM: Scene = {
  id: "founder-dm",
  name: "Founder DM",
  blurb: "A 1:1 with Sara — copy review over screenshots.",
  surface: { kind: "dm", who: "sara" },
  cast: CAST,
  beats: [
    { kind: "mark", label: "TODAY", ms: 850 },
    { kind: "say", id: "m1", who: "sara", time: "11:12 AM", ms: 2200, body: [[{ text: "Can you send me the invite page one more time? Want to read it cold." }]] },
    { kind: "typing", who: "caleb", ms: 1000 },
    {
      kind: "attach", id: "m2", who: "caleb", time: "11:14 AM", ms: 2800,
      body: [[{ text: "Here — this is the body copy I liked for the affiliate invites." }]],
      attachment: { type: "image", filename: "CleanShot 2026-09-02 at 11.13.48@2x.png", bytes: 340_889, src: "/ando-stage/launch-shot.svg", width: 720, height: 560 },
    },
    { kind: "typing", who: "sara", ms: 900 },
    { kind: "say", id: "m3", who: "sara", time: "11:14 AM", ms: 1500, body: [[{ text: "oo yea" }]] },
    { kind: "say", id: "m4", who: "sara", time: "11:14 AM", ms: 1700, body: [[{ text: "definitely" }]] },
    { kind: "react", on: "m2", emoji: "❤️", count: 1, ms: 500 },
    { kind: "typing", who: "sara", ms: 1000 },
    { kind: "say", id: "m5", who: "sara", time: "11:15 AM", ms: 2400, body: [[{ text: "“One invite. Make it count.” is the whole thing. Lead with it, lose the second paragraph." }]] },
    { kind: "say", id: "m6", who: "caleb", time: "11:15 AM", ms: 1600, body: [[{ text: "Cutting it now." }]] },
    { kind: "agent", run: "r1", on: "m6", who: "ando", task: "Updating the invite page copy in Studio", ms: 2600 },
    { kind: "agent-done", run: "r1", id: "m7", time: "11:16 AM", ms: 2400, body: [[{ text: "Updated " }, { text: "ando.so/invite", link: true }, { text: " — headline now leads, second paragraph removed. Preview is live for the team." }]] },
    { kind: "react", on: "m7", emoji: "✅", count: 2, ms: 520 },
  ],
};

const GOLDEN_TICKETS: Scene = {
  id: "golden-tickets",
  name: "Golden tickets",
  blurb: "An invite-only launch in #marketing, watched live.",
  surface: { kind: "channel", name: "marketing", members: 9 },
  cast: CAST,
  beats: [
    { kind: "mark", label: "TODAY", ms: 850 },
    { kind: "typing", who: "sara", ms: 1000 },
    {
      kind: "card", id: "m1", who: "sara", time: "8:59 AM", ms: 3000,
      card: {
        band: "ticket", eyebrow: "Launching in one minute", title: "Golden tickets",
        blurb: "Every member gets exactly one invite. Not a referral code — a page with your name on it, and one seat behind it.",
        bullets: ["ando.so/@yourname goes live the moment you claim it", "One ticket per member. When it is used, it is gone", "Handles are first-come, and they never come back"],
        cta: "ando.so/@sara",
      },
    },
    { kind: "react", on: "m1", emoji: "🎟️", count: 12, ms: 540 },
    { kind: "say", id: "m2", who: "alex", time: "9:00 AM", ms: 2000, body: [[{ text: "Invites are out. Nine thousand tickets, all live at once." }]] },
    { kind: "agent", run: "r1", on: "m1", who: "scout", task: "Watching handle claims", ms: 2800 },
    { kind: "typing", who: "caleb", ms: 900 },
    {
      kind: "attach", id: "m3", who: "caleb", time: "9:06 AM", ms: 2600,
      body: [[{ text: "Claim page is holding — p95 is 180ms, no errors." }]],
      attachment: { type: "image", filename: "claim-page-p95.png", bytes: 212_400, src: "/ando-stage/launch-shot.svg", width: 720, height: 560 },
    },
    { kind: "agent-done", run: "r1", id: "m4", time: "9:20 AM", ms: 2900, body: [[{ text: "Twenty minutes in:" }], [{ text: "412 handles claimed · 89 tickets already spent" }], [{ text: "Median time from claim to invite sent: 4 minutes" }], [{ text: "Nine of the ten most-shared pages belong to members who joined this week" }]] },
    { kind: "react", on: "m4", emoji: "🚀", count: 6, ms: 540 },
    { kind: "typing", who: "sara", ms: 950 },
    { kind: "say", id: "m5", who: "sara", time: "9:21 AM", ms: 2400, body: [[{ text: "The newest people are doing the inviting. That is the whole thesis, on day one." }]] },
    { kind: "say", id: "m6", who: "alex", time: "9:22 AM", ms: 1900, body: [[{ text: "Screenshotting that line for the deck." }]] },
  ],
};

/** The stage as it ships right now: a 1:1 with Sara and nothing scripted —
 *  the transcript is whatever you send. */
const BLANK: Scene = {
  id: "blank",
  name: "Stage",
  blurb: "An empty conversation. Type to fill it.",
  surface: { kind: "dm", who: "sara" },
  cast: CAST,
  beats: [],
};

/** The storyboard (Ando Brand 3963-1565): Caleb sends the launch-video ideas,
 *  the back-and-forth stalls in two lines, Sara opens a Jam, the ideas get
 *  settled out loud with the transcript running, a title card lands, then
 *  Sara asks Tadao to summarize — and Tadao files the tickets. */
const CHAT_THEN_JAM: Scene = {
  id: "chat-then-jam",
  name: "Bring your agents to jams",
  blurb: "The launch-video conversation, from DM to Jam to tickets.",
  surface: { kind: "dm", who: "sara" },
  cast: CAST,
  beats: [
    { kind: "mark", label: "TODAY", ms: 4600 },
    { kind: "say", id: "j1", who: "caleb", time: "11:05 AM", ms: 1500, body: [[{ text: "What do you think of this?" }], [{ text: "figma.com/design/e4gEqJUqBMec19Al1BhLEc/Ando-Brand?node-id=3963-1565", link: true }]] },
    { kind: "typing", who: "sara", ms: 900 },
    { kind: "say", id: "j2", who: "sara", time: "11:06 AM", ms: 550, body: [[{ text: "Wait, which parts?" }]] },
    { kind: "say", id: "j3", who: "sara", time: "11:06 AM", ms: 1300, body: [[{ text: "Is this for our launch video?" }]] },
    { kind: "say", id: "j4", who: "caleb", time: "11:06 AM", ms: 1000, body: [[{ text: "Yeah, I had a few ideas." }]] },
    { kind: "typing", who: "sara", ms: 1000 },
    { kind: "say", id: "j5", who: "sara", time: "11:07 AM", ms: 1200, body: [[{ text: "Awesome, let's see them — let's jam?" }]] },
    { kind: "jam-start", id: "jam1", time: "11:07 AM", participants: ["sara"], ms: 1300 },
    { kind: "say", id: "j6", who: "caleb", time: "11:07 AM", ms: 900, body: [[{ text: "coming" }]] },
    { kind: "cursor", to: "join-button", glyph: "arrow", press: true, ms: 1200 },
    // Joining is the hero moment: the card becomes the call, alone and
    // centred over a dimmed room. Then the thread and live transcript
    // unfold beneath it, the first line lands while it is still big, and
    // only then does the room come back with the panel docked on the right.
    { kind: "jam-join", ms: 2000 },
    { kind: "jam-deploy", ms: 1400 },
    { kind: "cursor", to: "transcript-tab", glyph: "pointer", press: true, ms: 1100 },
    { kind: "tab", tab: "transcript", ms: 900 },
    // The Jam is the point: it moves the way talking moves. Short lines,
    // fast turns, the decision made in twenty seconds.
    { kind: "transcript", who: "caleb", text: "okay, idea one", ms: 1200 },
    { kind: "jam-dock", ms: 1400 },
    { kind: "transcript", who: "caleb", text: "we open on the Slack import", ms: 1400 },
    { kind: "transcript", who: "sara", text: "the whole workspace coming apart?", ms: 1400 },
    { kind: "transcript", who: "caleb", text: "yeah, and landing in Ando", ms: 1300 },
    { kind: "transcript", who: "sara", text: "love it. too much for the first three seconds though", ms: 1900 },
    { kind: "transcript", who: "caleb", text: "fair", ms: 800 },
    { kind: "transcript", who: "sara", text: "what's two", ms: 900 },
    { kind: "transcript", who: "caleb", text: "agents in every channel. Tadao answering in a thread", ms: 1900 },
    { kind: "transcript", who: "caleb", text: "no voiceover", ms: 1000 },
    { kind: "transcript", who: "sara", text: "that one", ms: 900 },
    { kind: "transcript", who: "sara", text: "and the golden ticket as the close", ms: 1500 },
    { kind: "transcript", who: "caleb", text: "so agent, import, ticket", ms: 1300 },
    { kind: "transcript", who: "sara", text: "ship it", ms: 1200 },
    { kind: "title", eyebrow: "Jams are live transcribed", sub: "So agents can join in on jams.", headline: "Bring your agents to jams.", hold: 4.2, ms: 4800 },
    { kind: "cursor", to: "hang-up", glyph: "pointer", press: true, ms: 1300 },
    { kind: "jam-end", ms: 1500 },
    { kind: "typing", who: "sara", ms: 1400 },
    { kind: "say", id: "j7", who: "sara", time: "11:12 AM", ms: 1200, body: [[{ text: "@Tadao", mention: true, agent: true }, { text: " can you summarize the issues we talked about?" }]] },
    { kind: "trace", run: "t1", on: "j7", who: "tadao", label: "Starting agent session", ms: 1800 },
    { kind: "trace", run: "t1", on: "j7", who: "tadao", label: "Reading the call transcript…", icon: "transcript", ms: 1900 },
    { kind: "trace", run: "t1", on: "j7", who: "tadao", label: "Drafting the summary…", icon: "write", ms: 1000 },
    { kind: "typing", who: "tadao", ms: 2000 },
    { kind: "trace-done", run: "t1", tool: "Post Message", ms: 300 },
    {
      kind: "say", id: "j8", who: "tadao", time: "11:13 AM", ms: 3200,
      body: [
        [{ text: "Quick recap of the jam:" }],
        [{ text: "Three launch-video ideas from the Figma — the Slack import coming apart, an agent answering in a thread, and the golden ticket as the close." }],
        [{ text: "You landed on: cold open on the agent, the import in the middle, the ticket as the call to action." }],
      ],
    },
    { kind: "trace", run: "t2", on: "j8", who: "tadao", label: "Triaging into Linear…", icon: "write", ms: 2600 },
    { kind: "typing", who: "tadao", ms: 1600 },
    { kind: "trace-done", run: "t2", tool: "Create Issue", ms: 300 },
    {
      kind: "say", id: "j9", who: "tadao", time: "11:13 AM", ms: 7000,
      body: [
        [{ text: "Filed three tickets:" }],
        [{ text: "AND-7110", link: true }, { text: " — Launch video: agent cold open" }],
        [{ text: "AND-7111", link: true }, { text: " — Launch video: Slack import sequence" }],
        [{ text: "AND-7112", link: true }, { text: " — Launch video: golden ticket close" }],
      ],
    },
  ],
};

/* The launch cut — the same story as CHAT_THEN_JAM at the reference's pace
 * (app/context-stream/MOTION.md): ~30s, seven shots, hard cuts, one type
 * card, the logo to close. No camera beats for now — the timing is what is
 * being tuned; `camera` beats can come back per shot when the pacing is set. The first four lines are already on screen when it
 * opens; the room is a set, not a screenshot. */
const JAMS_CUT: Scene = {
  id: "jams-cut",
  name: "Jams launch — the cut",
  blurb: "Ring, card, jam, recap in the thread, Tadao's DM, closer, logo. In #marketing.",
  surface: { kind: "channel", name: "marketing", members: 9 },
  cast: CAST,
  beats: [
    // The opening in about two seconds: the link is up, Sara's question
    // shows her typing, your reply types itself, she asks for the jam.
    { kind: "say", id: "j1", who: "caleb", time: "11:05 AM", ms: 300, body: [[{ text: "What do you think of this?" }], [{ text: "figma.com/design/e4gEqJUqBMec19Al1BhLEc/Ando-Brand?node-id=3963-1565", link: true }]] },
    { kind: "typing", who: "sara", ms: 500 },
    { kind: "say", id: "j3", who: "sara", time: "11:06 AM", ms: 900, body: [[{ text: "Is this for our launch video?" }]] },
    { kind: "say", id: "j4", who: "caleb", time: "11:06 AM", ms: 400, body: [[{ text: "Yeah, I had a few ideas." }]] },
    { kind: "typing", who: "sara", ms: 500 },
    { kind: "say", id: "j5", who: "sara", time: "11:07 AM", ms: 700, body: [[{ text: "Awesome, let's see them — let's jam?" }]] },
    // Sara starts the Jam: the headphones ring and the cursor goes to them.
    // Every press zooms the frame in around it (the auto camera, cards.tsx).
    // The press IS the join — but first, the card, so a viewer who has
    // never seen Ando knows what they are watching.
    { kind: "jam-start", id: "jam1", time: "11:07 AM", participants: ["sara"], ring: true, ms: 1300 },
    { kind: "cursor", to: "jam-button", glyph: "pointer", press: true, ms: 900 },
    // Shot 2 — cut to the sky: the call arrives, the ring trades between
    // you as the first lines are spoken, the transcript unfolds with them
    // already in it and keeps pouring. The agent can keep up; nobody else can.
    { kind: "jam-join", ms: 200 },
    { kind: "transcript", who: "caleb", text: "okay, idea one", ms: 500 },
    { kind: "transcript", who: "caleb", text: "we open on the Slack import", ms: 480 },
    { kind: "transcript", who: "sara", text: "the whole workspace coming apart?", ms: 400 },
    { kind: "jam-deploy", tab: "transcript", ms: 200 },
    { kind: "transcript", who: "caleb", text: "yeah, and landing in Ando", ms: 520 },
    { kind: "transcript", who: "sara", text: "love it. too much for the first three seconds though", ms: 1650 },
    // Shot 3 — the room comes back; the panel docks; five more lines, quick.
    { kind: "jam-dock", ms: 300 },
    { kind: "transcript", who: "caleb", text: "idea two: Tadao answering in a thread", ms: 430 },
    { kind: "transcript", who: "sara", text: "no voiceover?", ms: 400 },
    { kind: "transcript", who: "caleb", text: "no voiceover. agent first, then the import", ms: 450 },
    { kind: "transcript", who: "sara", text: "and the golden ticket as the close", ms: 430 },
    { kind: "transcript", who: "caleb", text: "ship it", ms: 1500 },
    // Shot 4 — white. The middle line.
    // The cursor sets off for Thread as the card's white is still fading;
    // once the thread is open, Sara pings Tadao in it.
    { kind: "type", text: "Jam it out with your human (and agent) teammates", faces: ["caleb", "sara", "tadao"], hold: 2.6, ms: 2800 },
    { kind: "cursor", to: "thread-tab", glyph: "pointer", press: true, ms: 950 },
    { kind: "tab", tab: "thread", ms: 250 },
    { kind: "say", id: "j7", who: "sara", time: "11:12 AM", thread: true, ms: 400, body: [[{ text: "@Tadao", mention: true, agent: true }, { text: " can you make sure to follow up w/ us" }]] },
    { kind: "trace", run: "t1", on: "j7", who: "tadao", label: "Reading the call transcript…", icon: "transcript", ms: 1200 },
    { kind: "trace", run: "t1", on: "j7", who: "tadao", label: "Drafting the recap…", icon: "write", ms: 600 },
    { kind: "trace-done", run: "t1", tool: "Post Message", ms: 200 },
    {
      kind: "say", id: "j8", who: "tadao", time: "11:12 AM", thread: true, typed: true, ms: 2000,
      body: [
        [{ text: "for sure — quick recap:" }],
        [{ text: "• Agent first, then the Slack import" }],
        [{ text: "• Tadao answering in a thread is idea two" }],
        [{ text: "• Golden ticket as the close" }],
        [{ text: "• No voiceover" }],
      ],
    },
    // Shot 6 — a second after the recap, Tadao does what it said: a DM,
    // unread in the sidebar while the call is still on. You hang up, then
    // open it.
    { kind: "dm-unread", who: "tadao", ms: 0 },
    {
      kind: "say", id: "d1", who: "tadao", time: "11:13 AM", room: "dm", typed: true, ms: 1100,
      body: [
        [{ text: "Follow-ups from the jam, on you:" }],
        [{ text: "1. Cut the video, agent first" }],
        [{ text: "2. Send Sara the Figma" }],
        [{ text: "3. Post it in #marketing" }],
        [{ text: "I can remind you again tomorrow." }],
      ],
    },
    { kind: "cursor", to: "hang-up", glyph: "pointer", press: true, ms: 950 },
    { kind: "jam-end", ms: 500 },
    { kind: "cursor", to: "dm:tadao", glyph: "pointer", press: true, ms: 950 },
    { kind: "surface", to: { kind: "dm", who: "tadao" }, ms: 3000 },
    // Shot 7 — white. The closer, then the logo.
    { kind: "type", text: "Ando Jams - like huddles, but they don't evaporate.", hold: 2.4, ms: 2400 },
    { kind: "logo", ms: 3000 },
  ],
};

export const SCENES: Scene[] = [JAMS_CUT, CHAT_THEN_JAM, BLANK];

/* ------------------------- timing, for the Studio ------------------------- */

/** One number per beat: the second it lands. Built from the script's dwells
 *  so a scene written as "hold this for 900ms" starts out on the same clock
 *  the Studio then edits. */
export type Timing = Record<string, number>;

export const beatKey = (index: number) => `t${index}`;

export function defaultTiming(scene: Scene): Timing {
  const timing: Timing = {};
  let t = 0.5; // lead-in
  scene.beats.forEach((beat, index) => {
    timing[beatKey(index)] = Math.round(t * 100) / 100;
    t += beat.ms / 1000;
  });
  return timing;
}

export function totalFor(scene: Scene) {
  return (T: Timing) => {
    const last = scene.beats.length - 1;
    return last < 0 ? 0 : T[beatKey(last)] + scene.beats[last].ms / 1000;
  };
}

/** What you (ME) are typing at `vt`, or null. Your lines never show an
 *  indicator — you are the one typing — so instead the next line of yours
 *  types itself into the composer over the gap before it lands, at a pace
 *  set by its length, and sends on the beat. Pure in the clock, so it
 *  scrubs: drag back and the letters un-type. */
/** How long each keystroke takes relative to the mean: a small deterministic
 *  wobble per character, a breath after a space, a longer one after
 *  punctuation. Pure in the text, so it scrubs. */
function keyWeights(text: string): number[] {
  const weights: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const prev = i > 0 ? text[i - 1] : "";
    // A cheap hash of the position gives the wobble without any randomness.
    const wobble = 0.72 + (((i * 2654435761) >>> 0) % 1000) / 1000 * 0.7;
    const pause = prev === " " ? 1.5 : /[,;:]/.test(prev) ? 2.2 : /[.!?]/.test(prev) ? 3.2 : prev === "\n" ? 3.6 : 1;
    weights.push(wobble * pause);
  }
  return weights;
}

/** A beat of stillness between the last keystroke and the send. */
export const SEND_HOLD = 0.4;

/** Whether the line you are about to send goes to the Jam thread (true) or the room. */
export function scriptedDraftInThread(scene: Scene, T: Timing, vt: number): boolean {
  const beat = scene.beats[cursorAt(scene, T, vt)];
  return beat != null && beat.kind === "say" && beat.who === ME && beat.thread === true;
}

export function scriptedDraftAt(scene: Scene, T: Timing, vt: number): string | null {
  const next = cursorAt(scene, T, vt);
  const beat = scene.beats[next];
  if (beat == null || beat.kind !== "say" || beat.who !== ME) return null;
  const text = beat.body.map((paragraph) => paragraph.map((segment) => segment.text).join("")).join("\n");
  // Keystroke plan: prose is typed a character at a time; a link is pasted —
  // it lands as one chunk after a short reach for the clipboard.
  const steps: Array<{ n: number; w: number }> = [];
  let offset = 0;
  beat.body.forEach((paragraph, pIndex) => {
    if (pIndex > 0) { steps.push({ n: 1, w: 3.6 }); offset += 1; }
    for (const segment of paragraph) {
      if (segment.link) { steps.push({ n: segment.text.length, w: 4 }); }
      else for (const w of keyWeights(text.slice(offset, offset + segment.text.length))) steps.push({ n: 1, w });
      offset += segment.text.length;
    }
  });
  const keyed = steps.filter((step) => step.n === 1).length;
  const start = T[beatKey(next)];
  const prevEnd = next > 0 ? T[beatKey(next - 1)] : 0;
  const room = start - prevEnd - 0.15;
  const hold = Math.min(SEND_HOLD, Math.max(0, room - 0.3));
  const window = Math.max(0.25, Math.min(room - hold, 0.07 * keyed + 0.5));
  const from = start - hold - window;
  if (vt < from) return null;
  const total = steps.reduce((sum, step) => sum + step.w, 0);
  const budget = Math.min(1, (vt - from) / window) * total;
  let spent = 0;
  let chars = 0;
  for (const step of steps) { if (spent + step.w > budget) break; spent += step.w; chars += step.n; }
  if (vt >= start - hold) chars = text.length;
  return chars > 0 ? text.slice(0, chars) : null;
}

/** The pointer at `vt`: which target it is gliding to, how far along, and
 *  whether it is pressing. Null before the first cursor beat. */
export function pointerAt(scene: Scene, T: Timing, vt: number): { from: CursorTarget | null; to: CursorTarget; glyph: "arrow" | "pointer" | "text"; progress: number; press: number; at: number } | null {
  let prev: CursorTarget | null = null;
  let current: { to: CursorTarget; glyph: "arrow" | "pointer" | "text"; press: boolean; at: number } | null = null;
  scene.beats.forEach((beat, index) => {
    if (beat.kind !== "cursor" || T[beatKey(index)] > vt) return;
    if (current) prev = current.to;
    current = { to: beat.to, glyph: beat.glyph, press: beat.press === true, at: T[beatKey(index)] };
  });
  if (!current) return null;
  const c = current as { to: CursorTarget; glyph: "arrow" | "pointer" | "text"; press: boolean; at: number };
  const glide = 0.9;
  const progress = Math.min(1, Math.max(0, (vt - c.at) / glide));
  const pressT = c.press ? Math.min(1, Math.max(0, (vt - c.at - glide) / 0.16)) : 0;
  return { from: prev, to: c.to, glyph: c.glyph, progress, press: c.press ? Math.sin(Math.PI * pressT) : 0, at: c.at };
}

/** Seconds the scripted Jam has been open at `vt`, or null when none is. */
export function jamElapsedAt(scene: Scene, T: Timing, vt: number): number | null {
  let start: number | null = null;
  scene.beats.forEach((beat, index) => {
    if (T[beatKey(index)] > vt) return;
    if (beat.kind === "jam-start") start = T[beatKey(index)];
    if (beat.kind === "jam-end") start = null;
  });
  return start == null ? null : Math.max(0, Math.floor(vt - start));
}

/** Beats landed by `vt`: the cursor, derived from the clock every frame. */
export function cursorAt(scene: Scene, T: Timing, vt: number): number {
  let n = 0;
  while (n < scene.beats.length && T[beatKey(n)] <= vt) n += 1;
  return n;
}

/** The scripted launch takes, parked. Put any of them back in SCENES and the
 *  director bar returns with it. */
export const ARCHIVED_SCENES: Scene[] = [LAUNCH_DAY, FOUNDER_DM, GOLDEN_TICKETS];
