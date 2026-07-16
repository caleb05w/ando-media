"use client";

/* Multi-select interaction — Notion-style block selection.
   Self-contained: no external UI deps, CSS-only motion (multi-select.css).

   The gesture contract:
   - The moment a drag crosses from one message into a second
     (`SELECT_THRESHOLD` = 1), it converts into block selection: spanned
     messages tint blue and live-track the drag (grow and shrink). On release
     the native text highlight clears and the blocks stay selected. A drag
     within a single message stays plain text selection.
   - Clicking a selected (blue) message unselects just that message. Pressing
     Esc, or clicking anything that isn't selected, unselects everything.
   - Dragging more text while active adds the spanned messages. Holding a
     drag near the list's top/bottom edge auto-scrolls it.
   - Shift-clicking a message selects the whole range between it and the
     last toggled message (additive).
   - The bar: the count button ("N selected") opens a selection-preview card
     (hover peeks, ✕ removes, click jumps); "Copy as" writes the clipboard
     and rolls to "Copied!"; "More actions" (⇧E) holds Send to Agent +
     Forward. */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DemoMessage } from "./data";

const SELECT_THRESHOLD = 1;
// Hysteresis: once block selection engages, shrinking the drag back releases
// rows down to a single message (not back out to text selection) — only
// leaving every message deselects.
const RELEASE_THRESHOLD = 0;
// Covers the bar's exit plus the staggered 350ms wash fade-out
// (350ms + last row's transition delay), so teardown never truncates it.
const EXIT_MS = 560;
const COPIED_TIMEOUT_MS = 1800;
const COMPOSER_GAP_PX = 12;

export type MultiSelectPhase = "idle" | "active";

type MultiSelectState = {
  phase: MultiSelectPhase;
  exiting: boolean;
  selectedIds: string[];
  peekId: string | null;
};

function rowsSpannedBySelection(selection: Selection): string[] {
  const ids: string[] = [];
  document.querySelectorAll("[data-msg-id]").forEach((element) => {
    if (!selection.containsNode(element, true)) return;
    const id = element.getAttribute("data-msg-id");
    if (id != null) ids.push(id);
  });
  return ids;
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

export function useMultiSelect(messages: DemoMessage[]) {
  const [state, setState] = useState<MultiSelectState>({
    phase: "idle",
    exiting: false,
    selectedIds: [],
    peekId: null,
  });
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  // Whether the in-flight drag started from idle (live-tracks the spanned
  // set) or on top of an existing selection (appends to it).
  const dragOriginRef = useRef<"fresh" | "additive" | null>(null);
  const exitTimerRef = useRef(0);

  const finalize = useCallback(() => {
    setState({
      phase: "idle",
      exiting: false,
      selectedIds: [],
      peekId: null,
    });
    window.getSelection()?.removeAllRanges();
  }, []);

  // Hard clear with the animated teardown window (bar fades out).
  const clearAll = useCallback(() => {
    if (stateRef.current.phase === "idle" || stateRef.current.exiting) return;
    setState((s) => ({ ...s, exiting: true }));
    window.clearTimeout(exitTimerRef.current);
    exitTimerRef.current = window.setTimeout(finalize, EXIT_MS);
  }, [finalize]);

  // Anchor for shift-click range selection: the last individually toggled row.
  const rangeAnchorRef = useRef<string | null>(null);

  const toggleRow = useCallback(
    (id: string) => {
      rangeAnchorRef.current = id;
      const current = stateRef.current.selectedIds;
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      if (next.length === 0) {
        clearAll();
        return;
      }
      setState((s) => ({ ...s, selectedIds: next }));
    },
    [clearAll]
  );

  // Shift-click: select everything between the anchor and this row
  // (inclusive, additive — Gmail/Finder semantics), then re-anchor here.
  const selectRangeTo = useCallback(
    (id: string) => {
      const anchor = rangeAnchorRef.current;
      const order = messages.map((m) => m.id);
      const from = anchor == null ? -1 : order.indexOf(anchor);
      const to = order.indexOf(id);
      if (from < 0 || to < 0 || anchor === id) {
        toggleRow(id);
        return;
      }
      const [lo, hi] = from < to ? [from, to] : [to, from];
      const rangeIds = order.slice(lo, hi + 1);
      rangeAnchorRef.current = id;
      setState((s) => {
        const additions = rangeIds.filter((x) => !s.selectedIds.includes(x));
        if (additions.length === 0) return s;
        return { ...s, selectedIds: [...s.selectedIds, ...additions] };
      });
    },
    [messages, toggleRow]
  );

  // Native drag detection (rAF-throttled selectionchange).
  useEffect(() => {
    let frame = 0;
    const evaluate = () => {
      const s = stateRef.current;
      if (s.exiting) return;
      const selection = window.getSelection();
      const hasText =
        selection != null &&
        !selection.isCollapsed &&
        selection.toString().trim().length > 0;

      if (!hasText) {
        dragOriginRef.current = null;
        return;
      }
      if (dragOriginRef.current == null) {
        dragOriginRef.current = s.phase === "active" ? "additive" : "fresh";
      }
      const spanned = rowsSpannedBySelection(selection);

      if (dragOriginRef.current === "fresh") {
        // Live-track the drag. Entry and exit thresholds differ (hysteresis):
        // engaging takes >SELECT_THRESHOLD spanned messages, but once active
        // the selection tracks down to >RELEASE_THRESHOLD — dragging back up
        // frees rows one at a time without collapsing the whole selection.
        const threshold =
          s.phase === "active" ? RELEASE_THRESHOLD : SELECT_THRESHOLD;
        if (spanned.length > threshold) {
          if (s.phase !== "active" || !sameIds(s.selectedIds, spanned)) {
            setState((prev) => ({
              ...prev,
              phase: "active",
              selectedIds: spanned,
            }));
          }
        } else if (s.phase === "active") {
          setState((prev) => ({ ...prev, phase: "idle", selectedIds: [] }));
        }
        return;
      }

      // Additive drag on top of an existing selection.
      const additions = spanned.filter((id) => !s.selectedIds.includes(id));
      if (additions.length > 0) {
        setState((prev) => ({
          ...prev,
          selectedIds: [...prev.selectedIds, ...additions],
        }));
      }
    };
    const onSelectionChange = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        evaluate();
      });
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Edge auto-scroll: while a selection drag holds near the top/bottom of
  // the message list, scroll it (speed ramps with edge proximity) and keep
  // extending the native selection to the caret under the pointer.
  useEffect(() => {
    const EDGE_PX = 56;
    const MAX_STEP_PX = 16;
    let pointerX = 0;
    let pointerY = 0;
    let dragging = false;
    let frame = 0;

    const step = () => {
      frame = 0;
      if (!dragging) return;
      const container = document.querySelector<HTMLElement>(".ms-messages");
      const selection = window.getSelection();
      if (container != null && selection != null && !selection.isCollapsed) {
        const rect = container.getBoundingClientRect();
        let delta = 0;
        if (pointerY < rect.top + EDGE_PX) {
          delta = -Math.ceil(((rect.top + EDGE_PX - pointerY) / EDGE_PX) * MAX_STEP_PX);
        } else if (pointerY > rect.bottom - EDGE_PX) {
          delta = Math.ceil(((pointerY - (rect.bottom - EDGE_PX)) / EDGE_PX) * MAX_STEP_PX);
        }
        if (delta !== 0) {
          container.scrollTop += delta;
          const doc = document as Document & {
            caretRangeFromPoint?: (x: number, y: number) => Range | null;
          };
          const clampedY = Math.min(
            Math.max(pointerY, rect.top + 1),
            rect.bottom - 1
          );
          const caret = doc.caretRangeFromPoint?.(pointerX, clampedY);
          if (caret != null) {
            try {
              selection.extend(caret.startContainer, caret.startOffset);
            } catch {
              // Cross-boundary carets can be unextendable; skip the tick.
            }
          }
        }
      }
      frame = window.requestAnimationFrame(step);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target == null || target.closest(".ms-messages") == null) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      dragging = true;
      if (frame === 0) frame = window.requestAnimationFrame(step);
    };
    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    };
    const onPointerUp = () => {
      dragging = false;
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Release: once a selecting drag ends, drop the native text highlight so
  // the selection reads as the blue blocks. Deferred a tick so the click
  // that ends the drag still sees a live selection (and doesn't clear all).
  useEffect(() => {
    const onPointerUp = () => {
      if (stateRef.current.phase !== "active") return;
      const selection = window.getSelection();
      if (selection == null || selection.isCollapsed) return;
      window.setTimeout(() => {
        window.getSelection()?.removeAllRanges();
        dragOriginRef.current = null;
      }, 0);
    };
    document.addEventListener("pointerup", onPointerUp);
    return () => document.removeEventListener("pointerup", onPointerUp);
  }, []);

  // Click routing while active: shift-click a message → range select;
  // selected block → unselect it; the bar handles itself; anything else →
  // clear all.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const s = stateRef.current;
      if (s.phase !== "active" || s.exiting) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target == null) return;
      // A click that ends a drag still carries the live selection — keep it.
      const selection = window.getSelection();
      if (selection != null && !selection.isCollapsed) return;
      if (target.closest("[data-ms-bar]") != null) return;
      const row = target.closest("[data-msg-id]");
      const id = row?.getAttribute("data-msg-id") ?? null;
      if (id != null && event.shiftKey) {
        selectRangeTo(id);
        return;
      }
      if (id != null && s.selectedIds.includes(id)) {
        toggleRow(id);
        return;
      }
      clearAll();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [clearAll, toggleRow, selectRangeTo]);

  // Esc = hard clear.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target instanceof Element ? event.target : null;
      if (
        target != null &&
        target.closest('input, textarea, [contenteditable="true"]') != null
      ) {
        return;
      }
      if (stateRef.current.phase !== "idle") clearAll();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [clearAll]);

  const setPeekId = useCallback((peekId: string | null) => {
    setState((s) => (s.peekId === peekId ? s : { ...s, peekId }));
  }, []);

  const selectedMessages = useMemo(
    () =>
      state.selectedIds
        .map((id) => messages.find((m) => m.id === id))
        .filter((m): m is DemoMessage => m != null),
    [state.selectedIds, messages]
  );

  return {
    state,
    selectedMessages,
    clearAll,
    toggleRow,
    setPeekId,
  };
}

function messagePlainText(message: DemoMessage): string {
  return message.body
    .map((paragraph) => paragraph.map((segment) => segment.text).join(""))
    .join("\n");
}

const COPY_FORMATS = ["Preview text", "JSON", "Message links"] as const;

// A/B variants under test: "popout" keeps Send to Agent / Forward in a menu;
// "commandbar" cuts the pill itself into an inline action bar on ⇧E (the
// pre-popout interaction).
export type MultiSelectVariant = "popout" | "commandbar";

export function MultiSelectBar({
  state,
  variant,
  selectedMessages,
  onClear,
  onRemove,
  onPeek,
  onForward,
  onSendToAgent,
}: {
  state: MultiSelectState;
  variant: MultiSelectVariant;
  selectedMessages: DemoMessage[];
  onClear: () => void;
  onRemove: (id: string) => void;
  onPeek: (id: string | null) => void;
  onForward: (count: number) => void;
  onSendToAgent: (count: number) => void;
}) {
  const { exiting, selectedIds } = state;
  const count = selectedIds.length;

  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const copiedTimerRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const positionerRef = useRef<HTMLDivElement>(null);
  const actionsClipRef = useRef<HTMLSpanElement>(null);
  const actionsContentRef = useRef<HTMLSpanElement>(null);

  // The bar floats 12px above the composer (measured, like the lab overlay).
  // Written straight to the element so no render depends on it.
  useLayoutEffect(() => {
    const update = () => {
      const composer = document.querySelector("[data-composer-region]");
      const positioner = positionerRef.current;
      if (composer == null || positioner == null) return;
      const top = composer.getBoundingClientRect().top;
      positioner.style.bottom = `${Math.max(0, window.innerHeight - top + COMPOSER_GAP_PX)}px`;
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(copiedTimerRef.current);
  }, []);

  // Commandbar variant: the actions region swaps content instantly while its
  // width glides on the lab's tiny-fluff curve. The width is measured off the
  // natural-size inner span and written straight to the clip element, so no
  // render depends on it. First write lands pre-paint → no enter animation.
  useLayoutEffect(() => {
    if (variant !== "commandbar") return;
    const clip = actionsClipRef.current;
    const content = actionsContentRef.current;
    if (clip == null || content == null) return;
    clip.style.width = `${content.offsetWidth}px`;
  }, [variant, actionsExpanded]);

  // More actions: a chevron menu in the popout variant; in the commandbar
  // variant it cuts the pill between collapsed and inline-actions states,
  // with ⇧E as its shortcut (commandbar only).
  const toggleMoreActions = useCallback(() => {
    setPreviewOpen(false);
    setCopyMenuOpen(false);
    if (variant === "popout") {
      setMoreMenuOpen((open) => !open);
    } else {
      setMoreMenuOpen(false);
      setActionsExpanded((expanded) => !expanded);
    }
  }, [variant]);

  useEffect(() => {
    if (variant !== "commandbar") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "E" ||
        !event.shiftKey ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      if (
        target != null &&
        target.closest('input, textarea, [contenteditable="true"]') != null
      ) {
        return;
      }
      event.preventDefault();
      toggleMoreActions();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [variant, toggleMoreActions]);

  // Outside pointer-down closes the popovers.
  useEffect(() => {
    if (!copyMenuOpen && !previewOpen && !moreMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (barRef.current?.contains(event.target as Node)) return;
      setCopyMenuOpen(false);
      setMoreMenuOpen(false);
      setPreviewOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [copyMenuOpen, previewOpen, moreMenuOpen]);

  const onCopyFormat = useCallback(() => {
    const text = selectedMessages.map(messagePlainText).join("\n\n");
    void navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopyMenuOpen(false);
    setCopied(true);
    window.clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(
      () => setCopied(false),
      COPIED_TIMEOUT_MS
    );
  }, [selectedMessages]);

  const jumpToMessage = useCallback((id: string) => {
    document
      .querySelector(`[data-msg-id="${id}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  return (
    <div
      ref={positionerRef}
      data-ms-bar
      className="pointer-events-none absolute left-1/2 z-40 -translate-x-1/2"
      style={{ bottom: 96 }}
    >
      <div
        ref={barRef}
        className={`pointer-events-auto relative ${exiting ? "ms-bar-exit" : "ms-bar-enter"}`}
      >
        {/* Selection preview card (opened from the count button). */}
        {previewOpen && !copyMenuOpen && !moreMenuOpen && !exiting ? (
          <div className="ms-pop-enter absolute bottom-full left-1/2 mb-1.5 w-[min(360px,calc(100vw-32px))] -translate-x-1/2 rounded-[10px] bg-[#1a1817] p-1 text-white shadow-[0px_2px_12px_0px_rgba(16,16,16,0.24),0px_16px_24px_-12px_rgba(16,16,16,0.24)]">
          <div className="max-h-80 overflow-y-auto">
              {selectedMessages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => jumpToMessage(message.id)}
                  onPointerEnter={() => onPeek(message.id)}
                  onPointerLeave={() => onPeek(null)}
                  className="group/row relative flex cursor-pointer items-start gap-2.5 rounded-md py-2 pl-2 pr-8 transition-colors hover:bg-white/10"
                >
                  <span className="mt-0.5 shrink-0">
                    <SilhouetteGlyph size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-[12px] font-medium leading-4 text-white">
                        {message.author.name}
                      </span>
                      <span className="text-[11px] leading-[14px] text-white/50">
                        {message.time}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[12px] leading-4 text-white/70">
                      {messagePlainText(message)}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label="Remove from selection"
                    onClick={(event) => {
                      event.stopPropagation();
                      onPeek(null);
                      onRemove(message.id);
                    }}
                    className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md text-white/60 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover/row:opacity-100"
                  >
                    <CrossGlyph />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* The pill. */}
        <div className="flex items-center gap-1.5 rounded-[10px] bg-[#1a1817] px-2 py-1 text-white shadow-[0px_2px_12px_0px_rgba(16,16,16,0.2),0px_16px_24px_-12px_rgba(16,16,16,0.2)]">
          <button
            type="button"
            aria-expanded={previewOpen}
            onClick={() => setPreviewOpen((open) => !open)}
            className={`flex h-8 items-center whitespace-nowrap rounded-md pl-2 pr-3 text-[14px] leading-5 transition-colors hover:bg-white/10 ${previewOpen ? "bg-white/10" : ""}`}
          >
            <span key={count} className="ms-roll-in inline-flex tabular-nums">
              {count}
            </span>
            &nbsp;selected
          </button>

          <span className="h-5 w-px shrink-0 bg-white/20" />

          {/* Copy as ⌄ — rolls to "Copied!" after a format is picked. */}
          <span className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={copyMenuOpen}
              onClick={() => {
                setPreviewOpen(false);
                setMoreMenuOpen(false);
                setCopyMenuOpen((open) => !open);
              }}
              className={`flex h-8 items-center gap-1.5 rounded-md pl-1.5 pr-2.5 text-[14px] leading-5 transition-colors hover:bg-white/10 ${copyMenuOpen ? "bg-white/10" : ""}`}
            >
              <span className="relative size-4 overflow-hidden">
                <span
                  className="absolute left-0 top-0 flex flex-col transition-transform duration-200"
                  style={{
                    transform: copied ? "translateY(-16px)" : "translateY(0)",
                  }}
                >
                  <span className="flex size-4 items-center justify-center">
                    <CopyGlyph />
                  </span>
                  <span className="flex size-4 items-center justify-center">
                    <CheckGlyph />
                  </span>
                </span>
              </span>
              <span className="relative inline-grid h-6 items-center overflow-hidden">
                <span
                  aria-hidden
                  className="invisible col-start-1 row-start-1 flex h-6 items-center whitespace-nowrap"
                >
                  Copied!
                </span>
                <span
                  className="col-start-1 row-start-1 flex flex-col whitespace-nowrap transition-transform duration-200"
                  style={{
                    transform: copied ? "translateY(-24px)" : "translateY(0)",
                  }}
                >
                  <span className="flex h-6 items-center">Copy as</span>
                  <span className="flex h-6 items-center">Copied!</span>
                </span>
              </span>
              <span
                className="flex transition-transform duration-150"
                style={{
                  transform: copyMenuOpen ? "rotate(180deg)" : "rotate(0)",
                }}
              >
                <ChevronDownGlyph />
              </span>
            </button>
            {copyMenuOpen && !exiting ? (
              <div
                role="menu"
                className="ms-pop-enter absolute bottom-full right-0 mb-1.5 w-max min-w-44 rounded-[10px] bg-[#1a1817] p-1 text-white shadow-[0px_2px_12px_0px_rgba(16,16,16,0.24),0px_16px_24px_-12px_rgba(16,16,16,0.24)]"
              >
                <div className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-white/50">
                  Copy as
                </div>
                {COPY_FORMATS.map((format) => (
                  <button
                    key={format}
                    type="button"
                    role="menuitem"
                    onClick={onCopyFormat}
                    className="flex h-8 w-full items-center gap-1.5 whitespace-nowrap rounded-md pl-1.5 pr-3 text-left text-[14px] leading-5 transition-colors hover:bg-white/10"
                  >
                    <FormatGlyph />
                    {format}
                  </button>
                ))}
              </div>
            ) : null}
          </span>

          {/* More actions — a menu in the popout variant; in the commandbar
              variant the pill instant-cuts to the actions laid inline while
              the region's width glides (lab transition). */}
          {(() => {
            if (variant === "commandbar") {
              const trigger = (
                <button
                  type="button"
                  aria-expanded={actionsExpanded}
                  onClick={toggleMoreActions}
                  className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md pl-2 pr-2 text-[14px] leading-5 transition-colors hover:bg-white/10"
                >
                  More actions
                  <span className="flex items-center gap-px">
                    <kbd className="flex h-5 w-5 items-center justify-center rounded-l-[4px] rounded-r-[2px] bg-white/15 text-[11px]">
                      ⇧
                    </kbd>
                    <kbd className="flex h-5 w-5 items-center justify-center rounded-l-[2px] rounded-r-[4px] bg-white/15 text-[11px]">
                      E
                    </kbd>
                  </span>
                </button>
              );
              return (
                <span
                  ref={actionsClipRef}
                  className="flex items-center overflow-hidden"
                  style={{
                    transition: "width 200ms cubic-bezier(0.34,1.3,0.64,1)",
                  }}
                >
                  <span
                    ref={actionsContentRef}
                    className="flex w-max items-center"
                  >
                    {actionsExpanded ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onSendToAgent(count)}
                          className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md pl-1.5 pr-3 text-[14px] leading-5 transition-colors hover:bg-white/10"
                        >
                          <AgentGlyph />
                          Send to Agent
                        </button>
                        <button
                          type="button"
                          onClick={() => onForward(count)}
                          className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md pl-1.5 pr-3 text-[14px] leading-5 transition-colors hover:bg-white/10"
                        >
                          <ForwardGlyph />
                          Forward
                        </button>
                      </>
                    ) : (
                      trigger
                    )}
                  </span>
                </span>
              );
            }
            return (
              <span className="relative">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={moreMenuOpen}
                  onClick={toggleMoreActions}
                  className={`flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md pl-2 pr-2.5 text-[14px] leading-5 transition-colors hover:bg-white/10 ${moreMenuOpen ? "bg-white/10" : ""}`}
                >
                  More actions
                  <span
                    className="flex transition-transform duration-150"
                    style={{
                      transform: moreMenuOpen ? "rotate(180deg)" : "rotate(0)",
                    }}
                  >
                    <ChevronDownGlyph />
                  </span>
                </button>
                {moreMenuOpen && !exiting ? (
                <div
                  role="menu"
                  className="ms-pop-enter absolute bottom-full right-0 mb-1.5 w-max min-w-44 rounded-[10px] bg-[#1a1817] p-1 text-white shadow-[0px_2px_12px_0px_rgba(16,16,16,0.24),0px_16px_24px_-12px_rgba(16,16,16,0.24)]"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      onSendToAgent(count);
                    }}
                    className="flex h-8 w-full items-center gap-1.5 whitespace-nowrap rounded-md pl-1.5 pr-3 text-left text-[14px] leading-5 transition-colors hover:bg-white/10"
                  >
                    <AgentGlyph />
                    Send to Agent
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      onForward(count);
                    }}
                    className="flex h-8 w-full items-center gap-1.5 whitespace-nowrap rounded-md pl-1.5 pr-3 text-left text-[14px] leading-5 transition-colors hover:bg-white/10"
                  >
                    <ForwardGlyph />
                    Forward
                  </button>
                </div>
              ) : null}
              </span>
            );
          })()}

          <span className="h-5 w-px shrink-0 bg-white/20" />
          <button
            type="button"
            aria-label="Clear selection"
            onClick={onClear}
            className="flex size-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-white/10"
          >
            <CrossGlyph />
          </button>
        </div>
      </div>
    </div>
  );
}

function SilhouetteGlyph({ size, ring }: { size: number; ring?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="shrink-0 rounded-full"
      style={ring ? { boxShadow: `0 0 0 2px ${ring}` } : undefined}
      aria-hidden
    >
      <circle cx="12" cy="12" r="12" fill="#e7e5e4" />
      <circle cx="12" cy="9.5" r="4" fill="#a8a29e" />
      <path d="M4 21.5c1.4-4 4.4-6 8-6s6.6 2 8 6a12 12 0 01-16 0z" fill="#a8a29e" />
    </svg>
  );
}

/* Inline 15/16px glyphs so the bar has zero icon dependencies. */
function CrossGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path d="M3.5 3.5l8 8m0-8l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function ForwardGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M9 4.5L13 8l-4 3.5v-2.2C5.8 9.3 4 10.4 3 12.5c0-3.8 2.4-6.2 6-6.6V4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function AgentGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 2.5l1.35 3.4 3.4 1.35-3.4 1.35L8 12l-1.35-3.4-3.4-1.35 3.4-1.35L8 2.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M12.7 11.2l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5.5-1.3z" fill="currentColor" />
    </svg>
  );
}
function CopyGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="5.5" y="5.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.5 10.5v-6a1 1 0 011-1h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function CheckGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronDownGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path d="M4 6l3.5 3.5L11 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FormatGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-white/70">
      <rect x="3.5" y="2.5" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 6h4M6 8.5h4M6 11h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
