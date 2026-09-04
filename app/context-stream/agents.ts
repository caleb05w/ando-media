// The agents the film's agent becomes, and when. Ando runs other people's
// agents: the agent is born as the typing dots, becomes Grok, Claude and
// Codex for a task each, and Codex spins back into the dots that the
// composer picks up. The dots become the first face by one of /the-library's
// v2 typing indicators' morphs (never Orbit v2, which is kept for the real
// typing indicator at the end); face to face is a change in the typing
// indicator's own language — the mark comes apart
// into the typing dots by its own arrival played backwards, the dots type
// for one wave, and the next mark gathers out of them by its own arrival,
// the dots turning its colour on the way (swap.ts).

import { VARIANTS, WAVE_MS, type Variant } from "../agent-typing-experience/variants";
import { INDICATOR } from "./stream";
import type { Timing } from "./timing";

/** The marks the agent wears in the showcase. In the room, Grok posts as Sara's Grok — transcript.tsx. */
export const FACES = { grok: "/agents/grok.svg", claude: "/agents/claude.png", codex: "/agents/codex.png" } as const;
/** How much bigger than the disc's own fit a mark draws: Codex's cloud
 *  fills only 55% of its image (Claude's star 71%, Grok 89%), so it is
 *  brought up to the others' footprint. */
export const FACE_SCALE: Partial<Record<keyof typeof FACES, number>> = { codex: 1.3 };
export type FaceKey = keyof typeof FACES;
/** The faces that are a mark, not a portrait: no disc under them once they
 *  have landed. Grok's eyes are cutouts, so it counts. */
export const BARE: ReadonlySet<string> = new Set([FACES.grok, FACES.claude, FACES.codex]);
const variant = (key: string): Variant => VARIANTS.find((v) => v.key === key) ?? INDICATOR;
/** The becomings, in order: who the agent becomes. The first is the morph
 *  from the typing dots the agent was born as; each next is a change of
 *  face over `swapMorphMs`. The last face spins back into the dots at
 *  `indicator`. */
export const CHAIN: Array<{ face: FaceKey }> = [{ face: "grok" }, { face: "claude" }, { face: "codex" }];
/** The morph each face arrives by. Grok's is the birth, from the typing
 *  dots — Slingshot v2. Claude and Codex arrive out of the typing dots the
 *  mark before them came apart into: the library's quicker arrivals, so a
 *  change of face stays near two seconds at the library's own speed. */
export const ARRIVE: Record<FaceKey, Variant> = { grok: variant("slingshot-v2"), claude: variant("suction-v3"), codex: variant("gulp-v3") };
export const FIRST_MORPH: Variant = ARRIVE.grok;
/** Between faces the dots type for one wave — the shortest run that lets
 *  both morphs meet the wave on its beat (every morph's first frame is the
 *  wave's at phase 0). */
export const TYPING_BETWEEN = WAVE_MS;
/** How long a task is read before the agent becomes the next one. */
export const TASK_DUR = 1.3;
/** The k-th becoming's length, ms: the birth morph; or the old mark's
 *  arrival backwards, the typing between, the new mark's arrival. */
export const swapMorphMs = (k: number) =>
  k === 0 ? FIRST_MORPH.morphMs : ARRIVE[CHAIN[k - 1].face].morphMs + TYPING_BETWEEN + ARRIVE[CHAIN[k].face].morphMs;
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
