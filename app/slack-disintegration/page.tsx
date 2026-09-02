"use client";

// /slack-disintegration — press the button and Slack becomes the little
// Ando computer. One stage, two grammars, switchable:
//
//   Dust    Every sampled pixel of the Slack window lifts off as a vapor
//           particle in a left-to-right puff — turbulent, fine-grained,
//           after Safari's Distraction Control — while the Ando window
//           fades in beneath. The return trip runs the same field of
//           particles backwards, slower: leaving is a puff, returning is
//           a pour.
//
//   Mosaic  The swap restaged as a GENERATION. Leaving (after
//           @rajzmotion's Day 9): the window quantizes into a coarse
//           mosaic, blocks corrupt to a hot magenta ramp and are eaten
//           from the top-left in STEPPED ticks, the odd row shearing
//           sideways before it goes. Arriving (after @SwamiMalode's Grid
//           Reveal): a shimmering placeholder card, then the new window
//           resolves like a progressive render — coarse average-color
//           blocks refined twice, the fine pass spent only where the
//           image actually has detail. A bracketed mono caption narrates.
//
//   Grid    @SwamiMalode's Grid Reveal, taken whole: no destruction at
//           all — the card dips to a dark generating surface, placeholder
//           cells breathe on it, then the next window rises through a
//           true quadtree (big leaves where the window is flat, small
//           ones where it has detail), dim at first and brightening as it
//           refines, narrated by the on-card status pill.
//
// Both windows are SVG twins so either can be serialized, rasterized,
// and read back as pixels. The Ando twin follows the mini-ando window
// exactly (Figma 3642:7325 grammar) — real avatars and product icons,
// inlined as data URIs for the pixel pass. Reduced motion crossfades.

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

const W = 540;
const H = 366;

const FG_PRIMARY = "#1a1817";
const FG_SECONDARY = "#58524e";
const STROKE_WEAK = "#f0efee";

const SVG_FONT = "ui-sans-serif, system-ui, -apple-system, sans-serif";

const ASSET_ROOT = "/agent-inline-trace";
const asset = (file: string) => `${ASSET_ROOT}/${file}`;

/* ── reduced motion ───────────────────────────────────────────────────── */

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/* ══ the Slack window, all vector ═════════════════════════════════════── */

const AUBERGINE = "#3f0e40";
const SLACK_ACTIVE = "#1164a3";
const SLACK_MUTED = "#cfc3cf";

function SlackChannelRow({
  y,
  label,
  active,
  badge,
}: {
  y: number;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <g>
      {active ? <rect x="8" y={y - 13} width="134" height="20" rx="5" fill={SLACK_ACTIVE} /> : null}
      <text
        x="18"
        y={y}
        fontFamily={SVG_FONT}
        fontSize="11"
        fill={active ? "#ffffff" : SLACK_MUTED}
        opacity={active ? 1 : 0.9}
      >
        <tspan opacity="0.7"># </tspan>
        {label}
      </text>
      {badge ? (
        <g>
          <rect x="112" y={y - 11} width="22" height="15" rx="7.5" fill="#e01e5a" />
          <text x="123" y={y} fontFamily={SVG_FONT} fontSize="9.5" fontWeight="700" fill="#fff" textAnchor="middle">
            {badge}
          </text>
        </g>
      ) : null}
    </g>
  );
}

function SlackDmRow({ y, label, color, badge }: { y: number; label: string; color: string; badge?: string }) {
  return (
    <g>
      <rect x="18" y={y - 9} width="11" height="11" rx="3" fill={color} />
      <circle cx="29" cy={y + 2} r="3" fill="#2bac76" stroke={AUBERGINE} strokeWidth="1.5" />
      <text x="36" y={y} fontFamily={SVG_FONT} fontSize="11" fill={SLACK_MUTED} opacity="0.9">
        {label}
      </text>
      {badge ? (
        <g>
          <rect x="112" y={y - 11} width="22" height="15" rx="7.5" fill="#e01e5a" />
          <text x="123" y={y} fontFamily={SVG_FONT} fontSize="9.5" fontWeight="700" fill="#fff" textAnchor="middle">
            {badge}
          </text>
        </g>
      ) : null}
    </g>
  );
}

function SlackMessage({
  y,
  name,
  time,
  avatarColor,
  initial,
  children,
}: {
  y: number;
  name: string;
  time: string;
  avatarColor: string;
  initial: string;
  children: React.ReactNode;
}) {
  return (
    <g>
      <rect x="166" y={y} width="26" height="26" rx="5" fill={avatarColor} />
      <text
        x="179"
        y={y + 18}
        fontFamily={SVG_FONT}
        fontSize="13"
        fontWeight="700"
        fill="#ffffff"
        textAnchor="middle"
      >
        {initial}
      </text>
      <text x="200" y={y + 10} fontFamily={SVG_FONT} fontSize="11.5" fontWeight="700" fill="#1d1c1d">
        {name}
        <tspan dx="6" fontSize="9.5" fontWeight="400" fill="#8d8b8e">
          {time}
        </tspan>
      </text>
      {children}
    </g>
  );
}

function SlackWindow({ svgRef }: { svgRef: React.Ref<SVGSVGElement> }) {
  return (
    <svg ref={svgRef} viewBox="0 0 540 366" className="block h-full w-full" aria-label="A Slack window">
      <defs>
        <clipPath id="slack-window-clip">
          <rect x="0" y="0" width="540" height="366" rx="12" />
        </clipPath>
      </defs>
      <g clipPath="url(#slack-window-clip)">
        <rect width="540" height="366" fill="#ffffff" />

        {/* title bar */}
        <rect width="540" height="26" fill="#ececeb" />
        <line x1="0" y1="26" x2="540" y2="26" stroke="#e4e2e0" strokeWidth="1" />
        <circle cx="17" cy="13" r="5" fill="#ff5f57" />
        <circle cx="31" cy="13" r="5" fill="#febc2e" />
        <circle cx="45" cy="13" r="5" fill="#28c840" />

        {/* the aubergine sidebar */}
        <rect x="0" y="26" width="150" height="340" fill={AUBERGINE} />
        <text x="14" y="50" fontFamily={SVG_FONT} fontSize="13" fontWeight="800" fill="#ffffff">
          Acme Inc
          <tspan dx="4" fontSize="9" opacity="0.6">
            ▾
          </tspan>
        </text>
        <line x1="0" y1="62" x2="150" y2="62" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" />

        <text x="14" y="84" fontFamily={SVG_FONT} fontSize="10" fill={SLACK_MUTED} opacity="0.65">
          Channels
        </text>
        <SlackChannelRow y={104} label="general" active />
        <SlackChannelRow y={126} label="design" badge="4" />
        <SlackChannelRow y={148} label="random" />
        <SlackChannelRow y={170} label="proj-launch" badge="12" />

        <text x="14" y="200" fontFamily={SVG_FONT} fontSize="10" fill={SLACK_MUTED} opacity="0.65">
          Direct messages
        </text>
        <SlackDmRow y={220} label="Sara Du" color="#e8912d" />
        <SlackDmRow y={242} label="Alex" color="#4a90d9" badge="2" />
        <SlackDmRow y={264} label="AJ" color="#7d5ba6" />

        {/* main pane header */}
        <text x="166" y="48" fontFamily={SVG_FONT} fontSize="13" fontWeight="800" fill="#1d1c1d">
          # general
        </text>
        <text x="166" y="62" fontFamily={SVG_FONT} fontSize="9.5" fill="#8d8b8e">
          23 members · pinned: launch-checklist.md
        </text>
        <line x1="150" y1="72" x2="540" y2="72" stroke="#eeeeee" strokeWidth="1" />

        {/* the noise being left behind */}
        <SlackMessage y={88} name="Alex" time="9:12 AM" avatarColor="#4a90d9" initial="A">
          <text x="200" y={112} fontFamily={SVG_FONT} fontSize="11" fill="#454245">
            did anyone see the thread about pricing?
          </text>
          <rect x="200" y={120} width="86" height="18" rx="4" fill="#f8f8f8" stroke="#e8e8e8" strokeWidth="1" />
          <text x="208" y={132} fontFamily={SVG_FONT} fontSize="9.5" fill={SLACK_ACTIVE} fontWeight="700">
            23 replies
          </text>
        </SlackMessage>

        <SlackMessage y={152} name="Sara Du" time="9:14 AM" avatarColor="#e8912d" initial="S">
          <text x="200" y={176} fontFamily={SVG_FONT} fontSize="11" fill="#454245">
            which thread… there are six
          </text>
        </SlackMessage>

        <SlackMessage y={192} name="AJ" time="9:15 AM" avatarColor="#7d5ba6" initial="AJ">
          <rect x="198" y={206} width="52" height="15" rx="3" fill="#fdf3d8" />
          <text x="202" y={217} fontFamily={SVG_FONT} fontSize="11" fill="#a07a12" fontWeight="700">
            @channel
          </text>
          <text x="258" y={217} fontFamily={SVG_FONT} fontSize="11" fill="#454245">
            standup notes are in the doc, again
          </text>
        </SlackMessage>

        {/* unread divider — it never catches up */}
        <line x1="166" y1="242" x2="500" y2="242" stroke="#e01e5a" strokeWidth="1" />
        <rect x="466" y="235" width="34" height="14" rx="7" fill="#e01e5a" />
        <text x="483" y="245" fontFamily={SVG_FONT} fontSize="8.5" fontWeight="700" fill="#fff" textAnchor="middle">
          NEW
        </text>

        <SlackMessage y={256} name="Alex" time="9:31 AM" avatarColor="#4a90d9" initial="A">
          <text x="200" y={280} fontFamily={SVG_FONT} fontSize="11" fill="#454245">
            bumping this ^ before it scrolls away
          </text>
        </SlackMessage>

        {/* composer */}
        <rect x="164" y="304" width="352" height="44" rx="8" fill="#ffffff" stroke="#dddddd" strokeWidth="1" />
        <text x="178" y="323" fontFamily={SVG_FONT} fontSize="11" fill="#a8a29e">
          Message #general
        </text>
        <text x="178" y="341" fontFamily={SVG_FONT} fontSize="10" fill="#8d8b8e" opacity="0.8">
          + B I ↯
        </text>
        <rect x="482" y="328" width="24" height="14" rx="3" fill="#2bac76" opacity="0.5" />
        <text x="494" y="338" fontFamily={SVG_FONT} fontSize="8.5" fill="#fff" textAnchor="middle">
          ➤
        </text>
      </g>
    </svg>
  );
}

/* ══ the little Ando computer, the mini-ando window as SVG ════════════── */

const ANDO_ROWS = [
  { kind: "person", label: "Tadao", avatar: "/avatars/agent-2.png" },
  { kind: "person", label: "Sara Du", avatar: "/avatars/sara.png" },
  { kind: "channel", label: "general", active: true },
  { kind: "channel", label: "design" },
  { kind: "channel", label: "feedback" },
] as const;

function AndoSidebarRow({ row, top }: { row: (typeof ANDO_ROWS)[number]; top: number }) {
  const active = "active" in row && row.active;
  return (
    <g>
      {active ? <rect x="8" y={top} width="117" height="22" rx="6" fill="#f5f5f4" /> : null}
      {row.kind === "person" ? (
        <image
          href={row.avatar}
          x="14"
          y={top + 5}
          width="12"
          height="12"
          clipPath="url(#ando-avatar-12)"
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <image href={asset(active ? "sb-hash-active.svg" : "sb-hash.svg")} x="14" y={top + 5.5} width="11" height="11" />
      )}
      <text
        x={row.kind === "person" ? 32 : 31}
        y={top + 15}
        fontFamily={SVG_FONT}
        fontSize="10"
        fill={active ? FG_PRIMARY : FG_SECONDARY}
        fontWeight={active ? 500 : 400}
      >
        {row.label}
      </text>
    </g>
  );
}

function AndoMessage({ top, who, text }: { top: number; who: "sara" | "yumi"; text: string }) {
  return (
    <g>
      <image
        href={who === "sara" ? "/avatars/sara.png" : "/avatars/agent-1.png"}
        x="144.5"
        y={top + 1}
        width="14"
        height="14"
        clipPath={`url(#ando-avatar-14-${top})`}
        preserveAspectRatio="xMidYMid slice"
      />
      <clipPath id={`ando-avatar-14-${top}`}>
        <circle cx="151.5" cy={top + 8} r="7" />
      </clipPath>
      <text
        x="164.5"
        y={top + 10}
        fontFamily={SVG_FONT}
        fontSize="9"
        fontWeight="600"
        fill={who === "yumi" ? "#2563eb" : FG_PRIMARY}
      >
        {who === "sara" ? "Sara Du" : "Yumi"}
      </text>
      <text x="164.5" y={top + 22} fontFamily={SVG_FONT} fontSize="9.5" fill="#44403c">
        {text}
      </text>
    </g>
  );
}

function AndoWindow({ svgRef }: { svgRef: React.Ref<SVGSVGElement> }) {
  return (
    <svg ref={svgRef} viewBox="0 0 540 366" className="block h-full w-full" aria-label="The Ando window">
      <defs>
        <clipPath id="ando-window-clip">
          <rect x="0" y="0" width="540" height="366" rx="12" />
        </clipPath>
        {/* the 12px sidebar avatars, rounded-full */}
        <clipPath id="ando-avatar-12">
          <circle cx="20" cy="77" r="6" />
          <circle cx="20" cy="100" r="6" />
        </clipPath>
      </defs>
      <g clipPath="url(#ando-window-clip)">
        <rect width="540" height="366" fill="#ffffff" />

        {/* title bar */}
        <rect width="540" height="26" fill="#ececeb" />
        <line x1="0" y1="26" x2="540" y2="26" stroke="#e4e2e0" strokeWidth="1" />
        <circle cx="17" cy="13" r="5" fill="#ff5f57" />
        <circle cx="31" cy="13" r="5" fill="#febc2e" />
        <circle cx="45" cy="13" r="5" fill="#28c840" />

        {/* the sidebar — 132px flat rail, hairline strokes */}
        <line x1="132.5" y1="26" x2="132.5" y2="366" stroke={STROKE_WEAK} strokeWidth="1" />
        <line x1="0" y1="60" x2="132" y2="60" stroke={STROKE_WEAK} strokeWidth="1" />
        <text x="8" y="49" fontFamily={SVG_FONT} fontSize="10" fontWeight="500" fill={FG_PRIMARY}>
          Conversations
        </text>
        <rect x="105" y="36" width="19" height="16" rx="5" fill="#f0efee" />
        <image href={asset("sb-share.svg")} x="110" y="39.5" width="9" height="9" />

        {ANDO_ROWS.map((row, i) => (
          <AndoSidebarRow key={row.label} row={row} top={66 + i * 23} />
        ))}

        {/* main pane header — hashtag, channel, the headphones pill */}
        <line x1="133" y1="60" x2="540" y2="60" stroke={STROKE_WEAK} strokeWidth="1" />
        <image href={asset("hdr-hashtag.svg")} x="144.5" y="38.5" width="9" height="9" />
        <text x="159.5" y="46.5" fontFamily={SVG_FONT} fontSize="10" fontWeight="500" fill={FG_PRIMARY}>
          general
        </text>
        <rect x="498" y="35" width="30" height="16" rx="5" fill="#f0efee" />
        <image href={asset("hdr-headphones.svg")} x="504" y="39" width="9" height="8" />
        <image href={asset("hdr-chevron.svg")} x="517" y="41.5" width="5" height="3" />

        {/* the one clean thread, landed where the pile-up was */}
        <AndoMessage top={236} who="sara" text="yumi, what did I miss?" />
        <AndoMessage top={271} who="yumi" text="3 decisions while you were out — pricing v2 is a go." />

        {/* composer — m-2.5 rounded 8, the paperclip and the send glyph */}
        <rect x="142.5" y="304.5" width="387" height="51" rx="8" fill="#ffffff" stroke="#dedcda" strokeWidth="1" />
        <text x="152.5" y="322" fontFamily={SVG_FONT} fontSize="9.5" fill="#a8a29e">
          Enter your message
        </text>
        {/* IconPaperclip1 from the product icon registry, at 11px */}
        <g transform="translate(152.5 336.5) scale(0.4583)">
          <path
            d="M5.75 10.75V15.25C5.75 18.5637 8.43629 21.25 11.75 21.25H12.25C15.5637 21.25 18.25 18.5637 18.25 15.25V7C18.25 4.65279 16.3472 2.75 14 2.75C11.6528 2.75 9.75 4.65279 9.75 7V14.875C9.75 16.0486 10.7014 17 11.875 17C13.0486 17 14 16.0486 14 14.875V7.75"
            stroke={FG_SECONDARY}
            strokeLinecap="round"
            strokeWidth="1.5"
            fill="none"
          />
        </g>
        <image href={asset("comp-send.svg")} x="510" y="337" width="10" height="10" opacity="0.6" />
      </g>
    </svg>
  );
}

/* ══ grammar one: dust ════════════════════════════════════════════════── */

type Dust = {
  x: number;
  y: number;
  color: string;
  /** ms after the sweep starts before this particle lifts */
  delay: number;
  /** ms of flight */
  life: number;
  dx: number;
  dy: number;
  /** rendered size at rest, CSS px — varied so the field reads as vapor */
  size: number;
  /** turbulence: phase, frequency, and amplitude of the in-flight wobble */
  ph1: number;
  ph2: number;
  fr1: number;
  fr2: number;
  amp: number;
};

/** Sample the rasterized window into particles. `step` is in CSS pixels. */
function sampleDust(image: ImageData, dpr: number, step: number): Dust[] {
  const dust: Dust[] = [];
  const w = image.width / dpr;
  const h = image.height / dpr;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const ix = Math.floor(x * dpr);
      const iy = Math.floor(y * dpr);
      const i = (iy * image.width + ix) * 4;
      const a = image.data[i + 3];
      if (a < 40) continue; // outside the rounded corners
      dust.push({
        x,
        y,
        color: `rgb(${image.data[i]},${image.data[i + 1]},${image.data[i + 2]})`,
        delay: (x / w) * 420 + Math.random() * 180,
        life: 380 + Math.random() * 280,
        dx: 20 + Math.random() * 80,
        dy: -(20 + Math.random() * 90),
        size: 1.2 + Math.random() * 1.8,
        ph1: Math.random() * Math.PI * 2,
        ph2: Math.random() * Math.PI * 2,
        fr1: 3 + Math.random() * 6,
        fr2: 3 + Math.random() * 6,
        amp: 2 + Math.random() * 7,
      });
    }
  }
  return dust;
}

const DUST_STEP = 2; // CSS px between samples — ~45k particles
/** The exit is a puff: sweep + jitter + longest flight ≈ 1.26s. */
const DUST_TOTAL = 420 + 180 + 660;
/** Restoration is deliberate — the same field, run backwards but slower. */
const REASSEMBLE_MS = 2000;

/* ══ grammar two: mosaic ══════════════════════════════════════════════── */

type Cell = {
  x: number;
  y: number;
  color: string;
  r: number;
  g: number;
  b: number;
  /** luma variance across the cell — where the image has detail */
  varc: number;
};

/** Average the rasterized window into `cell`-sized blocks (CSS px). */
function grid(image: ImageData, dpr: number, cell: number): Cell[] {
  const cells: Cell[] = [];
  const w = image.width / dpr;
  const h = image.height / dpr;
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      let r = 0,
        g = 0,
        b = 0,
        l = 0,
        l2 = 0,
        n = 0;
      const py1 = Math.min(Math.floor((y + cell) * dpr), image.height);
      const px1 = Math.min(Math.floor((x + cell) * dpr), image.width);
      for (let py = Math.floor(y * dpr); py < py1; py += 2) {
        for (let px = Math.floor(x * dpr); px < px1; px += 2) {
          const i = (py * image.width + px) * 4;
          if (image.data[i + 3] < 40) continue; // outside the rounded corners
          const cr = image.data[i];
          const cg = image.data[i + 1];
          const cb = image.data[i + 2];
          const luma = 0.299 * cr + 0.587 * cg + 0.114 * cb;
          r += cr;
          g += cg;
          b += cb;
          l += luma;
          l2 += luma * luma;
          n++;
        }
      }
      if (!n) continue;
      cells.push({
        x,
        y,
        color: `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`,
        r: Math.round(r / n),
        g: Math.round(g / n),
        b: Math.round(b / n),
        varc: l2 / n - (l / n) ** 2,
      });
    }
  }
  return cells;
}

/** Rajz's false-color ramp — corruption reads hot, never dusty. */
const RAMP = ["#ff8ab5", "#e01e5a", "#ff8a5c", "#ffd7e0", "#ff5f9e"];

const DEATH_CELL = 14;
const DEATH_TICKS = 14;
const DEATH_TICK_MS = 80;

const SHIMMER_TICKS = 5;
const REVEAL_TICKS = 16; // three passes of ~5, then the crisp swap
const REVEAL_TICK_MS = 90;
/** Fine pass only where a 30px block's variance says there is detail. */
const DETAIL_VAR = 60;

type DeathCell = Cell & { corruptTick: number; ramp: string };

type Prepped = {
  death: DeathCell[];
  l0: Cell[];
  l1: Cell[];
  l2: Cell[];
  appear0: number[];
  appear1: number[];
  appear2: number[];
};

function prepMosaic(image: ImageData, dpr: number): Prepped {
  const death = grid(image, dpr, DEATH_CELL).map((c) => ({
    ...c,
    // The corruption frontier eats diagonally from the top-left, with
    // enough jitter that the edge stays ragged.
    corruptTick: ((c.x / W) * 0.55 + (c.y / H) * 0.45) * (DEATH_TICKS - 4) + Math.random() * 3,
    ramp: RAMP[Math.floor(Math.random() * RAMP.length)],
  }));
  const l0 = grid(image, dpr, 60);
  const l1 = grid(image, dpr, 30);
  const l2 = grid(image, dpr, 15);
  return {
    death,
    l0,
    l1,
    l2,
    appear0: l0.map(() => Math.random() * 4),
    appear1: l1.map(() => 5 + Math.random() * 4),
    appear2: l2.map(() => 10 + Math.random() * 4),
  };
}

/* ── grammar three: grid reveal — a real quadtree, after Swami ────────── */

/** Subdivide where variance says there is detail. */
const QT_SPLIT_60 = 30;
const QT_SPLIT_30 = 90;

type QuadLeaf = { x: number; y: number; size: number; r: number; g: number; b: number; appear: number };

function prepGrid(image: ImageData, dpr: number): QuadLeaf[] {
  const l60 = grid(image, dpr, 60);
  const m30 = new Map(grid(image, dpr, 30).map((c) => [`${c.x},${c.y}`, c]));
  const m15 = new Map(grid(image, dpr, 15).map((c) => [`${c.x},${c.y}`, c]));
  const leaves: QuadLeaf[] = [];
  // Coarse leaves land first, refinements follow — every appear time is a
  // normalized 0..1 point in the reveal, with jitter inside its band.
  const leaf = (c: Cell, size: number, band: [number, number]) =>
    leaves.push({ x: c.x, y: c.y, size, r: c.r, g: c.g, b: c.b, appear: band[0] + Math.random() * (band[1] - band[0]) });
  for (const c of l60) {
    if (c.varc <= QT_SPLIT_60) {
      leaf(c, 60, [0, 0.3]);
      continue;
    }
    for (const [dx, dy] of [[0, 0], [30, 0], [0, 30], [30, 30]]) {
      const c30 = m30.get(`${c.x + dx},${c.y + dy}`);
      if (!c30) continue;
      if (c30.varc <= QT_SPLIT_30) {
        leaf(c30, 30, [0.18, 0.55]);
        continue;
      }
      for (const [ex, ey] of [[0, 0], [15, 0], [0, 15], [15, 15]]) {
        const c15 = m15.get(`${c30.x + ex},${c30.y + ey}`);
        if (c15) leaf(c15, 15, [0.42, 0.85]);
      }
    }
  }
  return leaves;
}

/** The dark surface everything generates on. */
const CARD = "#181614";

/* ══ the page ═════════════════════════════════════════════════════════── */

type Which = "slack" | "ando";
type Mode = "dust" | "mosaic" | "grid";
type Geometry = { offsetX: number; offsetY: number; scale: number; w: number; h: number };

const MODES: [Mode, string][] = [
  ["dust", "Dust"],
  ["mosaic", "Mosaic"],
  ["grid", "Grid"],
];

export default function SlackDisintegrationPage() {
  const [mode, setMode] = useState<Mode>("dust");
  const [shown, setShown] = useState<Which | "none">("slack");
  const [resting, setResting] = useState<Which>("slack"); // what the button offers to replace
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState<string | null>(null);
  const [pill, setPill] = useState<string | null>(null); // Swami's on-card status
  const reduced = useReducedMotion();

  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const slackRef = useRef<SVGSVGElement>(null);
  const andoRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Partial<Record<Which, ImageData>>>({});
  const dustRef = useRef<Dust[] | null>(null);
  const mosaicRef = useRef<Partial<Record<Which, Prepped>>>({});
  const quadRef = useRef<Partial<Record<Which, QuadLeaf[]>>>({});
  // No unmount gating on purpose: Fast Refresh re-runs effect cleanups
  // mid-run, and a loop that halts on cleanup leaves a sequence's promise
  // hanging forever. A stage runs ~2s at most — letting it finish against
  // a detached canvas is harmless.

  /** The Ando window references real avatar/icon files. A blob-SVG
   *  document can't fetch them, so swap every <image> href for a data URI
   *  in a clone — the pixel pass then sees exactly what the screen shows. */
  const inlineImages = useCallback(async (svg: SVGSVGElement): Promise<SVGSVGElement> => {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    await Promise.all(
      Array.from(clone.querySelectorAll("image")).map(async (img) => {
        const href = img.getAttribute("href");
        if (!href || href.startsWith("data:")) return;
        const blob = await (await fetch(href)).blob();
        const dataUrl = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.onerror = () => rej(reader.error);
          reader.readAsDataURL(blob);
        });
        img.setAttribute("href", dataUrl);
      }),
    );
    return clone;
  }, []);

  /** Serialize + rasterize one of the SVG windows, cached per window. */
  const ensureImage = useCallback(
    async (which: Which): Promise<ImageData> => {
      const cached = imagesRef.current[which];
      if (cached) return cached;
      const svg = which === "slack" ? slackRef.current : andoRef.current;
      if (!svg) throw new Error("missing window");
      const markup = new XMLSerializer().serializeToString(await inlineImages(svg));
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("rasterization refused"));
        };
        img.src = url;
      });
      const dpr = window.devicePixelRatio || 1;
      const raster = document.createElement("canvas");
      raster.width = W * dpr;
      raster.height = H * dpr;
      const ctx = raster.getContext("2d");
      if (!ctx) throw new Error("no 2d context");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(image, 0, 0, W, H);
      const data = ctx.getImageData(0, 0, raster.width, raster.height);
      imagesRef.current[which] = data;
      return data;
    },
    [inlineImages],
  );

  /** Size the stage canvas and measure where the window sits on it. */
  const geometry = useCallback((): Geometry | null => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!stage || !frame || !canvas) return null;
    const stageRect = stage.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = stageRect.width * dpr;
    canvas.height = stageRect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {
      offsetX: frameRect.left - stageRect.left,
      offsetY: frameRect.top - stageRect.top,
      scale: frameRect.width / W,
      w: stageRect.width,
      h: stageRect.height,
    };
  }, []);

  const clearCanvas = useCallback((geo: Geometry) => {
    canvasRef.current?.getContext("2d")?.clearRect(0, 0, geo.w, geo.h);
  }, []);

  /* ── dust playback — smooth rAF, particles fly beyond the window ────── */

  const runDust = useCallback((direction: 1 | -1, geo: Geometry, dust: Dust[]): Promise<void> => {
    return new Promise((resolve) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return resolve();
      // Backwards is the same clock run in reverse — a particle's progress
      // at normalized time t is its forward progress at 1 - t — just
      // stretched, so leaving is a puff and returning is a pour.
      const duration = direction === 1 ? DUST_TOTAL : REASSEMBLE_MS;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const time = (direction === 1 ? progress : 1 - progress) * DUST_TOTAL;
        ctx.clearRect(0, 0, geo.w, geo.h);
        for (const p of dust) {
          const k = Math.min(Math.max((time - p.delay) / p.life, 0), 1);
          if (k >= 1) continue; // gone
          const eased = 1 - (1 - k) ** 3;
          // The wobble fades in with flight so particles lift cleanly off
          // their pixel, then drift like vapor rather than on rails.
          const wob = eased * p.amp;
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = p.color;
          ctx.fillRect(
            geo.offsetX + (p.x + p.dx * eased + Math.sin(p.ph1 + k * p.fr1) * wob) * geo.scale,
            geo.offsetY + (p.y + p.dy * eased + Math.cos(p.ph2 + k * p.fr2) * wob) * geo.scale,
            p.size * (1 - 0.5 * k) * geo.scale,
            p.size * (1 - 0.5 * k) * geo.scale,
          );
        }
        ctx.globalAlpha = 1;
        if (progress < 1) requestAnimationFrame(tick);
        else {
          ctx.clearRect(0, 0, geo.w, geo.h);
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
  }, []);

  const dustTransition = useCallback(
    async (from: Which) => {
      const to: Which = from === "slack" ? "ando" : "slack";
      setBusy(true);
      try {
        // Both directions play the same field: Slack's pixels, sampled once.
        if (!dustRef.current) {
          const image = await ensureImage("slack");
          dustRef.current = sampleDust(image, window.devicePixelRatio || 1, DUST_STEP);
        }
        const geo = geometry();
        if (!geo) throw new Error("no stage");
        // Forward: Ando fades in beneath the departing dust. Backward:
        // Ando fades out while the dust pours back into a Slack window.
        setShown(to === "ando" ? "ando" : "none");
        await runDust(to === "ando" ? 1 : -1, geo, dustRef.current);
        setShown(to);
        setResting(to);
      } catch {
        setShown(to);
        setResting(to);
      } finally {
        setBusy(false);
      }
    },
    [ensureImage, geometry, runDust],
  );

  /* ── mosaic playback — STEPPED ticks; the frame only repaints when the
        tick changes, which is where the choppy, deliberate feel lives ─── */

  const runTicks = useCallback((ticks: number, tickMs: number, draw: (tick: number) => void): Promise<void> => {
    return new Promise((resolve) => {
      const start = performance.now();
      let last = -1;
      const loop = (now: number) => {
        // Clamp so a stalled tab still paints the stage's final frame
        // before the promise resolves — ticks may jump, never skip the end.
        const tick = Math.min(Math.floor((now - start) / tickMs), ticks - 1);
        if (tick !== last) {
          last = tick;
          draw(tick);
        }
        if (tick >= ticks - 1) return resolve();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
  }, []);

  /** Every mosaic painter clips to the window's rounded rect so blocks
   *  never poke past the corners. */
  const withClip = useCallback((geo: Geometry, paint: (ctx: CanvasRenderingContext2D) => void) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, geo.w, geo.h);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(geo.offsetX, geo.offsetY, W * geo.scale, H * geo.scale, 12 * geo.scale);
    ctx.clip();
    paint(ctx);
    ctx.restore();
  }, []);

  const mosaicTransition = useCallback(
    async (from: Which) => {
      const to: Which = from === "slack" ? "ando" : "slack";
      setBusy(true);
      try {
        for (const which of [from, to] as Which[]) {
          if (!mosaicRef.current[which]) {
            mosaicRef.current[which] = prepMosaic(await ensureImage(which), window.devicePixelRatio || 1);
          }
        }
        const dying = mosaicRef.current[from]!;
        const rising = mosaicRef.current[to]!;
        const geo = geometry();
        if (!geo) throw new Error("no stage");
        const cell = (n: number) => n * geo.scale + 0.5;

        // Swami's card is visible the whole time it generates — the blocks
        // resolve ON a surface, not in thin air. This is that surface.
        const base = (ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.fillRect(geo.offsetX, geo.offsetY, W * geo.scale, H * geo.scale);
        };

        /* leaving — quantize, corrupt, consume */
        setCaption(`[ removing ${from} ]`);
        setShown("none");
        await runTicks(DEATH_TICKS, DEATH_TICK_MS, (tick) => {
          withClip(geo, (ctx) => {
            for (const c of dying.death) {
              if (tick >= c.corruptTick + 2) continue; // eaten
              // A couple of surviving rows shear sideways each tick.
              const row = Math.round(c.y / DEATH_CELL);
              const sheared = (row * 31 + tick * 17) % 9 === 0;
              const dx = sheared ? ((row + tick) % 2 === 0 ? 1 : -1) * DEATH_CELL * geo.scale : 0;
              ctx.fillStyle = tick >= c.corruptTick ? c.ramp : c.color;
              ctx.fillRect(
                geo.offsetX + c.x * geo.scale + dx,
                geo.offsetY + c.y * geo.scale,
                cell(DEATH_CELL),
                cell(DEATH_CELL),
              );
            }
          });
        });

        /* the beat between — a placeholder grid, shimmering */
        setCaption(`[ creating ${to} ]`);
        await runTicks(SHIMMER_TICKS, REVEAL_TICK_MS, () => {
          withClip(geo, (ctx) => {
            base(ctx);
            for (let y = 0; y < H; y += 30) {
              for (let x = 0; x < W; x += 30) {
                if (Math.random() > 0.3) continue;
                ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.2})`;
                ctx.fillRect(geo.offsetX + x * geo.scale, geo.offsetY + y * geo.scale, cell(30), cell(30));
              }
            }
          });
        });

        /* arriving — coarse, refined, detailed, crisp */
        await runTicks(REVEAL_TICKS, REVEAL_TICK_MS, (tick) => {
          if (tick >= 10) setCaption("[ adding detail ]");
          withClip(geo, (ctx) => {
            base(ctx);
            const passes: [Cell[], number[], number][] = [
              [rising.l0, rising.appear0, 60],
              [rising.l1, rising.appear1, 30],
              [rising.l2, rising.appear2, 15],
            ];
            for (const [cells, appear, size] of passes) {
              for (let i = 0; i < cells.length; i++) {
                if (tick < appear[i]) continue;
                // The fine pass is spent only where the window has detail.
                if (size === 15 && cells[i].varc < DETAIL_VAR) continue;
                ctx.fillStyle = cells[i].color;
                ctx.fillRect(
                  geo.offsetX + cells[i].x * geo.scale,
                  geo.offsetY + cells[i].y * geo.scale,
                  cell(size),
                  cell(size),
                );
              }
            }
          });
        });

        setShown(to);
        setResting(to);
        clearCanvas(geo);
      } catch {
        // Rasterization refused → degrade to the reduced-motion swap.
        setShown(to);
        setResting(to);
      } finally {
        setCaption(null);
        setBusy(false);
      }
    },
    [clearCanvas, ensureImage, geometry, runTicks, withClip],
  );

  /** Continuous playback for the grid reveal — Swami's version is
   *  smooth, not stepped; the elegance is in the ramps. */
  const runSmooth = useCallback((duration: number, draw: (t: number) => void): Promise<void> => {
    return new Promise((resolve) => {
      const start = performance.now();
      const loop = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        draw(t);
        if (t >= 1) return resolve();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
  }, []);

  const gridTransition = useCallback(
    async (from: Which) => {
      const to: Which = from === "slack" ? "ando" : "slack";
      setBusy(true);
      try {
        if (!quadRef.current[to]) {
          quadRef.current[to] = prepGrid(await ensureImage(to), window.devicePixelRatio || 1);
        }
        if (!mosaicRef.current[to]) {
          mosaicRef.current[to] = prepMosaic(await ensureImage(to), window.devicePixelRatio || 1);
        }
        const leaves = quadRef.current[to]!;
        const rising = mosaicRef.current[to]!;
        const geo = geometry();
        if (!geo) throw new Error("no stage");

        const card = (ctx: CanvasRenderingContext2D, alpha = 1) => {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = CARD;
          ctx.fillRect(geo.offsetX, geo.offsetY, W * geo.scale, H * geo.scale);
          ctx.globalAlpha = 1;
        };

        /* no destruction — the old window just dips to the surface */
        setPill("Starting to generate");
        await runSmooth(300, (t) => withClip(geo, (ctx) => card(ctx, t)));
        setShown("none");

        /* the quilt — rounded tiles with hairline seams that MERGE into
           1×2 rectangles and split back as they breathe, greys drifting;
           the whole weave calms flat as color approaches */
        setPill("Creating image");
        const QCELL = 45; // ~12 columns, the reference's weave
        type Tile = {
          x: number;
          y: number;
          greys: number[];
          merge: 0 | 1 | 2; // none / into the right neighbour / downward
          period: number;
          phase: number;
        };
        const tiles: Tile[] = [];
        for (let y = 0; y < H; y += QCELL)
          for (let x = 0; x < W; x += QCELL) {
            const roll = Math.random();
            tiles.push({
              x,
              y,
              // a quarter of the stops are TRUE zero — the tile vanishes
              // into the card entirely before its next shade
              greys: [0, 1, 2, 3, 4].map(() => (Math.random() < 0.25 ? 0 : Math.random() * 0.11)),
              merge: roll < 0.16 && x + QCELL < W ? 1 : roll < 0.32 && y + QCELL < H ? 2 : 0,
              period: 700 + Math.random() * 700,
              phase: Math.random(),
            });
          }
        const smooth = (v: number) => v * v * (3 - 2 * v);
        const QUILT_MS = 1500;
        await runSmooth(QUILT_MS, (t) =>
          withClip(geo, (ctx) => {
            card(ctx);
            const now = t * QUILT_MS;
            const appear = Math.min(t * 4, 1);
            const settle = 1 - smooth(Math.max(t - 0.65, 0) / 0.35) * 0.9;
            const inset = 1.5 * geo.scale;
            const radius = 9 * geo.scale;
            // Two layers, and that layering is the point: the base grid of
            // small tiles stays visible THROUGH the larger rectangles that
            // drift above it — the overlays are translucent, never covers.
            const gs = Math.min(t * 4, 3.999);
            const gi = Math.floor(gs);
            const gf = smooth(gs - gi);
            for (const q of tiles) {
              const grey = q.greys[gi] + (q.greys[gi + 1] - q.greys[gi]) * gf;
              const alpha = grey * appear * settle;
              if (alpha < 0.006) continue; // truly gone — plain card shows
              ctx.fillStyle = `rgba(255,255,255,${alpha})`;
              ctx.beginPath();
              ctx.roundRect(
                geo.offsetX + q.x * geo.scale + inset,
                geo.offsetY + q.y * geo.scale + inset,
                QCELL * geo.scale - inset * 2,
                QCELL * geo.scale - inset * 2,
                radius,
              );
              ctx.fill();
            }
            for (const q of tiles) {
              if (q.merge === 0) continue;
              // the overlay grows over the neighbour, holds, splits back —
              // fading with its growth so the grid beneath always reads
              const cyc = (now / q.period + q.phase) % 1;
              const m = smooth(Math.min(Math.max((0.5 - Math.abs(cyc - 0.5)) * 4 - 0.5, 0), 1));
              const alpha = m * 0.07 * appear * settle;
              if (alpha < 0.006) continue;
              const w = QCELL * (1 + (q.merge === 1 ? m : 0)) * geo.scale;
              const h = QCELL * (1 + (q.merge === 2 ? m : 0)) * geo.scale;
              ctx.fillStyle = `rgba(255,255,255,${alpha})`;
              ctx.beginPath();
              ctx.roundRect(
                geo.offsetX + q.x * geo.scale + inset,
                geo.offsetY + q.y * geo.scale + inset,
                w - inset * 2,
                h - inset * 2,
                radius,
              );
              ctx.fill();
            }
          }),
        );

        /* the whole image at once — the coarse mosaic surfaces from the
           dark as one piece, desaturated, and brightens bottom-up */
        setPill("Adding detail");
        const tint = (c: { r: number; g: number; b: number }, local: number) => {
          const bright = 0.3 + 0.7 * local;
          const sat = 0.4 + 0.6 * local;
          const luma = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
          const mix = (v: number) => Math.round((luma + (v - luma) * sat) * bright);
          return `rgb(${mix(c.r)},${mix(c.g)},${mix(c.b)})`;
        };
        await runSmooth(950, (t) =>
          withClip(geo, (ctx) => {
            card(ctx);
            for (const c of rising.l0) {
              // lower rows lead the brightening, like a photo developing;
              // blocks start as rounded chiclets with seams and tighten
              // square as they arrive
              const local = Math.min(Math.max(t * 1.35 - (1 - c.y / H) * 0.35, 0), 1);
              const inset = 2 * (1 - local) * geo.scale;
              const radius = (2 + 8 * (1 - local)) * geo.scale;
              ctx.fillStyle = tint(c, local);
              ctx.beginPath();
              ctx.roundRect(
                geo.offsetX + c.x * geo.scale + inset,
                geo.offsetY + c.y * geo.scale + inset,
                60 * geo.scale + 0.5 - inset * 2,
                60 * geo.scale + 0.5 - inset * 2,
                radius,
              );
              ctx.fill();
            }
          }),
        );

        /* one visible refinement — the quadtree's finer leaves crossfade
           over the coarse base where the window has detail */
        await runSmooth(750, (t) =>
          withClip(geo, (ctx) => {
            card(ctx);
            for (const c of rising.l0) {
              ctx.fillStyle = c.color;
              ctx.fillRect(geo.offsetX + c.x * geo.scale, geo.offsetY + c.y * geo.scale, 60 * geo.scale + 0.5, 60 * geo.scale + 0.5);
            }
            for (const leaf of leaves) {
              if (leaf.size === 60) continue; // the base already covers these
              const a = Math.min(Math.max((t * 1.3 - leaf.appear * 0.5) / 0.3, 0), 1);
              if (a <= 0) continue;
              ctx.globalAlpha = a;
              ctx.fillStyle = `rgb(${leaf.r},${leaf.g},${leaf.b})`;
              ctx.fillRect(
                geo.offsetX + leaf.x * geo.scale,
                geo.offsetY + leaf.y * geo.scale,
                leaf.size * geo.scale + 0.5,
                leaf.size * geo.scale + 0.5,
              );
            }
            ctx.globalAlpha = 1;
          }),
        );

        /* the crisp window crossfades in through the mosaic, top first */
        setShown(to);
        await runSmooth(420, (t) =>
          withClip(geo, (ctx) => {
            for (const c of rising.l0) {
              const fade = Math.min(Math.max((t * 1.5 - (c.y / H) * 0.5) / 0.5, 0), 1);
              if (fade >= 1) continue;
              ctx.globalAlpha = 1 - fade;
              ctx.fillStyle = c.color;
              ctx.fillRect(geo.offsetX + c.x * geo.scale, geo.offsetY + c.y * geo.scale, 60 * geo.scale + 0.5, 60 * geo.scale + 0.5);
            }
            for (const leaf of leaves) {
              if (leaf.size === 60) continue;
              const fade = Math.min(Math.max((t * 1.5 - (leaf.y / H) * 0.5) / 0.5, 0), 1);
              if (fade >= 1) continue;
              ctx.globalAlpha = 1 - fade;
              ctx.fillStyle = `rgb(${leaf.r},${leaf.g},${leaf.b})`;
              ctx.fillRect(
                geo.offsetX + leaf.x * geo.scale,
                geo.offsetY + leaf.y * geo.scale,
                leaf.size * geo.scale + 0.5,
                leaf.size * geo.scale + 0.5,
              );
            }
            ctx.globalAlpha = 1;
          }),
        );

        setShown(to);
        setResting(to);
        clearCanvas(geo);
      } catch {
        setShown(to);
        setResting(to);
      } finally {
        setPill(null);
        setBusy(false);
      }
    },
    [clearCanvas, ensureImage, geometry, runSmooth, withClip],
  );

  const go = useCallback(() => {
    if (busy) return;
    const to: Which = resting === "slack" ? "ando" : "slack";
    if (reduced) {
      setShown(to);
      setResting(to);
      return;
    }
    if (mode === "dust") void dustTransition(resting);
    else if (mode === "mosaic") void mosaicTransition(resting);
    else void gridTransition(resting);
  }, [busy, dustTransition, gridTransition, mode, mosaicTransition, reduced, resting]);

  const label = busy
    ? mode === "dust"
      ? resting === "slack"
        ? "Disintegrating…"
        : "Reassembling…"
      : "Generating…"
    : mode === "dust"
      ? resting === "slack"
        ? "Disintegrate Slack"
        : "Bring Slack back"
      : resting === "slack"
        ? "Generate Ando"
        : "Generate Slack";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-white px-6 py-12">
      {/* the grammar switcher */}
      <div className="inline-flex items-center gap-[2px] rounded-full bg-white/85 p-[3px] shadow-[0px_0px_0px_1px_rgba(81,76,71,0.12),0px_8px_8px_-4px_rgba(22,25,29,0.03),0px_20px_24px_-4px_rgba(22,25,29,0.08)]">
        {MODES.map(([value, name]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            disabled={busy}
            onClick={() => setMode(value)}
            className={`rounded-full px-[14px] py-[6px] text-[12px] leading-[16px] transition-colors ease-fast ${
              mode === value ? "bg-[#1a1817] text-white" : "text-[#58524e] hover:text-[#1a1817]"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* the stage — generous blue air; the same ground for both grammars */}
      <div
        ref={stageRef}
        className="relative flex w-full max-w-[760px] justify-center overflow-hidden rounded-[14px] p-8 sm:p-14"
        style={{
          background: "radial-gradient(120% 140% at 18% 12%, #dcecfe 0%, #9cc7fb 45%, #62a4f4 100%)",
        }}
      >
        <div ref={frameRef} className="relative aspect-[540/366] w-full max-w-[540px]">
          <div
            className={`absolute inset-0 drop-shadow-[0_18px_40px_rgba(23,68,130,0.28)] ${
              shown === "slack" ? "visible" : "invisible"
            }`}
            aria-hidden={shown !== "slack"}
          >
            <SlackWindow svgRef={slackRef} />
          </div>
          {/* In dust mode the Ando window fades in beneath the departing
              particles; in mosaic mode it swaps in crisp after the reveal. */}
          <div
            className={`absolute inset-0 drop-shadow-[0_18px_40px_rgba(23,68,130,0.28)] ${
              mode === "dust"
                ? `transition-all duration-700 ease-fast ${
                    shown === "ando" ? "scale-100 opacity-100" : "scale-[0.965] opacity-0"
                  }`
                : shown === "ando"
                  ? "visible"
                  : "invisible"
            }`}
            style={mode === "dust" && shown === "ando" && busy ? { transitionDelay: "350ms" } : undefined}
            aria-hidden={shown !== "ando"}
          >
            <AndoWindow svgRef={andoRef} />
          </div>
        </div>

        {/* dust and mosaic both paint above the windows */}
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />

        {/* Swami's on-card status pill — grid mode */}
        <div className="pointer-events-none absolute inset-0 flex justify-center p-8 sm:p-14">
          <div className="relative aspect-[540/366] w-full max-w-[540px]">
            <span
              className={`absolute bottom-2.5 left-2.5 rounded-full bg-black/55 px-[8px] py-[3px] text-[9.5px] leading-[13px] text-white/90 backdrop-blur-[8px] transition-opacity duration-200 ${
                pill ? "opacity-100" : "opacity-0"
              }`}
            >
              {pill ?? " "}
            </span>
          </div>
        </div>

        {/* the narration, Swami-style — mosaic only */}
        <p
          className={`pointer-events-none absolute bottom-4 left-0 right-0 text-center font-mono text-[11px] leading-[16px] text-[#2b4a7a] transition-opacity duration-200 ${
            caption ? "opacity-70" : "opacity-0"
          }`}
        >
          {caption ?? " "}
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={go}
          className={`rounded-full px-[18px] py-[8px] text-[13px] leading-[18px] transition-colors ease-fast ${
            busy ? "cursor-default bg-[#f0efee] text-[#a8a29e]" : "bg-[#1a1817] text-white hover:bg-[#33302e]"
          }`}
        >
          {label}
        </button>
        <p className="max-w-[480px] text-center text-[12px] leading-[16px] text-[#8a827b]">
          {mode === "dust"
            ? "Every pixel of the Slack window becomes a dust particle — the little Ando computer was underneath all along."
            : mode === "mosaic"
              ? "The old window corrupts away in stepped mosaic blocks; the new one resolves like a progressive render."
              : "No destruction — the window is generated like an AI image: a quadtree spends its detail only where the window needs it, brightening as it refines."}
        </p>
      </div>
    </div>
  );
}
