import { Heading, Text, TextSize } from "@repo/design-system-ui/text";

import { UseCards } from "./use-cards";
import { WorldStepper } from "./world-stepper";

// The affiliate world's sections. The page is a claiming surface,
// pared to two moves: the world seen whole with your name beside it,
// then its day as printed ephemera. Styling follows the affiliate
// page's STYLE.md — the landing system verbatim.

/** The landing page's section heading, verbatim: display face, Large→XXL. */
function ContentHeading({ children, id }: { children: string; id: string }) {
  return (
    <Heading as="h2" className="scroll-mt-24" id={id} size={{ base: TextSize.Large, md: TextSize.XXL }} weight="regular">
      {children}
    </Heading>
  );
}

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
   stepper owns the whole hero — iterations 1 and 2 stack the world
   over the claim, iteration 3 (the Brand 3772-11750 duet) seats the
   crowd beside it. */
export function WorldHeader() {
  return (
    <header className="pt-16 md:pt-20">
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

        {/* the uses — the world's day as printed ephemera: a meishi, a
            pharmacy card, a recipe, a sachet. One use case each, in the
            members' own words. */}
        <section aria-labelledby="the-uses" className="pt-20 md:pt-24">
          <ContentHeading id="the-uses">The uses</ContentHeading>
          <Text className="mt-4" color="secondary" size={TextSize.Small}>
            What a working world does all day — printed small enough to keep.
          </Text>
          <div className="mt-10 pb-24">
            <UseCards />
          </div>
        </section>
      </ProseGrid>
    </div>
  );
}
