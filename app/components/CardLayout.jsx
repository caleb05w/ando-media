"use client";

import { useRef, useState } from "react";
import AgentContextCard from "./AgentContextCard";

export default function CardLayout() {
  const containerRef = useRef(null);
  // hidden → signing → ready → laminated
  const [phase, setPhase] = useState("hidden");

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden font-sans"
      style={{
        background: "#005f65",
        backgroundImage: "url('/bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <AgentContextCard
        containerRef={containerRef}
        phase={phase}
        laminated={phase === "laminated"}
        onEnter={() => setPhase("signing")}
        onGoodToGo={() => setPhase("ready")}
        onLaminate={() => setPhase("laminated")}
        onReset={() => setPhase("hidden")}
      />
    </div>
  );
}
