"use client";

// Loops /agent-typing-experience variants end to end: typing wave → arrival
// morph → agent hold → reset, then advances to the next variant in the
// group. Frames are computed from the storyboard splines, so this is the
// real rig, not a re-approximation.
//
// The SVG renders inside a shadow root and ticks at ~30fps: the rig mutates
// attributes every frame, and keeping that churn out of the light DOM stops
// document-level MutationObservers (Agentation's component scanner) from
// re-scanning the page per frame.

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "motion/react";
import { Stage } from "./stage";
import {
  cycleFrame,
  cycleMs,
  typingFrame,
  VARIANTS,
  type VariantGroup,
} from "./variants";

const AVATAR_SRC = "/inline-multi-select/agent-avatar.png";
const FRAME_MS = 33; // ~30fps — plenty at indicator size

export function TypingCycle({
  size = 32,
  group = "v3",
}: {
  size?: number;
  /** variant group to rotate through, one full cycle each */
  group?: VariantGroup;
}) {
  const reduceMotion = Boolean(useReducedMotion());
  const roster = useMemo(() => {
    const picked = VARIANTS.filter((v) => v.group === group);
    return picked.length > 0 ? picked : VARIANTS;
  }, [group]);
  const restFrame = useMemo(() => typingFrame(0, 1), []);
  const [frame, setFrame] = useState(restFrame);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const attachHost = useCallback((host: HTMLSpanElement | null) => {
    if (host) setRoot(host.shadowRoot ?? host.attachShadow({ mode: "open" }));
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    const total = roster.reduce((sum, v) => sum + cycleMs(v), 0);
    let raf = 0;
    let last = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < FRAME_MS) return;
      last = t;
      let c = (t - t0) % total;
      let i = 0;
      while (c >= cycleMs(roster[i])) {
        c -= cycleMs(roster[i]);
        i += 1;
      }
      setFrame(cycleFrame(roster[i], c).frame);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, roster]);

  return (
    <span ref={attachHost} style={{ display: "block", width: size, height: size }}>
      {root
        ? createPortal(
            <>
              <style>{"svg{display:block}"}</style>
              <Stage
                frame={reduceMotion ? restFrame : frame}
                size={size}
                crop
                avatarSrc={AVATAR_SRC}
              />
            </>,
            root,
          )
        : null}
    </span>
  );
}
