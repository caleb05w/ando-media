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
  /** Things curve in from off-frame and join the line. Caption. */
  stream: number;
  /** The disc lands on the line; the ground goes grey; first title. */
  agent: number;
  /** Second title. The disc walks to the top-left, the line becomes the composer. */
  iface: number;
  /** The composer drops to the floor; header and messages arrive. */
  chat: number;
  /** The sidebar slides in and the window widens. */
  sidebar: number;
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

export const ORDER: (keyof Timing)[] = ["gather", "line", "stream", "agent", "iface", "chat", "sidebar", "ask", "send", "reply", "logo", "end"];

export const LABELS: Record<keyof Timing, string> = {
  gather: "congregate",
  line: "the line",
  stream: "context stream",
  agent: "the agent",
  iface: "an interface",
  chat: "chat",
  sidebar: "sidebar",
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
  agent: 6.6,
  iface: 8.8,
  chat: 10.6,
  sidebar: 12.2,
  ask: 13.5,
  send: 15.1,
  reply: 17.2,
  logo: 20.0,
  end: 22.6,
};
