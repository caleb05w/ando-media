"use client";

import { useMemo, useState } from "react";

import "./world-crowd.css";

// The world bubble — round AND even, both measured, now sized to
// order: the head count is bench furniture, and the whole solve runs
// per count (memoised — the geometry is deterministic per n).
//
// Rim-first: the circle's radius comes from the total area the crowd
// needs; a subset of discs chains around it with a deterministic
// inward WOBBLE (roundness lands in the 95–97 band — never a sterile
// 100), the rest pack inside by tangency with the circle as a hard
// wall, relaxation spreads the slack evenly, and up to three patch
// discs may join to buy out the worst pockets.
//
// Size rule: at least 30% at exactly 1x, at least 35% in 1–1.3, the
// rest 1.3–1.5.

const S = 64; // 1x, in layout units
const DEFAULT_N = 31;
const MIN_N = 12;
const MAX_N = 60;

const round = (n: number) => Math.round(n * 10) / 10;

// The size budget for n heads: ≥30% at 1x, ≥35% across 1.1–1.3, the
// rest across 1.38–1.5 leaning on 1.38.
function sizeBudget(n: number): number[] {
  const c1 = Math.max(1, Math.round(n * 0.32));
  const b2 = Math.max(1, Math.round(n * 0.35));
  const b3 = Math.max(0, n - c1 - b2);
  const sizes: number[] = [];
  for (let i = 0; i < c1; i++) sizes.push(1);
  const mid = [1.1, 1.2, 1.3];
  for (let i = 0; i < b2; i++) sizes.push(mid[i % 3]);
  const top = [1.38, 1.5, 1.38];
  for (let i = 0; i < b3; i++) sizes.push(top[i % 3]);
  return sizes.map((s) => round(S * s)).sort((a, b) => b - a);
}

const TOL = S * 0.12; // interior: how far past the snuggest option a bigger size may reach

type Disc = { x: number; y: number; size: number };

// The best interior resting spot for one size: tangent to a pair of
// placed discs at exactly gap, clear of everyone, outer edge closest
// to the centre — and never past the wall.
function bestSpot(placed: Disc[], size: number, gap: number, wallR: number) {
  let best: { x: number; y: number; edge: number } | null = null;
  for (let j = 0; j < placed.length; j++) {
    for (let k = j + 1; k < placed.length; k++) {
      const A = placed[j];
      const B = placed[k];
      const ra = (size + A.size) / 2 + gap;
      const rb = (size + B.size) / 2 + gap;
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const d2 = dx * dx + dy * dy;
      const d = Math.sqrt(d2);
      if (d === 0 || d > ra + rb || d < Math.abs(ra - rb)) continue;
      const a = (ra * ra - rb * rb + d2) / (2 * d);
      const h2 = ra * ra - a * a;
      if (h2 < 0) continue;
      const h = Math.sqrt(h2);
      const mx = A.x + (a * dx) / d;
      const my = A.y + (a * dy) / d;
      for (const side of [1, -1]) {
        const px = mx + (side * h * dy) / d;
        const py = my - (side * h * dx) / d;
        const edge = Math.hypot(px, py) + size / 2;
        if (edge > wallR + 0.5) continue;
        let clear = true;
        for (const m of placed) {
          const need = (size + m.size) / 2 + gap - 0.5;
          const ex = px - m.x;
          const ey = py - m.y;
          if (ex * ex + ey * ey < need * need) {
            clear = false;
            break;
          }
        }
        if (!clear) continue;
        if (!best || edge < best.edge) best = { x: px, y: py, edge };
      }
    }
  }
  return best;
}

// The angle a neighbouring rim pair subtends: both centres at R minus
// their own radius, centre distance pinned to gap-exact tangency.
function rimStep(R: number, a: number, b: number, gap: number) {
  const ra = R - a / 2;
  const rb = R - b / 2;
  const c = (a + b) / 2 + gap;
  const cos = (ra * ra + rb * rb - c * c) / (2 * ra * rb);
  if (cos < -1 || cos > 1) return Number.NaN;
  return Math.acos(cos);
}

// The uniform rim gap at which the whole chain closes around R.
function solveRimGap(sizes: number[], R: number, gap: number): number {
  const total = (g: number) => {
    let sum = 0;
    for (let i = 0; i < sizes.length; i++) {
      const t = rimStep(R, sizes[i], sizes[(i + 1) % sizes.length], g);
      if (Number.isNaN(t)) return Number.NaN;
      sum += t;
    }
    return sum;
  };
  let lo = gap;
  let hi = gap * 8;
  if (Number.isNaN(total(lo)) || total(lo) > Math.PI * 2) return Number.NaN; // overfull
  if (total(hi) < Math.PI * 2) return Number.NaN; // sparse even wide open
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    const t = total(mid);
    if (Number.isNaN(t) || t > Math.PI * 2) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

// The wobble: each rim disc tucks a deterministic step inside the
// circle — round from afar, breathing up close.
const WOBBLE = 32;
function placeRim(sizes: number[], R: number, gap: number): Disc[] {
  const discs: Disc[] = [];
  let th = -Math.PI / 2;
  for (let i = 0; i < sizes.length; i++) {
    const z = sizes[i];
    const wob = (((i * 53) % 17) / 17) * WOBBLE;
    const r = R - z / 2 - wob;
    discs.push({ x: round(Math.cos(th) * r), y: round(Math.sin(th) * r), size: z });
    th += rimStep(R, z, sizes[(i + 1) % sizes.length], gap);
  }
  return discs;
}

// The compactor: walk the interior outermost-first, stepping each
// disc toward the middle while every clearance still holds.
function compact(discs: Disc[], nRim: number, g: number): Disc[] {
  const out = discs.map((d) => ({ ...d }));
  for (let sweep = 0; sweep < 60; sweep++) {
    let moved = false;
    const order = out
      .map((d, i) => ({ i, dist: Math.hypot(d.x, d.y) }))
      .filter((o) => o.i >= nRim)
      .sort((a, b) => b.dist - a.dist)
      .map((o) => o.i);
    for (const i of order) {
      const d = out[i];
      const len = Math.hypot(d.x, d.y);
      if (len < 3) continue;
      const nx = d.x - (d.x / len) * 3;
      const ny = d.y - (d.y / len) * 3;
      let ok = true;
      for (let j = 0; j < out.length; j++) {
        if (j === i) continue;
        const need = (d.size + out[j].size) / 2 + g - 0.5;
        if (Math.hypot(nx - out[j].x, ny - out[j].y) < need) {
          ok = false;
          break;
        }
      }
      if (ok) {
        d.x = round(nx);
        d.y = round(ny);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return out;
}

// The evener: interior discs repel to a trial gap gi (rim and wall
// immovable); the largest settling gi is the crowd breathing evenly.
function relax(discs: Disc[], nRim: number, R: number, gi: number): Disc[] | null {
  const out = discs.map((d) => ({ ...d }));
  const DAMP = 0.6;
  for (let iter = 0; iter < 420; iter++) {
    let worst = 0;
    for (let i = nRim; i < out.length; i++) {
      const a = out[i];
      for (let j = 0; j < out.length; j++) {
        if (i === j) continue;
        const b = out[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const min = (a.size + b.size) / 2 + gi;
        if (dist < min) {
          const deficit = min - dist;
          if (deficit > worst) worst = deficit;
          const push = (j < nRim ? deficit : deficit / 2) * DAMP;
          a.x += (dx / dist) * push;
          a.y += (dy / dist) * push;
          if (j >= nRim) {
            b.x -= (dx / dist) * (deficit / 2) * DAMP;
            b.y -= (dy / dist) * (deficit / 2) * DAMP;
          }
        }
      }
      const centreDist = Math.hypot(a.x, a.y);
      const edge = centreDist + a.size / 2;
      if (edge > R && centreDist > 0) {
        if (edge - R > worst) worst = edge - R;
        const shrink = (centreDist - (edge - R)) / centreDist;
        a.x *= shrink;
        a.y *= shrink;
      }
    }
    if (worst < 0.5) return out;
  }
  return null;
}

function relaxToFill(discs: Disc[], nRim: number, R: number, g: number): { discs: Disc[]; gi: number } {
  let settled = discs;
  let lo = g;
  let hi = g * 3;
  for (let it = 0; it < 9; it++) {
    const mid = (lo + hi) / 2;
    const trial = relax(discs, nRim, R, mid);
    if (trial) {
      settled = trial;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return { discs: settled.map((d) => ({ x: round(d.x), y: round(d.y), size: d.size })), gi: lo };
}

// The biggest empty pocket anywhere inside the wall.
function worstVoid(discs: Disc[], R: number) {
  let wx = 0;
  let wy = 0;
  let wr = 0;
  const step = 8;
  for (let gx = -R; gx <= R; gx += step) {
    for (let gy = -R; gy <= R; gy += step) {
      const fromCentre = Math.hypot(gx, gy);
      if (fromCentre > R - 4) continue;
      let empty = R - fromCentre;
      for (const d of discs) {
        const gap2 = Math.hypot(gx - d.x, gy - d.y) - d.size / 2;
        if (gap2 < empty) empty = gap2;
        if (empty <= wr) break;
      }
      if (empty > wr) {
        wr = empty;
        wx = gx;
        wy = gy;
      }
    }
  }
  return { wx, wy, wr };
}

// The void-filler: drag the nearest interior disc into the worst
// pocket while the relaxation keeps settling and the pockets shrink.
function nudgeVoids(discs: Disc[], nRim: number, R: number, gi: number): Disc[] {
  let cur = discs;
  let curWorst = worstVoid(cur, R).wr;
  for (let pass = 0; pass < 10; pass++) {
    const { wx, wy, wr } = worstVoid(cur, R);
    if (wr * 2 < gi * 1.6) break;
    let nearest = -1;
    let nd = Number.POSITIVE_INFINITY;
    for (let i = nRim; i < cur.length; i++) {
      const dd = Math.hypot(cur[i].x - wx, cur[i].y - wy) - cur[i].size / 2;
      if (dd < nd) {
        nd = dd;
        nearest = i;
      }
    }
    if (nearest < 0) break;
    const trial = cur.map((d) => ({ ...d }));
    trial[nearest].x += (wx - trial[nearest].x) * 0.45;
    trial[nearest].y += (wy - trial[nearest].y) * 0.45;
    const settled = relax(trial, nRim, R, gi);
    if (!settled) break;
    const next = settled.map((d) => ({ x: round(d.x), y: round(d.y), size: d.size }));
    const nextWorst = worstVoid(next, R).wr;
    if (nextWorst >= curWorst - 0.3) break;
    cur = next;
    curWorst = nextWorst;
  }
  return cur;
}

// One full build for a rim of m discs from the given size budget.
function build(
  sizes: number[],
  m: number,
  phase: number,
  eta: number,
  g: number,
): { discs: Disc[]; R: number; nRim: number } | null {
  const rimIdx = new Set<number>();
  for (let k = 0; k < m; k++) rimIdx.add(Math.min(sizes.length - 1, Math.floor((k + phase / 2) * (sizes.length / m))));
  if (rimIdx.size < m) return null;
  const rimPool = [...rimIdx].map((i) => sizes[i]).sort((a, b) => b - a);
  const rimOrder: number[] = [];
  for (let k = 0; k < Math.ceil(m / 2); k++) {
    rimOrder.push(rimPool[k]);
    if (m - 1 - k > k) rimOrder.push(rimPool[m - 1 - k]);
  }
  const R = Math.sqrt(sizes.reduce((a, z) => a + (z / 2 + g / 2) ** 2, 0) / eta);
  const rimGap = solveRimGap(rimOrder, R, g);
  if (!Number.isFinite(rimGap) || rimGap > g * 3) return null;
  const discs = placeRim(rimOrder, R, rimGap);

  const interior = sizes.filter((_, i) => !rimIdx.has(i));
  const seed = interior.shift();
  if (seed !== undefined) discs.push({ x: 0, y: 0, size: seed });
  let retries = 2;
  while (interior.length > 0) {
    const options: { at: number; x: number; y: number; edge: number }[] = [];
    const seen = new Set<number>();
    for (let at = 0; at < interior.length; at++) {
      if (seen.has(interior[at])) continue;
      seen.add(interior[at]);
      const spot = bestSpot(discs, interior[at], g, R);
      if (spot) options.push({ at, ...spot });
    }
    if (options.length === 0) {
      if (retries-- <= 0) return null;
      const squeezed = compact(discs, m, g);
      discs.length = 0;
      discs.push(...squeezed);
      continue;
    }
    const snuggest = Math.min(...options.map((o) => o.edge));
    const pick = options
      .filter((o) => o.edge <= snuggest + TOL)
      .sort((a, b) => interior[b.at] - interior[a.at])[0];
    discs.push({ x: round(pick.x), y: round(pick.y), size: interior[pick.at] });
    interior.splice(pick.at, 1);
  }
  return { discs, R, nRim: m };
}

// Circle accuracy: 16 angular sectors, each sector's outermost edge,
// scored on how evenly the rim radii agree.
function fitOf(discs: Disc[]) {
  const SECTORS = 16;
  const rims: number[] = Array(SECTORS).fill(0);
  for (const d of discs) {
    const sector = Math.floor(((Math.atan2(d.y, d.x) + Math.PI) / (Math.PI * 2)) * SECTORS) % SECTORS;
    const rim = Math.hypot(d.x, d.y) + d.size / 2;
    if (rim > rims[sector]) rims[sector] = rim;
  }
  const vals = rims.filter((r) => r > 0);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
  return (1 - sd / mean) * 100;
}

// Spacing honesty, measured against the BASE gap's ideal pocket so
// dense builds outrank sparse ones that grade themselves kindly.
function voidsOf(discs: Disc[], R: number, g: number) {
  const { wr } = worstVoid(discs, R);
  const avgHalf = (S * 1.2) / 2;
  const idealPocket = 2 * (0.155 * avgHalf + 0.577 * g);
  return { worst: wr * 2, spacing: Math.min(100, (idealPocket / Math.max(wr * 2, 0.01)) * 100) };
}

// The patch allowance: up to three discs may join to buy out the
// worst pockets — each must settle physically and raise the measured
// spacing to stick.
const PATCH_LIMIT = 3;
function patchVoids(discs: Disc[], nRim: number, R: number, g: number): Disc[] {
  let cur = discs;
  let curSpacing = voidsOf(cur, R, g).spacing;
  for (let p = 0; p < PATCH_LIMIT; p++) {
    const { wx, wy, wr } = worstVoid(cur, R);
    if (wr * 2 < g * 2.2) break;
    let settledIn: Disc[] | null = null;
    for (const step of [1, 1.1, 1.2]) {
      const size = round(S * step);
      const trial = cur.concat([{ x: round(wx), y: round(wy), size }]);
      const settled = relax(trial, nRim, R, g);
      if (settled) {
        settledIn = settled.map((d) => ({ x: round(d.x), y: round(d.y), size: d.size }));
        break;
      }
    }
    if (!settledIn) break;
    const refilled = relaxToFill(settledIn, nRim, R, g);
    const next = nudgeVoids(refilled.discs, nRim, R, refilled.gi);
    const nextSpacing = voidsOf(next, R, g).spacing;
    if (nextSpacing <= curSpacing) break;
    if (fitOf(next) > ROUND_TOO_MUCH + 0.5) break; // a patch must not perfect the circle either
    cur = next;
    curSpacing = nextSpacing;
  }
  return cur;
}

// The full solve for n heads: search gap × density × rim head-count ×
// phase, roundness in the 95–97 band, evenness picking among the
// round, then the patch allowance. Deterministic per n — memoised.
const ROUND_ENOUGH = 95;
const ROUND_TOO_MUCH = 97;
type Solved = { discs: Disc[]; R: number; fit: number; spacing: number };
const CACHE = new Map<number, Solved>();

function solveCrowd(n: number): Solved {
  const hit = CACHE.get(n);
  if (hit) return hit;
  const sizes = sizeBudget(n);
  const mLo = Math.max(6, Math.round(n * 0.45));
  const mHi = Math.max(mLo, Math.round(n * 0.62));
  type Cand = { discs: Disc[]; r: number; fit: number; spacing: number; nRim: number; g: number };
  let best: Cand | null = null;
  let fallback: Cand | null = null; // best build ignoring the roundness band
  for (const g of [10]) {
    for (const eta of [0.9, 0.87, 0.84, 0.8, 0.76, 0.72, 0.68, 0.64]) {
      for (let m = mLo; m <= mHi; m++) {
        for (const phase of [0, 1]) {
          const built = build(sizes, m, phase, eta, g);
          if (!built) continue;
          const filled = relaxToFill(built.discs, built.nRim, built.R, g);
          const discs = nudgeVoids(filled.discs, built.nRim, built.R, filled.gi);
          const fit = fitOf(discs);
          const { spacing } = voidsOf(discs, built.R, g);
          const candidate = { discs, r: built.R, fit, spacing, nRim: built.nRim, g };
          if (!fallback || fit > fallback.fit) fallback = candidate;
          if (fit > ROUND_TOO_MUCH) continue; // too perfect — no life in it
          if (!best) {
            best = candidate;
            continue;
          }
          const bestRound = best.fit >= ROUND_ENOUGH;
          const candRound = fit >= ROUND_ENOUGH;
          if (candRound && !bestRound) best = candidate;
          else if (candRound === bestRound && (candRound ? spacing > best.spacing : fit > best.fit))
            best = candidate;
        }
      }
    }
  }
  const winner = best ?? fallback;
  if (!winner) {
    // nothing at this count builds at all — hand back the nearest
    // solvable neighbour instead of crashing the bench
    return solveCrowd(Math.max(MIN_N, Math.min(MAX_N, n > DEFAULT_N ? n - 1 : n + 1)));
  }
  const patched = patchVoids(winner.discs, winner.nRim, winner.r, winner.g);
  const solved: Solved = {
    discs: patched,
    R: winner.r,
    fit: Math.round(fitOf(patched) * 10) / 10,
    spacing: Math.round(voidsOf(patched, winner.r, winner.g).spacing * 10) / 10,
  };
  CACHE.set(n, solved);
  return solved;
}

// The roster: the disc closest to the middle gets Sara; everyone else
// strides through the pool so repeats never sit shoulder to shoulder.
// Agents sit at the pool's tail so the stride scatters them — no halo.
const POOL = ["oli", "jordan", "alex", "andrew", "felipe", "ryan", "caleb", "aj", "agent-1", "agent-2"];
function rosterFor(discs: Disc[]): string[] {
  const centreIdx = discs.reduce(
    (bi, d, i) => (Math.hypot(d.x, d.y) < Math.hypot(discs[bi].x, discs[bi].y) ? i : bi),
    0,
  );
  return discs.map((_, i) => {
    if (i === centreIdx) return "sara";
    const at = i < centreIdx ? i : i - 1;
    return POOL[(at * 3) % POOL.length];
  });
}

// `bench` keeps the workbench furniture — the dashed wall and the
// measured caption with the heads dial. Production embeds (the duet
// hero) take the crowd bare. `onPick` makes the faces doors: click
// one, and the caller opens that person's profile.
export function WorldCrowd({ bench = true, onPick }: { bench?: boolean; onPick?: (person: string) => void }) {
  const [count, setCount] = useState(DEFAULT_N);
  const { discs, R, fit, spacing } = useMemo(() => solveCrowd(count), [count]);
  const PAD = 10;
  const box = (R + PAD) * 2;
  const pct = (n: number) => `${Math.round((n / box) * 1000) / 10}%`;
  const people = rosterFor(discs);
  const enterDelay = (i: number) =>
    `${Math.round((0.05 + (Math.hypot(discs[i].x, discs[i].y) / R) * 0.35) * 100) / 100}s`;

  return (
    <div>
      <div className="relative mx-auto w-full" style={{ aspectRatio: "1 / 1" }}>
        {bench ? (
          <span
            aria-hidden
            className="absolute rounded-full border border-dashed border-[#d5d9e1]"
            style={{
              left: pct(box / 2 - R),
              top: pct(box / 2 - R),
              width: pct(R * 2),
              height: pct(R * 2),
            }}
          />
        ) : null}
        {discs.map((d, i) => (
          <span
            key={`${count}-${people[i]}-${i}`}
            className={`aw-enter aw-item absolute ${onPick ? "cursor-pointer" : ""}`}
            onClick={onPick ? () => onPick(people[i]) : undefined}
            style={{
              left: pct(d.x - d.size / 2 + box / 2),
              top: pct(d.y - d.size / 2 + box / 2),
              width: pct(d.size),
              animationDelay: enterDelay(i),
            }}
          >
            {/* the stroll — each face walks a small circle around its
                packed spot, its pace, phase, and direction hashed from
                its seat so no two neighbours ever sync up */}
            <span
              className="aw-orbit block"
              style={{
                animationDirection: i % 2 ? "reverse" : "normal",
                ["--aw-orbit-t" as string]: `${11 + (i % 5) * 2.6}s`,
                ["--aw-orbit-d" as string]: `${-(i * 1.7)}s`,
                ["--aw-orbit-r" as string]: `${2 + (i % 3)}px`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/avatars/${people[i]}.png`}
                alt=""
                className="aspect-square w-full max-w-none rounded-full object-cover shadow-[0_0_0_0.5px_rgba(22,25,29,0.08)]"
              />
            </span>
          </span>
        ))}
      </div>
      {/* bench instrumentation — the rules measured, the count dialled */}
      <div
        className={`mt-3 items-center justify-center gap-4 font-mono text-[10px] uppercase leading-4 tracking-[0.08em] text-text-tertiary ${bench ? "flex" : "hidden"}`}
      >
        <span>circle fit · {fit}%</span>
        <span>spacing · {spacing}%</span>
        <label className="flex items-center gap-1.5">
          heads ·
          <input
            className="w-[44px] border-[0.5px] border-border-default bg-white px-1 py-0.5 text-center font-mono text-[10px] text-text-primary outline-none transition-colors ease-fast focus:border-[#242424]"
            max={MAX_N}
            min={MIN_N}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) setCount(Math.max(MIN_N, Math.min(MAX_N, Math.round(v))));
            }}
            type="number"
            value={count}
          />
          {discs.length !== count ? <span>→ {discs.length}</span> : null}
        </label>
      </div>
    </div>
  );
}
