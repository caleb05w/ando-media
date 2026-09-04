"use client";

// Timeline Studio — the composer. THE canonical copy: ported from the
// affiliate announcement's WheelStudio (app/affiliate-announcement/
// world-wheel.tsx) and made lane-generic, so any animation that is a pure
// function of one virtual clock can mount it. Pages import it from here
// (/logo-motion is the worked example); the timeline-studio skill points
// here and carries no copy, so edit the UI in this file only.
//
// The sheet is a Vanta-style morph: a persistent bottom PILL (play, the
// clock, a slider, the speed, the expand chevron) that grows into the full
// BOARD on one Apple sheet curve. On the board: one lane per beat — drag a
// block to move it, drag its right edge to stretch it, a Rive-style
// readout rides the cursor while you do; drag empty track (or the
// playhead's head) to scrub, both ways; SHIFT-drag marks a window, which
// opens a NOTE draft. Notes are a keybind, not a button: hover the
// timeline and an amber follower shows the time under the cursor — press
// `n` to drop a note right there (or anywhere on the page, at the clock).
// Notes sync to a JSON file in the repo through `notesUrl`, so the agent
// reads the file instead of pasted state. Hovering a lane's label
// SPOTLIGHTS the element it drives. The bookmark opens the TAKES modal —
// name and save {t, window, timing} snapshots to localStorage, load, copy
// or delete them. `copy` puts the frame's ground truth on the clipboard —
// clock, window, timing, the derived beat map and which beats the window
// touches, the live style of every driven element. Undo (⌘Z) and reset
// are icons. Space pauses. Replay is the scene's own gesture (click it),
// plus every grab replays on release.

import { CentralIcon, type CentralIconProps } from "@central-icons-react/all";
import { createPortal } from "react-dom";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

/* ── The driver contract ─────────────────────────────────────────────
   Three refs the animation reads EVERY FRAME (never as effect deps) and
   a tick the studio's playhead rides. Playback = vt += clamp(dt) × speed;
   pause = speed 0; scrub = assign seekRef. */
export type Hooks = {
  pausedRef: RefObject<boolean>;
  speedRef: RefObject<number>;
  seekRef: RefObject<number | null>;
  onTick: (vt: number) => void;
};

/* ── A lane ──────────────────────────────────────────────────────────
   Bars have a length; markers are a moment. Body drag edits the start,
   the right grip edits the length. `targets` are the selectors the lane
   drives — the spotlight frames them and `copy` reports their live
   style. */
export type Lane<T> = {
  key: string;
  label: string;
  kind: "bar" | "marker";
  start: (T: T) => number;
  length?: (T: T) => number;
  editStart: (T: T, dt: number) => Partial<T>;
  editLength?: (T: T, dt: number) => Partial<T>;
  title: (T: T) => string;
  /** Text drawn inside the bar, e.g. "sweep 3.00s". */
  caption?: (T: T) => string;
  /** Selectors for the element(s) this lane drives. */
  targets?: string[];
  tone?: "ink" | "soft";
};

type Note<T> = {
  id: string;
  at: number;
  window: [number, number] | null;
  text: string;
  timing: T;
  active: string[];
  createdAt: string;
  /** Which take/scene the note belongs to, when a page has several. */
  scope?: string;
};

type SavedTake<T> = {
  id: string;
  name: string;
  t: number;
  window: [number, number] | null;
  timing: T;
};

export type StudioScene<T> = {
  timing: T;
  hooks: Hooks;
  run: number;
  replay: () => void;
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const r2 = (v: number) => Math.round(v * 100) / 100;

/* ── Icons — Central Icons with the product's defaults (round join,
   outlined, radius 1, stroke 1.5), the same wrapper apps/web uses. */
type IconName =
  | "undo"
  | "reset"
  | "bookmark"
  | "copy"
  | "play"
  | "pause"
  | "chevron"
  | "close";
const CENTRAL: Record<
  IconName,
  { name: CentralIconProps["name"]; fill?: CentralIconProps["fill"] }
> = {
  undo: { name: "IconArrowUndoUp" },
  reset: { name: "IconArrowRotateCounterClockwise" },
  bookmark: { name: "IconBookmark" },
  copy: { name: "IconSquareBehindSquare1" },
  play: { name: "IconPlay", fill: "filled" },
  pause: { name: "IconPause", fill: "filled" },
  chevron: { name: "IconChevronTopMedium" },
  close: { name: "IconCrossMedium" },
};
function Icon({ name, size = 14 }: { name: IconName; size?: number }) {
  const glyph = CENTRAL[name];
  return (
    <CentralIcon
      aria-hidden
      className="shrink-0"
      fill={glyph.fill ?? "outlined"}
      join="round"
      name={glyph.name}
      radius="1"
      size={size}
      stroke="1.5"
    />
  );
}

/* ── Tooltip — a dark chip ABOVE the control, in a fixed layer portalled
   to <body> (like the spotlight), so no sheet, clip, or stacking context
   can swallow or shove it. Positioned from the control's own rect when
   the pointer arrives; shows after a beat, hides on leave. Shortcuts ride
   along as a dimmer second word. */
const TIP_DELAY = 300;
function Tip({
  label,
  keys,
  children,
  className = "",
}: {
  label: string;
  keys?: string;
  children: ReactNode;
  /** Placement classes for the wrapper — an absolutely positioned control
   *  puts its position here, not on the button (the wrapper is `relative`
   *  only when nothing else is given). */
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | null>(null);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const show = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const r = ref.current?.getBoundingClientRect();
      if (r) setAt({ x: r.left + r.width / 2, y: r.top - 6 });
    }, TIP_DELAY);
  };
  const hide = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setAt(null);
  };
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );
  return (
    <span
      className={`group/tip inline-flex ${className || "relative"}`}
      onBlur={hide}
      onFocus={show}
      onPointerDown={hide}
      onPointerEnter={show}
      onPointerLeave={hide}
      ref={ref}
    >
      {children}
      {at
        ? createPortal(
            <span
              aria-hidden
              className="pointer-events-none fixed z-[110] flex -translate-x-1/2 -translate-y-full items-center gap-1.5 rounded-[6px] bg-[#1b1d21] px-2 py-1 font-sans text-[11px] leading-none whitespace-nowrap text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
              style={{ left: at.x, top: at.y }}
            >
              {label}
              {keys ? (
                <span className="font-mono text-[10px] text-white/50">
                  {keys}
                </span>
              ) : null}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

export function Studio<T extends Record<string, number>>({
  title,
  lanes,
  defaultTiming,
  total,
  span = 5,
  snapStep = 0.01,
  savesKey,
  notesUrl,
  scope,
  snapshot,
  children,
}: {
  /** The board's eyebrow, e.g. "Timeline · the walk". */
  title: string;
  lanes: Lane<T>[];
  defaultTiming: T;
  /** The pass's full length for a timing — the clock's denominator. */
  total: (T: T) => number;
  /** Seconds across the track. */
  span?: number;
  /** Grid a dragged value snaps to, in seconds. */
  snapStep?: number;
  /** localStorage key for saved takes. */
  savesKey: string;
  /** Route that GETs/POSTs the notes array; omit to keep notes in memory. */
  notesUrl?: string;
  /** Tag written on every note (a take id), so a shared file can be filtered. */
  scope?: string;
  /** Extra page-specific ground truth folded into `copy`. */
  snapshot?: () => Record<string, unknown>;
  children: (scene: StudioScene<T>) => ReactNode;
}) {
  const snap = (v: number) => Math.round(v / snapStep) * snapStep;

  const [timing, setTiming] = useState<T>(defaultTiming);
  // The scene's own timing changed under us (a beat added, renamed or moved
  // in the source, hot-reloaded in): the edited map is keyed by beat index
  // and would now scramble the cut. Re-seed from the new defaults.
  const [seed, setSeed] = useState(defaultTiming);
  if (seed !== defaultTiming && JSON.stringify(seed) !== JSON.stringify(defaultTiming)) {
    setSeed(defaultTiming);
    setTiming(defaultTiming);
  }
  const [run, setRun] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speedStr, setSpeedStr] = useState("1");
  const [range, setRange] = useState<{ a: number; b: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [dragLabel, setDragLabel] = useState<{
    f: number;
    text: string;
  } | null>(null);
  const [hover, setHover] = useState<{ f: number; t: number } | null>(null);
  const [saves, setSaves] = useState<SavedTake<T>[]>([]);
  const [takesOpen, setTakesOpen] = useState(false);
  const [takeName, setTakeName] = useState("");
  // The clock at the moment the modal opened — what a save will stamp.
  const [takeAt, setTakeAt] = useState(0);
  const [notes, setNotes] = useState<Note<T>[]>([]);
  const [draft, setDraft] = useState<{
    text: string;
    at: number;
    window: [number, number] | null;
  } | null>(null);
  const [spot, setSpot] = useState<{
    chain: string;
    detail: string;
    labelX: number;
    labelY: number;
    rects: Array<{ x: number; y: number; w: number; h: number }>;
  } | null>(null);

  const trackRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const lastTRef = useRef(0);
  const pausedRef = useRef(false);
  const speedRef = useRef(1);
  const seekRef = useRef<number | null>(null);
  const historyRef = useRef<T[]>([]);
  const hoverRef = useRef<{ f: number; t: number } | null>(null);
  const takesOpenRef = useRef(false);
  const timingRef = useRef(timing);
  const totalRef = useRef(total);
  useLayoutEffect(() => {
    timingRef.current = timing;
    totalRef.current = total;
    takesOpenRef.current = takesOpen;
  }, [timing, total, takesOpen]);

  const replay = () => {
    pausedRef.current = false;
    setPaused(false);
    setRun((r) => r + 1);
  };
  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };
  const hold = () => {
    pausedRef.current = true;
    setPaused(true);
  };
  // The clock keeps counting after the pass ends (so a late scrub still
  // works); anything that stamps a moment uses the pass's own length.
  const clockAt = () =>
    +Math.min(lastTRef.current, totalRef.current(timingRef.current)).toFixed(3);

  // Undo — every gesture that rewrites the timing (a grab, a reset,
  // loading a take) pushes the outgoing timing first; ⌘Z or the button
  // walks back one step and replays.
  const pushHistory = () => {
    historyRef.current.push({ ...timingRef.current });
    if (historyRef.current.length > 50) historyRef.current.shift();
  };
  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    setTiming(prev);
    replay();
  };
  const reset = () => {
    pushHistory();
    setTiming(defaultTiming);
    replay();
  };

  /* The beat map — every lane's absolute [start, end] for a timing,
     derived exactly the way the lanes draw it. Copied context carries
     it plus which beats overlap the window, so a pasted state names its
     own beats. */
  const beatsFor = (T: T): Record<string, [number, number]> => {
    const out: Record<string, [number, number]> = {};
    for (const lane of lanes) {
      const s = lane.start(T);
      out[lane.key] = [r2(s), r2(s + (lane.length?.(T) ?? 0))];
    }
    return out;
  };
  const contextOf = (t: number, window: [number, number] | null, T: T) => {
    const beats = beatsFor(T);
    const lo = window ? window[0] : t;
    const hi = window ? window[1] : t;
    const active = Object.entries(beats)
      .filter(([, s]) => s[0] <= hi && s[1] >= lo)
      .map(([name]) => name);
    return { t, window, timing: T, beats, active };
  };

  // The spotlight — hovering a lane's label frames the element it drives
  // with an agentation-style overlay: blue box + dark label chip, drawn
  // fixed at z-100 so no mask, scrim, or stacking context can swallow it.
  const spotlight = (lane: Lane<T> | null) => {
    if (!lane?.targets?.length) {
      setSpot(null);
      return;
    }
    const rects: Array<{ x: number; y: number; w: number; h: number }> = [];
    for (const sel of lane.targets) {
      for (const el of document.querySelectorAll<Element>(sel)) {
        const r = el.getBoundingClientRect();
        rects.push({ x: r.x, y: r.y, w: r.width, h: r.height });
      }
    }
    if (!rects.length) {
      setSpot(null);
      return;
    }
    const [lo, hi] = beatsFor(timingRef.current)[lane.key];
    const first = rects[0];
    setSpot({
      chain: lane.targets.join(" "),
      detail: `${lane.label} · ${lo}–${hi}s`,
      labelX: Math.max(
        8,
        Math.min(first.x + first.w + 12, window.innerWidth - 340),
      ),
      labelY: Math.max(8, Math.min(first.y, window.innerHeight - 88)),
      rects,
    });
  };

  // Saved takes — {t, window, timing} snapshots in localStorage. Loaded
  // after mount (never during SSR), kept until cleared.
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(savesKey);
    } catch {}
    if (!raw) return;
    const parsed = JSON.parse(raw) as SavedTake<T>[];
    // Off the effect's own tick, so the read never cascades a render.
    const id = window.setTimeout(() => setSaves(parsed), 0);
    return () => window.clearTimeout(id);
  }, [savesKey]);
  const persistSaves = (next: SavedTake<T>[]) => {
    setSaves(next);
    try {
      localStorage.setItem(savesKey, JSON.stringify(next));
    } catch {}
  };
  const openTakes = () => {
    setTakeName(`take ${saves.length + 1}`);
    setTakeAt(clockAt());
    setTakesOpen(true);
  };
  const saveTake = () => {
    persistSaves([
      ...saves,
      {
        id: new Date().toISOString(),
        name: takeName.trim() || `take ${saves.length + 1}`,
        t: takeAt,
        window: range ? [range.a, range.b] : null,
        timing: { ...timingRef.current },
      },
    ]);
    setTakeName(`take ${saves.length + 2}`);
  };
  const loadTake = (s: SavedTake<T>) => {
    pushHistory();
    // Saved before a beat was added: the new beat keeps its default.
    setTiming({ ...defaultTiming, ...s.timing });
    setRange(s.window ? { a: s.window[0], b: s.window[1] } : null);
    setTakesOpen(false);
    replay();
  };
  const copyTake = (s: SavedTake<T>) => {
    const text = JSON.stringify({
      name: s.name,
      ...contextOf(s.t, s.window, s.timing),
    });
    navigator.clipboard?.writeText(text).catch(() => {});
    console.log("[studio take]", text);
  };

  // Notes — pinned to a t (or the marked window), written through the
  // notes route so the repo file is the source of truth; the page just
  // mirrors it.
  useEffect(() => {
    if (!notesUrl) return;
    fetch(notesUrl, { cache: "no-store" })
      .then((r) => r.json())
      .then((n) => {
        if (Array.isArray(n)) setNotes(n as Note<T>[]);
      })
      .catch(() => {});
  }, [notesUrl]);
  const pushNotes = (next: Note<T>[]) => {
    setNotes(next);
    if (!notesUrl) return;
    fetch(notesUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {});
  };
  // `n` — drop a note. Over the timeline it lands where the cursor is
  // (and seeks there, so the frame under discussion is on stage);
  // anywhere else it lands at the clock, or on the marked window.
  const dropNote = () => {
    hold();
    setOpen(true);
    const at = hoverRef.current?.t;
    if (at != null) {
      seekRef.current = at;
      setDraft({ text: "", at: +at.toFixed(3), window: null });
      return;
    }
    setDraft({
      text: "",
      at: clockAt(),
      window: range ? [range.a, range.b] : null,
    });
  };
  const commitDraft = () => {
    if (!draft || !draft.text.trim()) {
      setDraft(null);
      return;
    }
    const ctx = contextOf(draft.at, draft.window, timingRef.current);
    pushNotes([
      ...notes,
      {
        id: new Date().toISOString(),
        at: draft.at,
        window: draft.window,
        text: draft.text.trim(),
        timing: { ...timingRef.current },
        active: ctx.active,
        createdAt: new Date().toISOString(),
        ...(scope ? { scope } : {}),
      },
    ]);
    setDraft(null);
    // The blue marking has served its purpose — the pinned note's amber
    // span takes over.
    if (draft.window) setRange(null);
  };
  const jumpToNote = (n: Note<T>) => {
    hold();
    seekRef.current = n.at;
    setRange(n.window ? { a: n.window[0], b: n.window[1] } : null);
  };
  const shownNotes = scope
    ? notes.filter((n) => !n.scope || n.scope === scope)
    : notes;

  // The playhead rides the pass's own virtual clock (onTick), so pausing
  // or slowing the pass pauses and slows the line with it. The clock
  // readout makes the timeline addressable — "2.90–3.25" is exact
  // context, since the pass is a pure function of t.
  const hooks = useMemo<Hooks>(
    () => ({
      pausedRef,
      speedRef,
      seekRef,
      onTick: (t) => {
        lastTRef.current = t;
        const line = playRef.current;
        if (line) {
          line.style.left = `${(Math.min(t, span) / span) * 100}%`;
          line.style.opacity = "1";
        }
        if (clockRef.current) {
          const len = totalRef.current(timingRef.current);
          clockRef.current.textContent = `${Math.min(t, len).toFixed(2)} / ${len.toFixed(2)}`;
        }
        // The pill's slider follows the pass; a drag writes back through
        // onChange, so only mirror while the user isn't holding it.
        const slider = sliderRef.current;
        if (slider && document.activeElement !== slider)
          slider.value = String(Math.min(t, span));
      },
    }),
    [span],
  );

  // One copyable line of ground truth: the clock, the marked window, the
  // timing, the derived beat map (with which beats the window touches),
  // and what every driven element is doing right now.
  const copyState = () => {
    const live: Record<string, unknown> = {};
    for (const lane of lanes) {
      if (!lane.targets) continue;
      live[lane.key] = lane.targets.flatMap((sel) =>
        [...document.querySelectorAll<Element>(sel)].map((el) => {
          const cs = getComputedStyle(el);
          return {
            sel,
            opacity: cs.opacity === "" ? 1 : +cs.opacity,
            transform: cs.transform,
            ...(cs.clipPath !== "none" ? { clipPath: cs.clipPath } : {}),
          };
        }),
      );
    }
    const state = {
      ...(scope ? { scope } : {}),
      ...contextOf(
        clockAt(),
        range ? [range.a, range.b] : null,
        timingRef.current,
      ),
      live,
      ...(snapshot ? snapshot() : {}),
    };
    const text = JSON.stringify(state);
    navigator.clipboard?.writeText(text).catch(() => {});
    console.log("[studio state]", text);
  };

  // Keys — space pauses (the analysis gesture), `n` drops a note, ⌘Z
  // walks back a grab, Esc closes the takes modal. None fire from inside
  // an input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.key === "Escape" && takesOpenRef.current) {
        setTakesOpen(false);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        dropNote();
        return;
      }
      if (e.code !== "Space" || e.target !== document.body) return;
      e.preventDefault();
      togglePause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers only touch refs and setters
  }, []);

  /* Scrubbing — drag anywhere on the lanes (the blocks still win their
     own grabs) to seek the pass, both directions. Scrubbing pauses; play
     or space resumes from wherever you left it. SHIFT-drag marks a window
     instead — "target between x and y" — its endpoints magnet to beat
     edges and note points, and releasing a real stretch opens a note
     draft targeted at it. */
  const scrub = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
    const rect = track.getBoundingClientRect();
    const timeAt = (clientX: number) =>
      clamp(((clientX - rect.left) / rect.width) * span, 0, span);
    if (e.shiftKey) {
      const anchors = new Set<number>([0]);
      for (const s of Object.values(beatsFor(timingRef.current))) {
        anchors.add(s[0]);
        anchors.add(s[1]);
      }
      for (const n of shownNotes) {
        anchors.add(n.at);
        if (n.window) {
          anchors.add(n.window[0]);
          anchors.add(n.window[1]);
        }
      }
      const magnet = (t: number) => {
        let best: number | null = null;
        let dist = 0.12;
        for (const p of anchors) {
          const d = Math.abs(p - t);
          if (d < dist) {
            dist = d;
            best = p;
          }
        }
        return best ?? snap(t);
      };
      const a = magnet(timeAt(e.clientX));
      let latest = { a, b: a };
      setRange(latest);
      const onMove = (ev: PointerEvent) => {
        const b = magnet(timeAt(ev.clientX));
        latest = { a: Math.min(a, b), b: Math.max(a, b) };
        setRange(latest);
      };
      const onUp = () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        if (latest.a === latest.b) {
          setRange(null);
          return;
        }
        // Marking a stretch IS starting a comment.
        setOpen(true);
        setDraft({ text: "", at: latest.a, window: [latest.a, latest.b] });
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      return;
    }
    hold();
    const seekTo = (clientX: number) => {
      seekRef.current = timeAt(clientX);
    };
    seekTo(e.clientX);
    const onMove = (ev: PointerEvent) => seekTo(ev.clientX);
    const onUp = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
  };

  // The follower — while the cursor is over the timeline, the time under
  // it is known (and shown), so `n` can drop a note exactly there.
  const follow = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const f = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const next = { f, t: snap(f * span) };
    hoverRef.current = next;
    setHover(next);
  };
  const unfollow = () => {
    hoverRef.current = null;
    setHover(null);
  };

  /* One grab: capture the pointer and the timing at grab-time, turn
     horizontal travel into seconds, replay on release. */
  const grab = (
    e: React.PointerEvent,
    edit: (orig: T, dt: number) => Partial<T>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    pushHistory();
    const el = e.currentTarget as HTMLElement;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
    const startX = e.clientX;
    const orig = { ...timingRef.current };
    const scale = (trackRef.current?.offsetWidth ?? 600) / span;
    const onMove = (ev: PointerEvent) => {
      const delta = edit(orig, (ev.clientX - startX) / scale);
      setTiming({ ...orig, ...delta });
      // Rive-style live readout: the edited value rides the cursor.
      const rect = trackRef.current?.getBoundingClientRect();
      if (rect) {
        setDragLabel({
          f: clamp((ev.clientX - rect.left) / rect.width, 0, 1),
          text: Object.entries(delta)
            .map(([k, v]) => `${k} ${(v as number).toFixed(2)}s`)
            .join(" · "),
        });
      }
    };
    const onUp = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      setDragLabel(null);
      replay();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
  };

  const T = timing;
  const px = (t: number) => `${(t / span) * 100}%`;
  const SHEET = "cubic-bezier(0.32, 0.72, 0, 1)";
  // One shared track geometry: every row (ruler, lanes, playhead overlay)
  // spans [112px, width − 36px].
  const laneLabel =
    "w-[104px] shrink-0 cursor-default text-right font-mono text-[10px] text-text-tertiary transition-colors duration-150 hover:text-text-primary";
  const laneRow =
    "flex items-center gap-2 rounded-[4px] transition-colors duration-150 hover:bg-[rgba(22,25,29,0.03)]";
  const laneTrack =
    "relative h-[24px] flex-1 border-l-[0.5px] border-[rgba(22,25,29,0.08)]";
  // Screen-Studio-style grab affordance: hovering a bar fades in a little
  // white pill on its stretchable edge; the hit zone overhangs the edge.
  const barBase =
    "group absolute top-1/2 h-[16px] min-w-[6px] -translate-y-1/2 cursor-ew-resize touch-none rounded-[5px] transition-[filter] duration-150 hover:brightness-[1.15]";
  const gripBase =
    "absolute top-1/2 -right-[3px] h-[22px] w-[12px] -translate-y-1/2 cursor-ew-resize touch-none";
  const gripPill =
    "pointer-events-none absolute top-1/2 right-[5px] h-[10px] w-[3px] -translate-y-1/2 rounded-full bg-white opacity-0 shadow-[0_0_0_0.5px_rgba(22,25,29,0.3)] transition-opacity duration-150 group-hover:opacity-100";
  const markBase =
    "absolute top-1/2 h-[16px] w-[10px] -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none rounded-[4px] bg-[#242424] transition-transform duration-150 hover:scale-110";
  const iconBtn =
    "flex size-7 cursor-pointer items-center justify-center rounded-full text-text-tertiary transition-colors ease-fast hover:bg-[rgba(22,25,29,0.05)] hover:text-text-primary";
  const chip =
    "flex w-full flex-wrap items-center gap-1.5 rounded-[14px] border-[0.5px] border-[rgba(22,25,29,0.12)] bg-white px-3 py-1.5 shadow-[0_2px_8px_rgba(22,25,29,0.06)]";
  const field =
    "rounded-full border-[0.5px] border-[rgba(22,25,29,0.12)] bg-transparent px-3 py-1 font-sans text-[11px] text-text-primary outline-none focus:border-[#242424]";

  return (
    <>
      {children({ timing, hooks, run, replay })}

      <div data-studio-pill className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        {/* the comment stack — floats above the sheet so notes never
            crowd or reflow the timeline */}
        {open && (draft || shownNotes.length > 0) ? (
          <div
            className="flex flex-col gap-1.5"
            style={{ width: "min(760px, 94vw)" }}
          >
            {shownNotes.length ? (
              <div className={chip}>
                {shownNotes.map((n) => (
                  <span
                    className="flex items-center gap-1.5 rounded-full border-[0.5px] border-[#d97706]/30 bg-[#d97706]/5 px-2 py-0.5 font-mono text-[10px]"
                    key={n.id}
                  >
                    <button
                      className="cursor-pointer text-text-secondary transition-colors ease-fast hover:text-text-primary"
                      onClick={() => jumpToNote(n)}
                      title={n.text}
                      type="button"
                    >
                      {n.window
                        ? `${n.window[0].toFixed(2)}–${n.window[1].toFixed(2)}s`
                        : `${n.at.toFixed(2)}s`}
                      {" · "}
                      {n.text.length > 26 ? `${n.text.slice(0, 26)}…` : n.text}
                    </button>
                    <button
                      className="cursor-pointer text-text-tertiary transition-colors ease-fast hover:text-text-primary"
                      onClick={() =>
                        pushNotes(notes.filter((x) => x.id !== n.id))
                      }
                      type="button"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <Tip label="Clear all notes">
                  <button
                    className="ml-auto flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-[13px] text-text-tertiary transition-colors ease-fast hover:bg-[rgba(22,25,29,0.05)] hover:text-text-primary"
                    onClick={() =>
                      pushNotes(
                        notes.filter(
                          (n) => scope && n.scope && n.scope !== scope,
                        ),
                      )
                    }
                    aria-label="Clear all notes"
                    type="button"
                  >
                    ×
                  </button>
                </Tip>
              </div>
            ) : null}
            {draft ? (
              <div className="flex w-full items-center gap-2 rounded-[14px] border-[0.5px] border-[rgba(22,25,29,0.12)] bg-white px-3 py-1.5 shadow-[0_2px_8px_rgba(22,25,29,0.06)]">
                <span className="shrink-0 font-mono text-[10px] text-[#d97706]">
                  note @{" "}
                  {draft.window
                    ? `${draft.window[0].toFixed(2)}–${draft.window[1].toFixed(2)}s`
                    : `${draft.at.toFixed(2)}s`}
                </span>
                <input
                  autoFocus
                  className={`flex-1 ${field} focus:border-[#d97706]`}
                  onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitDraft();
                    if (e.key === "Escape") setDraft(null);
                  }}
                  placeholder="what should Claude know about this stretch? Enter saves, Esc cancels"
                  value={draft.text}
                />
                <button
                  className="shrink-0 cursor-pointer rounded-full bg-[#d97706] px-2.5 py-1 font-sans text-[11px] text-white transition-transform ease-fast hover:scale-[1.03]"
                  onClick={commitDraft}
                  type="button"
                >
                  pin
                </button>
                <button
                  className="shrink-0 cursor-pointer font-sans text-[11px] text-text-tertiary transition-colors ease-fast hover:text-text-primary"
                  onClick={() => setDraft(null)}
                  type="button"
                >
                  ×
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* the sheet — pill and board share one morph */}
        <div
          className="select-none border-[0.5px] border-[rgba(22,25,29,0.12)] bg-white shadow-[0_2px_8px_rgba(22,25,29,0.06)]"
          style={{
            width: open ? "min(760px, 94vw)" : 384,
            borderRadius: open ? 14 : 24,
            transition: `width 0.55s ${SHEET}, border-radius 0.55s ${SHEET}`,
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateRows: open ? "1fr" : "0fr",
              transition: `grid-template-rows 0.55s ${SHEET}`,
            }}
          >
            <div className="min-h-0 overflow-clip">
              <div
                className="p-4 pb-2"
                style={{
                  width: "min(760px, 94vw)",
                  opacity: open ? 1 : 0,
                  transition: open
                    ? "opacity 0.35s ease 0.15s"
                    : "opacity 0.2s ease",
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
                    {title}
                  </span>
                  {range ? (
                    <span className="font-mono text-[10px] text-[#2563eb]">
                      {range.a.toFixed(2)}–{range.b.toFixed(2)}s
                    </span>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <Tip label="Undo the last grab" keys="⌘Z">
                      <button
                        className={iconBtn}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          undo();
                        }}
                        aria-label="Undo the last grab"
                        type="button"
                      >
                        <Icon name="undo" />
                      </button>
                    </Tip>
                    <Tip label="Reset the timing">
                      <button
                        className={iconBtn}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          reset();
                        }}
                        aria-label="Reset the timing"
                        type="button"
                      >
                        <Icon name="reset" />
                      </button>
                    </Tip>
                    <span className="mx-1 h-4 w-px bg-[rgba(22,25,29,0.1)]" />
                    <Tip label="Copy this frame as context">
                      <button
                        className={iconBtn}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          copyState();
                        }}
                        aria-label="Copy this frame as context"
                        type="button"
                      >
                        <Icon name="copy" />
                      </button>
                    </Tip>
                    <Tip label="Takes">
                      <button
                        className={`${iconBtn} ${saves.length ? "text-text-secondary" : ""}`}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          openTakes();
                        }}
                        aria-label="takes"
                        type="button"
                      >
                        <Icon name="bookmark" />
                      </button>
                    </Tip>
                  </div>
                </div>

                <div
                  className="relative cursor-ew-resize touch-none pr-9"
                  onPointerDown={scrub}
                  onPointerLeave={unfollow}
                  onPointerMove={follow}
                >
                  {/* the ruler */}
                  <div className="flex items-center gap-2">
                    <span className={laneLabel} />
                    <div className="relative h-[16px] flex-1" ref={trackRef}>
                      {Array.from({ length: span + 1 }, (_, s) => (
                        <span key={s}>
                          <span
                            className="absolute top-0 font-mono text-[9px] text-text-tertiary"
                            style={{ left: px(s) }}
                          >
                            {s}
                          </span>
                          <span
                            className="absolute bottom-0 h-[4px] w-px bg-[rgba(22,25,29,0.18)]"
                            style={{ left: px(s) }}
                          />
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* the lanes */}
                  {lanes.map((lane) => (
                    <div className={laneRow} key={lane.key}>
                      <span
                        className={laneLabel}
                        onPointerEnter={() => spotlight(lane)}
                        onPointerLeave={() => spotlight(null)}
                      >
                        {lane.label}
                      </span>
                      <div className={laneTrack}>
                        {lane.kind === "bar" ? (
                          <div
                            className={`${barBase} ${lane.tone === "soft" ? "bg-black/20" : "bg-[#242424]"}`}
                            onPointerDown={(e) => grab(e, lane.editStart)}
                            style={{
                              left: px(lane.start(T)),
                              width: px(lane.length?.(T) ?? 0),
                            }}
                            title={lane.title(T)}
                          >
                            {lane.caption ? (
                              <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 font-mono text-[9px] whitespace-nowrap text-white/60">
                                {lane.caption(T)}
                              </span>
                            ) : null}
                            {lane.editLength ? (
                              <div
                                className={gripBase}
                                onPointerDown={(e) => grab(e, lane.editLength!)}
                              >
                                <div className={gripPill} />
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div
                            className={markBase}
                            onPointerDown={(e) => grab(e, lane.editStart)}
                            style={{ left: px(lane.start(T)) }}
                            title={lane.title(T)}
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* the playhead, the marked window, the pinned notes,
                      and the note follower under the cursor */}
                  <div className="pointer-events-none absolute inset-y-0 right-9 left-[112px]">
                    {shownNotes.map((n) =>
                      n.window ? (
                        <div
                          className="absolute inset-y-0 border-x border-[#d97706]/40 bg-[#d97706]/8"
                          key={n.id}
                          style={{
                            left: px(n.window[0]),
                            width: px(n.window[1] - n.window[0]),
                          }}
                        />
                      ) : (
                        <div
                          className="absolute top-0 h-[10px] w-[2px] bg-[#d97706]"
                          key={n.id}
                          style={{ left: px(Math.min(n.at, span)) }}
                        />
                      ),
                    )}
                    {range ? (
                      <div
                        className="absolute inset-y-0 border-x border-[#2563eb]/40 bg-[#2563eb]/8"
                        style={{
                          left: px(range.a),
                          width: px(range.b - range.a),
                        }}
                      />
                    ) : null}
                    {hover && !dragLabel ? (
                      <div
                        className="absolute inset-y-0 w-px border-l border-dashed border-[#d97706]/50"
                        style={{ left: `${hover.f * 100}%` }}
                      >
                        <div
                          className="absolute top-0 left-0 flex -translate-x-1/2 items-center gap-1 rounded-[6px] bg-[#d97706] px-1.5 py-0.5 font-mono text-[9px] whitespace-nowrap text-white shadow-[0_2px_8px_rgba(217,119,6,0.3)]"
                          style={{
                            transform: "translate(-50%, calc(-100% - 4px))",
                          }}
                        >
                          <span className="rounded-[3px] bg-white/25 px-1">
                            n
                          </span>
                          {hover.t.toFixed(2)}s
                        </div>
                      </div>
                    ) : null}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-[#2563eb]"
                      ref={playRef}
                      style={{ left: 0, opacity: 0 }}
                    >
                      {/* the playhead's grab head — rides the ruler, drags like Rive's */}
                      <div
                        className="pointer-events-auto absolute top-0 left-1/2 h-[12px] w-[8px] -translate-x-1/2 cursor-ew-resize rounded-[2.5px] bg-[#2563eb] shadow-[0_1px_3px_rgba(37,99,235,0.4)]"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          scrub(e);
                        }}
                      />
                    </div>
                    {dragLabel ? (
                      <div
                        className="absolute top-0 rounded-[6px] bg-[#1b1d21] px-2 py-0.5 font-mono text-[10px] whitespace-nowrap text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                        style={{
                          left: `${dragLabel.f * 100}%`,
                          transform: "translate(-50%, calc(-100% - 4px))",
                        }}
                      >
                        {dragLabel.text}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* the pill — always present: play, the clock (hover it for the speed), the slider, and the
              speed, and the expand chevron */}
          <div
            className={`relative h-[48px] ${open ? "border-t-[0.5px] border-[rgba(22,25,29,0.08)]" : ""}`}
          >
            <Tip
              className="absolute top-1/2 left-4 -translate-y-1/2"
              keys="space"
              label="Play / pause"
            >
              <button
                className="flex size-7 cursor-pointer items-center justify-center rounded-full text-[#242424] transition-transform ease-fast hover:scale-110"
                onClick={(e) => {
                  e.currentTarget.blur();
                  togglePause();
                }}
                aria-label="play or pause"
                type="button"
              >
                <Icon name={paused ? "play" : "pause"} />
              </button>
            </Tip>
            {/* the clock — hover it and the speed field appears beside it */}
            <div className="group/clock absolute top-1/2 left-[52px] flex h-7 -translate-y-1/2 items-center">
              <span
                className="w-[68px] font-mono text-[10px] text-text-secondary"
                ref={clockRef}
              >
                0.00 / 0.00
              </span>
              <Tip label="Playback speed">
                <label className="flex items-center font-mono text-[10px] text-text-tertiary opacity-0 transition-opacity duration-150 group-hover/clock:opacity-100 focus-within:opacity-100">
                  <input
                    className="w-7 bg-transparent text-right text-text-secondary outline-none focus:text-text-primary"
                    max={4}
                    min={0.05}
                    onChange={(e) => {
                      setSpeedStr(e.target.value);
                      const f = Number.parseFloat(e.target.value);
                      if (Number.isFinite(f) && f > 0)
                        speedRef.current = clamp(f, 0.05, 4);
                    }}
                    step={0.05}
                    type="number"
                    value={speedStr}
                  />
                  ×
                </label>
              </Tip>
            </div>
            <input
              aria-label="scrub"
              className="absolute top-1/2 right-[45px] left-[168px] h-[3px] -translate-y-1/2 cursor-ew-resize accent-[#242424]"
              defaultValue={0}
              max={span}
              min={0}
              onChange={(e) => {
                seekRef.current = +e.target.value;
              }}
              onPointerDown={hold}
              ref={sliderRef}
              step={0.01}
              type="range"
            />
            <Tip
              className="absolute top-1/2 right-3 -translate-y-1/2"
              label="Timeline"
            >
              <button
                className={iconBtn}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setOpen((o) => !o);
                }}
                aria-label="toggle the board"
                type="button"
              >
                <span
                  style={{
                    display: "flex",
                    transform: open ? "rotate(180deg)" : "none",
                    transition: `transform 0.55s ${SHEET}`,
                  }}
                >
                  <Icon name="chevron" />
                </span>
              </button>
            </Tip>
          </div>
        </div>
      </div>

      {/* the takes modal — name and save the current timing, or bring one
          back. Esc or the scrim closes it. */}
      {takesOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(22,25,29,0.18)]"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setTakesOpen(false);
          }}
        >
          <div className="w-[min(440px,92vw)] rounded-[14px] border-[0.5px] border-[rgba(22,25,29,0.12)] bg-white p-4 shadow-[0_8px_32px_rgba(22,25,29,0.12)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
                Takes · {title.replace(/^timeline\s*·\s*/i, "")}
              </span>
              <Tip label="Close" keys="esc">
                <button
                  className={iconBtn}
                  onClick={() => setTakesOpen(false)}
                  aria-label="Close"
                  type="button"
                >
                  <Icon name="close" />
                </button>
              </Tip>
            </div>
            <div className="flex items-center gap-2">
              <input
                autoFocus
                className={`flex-1 ${field}`}
                onChange={(e) => setTakeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTake();
                  if (e.key === "Escape") setTakesOpen(false);
                }}
                placeholder="name this take"
                value={takeName}
              />
              <button
                className="shrink-0 cursor-pointer rounded-full bg-[#242424] px-3 py-1 font-sans text-[11px] text-white/90 transition-transform ease-fast hover:scale-[1.03]"
                onClick={saveTake}
                type="button"
              >
                save
              </button>
            </div>
            <p className="mt-1.5 font-mono text-[9px] text-text-tertiary">
              saves the current timing with t {takeAt.toFixed(2)}s
              {range
                ? ` and the window ${range.a.toFixed(2)}–${range.b.toFixed(2)}s`
                : ""}
            </p>
            {saves.length ? (
              <ul className="mt-3 flex flex-col divide-y divide-[rgba(22,25,29,0.06)] border-t-[0.5px] border-[rgba(22,25,29,0.08)]">
                {saves.map((s) => (
                  <li className="flex items-center gap-3 py-2" key={s.id}>
                    <button
                      className="flex-1 cursor-pointer text-left font-sans text-[12px] text-text-primary transition-colors ease-fast hover:text-[#2563eb]"
                      onClick={() => loadTake(s)}
                      title="load this take"
                      type="button"
                    >
                      {s.name}
                      <span className="ml-2 font-mono text-[10px] text-text-tertiary">
                        t {s.t.toFixed(2)}s
                        {s.window
                          ? ` · ${s.window[0].toFixed(2)}–${s.window[1].toFixed(2)}s`
                          : ""}
                      </span>
                    </button>
                    <button
                      className="cursor-pointer font-mono text-[10px] text-text-tertiary transition-colors ease-fast hover:text-text-primary"
                      onClick={() => copyTake(s)}
                      title="copy this take as context"
                      type="button"
                    >
                      copy
                    </button>
                    <Tip label="Delete this take">
                      <button
                        className={iconBtn}
                        onClick={() =>
                          persistSaves(saves.filter((x) => x.id !== s.id))
                        }
                        aria-label="Delete this take"
                        type="button"
                      >
                        <Icon name="close" />
                      </button>
                    </Tip>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 font-sans text-[12px] text-text-tertiary">
                No takes saved yet.
              </p>
            )}
            {saves.length > 1 ? (
              <button
                className="mt-2 cursor-pointer font-mono text-[10px] text-text-tertiary transition-colors ease-fast hover:text-text-primary"
                onClick={() => persistSaves([])}
                type="button"
              >
                clear all
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {spot ? (
        <div className="pointer-events-none fixed inset-0 z-[100]">
          {spot.rects.map((r) => (
            <div
              className="absolute rounded-[8px] border-2 border-[#69a5ff] bg-[#69a5ff]/10"
              key={`${r.x},${r.y},${r.w}`}
              style={{
                left: r.x - 4,
                top: r.y - 4,
                width: r.w + 8,
                height: r.h + 8,
              }}
            />
          ))}
          <div
            className="absolute max-w-[420px] rounded-[10px] bg-[#1b1d21] px-4 py-2.5 font-sans text-[13px] leading-snug shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
            style={{ left: spot.labelX, top: spot.labelY }}
          >
            <div className="whitespace-nowrap text-white/50">{spot.chain}</div>
            <div className="whitespace-nowrap text-white">{spot.detail}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
