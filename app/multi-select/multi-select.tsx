"use client";

/* Multi-select interaction, ported from the Ando conversation-surface lab.
   Self-contained: no external UI deps, CSS-only motion (multi-select.css).

   The gesture contract (settled through prototyping — don't regress):
   - Dragging text across MORE THAN `STAGE_THRESHOLD` messages stages a
     prompt ("N messages · Select ⇧E"). Nothing is selected implicitly.
   - Confirm by clicking the prompt or pressing Shift+E → the same pill cuts
     instantly into the command bar; staged rows get checkboxes.
   - Active mode: click rows to toggle; drag more text to add; the count
     button opens a selection-preview card (hover peeks, ✕ removes, click
     jumps); Forward keeps bar + selection; Copy-as writes the clipboard and
     rolls the button to "Copied!".
   - X / Esc / Shift+E hard-clear. Deselecting the last row clears too. */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DemoMessage } from "./data";

const STAGE_THRESHOLD = 3;
const EXIT_MS = 200;
const CLEAR_NATIVE_SELECTION_MS = 200;
const COPIED_TIMEOUT_MS = 1800;
const COMPOSER_GAP_PX = 12;

export type MultiSelectPhase = "idle" | "staging" | "active";

type MultiSelectState = {
  phase: MultiSelectPhase;
  exiting: boolean;
  selectedIds: string[];
  stagedCount: number;
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

export function useMultiSelect(messages: DemoMessage[]) {
  const [state, setState] = useState<MultiSelectState>({
    phase: "idle",
    exiting: false,
    selectedIds: [],
    stagedCount: 0,
    peekId: null,
  });
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const stagedIdsRef = useRef<string[]>([]);
  const exitTimerRef = useRef(0);
  const clearSelTimerRef = useRef(0);

  const finalize = useCallback(() => {
    window.clearTimeout(clearSelTimerRef.current);
    setState({
      phase: "idle",
      exiting: false,
      selectedIds: [],
      stagedCount: 0,
      peekId: null,
    });
    stagedIdsRef.current = [];
    window.getSelection()?.removeAllRanges();
  }, []);

  // Hard clear with the animated teardown window (bar fades, rows glide home).
  const clearAll = useCallback(() => {
    if (stateRef.current.phase === "idle" || stateRef.current.exiting) return;
    setState((s) => ({ ...s, exiting: true }));
    window.clearTimeout(exitTimerRef.current);
    exitTimerRef.current = window.setTimeout(finalize, EXIT_MS);
  }, [finalize]);

  const confirmSelection = useCallback(() => {
    if (stagedIdsRef.current.length <= STAGE_THRESHOLD) return;
    const ids = [...stagedIdsRef.current];
    stagedIdsRef.current = [];
    setState((s) => ({
      ...s,
      phase: "active",
      selectedIds: ids,
      stagedCount: 0,
    }));
    // Keep the native highlight up while checkboxes settle in, then clear it
    // so the selection reads as landing in the rows.
    window.clearTimeout(clearSelTimerRef.current);
    clearSelTimerRef.current = window.setTimeout(
      () => window.getSelection()?.removeAllRanges(),
      CLEAR_NATIVE_SELECTION_MS
    );
  }, []);

  const toggleRow = useCallback(
    (id: string) => {
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

  // Row click while active: a click that ends a drag-add keeps the additions
  // instead of re-toggling the row under the cursor.
  const onRowClick = useCallback(
    (id: string) => {
      if (stateRef.current.phase !== "active" || stateRef.current.exiting)
        return;
      const selection = window.getSelection();
      if (selection != null && !selection.isCollapsed) {
        selection.removeAllRanges();
        return;
      }
      toggleRow(id);
    },
    [toggleRow]
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

      if (s.phase === "active") {
        if (hasText) {
          const spanned = rowsSpannedBySelection(selection);
          const additions = spanned.filter(
            (id) => !s.selectedIds.includes(id)
          );
          if (additions.length > 0) {
            setState((prev) => ({
              ...prev,
              selectedIds: [...prev.selectedIds, ...additions],
            }));
          }
        }
        return;
      }

      if (!hasText) {
        stagedIdsRef.current = [];
        if (s.phase === "staging") {
          setState((prev) => ({ ...prev, phase: "idle", stagedCount: 0 }));
        }
        return;
      }
      const ids = rowsSpannedBySelection(selection);
      if (ids.length > STAGE_THRESHOLD) {
        stagedIdsRef.current = ids;
        setState((prev) => ({
          ...prev,
          phase: "staging",
          stagedCount: ids.length,
        }));
      } else {
        stagedIdsRef.current = [];
        if (s.phase === "staging") {
          setState((prev) => ({ ...prev, phase: "idle", stagedCount: 0 }));
        }
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

  // Esc = hard clear; Shift+E = confirm from staging / hard clear from active.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (
        target != null &&
        target.closest('input, textarea, [contenteditable="true"]') != null
      ) {
        return;
      }
      if (event.key === "Escape") {
        if (stateRef.current.phase !== "idle") clearAll();
        return;
      }
      if (
        event.key === "E" &&
        event.shiftKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !stateRef.current.exiting
      ) {
        if (stateRef.current.phase === "staging") {
          event.preventDefault();
          confirmSelection();
        } else if (stateRef.current.phase === "active") {
          event.preventDefault();
          clearAll();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [clearAll, confirmSelection]);

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
    confirmSelection,
    clearAll,
    toggleRow,
    onRowClick,
    setPeekId,
  };
}

function messagePlainText(message: DemoMessage): string {
  return message.body
    .map((paragraph) => paragraph.map((segment) => segment.text).join(""))
    .join("\n");
}

const COPY_FORMATS = ["Preview text", "JSON", "Message links"] as const;

export function MultiSelectBar({
  state,
  selectedMessages,
  onConfirm,
  onClear,
  onRemove,
  onPeek,
  onForward,
}: {
  state: MultiSelectState;
  selectedMessages: DemoMessage[];
  onConfirm: () => void;
  onClear: () => void;
  onRemove: (id: string) => void;
  onPeek: (id: string | null) => void;
  onForward: (count: number) => void;
}) {
  const { phase, exiting, stagedCount, selectedIds } = state;
  const count = phase === "staging" ? stagedCount : selectedIds.length;

  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const copiedTimerRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const positionerRef = useRef<HTMLDivElement>(null);

  // The bar floats 12px above the composer (measured, like the lab overlay).
  // Written straight to the element so no render depends on it.
  useLayoutEffect(() => {
    if (phase === "idle") return;
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
  }, [phase]);

  useEffect(() => {
    return () => window.clearTimeout(copiedTimerRef.current);
  }, []);

  // Outside pointer-down closes the popovers.
  useEffect(() => {
    if (!copyMenuOpen && !previewOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (barRef.current?.contains(event.target as Node)) return;
      setCopyMenuOpen(false);
      setPreviewOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [copyMenuOpen, previewOpen]);

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
      className="pointer-events-none absolute left-1/2 z-40 -translate-x-1/2"
      style={{ bottom: 96 }}
    >
      <div
        ref={barRef}
        className={`pointer-events-auto relative ${exiting ? "ms-bar-exit" : "ms-bar-enter"}`}
      >
        {/* Selection preview card (opened from the count button). */}
        {previewOpen && !copyMenuOpen && phase === "active" && !exiting ? (
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

        {/* The pill: one persistent element, instant cut between states. */}
        <div className="flex items-center gap-1.5 rounded-[10px] bg-[#1a1817] px-2 py-1 text-white shadow-[0px_2px_12px_0px_rgba(16,16,16,0.2),0px_16px_24px_-12px_rgba(16,16,16,0.2)]">
          <div className="relative flex h-8 items-center">
            {phase === "staging" ? (
              <button
                type="button"
                aria-label={`Select ${count} messages`}
                onClick={onConfirm}
                className="absolute inset-0 rounded-md transition-colors hover:bg-white/10"
              />
            ) : null}
            <button
              type="button"
              aria-expanded={previewOpen}
              onClick={() =>
                phase === "active" && setPreviewOpen((open) => !open)
              }
              className={`flex h-8 items-center whitespace-nowrap rounded-md pl-2 pr-3 text-[14px] leading-5 transition-colors ${
                phase === "active"
                  ? "hover:bg-white/10"
                  : "pointer-events-none"
              } ${previewOpen ? "bg-white/10" : ""}`}
            >
              {phase === "active" && selectedMessages.length > 0 ? (
                <span aria-hidden className="mr-1.5 flex -space-x-1">
                  {selectedMessages.slice(0, 3).map((message) => (
                    <SilhouetteGlyph
                      key={message.id}
                      size={16}
                      ring="#1a1817"
                    />
                  ))}
                </span>
              ) : null}
              <span key={count} className="ms-roll-in inline-flex tabular-nums">
                {count}
              </span>
              {phase === "staging" ? " messages" : " selected"}
            </button>

            {phase === "staging" ? (
              <span className="pointer-events-none flex items-center">
                <span className="mr-3 h-5 w-px bg-white/20" />
                <span className="text-[14px] leading-5">Select</span>
                <span className="ml-1.5 flex items-center gap-px">
                  <kbd className="flex h-5 w-5 items-center justify-center rounded-l-[4px] rounded-r-[2px] bg-white/15 text-[11px]">
                    ⇧
                  </kbd>
                  <kbd className="flex h-5 w-5 items-center justify-center rounded-l-[2px] rounded-r-[4px] bg-white/15 text-[11px]">
                    E
                  </kbd>
                </span>
              </span>
            ) : (
              <span className="flex items-center">
                <span className="mr-1.5 h-5 w-px bg-white/20" />
                <button
                  type="button"
                  onClick={() => onForward(count)}
                  className="flex h-8 items-center gap-1.5 rounded-md pl-1.5 pr-3 text-[14px] leading-5 transition-colors hover:bg-white/10"
                >
                  <ForwardGlyph />
                  Forward
                </button>
                <span className="relative">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={copyMenuOpen}
                    onClick={() => {
                      setPreviewOpen(false);
                      setCopyMenuOpen((open) => !open);
                    }}
                    className={`flex h-8 items-center gap-1.5 rounded-md pl-1.5 pr-2.5 text-[14px] leading-5 transition-colors hover:bg-white/10 ${copyMenuOpen ? "bg-white/10" : ""}`}
                  >
                    <span className="relative size-4 overflow-hidden">
                      <span
                        className="absolute left-0 top-0 flex flex-col transition-transform duration-200"
                        style={{
                          transform: copied
                            ? "translateY(-16px)"
                            : "translateY(0)",
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
                          transform: copied
                            ? "translateY(-24px)"
                            : "translateY(0)",
                        }}
                      >
                        <span className="flex h-6 items-center">Copy as</span>
                        <span className="flex h-6 items-center">Copied!</span>
                      </span>
                    </span>
                    <span
                      className="flex transition-transform duration-150"
                      style={{
                        transform: copyMenuOpen
                          ? "rotate(180deg)"
                          : "rotate(0)",
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
              </span>
            )}
          </div>

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
