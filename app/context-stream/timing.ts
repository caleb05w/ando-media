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
  /** The disc takes centre stage, becomes the agent; the card forms around it. */
  form: number;
  /** The card shows the agent working — the context trace runs. */
  work: number;
  /** The agent breaks out: the card becomes the window, the composer slides up. */
  breakout: number;
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
  /** The agent's reply lands; the agent takes its seat. */
  reply: number;
  /** The window goes; the logo comes. */
  logo: number;
  end: number;
};

export const ORDER: (keyof Timing)[] = ["gather", "line", "stream", "agent", "absorb", "form", "work", "breakout", "chat", "sidebar", "typing", "sara", "ask", "send", "reply", "logo", "end"];

export const LABELS: Record<keyof Timing, string> = {
  gather: "congregate",
  line: "the line",
  stream: "context stream",
  agent: "the agent",
  absorb: "absorb",
  form: "centre stage",
  work: "at work",
  breakout: "breakout",
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
  form: 9.7,
  work: 11.4,
  breakout: 18.0,
  chat: 19.3,
  sidebar: 20.3,
  typing: 21.0,
  sara: 22.2,
  ask: 22.9,
  send: 24.9,
  reply: 27.9,
  logo: 30.8,
  end: 33.4,
};
