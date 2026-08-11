"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "../multi-select/multi-select.css";
import "../channel/channel.css";
import { MESSAGES, type DemoMessage } from "../multi-select/data";
import {
  YOU,
  fmtTime,
  BG_TERTIARY,
  BRAND,
  FG_PRIMARY,
  FG_SECONDARY,
  FG_TERTIARY,
  GlobalNav,
  LocalNav,
  MessageRow,
  PageHeader,
  ThreadFooter,
  Titlebar,
} from "../channel/chrome";

// /ando-draft-messages — the "Suggested drafts" form factor from July Sprints
// (Figma 19122:28661 for the row states, 19125:29053 for the lightbulb flow).
// A capped list of proposed drafts sits above the composer; picking one stages
// it into the composer rather than sending it.
//
// Rules that drive most of this file:
//   1. The return arrow sits on EVERY row at the left, in tertiary grey. It is
//      not a selection indicator — it is a standing "enter stages this" mark.
//      The index badge lives on the right.
//   2. The chevron is last in the row and is the only expand target. Clicking
//      the row body stages; clicking the chevron expands. Different hitboxes.
//   3. Expanding is an accordion, not a detail view — the other drafts stay
//      visible so you can still see what else was suggested.

// Palette comes from the shared channel chrome, so this prototype and
// /channel cannot drift apart.

// The flyout reads at 14px — a step up from the old 13, since a suggestion
// has to be scannable in the half-second before you decide to take it. Icons
// and the keybind badge scale with it rather than staying at composer size,
// or they read as undersized furniture next to the larger text.
const PANEL_TEXT = "14px";
const PANEL_ICON = 18;

// The channel this composer posts into — the placeholder reads off it rather
// than hard-coding the name in copy.
const CHANNEL = "#design";

// Visible hairline. STROKE_WEAK (#f0efee) disappears against white at 0.5px;
// this is the border /agent-interactions uses on its cards, one step darker.
const STROKE = "#e7e5e4";

// Row hover / active tint. A step lighter than BG_TERTIARY (#f5f5f4), which
// is doing other work in here — the keybind badges sit on it, so reusing it
// for the row behind them flattened the two together.
const ROW_ACTIVE = "#fafaf9";

const PANEL_SHADOW =
  "0px 2px 12px 0px rgba(16,16,16,0.04),0px 16px 24px -12px rgba(16,16,16,0.08),0px 0px 0.5px 0.75px rgba(16,16,16,0.06)";

// Quiet after a digit for it to count as a keybind rather than a character.
const PICK_IDLE_AFTER = 500;

// The draft previewed in the composer on hover. Grey enough to read as
// not-yet-yours against FG_PRIMARY.
const GHOST = "#a8a29e";

/* --------------------------------------------------------------- icons ---- */

// Verbatim path data from the Ando central icon registry
// (packages/ui/src/components/icon-registry). Copied rather than imported —
// ando-media has no dependency on packages/ui — but the geometry is the
// registry's, not hand-drawn, so these match production exactly.
// Variant: round / outlined / radius-1 / stroke-1.5, except the bulb which
// only ships filled.
const ICON_PATHS = {
  arrowCornerDownLeft: `<path d="M20.25 4.75V14.25C20.25 14.8023 19.8023 15.25 19.25 15.25H4.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.75 11.25L3.75 15.25L7.75 19.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  chevronDownSmall: `<path d="M8 10L11.6464 13.6464C11.8417 13.8417 12.1583 13.8417 12.3536 13.6464L16 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  // Matched pair — the panel folds down with one, the bar unfolds up with
  // the other, so the gesture reads as reversible.
  chevronBottom: `<path d="M20 9L12.7071 16.2929C12.3166 16.6834 11.6834 16.6834 11.2929 16.2929L4 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  chevronTop: `<path d="M4 15.0001L11.2929 7.7072C11.6834 7.31668 12.3166 7.31667 12.7071 7.7072L20 15.0001" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  paperclip: `<path d="M5.75 10.75V15.25C5.75 18.5637 8.43629 21.25 11.75 21.25H12.25C15.5637 21.25 18.25 18.5637 18.25 15.25V7C18.25 4.65279 16.3472 2.75 14 2.75C11.6528 2.75 9.75 4.65279 9.75 7V14.875C9.75 16.0486 10.7014 17 11.875 17C13.0486 17 14 16.0486 14 14.875V7.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  text: `<path d="M3.75 6.25V3.75H12H20.25V6.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 20.25V3.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.75 20.25H12H14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  emojiSmile: `<circle cx="12" cy="12" r="9.25" stroke="currentColor" stroke-width="1.5"/><path d="M16.1123 14.8493C16.1942 14.7105 16.2249 14.545 16.192 14.3857C16.1592 14.2263 16.0665 14.0867 15.933 13.9968C15.7996 13.9069 15.6354 13.8733 15.4754 13.9028C15.3154 13.9321 15.1736 14.0226 15.0757 14.1507C15.0008 14.2469 14.9237 14.3367 14.8415 14.4241C14.1096 15.2083 13.061 15.628 12.0035 15.625C10.946 15.6265 9.8972 15.2055 9.16254 14.4222C9.08002 14.3348 9.00261 14.2451 8.92738 14.1491C8.8291 14.0214 8.68699 13.9313 8.52686 13.9024C8.36679 13.8735 8.20268 13.9076 8.06954 13.9979C7.9364 14.0882 7.84406 14.2281 7.81174 14.3875C7.77938 14.547 7.81054 14.7123 7.89293 14.8509C7.97731 14.99 8.06686 15.1223 8.16553 15.2526C9.04297 16.4311 10.5292 17.1343 12.0024 17.125C13.4754 17.1367 14.965 16.4342 15.8405 15.2521C15.939 15.1215 16.0282 14.9888 16.1123 14.8493Z" fill="currentColor"/><path d="M10.75 9.9C10.75 11.0046 10.0784 11.75 9.25 11.75C8.42157 11.75 7.75 11.0046 7.75 9.9C7.75 8.79543 8.42157 8 9.25 8C10.0784 8 10.75 8.79543 10.75 9.9Z" fill="currentColor"/><path d="M16.25 9.9C16.25 11.0046 15.5784 11.75 14.75 11.75C13.9216 11.75 13.25 11.0046 13.25 9.9C13.25 8.79543 13.9216 8 14.75 8C15.5784 8 16.25 8.79543 16.25 9.9Z" fill="currentColor"/>`,
  gif: `<path d="M5.75 12.3676C5.75 14.0113 6.70955 15 8.34036 15C9.79045 15 10.7672 14.138 10.7672 12.8662V12.5155C10.7672 11.9789 10.5176 11.738 9.94966 11.738H8.89544C8.51678 11.738 8.31454 11.9113 8.31454 12.2282C8.31454 12.5493 8.52108 12.7268 8.89544 12.7268H9.4247V12.9718C9.4247 13.5 9.01162 13.8549 8.3963 13.8549C7.60456 13.8549 7.16997 13.3268 7.16997 12.3634V11.6662C7.16997 10.6901 7.59596 10.1789 8.40921 10.1789C8.96429 10.1789 9.28701 10.5085 9.63554 10.8507C9.76033 10.9732 9.88941 11.0282 10.0572 11.0282C10.3972 11.0282 10.6338 10.8 10.6338 10.4662C10.6338 10.1324 10.3799 9.76901 9.99268 9.49437C9.56239 9.17746 8.97289 9 8.30594 9C6.72246 9 5.75 10.0014 5.75 11.5986V12.3676Z" fill="currentColor"/><path d="M12.3894 14.9155C12.8412 14.9155 13.0951 14.6451 13.0951 14.1634V9.81549C13.0951 9.33803 12.8369 9.06338 12.3808 9.06338C11.9247 9.06338 11.6708 9.3338 11.6708 9.81549V14.1634C11.6708 14.6408 11.9333 14.9155 12.3894 14.9155Z" fill="currentColor"/><path d="M14.9626 14.9155C15.4101 14.9155 15.6596 14.6451 15.6596 14.1634V12.7014H17.4669C17.8025 12.7014 18.0306 12.4817 18.0306 12.1563C18.0306 11.831 17.8068 11.6113 17.4669 11.6113H15.6596V10.2254H17.6863C18.0133 10.2254 18.25 9.99718 18.25 9.67183C18.25 9.34225 18.0133 9.10563 17.6863 9.10563H15.0572C14.5237 9.10563 14.2354 9.38873 14.2354 9.90423V14.1634C14.2354 14.6366 14.5022 14.9155 14.9626 14.9155Z" fill="currentColor"/><path d="M20.25 4.75H3.75C3.19772 4.75 2.75 5.19771 2.75 5.75V18.25C2.75 18.8023 3.19772 19.25 3.75 19.25H20.25C20.8023 19.25 21.25 18.8023 21.25 18.25V5.75C21.25 5.19772 20.8023 4.75 20.25 4.75Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
  paperPlane: `<path d="M6.00059 12.0001H9.25059M6.00059 12.0001L3.38231 4.14525C3.24144 3.72266 3.68183 3.34071 4.08025 3.53992L20.1062 11.5529C20.4747 11.7371 20.4747 12.263 20.1062 12.4473L4.08025 20.4603C3.68183 20.6595 3.24144 20.2775 3.38231 19.8549L6.00059 12.0001Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  crossSmall: `<path d="M7.75 7.75L16.25 16.25M16.25 7.75L7.75 16.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  zapFilled: `<path d="M13.9992 2.35561C13.9992 1.12899 12.4165 0.636187 11.7202 1.64595L3.17236 14.0403C2.60048 14.8695 3.19407 15.9999 4.20137 15.9999H9.99917V21.6442C9.99917 22.8708 11.5818 23.3637 12.2782 22.3539L20.826 9.95958C21.3979 9.13036 20.8043 7.99992 19.797 7.99992H13.9992V2.35561Z" fill="currentColor"/>`,
} as const;

type IconProps = {
  path: string;
  size?: number;
  className?: string;
  /** The registry has no corner-down-RIGHT arrow, so the down-left one is
   *  mirrored to match the design rather than hand-drawing a near-copy. */
  flipX?: boolean;
  style?: React.CSSProperties;
};

function Icon({ path, size = 16, className, flipX, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ ...style, transform: flipX ? "scaleX(-1)" : undefined }}
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

/* ---------------------------------------------------------------- data ---- */

type DraftBody = { lead: string; bullets: string[]; tail: string };

type Draft = {
  id: string;
  title: string;
  /** Grey continuation shown beside the title. Short drafts omit it. */
  preview?: string;
  /** Only long drafts carry a body — and only those get the chevron. */
  body?: DraftBody;
  /** App logo from public/images, shown before the title. */
  appIcon?: { src: string; alt: string };
  /** What actually lands in the composer, when that differs from the title —
   *  the Notion draft stages with its @mention so it addresses the agent. */
  stageAs?: string;
};

const INITIAL_DRAFTS: Draft[] = [
  {
    id: "triage",
    title: "Message triage",
    body: {
      lead: "Classify each new message above as:",
      bullets: ["customer follow-up", "product bug", "operational task", "unclear"],
      tail: "For each request, link the source and propose a destination, owner, priority, and short rationale. Put ambiguous requests in “unclear” and ask the one question that would resolve them.",
    },
  },
  { id: "down", title: "Down!" },
  {
    id: "notion",
    title: "Search my Notion documents for hiring candidates",
    appIcon: { src: "/images/notion-logo.png", alt: "Notion" },
    stageAs: "@Tadao Search my Notion documents for hiring candidates",
  },
];

/** The agent that answers the Notion draft. A "#" avatar makes MessageRow
 *  render it with the agent sparkle rather than a person silhouette. */
const TADAO = { id: "tadao", name: "Tadao", avatar: "#1a1817" };

const NOTION_REPLY = [
  "Hey! Noticed Notion is part of your workflow, but you don't have it connected yet.",
  "",
  "For example, I'll be able to:",
  "  • Update your Notion databases from Ando",
  "  • Search Notion without leaving your conversations",
  "  • Turn conversations into artifacts",
  "",
  "Let me know once it is connected, and I can get started.",
].join("\n");

/**
 * Which draft position a bare digit press refers to, or null.
 *
 * Modified presses are ignored — ⌘1 belongs to the browser (tab switching),
 * and claiming it here would fight for a key we cannot reliably win. `code`
 * is checked before `key` because it is layout-independent: an AZERTY top row
 * reports "&é\"" as `key` while `code` stays Digit1–3.
 */
function digitFromEvent(
  // Structural, not `KeyboardEvent` — this is called with both the native
  // event from the window listener and React's synthetic one from the
  // composer, and it only ever reads these five fields.
  event: Pick<KeyboardEvent, "key" | "code" | "metaKey" | "ctrlKey" | "altKey">,
): number | null {
  if (event.metaKey || event.ctrlKey || event.altKey) return null;
  const byCode = /^Digit([1-9])$/.exec(event.code);
  if (byCode) return Number(byCode[1]);
  return /^[1-9]$/.test(event.key) ? Number(event.key) : null;
}

/**
 * The grey continuation shown beside the title. Derived from the body rather
 * than stored, so it is the real text and CSS decides where it clips — a
 * hardcoded preview carries its own ellipsis and looks identically truncated
 * at every width, however much room the row has.
 */
function previewFor(draft: Draft): string | undefined {
  if (draft.preview) return draft.preview;
  if (!draft.body) return undefined;
  // Flattened to one line: the row clips it, so the line structure is noise.
  return stageTextFor(draft).replace(/\s*\n\s*/g, " ").trim();
}

/** Body flattened to the text that lands in the composer when staged. */
function stageTextFor(draft: Draft): string {
  if (draft.stageAs) return draft.stageAs;
  if (!draft.body) return draft.title;
  const { lead, bullets, tail } = draft.body;
  return [lead, ...bullets.map((b) => `• ${b}`), tail].join("\n");
}

/* ----------------------------------------------------------------- row ---- */

type DraftRowProps = {
  draft: Draft;
  index: number;
  active: boolean;
  /** Pointed at: a truncated row opens in place to the full message. */
  expanded: boolean;
  onHover: (index: number, event: React.MouseEvent) => void;
  onStage: (draft: Draft) => void;
  onFocusRow: (index: number) => void;
};

function DraftRow({
  draft,
  index,
  active,
  expanded,
  onHover,
  onStage,
  onFocusRow,
}: DraftRowProps) {
  const preview = previewFor(draft);
  // Expanded, the body is the message as written — line breaks kept, nothing
  // clipped. Collapsed, the same text flattened to a clamped summary. Rows
  // without a preview render identically in both states, so only genuinely
  // truncated rows visibly open.
  const body = expanded && preview ? stageTextFor(draft) : preview;

  // The open/close is animated by hand: measure the text at its new size and
  // ease the box to it. Imperative (style on the node, not state) so nothing
  // re-renders mid-motion, and CSS owns the interpolation. The panel hangs
  // from its bottom edge, so the row grows upward — its bottom edge, and the
  // pointer inside it, never move.
  const clipRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const clip = clipRef.current;
    const p = textRef.current;
    if (!clip || !p) return;
    clip.style.height = `${p.offsetHeight}px`;
  }, [expanded, body]);

  return (
    <div
      className="flex rounded-[6px] transition-colors"
      style={{ background: active ? ROW_ACTIVE : "transparent" }}
      // Movement, not entry — see hoverRow. Leaving a row is not the end of
      // hovering either; the surface as a whole decides when that is over.
      onMouseMove={(event) => onHover(index, event)}
    >
      {/* items-start, not items-center: a two-line row must keep its arrow and
          badge aligned to the first line rather than floating to the middle of
          the block. py matches the old h-10 on a single line. */}
      <div className="flex w-full items-start gap-2.5 px-2.5 py-2.5">
        {/* Per the 19125 flow: the return arrow is a standing mark on every
            row — "this inserts into the composer" — not a selection
            indicator. The active row is carried by the background tint
            alone, and the keybind badge lives at the right end. */}
        <Icon
          path={ICON_PATHS.arrowCornerDownLeft}
          flipX
          size={PANEL_ICON}
          className="mt-px shrink-0"
          style={{ color: FG_TERTIARY }}
        />

        {/* Row body — the staging target, and the row's tab stop. Selection
            follows focus, so native Tab moves the highlight for free: no
            hijacking of Tab, and no focus trap, since tabbing past the last
            row leaves the panel the way it always would. */}
        <button
          type="button"
          onClick={() => onStage(draft)}
          onFocus={() => onFocusRow(index)}
          className="flex min-w-0 flex-1 items-start gap-2 rounded-[4px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/30"
          aria-label={`Stage draft: ${draft.title}`}
        >
          {draft.appIcon ? (
            <img
              src={draft.appIcon.src}
              alt=""
              className="mt-px size-[18px] shrink-0 rounded-[4px] object-contain"
            />
          ) : null}
          {/* The clip: what actually eases open and shut. Its height is set
              imperatively from the text's measured size, so the same box
              animates between the clamped summary and the full message. */}
          <div
            ref={clipRef}
            className="min-w-0 flex-1 overflow-hidden"
            style={{ transition: "height 200ms cubic-bezier(0.2, 0, 0, 1)" }}
          >
            {/* Title and body share one wrapping block. Two `span`s inside a
                single `p` rather than siblings in a flex row: only inline
                content reflows, so the body can continue on the line the
                title started and the clamp counts the pair together. */}
            <p
              ref={textRef}
              className="text-[14px] leading-5"
              style={
                expanded
                  ? { whiteSpace: "pre-wrap" }
                  : {
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                      overflow: "hidden",
                    }
              }
            >
              <span style={{ color: FG_PRIMARY }}>{draft.title}</span>
              {body ? (
                <>
                  {/* Title and body are two different registers — what the
                      draft is, then what it says. Inline so it wraps with the
                      text rather than pinning a separator to a fixed spot. */}
                  <span
                    aria-hidden
                    className="mx-1.5 inline-block size-[2px] rounded-full align-middle"
                    style={{ background: FG_TERTIARY }}
                  />
                  <span style={{ color: FG_TERTIARY }}>{body}</span>
                </>
              ) : null}
            </p>
          </div>
        </button>

        {/* Keybind badge, at the very end. mt-px lines it up with the first
            line of a wrapped row. */}
        <span
          className="mt-px flex h-[18px] shrink-0 items-center justify-center rounded-[4px] px-1.5 text-[11px] leading-none"
          style={{ background: BG_TERTIARY, color: FG_TERTIARY }}
        >
          {index + 1}
        </span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- panel ---- */

type PanelProps = {
  drafts: Draft[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
  /** Which shape the surface takes; "closed" never reaches this component. */
  panel: "open" | "collapsed";
  onStage: (draft: Draft) => void;
  /** Which row the pointer moved onto: it opens in place, and the composer
   *  previews it as a ghost. */
  hoverIndex: number | null;
  onHoverRow: (index: number, event: React.MouseEvent) => void;
  onCollapse: () => void;
  onOpen: () => void;
  onDismiss: () => void;
};

// One surface, two shapes, one element. The box itself CSS-transitions
// between the full-width panel and the centred pill — width, position,
// height, colour, shadow — while the two faces cross-fade inside it. A
// hand-rolled morph rather than a shared-layoutId one: CSS transitions are
// driven by the style system, so they don't depend on the rAF measurement
// loop that broke the framer attempt in a throttled pane.
function FlyoutSurface({
  panel,
  drafts,
  activeIndex,
  setActiveIndex,
  panelRef,
  onStage,
  hoverIndex,
  onHoverRow,
  onCollapse,
  onOpen,
  onDismiss,
}: PanelProps) {
  const open = panel === "open";

  return (
    // Absolute over the thread — opening must not push the conversation up.
    // The 12px standoff from the composer is padding on this wrapper rather
    // than a margin on the surface, which puts that strip inside the panel's
    // subtree. It matters for hover: the panel rides up when a ghost grows the
    // composer, and a margin would leave a band belonging to neither surface
    // for the pointer to fall into — read as a mouseleave, that starts the
    // grow/shrink oscillation over again.
    <div className="absolute bottom-full left-0 z-20 w-full pb-3">
      <div
        ref={panelRef}
        // Focusable but not tab-stopped: it exists so focus has somewhere to
        // land when the bar re-expands, not as a stop in the tab order.
        tabIndex={-1}
        role="group"
        aria-label="Suggested drafts"
        // Open: full composer width, white, shadowed. Folded: a centred pill
        // (typing indicator to the left of this strip, agent presence to the
        // right, so the middle is the only clear lane), grey, flat.
        //
        // The two shapes swap outright — no transition. Height is left to the
        // content rather than measured and pinned, which the morph had needed.
        className="overflow-hidden rounded-[10px] outline-none"
        style={{
          width: open ? "100%" : "clamp(264px, 30%, 420px)",
          marginLeft: open ? 0 : "auto",
          marginRight: open ? 0 : "auto",
          background: open ? "#ffffff" : BG_TERTIARY,
          boxShadow: open ? PANEL_SHADOW : "none",
        }}
      >
      {open ? (
      <div className="flex flex-col">
        <div className="flex h-10 items-center justify-between px-3.5">
          <span style={{ color: FG_TERTIARY, fontSize: PANEL_TEXT, lineHeight: "20px" }}>
            Suggested drafts
          </span>
          {/* Folds the panel down into the bar rather than dismissing it — the
              exact reverse of the bar's up-chevron, so the pair reads as one
              reversible gesture. Dismissing outright is the ×'s job, on the
              bar. */}
          <button
            type="button"
            onClick={onCollapse}
            className="flex size-6 items-center justify-center rounded-[4px] transition-colors hover:bg-black/5"
            style={{ color: FG_TERTIARY }}
            aria-label="Collapse suggested drafts"
          >
            <Icon path={ICON_PATHS.chevronBottom} size={PANEL_ICON} />
          </button>
        </div>

        <div className="flex flex-col gap-0.5 px-1.5 pb-1.5">
          {drafts.map((draft, i) => (
            <DraftRow
              key={draft.id}
              draft={draft}
              index={i}
              active={i === activeIndex}
              expanded={i === hoverIndex}
              onHover={onHoverRow}
              onStage={onStage}
              onFocusRow={setActiveIndex}
            />
          ))}
        </div>
      </div>
      ) : (
      <div className="flex h-10 items-center gap-1 py-1 pl-3.5 pr-1.5">
        {/* The whole label region unfolds — a bigger target than the chevron
            alone, which is why the chevron lives inside it rather than
            beside. */}
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Show suggested drafts (${drafts.length})`}
          className="flex h-full min-w-0 flex-1 items-center gap-2 text-left"
          style={{ fontSize: PANEL_TEXT, lineHeight: "20px" }}
        >
          <span className="truncate" style={{ color: FG_TERTIARY }}>
            Suggested drafts
          </span>
          <span style={{ color: FG_SECONDARY }}>{drafts.length}</span>
          <Icon
            path={ICON_PATHS.chevronTop}
            size={PANEL_ICON}
            className="ml-auto shrink-0"
            style={{ color: FG_TERTIARY }}
          />
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss suggested drafts"
          className="flex size-7 shrink-0 items-center justify-center rounded-[6px] transition-colors hover:bg-black/5"
          style={{ color: FG_TERTIARY }}
        >
          <Icon path={ICON_PATHS.crossSmall} size={PANEL_ICON} />
        </button>
      </div>
      )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ coachmark -- */

// Introduces the suggestions control — shown once, then dismissed for good.
// Not a hover tooltip: this explains a feature you have not met yet, so it has
// to arrive on its own and be dismissable, rather than waiting to be
// discovered by pointing at the thing it is describing.
//
// Rendered as a sibling of the composer, not inside it: the composer clips its
// children (overflow-hidden, for the rounded corners), which cropped the first
// version of this in half.
//
// Styling is the Ando design system's tooltip, `description` variant
// (packages/ui/src/components/tooltip/styles.css) — 8px radius, 12/16
// padding, 14/20 type, 280px cap. Two departures: brand blue instead of the
// DS's --color-ando-bg-dark-elevated (#2e2a28), as asked; and left-aligned
// rather than centred, because centred text either side of a dismiss button
// reads as a mistake.
const BOLT_CENTRE_X = 154; // composer padding + four 28px icons and their gaps

function Coachmark({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="note"
      className="ando-tip absolute bottom-[46px] left-3 z-40 flex w-max items-start gap-2"
      style={{ background: BRAND, textAlign: "left" }}
    >
      <span className="max-w-[236px]">
        Draft suggestions. Ando draws on your memory to propose the best next
        move, personalized to how you work.
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-mr-1 flex size-5 shrink-0 items-center justify-center rounded-[4px] transition-colors hover:bg-white/20"
      >
        <Icon path={ICON_PATHS.crossSmall} size={16} />
      </button>
      {/* Points at the bolt rather than at the middle of the copy, so it is
          unambiguous which control is being described. */}
      <span
        aria-hidden
        className="absolute -bottom-1 size-2 rotate-45"
        style={{ background: BRAND, left: BOLT_CENTRE_X - 12 - 4 }}
      />
    </div>
  );
}

/* --------------------------------------------------------- agent reply --- */

// "Tadao is typing…" — the beat between sending and the reply, so the agent
// reads as answering rather than materialising fully formed.
function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex w-full items-center gap-2.5 px-4 pb-1.5 pt-2">
      <span className="flex w-6 shrink-0 justify-center">
        <span className="flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1 rounded-full"
              style={{
                background: FG_TERTIARY,
                animation: "glyph-type 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </span>
      </span>
      {/* All grey per the flow — the typing line is ambient, not a link. */}
      <span className="text-[13px] leading-5" style={{ color: FG_TERTIARY }}>
        {name} is typing…
      </span>
    </div>
  );
}

// The connect prompt the agent attaches to its reply, and what it becomes
// once the integration is live. Same card, two states — connecting should
// resolve in place rather than swapping the message out.
function NotionConnectCard({
  connected,
  connectedAt,
  onConnect,
}: {
  connected: boolean;
  connectedAt: string | null;
  onConnect: () => void;
}) {
  return (
    <div className="px-4 pb-2 pl-[58px]">
      {/* ~460px per the flow — the card is an attachment, not a banner, so it
          does not span the pane. Footer sits behind a hairline divider. */}
      <div
        className="flex w-full max-w-[460px] flex-col overflow-hidden rounded-[10px] border-[0.5px]"
        style={{ borderColor: STROKE, background: "#ffffff" }}
      >
        <div className="flex items-start gap-3 p-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-[8px]"
            style={{ background: BG_TERTIARY }}
          >
            <img
              src="/images/notion-logo.png"
              alt=""
              className="size-5 object-contain"
            />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              className="flex items-center gap-1.5 text-[13px] font-medium leading-5"
              style={{ color: FG_PRIMARY }}
            >
              Notion
              {/* Status dot, not a sparkle — grey while unconnected, green
                  once live. One mark, two states. */}
              <span
                className="size-1.5 rounded-full"
                style={{ background: connected ? "#16a34a" : "#a8a29e" }}
              />
            </span>
            {connected ? (
              <span className="text-[12px] leading-4" style={{ color: FG_TERTIARY }}>
                Connected {connectedAt} by{" "}
                <span style={{ color: FG_SECONDARY }}>You</span>
              </span>
            ) : (
              <span className="text-[12px] leading-4" style={{ color: FG_TERTIARY }}>
                Enable agents to turn conversations into artifacts, update notes,
                &amp; automate workflows in Notion.
              </span>
            )}
          </div>
        </div>

        {connected ? null : (
          <div
            className="flex items-center justify-between gap-3 border-t-[0.5px] px-3 py-2.5"
            style={{ borderColor: STROKE }}
          >
            <span className="text-[12px] leading-4" style={{ color: FG_TERTIARY }}>
              Want to connect more apps?{" "}
              <span style={{ color: FG_PRIMARY, textDecoration: "underline" }}>
                Click here
              </span>
            </span>
            <button
              type="button"
              onClick={onConnect}
              className="shrink-0 rounded-[6px] px-3.5 py-1.5 text-[12px] font-medium leading-4 text-white transition-opacity hover:opacity-90"
              style={{ background: FG_PRIMARY }}
            >
              Connect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- page ---- */

export default function AndoDraftMessagesPage() {
  const [drafts, setDrafts] = useState<Draft[]>(INITIAL_DRAFTS);
  // Sending posts into the thread, so a staged draft can be followed all the
  // way to a real message rather than just vanishing from the composer.
  const [messages, setMessages] = useState<DemoMessage[]>(MESSAGES);
  const nextMessageIdRef = useRef(1);
  const messagesRef = useRef<HTMLDivElement>(null);
  // The scripted agent beat: addressing @Tadao gets a typing pause, then a
  // reply carrying the Notion connect card.
  const [typingAgent, setTypingAgent] = useState<string | null>(null);
  const [notionConnected, setNotionConnected] = useState(false);
  const [connectedAt, setConnectedAt] = useState<string | null>(null);
  const replyTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (replyTimerRef.current !== null) window.clearTimeout(replyTimerRef.current);
    },
    [],
  );
  // Three states, not two. Staging folds the panel down to a bar rather than
  // dismissing it, so the remaining suggestions stay one click away; only the
  // header × and the lightbulb close it outright.
  // Starts closed. Suggestions are an offer, not the default state of the
  // composer — you arrive at a conversation to read it, and the bolt shining
  // is what says there is something worth opening.
  const [panel, setPanel] = useState<"open" | "collapsed" | "closed">("closed");
  const [activeIndex, setActiveIndex] = useState(0);
  // The row the pointer is over. Separate from activeIndex, which hover also
  // moves: the highlight is where you *are*, this is what you'd *get*, and
  // only the pointer can put a draft into the composer as a ghost.
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [text, setText] = useState("");
  // True while the composer holds text the user has not touched — staged
  // rather than written. Rendered a shade lighter so it is obvious at a
  // glance whose words they are before you hit send.
  const [pristine, setPristine] = useState(false);
  // Bumped on every stage. Focus moves in an effect keyed on this rather than
  // inside the handler: the panel closes in the same commit, so focusing
  // before React has flushed leaves focus on a button that no longer exists.
  const [stageCount, setStageCount] = useState(0);
  // Bumped when the bar re-expands, so focus can be moved onto the panel in an
  // effect. Without it, focus falls to <body> when the bar unmounts and the
  // panel silently takes ownership of Enter with nothing focused.
  const [reopenCount, setReopenCount] = useState(0);
  // The bulb shines a beat after suggestions become relevant — not on
  // arrival. Firing instantly would just be part of the page painting; the
  // pause is what makes it read as "something came up". Holds the moment the
  // timer fired; the visible flag is derived from it further down.
  const [shineArmedAt, setShineArmedAt] = useState<number | null>(null);
  // The coachmark introduces the bolt once per session, then never again.
  // Session-scoped rather than persisted, so the prototype still demos on a
  // reload — localStorage is the one-line change for a real one-time cue.
  const [coachSeen, setCoachSeen] = useState(false);
  const [coachDismissed, setCoachDismissed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Where to drop the caret after a stage. Applied in the same effect that
  // moves focus, since the textarea has to be focused before a selection range
  // will stick.
  const caretRef = useRef<number | null>(null);
  // False immediately after a stage or dismiss, true once the user types. It
  // decides who owns ⌘Z: our stack while the last change was ours, the
  // browser's native text undo once they have edited on top of it.
  const dirtyRef = useRef(false);

  // Undo stack for the actions the browser does not know about — staging and
  // dismissing. Snapshots are whole-state, which is cheap at this size and
  // avoids having to invert each action.
  const historyRef = useRef<
    {
      drafts: Draft[];
      text: string;
      pristine: boolean;
      panel: "open" | "collapsed" | "closed";
      activeIndex: number;
    }[]
  >([]);

  const snapshot = useCallback(() => {
    historyRef.current.push({ drafts, text, pristine, panel, activeIndex });
    if (historyRef.current.length > 25) historyRef.current.shift();
  }, [drafts, text, pristine, panel, activeIndex]);

  const stage = useCallback(
    // `replace` overrides where the draft lands. The digit-pick path uses it
    // to swallow the character it typed while waiting out the pause.
    (draft: Draft, replace?: { from: number; to: number }) => {
      const insert = stageTextFor(draft);
      const el = textareaRef.current;
      // Insert at the caret, replacing any selection — a draft joins what you
      // are already writing rather than overwriting it. The textarea keeps its
      // selection across blur, so this still holds when the draft was clicked.
      const start = replace ? replace.from : el ? el.selectionStart : text.length;
      const end = replace ? replace.to : el ? el.selectionEnd : text.length;
      // Splice against the field's own value, not the state. The digit-pick
      // path is armed from a keydown, so the character that triggered it has
      // not reached state yet — offsets taken from the DOM have to be applied
      // to the DOM's string or they cut in the wrong place.
      const current = el ? el.value : text;
      const next = current.slice(0, start) + insert + current.slice(end);

      snapshot();
      setText(next);
      // Only tint when the staged text is the whole message. Mixed with the
      // user's own writing, tinting all of it would misattribute their words.
      setPristine(next === insert);
        // Drafts are consumable, not templates — a used suggestion leaves the
      // list, so the bar's count stays honest and you cannot stage the same
      // one twice by accident. ⌘Z puts it back.
      setDrafts((prev) => {
        const next = prev.filter((d) => d.id !== draft.id);
        setActiveIndex((i) => Math.min(i, Math.max(next.length - 1, 0)));
        // Nothing left to fold down to.
        setPanel(next.length > 0 ? "collapsed" : "closed");
        return next;
      });
      setStageCount((n) => n + 1);
      caretRef.current = start + insert.length;
      dirtyRef.current = false;
    },
    [text, snapshot],
  );

  useEffect(() => {
    if (stageCount === 0) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const caret = caretRef.current;
    if (caret !== null) el.setSelectionRange(caret, caret);
  }, [stageCount]);

  // Pointing at a row writes its message into the composer as a ghost — shown
  // where it would land, at the size it would have, rather than described in
  // the list. Nothing is committed until Tab (or the chip).
  //
  // An earlier version let the ghost resize the composer live, which moved the
  // panel — and the panel is the thing being pointed at. Hover changing the
  // geometry of its own target is a feedback loop, and no damping made it not
  // one. So the composer's height is *reserved* while the panel is open: held
  // at the tallest draft from the start, so hovering swaps text inside a box
  // that never moves. Stability is a property of the layout, not of a guard.
  const hoverDraft =
    panel === "open" && hoverIndex !== null ? (drafts[hoverIndex] ?? null) : null;
  const ghost = hoverDraft ? stageTextFor(hoverDraft) : null;
  // The ghost continues the typed text, so a space joins them unless one is
  // already there. Shared by the ghost itself and the reserve cells below,
  // which must wrap identically to it.
  const ghostJoin = text && !/\s$/.test(text) ? " " : "";

  // Belt and braces on top of that: the reserve only holds hover-time geometry
  // still — opening the panel and typing still move it. So a hover change has
  // to be paid for with actual movement; identical coordinates to the last one
  // mean the world moved, not the mouse.
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const pointerMoved = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const last = pointerRef.current;
      const moved = !last || last.x !== event.clientX || last.y !== event.clientY;
      pointerRef.current = { x: event.clientX, y: event.clientY };
      return moved;
    },
    [],
  );

  // On mousemove rather than mouseenter: if a row ever does slide under a
  // still pointer, its enter has already fired and been refused, so a later
  // real movement inside that same row would never produce a second one.
  const hoverRow = useCallback(
    (index: number, event: React.MouseEvent) => {
      if (!pointerMoved(event)) return;
      setActiveIndex(index);
      setHoverIndex(index);
    },
    [pointerMoved],
  );

  const leaveSurface = useCallback(
    (event: React.MouseEvent) => {
      if (!pointerMoved(event)) return;
      setHoverIndex(null);
    },
    [pointerMoved],
  );

  const acceptPreview = useCallback(() => {
    if (!hoverDraft) return;
    setHoverIndex(null);
    stage(hoverDraft);
  }, [hoverDraft, stage]);

  // Bound only while a row is open, so Tab keeps its ordinary job of moving
  // focus the rest of the time. On window rather than on the row: the pointer
  // is what opened it, and focus could be anywhere.
  useEffect(() => {
    if (!hoverDraft) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      if (event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return;
      event.preventDefault();
      acceptPreview();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hoverDraft, acceptPreview]);

  // Shine the bulb 1s after there are suggestions to offer and nothing on
  // screen offering them. The effect only arms a timer — the "off" side is
  // derived below rather than written back, so nothing calls setState
  // synchronously during the effect.
  useEffect(() => {
    if (panel !== "closed" || drafts.length === 0) return;
    const armed = window.setTimeout(() => setShineArmedAt(Date.now()), 1000);
    return () => window.clearTimeout(armed);
  }, [panel, drafts.length]);

  // Derived, so opening the panel silences the bulb without an extra write,
  // and closing it again re-arms: the class drops and re-applies, which is
  // what makes the animation replay rather than sit spent.
  const bulbShining =
    shineArmedAt !== null && panel === "closed" && drafts.length > 0;

  // Let the page settle before the coachmark arrives — landing with the first
  // paint would read as chrome rather than as something addressed to you.
  useEffect(() => {
    const t = window.setTimeout(() => setCoachSeen(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  // Opening the panel takes focus — that is what makes bare 1/2/3
  // unambiguous, since they only stage while the composer does *not* have it.
  // Focus is a DOM effect and belongs here; the matching selection reset lives
  // in the handlers that open the panel, so nothing calls setState
  // synchronously during an effect.
  useEffect(() => {
    if (panel !== "open") return;
    panelRef.current?.focus();
  }, [panel, reopenCount]);

  // Opening always starts on the first draft, so Enter and Tab have somewhere
  // to begin rather than needing an arrow press first.
  const openPanel = useCallback(() => {
    setActiveIndex(0);
    setPanel("open");
    setReopenCount((n) => n + 1);
  }, []);


  // ⌘Z / Ctrl+Z. Runs on window so it works whether focus is in the panel or
  // the composer — but it yields to the browser's native text undo whenever
  // the user is actually editing, so their own typing still unwinds normally.
  useEffect(() => {
    const onUndo = (event: KeyboardEvent) => {
      const isUndo =
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "z" &&
        !event.shiftKey;
      if (!isUndo) return;

      const inComposer = document.activeElement === textareaRef.current;
      if (inComposer && dirtyRef.current) return;

      const prev = historyRef.current.pop();
      if (!prev) return;
      event.preventDefault();
      setDrafts(prev.drafts);
      setText(prev.text);
      setPristine(prev.pristine);
      setPanel(prev.panel);
      setActiveIndex(prev.activeIndex);
    };

    window.addEventListener("keydown", onUndo);
    return () => window.removeEventListener("keydown", onUndo);
  }, []);

  // Panel keybinds. Arrows and Enter are ignored while the composer has focus,
  // so typing never moves the selection out from under you; Escape still works
  // from anywhere, including while the surface is folded to the bar.
  useEffect(() => {
    if (panel === "closed") return;

    const onKeyDown = (event: KeyboardEvent) => {
      const inComposer = document.activeElement === textareaRef.current;

      if (event.key === "Escape") {
        event.preventDefault();
        // Escape dismisses the suggestion set outright — one press, gone,
        // whether it is expanded or folded. Folding down is what the
        // chevron is for; Escape is the "I'm not interested" key.
            setPanel("closed");
        return;
      }

      // Everything below drives the open list, so it has nothing to act on
      // while the surface is folded.
      if (panel !== "open") return;

      // Focus decides everything below. While the composer holds it, the
      // panel keeps its hands off the keyboard entirely — digits type, arrows
      // move the caret. No modifier needed, and no shortcut to collide with
      // the browser's.
      if (inComposer || drafts.length === 0) return;

      // Bare 1–9 stages a draft by position.
      const position = digitFromEvent(event);
      if (position !== null) {
        const target = drafts[position - 1];
        if (target) {
          event.preventDefault();
          stage(target);
        }
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % drafts.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + drafts.length) % drafts.length);
      } else if (event.key === "Enter") {
        event.preventDefault();
        const target = drafts[activeIndex];
        if (target) stage(target);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panel, drafts, activeIndex, stage]);

  const canSend = text.trim().length > 0;

  const send = useCallback(() => {
    const body = text.trim();
    if (body.length === 0) return;

    // A leading @mention renders as a mention pill, like the mock.
    const mention = /^(@\w+)([\s\S]*)$/.exec(body);
    const paragraph = mention
      ? [{ text: mention[1], mention: true }, { text: mention[2] }]
      : [{ text: body }];

    setMessages((prev) => [
      ...prev,
      {
        id: `local-${nextMessageIdRef.current++}`,
        author: YOU,
        time: fmtTime(),
        // One paragraph, newlines intact — MessageRow renders pre-wrap, so a
        // staged multi-line draft keeps its shape without every bullet
        // becoming its own paragraph and inheriting the 20px gap.
        body: [paragraph],
      },
    ]);
    setText("");
    setPristine(false);
    dirtyRef.current = false;

    // Only the Notion ask is scripted; everything else just posts.
    if (mention?.[1] === "@Tadao" && /notion/i.test(body)) {
      setTypingAgent(TADAO.name);
      replyTimerRef.current = window.setTimeout(() => {
        setTypingAgent(null);
        setMessages((prev) => [
          ...prev,
          {
            id: "agent-notion",
            author: TADAO,
            time: fmtTime(),
            body: [[{ text: NOTION_REPLY }]],
          },
        ]);
      }, 1600);
    }
  }, [text]);

  // Follow the thread down as it grows, so a sent message is not posted
  // off-screen behind the composer.
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typingAgent, notionConnected]);

  // Digits typed in the composer are ambiguous: "3" could be the number three
  // or a pick of the third draft. Rather than choose a modifier, let the pause
  // after decide — the digit types immediately, and only if nothing follows it
  // for 500ms is it taken back out and read as a pick. Keep typing and it stays
  // a character, which is the common case and the one that must not be wrong.
  const pickTimerRef = useRef<number | null>(null);
  const cancelPick = useCallback(() => {
    if (pickTimerRef.current !== null) {
      window.clearTimeout(pickTimerRef.current);
      pickTimerRef.current = null;
    }
  }, []);
  useEffect(() => cancelPick, [cancelPick]);

  const armPick = useCallback(
    (position: number) => {
      cancelPick();
      pickTimerRef.current = window.setTimeout(() => {
        pickTimerRef.current = null;
        const target = drafts[position - 1];
        if (!target) return;
        const el = textareaRef.current;
        if (!el) return;
        // Remove the digit that was typed while we waited, then stage in the
        // gap it leaves — so the caret ends where the draft does, not one
        // character further on.
        const caret = el.selectionStart;
        const typed = el.value.slice(caret - 1, caret);
        if (typed !== String(position)) return;
        stage(target, { from: caret - 1, to: caret });
      }, PICK_IDLE_AFTER);
    },
    [cancelPick, drafts, stage],
  );

  return (
    // The /channel shell, so the panel is judged where it will actually live:
    // over a thread someone is mid-way through reading, with the composer
    // pinned to the bottom. Explicit background rather than the token —
    // globals.css flips --background to near black under
    // prefers-color-scheme: dark, and these prototypes are drawn light.
    <div
      className="flex h-dvh w-screen flex-col overflow-hidden"
      style={{ background: BG_TERTIARY, color: FG_PRIMARY }}
    >
      <Titlebar />
      <div className="relative flex min-h-0 flex-1">
        <GlobalNav />
        <LocalNav />
        {/* 6px gutter between the two cards — the page bg reads as the divider. */}
        <main className="relative ml-1.5 flex min-w-0 flex-1 flex-col overflow-clip rounded-tl-[6px] bg-white shadow-[0px_0px_0.5px_0.5px_rgba(15,13,13,0.08),0px_1px_2px_0px_rgba(15,13,13,0.05)]">
          <PageHeader />
          {/* mt-auto spacer (not justify-end) pins the thread to the bottom:
              justify-end makes top overflow unscrollable in flex containers. */}
          <div
            ref={messagesRef}
            className="ch-messages flex min-h-0 flex-1 flex-col overflow-y-auto pr-4"
          >
            <div aria-hidden className="mt-auto shrink-0" />
            {messages.map((message) => (
              <div key={message.id} className="flex w-full flex-col">
                <MessageRow
                  message={message}
                  mode={false}
                  selected={false}
                  peeked={false}
                  washDelay={0}
                />
                {message.threadFooter ? <ThreadFooter message={message} /> : null}
                {message.id === "agent-notion" ? (
                  <NotionConnectCard
                    connected={notionConnected}
                    connectedAt={connectedAt}
                    onConnect={() => {
                      setNotionConnected(true);
                      setConnectedAt(
                        new Date().toLocaleDateString("en-US", {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                        }),
                      );
                    }}
                  />
                ) : null}
              </div>
            ))}
            {typingAgent ? <TypingIndicator name={typingAgent} /> : null}
          </div>

          <div className="flex w-full shrink-0 flex-col p-4">
            {/* The anchor is this wrapper, not the padded strip — it hugs the
                composer exactly, so the flyout's offset is measured from the
                composer's edge rather than inheriting the strip's padding on
                top of it. Absolute, so opening the flyout overlays the thread
                instead of shortening it; the conversation stays put. */}
            {/* The panel, its 12px standoff, and the composer are one hover
                surface — the ghost's tab chip lives in the composer, so the
                pointer has to be able to travel from a row down to it without
                that reading as leaving. Hover ends here, at the outer edge,
                and nowhere inside. */}
            <div className="relative w-full" onMouseLeave={leaveSurface}>
              {coachSeen && !coachDismissed ? (
                <Coachmark onDismiss={() => setCoachDismissed(true)} />
              ) : null}

              {/* Mounted for both open and collapsed — the same element
                  morphs between shapes, so unmounting between them would
                  forfeit the transition. Only dismissal unmounts it. */}
              {drafts.length > 0 && panel !== "closed" ? (
                <FlyoutSurface
                  panel={panel}
                  drafts={drafts}
                  activeIndex={activeIndex}
                  setActiveIndex={setActiveIndex}
                  panelRef={panelRef}
                  onStage={stage}
                  hoverIndex={hoverIndex}
                  onHoverRow={hoverRow}
                  onCollapse={() => setPanel("collapsed")}
                  onOpen={openPanel}
                  onDismiss={() => setPanel("closed")}
                />
              ) : null}

            {/* Composer — same shell as /channel so the panel sits on
                something familiar rather than a bespoke input. */}
            <div
              className="flex w-full flex-col gap-2 overflow-hidden rounded-[10px] border-[0.5px] bg-white p-3"
              style={{ borderColor: STROKE }}
            >
          {/* Relative so the field can be laid over its sizing mirror. */}
          <div className="relative w-full">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setPristine(false);
              dirtyRef.current = true;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
                return;
              }
              // Any keystroke cancels a pending pick — you kept typing, so
              // the digit was a digit.
              cancelPick();
              if (panel === "closed" || drafts.length === 0) return;
              const position = digitFromEvent(event);
              if (position !== null && position <= drafts.length) armPick(position);
            }}
            rows={1}
            // The ghost occupies the line the placeholder would; two greys
            // saying different things is one too many.
            placeholder={ghost ? "" : `Send a message in ${CHANNEL}`}
            aria-label={`Message ${CHANNEL}`}
            // Always laid over the mirror below, which is what decides how
            // tall the field is. A fixed h-10 was fine while nothing longer
            // than a line ever arrived, but a staged draft is a paragraph —
            // it would land in a two-line box and scroll out of sight.
            className="absolute inset-0 h-full w-full resize-none bg-transparent px-1 text-[14px] leading-5 outline-none placeholder:text-[#a8a29e]"
            style={{ color: pristine ? FG_SECONDARY : FG_PRIMARY }}
          />

          {/* The mirror. An invisible copy of the typed text, in flow purely
              to take up space, so the composer is exactly as tall as what it
              actually holds and the textarea stretches to match. Only real
              content sizes the box — the ghost never does; see below. */}
          <div
            aria-hidden
            className="pointer-events-none invisible min-h-10 w-full px-1 text-[14px] leading-5 break-words whitespace-pre-wrap"
          >
            {text}
            {/* A trailing newline has no line of its own without something on
                it, so the mirror would come up one line short of the field. */}
            {"​"}
          </div>

          {/* The ghost: the hovered draft, whole, continuing the typed text —
              laid over the field in a box the composer already has, scrolling
              inside it rather than growing it. That containment is what makes
              hover-preview stable: the composer never changes size on hover,
              so the panel above never moves, and the feedback loop that
              plagued every resizing version of this cannot form. The layer
              repeats the typed text in real ink (opaque over the field, so
              the pair scroll as one message); keyed by draft so a swap starts
              back at the top. onMouseDown prevented so reading or scrolling
              never pulls focus from the field the text would land in. */}
          {ghost && hoverDraft ? (
            <div
              key={hoverDraft.id}
              className="absolute inset-0 overflow-y-auto overscroll-contain bg-white px-1 text-[14px] leading-5 break-words whitespace-pre-wrap"
              onMouseDown={(event) => event.preventDefault()}
            >
              <span style={{ color: pristine ? FG_SECONDARY : FG_PRIMARY }}>
                {text}
              </span>
              <span aria-hidden style={{ color: GHOST }}>
                {ghostJoin}
                {ghost}
              </span>
              {/* Against the last word of the message it takes. Outlined, not
                  filled — the keybind badges in the panel are the filled
                  ones, and this is a control, not a label. */}
              <button
                type="button"
                onClick={acceptPreview}
                aria-label={`Insert draft: ${hoverDraft.title}`}
                className="ml-1.5 inline-flex h-[18px] items-center justify-center rounded-[4px] border-[0.5px] px-1.5 align-middle text-[11px] leading-none transition-colors hover:bg-black/5"
                style={{ borderColor: STROKE, color: FG_TERTIARY }}
              >
                tab
              </button>
            </div>
          ) : null}
          </div>

          <div className="flex w-full items-center justify-between">
            {/* Icon row per the flow: attach, text, emoji, gif, then the
                suggestion bulb. All inert except the bulb — they are the
                composer's furniture, not this prototype's subject. */}
            <span className="flex items-center gap-1">
              {[ICON_PATHS.paperclip, ICON_PATHS.text, ICON_PATHS.emojiSmile, ICON_PATHS.gif].map(
                (path, i) => (
                  <span
                    key={i}
                    className="flex size-7 items-center justify-center rounded-[6px]"
                    style={{ color: FG_TERTIARY }}
                  >
                    <Icon path={path} />
                  </span>
                ),
              )}
              {/* The suggestion toggle. Filled bolt either way — the registry
                  ships no outlined variant at this weight — so state is
                  carried by colour, across all three panel states rather than
                  just open/not: brand when open, brand at half strength when
                  folded to the bar (there is still something there), tertiary
                  when closed. A dot marks "waiting" so the difference does not
                  rest on a colour distinction alone. */}
              <button
                type="button"
                onClick={() => {
                  // Using the control is the clearest possible signal that
                  // its explanation has landed.
                  setCoachDismissed(true);
                  // Once every suggestion has been used or dismissed, the
                  // bolt is the way to ask for a fresh set — which is what a
                  // real "suggest again" would do, and what the removed demo
                  // reset button was standing in for.
                  if (drafts.length === 0) {
                    setDrafts(INITIAL_DRAFTS);
                                    openPanel();
                    return;
                  }
                  if (panel === "open") setPanel("closed");
                  else openPanel();
                }}
                aria-pressed={panel !== "closed"}
                aria-label={
                  panel === "open"
                    ? "Hide suggested drafts"
                    : `Show suggested drafts${
                        panel === "collapsed" ? ` (${drafts.length} waiting)` : ""
                      }`
                }
                className={`relative flex size-7 items-center justify-center rounded-[6px] transition-colors hover:bg-black/5${
                  bulbShining ? " bulb-shine" : ""
                }`}
                style={{
                  color:
                    panel === "open"
                      ? BRAND
                      : panel === "collapsed"
                        ? "#93b0f5"
                        : FG_TERTIARY,
                }}
              >
                <Icon path={ICON_PATHS.zapFilled} />
                {panel === "collapsed" && drafts.length > 0 ? (
                  <span
                    className="absolute right-1 top-1 size-1.5 rounded-full"
                    style={{ background: BRAND }}
                  />
                ) : null}
              </button>
            </span>
            {/* Borderless plane per the flow — no filled box; readiness is
                carried by ink. The small chevron is the send-options
                affordance from the mock, decorative here. */}
            <span className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Send message"
                disabled={!canSend}
                onClick={send}
                className="flex size-7 items-center justify-center rounded-[6px] transition-colors hover:bg-black/5"
                style={{
                  color: canSend ? FG_PRIMARY : "#a8a29e",
                  cursor: canSend ? "pointer" : "default",
                }}
              >
                <Icon path={ICON_PATHS.paperPlane} />
              </button>
              <Icon
                path={ICON_PATHS.chevronDownSmall}
                size={14}
                style={{ color: "#a8a29e" }}
              />
            </span>
              </div>
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
