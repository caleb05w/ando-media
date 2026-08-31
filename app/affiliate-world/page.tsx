import type { Metadata } from "next";

import { WorldView } from "./sections";

// /affiliate-world — the world all the @handle pages open onto, and
// the place you claim yours. In or out is the whole pitch: the crowd
// seen whole (Brand 3639-7178), the members in their own words, and a
// claim field that holds your place in the waitlist line. The @sara
// page is one member's world; this is the universe around it.

export const metadata: Metadata = {
  title: "The affiliate world · Ando",
  description:
    "217 people are building their working worlds in Ando. Claim your @handle to hold your place in line.",
};

export default function AffiliateWorldPage() {
  return (
    <main className="min-h-screen bg-white pb-0">
      <WorldView />
    </main>
  );
}
