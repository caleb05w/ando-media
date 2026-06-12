import type { Metadata } from "next";
import Scene from "./Scene";
import SkyBackground from "./SkyBackground";

export const metadata: Metadata = {
  title: "June",
};

export default function Week2Page() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-white">
      <SkyBackground />
      <Scene />
    </main>
  );
}
