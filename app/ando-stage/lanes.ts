// The stage's lanes — one per beat. Messages and Jam moments are markers;
// typing and the open Jam are bars that run until what ends them (the
// message that lands, the jam-end). Dragging a beat carries every beat
// after it, so spacing survives; stretching a bar pushes what follows.

import type { Lane } from "../../lib/timeline-studio/studio";
import { beatKey, type Beat, type Scene, type Timing } from "./scenes";

const snap = (v: number) => Math.round(v * 100) / 100;
/** A timing the Studio restored from an older take may lack newer beats'
 *  keys; read through this so a missing beat sits at 0 instead of crashing. */
const at = (T: Timing, index: number): number => T[beatKey(index)] ?? 0;

function label(scene: Scene, beat: Beat): string {
  switch (beat.kind) {
    case "mark": return beat.label.toLowerCase();
    case "typing": return `${scene.cast[beat.who].name.split(" ")[0]} typing`;
    case "say": return `${scene.cast[beat.who].name.split(" ")[0]}${beat.thread ? " · thread" : ""}`;
    case "card": return `${scene.cast[beat.who].name.split(" ")[0]} card`;
    case "attach": return `${scene.cast[beat.who].name.split(" ")[0]} file`;
    case "react": return beat.emoji;
    case "agent": return `${scene.cast[beat.who].name} run`;
    case "agent-done": return "run done";
    case "jam-start": return `${scene.cast[beat.participants[0]].name.split(" ")[0]} starts jam`;
    case "jam-join": return "you join";
    case "jam-answer": return "you pick up";
    case "jam-end": return "jam ends";
    case "jam-deploy": return "panel unfolds";
    case "jam-dock": return "panel docks";
    case "cursor": return `cursor → ${beat.to.replace("-", " ")}`;
    case "tab": return `${beat.tab} tab`;
    case "transcript": return `${scene.cast[beat.who].name.split(" ")[0]} says`;
    case "speak": return `${scene.cast[beat.who].name.split(" ")[0]} talking`;
    case "trace": return beat.label.toLowerCase();
    case "trace-done": return "run done";
    case "title": return "title card";
    case "camera": return `camera · ${beat.at.replace("-", " ")}`;
    case "type": return "type card";
    case "logo": return "logo";
  }
}

/** Index of the beat that closes an open one: the next non-reaction beat
 *  for typing, the jam-end for a jam. */
function closerOf(scene: Scene, index: number): number | null {
  const beat = scene.beats[index];
  if (beat.kind === "typing" || beat.kind === "trace" || beat.kind === "transcript" || beat.kind === "speak") return index + 1 < scene.beats.length ? index + 1 : null;
  if (beat.kind === "title" || beat.kind === "type" || beat.kind === "camera" || beat.kind === "logo") return null;
  if (beat.kind === "jam-start") {
    const end = scene.beats.findIndex((b, i) => i > index && (b.kind === "jam-end" || (beat.ring && b.kind === "jam-answer")));
    return end === -1 ? null : end;
  }
  return null;
}

export function lanesFor(scene: Scene): Lane<Timing>[] {
  // Moving beat i moves everything from i on; the family keeps its shape.
  const shiftFrom = (T: Timing, from: number, dt: number): Partial<Timing> => {
    const floor = from > 0 ? at(T, from - 1) : 0;
    const applied = Math.max(dt, floor - at(T, from));
    const out: Partial<Timing> = {};
    for (let i = from; i < scene.beats.length; i += 1) out[beatKey(i)] = snap(at(T, i) + applied);
    return out;
  };
  return scene.beats.map((beat, index) => {
    const closer = closerOf(scene, index);
    const bar = closer != null;
    const lane: Lane<Timing> = {
      key: beatKey(index),
      label: label(scene, beat),
      kind: bar ? "bar" : "marker",
      start: (T) => at(T, index),
      editStart: (T, dt) => shiftFrom(T, index, dt),
      title: (T) => `${label(scene, beat)} at ${at(T, index).toFixed(2)}s` + (bar ? ` for ${(at(T, closer) - at(T, index)).toFixed(2)}s` : ""),
      targets: [`[data-beat="${beatKey(index)}"]`],
      tone: beat.kind === "say" || beat.kind === "jam-start" ? "ink" : "soft",
    };
    if (bar) {
      lane.length = (T) => Math.max(0.05, at(T, closer) - at(T, index));
      // Stretching an open beat pushes its closer and everything after it.
      lane.editLength = (T, dt) => shiftFrom(T, closer, Math.max(dt, at(T, index) + 0.05 - at(T, closer)));
      lane.caption = (T) => `${(at(T, closer) - at(T, index)).toFixed(2)}s`;
    }
    return lane;
  });
}
