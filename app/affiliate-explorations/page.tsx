import type { Metadata } from "next";

import { MiniAndo2Explorations } from "../affiliate/mini-ando-2";
import { MiniAndoView, SaraArchiveView } from "../affiliate/sections";
import { ViewToggle } from "../affiliate/view-toggle";

// /affiliate-explorations — the exploration bench. The real page
// lives at /affiliate; this keeps the toggle: the mini ando 2 shelf and the
// @sara parking lot, with the real page along for comparison.

export const metadata: Metadata = {
  title: "@sara explorations · Ando",
  description: "Explorations for the affiliate page.",
};

export default function AffiliateLabPage() {
  return (
    <main className="min-h-screen bg-white">
      <ViewToggle mini={<MiniAndoView />} mini2={<MiniAndo2Explorations />} affiliate={<SaraArchiveView />} />
    </main>
  );
}
