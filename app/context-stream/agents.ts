// The agents the film's agent becomes, and when. Ando runs other people's
// agents: the agent is born as the typing dots, becomes Grok, Claude and
// Codex for a task each, and Codex spins back into the dots that the
// composer picks up. The dots become the first face by one of /the-library's
// v2 typing indicators' morphs (never Orbit v2, which is kept for the real
// typing indicator at the end); face to face is a morph in the film's own
// language — the mark dissolves into its dots, which travel and re-form as
// the next mark (scene.tsx) — not a typing indicator.

import { VARIANTS, type Variant } from "../agent-typing-experience/variants";
import { INDICATOR } from "./stream";
import type { Timing } from "./timing";

export const FACES = { grok: "/agents/grok.svg", claude: "/agents/claude.png", codex: "/agents/codex.png" } as const;
/** The faces that are a mark, not a portrait: no disc under them once they
 *  have landed. Grok's eyes are cutouts, so it counts. */
export const BARE: ReadonlySet<string> = new Set([FACES.grok, FACES.claude, FACES.codex]);
const variant = (key: string): Variant => VARIANTS.find((v) => v.key === key) ?? INDICATOR;
/** The becomings, in order: who the agent becomes. The first is the morph
 *  from the typing dots the agent was born as, by `FIRST_MORPH`; each next
 *  is the dot morph over SWAP_MS. The last face spins back into the dots at
 *  `indicator`. */
export const CHAIN: Array<{ face: keyof typeof FACES }> = [{ face: "grok" }, { face: "claude" }, { face: "codex" }];
export const FIRST_MORPH: Variant = variant("slingshot-v2");
/** A face-to-face morph, ms. */
export const SWAP_MS = 850;
/** How long a task is read before the agent becomes the next one. */
export const TASK_DUR = 1.3;
/** The k-th becoming's length, ms. */
export const swapMorphMs = (k: number) => (k === 0 ? FIRST_MORPH.morphMs : SWAP_MS);
/** When the k-th becoming starts: the first at `trace`, each next once its task has been read. */
export function becomingAt(T: Timing, k: number): number {
  return k === 0 ? T.trace : taskAt(T, k - 1) + TASK_DUR;
}
/** When the k-th becoming's face has landed. */
export function faceAt(T: Timing, k: number): number {
  return becomingAt(T, k) + swapMorphMs(k) / 1000;
}
/** When the k-th task's line rolls into the slot: as its agent's face lands. */
export function taskAt(T: Timing, k: number): number {
  return faceAt(T, k) - 0.25;
}
/** When the last task has been read — timing.ts's `collapse` default. */
export const lastTaskEnd = (T: Timing) => taskAt(T, CHAIN.length - 1) + TASK_DUR;
