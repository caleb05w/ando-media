// The agents the film's agent becomes, and when. Ando runs other people's
// agents: the agent is born as the typing dots, becomes Grok, Claude and
// Codex for a task each, and Codex spins back into the dots that the
// composer picks up. Each becoming is a different one of /the-library's
// v2 typing indicators — never Orbit v2, which is kept for the real typing
// indicator at the end — run as the library runs it: the reset (the face
// snuffs out to a dot), one typing wave, the morph (the dots become the
// next face).

import { RESET_MS, VARIANTS, WAVE_MS, type Variant } from "../agent-typing-experience/variants";
import { INDICATOR } from "./stream";
import type { Timing } from "./timing";

export const FACES = { grok: "/agents/grok.svg", claude: "/agents/claude.png", codex: "/agents/codex.png" } as const;
/** The faces that are a mark, not a portrait: no disc under them once they
 *  have landed. Grok's eyes are cutouts, so it counts. */
export const BARE: ReadonlySet<string> = new Set([FACES.grok, FACES.claude, FACES.codex]);
const variant = (key: string): Variant => VARIANTS.find((v) => v.key === key) ?? INDICATOR;
/** The becomings, in order: who the agent becomes, and by which indicator.
 *  The agent is born as the typing dots; the first becoming is the morph
 *  alone, from those dots; each next is the library's reset, a wave, the
 *  morph. The last face spins back into the dots at `indicator`. */
export const CHAIN: Array<{ face: keyof typeof FACES; via: Variant }> = [
  { face: "grok", via: variant("slingshot-v2") },
  { face: "claude", via: variant("suction-v2") },
  { face: "codex", via: variant("gulp-v2") },
];
/** How long a task is read before the agent becomes the next one. */
export const TASK_DUR = 1.3;
/** The k-th becoming's length, ms. */
export const swapMorphMs = (k: number) => (k === 0 ? 0 : RESET_MS + WAVE_MS) + CHAIN[k].via.morphMs;
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
