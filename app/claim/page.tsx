import type { Metadata } from "next";

import { WorldBall } from "../affiliate-world/world-ball";

// /claim — for now, only the world itself: the ball, centred, and
// nothing else. The statement and the claim field are parked; the
// bubble found its form — a globe you can hold.

export const metadata: Metadata = {
  title: "Claim your handle · Ando",
  description: "The Ando world — the people building their working worlds inside.",
};

export default function ClaimPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="w-full max-w-[560px] px-5">
        <WorldBall />
      </div>
    </main>
  );
}
