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
  /** The disc lands on the line; first title. */
  agent: number;
  /** The line is pulled into the disc — every dot, sucked in. */
  absorb: number;
  /** The ground becomes the sky; the disc drifts to the seat of a pill. */
  sky: number;
  /** The trace: "Starting agent session", the sources, the reading, the draft. */
  trace: number;
  /** The pill collapses into the agent's card; the sky goes. */
  collapse: number;
  /** The agent becomes the typing indicator. */
  indicator: number;
  /** "so we built an interface around that": the window, the composer, the indicator finds its line. */
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

export const ORDER: (keyof Timing)[] = ["gather", "line", "stream", "agent", "absorb", "sky", "trace", "collapse", "indicator", "iface", "chat", "sidebar", "typing", "sara", "ask", "send", "reply", "logo", "end"];

export const LABELS: Record<keyof Timing, string> = {
  gather: "congregate",
  line: "the line",
  stream: "context stream",
  agent: "the agent",
  absorb: "absorb",
  sky: "the sky",
  trace: "the trace",
  collapse: "collapse",
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
  agent: 6.6,
  absorb: 8.4,
  sky: 9.8,
  trace: 11.2,
  collapse: 18.4,
  indicator: 19.6,
  iface: 21.4,
  chat: 22.8,
  sidebar: 23.8,
  typing: 24.5,
  sara: 25.7,
  ask: 26.4,
  send: 28.4,
  reply: 31.4,
  logo: 34.3,
  end: 36.9,
};
