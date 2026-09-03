// /context-stream — the beats, in seconds. One number per moment the studio
// can drag; everything the film does hangs off one of these. Durations of
// the moves themselves (how long a title takes to fade, how long the
// sidebar slides) are fixed in scene.tsx — they are the film's grammar,
// the beats are its pacing.

export type Timing = {
  /** The cloud pulls toward the line and the camera starts to move: the line streams left as it forms. */
  gather: number;
  /** Things curve in from off-frame and join the line. */
  stream: number;
  /** Every dot is seated. */
  line: number;
  /** The camera settles; the agent is at the end of the line and the stream runs into it. First title. */
  agent: number;
  /** The agent becomes the typing indicator — the library's reset, then its wave. */
  indicator: number;
  /** "so we built an interface around that": the camera pulls back from the indicator as the window builds around it. */
  iface: number;
  /** Header and the messages it is answering arrive. */
  chat: number;
  /** The sidebar slides in and the window widens. */
  sidebar: number;
  /** The agent's reply lands. */
  reply: number;
  /** The window goes; the logo comes. */
  logo: number;
  end: number;
};

export const ORDER: (keyof Timing)[] = ["gather", "stream", "line", "agent", "indicator", "iface", "chat", "sidebar", "reply", "logo", "end"];

export const LABELS: Record<keyof Timing, string> = {
  gather: "congregate",
  stream: "context stream",
  line: "the line",
  agent: "the agent",
  indicator: "typing indicator",
  iface: "an interface",
  chat: "chat",
  sidebar: "sidebar",
  reply: "agent replies",
  logo: "logo",
  end: "end",
};

export const DEFAULT_TIMING: Timing = {
  gather: 1.6,
  stream: 1.9,
  line: 2.3,
  agent: 3.4,
  indicator: 4.6,
  iface: 10.0,
  chat: 11.4,
  sidebar: 12.8,
  reply: 15.0,
  logo: 17.8,
  end: 20.4,
};
