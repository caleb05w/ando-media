// Shell data for /trace-canvas, per the August Sprints shell
// (Figma KbbfQN2ZkQuezAYP1lvfZg 394-7694) — forked from the old
// /multi-select mock so this route owns its own transcript and sidebar.
// Cast: Caleb (you — the live sender), Sara Du, Oli, AJ, Graeme, plus
// the agent roster from agents.tsx.

export type ShellSegment = { text: string; link?: boolean; mention?: boolean };

// Message bodies are BLOCKS now — the August transcript carries lists
// and an image attachment, not just paragraphs.
export type ShellBlock =
  | { kind: "text"; segments: ShellSegment[] }
  | { kind: "bullets"; items: string[] }
  | { kind: "numbered"; items: string[] }
  | { kind: "image" };

export type ShellMessage = {
  id: string;
  authorName: string;
  time: string;
  blocks: ShellBlock[];
  threadFooter?: { faces: number; count: string; lastReply: string };
};

const text = (t: string): ShellBlock => ({ kind: "text", segments: [{ text: t }] });

export const SHELL_MESSAGES: ShellMessage[] = [
  {
    id: "am-1",
    authorName: "AJ",
    time: "11:46 AM",
    blocks: [
      text("will probably need to update this interaction cuz of new ando bridges"),
      { kind: "image" },
    ],
    threadFooter: { faces: 2, count: "4 replies", lastReply: "Last reply today at 11:55 AM" },
  },
  {
    id: "am-2",
    authorName: "AJ",
    time: "1:11 PM",
    blocks: [
      text("current state of Ando Bridge page in settings:"),
      {
        kind: "bullets",
        items: [
          "list of all channels",
          "each channel show participating workspaces and pending invites",
        ],
      },
      text(
        'pending invites dont make sense anymore, cuz now we send email invites, or invite links. no workspace "handshake" link.'
      ),
      text(
        "so now i am thinking Ando Bridge page should just be a place to view where and who we are collaborating with. so should show:"
      ),
      {
        kind: "bullets",
        items: [
          "all bridge channels",
          "all invites (pending or otherwise)",
          "all collaborators (external members)",
          "all orgs in our workspace",
        ],
      },
      text(
        "not sure what task users might wanna accomplish while in here. i can only think of sending invites"
      ),
    ],
    threadFooter: { faces: 3, count: "13 replies", lastReply: "Last reply today at 2:12 PM" },
  },
  {
    id: "am-3",
    authorName: "Oli",
    time: "1:35 PM",
    blocks: [
      text("notes on ando bridges:"),
      {
        kind: "numbered",
        items: [
          "folder feels a little obtrusive in a fresh workspace - placing it on top of the rest of the channels communicates that it's higher prio. we should also consider that #ando-feedback will be most workspaces' only ando bridge channel for a while",
          "should improve the CTAs / rework the real-estate to introduce bridges",
        ],
      },
    ],
  },
  {
    id: "am-4",
    authorName: "Graeme",
    time: "1:58 PM",
    blocks: [text("shipping the bridges folder with the workspace template now, will report back")],
  },
];

// Pinned strip under the header.
export const SHELL_PIN = {
  author: "Sara Du",
  url: "https://linear.app/andoso/team/AND/view/design-view-583f6127bfdc",
  count: 3,
};

/* -------------------------------- sidebar ---------------------------------- */

export type ShellSidebarRow =
  | { kind: "section"; label: string }
  | { kind: "add"; label: string }
  | { kind: "person"; name: string; presence: "green" | "away" }
  | { kind: "channel"; label: string; active?: boolean; muted?: boolean; flat?: boolean }
  | { kind: "divider" };

export const SHELL_SIDEBAR: ShellSidebarRow[] = [
  { kind: "section", label: "Channels" },
  { kind: "add", label: "Add conversations" },
  { kind: "section", label: "Favorites" },
  { kind: "person", name: "Tadao", presence: "green" },
  { kind: "person", name: "AJ", presence: "green" },
  { kind: "person", name: "Sara Du", presence: "away" },
  { kind: "section", label: "Core" },
  { kind: "channel", label: "calebs-agent-tests" },
  { kind: "channel", label: "general" },
  { kind: "channel", label: "design", active: true },
  { kind: "channel", label: "bugs" },
  { kind: "section", label: "Secondary" },
  { kind: "channel", label: "sf-team" },
  { kind: "channel", label: "social" },
  { kind: "channel", label: "daily-updates", muted: true },
  { kind: "channel", label: "gratitude" },
  { kind: "divider" },
  { kind: "channel", label: "feedback", flat: true },
  { kind: "channel", label: "engineering", flat: true },
  { kind: "channel", label: "mobile", flat: true },
  { kind: "channel", label: "onboarding", flat: true },
  { kind: "channel", label: "website-signups", flat: true },
  { kind: "channel", label: "market-observations", flat: true },
  { kind: "channel", label: "hiring-ideas", flat: true },
  { kind: "channel", label: "feature-requests", flat: true },
  { kind: "person", name: "Graeme", presence: "green" },
  { kind: "channel", label: "food", flat: true },
];
