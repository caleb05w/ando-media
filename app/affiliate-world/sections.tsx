import { WorldStepper } from "./world-stepper";

// The affiliate world's sections. The page is a claiming surface,
// pared to one move: the world beside your name. The uses shelf is
// retired to /the-library; the profiles live in the side panel now.
// Styling follows the affiliate page's STYLE.md — the landing system
// verbatim.

/** The landing prose grid: 640px column centre, gutters breathing. */
function ProseGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="content-frame grid grid-cols-1 gap-x-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,640px)_minmax(0,1fr)]">
      <aside className="hidden xl:block" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ── the hero — the world seen whole, then your name ──────────────────── */
/* Exported: /claim mounts this block alone as the claiming page. The
   stepper owns the whole hero — iteration 1 seats the halo beside the
   claim, iteration 2 (the Brand 3772-11750 duet) seats the packed
   crowd there. */
export function WorldHeader() {
  return (
    <header className="flex min-h-svh flex-col items-center justify-center py-10">
      <WorldStepper />
    </header>
  );
}

/* ── the page ─────────────────────────────────────────────────────────── */

export function WorldView() {
  return (
    <div className="relative w-full">
      <ProseGrid>
        <WorldHeader />
      </ProseGrid>
    </div>
  );
}
