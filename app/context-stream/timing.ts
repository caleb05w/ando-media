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
  /** The dots morph into the first face; from here the trace runs a job per agent — Grok, Claude, Codex (agents.ts). */
  trace: number;
  /** The last job has been read: the trace line sinks back into the agent. */
  collapse: number;
  /** The last face spins back into the typing dots: the library's animation, reversed. */
  indicator: number;
  /** "So we built a place for them.": after the typing state has held, the camera pulls back from the dots as the window builds around them. */
  iface: number;
  /** Header and the messages it is answering arrive. */
  chat: number;
  /** The sidebar slides in and the window widens. */
  sidebar: number;
  /** The last message lands: Claude's answer to Caleb. */
  reply: number;
  /** The closer: white, "One interface, all your agents", word by word, held. */
  closer: number;
  /** White washes up over the room and the lockup condenses out of it — the stage's ending, shared (ando-stage/cards.tsx). */
  logo: number;
  end: number;
};

export const ORDER: (keyof Timing)[] = ["gather", "stream", "line", "agent", "trace", "collapse", "indicator", "iface", "chat", "sidebar", "reply", "closer", "logo", "end"];

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
  reply: "Claude answers",
  closer: "closer",
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
  // job is read for 1.3s, then a crossfade to the next face (0.55s), and
  // the next job rolls in as the face lands. Codex's job has been read at
  // 10.78.
  trace: 5.8,
  collapse: 10.8,
  indicator: 11.15,
  // The face has spun out into the dots at indicator + 1.05; half a second
  // on them, then the pull-back.
  iface: 12.7,
  // Sara types before her line lands at chat + 0.4; the room needs the
  // dots to have landed (iface + 1.2) before her indicator takes the strip.
  chat: 14.7,
  sidebar: 17.1,
  reply: 18.7,
  // The closer's five words have arrived at closer + 1.02; it holds for the logo.
  closer: 21.1,
  logo: 23.2,
  // The lockup has seated at logo + 2.3; a beat on it.
  end: 25.7,
};
