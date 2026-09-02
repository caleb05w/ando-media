'use client'

import { useEffect, useRef } from 'react'

import { cn } from '#lib/cn'
import { WATERMARK_PATHS, WATERMARK_VIEWBOX } from './watermark-paths'

// "Cursor as light source" version of the footer wordmark. The pointer acts as
// a small light held over the surface: glyphs near it "lift" and cast a soft
// drop shadow AWAY from the cursor, with the offset and penumbra blur growing
// as the cursor nears, then easing back flat when it leaves. There is no
// simulation state - the shadow is a pure function of an eased light position
// and a hover presence, so it has zero curl and zero momentum by construction
// (it tracks the cursor and stops dead; nothing swirls or coasts).
//
// The wordmark itself is the ORIGINAL static <svg> watermark rasterized with
// its own feTurbulence + feDisplacementMap filter (the grainy soft-focus),
// baked into a mask texture at full resolution. The display pass draws that
// mask pixel-exact, plus a poisson-disc-blurred copy sampled at an offset that
// points away from the light - the cast shadow. At rest (presence 0) the
// output is exactly mask * inkGain, identical to the static svg.
//
// Progressive enhancement: renders nothing on the server, under prefers-
// reduced-motion, or without WebGL2. The static <svg> watermark behind it
// stays visible in those cases. (No float render targets needed - unlike the
// fluid/particle variants this runs on any WebGL2 device.)

const BASE_VERT = `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

// Single display pass: resting wordmark + cursor-lit cast shadow. All
// distances are in height-normalized units (1 = canvas height) so the falloff
// is isotropic on the wide, short canvas; x converts back via uAspect when
// sampling.
const SHADOW_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uText;
uniform vec3 uSurface;
uniform vec3 uInk;
uniform float uInkGain;
uniform vec2 uLight;      // eased pointer position, GL uv (y up)
uniform float uAspect;    // canvas width / height
uniform float uPresence;  // hover presence 0..1 (0 = at rest, pixel-exact)
uniform float uFalloff;   // light reach (gaussian falloff radius)
uniform float uLift;      // max shadow offset at full lift
uniform float uBlur;      // max penumbra radius at full lift
uniform float uShadowGain;

// Poisson disc for the penumbra blur (unit-disc offsets).
const vec2 TAPS[12] = vec2[](
  vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457),
  vec2(-0.203, 0.621), vec2(0.962, -0.195), vec2(0.473, -0.480),
  vec2(0.519, 0.767), vec2(0.185, -0.893), vec2(0.507, 0.064),
  vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598)
);

// The mask is uploaded top-down; vUv is GL (y up), so flip when sampling.
float ink(vec2 uv) {
  return texture(uText, vec2(uv.x, 1.0 - uv.y)).r;
}

void main() {
  float rest = ink(vUv);

  // How "lit" this pixel is: gaussian falloff around the cursor.
  vec2 d = vUv - uLight;
  d.x *= uAspect;
  float dist = length(d);
  float lit = exp(-(dist * dist) / (uFalloff * uFalloff)) * uPresence;
  vec2 dir = dist > 1e-4 ? d / dist : vec2(0.0);

  // Glyphs cast their shadow away from the light: the shadow at this pixel
  // comes from ink offset back toward the cursor, blurred for the penumbra.
  vec2 off = dir * uLift * lit;
  float radius = uBlur * lit;
  float sh = 0.0;
  for (int i = 0; i < 12; i++) {
    vec2 tap = off + TAPS[i] * radius;
    sh += ink(vUv - vec2(tap.x / uAspect, tap.y));
  }
  sh /= 12.0;

  // Shadow adds coverage in the same ink color; at presence 0 this is exactly
  // rest * uInkGain, so the resting wordmark stays pixel-exact.
  float shadow = sh * uShadowGain * lit;
  float coverage = clamp((rest + shadow) * uInkGain, 0.0, 1.0);
  outColor = vec4(mix(uSurface, uInk, coverage), 1.0);
}`

// --- fixed knobs ---
const MAX_DPR = 2
const FILTER_OCTAVES = 3 // feTurbulence octaves (matches the original svg)

// Live-tunable parameters, exposed as props so a control panel can adjust the
// feel at runtime. Defaults match the static svg watermark.
export interface FooterWatermarkShadowHoverParams {
  /** Resting wordmark opacity (0.04 matches the original svg's fillOpacity). */
  inkGain?: number
  /** Cast-shadow darkness, as a multiple of the resting ink. */
  shadowGain?: number
  /** Max shadow offset away from the cursor, in CSS px (the "lift" height). */
  liftPx?: number
  /** Penumbra blur radius at full lift, in CSS px. */
  blurPx?: number
  /** Reach of the cursor "light": gaussian falloff radius, in CSS px. */
  falloffPx?: number
  /** Per-frame pull of the shadow toward the cursor (1 = instant tracking). */
  followEase?: number
  /** Per-frame fade of the whole effect in/out on pointer enter/leave. */
  fadeEase?: number
  /** How long to keep painting after the last interaction, in ms. */
  settleMs?: number
  /** feDisplacementMap scale - the grain/feather amount. Re-bakes the mask. */
  grainDisplace?: number
  /** feTurbulence baseFrequency - the grain frequency. Re-bakes the mask. */
  grainFrequency?: number
  /** feTurbulence seed - the grain pattern. Re-bakes the mask. */
  grainSeed?: number
}

type ResolvedParams = Required<FooterWatermarkShadowHoverParams>

const DEFAULTS: ResolvedParams = {
  inkGain: 0.045,
  shadowGain: 2.5,
  liftPx: 2,
  blurPx: 11,
  falloffPx: 230,
  followEase: 0.05,
  fadeEase: 0.02,
  settleMs: 1550,
  grainDisplace: 70,
  grainFrequency: 1.2,
  grainSeed: 5831,
}

function resolveParams(
  params?: FooterWatermarkShadowHoverParams,
): ResolvedParams {
  return { ...DEFAULTS, ...params }
}

export interface FooterWatermarkShadowHoverProps {
  className?: string
  /** Live tuning overrides; merged over the defaults. */
  params?: FooterWatermarkShadowHoverParams
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function link(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc)
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc)
  if (!vs || !fs) return null
  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }
  return program
}

// Resolve a CSS color (incl. var()/oklch) to a 0..1 sRGB triplet by painting it
// to a 1px 2D canvas - works regardless of how the browser serializes oklch. The
// probe mounts on a rendered ancestor (a <canvas>'s own children are non-rendered
// fallback content, so they don't resolve theme variables).
function resolveColor(
  host: HTMLElement,
  value: string,
): [number, number, number] {
  const probe = document.createElement('span')
  probe.style.color = value
  probe.style.display = 'none'
  host.appendChild(probe)
  const serialized = getComputedStyle(probe).color
  host.removeChild(probe)

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return [0.98, 0.98, 0.97]
  ctx.fillStyle = serialized
  ctx.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}

// The original static watermark as standalone SVG markup: WHITE glyphs (with the
// same top-down fade) under the same feTurbulence + feDisplacementMap filter, so
// rasterizing it reproduces the exact grainy soft wordmark. White-on-nothing so
// the red channel reads as coverage once drawn over black.
function buildMaskSvg(
  width: number,
  height: number,
  grain: { displace: number; frequency: number; seed: number },
) {
  const { width: vbW, height: vbH } = WATERMARK_VIEWBOX
  const paths = WATERMARK_PATHS.map(
    ({ d }) => `<path d="${d}" fill="url(#f)"/>`,
  ).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${vbW} ${vbH}">
<defs>
<filter id="t" x="0" y="0" width="${vbW}" height="263.832" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="${grain.frequency} ${grain.frequency}" numOctaves="${FILTER_OCTAVES}" seed="${grain.seed}" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="${grain.displace}" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<linearGradient id="f" x1="768" y1="32" x2="768" y2="235.594" gradientUnits="userSpaceOnUse">
<stop stop-color="#fff"/>
<stop offset="1" stop-color="#fff" stop-opacity="0"/>
</linearGradient>
</defs>
<g filter="url(#t)">${paths}</g>
</svg>`
}

export function FooterWatermarkShadowHover({
  className,
  params,
}: FooterWatermarkShadowHoverProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // The render loop reads the latest params from this ref every frame, so dialing
  // a control adjusts the live animation without tearing down the WebGL context.
  const resolved = resolveParams(params)
  const paramsRef = useRef(resolved)
  paramsRef.current = resolved
  const controlRef = useRef<{ kick(): void; rebake(): void } | null>(null)
  // One key over every live param; the first three fields are the grain (which
  // forces a mask re-bake). The sync effect below is keyed on this.
  const syncKey = [
    resolved.grainDisplace,
    resolved.grainFrequency,
    resolved.grainSeed,
    resolved.inkGain,
    resolved.shadowGain,
    resolved.liftPx,
    resolved.blurPx,
    resolved.falloffPx,
    resolved.followEase,
    resolved.fadeEase,
    resolved.settleMs,
  ].join('|')
  const lastGrainRef = useRef<string | null>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    if (
      typeof window === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    // alpha:true so any early-out (or before the mask loads) leaves the canvas
    // transparent and the static <svg> behind it shows through. The display pass
    // always writes a = 1.
    const context = canvasEl.getContext('webgl2', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    })
    if (!context) return

    const program = link(context, BASE_VERT, SHADOW_FRAG)
    if (!program) return

    // Non-null aliases: TypeScript drops the `!= null` flow-narrowing at the
    // nested-closure boundary, so bind the proven-non-null values to fresh consts
    // whose TYPE (not just flow) is non-null. activateProgram also keeps Biome
    // from reading `gl.useProgram` as a React hook (useHookAtTopLevel matches
    // `use*`).
    const gl = context
    const canvas = canvasEl
    const activateProgram = gl.useProgram.bind(gl)

    const colorHost = canvas.parentElement ?? document.documentElement
    const surface = resolveColor(colorHost, 'var(--color-surface-secondary)')
    const ink = resolveColor(colorHost, 'var(--color-text-strong)')

    // Full-screen triangle, pinned to attribute location 0.
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    // Uniform locations, queried once (a null location is a silent no-op).
    const loc = {
      text: gl.getUniformLocation(program, 'uText'),
      surface: gl.getUniformLocation(program, 'uSurface'),
      ink: gl.getUniformLocation(program, 'uInk'),
      inkGain: gl.getUniformLocation(program, 'uInkGain'),
      light: gl.getUniformLocation(program, 'uLight'),
      aspect: gl.getUniformLocation(program, 'uAspect'),
      presence: gl.getUniformLocation(program, 'uPresence'),
      falloff: gl.getUniformLocation(program, 'uFalloff'),
      lift: gl.getUniformLocation(program, 'uLift'),
      blur: gl.getUniformLocation(program, 'uBlur'),
      shadowGain: gl.getUniformLocation(program, 'uShadowGain'),
    }

    const maskTexture = gl.createTexture()
    let maskReady = false
    let maskToken = 0 // guards against a stale async mask landing after a resize
    let dpr = 1

    // The light eases toward the pointer; presence fades the whole effect in
    // and out. Both live here (not in the shader) so the effect is a pure
    // function of these two values each frame.
    const pointer = { x: 0.5, y: 0.5, has: false }
    const light = { x: 0.5, y: 0.5 }
    let presence = 0
    let lastMoveT = -1e9
    let raf = 0
    let running = false
    let disposed = false

    // Rasterize the original svg (with its feTurbulence/feDisplacementMap filter)
    // to a full-resolution texture. Async because it loads through an <img>.
    function loadMask() {
      maskReady = false
      maskToken += 1
      const token = maskToken
      const w = canvas.width
      const h = canvas.height
      const img = new Image()
      img.onload = () => {
        if (disposed || token !== maskToken) return
        const off = document.createElement('canvas')
        off.width = w
        off.height = h
        const ctx = off.getContext('2d')
        if (!ctx) return
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)

        gl.bindTexture(gl.TEXTURE_2D, maskTexture)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        maskReady = true
        display()
      }
      const p = paramsRef.current
      const svg = buildMaskSvg(w, h, {
        displace: p.grainDisplace,
        frequency: p.grainFrequency,
        seed: p.grainSeed,
      })
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    }

    function display() {
      if (!maskReady) return
      const p = paramsRef.current
      // CSS px -> height-normalized shader units.
      const unit = dpr / canvas.height
      activateProgram(program)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, maskTexture)
      gl.uniform1i(loc.text, 0)
      gl.uniform3f(loc.surface, surface[0], surface[1], surface[2])
      gl.uniform3f(loc.ink, ink[0], ink[1], ink[2])
      gl.uniform1f(loc.inkGain, p.inkGain)
      gl.uniform2f(loc.light, light.x, light.y)
      gl.uniform1f(loc.aspect, canvas.width / canvas.height)
      gl.uniform1f(loc.presence, presence)
      gl.uniform1f(loc.falloff, Math.max(p.falloffPx, 1) * unit)
      gl.uniform1f(loc.lift, p.liftPx * unit)
      gl.uniform1f(loc.blur, p.blurPx * unit)
      gl.uniform1f(loc.shadowGain, p.shadowGain)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    function rebuild() {
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width === w && canvas.height === h && maskReady) return
      canvas.width = w
      canvas.height = h
      loadMask() // async; paints once the svg rasterizes
    }

    rebuild()
    const observer = new ResizeObserver(() => {
      rebuild()
      wake()
    })
    observer.observe(canvas)

    // Ease the light toward the pointer and the presence toward its target,
    // then paint. Returns true once both have converged (nothing left to
    // animate).
    function step() {
      const p = paramsRef.current
      const target = pointer.has ? 1 : 0
      presence += (target - presence) * p.fadeEase
      if (Math.abs(target - presence) < 0.001) presence = target
      light.x += (pointer.x - light.x) * p.followEase
      light.y += (pointer.y - light.y) * p.followEase
      display()
      const lightSettled =
        Math.abs(pointer.x - light.x) < 0.0005 &&
        Math.abs(pointer.y - light.y) < 0.0005
      return presence === target && (presence === 0 || lightSettled)
    }

    function frame() {
      if (disposed) return
      const settled = step()
      const idle =
        window.performance.now() - lastMoveT > paramsRef.current.settleMs
      if (idle && settled) {
        running = false
        return
      }
      raf = requestAnimationFrame(frame)
    }

    function wake() {
      lastMoveT = window.performance.now()
      if (!running && !disposed) {
        running = true
        raf = requestAnimationFrame(frame)
      }
    }

    function toUv(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect()
      return {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      }
    }

    function onMove(event: PointerEvent) {
      const { x, y } = toUv(event)
      if (x < -0.15 || x > 1.15 || y < -0.4 || y > 1.4) {
        // Out of reach: let the shadow ease back flat.
        if (pointer.has) {
          pointer.has = false
          wake()
        }
        return
      }
      const px = x
      const py = 1 - y // GL uv (y up), like the shader
      if (!pointer.has && presence < 0.01) {
        // Fresh entry: snap the light to the pointer so the shadow doesn't
        // sweep in from a stale position.
        light.x = px
        light.y = py
      }
      pointer.x = px
      pointer.y = py
      pointer.has = true
      wake()
    }

    function onLeave() {
      if (pointer.has) {
        pointer.has = false
        wake()
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    // Expose hooks for the param-sync effect: kick() repaints (so a changed knob
    // shows even while parked at rest); rebake() re-rasterizes the grain mask.
    controlRef.current = { kick: wake, rebake: loadMask }

    return () => {
      disposed = true
      controlRef.current = null
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      gl.deleteTexture(maskTexture)
      gl.deleteBuffer(buffer)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
    }
  }, [])

  // Push live param changes into the running engine: re-bake the mask when a
  // grain knob changes (it has to re-rasterize the svg), otherwise just repaint
  // so opacity/feel changes show immediately even while parked at rest. The
  // render loop already reads the other values from paramsRef every frame.
  useEffect(() => {
    const ctrl = controlRef.current
    if (!ctrl) return
    const grain = syncKey.split('|').slice(0, 3).join('|')
    const prevGrain = lastGrainRef.current
    lastGrainRef.current = grain
    if (prevGrain === null) return
    if (grain !== prevGrain) {
      ctrl.rebake()
    } else {
      ctrl.kick()
    }
  }, [syncKey])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      tabIndex={-1}
      className={cn('absolute inset-0 block h-full w-full', className)}
    />
  )
}

FooterWatermarkShadowHover.displayName = 'Footer.WatermarkShadowHover'
