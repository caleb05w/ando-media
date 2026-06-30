"use client";

import { useEffect, useRef, useState } from "react";

const CARD_W  = 296;
const FRICTION = 0.92;

const SHADOWS = {
  default: "0px 0px 0.2px rgba(16,16,16,0.08), 0px 2.5px 1.2px rgba(16,16,16,0.04), 0px 6.6px 3.3px rgba(16,16,16,0.04), 0px 23px 13px rgba(16,16,16,0.08)",
  hover:   "0px 0px 0.3px rgba(16,16,16,0.10), 0px 4px 2px rgba(16,16,16,0.06), 0px 10px 5px rgba(16,16,16,0.06), 0px 30px 18px rgba(16,16,16,0.12)",
  press:   "0px 0px 0.15px rgba(16,16,16,0.06), 0px 1px 0.5px rgba(16,16,16,0.03), 0px 3px 1.5px rgba(16,16,16,0.03), 0px 8px 5px rgba(16,16,16,0.06)",
};

const IMG = {
  avatar:      "https://www.figma.com/api/mcp/asset/bbc80c4c-21ea-4cea-8764-078c2a785910",
  status:      "https://www.figma.com/api/mcp/asset/a0216aa3-5392-437e-bd4a-79322b6e6e43",
  iconCross:   "https://www.figma.com/api/mcp/asset/3242b0e5-5d29-4b57-8cf6-5caf9a66bb70",
  iconMessage: "https://www.figma.com/api/mcp/asset/905683e3-fee8-4fc4-bc4f-d80fa573b05a",
  iconJam:     "https://www.figma.com/api/mcp/asset/30c82a01-5080-4d9f-a9ba-e71ae2851e46",
  holeL:       "https://www.figma.com/api/mcp/asset/b54f271a-c489-41cb-8e08-a45b1cffca8d",
  holeR:       "https://www.figma.com/api/mcp/asset/391a3764-2e96-4a21-8745-800971e69f61",
  backX:       "https://www.figma.com/api/mcp/asset/f0a09dad-5476-486f-a39c-506a3c67cc29",
  logoTL:      "https://www.figma.com/api/mcp/asset/19637cc1-dec2-4997-9874-33d74d89a881",
  logoTR:      "https://www.figma.com/api/mcp/asset/9599dd8f-a455-43a2-a604-a8c90e36edf3",
  logoBL:      "https://www.figma.com/api/mcp/asset/34a699b2-48fd-4520-8d0f-fd9eaad88699",
  logoBR:      "https://www.figma.com/api/mcp/asset/b02d4a5a-69d5-4728-94db-bd8327cb0848",
};


export default function AgentContextCard({ containerRef, phase = "hidden", laminated = false, onLaminate, onReset, onEnter, onGoodToGo }) {
  const [ready, setReady] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [cardBottomY, setCardBottomY] = useState(null);
  const shiftHeld     = useRef(false);
  const phaseRef      = useRef(phase);
  const onGoodToGoRef = useRef(onGoodToGo);
  const onEnterRef    = useRef(onEnter);
  const onResetRef    = useRef(onReset);
  useEffect(() => { phaseRef.current      = phase;      }, [phase]);
  useEffect(() => { onGoodToGoRef.current = onGoodToGo; }, [onGoodToGo]);
  useEffect(() => { onEnterRef.current    = onEnter;    }, [onEnter]);
  useEffect(() => { onResetRef.current    = onReset;    }, [onReset]);

  const pos     = useRef({ x: 0, y: 0 });
  const rot     = useRef({ r: 0, vr: 0 });
  const drag    = useRef({ on: false, startX: 0, startR: 0, prevX: 0, vx: 0 });
  const tilt    = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const tiltTgt = useRef({ x: 0, y: 0 });
  const press   = useRef(false);
  const scale   = useRef({ s: 1, v: 0 });

  const cardEl    = useRef(null);
  const cardInner = useRef(null);
  const rafId     = useRef(null);
  const holdTimer = useRef(null);
  const spinAnim  = useRef({ active: false, startR: 0, progress: 0 });
  const enterAnim  = useRef({ active: false, progress: 0 });
  const exitAnim   = useRef({ active: false, progress: 0, onComplete: null });
  const cardShown  = useRef(false);
  const drawCanvas = useRef(null);
  const isDrawing  = useRef(false);
  const lastPt     = useRef({ x: 0, y: 0 });
  const lanyardFrontShineRef = useRef(null);
  const lanyardBackShineRef  = useRef(null);
  const lanyardFrontBodyRef  = useRef(null);
  const lanyardBackBodyRef   = useRef(null);

  // Mount: set x, trigger render
  useEffect(() => {
    pos.current.x = (containerRef?.current?.offsetWidth || window.innerWidth) / 2;
    setReady(true);
  }, []);

  // After card renders: measure actual height and center the card+lanyard group
  useEffect(() => {
    if (!ready || !cardEl.current) return;
    const cardH  = cardEl.current.offsetHeight;
    const contW  = containerRef?.current?.offsetWidth  || window.innerWidth;
    const contH  = containerRef?.current?.offsetHeight || window.innerHeight;
    // Shift card down so the lanyard+gap+card group is centered
    const LANYARD_H = 58; // 34px header + 24px gap above card
    pos.current = { x: contW / 2, y: Math.max(20, (contH - cardH + LANYARD_H) / 2) };
    cardEl.current.style.left       = `${pos.current.x - CARD_W / 2}px`;
    cardEl.current.style.top        = `${pos.current.y}px`;
    cardEl.current.style.visibility = "visible";
    cardEl.current.style.opacity    = "0";
    setCardBottomY(pos.current.y + cardH);
  }, [ready]);

  // Size the draw canvas to match the card at device pixel ratio
  useEffect(() => {
    if (!ready || !drawCanvas.current || !cardInner.current) return;
    const w   = cardInner.current.offsetWidth;
    const h   = cardInner.current.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    drawCanvas.current.width  = Math.round(w * dpr);
    drawCanvas.current.height = Math.round(h * dpr);
    const ctx = drawCanvas.current.getContext("2d");
    ctx.scale(dpr, dpr);
  }, [ready]);

  // o = enter, p = reset+exit
  useEffect(() => {
    if (!ready) return;
    const onKeyDown = (e) => {
      if (e.key === "q" || e.key === "Q") {
        shiftHeld.current = true;
        rot.current.r  = 0;
        rot.current.vr = 0;
        tilt.current   = { x: 0, y: 0, vx: 0, vy: 0 };
        if (cardEl.current) cardEl.current.style.cursor = "crosshair";
        return;
      }
      if (e.key === "w" || e.key === "W") {
        if (phaseRef.current === "signing") onGoodToGoRef.current?.();
        return;
      }
      if (e.key === "o" || e.key === "O") {
        enterAnim.current = { active: true, progress: 0 };
        onEnterRef.current?.();
      }
      if (e.key === "p" || e.key === "P") {
        exitAnim.current = {
          active: true, progress: 0,
          onComplete: () => {
            onResetRef.current?.();
            rot.current   = { r: 0, vr: 0 };
            tilt.current  = { x: 0, y: 0, vx: 0, vy: 0 };
            spinAnim.current.active = false;
            if (drawCanvas.current) {
              const ctx = drawCanvas.current.getContext("2d");
              ctx.clearRect(0, 0, drawCanvas.current.width, drawCanvas.current.height);
            }
          },
        };
      }
    };
    const onKeyUp = (e) => {
      if (e.key === "q" || e.key === "Q") {
        shiftHeld.current = false;
        isDrawing.current = false;
        if (cardEl.current) cardEl.current.style.cursor = "grab";
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [ready]);

  // RAF: spin + tilt + Three.js
  useEffect(() => {
    if (!ready) return;
    const tick = () => {
      const sa = spinAnim.current;
      if (shiftHeld.current) {
        // Card locked for signing — kill all rotation
        rot.current.vr = 0;
        tilt.current.vx = tilt.current.vy = 0;
        tiltTgt.current = { x: 0, y: 0 };
      } else if (sa.active) {
        sa.progress = Math.min(1, sa.progress + 1 / 150);
        const p = sa.progress;
        const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        rot.current.r = sa.startR + 360 * t;
        if (sa.progress >= 1) { sa.active = false; rot.current.vr = 0; }
      } else if (!drag.current.on) {
        rot.current.vr *= FRICTION;
        rot.current.r  += rot.current.vr;
      }
      // Enter / exit: scale + opacity, 400ms (24 frames)
      const eio    = (p) => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const spring = (p) => 1 - Math.exp(-6 * p) * Math.cos(2.2 * Math.PI * p);
      let cardScale   = cardShown.current ? 1 : 0.5;
      let cardOpacity = cardShown.current ? 1 : 0;
      let yOff        = cardShown.current ? 0 : -12;
      const ea = enterAnim.current;
      const xa = exitAnim.current;
      if (ea.active) {
        ea.progress = Math.min(1, ea.progress + 1 / 24);
        const s = spring(ea.progress);
        cardScale   = 0.5 + 0.5 * s;
        cardOpacity = eio(ea.progress);
        yOff        = -12 * (1 - s);
        if (ea.progress >= 1) { ea.active = false; cardShown.current = true; }
      } else if (xa.active) {
        xa.progress = Math.min(1, xa.progress + 1 / 24);
        const t = eio(xa.progress);
        cardScale   = 1 - 0.5 * t;
        cardOpacity = 1 - t;
        yOff        = -12 * t;
        if (xa.progress >= 1) { xa.active = false; cardShown.current = false; xa.onComplete?.(); }
      }
      if (cardEl.current) {
        cardEl.current.style.setProperty("transform", `perspective(900px) rotateY(${rot.current.r}deg) translateY(${yOff}px) scale(${cardScale})`);
        cardEl.current.style.opacity = cardOpacity;
      }

      const t  = tilt.current;
      const tt = drag.current.on ? { x: 0, y: 0 } : tiltTgt.current;
      t.vx = (t.vx + (tt.x - t.x) * 0.13) * 0.70;
      t.vy = (t.vy + (tt.y - t.y) * 0.13) * 0.70;
      t.x += t.vx; t.y += t.vy;

      const sc = scale.current;
      sc.v = (sc.v + ((press.current ? 0.97 : 1.0) - sc.s) * 0.35) * 0.60;
      sc.s += sc.v;
      cardInner.current?.style.setProperty("transform", `rotateX(${t.x}deg) rotateY(${t.y}deg) scale(${sc.s})`);

      // iOS glass sheen on lanyard header — shifts with tilt
      const lanyardGlass = (el) => {
        if (!el) return;
        const angle = 130 + t.y * 18;
        const stop  = Math.max(20, Math.min(70, 45 + t.y * 22));
        el.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.08) ${stop}%, rgba(255,255,255,0.0) 100%)`;
      };
      lanyardGlass(lanyardFrontShineRef.current);
      lanyardGlass(lanyardBackShineRef.current);
      lanyardGlass(lanyardFrontBodyRef.current);
      lanyardGlass(lanyardBackBodyRef.current);

      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [ready]);

  const setShadow = (s) => cardInner.current?.style.setProperty("box-shadow", s);

  const getDrawPt = (e) => {
    const r = drawCanvas.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    if (shiftHeld.current) {
      isDrawing.current = true;
      lastPt.current = getDrawPt(e);
      return;
    }

    drag.current = { on: true, startX: e.clientX, startR: rot.current.r, prevX: e.clientX, vx: 0 };
    press.current = true;
    rot.current.vr = 0;
    cardEl.current.style.cursor = "grabbing";
    setShadow(SHADOWS.press);

    if (!laminated && phase === "ready") {
      setIsHolding(true);
      onLaminate?.();
      holdTimer.current = setTimeout(() => {
        setIsHolding(false);
      }, 1000);
    }
  };

  const onPointerMove = (e) => {
    if (shiftHeld.current) {
      if (!isDrawing.current || !drawCanvas.current) return;
      const pt  = getDrawPt(e);
      const ctx = drawCanvas.current.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(lastPt.current.x, lastPt.current.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.strokeStyle = "rgba(20, 12, 4, 0.82)";
      ctx.lineWidth   = 1.5;
      ctx.lineCap     = "round";
      ctx.lineJoin    = "round";
      ctx.stroke();
      lastPt.current = pt;
      return;
    }
    if (!drag.current.on) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 6) clearTimeout(holdTimer.current);
    drag.current.vx = e.clientX - drag.current.prevX;
    drag.current.prevX = e.clientX;
    if (!spinAnim.current.active) rot.current.r = drag.current.startR + dx;
  };

  const onPointerUp = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      return;
    }
    clearTimeout(holdTimer.current);
    setIsHolding(false);
    drag.current.on = false;
    press.current   = false;
    rot.current.vr  = spinAnim.current.active ? 0 : drag.current.vx * 1.2;
    cardEl.current.style.cursor = "grab";
    setShadow(SHADOWS.default);
  };

  const onMouseMove = (e) => {
    if (shiftHeld.current || drag.current.on || !cardEl.current) return;
    const r  = cardEl.current.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top)  / r.height;
    tiltTgt.current = { x: (ny - 0.5) * -10, y: (nx - 0.5) * 10 };
  };

  const onMouseEnter = () => setShadow(SHADOWS.hover);

  const onMouseLeave = () => {
    tiltTgt.current = { x: 0, y: 0 };
    if (!drag.current.on) setShadow(SHADOWS.default);
  };

  if (!ready) return null;

  return (
    <>
    <div
      ref={cardEl}
      className="absolute"
      style={{
        width: CARD_W,
        left: pos.current.x - CARD_W / 2,
        top: pos.current.y,
        visibility: "hidden",
        zIndex: 2,
        cursor: "grab",
        touchAction: "none",
        userSelect: "none",
        transformStyle: "preserve-3d",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        ref={cardInner}
        style={{
          transformOrigin: "center center",
          transformStyle: "preserve-3d",
          position: "relative",
          boxShadow: SHADOWS.default,
          transition: "box-shadow 0.18s ease",
        }}
      >

        {/* ── Front face ── */}
        <div style={{ backfaceVisibility: "hidden", position: "relative" }}>


          {/* Signature canvas — drawn on via cardEl pointer events when Q held */}
          <canvas
            ref={drawCanvas}
            className="absolute inset-0 rounded-[8.8px]"
            style={{ zIndex: 13, width: "100%", height: "100%", pointerEvents: "none" }}
          />

          {/* Header */}
          <div className="bg-[#fafaf9] flex items-center justify-between relative w-full"
            style={{ border: "0.55px solid rgba(16,16,16,0.08)", borderRadius: "8.8px", padding: "9.868px 13.157px", marginBottom: "-0.55px" }}>
            <span className="font-normal text-[#78716c] shrink-0" style={{ fontSize: 10, lineHeight: "16px" }}>Profile</span>
            <img alt="" src={IMG.iconCross} className="shrink-0" style={{ width: 13.157, height: 13.157 }} />
          </div>

          {/* Body */}
          <div className="bg-white flex flex-col items-center justify-center w-full"
            style={{ border: "0.55px solid rgba(16,16,16,0.08)", borderRadius: "8.8px", padding: "19.735px 0 12px" }}>
            <div className="flex flex-col w-full" style={{ gap: 16 }}>

              {/* Avatar row */}
              <div className="flex items-center w-full" style={{ gap: 12, padding: "0 16px" }}>
                <div className="relative shrink-0 rounded-full" style={{ width: 47.364, height: 47.364 }}>
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <img alt="Caleb Wu" src={IMG.avatar} className="absolute max-w-none"
                      style={{ height: "172.51%", left: "-5.33%", top: "0.24%", width: "121.6%" }} />
                  </div>
                  <div className="absolute" style={{ bottom: -2.245, right: -2.245, width: 17.542, height: 17.542 }}>
                    <img alt="" src={IMG.status} className="relative block w-full h-full" />
                  </div>
                </div>
                <div className="flex flex-col items-start justify-center flex-1 min-w-0">
                  <span className="font-medium text-black" style={{ fontSize: 14, lineHeight: "20px", fontFeatureSettings: '"liga" 0' }}>Caleb Wu</span>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <span className="font-normal text-[#635d58]" style={{ fontSize: 12, lineHeight: "18px", fontFeatureSettings: '"liga" 0' }}>Ando</span>
                    <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#a8a29e", flexShrink: 0, opacity: 0.6 }} />
                    <span className="font-normal text-[#78716c]" style={{ fontSize: 12, lineHeight: "18px", fontFeatureSettings: '"liga" 0' }}>Product Design Intern</span>
                  </div>
                </div>
              </div>

              <div className="w-full bg-[#ebe9e8]" style={{ height: 0.55 }} />

              <div className="flex flex-col w-full" style={{ gap: 24 }}>
                {/* Issued on / to */}
                <div className="flex items-start w-full" style={{ gap: 16, padding: "0 12px" }}>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="font-mono font-normal text-[#a8a29e]" style={{ fontSize: 8, lineHeight: "16px" }}>ISSUSED ON:</span>
                    <span className="font-normal text-[#635d58]" style={{ fontSize: 12, lineHeight: "18px", fontFeatureSettings: '"liga" 0' }}>June 05 2026</span>
                  </div>
                  <div className="flex flex-col items-start justify-between self-stretch shrink-0" style={{ width: 128 }}>
                    <span className="font-mono font-normal text-[#a8a29e]" style={{ fontSize: 8, lineHeight: "16px" }}>ISSUED TO:</span>
                    <div className="w-full" style={{ padding: "2px 0" }}>
                      <div className="w-full bg-[#d6d3d1]" style={{ height: 0.55 }} />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center w-full" style={{ gap: 6.578, padding: "0 13.157px" }}>
                  {[
                    { icon: IMG.iconMessage, label: "Message" },
                    { icon: IMG.iconJam,     label: "Jam" },
                  ].map(({ icon, label }) => (
                    <button key={label} className="flex flex-1 items-center justify-center bg-white"
                      style={{ gap: 3.289, padding: "4.934px 6.578px", border: "0.411px solid #d3d1ce", borderRadius: 4.934 }}>
                      <img alt="" src={icon} style={{ width: 13.157, height: 13.157 }} />
                      <span className="font-normal text-[#24211f]" style={{ fontSize: 11.512, lineHeight: "16.445px", fontFeatureSettings: '"liga" 0' }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>{/* end front */}

        {/* Back face */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Header — layout is mirrored so CSS backface flip makes it read correctly */}
          <div className="bg-[#fafaf9] flex items-center justify-between relative w-full"
            style={{ border: "0.55px solid rgba(16,16,16,0.08)", borderRadius: "8.8px", padding: "9.868px 13.157px", marginBottom: "-0.55px" }}>
            <img alt="" src={IMG.backX} className="shrink-0" style={{ width: 13.157, height: 13.157 }} />
            <span className="font-normal text-[#78716c] shrink-0"
              style={{ fontSize: 10, lineHeight: "16px", display: "inline-block", transform: "rotate(180deg) scaleY(-1)" }}>Profile</span>
          </div>

          {/* Body */}
          <div className="bg-white flex flex-col items-center justify-center w-full flex-1"
            style={{ border: "0.55px solid rgba(16,16,16,0.08)", borderRadius: "8.8px", padding: "19.735px 0", gap: 24 }}>
            {/* Ando logo 2×2 grid — 64% opacity */}
            <div style={{ opacity: 0.64, width: 115.973, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex" }}>
                {/* TL — no transform */}
                <div style={{ width: 57.987, height: 57.987, position: "relative", overflow: "hidden", flexShrink: 0 }}>
                  <img alt="" src={IMG.logoTL} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
                </div>
                {/* TR — rotate(-90deg) scaleY(-1) */}
                <div style={{ width: 57.987, height: 57.987, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  <img alt="" src={IMG.logoTR} style={{ width: 57.987, height: 57.987, display: "block", transform: "rotate(-90deg) scaleY(-1)" }} />
                </div>
              </div>
              <div style={{ display: "flex" }}>
                {/* BL — rotate(-90deg) scaleY(-1) */}
                <div style={{ width: 57.987, height: 57.987, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  <img alt="" src={IMG.logoBL} style={{ width: 57.987, height: 57.987, display: "block", transform: "rotate(-90deg) scaleY(-1)" }} />
                </div>
                {/* BR — rotate(-90deg) scaleY(-1) */}
                <div style={{ width: 57.987, height: 57.987, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  <img alt="" src={IMG.logoBR} style={{ width: 57.987, height: 57.987, display: "block", transform: "rotate(-90deg) scaleY(-1)" }} />
                </div>
              </div>
            </div>
            {/* ANDO */}
            <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontWeight: 400, fontSize: 9, lineHeight: "15px", color: "black", letterSpacing: "0.72px", textAlign: "center" }}>ANDO</span>
          </div>
        </div>

        {/* Lamination sleeve — wider than card, lanyard header sticks above */}
        {laminated && (
          <div style={{
            position: "absolute",
            top: -58, left: -24, right: -24, bottom: -24,
            transform: "translateZ(1px)",
            backfaceVisibility: "hidden",
            pointerEvents: "none",
            animation: "laminate-settle 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.85s both",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              animation: "laminate-encase 1s ease-out forwards",
              display: "flex", flexDirection: "column",
            }}>

              {/* Lanyard header */}
              <div style={{
                position: "relative",
                background: "rgba(255,255,255,0.18)",
                border: "0.5px solid rgba(120,113,108,0.10)",
                borderRadius: 8, padding: "12px 24px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                overflow: "hidden",
              }}>
                <img alt="" src={IMG.holeL} style={{ width: 9.5, height: 9.5, flexShrink: 0 }} />
                <div style={{ background: "#8ab578", borderRadius: 999, width: 56, height: 9.5, flexShrink: 0 }} />
                <img alt="" src={IMG.holeR} style={{ width: 9.5, height: 9.5, flexShrink: 0 }} />
                <div ref={lanyardFrontShineRef} style={{ position: "absolute", inset: 0, borderRadius: 8, pointerEvents: "none" }} />
              </div>

              {/* Body — two-layer translucent overlay */}
              <div style={{ position: "relative", background: "rgba(255,255,255,0.10)", borderRadius: 8, flex: 1, padding: 6, overflow: "hidden" }}>
                <div style={{
                  background: "rgba(255,255,255,0.20)",
                  backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)",
                  border: "0.5px solid rgba(120,113,108,0.10)",
                  borderRadius: 6, height: "100%",
                }} />
                <div ref={lanyardFrontBodyRef} style={{ position: "absolute", inset: 0, borderRadius: 8, pointerEvents: "none" }} />
              </div>

            </div>
          </div>
        )}

        {/* Back-face lamination — mirrors the front sleeve, visible only from the back */}
        {laminated && (
          <div style={{
            position: "absolute", inset: 0,
            transform: "rotateY(180deg)",
            transformStyle: "preserve-3d",
          }}>
            <div style={{
              position: "absolute",
              top: -58, left: -24, right: -24, bottom: -24,
              transform: "translateZ(1px)",
              backfaceVisibility: "hidden",
              pointerEvents: "none",
              animation: "laminate-settle 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.85s both",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                animation: "laminate-encase 1s ease-out forwards",
                display: "flex", flexDirection: "column",
              }}>

                {/* Lanyard header — back face */}
                <div style={{
                  position: "relative",
                  background: "rgba(255,255,255,0.18)",
                  border: "0.5px solid rgba(120,113,108,0.10)",
                  borderRadius: 8, padding: "12px 24px", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  overflow: "hidden",
                }}>
                  <img alt="" src={IMG.holeL} style={{ width: 9.5, height: 9.5, flexShrink: 0 }} />
                  <div style={{ background: "#8ab578", borderRadius: 999, width: 56, height: 9.5, flexShrink: 0 }} />
                  <img alt="" src={IMG.holeR} style={{ width: 9.5, height: 9.5, flexShrink: 0 }} />
                  <div ref={lanyardBackShineRef} style={{ position: "absolute", inset: 0, borderRadius: 8, pointerEvents: "none" }} />
                </div>

                {/* Body — back face two-layer translucent overlay */}
                <div style={{ position: "relative", background: "rgba(255,255,255,0.10)", borderRadius: 8, flex: 1, padding: 6, overflow: "hidden" }}>
                  <div style={{
                    background: "rgba(255,255,255,0.20)",
                    backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)",
                    border: "0.5px solid rgba(120,113,108,0.10)",
                    borderRadius: 6, height: "100%",
                  }} />
                  <div ref={lanyardBackBodyRef} style={{ position: "absolute", inset: 0, borderRadius: 8, pointerEvents: "none" }} />
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>

    {/* Phase UI — below card */}
    {cardBottomY !== null && phase !== "hidden" && (
      <div
        style={{
          position: "absolute",
          left: pos.current.x - CARD_W / 2,
          top: cardBottomY + 48,
          width: CARD_W,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          zIndex: 3,
          opacity: (isHolding) ? 0.4 : 1,
          transition: "opacity 0.4s ease",
        }}
      >
        {/* Cross-fading state panels — both always mounted, opacity drives the transition */}
        <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>

          {/* Signing panel */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%",
            opacity: phase === "signing" ? 1 : 0,
            pointerEvents: phase === "signing" ? "auto" : "none",
            transition: "opacity 0.4s ease-in-out",
            position: phase !== "signing" ? "absolute" : "relative",
          }}>
            <span style={{
              color: "white",
              fontFamily: "var(--font-geist-mono), monospace",
              fontWeight: 500,
              fontSize: 14,
              lineHeight: "18px",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              animation: phase === "signing" ? "text-pulse 2s ease-in-out infinite" : "none",
            }}>
              Sign your card
            </span>
          </div>

          {/* Hold / saved panel */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%",
            opacity: (phase === "ready" || phase === "laminated") ? 1 : 0,
            pointerEvents: (phase === "ready" || phase === "laminated") ? "auto" : "none",
            transition: "opacity 0.4s ease-in-out",
            position: phase === "signing" ? "absolute" : "relative",
          }}>
            <span style={{
              color: "white",
              fontFamily: "var(--font-geist-mono), monospace",
              fontWeight: 500,
              fontSize: 14,
              lineHeight: "18px",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              animation: (!isHolding && phase === "ready") ? "text-pulse 2s ease-in-out infinite" : "none",
              pointerEvents: "none",
            }}>
              {phase === "laminated" && !isHolding ? "Profile saved" : "Hold your card still"}
            </span>
            <div style={{
              width: "100%",
              height: 2,
              background: "rgba(255,255,255,0.22)",
              borderRadius: 1,
              overflow: "hidden",
              opacity: isHolding ? 1 : 0,
              transition: "opacity 0.2s ease",
              pointerEvents: "none",
            }}>
              <div style={{
                height: "100%",
                background: "white",
                borderRadius: 1,
                width: isHolding ? "100%" : "0%",
                transition: isHolding ? "width 1s ease-in-out" : "none",
              }} />
            </div>
          </div>

        </div>
      </div>
    )}
    </>
  );
}
