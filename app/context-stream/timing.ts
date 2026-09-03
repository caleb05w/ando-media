// /context-stream — the beats, in seconds. One number per moment the studio
// can drag; everything the film does hangs off one of these. Durations of
// the moves themselves (how long a title takes to fade, how long the
// sidebar slides) are fixed in scene.tsx — they are the film's grammar,
// the beats are its pacing.

export type Timing = {
  /** The cloud starts to pull toward the line; the frame tightens. */
  gather: number;
  /** Every dot is seated; the line starts to flow. */
  line: number;
  /** Things curve in from off-frame and join the line. */
  stream: number;
  /** The camera pans right, fast — the line streaks left. */
  pan: number;
  /** The agent comes into frame at the right; the stream runs into it. First title. */
  agent: number;
  /** The disc becomes the face; the card opens out around it. */
  card: number;
  /** The card hands its face to the typing indicator, which runs its cycle. */
  indicator: number;
  /** "so we built an interface around that": the camera pulls back from the indicator as the window builds around it. */
  iface: number;
  /** Header and the first message arrive. */
  chat: number;
  /** The sidebar slides in and the window widens. */
  sidebar: number;
  /** Sara is typing. */
  typing: number;
  /** Sara's line lands. */
  sara: number;
  /** Your ask types itself into the composer. */
  ask: number;
  /** The ask lands; the agent starts reading. */
  send: number;
  /** The agent's reply lands. */
  reply: number;
  /** The window goes; the logo comes. */
  logo: number;
  end: number;
};

export const ORDER: (keyof Timing)[] = ["gather", "line", "stream", "pan", "agent", "card", "indicator", "iface", "chat", "sidebar", "typing", "sara", "ask", "send", "reply", "logo", "end"];

export const LABELS: Record<keyof Timing, string> = {
  gather: "congregate",
  line: "the line",
  stream: "context stream",
  pan: "the pan",
  agent: "the agent eats",
  card: "the card",
  indicator: "typing indicator",
  iface: "an interface",
  chat: "chat",
  sidebar: "sidebar",
  typing: "sara typing",
  sara: "sara",
  ask: "you ask",
  send: "sent",
  reply: "agent replies",
  logo: "logo",
  end: "end",
};

export const DEFAULT_TIMING: Timing = {
  gather: 1.6,
  line: 3.3,
  stream: 3.9,
  pan: 6.2,
  agent: 7.0,
  card: 9.6,
  indicator: 11.9,
  iface: 16.2,
  chat: 17.6,
  sidebar: 18.6,
  typing: 19.3,
  sara: 20.5,
  ask: 21.2,
  send: 23.2,
  reply: 26.2,
  logo: 29.1,
  end: 31.7,
};
