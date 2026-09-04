// /agent-morph — the beats, in seconds. One number per moment the studio
// can drag. A change of face is a bar: it starts when the old mark begins
// to leave, and its length is the leave, the typing between, and the
// arrival — the leave and arrival are the settings' (settings.ts), the
// typing is the bar's own `gap`, dragged by its right grip in whole waves.

export type Timing = {
  /** The agent appears — the typing dots, or the lone dot. */
  agent: number;
  /** It becomes Grok by Grok's arrival morph. */
  grok: number;
  /** Grok comes apart into the dots; they type for `claudeGap`; Claude gathers out of them. */
  claude: number;
  claudeGap: number;
  /** Claude comes apart into the dots; they type for `codexGap`; Codex gathers out of them. */
  codex: number;
  codexGap: number;
  end: number;
};

/** The lanes, in order — the gaps ride on their beats. */
export const ORDER: (keyof Timing)[] = ["agent", "grok", "claude", "codex", "end"];

export const LABELS: Record<keyof Timing, string> = {
  agent: "the dots",
  grok: "→ Grok",
  claude: "→ Claude",
  claudeGap: "typing before Claude",
  codex: "→ Codex",
  codexGap: "typing before Codex",
  end: "end",
};

export const DEFAULT_TIMING: Timing = {
  agent: 0.3,
  // A wave and a bit of typing, then the film's morph into Grok (Slingshot v2 lands at 2.225).
  grok: 1.5,
  // Grok is read for ~1.4s; the Slingshot backwards (0.725), one wave of
  // typing (0.9) and the Draw-in (0.7) have Claude landed at 5.93 — 2.3s end to end.
  claude: 3.6,
  claudeGap: 0.9,
  // Claude is read for 1.5s; the Draw-in backwards (0.7), a wave and the
  // Sip (0.85) have Codex landed at 9.75 — 2.45s.
  codex: 7.3,
  codexGap: 0.9,
  end: 11.2,
};
