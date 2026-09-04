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
  /** The agent forms out of the dots at centre stage; the stream keeps pouring into it. "Agents need all of it." */
  agent: number;
  /** The trace line rises beneath the agent and narrates the run, a task per agent: Tadao reads the jam, then becomes Grok, Claude, Codex for a task each (agents.ts), then Tadao again. */
  trace: number;
  /** The trace line sinks back into the agent, and the context around it folds in, as the last becoming — back to Tadao — begins. */
  collapse: number;
  /** The agent becomes the typing indicator: the library's animation, reversed — the face spins out into the dots. */
  indicator: number;
  /** "So we built one place for it.": after the typing state has held, the camera pulls back from the dots as the window builds around them. */
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

export const ORDER: (keyof Timing)[] = ["gather", "stream", "line", "agent", "trace", "collapse", "indicator", "iface", "chat", "sidebar", "reply", "logo", "end"];

export const LABELS: Record<keyof Timing, string> = {
  gather: "congregate",
  stream: "context stream",
  line: "the line",
  agent: "the agent",
  trace: "context trace",
  collapse: "back to the agent",
  indicator: "typing indicator",
  iface: "an interface",
  chat: "chat",
  sidebar: "sidebar",
  reply: "agent replies",
  logo: "logo",
  end: "end",
};

export const DEFAULT_TIMING: Timing = {
  // A long congregation — the line streams left the whole time it forms.
  gather: 1.4,
  stream: 1.9,
  line: 3.0,
  agent: 4.0,
  trace: 5.2,
  // The tasks run on the agents' clock from `trace` (agents.ts): a task is
  // read for 1.3s, then a becoming — the library's reset (0.45s), one
  // typing wave (0.9s), the variant's morph (0.73 · 0.96 · 1.08 · 1.4s) —
  // and the next task rolls in as the face lands. The last becoming, back
  // to Tadao, starts at 16.67 and lands at 19.42.
  collapse: 16.65,
  indicator: 19.7,
  // The typing state holds for a second once the morph has landed on the dots.
  iface: 21.75,
  chat: 23.15,
  sidebar: 25.65,
  reply: 28.45,
  logo: 30.65,
  end: 32.65,
};
