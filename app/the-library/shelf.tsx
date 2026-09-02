"use client";

import { useEffect, useRef, useState } from "react";

// The shelf itself — client-side only for the one bit of state the page has:
// which way the canvases are laid out. Carousel is the Figma reference view
// (full-bleed row of white canvases on the grey ground, scroll-snapped);
// list is a two-up grid for reading the whole set at once. A single icon
// button toggles between them, always showing the view it would switch to.
// The carousel hides its scrollbar, so a plain mouse wheel is its only
// handle: vertical wheel is translated to horizontal travel.

export type Piece = {
  label: string;
  title: string;
  home: string;
  render: React.ReactNode;
};

type View = "carousel" | "grid";

function GridIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  );
}

function CarouselIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden
    >
      <rect x="4.75" y="3" width="6.5" height="10" rx="1.5" />
      <path d="M2 5.5v5" />
      <path d="M14 5.5v5" />
    </svg>
  );
}

export function LibraryShelf({ pieces }: { pieces: Piece[] }) {
  const [view, setView] = useState<View>("carousel");
  const next: View = view === "carousel" ? "grid" : "carousel";
  const shelfRef = useRef<HTMLDivElement>(null);

  // The wheel is the shelf's handle: a vertical tick travels the row.
  // Non-passive so the page doesn't bounce while the shelf moves;
  // trackpads already scrolling sideways pass through untouched.
  useEffect(() => {
    const el = shelfRef.current;
    if (!el || view !== "carousel") return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [view]);

  return (
    <>
      <header className="mx-auto flex w-full max-w-[888px] items-start justify-between gap-6 px-5 pt-16">
        <div className="flex max-w-[560px] flex-col gap-3">
          <h1 className="text-[22px] font-medium leading-7 text-[#1a1817]">
            The library
          </h1>
          <p className="text-[13px] leading-[19px] text-[#78716c]">
            The media components built for the Ando homepage, each in its own
            canvas container exactly as the prose column embeds it. The
            components live here and /landing-page imports them, so this shelf
            is the source, not a copy.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setView(next)}
          aria-label={next === "grid" ? "Switch to list view" : "Switch to carousel view"}
          title={next === "grid" ? "List view" : "Carousel view"}
          className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-white text-[#58524e] shadow-[0px_0px_0px_1px_rgba(81,76,71,0.12)] transition-colors ease-fast hover:text-[#1a1817]"
        >
          {next === "grid" ? <GridIcon /> : <CarouselIcon />}
        </button>
      </header>

      <div
        className={
          view === "carousel"
            ? "lib-shelf lib-shelf--carousel mt-12"
            : "lib-shelf lib-shelf--grid mt-12"
        }
        ref={shelfRef}
      >
        {pieces.map((piece) => (
          <section key={piece.label} className="lib-piece group">
            {/* the render crosses the server boundary ownerless; as a
                direct array sibling of the caption, React asks it for a
                key it cannot carry. Sole child of a layout-transparent
                div, it needs none. */}
            <div className="contents">{piece.render}</div>
            {/* the caption keeps its line so the shelf doesn't reflow;
                it only surfaces while the pointer is on the piece */}
            <div className="mt-[10px] flex min-w-0 items-baseline gap-[10px] px-[4px] opacity-0 transition-opacity ease-fast group-hover:opacity-100">
              <span className="shrink-0 font-mono text-[10px] tracking-[0.2em] text-[#a8a29e]">
                {piece.label}
              </span>
              <h2 className="shrink-0 text-[13px] font-medium leading-[18px] text-[#1a1817]">
                {piece.title}
              </h2>
              <span className="truncate text-[12px] leading-[18px] text-[#a8a29e]">
                {piece.home}
              </span>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
