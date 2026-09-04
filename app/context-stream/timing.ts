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
  /** The stream collapses into the typing dots — the agent is born as the indicator. "To harness it, we built agents." */
  agent: number;
  /** The dots morph into the first face; from here the trace runs a job per agent — Grok, Claude, Codex (agents.ts). "Whichever agent you use." */
  trace: number;
  /** The last job has been read: the trace line sinks back into the agent. */
  collapse: number;
  /** The last face spins back into the typing dots: the library's animation, reversed. */
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
  // Two waves of typing dots (the library's own lead-in), then the morph
  // into Grok. The jobs run on the agents' clock from here (agents.ts): a
  // job is read for 1.3s, then a becoming — reset (0.45s), a wave (0.9s),
  // the variant's morph (0.96 · 1.08s) — and the next job rolls in as the
  // face lands. Codex's job has been read at 14.42.
  trace: 5.8,
  collapse: 14.4,
  indicator: 14.75,
  // The typing state holds for a second once the morph has landed on the dots.
  iface: 16.8,
  chat: 18.2,
  sidebar: 20.7,
  reply: 23.5,
  logo: 25.7,
  end: 27.7,
};
