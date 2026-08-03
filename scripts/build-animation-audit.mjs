// Builds the /animation-audit page's data from the Ando repo.
//
// Scans every stylesheet and component for @keyframes, then resolves the
// timing each one is actually played at by its consumers — including timing
// inherited from a base rule, and `var()` references resolved against the
// design tokens. Emits two files into app/animation-audit/:
//
//   generated-animations.css  every keyframe, copied verbatim, name-prefixed
//   inventory.ts              one entry per animation + repo-wide stats
//
// The page is generated rather than hand-written because the values drift:
// hand-transcribed timings are wrong within a week, and a stale audit is
// worse than none. Run `npm run audit:animations` to refresh.
//
// Point at a different checkout with ANDO_REPO=/path/to/ando.

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
// The Ando repo, as a sibling checkout of this one.
const ROOT = process.env.ANDO_REPO ?? join(HERE, "..", "..", "ando");
const SCAN_DIRS = [
  "apps/web/src",
  "packages/ui/src",
  "apps/kanso/src",
  "apps/analytics/src",
  "apps/status/src",
  "packages/conversation-presentation/src",
];
const EXT = /\.(css|tsx|ts)$/;
const SKIP = /node_modules|\.next|dist|build|\.turbo/;

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e);
    if (SKIP.test(p)) continue;
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(p, out);
    else if (EXT.test(p)) out.push(p);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
console.error(`scanning ${files.length} files`);

const sources = new Map();
for (const f of files) {
  try {
    let text = readFileSync(f, "utf8");
    // Components that keep their CSS in a template literal interpolate timing
    // from a local constant (`${SLOT_DURATION_MS}ms`). Inline those numbers so
    // the timing is readable as CSS.
    if (/\.tsx?$/.test(f)) {
      const consts = new Map();
      for (const m of text.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(-?\d*\.?\d+)\s*;/g)) {
        consts.set(m[1], m[2]);
      }
      if (consts.size) {
        text = text.replace(/\$\{([A-Za-z_$][\w$]*)\}/g, (whole, name) =>
          consts.has(name) ? consts.get(name) : whole,
        );
      }
    }
    sources.set(f, text);
  } catch {}
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

// Brace-match from an opening `{` index; returns index of matching `}`.
function matchBrace(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/* ---------------------------- 1. keyframe definitions --------------------- */

const keyframes = new Map(); // name -> {name, file, line, properties[], steps}

const KF_RE = /@keyframes\s+([A-Za-z0-9_-]+)\s*\{/g;
for (const [file, text] of sources) {
  KF_RE.lastIndex = 0;
  let m;
  while ((m = KF_RE.exec(text))) {
    const name = m[1];
    const open = text.indexOf("{", m.index);
    const close = matchBrace(text, open);
    if (close === -1) continue;
    const body = text.slice(open + 1, close);

    // Properties animated: declaration names inside the step blocks.
    const props = new Set();
    for (const pm of body.matchAll(/([a-z-]+)\s*:/g)) {
      const p = pm[1];
      if (/^(from|to)$/.test(p)) continue;
      props.add(p);
    }
    // Count steps (from/to/percentages).
    const steps = (body.match(/(^|\s)(from|to|\d+%)\s*[,{]/g) || []).length;

    if (!keyframes.has(name)) {
      keyframes.set(name, {
        name,
        file: relative(ROOT, file),
        line: lineOf(text, m.index),
        properties: [...props],
        steps,
        body: body.trim(),
      });
    }
  }
}

/* ---------------------------- 2. animation consumers ---------------------- */
// Walk CSS rule blocks, capture selector + declarations, find animation usage.

const consumers = []; // {keyframe, selector, file, line, duration, easing, delay, iteration, fill}

const TIME_RE = /^-?(\d*\.?\d+)(ms|s)$/;
const EASE_NAMED = /^(linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end)$/;

function parseAnimationShorthand(value) {
  // Split top-level (respect parens for cubic-bezier / var / calc).
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const c of value) {
    if (c === "(") depth++;
    if (c === ")") depth--;
    if (/\s/.test(c) && depth === 0) {
      if (cur) parts.push(cur);
      cur = "";
    } else cur += c;
  }
  if (cur) parts.push(cur);

  const out = {
    name: null,
    duration: null,
    easing: null,
    delay: null,
    iteration: null,
    fill: null,
    direction: null,
  };
  const times = [];
  for (const p of parts) {
    if (TIME_RE.test(p)) {
      times.push(p);
      continue;
    }
    if (/^var\(--[a-z0-9-]*duration[a-z0-9-]*\)?/i.test(p) || /duration/i.test(p) && p.startsWith("var(")) {
      times.push(p);
      continue;
    }
    if (/^calc\(/.test(p)) {
      times.push(p);
      continue;
    }
    if (EASE_NAMED.test(p) || /^cubic-bezier\(/.test(p) || /^steps\(/.test(p) || /^linear\(/.test(p)) {
      out.easing = p;
      continue;
    }
    if (/^var\(--[a-z0-9-]*eas/i.test(p)) {
      out.easing = p;
      continue;
    }
    if (/^(infinite)$/.test(p) || /^\d+$/.test(p)) {
      out.iteration = p;
      continue;
    }
    if (/^(forwards|backwards|both|none)$/.test(p)) {
      out.fill = p;
      continue;
    }
    if (/^(normal|reverse|alternate|alternate-reverse)$/.test(p)) {
      out.direction = p;
      continue;
    }
    if (/^(running|paused)$/.test(p)) continue;
    // Otherwise treat as the animation-name.
    if (!out.name) out.name = p;
  }
  if (times.length >= 1) out.duration = times[0];
  if (times.length >= 2) out.delay = times[1];
  return out;
}

// Parse a CSS string into (selector, declBlock) pairs at any nesting depth,
// skipping @keyframes bodies (already handled above).
function eachRule(text, fn) {
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("{", i);
    if (open === -1) break;
    // Selector = text between previous ; } { and this {
    let start = open - 1;
    while (start >= 0 && !"{};".includes(text[start])) start--;
    const selector = text.slice(start + 1, open).trim();
    const close = matchBrace(text, open);
    if (close === -1) break;
    if (/^@keyframes/.test(selector)) {
      i = close + 1;
      continue;
    }
    const body = text.slice(open + 1, close);
    fn(selector, body, open);
    i = open + 1; // descend into nested rules too
  }
}

for (const [file, text] of sources) {
  eachRule(text, (selector, body, idx) => {
    // Only direct declarations (strip nested blocks) for this selector.
    const flat = body.replace(/\{[^{}]*\}/g, "");
    const animMatch = flat.match(/(?:^|;|\s)animation\s*:\s*([^;]+)/);
    const nameMatch = flat.match(/animation-name\s*:\s*([^;]+)/);
    const durMatch = flat.match(/animation-duration\s*:\s*([^;]+)/);
    const easeMatch = flat.match(/animation-timing-function\s*:\s*([^;]+)/);
    const delayMatch = flat.match(/animation-delay\s*:\s*([^;]+)/);
    const iterMatch = flat.match(/animation-iteration-count\s*:\s*([^;]+)/);

    if (!animMatch && !nameMatch && !durMatch) return;

    let parsed = { name: null, duration: null, easing: null, delay: null, iteration: null, fill: null };
    if (animMatch) {
      const v = animMatch[1].trim();
      if (v === "none") return;
      parsed = parseAnimationShorthand(v);
    }
    if (nameMatch) parsed.name = nameMatch[1].trim();
    if (durMatch) parsed.duration = durMatch[1].trim();
    if (easeMatch) parsed.easing = easeMatch[1].trim();
    if (delayMatch) parsed.delay = delayMatch[1].trim();
    if (iterMatch) parsed.iteration = iterMatch[1].trim();

    if (!parsed.name) return;

    consumers.push({
      keyframe: parsed.name,
      selector: selector.replace(/\s+/g, " ").slice(0, 120),
      file: relative(ROOT, file),
      line: lineOf(text, idx),
      duration: parsed.duration,
      easing: parsed.easing,
      delay: parsed.delay,
      iteration: parsed.iteration,
      fill: parsed.fill,
      inReducedMotion: false, // filled below
    });
  });
}

// Mark consumers that sit inside a prefers-reduced-motion block.
for (const c of consumers) {
  const text = sources.get(join(ROOT, c.file));
  if (!text) continue;
  const lines = text.split("\n");
  // crude: scan upward for an unclosed @media (prefers-reduced-motion
  const before = lines.slice(0, c.line).join("\n");
  const opens = (before.match(/@media[^{]*prefers-reduced-motion[^{]*\{/g) || []).length;
  if (opens > 0) {
    const lastIdx = before.lastIndexOf("prefers-reduced-motion");
    const openIdx = before.indexOf("{", lastIdx);
    if (openIdx !== -1) {
      const full = text;
      const closeIdx = matchBrace(full, openIdx);
      const cLineStart = lines.slice(0, c.line - 1).join("\n").length;
      if (closeIdx > cLineStart) c.inReducedMotion = true;
    }
  }
}

/* ------------------- 2b. resolve inherited duration/easing ---------------- */
// Rules that only set `animation-name` inherit timing from a base rule on the
// same component class (e.g. .ando-tooltip__content sets the duration once,
// then per-side rules just swap the keyframe name).

const rulesByFile = new Map();
for (const [file, text] of sources) {
  const rules = [];
  eachRule(text, (selector, body) => {
    const flat = body.replace(/\{[^{}]*\}/g, "");
    const anim = flat.match(/(?:^|;|\s)animation\s*:\s*([^;]+)/);
    const dur = flat.match(/animation-duration\s*:\s*([^;]+)/);
    const ease = flat.match(/animation-timing-function\s*:\s*([^;]+)/);
    const delay = flat.match(/animation-delay\s*:\s*([^;]+)/);
    const iter = flat.match(/animation-iteration-count\s*:\s*([^;]+)/);
    if (!anim && !dur && !ease && !delay && !iter) return;
    let p = { duration: null, easing: null, delay: null, iteration: null };
    if (anim && anim[1].trim() !== "none") p = parseAnimationShorthand(anim[1].trim());
    if (dur) p.duration = dur[1].trim();
    if (ease) p.easing = ease[1].trim();
    if (delay) p.delay = delay[1].trim();
    if (iter) p.iteration = iter[1].trim();
    rules.push({
      classes: [...selector.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1]),
      ...p,
    });
  });
  rulesByFile.set(file, rules);
}

for (const c of consumers) {
  if (c.duration && c.easing) continue;
  const rules = rulesByFile.get(join(ROOT, c.file)) || [];
  const own = [...c.selector.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);
  for (const r of rules) {
    if (!r.classes.some((cl) => own.includes(cl))) continue;
    if (!c.duration && r.duration) {
      c.duration = r.duration;
      c.inherited = true;
    }
    if (!c.easing && r.easing) {
      c.easing = r.easing;
      c.inherited = true;
    }
    if (!c.delay && r.delay) c.delay = r.delay;
    if (!c.iteration && r.iteration) c.iteration = r.iteration;
  }
}

/* ------------------- 2c. reduced-motion coverage -------------------------- */
// Coverage today is a hand-maintained allowlist of selectors inside
// @media (prefers-reduced-motion) blocks, so we collect every class named in
// one and treat a keyframe as covered when it targets any of them.

const REDUCED_CLASSES = new Set();
let REDUCED_HAS_WILDCARD = false;
for (const [, text] of sources) {
  for (const m of text.matchAll(/@media[^{]*prefers-reduced-motion[^{]*\{/g)) {
    const open = text.indexOf("{", m.index + m[0].length - 1);
    const close = matchBrace(text, open);
    if (close === -1) continue;
    const block = text.slice(open + 1, close);
    if (/(^|[\s,{])\*(\s|,|::|\{)/.test(block)) REDUCED_HAS_WILDCARD = true;
    for (const cm of block.matchAll(/\.([a-zA-Z0-9_-]+)/g)) REDUCED_CLASSES.add(cm[1]);
  }
}

/* ---------------------------- 3. frequency -------------------------------- */
// For each consumer selector, extract class names and count call sites in TS/TSX.

const tsxFiles = [...sources.entries()].filter(([f]) => /\.tsx?$/.test(f));

// Theme/state wrappers are not the animated object — counting them wildly
// overstates frequency (`.dark` alone matches 100+ unrelated call sites).
const NOT_A_TARGET = new Set([
  "dark",
  "light",
  "group",
  "peer",
  "rtl",
  "ltr",
  "open",
  "closed",
]);

function countClassUsage(className) {
  let n = 0;
  const re = new RegExp(`[\\s"'\`{]${className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s"'\`}]`, "g");
  for (const [, text] of tsxFiles) {
    const m = text.match(re);
    if (m) n += m.length;
  }
  return n;
}

const classCountCache = new Map();
function classCount(cn) {
  if (!classCountCache.has(cn)) classCountCache.set(cn, countClassUsage(cn));
  return classCountCache.get(cn);
}

/* ------------------- 3b. token registry + classification ------------------ */

// Design tokens proper — the generated output of packages/design-tokens. Only
// these count as "token-backed".
const DESIGN_TOKENS = new Map();
// App-local motion vars: the --ease-* set declared by hand in apps/web's
// globals.css. They look like tokens at the call site but are not part of the
// design system, so they get their own label rather than a passing grade.
const APP_LOCAL = new Map();

for (const [f, into] of [
  ["packages/design-tokens/dist/css/ando-theme.css", DESIGN_TOKENS],
  ["apps/web/src/app/styles/globals.css", APP_LOCAL],
  ["packages/ui/src/styles/motion.css", APP_LOCAL],
]) {
  let t;
  try {
    t = readFileSync(join(ROOT, f), "utf8");
  } catch {
    continue;
  }
  for (const m of t.matchAll(/(--(?:motion|ease)[a-z0-9-]*)\s*:\s*([^;]+);/g)) {
    if (!DESIGN_TOKENS.has(m[1]) && !into.has(m[1])) into.set(m[1], m[2].trim());
  }
}

const DEFINED = new Map([...DESIGN_TOKENS, ...APP_LOCAL]);

// Resolve a value one hop: var(--x) -> its definition, when known.
// Resolve a var() reference to a concrete value: design tokens first, then any
// custom property defined elsewhere in the tree (component-local vars).
function resolve(value) {
  if (!value) return null;
  const m = value.match(/var\((--[a-z0-9-]+)\)/i);
  if (!m) return value;
  return DEFINED.get(m[1]) ?? DEFINED_ANYWHERE.get(m[1]) ?? null;
}

// Every custom property defined anywhere in the scanned tree. Lets us tell a
// component-local var (fine) from a reference to a token that doesn't exist
// (a real bug: the whole declaration is invalid and silently does nothing).
const DEFINED_ANYWHERE = new Map();
for (const [, text] of sources) {
  for (const m of text.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;{}]+)[;}]/g)) {
    if (!DEFINED_ANYWHERE.has(m[1])) DEFINED_ANYWHERE.set(m[1], m[2].trim());
  }
}

function classify(value) {
  if (!value) return "unset";
  // calc() is checked first: its inner vars are often set from JS (stagger
  // indices), so they legitimately have no CSS definition.
  if (/^calc\(/.test(value.trim())) return "computed";
  const m = value.match(/var\((--[a-z0-9-]+)\)/i);
  if (m) {
    if (DESIGN_TOKENS.has(m[1])) return "token";
    if (APP_LOCAL.has(m[1])) return "app-local";
    return DEFINED_ANYWHERE.has(m[1]) ? "local-var" : "broken";
  }
  if (/^cubic-bezier|^steps|^linear\(/.test(value)) return "literal-bezier";
  if (/^(linear|ease|ease-in|ease-out|ease-in-out)$/.test(value)) return "named";
  return "literal";
}

// Broad surface, from where the animation lives.
function surfaceOf(file) {
  if (file.startsWith("packages/ui/")) {
    const m = file.match(/components\/(?:v2\/)?([^/]+)\//);
    return m ? `UI · ${m[1].replace(/-/g, " ")}` : "UI · shared";
  }
  if (file.includes("/onboarding/")) return "Web · onboarding";
  if (file.includes("/auth/")) return "Web · auth";
  if (file.includes("global-sidebar")) return "Web · sidebar";
  if (file.startsWith("apps/web/")) return "Web · app";
  if (file.startsWith("apps/kanso/")) return "Kanso · docs";
  if (file.startsWith("apps/analytics/")) return "Analytics";
  if (file.startsWith("apps/status/")) return "Status";
  return "Other";
}

function triggerOf(kf, consumer) {
  const n = kf.name;
  if (consumer?.iteration === "infinite") return "loop";
  if (/exit|out|close|leave/.test(n)) return "exit";
  if (/enter|in\b|open|arrive|from-/.test(n)) return "enter";
  if (consumer?.fill === "forwards" || consumer?.fill === "both") return "one-shot";
  return "one-shot";
}

/* ---------------------------- 4. assemble --------------------------------- */

const inventory = [];
for (const [name, kf] of keyframes) {
  const uses = consumers.filter((c) => c.keyframe === name);
  const live = uses.filter((c) => !c.inReducedMotion);

  // Frequency: sum of class-name call sites across all live selectors.
  const classNames = new Set();
  for (const u of live) {
    for (const cm of u.selector.matchAll(/\.([a-zA-Z0-9_-]+)/g)) {
      if (NOT_A_TARGET.has(cm[1])) continue;
      classNames.add(cm[1]);
    }
  }
  // Tailwind `animate-<name>` utility usage counts too.
  let twCount = 0;
  for (const [, text] of tsxFiles) {
    twCount += (text.match(new RegExp(`animate-${name}\\b`, "g")) || []).length;
  }

  // `animate-<name>` also appears as a literal class in selectors; counting it
  // both as a utility and as a class name would double it.
  let siteCount = twCount;
  for (const cn of classNames) {
    if (cn === `animate-${name}`) continue;
    siteCount += classCount(cn);
  }

  const primary = live[0] || null;
  inventory.push({
    ...kf,
    surface: surfaceOf(kf.file),
    trigger: triggerOf(kf, primary),
    duration: primary?.duration ?? null,
    durationResolved: resolve(primary?.duration),
    durationKind: classify(primary?.duration),
    easing: primary?.easing ?? null,
    easingResolved: resolve(primary?.easing),
    easingKind: classify(primary?.easing),
    delay: primary?.delay ?? null,
    delayKind: classify(primary?.delay),
    iteration: primary?.iteration ?? null,
    fill: primary?.fill ?? null,
    consumers: live.map((c) => ({
      selector: c.selector,
      file: c.file,
      line: c.line,
      duration: c.duration,
      easing: c.easing,
      delay: c.delay,
      iteration: c.iteration,
      fill: c.fill,
      inherited: !!c.inherited,
    })),
    consumerCount: live.length,
    // Distinct (duration, easing) pairs this keyframe is played at. More than
    // one means the same motion reads differently depending on the surface.
    variants: [
      ...new Set(live.map((c) => `${resolve(c.duration) || c.duration || "?"} / ${resolve(c.easing) || c.easing || "?"}`)),
    ],
    brokenRefs: live
      .flatMap((c) => [c.duration, c.easing, c.delay])
      .filter((v) => classify(v) === "broken"),
    reducedMotionHandled:
      REDUCED_HAS_WILDCARD ||
      uses.some((c) => c.inReducedMotion) ||
      [...classNames].some((cn) => REDUCED_CLASSES.has(cn)),
    classNames: [...classNames],
    callSites: siteCount,
    orphan: live.length === 0 && twCount === 0,
  });
}

/* ---------------------------- 5. ambient tier ----------------------------- */

const ambient = {
  transitions: {},
  durations: {},
  easings: {},
  animateUtilities: {},
};

for (const [, text] of tsxFiles) {
  for (const m of text.matchAll(/\btransition-([a-z]+)\b/g)) {
    const k = m[1];
    if (["state", "key", "old", "new", "group", "name", "property"].includes(k)) continue;
    ambient.transitions[k] = (ambient.transitions[k] || 0) + 1;
  }
  for (const m of text.matchAll(/\bduration-(\[?[\w.%\-]+\]?)\b/g)) {
    ambient.durations[m[1]] = (ambient.durations[m[1]] || 0) + 1;
  }
  for (const m of text.matchAll(/\bease-([a-z-]+)\b/g)) {
    ambient.easings[m[1]] = (ambient.easings[m[1]] || 0) + 1;
  }
  for (const m of text.matchAll(/\banimate-([a-z0-9-]+)\b/g)) {
    ambient.animateUtilities[m[1]] = (ambient.animateUtilities[m[1]] || 0) + 1;
  }
}

/* ---------------------------- 6. bezier census ---------------------------- */

const beziers = {};
for (const [, text] of sources) {
  for (const m of text.matchAll(/cubic-bezier\(([^)]+)\)/g)) {
    const norm = `cubic-bezier(${m[1]
      .split(",")
      .map((s) => {
        const t = s.trim();
        return t.startsWith(".") ? `0${t}` : t;
      })
      .join(", ")})`;
    beziers[norm] = (beziers[norm] || 0) + 1;
  }
}

const out = {
  scannedFiles: files.length,
  keyframeCount: keyframes.size,
  inventory: inventory.sort((a, b) => b.callSites - a.callSites),
  ambient,
  beziers: Object.fromEntries(Object.entries(beziers).sort((a, b) => b[1] - a[1])),
};

const OUT_DIR = join(HERE, "..", "app", "animation-audit");
mkdirSync(OUT_DIR, { recursive: true });
const data = out;
const live = data.inventory.filter((k) => !k.orphan);
const orphans = data.inventory.filter((k) => k.orphan);

/* ------------------------------- CSS ------------------------------------- */
// Keyframes are copied verbatim from the Ando repo and prefixed so they can't
// collide with this app's own animations. Prefixing is the only edit.

const PREFIX = "aa-";
let css = `/* GENERATED — do not edit by hand. See scripts/build-animation-audit.mjs.
   Every @keyframes below is copied verbatim from the Ando repo; only the name
   is prefixed with \`${PREFIX}\` so it cannot collide with this app's own
   animations. The demo stage supplies stand-in values for the handful of
   custom properties the keyframes read from their real components. */

.aa-stage {
  /* Stand-ins for properties the real components set on the animated node. */
  --ando-overlay-base-transform: translate(0, 0);
  --ando-sheet-closed-transform: translateY(100%);
  --radix-collapsible-content-height: 56px;
  --color-ando-bg-highlight: #fef3c7;
  --color-ando-action-mention-tag: #dbeafe;
  --color-ando-bg-warning: #fde68a;
  --typing-text-blur: 2px;
  --typing-text-distance: 8px;
  --typing-text-dir-x: 0;
  --typing-text-dir-y: 1;
  --typing-text-stagger-index: 0;
  --typing-text-stagger: 40ms;
  --ando-thread-reply-enter-index: 0;
  --onboarding-stagger: 0;
  --i: 0;

  /* The real motion tokens, so token-backed demos play at true values. */
  --motion-duration-instant: 0ms;
  --motion-duration-fast: 120ms;
  --motion-duration-base: 180ms;
  --motion-duration-moderate: 300ms;
  --motion-easing-standard: cubic-bezier(0.2, 0, 0, 1);
  --motion-easing-exit: cubic-bezier(0.4, 0, 1, 1);
  /* apps/web-local easing set (not design tokens — see the audit notes). */
  --ease-slow: cubic-bezier(0.7, 0, 0.2, 1);
  --ease-fast: cubic-bezier(0.62, 0.61, 0.02, 1);
  --ease-fastfast: cubic-bezier(0.5, 0, 0, 1);
}

`;

for (const k of live) {
  css += `/* ${k.file}:${k.line} */\n@keyframes ${PREFIX}${k.name} {\n${k.body
    .split("\n")
    .map((l) => (l.trim() ? `  ${l.trim()}` : ""))
    .join("\n")}\n}\n\n`;
}

writeFileSync(join(OUT_DIR, "generated-animations.css"), css);

/* ------------------------------- data ------------------------------------ */

function bucket(n) {
  if (n >= 15) return "pervasive";
  if (n >= 5) return "common";
  if (n >= 2) return "occasional";
  return "rare";
}

// `0.3s` and `300ms` are the same duration written two ways; normalising lets
// the page sort and group by real value instead of by spelling.
function toMs(value) {
  if (!value) return null;
  const m = String(value).trim().match(/^(-?\d*\.?\d+)(ms|s)$/);
  if (!m) return null;
  return m[2] === "s" ? Math.round(parseFloat(m[1]) * 1000) : Math.round(parseFloat(m[1]));
}

function easingLabel(k) {
  const r = k.easingResolved || k.easing;
  if (!r) return { label: "unset (defaults to ease)", custom: false };
  if (/^cubic-bezier/.test(r)) {
    return { label: r.replace(/\s+/g, " "), custom: true };
  }
  return { label: r, custom: false };
}

const entries = live.map((k) => {
  const e = easingLabel(k);
  return {
    name: k.name,
    css: `${PREFIX}${k.name}`,
    file: k.file,
    line: k.line,
    surface: k.surface,
    trigger: k.trigger,
    properties: k.properties,
    // timing
    duration: k.durationResolved || k.duration || null,
    durationMs: toMs(k.durationResolved || k.duration),
    durationRaw: k.duration,
    durationKind: k.durationKind,
    easing: e.label,
    easingRaw: k.easing,
    easingKind: k.easingKind,
    customBezier: e.custom,
    delay: k.delay,
    delayKind: k.delayKind,
    iteration: k.iteration,
    fill: k.fill,
    // usage
    callSites: k.callSites,
    frequency: bucket(k.callSites),
    consumerCount: k.consumerCount,
    variants: k.variants,
    // health
    tokenBacked: k.durationKind === "token" && k.easingKind === "token",
    brokenRefs: [...new Set(k.brokenRefs)],
    reducedMotion: k.reducedMotionHandled,
    classNames: k.classNames.slice(0, 6),
  };
});

const stats = {
  scannedFiles: data.scannedFiles,
  totalKeyframes: data.keyframeCount,
  live: live.length,
  orphans: orphans.length,
  tokenBackedDuration: live.filter((k) => k.durationKind === "token").length,
  tokenBackedEasing: live.filter((k) => k.easingKind === "token").length,
  // Easings that read like a token at the call site but come from the
  // hand-rolled --ease-* set in apps/web, not the design system.
  appLocalEasing: live.filter((k) => k.easingKind === "app-local").length,
  reducedMotionCovered: live.filter((k) => k.reducedMotionHandled).length,
  brokenRefs: live.filter((k) => k.brokenRefs.length).length,
  multiVariant: live.filter((k) => k.variants.length > 1).length,
  distinctBeziers: Object.keys(data.beziers).length,
  // Distinct real durations (normalised), vs. how many spellings they use.
  distinctDurations: new Set(
    entries.map((e) => e.durationMs).filter((v) => v != null),
  ).size,
  distinctDurationSpellings: new Set(entries.map((e) => e.duration)).size,
  beziers: data.beziers,
  ambient: data.ambient,
};

const orphanList = orphans.map((k) => ({
  name: k.name,
  file: k.file,
  line: k.line,
}));

const ts = `// GENERATED — do not edit by hand.
// Produced by scripts/build-animation-audit.mjs, which reads the Ando repo at
// ../ando and extracts every @keyframes together with the timing its real
// consumers play it at. Regenerate with: npm run audit:animations

export type Frequency = "pervasive" | "common" | "occasional" | "rare";
export type Trigger = "enter" | "exit" | "loop" | "one-shot";
export type ValueKind =
  | "token"
  | "app-local"
  | "literal"
  | "literal-bezier"
  | "named"
  | "local-var"
  | "computed"
  | "broken"
  | "unset";

export type AnimationEntry = {
  /** Keyframe name as it exists in the Ando repo. */
  name: string;
  /** Prefixed name in generated-animations.css. */
  css: string;
  file: string;
  line: number;
  surface: string;
  trigger: Trigger;
  properties: string[];
  duration: string | null;
  /** Duration normalised to milliseconds, for sorting and grouping. */
  durationMs: number | null;
  durationRaw: string | null;
  durationKind: ValueKind;
  easing: string;
  easingRaw: string | null;
  easingKind: ValueKind;
  customBezier: boolean;
  delay: string | null;
  delayKind: ValueKind;
  iteration: string | null;
  fill: string | null;
  callSites: number;
  frequency: Frequency;
  consumerCount: number;
  /** Distinct duration/easing pairs this keyframe is played at. */
  variants: string[];
  tokenBacked: boolean;
  brokenRefs: string[];
  reducedMotion: boolean;
  classNames: string[];
};

export const ANIMATIONS: AnimationEntry[] = ${JSON.stringify(entries, null, 2)};

/** Keyframes defined in the repo with no consumer. */
export const ORPHANS = ${JSON.stringify(orphanList, null, 2)};

export const STATS = ${JSON.stringify(stats, null, 2)};
`;

writeFileSync(join(OUT_DIR, "inventory.ts"), ts);

console.error(
  `emitted ${entries.length} entries + ${orphanList.length} orphans -> ${OUT_DIR}`,
);
