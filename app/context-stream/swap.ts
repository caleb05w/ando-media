// A change of face — Grok to Claude, Claude to Codex — in the typing
// indicator's own language. The marks are never broken up:
//
//   leave    the mark's own arrival plays backwards — the face spins out,
//            the disc shrinks to the resting dot, the side dots fly back
//            to their places;
//   typing   the three dots wave, one wave;
//   arrive   the dots gather into the next mark by its own morph, the
//            dots and the disc turning the mark's colour on the way (the
//            library's host tint).
//
// Every seam is exact: each morph's first frame is the wave's at phase 0,
// and the typing between is a whole wave.

import { typingFrame, type Frame } from "../agent-typing-experience/variants";
import { ARRIVE, FACES, TYPING_BETWEEN, type FaceKey } from "./agents";

/* ── Colour ─────────────────────────────────────────────────────────── */
type Ink = readonly number[];
/** Each mark's ink until its image has been read. */
const INKS: Record<FaceKey, Ink> = { grok: [26, 24, 23], claude: [217, 151, 123], codex: [124, 58, 237] };
const inks: Partial<Record<FaceKey, Ink>> = {};
let reading = false;
const noop = () => {};
/** Read each mark's ink off its image — the mean of its opaque pixels,
 *  at the size it shows. Once; call it when the scene mounts. */
export function readInks() {
  if (reading || typeof window === "undefined") return;
  reading = true;
  for (const face of Object.keys(FACES) as FaceKey[]) {
    const img = new Image();
    img.onload = () => {
      const ink = sampleInk(img);
      if (ink) inks[face] = ink;
    };
    img.src = FACES[face];
    img.decode().catch(noop);
  }
}
const inkOf = (face: FaceKey): Ink => inks[face] ?? INKS[face];
function sampleInk(img: HTMLImageElement): Ink | null {
  const size = 120;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.drawImage(img, 0, 0, size, size);
  const data = g.getImageData(0, 0, size, size).data;
  const sum = [0, 0, 0];
  let n = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      if (data[i + 3] < 120) continue;
      // Only what shows: the Stage clips the image to the disc.
      const dx = x / size - 0.5;
      const dy = y / size - 0.5;
      if (dx * dx + dy * dy > 0.25) continue;
      sum[0] += data[i];
      sum[1] += data[i + 1];
      sum[2] += data[i + 2];
      n += 1;
    }
  }
  return n === 0 ? null : sum.map((v) => v / n);
}
const clamp01 = (p: number) => Math.min(1, Math.max(0, p));
const parseRgb = (fill: string): number[] => (fill.match(/\d+/g) ?? []).map(Number);
const rgb = (c: Ink) => `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`;
const mix = (a: Ink, b: Ink, p: number) => a.map((v, i) => v + (b[i] - v) * p);
/** How far into a morph the dots are the mark's colour: the library's host
 *  tint — on the move by 8% of the morph, fully the colour by 35%. */
const TINT = { from: 0.08, span: 0.27 } as const;
/** The frame with its dots and disc turned `p` of the way to `ink`. */
function tinted(f: Frame, ink: Ink, p: number): Frame {
  if (p <= 0) return f;
  const tint = (fill: string) => rgb(mix(parseRgb(fill), ink, p));
  return { ...f, sats: f.sats.map((d) => ({ ...d, fill: tint(d.fill) })), blob: { ...f.blob, fill: tint(f.blob.fill) } };
}

/* ── The change ─────────────────────────────────────────────────────── */
/** The agent `ms` into the change from `prev` to `next`: the frame it
 *  shows and the face it wears (a FACES path). Past the change it holds
 *  the new mark, landed. */
export function swapLook(ms: number, prev: FaceKey, next: FaceKey): { frame: Frame; face: string } {
  const leave = ARRIVE[prev];
  const arrive = ARRIVE[next];
  const tintP = (v: typeof leave, t: number) => clamp01((t / v.morphMs - TINT.from) / TINT.span);
  if (ms < leave.morphMs) {
    const t = leave.morphMs - ms;
    return { frame: tinted(leave.morph(t), inkOf(prev), tintP(leave, t)), face: FACES[prev] };
  }
  const typed = ms - leave.morphMs;
  if (typed < TYPING_BETWEEN) return { frame: typingFrame(typed, 1), face: FACES[prev] };
  const t = Math.min(typed - TYPING_BETWEEN, arrive.morphMs);
  return { frame: tinted(arrive.morph(t), inkOf(next), tintP(arrive, t)), face: FACES[next] };
}
