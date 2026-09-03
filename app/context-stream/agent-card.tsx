"use client";

// The agent's card — what forms around the disc once it has taken the
// line in. A hero band (the avatar floats over it, driven by scene.tsx),
// then a body that is first the introduction — name, one line, a button —
// and then, at `work`, the library's context trace: the agent reading its
// sources, striking them off and folding them in. The scene crossfades the
// two bodies and lerps the card's height between what each measures.

import { ContextTrace } from "../the-library/context-trace";
import { AGENT_CARD_W, HERO_H } from "./stream";

const noop = () => {};

export function AgentCard({ copyRef, traceRef, traceMs }: { copyRef: React.RefObject<HTMLDivElement | null>; traceRef: React.RefObject<HTMLDivElement | null>; /** ms on the trace's clock, or null while it is not running */ traceMs: number | null }) {
  return (
    <div className="relative overflow-hidden" style={{ width: AGENT_CARD_W }}>
      <div data-cs="agent-hero" className="relative" style={{ height: HERO_H, background: "radial-gradient(120% 90% at 50% 110%, #ffffff 0%, rgba(255,255,255,0) 55%), linear-gradient(165deg, #f4f2ef 0%, #e6e2dd 100%)" }}>
        {/* A soft sweep, the one flourish. */}
        <div className="absolute inset-x-[-10%] top-[46%] h-[70%] rounded-[50%] bg-white/55 blur-2xl" />
      </div>
      {/* Two bodies share the slot; the scene picks the height and the fade. */}
      <div className="relative">
        <div ref={copyRef} data-cs="agent-card" className="flex flex-col items-center px-8 pb-8 pt-7 text-center">
          <div className="text-ando-fg-primary" style={{ fontSize: 30, letterSpacing: -0.5, lineHeight: "36px", fontWeight: 600 }}>Meet Ando</div>
          <div className="kanso-text-label-16 mt-2 max-w-[460px] text-ando-fg-secondary">Reads every channel, doc and call you give it. Ask it anything.</div>
          <div className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-[#1a1817] kanso-text-label-16-md text-white">Open in Ando</div>
        </div>
        <div ref={traceRef} data-trace className="absolute inset-x-0 top-0 px-6 pb-6 pt-5" style={{ opacity: 0 }}>
          {traceMs == null ? null : <ContextTrace theme="light" vt={traceMs} open onToggle={noop} width="100%" />}
        </div>
      </div>
    </div>
  );
}
