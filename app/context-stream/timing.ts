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
  /** The stream rushes to centre stage and gathers into three dots. First title. */
  gather2: number;
  /** The three dots are the typing indicator: the library's animation turns them into the agent. */
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

export const ORDER: (keyof Timing)[] = ["gather", "line", "stream", "pan", "gather2", "indicator", "iface", "chat", "sidebar", "typing", "sara", "ask", "send", "reply", "logo", "end"];

export const LABELS: Record<keyof Timing, string> = {
  gather: "congregate",
  line: "the line",
  stream: "context stream",
  pan: "the pan",
  gather2: "three dots",
  indicator: "the agent forms",
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
  gather2: 7.0,
  indicator: 8.3,
  iface: 12.6,
  chat: 14.0,
  sidebar: 15.0,
  typing: 15.7,
  sara: 16.9,
  ask: 17.6,
  send: 19.6,
  reply: 22.6,
  logo: 25.5,
  end: 28.1,
};
