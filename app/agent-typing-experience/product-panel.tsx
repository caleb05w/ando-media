"use client";

// The in-product side panel: the actual /trace-canvas page (this week's
// working copy of the inline agent trace — transcript, agent machinery,
// corner stack, flyout, surface switcher and all), mounted wholesale,
// with its typing presence running whichever variant the deck has
// selected.
//
// Containment: the page styles itself `w-screen h-dvh` and positions its
// overlays `fixed`, so the aside carries a transform — a transformed
// ancestor becomes the containing block for fixed descendants — and the
// `.aw-page` root is overridden to fill the panel instead of the viewport.

import TraceCanvasPage from "../trace-canvas/page";
import type { Variant } from "./variants";

export const PANEL_W = 760;

export function ProductPanel({ variant }: { variant?: Variant }) {
  return (
    <aside
      aria-label="In product"
      className="fixed right-0 top-0 z-20 h-screen overflow-hidden border-l border-[#ebe9e8] bg-white [&_.aw-page]:!h-full [&_.aw-page]:!w-full"
      style={{ width: PANEL_W, transform: "translateZ(0)" }}
    >
      <TraceCanvasPage typingVariant={variant} />
    </aside>
  );
}
