"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const CARD_W = 428;
const CARD_H = 512;
const HALF_H = CARD_H / 2;
const MIN_VALUE = 5;
const SCALE = 3;

const MONTH_COLS: [string[], string[]] = [
  ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"],
  ["JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"],
];

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Centered text with manual letter tracking (canvas letterSpacing is not
 *  universal, and tracking must not trail the last glyph). */
function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  baselineY: number,
  tracking: number
) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  let x = centerX - total / 2;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, baselineY);
    x += widths[i] + tracking;
  });
}

/** Everything on the card except the big number: header, month columns,
 *  folded-paper texture. Drawn once and reused for every value. */
function drawBase(fold: HTMLImageElement | null): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W * SCALE;
  canvas.height = CARD_H * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  roundedRect(ctx, 0, 0, CARD_W, CARD_H, 4);
  ctx.fillStyle = "#f5f5f4";
  ctx.fill();

  const now = new Date();

  // Header: 2026 ........ JUNE  FRI
  ctx.font = "19.2px Geist, Arial";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = "#24211f";
  const headerCy = 44.5;
  ctx.textAlign = "left";
  ctx.fillText(String(now.getFullYear()), 32, headerCy);
  ctx.textAlign = "right";
  const weekday = now.toLocaleString("en-US", { weekday: "short" }).toUpperCase();
  ctx.fillText(weekday, CARD_W - 32, headerCy);
  const month = now.toLocaleString("en-US", { month: "long" }).toUpperCase();
  ctx.fillText(month, CARD_W - 32 - ctx.measureText(weekday).width - 24, headerCy);
  ctx.globalAlpha = 1;

  // Folded-paper texture, rotated a quarter turn like the design,
  // gives the card its center crease
  if (fold) {
    ctx.save();
    roundedRect(ctx, 0, 0, CARD_W, CARD_H, 4);
    ctx.clip();
    ctx.globalAlpha = 0.2;
    ctx.translate(CARD_W / 2, CARD_H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(fold, -354, -236, 708, 472);
    ctx.restore();
  }

  // Bottom-left: two tiny columns of months, current month in ink
  const inset = 17.88;
  ctx.font = "9.811px Geist, Arial";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const monthLineH = 9.811 * 1.2;
  const monthStep = monthLineH + 2.725;
  const monthsTop = 404;
  const colW = Math.max(...MONTH_COLS[0].map((m) => ctx.measureText(m).width));
  const curMonth = now.getMonth();
  MONTH_COLS.forEach((col, c) => {
    col.forEach((label, i) => {
      const isCur = c * 6 + i === curMonth;
      ctx.globalAlpha = isCur ? 0.6 : 1;
      ctx.fillStyle = isCur ? "#24211f" : "#78716c";
      ctx.fillText(
        label,
        c === 0 ? inset : inset + colW + 16.352,
        monthsTop + i * monthStep + monthLineH / 2
      );
    });
  });
  ctx.globalAlpha = 1;

  // Bottom-right: day-number grid (1–26), rows right-aligned, bottom-aligned
  // with the months block
  ctx.font = "6px Geist, Arial";
  ctx.fillStyle = "#78716c";
  const cellW = 8.75 + 3; // cell + gap
  const cellH = 6 * 1.2 + 5; // text line + vertical padding
  const rowStep = cellH + 6;
  const gridRight = CARD_W - inset;
  const gridBottom = monthsTop + 6 * monthLineH + 5 * 2.725;
  const rows = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26],
  ];
  rows.forEach((row, r) => {
    const cy = gridBottom - (rows.length - 1 - r) * rowStep - cellH / 2;
    row.forEach((d, i) => {
      const cellX = gridRight - (row.length - i) * cellW + 3;
      ctx.fillText(String(d), cellX + 2.5, cy);
    });
  });

  return canvas;
}

/** Base card plus the big tracked number, centered on the crease. */
function drawValue(base: HTMLCanvasElement, value: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = base.width;
  canvas.height = base.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(base, 0, 0);
  ctx.scale(SCALE, SCALE);

  ctx.font = "500 235.93px Geist, Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#24211f";
  const text = String(value);
  const m = ctx.measureText(text);
  // Center the glyphs on the crease so the flip seam bisects the number
  const baselineY = HALF_H + m.actualBoundingBoxAscent - (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 2;
  drawTracked(ctx, text, CARD_W / 2, baselineY, 0);

  return canvas;
}

/** Synthesized split-flap sounds — a release flick and a landing clack. */
function createFlapAudio() {
  let ctx: AudioContext | null = null;
  let noiseBuf: AudioBuffer | null = null;

  return {
    ensure() {
      if (ctx) return;
      try {
        ctx = new AudioContext();
        const len = ctx.sampleRate;
        noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      } catch {
        ctx = null;
      }
    },
    flick() {
      if (!ctx || !noiseBuf) return;
      try {
        const t = ctx.currentTime;
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        const filt = ctx.createBiquadFilter();
        filt.type = "bandpass";
        filt.frequency.setValueAtTime(1900, t);
        filt.frequency.exponentialRampToValueAtTime(900, t + 0.07);
        filt.Q.value = 0.9;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.045, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        src.connect(filt);
        filt.connect(g);
        g.connect(ctx.destination);
        src.start(t, Math.random() * 0.5, 0.1);
      } catch {}
    },
    clack() {
      if (!ctx || !noiseBuf) return;
      try {
        const t = ctx.currentTime;
        // Paper snap
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        const filt = ctx.createBiquadFilter();
        filt.type = "lowpass";
        filt.frequency.setValueAtTime(2200, t);
        filt.frequency.exponentialRampToValueAtTime(400, t + 0.05);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        src.connect(filt);
        filt.connect(g);
        g.connect(ctx.destination);
        src.start(t, Math.random() * 0.5, 0.08);
        // Low knock underneath
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.06);
        const og = ctx.createGain();
        og.gain.setValueAtTime(0.0001, t);
        og.gain.exponentialRampToValueAtTime(0.08, t + 0.008);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        osc.connect(og);
        og.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
      } catch {}
    },
    dispose() {
      ctx?.close().catch(() => {});
      ctx = null;
    },
  };
}

/** Rescale a plane's v coordinates so it samples a slice of the card texture. */
function remapV(geo: THREE.PlaneGeometry, v0: number, v1: number) {
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setY(i, v0 + (v1 - v0) * uv.getY(i));
  uv.needsUpdate = true;
}

/**
 * Split-flap calendar card. The card is creased at its horizontal center:
 * the top half is a flap that falls forward over the crease, revealing the
 * next value's top half behind it and landing as the next value's bottom half.
 */
export default function FlipBoard({ value, onComplete }: { value: number; onComplete?: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(value);
  const initialValueRef = useRef(value);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    targetRef.current = value;
  }, [value]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let stopLoop = false;
    let raf = 0;
    const cleanups: (() => void)[] = [];

    (async () => {
      const [fold] = await Promise.all([
        new Promise<HTMLImageElement | null>((res) => {
          const img = new Image();
          img.onload = () => res(img);
          img.onerror = () => res(null);
          img.src = "/week2-paper-fold.jpg";
        }),
        Promise.all([
          document.fonts.load("500 235.93px Geist"),
          document.fonts.load("9.811px Geist"),
          document.fonts.load("19.2px Geist"),
        ]).catch(() => {}),
        document.fonts.ready,
      ]);
      if (disposed) return;

      // Spring entrance after assets are ready; JS fallback ensures
      // visibility even if CSS animation is paused in a background tab
      const wrap = wrapRef.current;
      if (wrap) {
        wrap.classList.add("card-enter");
        setTimeout(() => { if (!disposed && wrap) wrap.style.opacity = "1"; }, 800);
      }

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.inset = "0";
      renderer.domElement.style.pointerEvents = "auto";
      renderer.domElement.style.cursor = "grab";
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 1, 8000);

      let needsRender = true;
      // 1 world unit == 1 CSS pixel on the z=0 plane
      const setSize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.position.z = h / 2 / Math.tan(THREE.MathUtils.degToRad(15));
        camera.updateProjectionMatrix();
        needsRender = true;
      };
      setSize();
      window.addEventListener("resize", setSize);
      cleanups.push(() => window.removeEventListener("resize", setSize));

      // Lights: key light sits near the camera axis so the falling flap's
      // shadow stays a tight contact shadow instead of shading half the card
      scene.add(new THREE.AmbientLight(0xffffff, 2.0));
      const dir = new THREE.DirectionalLight(0xffffff, 1.2);
      dir.position.set(90, 260, 800);
      dir.castShadow = true;
      dir.shadow.mapSize.set(2048, 2048);
      dir.shadow.camera.left = -700;
      dir.shadow.camera.right = 700;
      dir.shadow.camera.top = 700;
      dir.shadow.camera.bottom = -700;
      dir.shadow.camera.near = 1;
      dir.shadow.camera.far = 3000;
      dir.shadow.bias = -0.0002;
      dir.shadow.normalBias = 1.5;
      scene.add(dir);

      // Invisible wall behind the card that catches its shadow over the sky
      const wall = new THREE.Mesh(
        new THREE.PlaneGeometry(6000, 6000),
        new THREE.ShadowMaterial({ opacity: 0.16 })
      );
      wall.position.z = -3;
      wall.receiveShadow = true;
      scene.add(wall);

      // Value textures, generated on demand; only two live at a time
      const base = drawBase(fold);
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      const texCache = new Map<number, THREE.CanvasTexture>();
      const getTex = (v: number) => {
        let tex = texCache.get(v);
        if (!tex) {
          tex = new THREE.CanvasTexture(drawValue(base, v));
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = maxAniso;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          texCache.set(v, tex);
        }
        return tex;
      };

      let displayed = initialValueRef.current;
      const nextOf = (v: number) => Math.max(v - 1, MIN_VALUE);

      const audio = createFlapAudio();
      const enableAudio = () => audio.ensure();
      window.addEventListener("pointerdown", enableAudio);
      window.addEventListener("keydown", enableAudio);
      cleanups.push(() => {
        window.removeEventListener("pointerdown", enableAudio);
        window.removeEventListener("keydown", enableAudio);
        audio.dispose();
      });

      // Static halves: top shows the NEXT value (hidden behind the flap at
      // rest), bottom shows the current value.
      const topMat = new THREE.MeshStandardMaterial({
        map: getTex(displayed), // matches flapFront; swaps to next at θ=π/2
        roughness: 0.92,
        transparent: true,
      });
      const botMat = new THREE.MeshStandardMaterial({
        map: getTex(displayed),
        roughness: 0.92,
        transparent: true,
      });
      const topGeo = new THREE.PlaneGeometry(CARD_W, HALF_H);
      remapV(topGeo, 0.5, 1);
      const botGeo = new THREE.PlaneGeometry(CARD_W, HALF_H);
      remapV(botGeo, 0, 0.5);
      const topStatic = new THREE.Mesh(topGeo, topMat);
      topStatic.position.y = HALF_H / 2;
      const bottomStatic = new THREE.Mesh(botGeo, botMat);
      bottomStatic.position.y = -HALF_H / 2;
      for (const m of [topStatic, bottomStatic]) {
        m.castShadow = true;
        m.receiveShadow = true;
        scene.add(m);
      }

      // The flap: front face is the current top half; back face is the next
      // value's bottom half (visible once it swings past vertical). Both
      // meshes share one position buffer so the paper bow stays in sync.
      const SEG = 24;
      const flapFrontGeo = new THREE.PlaneGeometry(CARD_W, HALF_H, 1, SEG);
      remapV(flapFrontGeo, 0.5, 1);
      const flapBackGeo = new THREE.PlaneGeometry(CARD_W, HALF_H, 1, SEG);
      remapV(flapBackGeo, 0.5, 0);
      flapBackGeo.setAttribute("position", flapFrontGeo.getAttribute("position"));
      flapBackGeo.setAttribute("normal", flapFrontGeo.getAttribute("normal"));
      const flapFrontMat = new THREE.MeshStandardMaterial({
        map: getTex(displayed),
        roughness: 0.92,
        transparent: true,
        side: THREE.FrontSide,
      });
      const flapBackMat = new THREE.MeshStandardMaterial({
        map: getTex(nextOf(displayed)),
        roughness: 0.95,
        transparent: true,
        side: THREE.BackSide,
      });
      const flapFront = new THREE.Mesh(flapFrontGeo, flapFrontMat);
      const flapBack = new THREE.Mesh(flapBackGeo, flapBackMat);
      flapFront.position.y = HALF_H / 2;
      flapBack.position.y = HALF_H / 2;
      flapFront.castShadow = true;
      flapFront.frustumCulled = false;
      flapBack.frustumCulled = false;
      const flapGroup = new THREE.Group();
      flapGroup.position.z = 1.2;
      flapGroup.add(flapFront, flapBack);
      scene.add(flapGroup);

      // Slight paper bow while falling: the free edge lags the hinge
      const bowPos = flapFrontGeo.attributes.position as THREE.BufferAttribute;
      const baseY: number[] = [];
      for (let i = 0; i < bowPos.count; i++) baseY.push(bowPos.getY(i));
      const setBow = (lag: number) => {
        for (let i = 0; i < bowPos.count; i++) {
          const f = (baseY[i] + HALF_H / 2) / HALF_H; // 0 at crease, 1 at free edge
          bowPos.setZ(i, lag * Math.pow(f, 1.3) * HALF_H);
        }
        bowPos.needsUpdate = true;
        flapFrontGeo.computeVertexNormals();
      };

      // ---- Flip timeline: gravity fall, clack, damped bounce ----
      const FALL = 0.32;
      const BOUNCE = 0.36;
      let flight: {
        to: number;
        start: number;
        clacked: boolean;
        fall: number;
        bounce: number;
      } | null = null;
      let prevTheta = 0;
      let lastFrame = performance.now();
      let firstFlipDone = false;

      // ---- Click to start the first flip ----
      let hoverTarget = 0; // subtle peek angle when hovering over top half

      const isOverTopHalf = (e: PointerEvent) => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        return Math.abs(e.clientX - cx) <= CARD_W / 2 &&
               e.clientY <= cy && e.clientY >= cy - HALF_H;
      };

      const onClick = () => {
        if (firstFlipDone || flight) return;
        hoverTarget = 0;
        flapGroup.rotation.x = 0;
        firstFlipDone = true;
        renderer.domElement.style.pointerEvents = "none";
        renderer.domElement.style.cursor = "";
        needsRender = true;
      };

      const onPointerMove = (e: PointerEvent) => {
        if (firstFlipDone) return;
        if (!flight) {
          hoverTarget = isOverTopHalf(e) ? 0.13 : 0;
        }
      };

      const onPointerLeave = () => {
        if (!firstFlipDone) hoverTarget = 0;
      };

      renderer.domElement.addEventListener("click", onClick);
      renderer.domElement.addEventListener("pointermove", onPointerMove);
      renderer.domElement.addEventListener("pointerleave", onPointerLeave);
      cleanups.push(() => {
        renderer.domElement.removeEventListener("click", onClick);
        renderer.domElement.removeEventListener("pointermove", onPointerMove);
        renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      });

      const animate = () => {
        if (disposed || stopLoop) return;
        raf = requestAnimationFrame(animate);
        const now = performance.now();
        const dt = Math.min((now - lastFrame) / 1000, 1 / 30);
        lastFrame = now;

        // Hover peek: gently lift/lower flap toward hoverTarget when idle
        if (!firstFlipDone && !flight) {
          const cur = flapGroup.rotation.x;
          const next = cur + (hoverTarget - cur) * 0.07;
          if (Math.abs(next - cur) > 0.0005) {
            flapGroup.rotation.x = next;
            needsRender = true;
          }
        }

        if (!flight && firstFlipDone && displayed > targetRef.current) {
          const cascade = displayed - targetRef.current > 1;
          flight = {
            to: displayed - 1,
            start: now,
            clacked: false,
            fall: cascade ? 0.08 : FALL,
            bounce: cascade ? 0.06 : BOUNCE,
          };
          prevTheta = 0;
          audio.flick();
        }

        let active = false;
        if (flight) {
          active = true;
          const t = (now - flight.start) / 1000;
          if (t >= flight.fall + flight.bounce) {
            // Landed: this value's halves become the rest state; preload next
            displayed = flight.to;
            if (!firstFlipDone) {
              firstFlipDone = true;
              renderer.domElement.style.pointerEvents = "none";
              renderer.domElement.style.cursor = "";
            }
            if (displayed === MIN_VALUE) {
              onCompleteRef.current?.();
              const wrap = wrapRef.current;
              if (wrap) {
                stopLoop = true;
                // Render one final frame so preserveDrawingBuffer has the resting state
                renderer.render(scene, camera);
                // Snapshot the canvas as a flat bitmap — animating an <img> is fully
                // compositor-friendly; no GPU readback on every transition frame
                const snap = document.createElement("img");
                snap.src = renderer.domElement.toDataURL();
                snap.style.cssText = `position:absolute;inset:0;width:100%;height:100%;pointer-events:none`;
                wrap.appendChild(snap);
                // Hide the live canvas so only the snapshot is visible
                renderer.domElement.style.opacity = "0";

                wrap.classList.remove("card-enter", "card-pulse");
                wrap.style.opacity = "1";
                wrap.style.transform = "";
                // Promote wrap to compositor layer before transition
                wrap.style.willChange = "transform, opacity, filter";

                requestAnimationFrame(() => requestAnimationFrame(() => {
                  const ease = "cubic-bezier(0.4,0,0.6,1)";
                  wrap.style.transition = `opacity 1.1s ${ease}, transform 1.1s ${ease}, filter 1.1s ${ease}`;
                  wrap.style.opacity = "0";
                  wrap.style.filter = "blur(10px)";
                }));
              }
            }
            flight = null;
            const nv = nextOf(displayed);
            flapFrontMat.map = getTex(displayed);
            botMat.map = getTex(displayed);
            topMat.map = getTex(nv);
            flapBackMat.map = getTex(nv);
            for (const m of [flapFrontMat, botMat, topMat, flapBackMat]) m.needsUpdate = true;
            for (const [k, tex] of texCache) {
              if (k !== displayed && k !== nv) {
                tex.dispose();
                texCache.delete(k);
              }
            }
            flapGroup.rotation.x = 0;
            setBow(0);
            // Pulse the wrapper on each landing
            const wrap = wrapRef.current;
            if (wrap) {
              wrap.classList.remove("card-pulse");
              void wrap.offsetWidth;
              wrap.classList.add("card-pulse");
            }
          } else {
            let theta: number;
            if (t < flight.fall) {
              const f = t / flight.fall;
              theta = Math.PI * (1 - Math.cos(Math.PI * f)) / 2;
            } else {
              if (!flight.clacked) {
                flight.clacked = true;
                audio.clack();
              }
              const s = t - flight.fall;
              theta = Math.PI - 0.14 * Math.exp(-9.0 * s) * Math.abs(Math.sin(20 * s));
            }
            flapGroup.rotation.x = theta;
            const omega = (theta - prevTheta) / Math.max(dt, 1e-4);
            prevTheta = theta;
            setBow(THREE.MathUtils.clamp(-omega * 0.006, -0.09, 0.09));
          }
        }

        // Swap topStatic texture at the flip midpoint so it never shows the
        // next value while the flap is still covering it (the flicker cause).
        {
          const wantNext = flapGroup.rotation.x > Math.PI / 2;
          const wantTex = wantNext ? getTex(nextOf(displayed)) : getTex(displayed);
          if (topMat.map !== wantTex) {
            topMat.map = wantTex;
            topMat.needsUpdate = true;
          }
        }

        if (active || needsRender) {
          renderer.render(scene, camera);
          // After the flap lands, render one final rest frame then go idle
          needsRender = active;
        }
      };
      animate();

      cleanups.push(() => {
        cancelAnimationFrame(raf);
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m) => m.dispose());
          }
        });
        texCache.forEach((tex) => tex.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      });
    })();

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0" style={{ opacity: 0 }}>
      {/* CSS shadow layer — floats behind the 3D card */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded"
        style={{
          width: CARD_W,
          height: CARD_H,
          boxShadow: [
            "0 2px 4px rgba(0,0,0,0.04)",
            "0 8px 20px rgba(0,0,0,0.07)",
            "0 20px 48px rgba(0,0,0,0.09)",
            "0 48px 96px rgba(0,0,0,0.07)",
            "0 96px 160px rgba(0,0,0,0.04)",
          ].join(", "),
        }}
      />
      <div ref={mountRef} className="absolute inset-0" />
    </div>
  );
}
