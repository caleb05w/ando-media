// The agents the film's agent becomes, and when. Ando runs other people's
// agents too, so the trace's tasks are shared out: Tadao reads the jam,
// then becomes Grok, Claude, Codex for a task each, then Tadao again —
// who takes the reply to the composer as the typing indicator. Each
// becoming is a different one of /the-library's v2 typing indicators —
// never Orbit v2, which is kept for the real typing indicator at the end
// — run as the library runs it: the reset (the face snuffs out to a dot),
// one typing wave, the morph (the dots become the next face).

import { AVATAR, RESET_MS, VARIANTS, WAVE_MS, type Variant } from "../agent-typing-experience/variants";
import { INDICATOR } from "./stream";
import type { Timing } from "./timing";

export const FACES = { tadao: INDICATOR.avatar ?? AVATAR, grok: "/agents/grok.svg", claude: "/agents/claude.png", codex: "/agents/codex.png" } as const;
/** The faces that are a mark, not a portrait: no disc under them once they
 *  have landed. Grok's eyes are cutouts, so it counts. */
export const BARE: ReadonlySet<string> = new Set([FACES.grok, FACES.claude, FACES.codex]);
const variant = (key: string): Variant => VARIANTS.find((v) => v.key === key) ?? INDICATOR;
/** The becomings, in order: who the agent becomes, and by which indicator. */
export const CHAIN: Array<{ face: keyof typeof FACES; via: Variant }> = [
  { face: "grok", via: variant("slingshot-v2") },
  { face: "claude", via: variant("suction-v2") },
  { face: "codex", via: variant("gulp-v2") },
  { face: "tadao", via: variant("rhythm-v2") },
];
/** How long a task is read before the agent becomes the next one. */
export const TASK_DUR = 1.3;
/** The k-th becoming: reset, a wave, its variant's morph. */
export const swapMorphMs = (k: number) => RESET_MS + WAVE_MS + CHAIN[k].via.morphMs;
/** When the k-th task's line rolls into the slot: the first at `trace`, each next as its agent's face lands. */
export function taskAt(T: Timing, k: number): number {
  return k === 0 ? T.trace + 0.2 : faceAt(T, k - 1) - 0.25;
}
/** When the k-th becoming starts: once its task has been read. */
export function becomingAt(T: Timing, k: number): number {
  return taskAt(T, k) + TASK_DUR;
}
/** When the k-th becoming's face has landed. */
export function faceAt(T: Timing, k: number): number {
  return becomingAt(T, k) + swapMorphMs(k) / 1000;
}
