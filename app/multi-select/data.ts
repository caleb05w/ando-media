// Transcript + sidebar data for the /multi-select screen — 1:1 with Figma
// node 17167-17686 (July Sprints, "Channel info: attachments version 20").

const A = "/multi-select";

export type DemoAuthor = {
  id: string;
  name: string;
  avatar: string;
};

export const AUTHORS = {
  jordan: { id: "jordan", name: "Jordan", avatar: `${A}/avatar-jordan.png` },
  peter: { id: "peter", name: "Peter", avatar: `${A}/avatar-peter.png` },
  oliver: { id: "oliver", name: "Oliver", avatar: `${A}/avatar-oliver.png` },
  sara: { id: "sara", name: "Sara Du", avatar: `${A}/avatar-sara.png` },
} as const satisfies Record<string, DemoAuthor>;

export type DemoMessage = {
  id: string;
  author: DemoAuthor;
  time: string;
  // Paragraphs; a segment with `link` renders in brand blue.
  body: Array<Array<{ text: string; link?: boolean }>>;
  threadFooter?: {
    avatars: string[];
    countLabel: string;
    newLabel: string;
    lastReply: string;
  };
};

const LINK_TEXT =
  "https://app.ando.so/4fe85a6f-7adc-4231b336sss d2bc793127b5/cf959c79-d682-4fc3-b238-e25440bf4822/composer-message.1782169341355.bb3c903d-dd84-46b4-aec4-3a577496676c";

export const MESSAGES: DemoMessage[] = [
  { id: "m1", author: AUTHORS.jordan, time: "5:35 pm", body: [[{ text: "How about Mongolian BBQ instead?" }]] },
  { id: "m2", author: AUTHORS.peter, time: "5:35 pm", body: [[{ text: "Sounds great! I'm in." }]] },
  { id: "m3", author: AUTHORS.oliver, time: "5:36 pm", body: [[{ text: "Who invited Peter, btw?" }]] },
  { id: "m4", author: AUTHORS.jordan, time: "5:35 pm", body: [[{ text: "How about Mongolian BBQ instead?" }]] },
  { id: "m5", author: AUTHORS.peter, time: "5:35 pm", body: [[{ text: "Sounds great! I'm in." }]] },
  { id: "m6", author: AUTHORS.oliver, time: "5:36 pm", body: [[{ text: "Who invited Peter, btw?" }]] },
  {
    id: "m7",
    author: AUTHORS.jordan,
    time: "5:35 pm",
    body: [
      [
        { text: "Group DMs will probably take a bit longer, probably sometime tomorrow. Going to layer in a proper fix outlined here: " },
        { text: LINK_TEXT, link: true },
      ],
    ],
  },
  { id: "m8", author: AUTHORS.peter, time: "5:35 pm", body: [[{ text: "Sounds great! I'm in." }]] },
  { id: "m9", author: AUTHORS.oliver, time: "5:36 pm", body: [[{ text: "Who invited Peter, btw?" }]] },
  {
    id: "m10",
    author: AUTHORS.sara,
    time: "5:15 pm",
    body: [[{ text: "Guyss..." }], [{ text: "I'm still waiting..." }]],
    threadFooter: {
      avatars: [`${A}/cluster-1.png`, `${A}/cluster-2.png`, `${A}/cluster-3.png`],
      countLabel: "6 replies",
      newLabel: " (3 new)",
      lastReply: "Last reply just now",
    },
  },
  { id: "m11", author: AUTHORS.jordan, time: "5:35 pm", body: [[{ text: "How about Mongolian BBQ instead?" }]] },
  { id: "m12", author: AUTHORS.oliver, time: "5:36 pm", body: [[{ text: "Working on a new experiment, anyone free to jam?" }]] },
];

export type SidebarEntry =
  | { kind: "folder"; icon: string; label: string }
  | { kind: "channel"; label: string; indent?: boolean; unread?: boolean; badge?: number; active?: boolean }
  | { kind: "person"; label: string; photo: string; indent?: boolean; unread?: boolean; presence?: "green" | "gray"; medium?: boolean }
  | { kind: "group"; label: string; muted?: boolean }
  | { kind: "create" };

export const SIDEBAR: SidebarEntry[] = [
  { kind: "folder", icon: `${A}/icon-emoji-smile.svg`, label: "design" },
  { kind: "folder", icon: `${A}/icon-folder-open.svg`, label: "FAVORITES" },
  { kind: "channel", label: "marketing", indent: true, unread: true, badge: 1 },
  { kind: "channel", label: "design", indent: true, active: true },
  { kind: "folder", icon: `${A}/icon-heart.svg`, label: "regulars" },
  { kind: "person", label: "AJ", photo: `${A}/sb-photo-1.png`, indent: true },
  { kind: "person", label: "Ryan Haraki", photo: `${A}/sb-photo-2.png`, indent: true },
];

export const SIDEBAR_FLAT: SidebarEntry[] = [
  { kind: "person", label: "AJ", photo: `${A}/sb-photo-1.png` },
  { kind: "person", label: "Jansen", photo: `${A}/sb-photo-4.png` },
  { kind: "channel", label: "feedback" },
  { kind: "channel", label: "daily-updates" },
  { kind: "channel", label: "marketing", unread: true, badge: 1 },
  { kind: "channel", label: "pod-core-messaging" },
  { kind: "person", label: "Olavo", photo: `${A}/sb-photo-6.png`, presence: "green", medium: true },
  { kind: "group", label: "Olavo & Sara", muted: true },
  { kind: "person", label: "Filipe", photo: `${A}/sb-photo-7.png` },
  { kind: "group", label: "Ando & Olavo", muted: true },
  { kind: "person", label: "Alex P", photo: `${A}/sb-photo-8.png` },
  { kind: "create" },
];
