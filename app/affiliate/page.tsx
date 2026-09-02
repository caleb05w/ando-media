import type { Metadata } from "next";

import { MiniAndoView } from "./sections";

// /affiliate — the public affiliate/profile page, ando.so/@sara.
// The pitch inverts the usual landing page: instead of Ando describing
// itself, you see one person's working world from the inside, and the
// invite is personal: "Accept Sara's invite."
//
// This is the real page — mini ando, straight. The exploration bench
// (mini ando 2, the @sara parking lot) lives at /affiliate-explorations.

export const metadata: Metadata = {
  title: "@sara · Ando",
  description: "Sara is building her working world in Ando. Join her there.",
};

export default function AffiliatePage() {
  return (
    <main className="min-h-screen bg-white">
      <MiniAndoView />
    </main>
  );
}
