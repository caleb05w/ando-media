"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const CARD_W = 296;

const KS = 0.13;
const DS = 0.68;
const FRICTION = 0.92; // spin decays naturally, no snap

const SHADOW_DEFAULT = "0px 0px 0.2px rgba(16,16,16,0.08), 0px 2.5px 1.2px rgba(16,16,16,0.04), 0px 6.6px 3.3px rgba(16,16,16,0.04), 0px 23px 13px rgba(16,16,16,0.08)";
const SHADOW_HOVER   = "0px 0px 0.3px rgba(16,16,16,0.10), 0px 6px 3px rgba(16,16,16,0.06), 0px 16px 8px rgba(16,16,16,0.06), 0px 40px 24px rgba(16,16,16,0.13)";
const SHADOW_PRESS   = "0px 0px 0.2px rgba(16,16,16,0.06), 0px 1px 0.5px rgba(16,16,16,0.03), 0px 3px 1.5px rgba(16,16,16,0.03), 0px 8px 5px rgba(16,16,16,0.06)";

const imgProfilePicture = "https://www.figma.com/api/mcp/asset/97c6e723-2997-42af-8ca2-0e4c6a55b048";
const imgStatus         = "https://www.figma.com/api/mcp/asset/0234b485-1091-430e-b8e1-c0f865f89782";

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Holographic foil: diagonal rainbow stripes + micro-sparkle, driven by card tilt
const FRAG = `
  uniform float tiltX;
  uniform float tiltY;
  uniform float time;
  uniform float boost;
  varying vec2 vUv;

  vec3 hsl2rgb(float h, float s, float l) {
    vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
  }

  void main() {
    float tx = tiltX * 0.01745;
    float ty = tiltY * 0.01745;
    float angle = ty * 3.0 + tx * 2.0;

    // Diagonal foil stripes
    float d = vUv.x * 0.9 - vUv.y * 1.1;
    float stripe = fract(d * 5.5 + angle * 1.8);
    float band = smoothstep(0.0, 0.38, stripe) * smoothstep(1.0, 0.62, stripe);

    // Hue: UV position + tilt shift + slow time drift
    float hue = vUv.x * 0.45 - vUv.y * 0.15 + angle * 0.55 + time * 0.018;

    // Micro-sparkle: high-frequency noise shimmer
    float s1 = fract(sin(vUv.x * 127.1 + vUv.y * 311.7 + time * 0.4) * 43758.5);
    float sparkle = pow(s1, 10.0) * 0.6;

    // Edge vignette — fade foil away from card edges
    vec2 ef = smoothstep(0.0, 0.09, vUv) * smoothstep(1.0, 0.91, vUv);
    float vignette = ef.x * ef.y;

    vec3 color = hsl2rgb(fract(hue), 0.92, 0.58);
    float alpha = (band * 0.55 + sparkle) * vignette;

    gl_FragColor = vec4(color, alpha * (0.72 + boost * 0.6));
  }
`;

export default function HoloCard({ containerRef, laminated = false }) {
  const [ready, setReady] = useState(false);
  const laminatedRef = useRef(false);

  useEffect(() => {
    if (!laminated) return;
    laminatedRef.current = true;
  }, [laminated]);

  const pos    = useRef({ x: 0, y: 0 });
  const rot    = useRef({ r: 0, vr: 0 });
  const drag   = useRef({ on: false, startX: 0, startR: 0, prevX: 0, vx: 0 });

  const tilt       = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const tiltTarget = useRef({ x: 0, y: 0 });
  const pressing   = useRef(false);
  const scSp       = useRef({ s: 1, v: 0 });

  const cardEl    = useRef(null);
  const cardInner = useRef(null);
  const shineEl   = useRef(null);
  const glCanvas  = useRef(null);
  const glRef     = useRef(null);
  const rafId     = useRef(null);

  useEffect(() => {
    const cx = containerRef?.current
      ? containerRef.current.offsetWidth / 2
      : window.innerWidth / 2;
    pos.current = { x: cx, y: 210 };
    setReady(true);
  }, []);

  // Three.js holographic canvas setup
  useEffect(() => {
    if (!ready || !glCanvas.current || !cardEl.current) return;

    const canvas = glCanvas.current;
    const { width, height } = cardEl.current.getBoundingClientRect();
    const w = Math.round(width  || CARD_W);
    const h = Math.round(height || 220);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setSize(w, h, false); // false = don't set canvas CSS size
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      tiltX: { value: 0 },
      tiltY: { value: 0 },
      time:  { value: 0 },
      boost: { value: 0 },
    };

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    scene.add(mesh);

    glRef.current = { renderer, scene, camera, uniforms };

    return () => {
      renderer.dispose();
      glRef.current = null;
    };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    const tick = () => {
      // Y-axis spin — friction only, no snap
      if (!drag.current.on) {
        const r = rot.current;
        r.vr *= FRICTION;
        r.r  += r.vr;
      }
      if (cardEl.current) {
        cardEl.current.style.transform = `perspective(900px) rotateY(${rot.current.r}deg)`;
      }

      // 3-D hover tilt (on cardInner, separate from flip)
      const t  = tilt.current;
      const tt = drag.current.on ? { x: 0, y: 0 } : tiltTarget.current;
      t.vx = (t.vx + (tt.x - t.x) * 0.13) * 0.70;
      t.vy = (t.vy + (tt.y - t.y) * 0.13) * 0.70;
      t.x += t.vx;
      t.y += t.vy;

      const sc = scSp.current;
      const targetS = pressing.current ? 0.97 : 1.0;
      sc.v = (sc.v + (targetS - sc.s) * 0.35) * 0.60;
      sc.s += sc.v;

      if (cardInner.current) {
        cardInner.current.style.transform =
          `rotateX(${t.x}deg) rotateY(${t.y}deg) scale(${sc.s})`;
      }

      // Drive the holographic shader with live tilt + lamination boost
      if (glRef.current) {
        const { renderer, scene, camera, uniforms } = glRef.current;
        uniforms.tiltX.value = t.x;
        uniforms.tiltY.value = t.y;
        uniforms.time.value  = performance.now() / 1000;
        const boostTarget = laminatedRef.current ? 1.0 : 0.0;
        uniforms.boost.value += (boostTarget - uniforms.boost.value) * 0.04;
        renderer.render(scene, camera);
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [ready]);

  const onPointerDown = (e) => {
    e.preventDefault();
    drag.current = { on: true, startX: e.clientX, startR: rot.current.r, prevX: e.clientX, vx: 0 };
    pressing.current = true;
    rot.current.vr = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (cardEl.current) {
      cardEl.current.style.cursor = "grabbing";
      if (cardInner.current) cardInner.current.style.boxShadow = SHADOW_PRESS;
    }
  };

  const onPointerMove = (e) => {
    if (!drag.current.on) return;
    drag.current.vx = e.clientX - drag.current.prevX;
    drag.current.prevX = e.clientX;
    rot.current.r = drag.current.startR + (e.clientX - drag.current.startX) * 1.0;
  };

  const onPointerUp = () => {
    drag.current.on  = false;
    pressing.current = false;
    rot.current.vr = drag.current.vx * 1.2;
    if (cardEl.current) {
      cardEl.current.style.cursor = "grab";
      if (cardInner.current) cardInner.current.style.boxShadow = SHADOW_DEFAULT;
    }
  };

  const onMouseMove = (e) => {
    if (drag.current.on || !cardEl.current) return;
    const rect = cardEl.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top)  / rect.height;
    tiltTarget.current.x = (ny - 0.5) * -12;
    tiltTarget.current.y = (nx - 0.5) *  12;
    if (shineEl.current) {
      shineEl.current.style.background =
        `radial-gradient(circle at ${nx * 100}% ${ny * 100}%, rgba(255,255,255,0.20) 0%, transparent 60%)`;
    }
  };

  const onMouseEnter = () => {
    if (cardInner.current) cardInner.current.style.boxShadow = SHADOW_HOVER;
  };

  const onMouseLeave = () => {
    tiltTarget.current = { x: 0, y: 0 };
    if (shineEl.current) shineEl.current.style.background = "none";
    if (cardInner.current && !drag.current.on) cardInner.current.style.boxShadow = SHADOW_DEFAULT;
  };

  if (!ready) return null;

  return (
    <div
      ref={cardEl}
      className="absolute"
      style={{
        width: CARD_W,
        left: pos.current.x - CARD_W / 2,
        top: pos.current.y,
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
      <div ref={cardInner} style={{ transformOrigin: "center center", transformStyle: "preserve-3d", position: "relative", borderRadius: "8.8px", boxShadow: SHADOW_DEFAULT, transition: "box-shadow 0.18s ease" }}>

        {/* Front face */}
        <div style={{ backfaceVisibility: "hidden" }}>

        {/* WebGL holographic foil — sits above card content, additive blend */}
        <canvas
          ref={glCanvas}
          className="absolute inset-0 pointer-events-none rounded-[8.8px]"
          style={{ zIndex: 12, width: "100%", height: "100%", mixBlendMode: "screen" }}
        />

        {/* Cursor-following gloss */}
        <div
          ref={shineEl}
          className="absolute inset-0 pointer-events-none rounded-[8.8px]"
          style={{ zIndex: 11, mixBlendMode: "soft-light" }}
        />

        <div
          className="w-full overflow-hidden"
          style={{ borderRadius: "8.8px", border: "0.55px solid rgba(16,16,16,0.08)" }}
        >

        {/* Header */}
        <div
          className="flex items-center justify-between relative w-full"
          style={{
            padding: "9.867px 13.157px",
            borderBottom: "0.55px solid rgba(16,16,16,0.08)",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          }}
        >
          <span className="text-[10px] leading-4 font-normal text-[#a8a4c0]">Profile</span>
          <svg width={13} height={13} viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M4 4l8 8m0-8l-8 8" stroke="#6b6785" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div
            className="absolute bg-[#2a2a4a] rounded-full"
            style={{ height: "8.5px", width: "34px", left: "135.95px", top: "10.14px" }}
          />
        </div>

        {/* Body */}
        <div
          className="flex flex-col items-start w-full"
          style={{
            paddingTop: "19.735px",
            paddingBottom: "19.735px",
            borderRadius: "0 0 8.8px 8.8px",
            background: "linear-gradient(160deg, #fafaf9 0%, #f0eef8 60%, #e8e4f5 100%)",
          }}
        >
          <div className="flex flex-col items-start w-full" style={{ gap: "16px" }}>

            <div className="flex items-center px-4 w-full" style={{ gap: "12px" }}>
              <div
                className="relative shrink-0 rounded-full overflow-hidden"
                style={{ width: "47.364px", height: "47.364px" }}
              >
                <img
                  alt="Caleb Wu"
                  src={imgProfilePicture}
                  className="absolute"
                  style={{ height: "172.51%", left: "-5.33%", top: "0.24%", width: "121.6%", maxWidth: "none" }}
                />
                <div
                  className="absolute"
                  style={{ bottom: "1.76px", right: "1.75px", width: "8.771px", height: "8.771px" }}
                >
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                  <img alt="" src={imgStatus} className="relative block w-full h-full" />
                </div>
              </div>

              <div className="flex flex-col items-start justify-center min-w-0 flex-1">
                <span className="text-[14px] leading-5 font-medium text-[#1a1a2e]" style={{ fontFeatureSettings: '"liga" 0' }}>
                  Caleb Wu
                </span>
                <span className="text-[12px] leading-[18px] font-normal text-[#6b5f8a]" style={{ fontFeatureSettings: '"liga" 0' }}>
                  Product Design Intern
                </span>
              </div>
            </div>

            <div className="w-full" style={{ height: "0.55px", background: "rgba(107,95,138,0.2)" }} />

            <div className="flex flex-col px-4 w-full" style={{ gap: "6.578px" }}>
              <div className="flex items-center w-full" style={{ gap: "7px" }}>
                <div className="flex flex-col items-start justify-center flex-1 min-w-0" style={{ gap: "2px" }}>
                  <span className="text-[10px] leading-4 text-[#1a1a2e]">Local Time</span>
                  <span className="text-[12px] leading-[18px] text-[#5a5070]" style={{ fontFeatureSettings: '"liga" 0' }}>
                    6:07pm (local time)
                  </span>
                </div>
                <div className="flex flex-col items-start justify-center flex-1 min-w-0" style={{ gap: "2px" }}>
                  <span className="text-[10px] leading-4 text-[#1a1a2e]">Local Time</span>
                  <span className="text-[12px] leading-[18px] text-[#5a5070]" style={{ fontFeatureSettings: '"liga" 0' }}>
                    6:07pm (local time)
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-start justify-center w-full" style={{ gap: "2px" }}>
                <span className="text-[10px] leading-4 text-[#1a1a2e]">Company</span>
                <span className="text-[12px] leading-[18px] text-[#5a5070]" style={{ fontFeatureSettings: '"liga" 0' }}>
                  Ando Corporation
                </span>
              </div>
            </div>

          </div>
        </div>
        </div>
        </div>

        {/* Back face */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: "8.8px",
            border: "0.55px solid rgba(107,95,138,0.25)",
            overflow: "hidden",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          }}
        />

      </div>

      {/* Lamination encasing — slides up from below, overlays the card */}
      {laminated && (
        <div style={{
          position: "absolute",
          inset: "-5px",
          borderRadius: "13.8px",
          background: "rgba(255,255,255,0.10)",
          animation: "laminate-encase 0.85s cubic-bezier(0.22,1,0.36,1) forwards",
          pointerEvents: "none",
        }} />
      )}
    </div>
  );
}
