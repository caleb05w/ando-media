// The mark's door — the Ando symbol's notch and tail hinged open and shut.
//
// Exact brand geometry, ported verbatim from the "Ando — Motion playground"
// (its bundled src/logo-door/geometry.ts + source.ts): three poses of the
// one path — closed, mid-opening, open — with the same topology, blended by
// monotone cubic Hermite interpolation per coordinate, and a corner
// constraint so the rounded corners never fold. `doorPathAtProgress(0)` is
// the plain rounded rectangle, `1` the mark.

// src/logo-door/source.ts
const SOURCE_CLOSED_PATH = "M41.6376 2.959e-05C44.4659 2.959e-05 46.7588 2.29271 46.7589 5.12096V30.7271C46.7589 33.5555 44.466 35.8484 41.6376 35.8484H33.2145C33.3818 35.6791 32.9764 35.8484 33.2145 35.8484L13.9182 36.0419C13.6384 36.325 13.156 36.127 13.156 35.729V16.5398C13.156 16.081 13.3584 15.6453 13.7088 15.3492L31.3438 15.5863L33.2145 15.5893C33.809 15.0627 33.0065 15.6492 32.2392 15.5893L32.1638 15.5863H14.258C13.6432 15.5863 13.1447 16.0848 13.1446 16.6997V34.9578C13.1446 35.4497 12.7459 35.8484 12.254 35.8484H5.12131C2.29294 35.8484 0 33.5555 0 30.7271V5.12096C0.000127211 2.29271 2.29302 2.959e-05 5.12131 2.959e-05H41.6376Z";
const SOURCE_OPENING_PATH = "M41.6376 2.959e-05C44.4659 2.959e-05 46.7588 2.29271 46.7589 5.12096V30.7271C46.7589 33.5555 44.466 35.8484 41.6376 35.8484H33.2145C33.3818 35.6791 32.9764 35.8484 33.2145 35.8484L15.0202 41.8527C14.7404 42.1358 14.258 41.9377 14.258 41.5398V22.3506C14.258 21.8918 14.4604 21.4561 14.8108 21.16L31.3438 16.5398L33.5772 15.8551C34.1717 15.3286 33.0065 15.6492 32.2392 15.5893L32.1638 15.5863H14.258C13.6432 15.5863 13.1447 16.0848 13.1446 16.6997V34.9578C13.1446 35.4497 12.7459 35.8484 12.254 35.8484H5.12131C2.29294 35.8484 0 33.5555 0 30.7271V5.12096C0.000127211 2.29271 2.29302 2.959e-05 5.12131 2.959e-05H41.6376Z";
export const SOURCE_OPEN_PATH = "M41.6376 2.959e-05C44.4659 2.959e-05 46.7588 2.29271 46.7589 5.12096V30.7271C46.7589 33.5555 44.466 35.8484 41.6376 35.8484H33.2145C32.9764 35.8484 32.7484 35.9438 32.5811 36.1131L19.9592 48.8824C19.6794 49.1655 19.197 48.9674 19.197 48.5695V29.3802C19.197 28.9215 19.3994 28.4858 19.7498 28.1897L31.4161 18.3283L32.7541 17.1437C33.3486 16.6171 33.0065 15.6492 32.2392 15.5893L32.1638 15.5863H14.258C13.6432 15.5863 13.1447 16.0848 13.1446 16.6997V34.9578C13.1446 35.4497 12.7459 35.8484 12.254 35.8484H5.12131C2.29294 35.8484 0 33.5555 0 30.7271V5.12096C0.000127211 2.29271 2.29302 2.959e-05 5.12131 2.959e-05H41.6376Z";

// src/logo-door/geometry.ts
const NUMBER = /[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi;
export const OPENING_PROGRESS = 0.45;
export const OUTER_CLOSED_PATH = SOURCE_OPEN_PATH.replace(/H33\.2145.*?H5\.12131/, "H5.12131");
function constrainCorners(path: string): string {
  const segments = Array.from(path.matchAll(/([MLHVCZ])([^MLHVCZ]*)/g), (match) => ({
    command: match[1],
    values: Array.from(match[2].matchAll(NUMBER), (number) => Number(number[0]))
  }));
  for (const index of [7, 12]) {
    const incoming = segments[index - 2].values.slice(-2);
    const start = segments[index - 1].values;
    const values = segments[index].values;
    const end = values.slice(-2);
    if (index === 7) values[0] = Math.max(Math.min(start[0], end[0]), Math.min(Math.max(start[0], end[0]), values[0]));
    const dx = start[0] - incoming[0];
    const dy = start[1] - incoming[1];
    const side = (x: number, y: number) => dx * (y - incoming[1]) - dy * (x - incoming[0]);
    const endSide = side(end[0], end[1]);
    if (Math.abs(dx) < 1e-12 || Math.abs(endSide) < 1e-12) continue;
    for (const control of [0, 2]) {
      if (side(values[control], values[control + 1]) * endSide < -1e-12) {
        values[control + 1] = incoming[1] + dy * (values[control] - incoming[0]) / dx;
      }
    }
  }
  return segments.map(({ command, values }) => command + values.join(" ")).join("");
}
export const CLEAN_CLOSED_PATH = SOURCE_CLOSED_PATH.replace(
  /H33\.2145.*?H14\.258/,
  "H33.2145C33.2145 35.8484 33.2145 35.8484 33.2145 35.8484L12.254 35.8484C12.7459 35.8484 13.1446 35.4497 13.1446 34.9578V16.6997C13.1447 16.0848 13.6432 15.5863 14.258 15.5863L31.3438 15.5863L32.1638 15.5863C32.1638 15.5863 32.1638 15.5863 32.1638 15.5863L32.1638 15.5863H14.258"
);
const openingHinge = [32.9764, 35.8484, 32.7484, 35.9438, 32.5811, 36.1131].map((value: number, i: number) => {
  const start = i % 2 === 0 ? 33.2145 : 35.8484;
  return start + (value - start) * OPENING_PROGRESS;
}).join(" ");
export const CLEAN_OPENING_PATH = constrainCorners(SOURCE_OPENING_PATH.replace(
  /H33\.2145C[^L]+L/,
  `H33.2145C${openingHinge}L`
));
const poses = [CLEAN_CLOSED_PATH, CLEAN_OPENING_PATH, SOURCE_OPEN_PATH];
const coordinates = poses.map((path) => Array.from(path.matchAll(NUMBER), (match) => Number(match[0])));
const structure = (path: string) => path.replace(NUMBER, "#");
if (!poses.every((path) => structure(path) === structure(SOURCE_OPEN_PATH))) {
  throw new Error("Door poses must share the original SVG path topology.");
}
const h0 = OPENING_PROGRESS;
const h1 = 1 - OPENING_PROGRESS;
const curves = coordinates[0].map((y0: number, i: number) => {
  const y1 = coordinates[1][i];
  const y2 = coordinates[2][i];
  const d0 = (y1 - y0) / h0;
  const d1 = (y2 - y1) / h1;
  const interior = d0 * d1 <= 0 ? 0 : 3 * (h0 + h1) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
  const endpoint = (near: number, far: number, a: number, b: number) => {
    const slope = ((2 * a + b) * near - a * far) / (a + b);
    if (slope * near <= 0) return 0;
    return near * far < 0 && Math.abs(slope) > Math.abs(3 * near) ? 3 * near : slope;
  };
  return { y0, y1, y2, m0: endpoint(d0, d1, h0, h1), m1: interior, m2: endpoint(d1, d0, h1, h0) };
});
export function doorPathAtProgress(value: number): string {
  const p = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  if (p === 0) return OUTER_CLOSED_PATH;
  if (p === 1) return SOURCE_OPEN_PATH;
  if (p === OPENING_PROGRESS) return CLEAN_OPENING_PATH;
  const first = p < OPENING_PROGRESS;
  const span = first ? h0 : h1;
  const t = first ? p / span : (p - h0) / span;
  const t2 = t * t;
  const t3 = t2 * t;
  let index = 0;
  return constrainCorners(SOURCE_OPEN_PATH.replace(NUMBER, () => {
    const { y0, y1, y2, m0, m1, m2 } = curves[index++];
    if (y0 === y1 && y1 === y2) return String(y0);
    const start = first ? y0 : y1;
    const end = first ? y1 : y2;
    const slopeStart = first ? m0 : m1;
    const slopeEnd = first ? m1 : m2;
    const result = (2 * t3 - 3 * t2 + 1) * start + (t3 - 2 * t2 + t) * span * slopeStart + (-2 * t3 + 3 * t2) * end + (t3 - t2) * span * slopeEnd;
    return result.toFixed(7);
  }));
}

/** The lockup's viewBoxes (the playground's): the symbol alone, and with the wordmark. */
export const SYMBOL_VIEWBOX = "0 0 46.7589 49.0156";
export const LOCKUP_VIEWBOX = "0 0 214.846 49.0156";
/** The wordmark — A N D O — as drawn beside the mark in the lockup. */
export const WORDMARK_PATHS: readonly string[] = [
  "M195.946 39.6087C184.553 39.6087 176.994 31.7296 176.994 19.8044C176.994 7.87917 184.553 2.959e-05 195.946 2.959e-05C207.286 2.959e-05 214.846 7.87917 214.846 19.8044C214.846 31.7296 207.286 39.6087 195.946 39.6087ZM195.946 33.2734C202.867 33.2734 207.392 28.1626 207.392 19.8044C207.392 11.4461 202.867 6.33529 195.946 6.33529C189.025 6.33529 184.5 11.4461 184.5 19.8044C184.5 28.1626 189.025 33.2734 195.946 33.2734Z",
  "M154.963 0.851831C167.314 0.851831 173.969 8.25184 173.969 19.8044C173.969 31.3569 167.314 38.7569 154.963 38.7569H140.482V0.851831H154.963ZM147.67 32.5814H154.857C162.203 32.5814 166.516 28.2159 166.516 19.8044C166.516 11.3928 162.203 7.02738 154.857 7.02738H147.67V32.5814Z",
  "M127.345 10.754V0.851831H134.266V38.7569H126.28L115.739 21.8806C113.343 18.1008 110.895 14.1612 108.978 10.4878C109.191 17.1957 109.191 23.2648 109.191 28.8547V38.7569H102.27V0.851831H110.256L120.85 17.7281C122.979 21.1885 125.641 25.554 127.558 29.1209C127.398 22.413 127.345 16.3439 127.345 10.754Z",
  "M99.4975 38.7569H91.8845L88.9032 30.3986H72.2931L69.3651 38.7569H61.9651L76.3924 0.851831H84.8039L99.4975 38.7569ZM75.9133 20.177L74.4759 24.2763H86.7205L85.2298 20.177C83.8989 16.7166 82.0888 11.659 80.5449 7.18709C79.001 11.659 77.191 16.7166 75.9133 20.177Z",
];

/** The playground's opening: a 0.1s hold on the closed rectangle, then the
 *  door swings open over 1.3s on cubic-bezier(0.16, 1, 0.3, 1) and rests. */
export const DOOR_HOLD = 0.1;
export const DOOR_OPEN = 1.3;
function bezier(x: number, x1: number, y1: number, x2: number, y2: number): number {
  let lo = 0;
  let hi = 1;
  let t = x;
  for (let i = 0; i < 20; i += 1) {
    t = (lo + hi) / 2;
    const a = 1 - t;
    const xt = 3 * a * a * t * x1 + 3 * a * t * t * x2 + t * t * t;
    if (xt < x) lo = t;
    else hi = t;
  }
  const a = 1 - t;
  return 3 * a * a * t * y1 + 3 * a * t * t * y2 + t * t * t;
}
export function doorProgressAt(t: number): number {
  if (t <= DOOR_HOLD) return 0;
  if (t < DOOR_HOLD + DOOR_OPEN) return bezier((t - DOOR_HOLD) / DOOR_OPEN, 0.16, 1, 0.3, 1);
  return 1;
}
