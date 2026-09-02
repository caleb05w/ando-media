'use client'

import { type ComponentPropsWithRef, useEffect, useRef, useState } from 'react'

import { cn } from '#lib/cn'
import {
  IDLE_PATH,
  IDLE_VIEWBOX,
  WORD_PATH,
  WORD_VIEWBOX,
} from './dot-field-paths'

// Animated "dot field" footer graphic. The ANDO wordmark is dissolved into a
// grid of tiny resting dots (sampled from the rasterized glyph silhouette); a
// slow horizontal wave breathes their opacity, an invisible comma-shaped "idle
// mask" drifts across the field lighting cells with an accent color, and the
// pointer paints a soft trail that shrinks back out over a few seconds. This is
// a faithful 2D-canvas port of the standalone ando-dot-field engine; the math
// and tuning constants are kept verbatim. The interactive sidebar / color
// picker from the original are dropped - the palette below is baked fixed.
//
// Progressive enhancement: the markup renders on the server, all browser APIs
// live inside the effect. Under prefers-reduced-motion a single static frame of
// resting dots is painted (no rAF loop). The loop also pauses when the tab is
// hidden or the canvas is scrolled out of view.

const TAU = Math.PI * 2
// Mask downsample factor: the drifting idle mask is rasterized at 1/MDS the
// canvas resolution (it only needs coarse coverage, not crisp edges).
const MDS = 5
// Idle-path viewBox dims (used by the drift transform's scale/centering math).
const IVB_W = IDLE_VIEWBOX.IVB_W
const IVB_H = IDLE_VIEWBOX.IVB_H

// --- baked palette (replaces the original's live color-picker config) ---
// These are the engine DEFAULTS, not the HTML input values: the source did
// `cfg = { ...DEFAULTS }` so the picker inputs never fed the live field. The
// word is fixed to 'upper' (WORD_PATH is used directly in buildField).
const CELL = 4 // grid spacing in px between candidate dots
const DOT_R = 0.84 // accent (trail / idle-mask) dot radius
const BASE_R = 0.72 // resting dot radius
const BASE_A = 0.2 // resting dot base alpha (wave multiplies 0.5x / 1x / 2x)
const WEAK_A = 0.4 // accent soft-dot alpha
const STRONG_A = 0.6 // accent strong-dot alpha
// Resting-dot opacity bands (the wave picks one per dot): 0.5x / 1x / 2x BASE_A.
// Constant, so it's computed once here instead of rebuilt every frame.
const RESTING_LEVELS = [
  Math.min(1, Math.max(0, BASE_A * 0.5)),
  Math.min(1, Math.max(0, BASE_A)),
  Math.min(1, Math.max(0, BASE_A * 2)),
]
// Trail + idle-mask accent. A deliberate one-off accent: this design system has
// NO blue token, so the hex is hard-coded here rather than resolved from a CSS
// variable (unlike the resting color, which uses --color-text-strong).
const ACCENT_HEX = '#51A6F5'

// --- engine tuning constants (verbatim from the source) ---
const FOLLOW_EASE = 1
const TRAIL_SHRINK_MS = 4400
const TRAIL_MIN_SHRINK_SPEED = 0.78
const TRAIL_MAX_SHRINK_SPEED = 1.32
const TRAIL_DITHER_AMOUNT = 0.24
const TRAIL_DEFAULT_HEIGHT_RATIO = 1 / 3
const TRAIL_DYNAMIC_HEIGHT_RATIO = 0.08
const RESTING_WAVE_SPEED = 0.00009
const RESTING_WAVE_DENSITY = 1.15
const RESTING_WAVE_WOBBLE = 0.085
const RESTING_WAVE_WOBBLE_SPEED = 0.00015
const RESTING_WAVE_DITHER = 0.22
const IDLE_MASK_DITHER_WIDTH = 10

// Resolve a CSS color (incl. var()/oklch) to an [r,g,b] 0..255 triplet by
// painting it to a 1px 2D canvas, regardless of how the browser serializes the
// value. The probe mounts on a rendered ancestor (a <canvas>'s own children are
// non-rendered fallback content, so they don't resolve theme variables).
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

  const probeCanvas = document.createElement('canvas')
  probeCanvas.width = 1
  probeCanvas.height = 1
  const probeCtx = probeCanvas.getContext('2d')
  if (!probeCtx) return [0, 0, 0]
  probeCtx.fillStyle = serialized
  probeCtx.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = probeCtx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

export interface FooterDotFieldProps extends ComponentPropsWithRef<'div'> {}

export function FooterDotField({ className, ...props }: FooterDotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Read once on the client (lazy init), then keep it reactive via the listener
  // below so toggling the OS setting while mounted flips the animation on/off
  // without a remount. The rendered markup doesn't depend on this, so SSR
  // (false) hydrates cleanly.
  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event: MediaQueryListEvent) => {
      setReduceMotion(event.matches)
    }
    // Re-sync in case it changed between the lazy initializer and this effect.
    setReduceMotion(query.matches)
    query.addEventListener('change', onChange)
    return () => {
      query.removeEventListener('change', onChange)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    if (!canvas || !host) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Path2D is browser-only: build the word + idle paths here, not at module
    // scope (SSR would crash).
    const wordPath = new Path2D(WORD_PATH)
    const idlePath = new Path2D(IDLE_PATH)

    // Resting ANDO dots use the design token --color-text-strong (opaque black);
    // the accent (trail + idle mask) uses the baked one-off blue above.
    const [restR, restG, restB] = resolveColor(host, 'var(--color-text-strong)')
    const [accR, accG, accB] = resolveColor(host, ACCENT_HEX)
    const accentWeak = `rgba(${accR},${accG},${accB},${WEAK_A})`
    const accentStrong = `rgba(${accR},${accG},${accB},${STRONG_A})`
    const accentHalo = `rgba(${accR},${accG},${accB},${Math.min(0.18, STRONG_A * 0.18)})`

    let dpr = Math.min(2, window.devicePixelRatio || 1)
    let W = 0
    let H = 0
    let cx = new Float32Array(0)
    let cy = new Float32Array(0)
    let strong = new Uint8Array(0)
    let strongCluster = new Float32Array(0)
    let trailEdge = new Float32Array(0)
    let trailActive = new Uint8Array(0)
    let trailStartedAt = new Float64Array(0)
    // Position-only values precomputed once per buildField (they never change
    // frame to frame), so the render loop reads an array instead of running
    // several Math.sin calls per dot per frame: trail edge noise, per-dot trail
    // shrink speed, the resting-wave static dither, and the idle-mask edge noise.
    let dotTrailNoise = new Float32Array(0)
    let dotShrinkSpeed = new Float32Array(0)
    let dotRestDither = new Float32Array(0)
    let dotIdleEdgeNoise = new Float32Array(0)
    let N = 0
    let bandCY = 0
    let bandH = 0
    let px = 0
    let py = 0
    let hasPointer = false
    let followerX = 0
    let followerY = 0
    let trailSpeed = 0
    let maskCanvas: HTMLCanvasElement | null = null
    let maskCtx: CanvasRenderingContext2D | null = null
    let maskW = 0
    let maskH = 0
    let resizeFrame = 0
    let rafId = 0
    let running = false

    function clamp(value: number, min: number, max: number) {
      return Math.min(max, Math.max(min, value))
    }

    function snap(value: number) {
      return Math.round(value * dpr) / dpr
    }

    function snapSize(value: number) {
      return Math.max(1 / dpr, Math.round(value * dpr) / dpr)
    }

    function hash01(x: number, y: number, seed = 0) {
      const raw = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123
      return raw - Math.floor(raw)
    }

    function strongClusterValue(
      x: number,
      y: number,
      width: number,
      height: number,
    ) {
      const nx = x / Math.max(1, width)
      const ny = y / Math.max(1, height)
      const band = Math.sin((nx * 4.2 + ny * 2.7) * TAU + 0.9) * 0.22
      const bloom = Math.sin((nx * -5.4 + ny * 6.3) * TAU + 2.4) * 0.18
      const drift = Math.cos((nx * 8.8 - ny * 5.1) * TAU + 1.7) * 0.16
      const pocket = Math.sin((nx * 13.0 + ny * 11.5) * TAU + 4.6) * 0.11
      const grain = (hash01(x, y, 9) - 0.5) * 0.28
      const spark = (hash01(x, y, 19) - 0.5) * 0.14
      return clamp(0.5 + band + bloom + drift + pocket + grain + spark, 0, 1)
    }

    function buildField() {
      const off = document.createElement('canvas')
      off.width = Math.max(1, Math.floor(W))
      off.height = Math.max(1, Math.floor(H))
      const o = off.getContext('2d')
      if (!o) return

      const scale = Math.min(W / WORD_VIEWBOX.vbW, H / WORD_VIEWBOX.vbH)
      const dw = WORD_VIEWBOX.vbW * scale
      const dh = WORD_VIEWBOX.vbH * scale
      const ox = (W - dw) / 2
      const oy = (H - dh) / 2
      const visTop = Math.max(0, oy)
      const visBot = Math.min(H, oy + dh)
      bandCY = (visTop + visBot) / 2
      bandH = visBot - visTop

      o.save()
      o.translate(ox, oy)
      o.scale(scale, scale)
      o.fillStyle = '#000'
      o.fill(wordPath)
      o.restore()

      const img = o.getImageData(0, 0, off.width, off.height).data
      const cols = Math.ceil(W / CELL)
      const rows = Math.ceil(H / CELL)
      const xs: number[] = []
      const ys: number[] = []
      const st: number[] = []
      const cl: number[] = []
      const tn: number[] = []
      const ss: number[] = []
      const rd: number[] = []
      const ien: number[] = []

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const sx = Math.floor(col * CELL + CELL / 2)
          const sy = Math.floor(row * CELL + CELL / 2)
          if (sx >= off.width || sy >= off.height) continue
          const a = (img[(sy * off.width + sx) * 4 + 3] ?? 0) / 255
          if (a > 0.5) {
            xs.push(sx)
            ys.push(sy)
            const cluster = strongClusterValue(sx, sy, off.width, off.height)
            cl.push(cluster)
            st.push(cluster > 0.56 ? 1 : 0)
            // Precompute the position-only trig so the frame loop doesn't.
            tn.push(getTrailNoise(sx, sy))
            ss.push(getTrailShrinkSpeed(sx, sy))
            rd.push(restDitherValue(sx, sy))
            ien.push(getTrailNoise(sx + 17, sy - 29))
          }
        }
      }

      N = xs.length
      cx = new Float32Array(xs)
      cy = new Float32Array(ys)
      strong = new Uint8Array(st)
      strongCluster = new Float32Array(cl)
      dotTrailNoise = new Float32Array(tn)
      dotShrinkSpeed = new Float32Array(ss)
      dotRestDither = new Float32Array(rd)
      dotIdleEdgeNoise = new Float32Array(ien)
      trailEdge = new Float32Array(N)
      trailEdge.fill(1)
      trailActive = new Uint8Array(N)
      trailStartedAt = new Float64Array(N)
    }

    function resize() {
      if (!ctx || !canvas || !host) return
      const rect = host.getBoundingClientRect()
      W = rect.width
      H = rect.height
      // Cap dpr at 2 - the source's *2/cap-4 supersample is too heavy here.
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.style.width = `${Math.round(W)}px`
      canvas.style.height = `${Math.round(H)}px`
      canvas.width = Math.ceil(W * dpr)
      canvas.height = Math.ceil(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = false
      maskW = Math.max(1, Math.ceil(W / MDS))
      maskH = Math.max(1, Math.ceil(H / MDS))
      maskCanvas = document.createElement('canvas')
      maskCanvas.width = maskW
      maskCanvas.height = maskH
      maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })
      if (maskCtx) maskCtx.imageSmoothingEnabled = false
      buildField()
    }

    function scheduleResize() {
      if (resizeFrame) cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0
        resize()
      })
    }

    function getIdleTransform(now: number) {
      const t = now * 0.001
      return {
        driftX:
          W * 0.5 +
          Math.sin(t * 0.17) * W * 0.3 +
          Math.sin(t * 0.083 + 1.3) * W * 0.1,
        driftY:
          bandCY +
          Math.sin(t * 0.13 + 0.5) * bandH * 0.42 +
          Math.cos(t * 0.06) * bandH * 0.16,
        rot: t * 0.09 + Math.sin(t * 0.05) * 0.5,
        scl: (bandH / IVB_H) * 1.45 * (1 + 0.45 * Math.sin(t * 0.07 + 0.7)),
      }
    }

    type IdleTransform = ReturnType<typeof getIdleTransform>

    function applyIdlePathTransform(
      targetCtx: CanvasRenderingContext2D,
      transform: IdleTransform,
    ) {
      targetCtx.translate(transform.driftX, transform.driftY)
      targetCtx.rotate(transform.rot)
      targetCtx.scale(transform.scl, transform.scl)
      targetCtx.translate(-IVB_W / 2, -IVB_H / 2)
    }

    function getIdleMask(now: number) {
      if (!maskCtx) return null
      const transform = getIdleTransform(now)
      maskCtx.setTransform(1, 0, 0, 1, 0, 0)
      maskCtx.clearRect(0, 0, maskW, maskH)
      maskCtx.save()
      maskCtx.scale(1 / MDS, 1 / MDS)
      applyIdlePathTransform(maskCtx, transform)
      maskCtx.strokeStyle = 'rgba(0,0,0,.34)'
      maskCtx.lineWidth =
        IDLE_MASK_DITHER_WIDTH / Math.max(transform.scl, 0.0001)
      maskCtx.lineJoin = 'round'
      maskCtx.lineCap = 'round'
      maskCtx.stroke(idlePath)
      maskCtx.fillStyle = '#000'
      maskCtx.fill(idlePath)
      maskCtx.restore()
      return {
        data: maskCtx.getImageData(0, 0, maskW, maskH).data,
        transform,
      }
    }

    function isIdleMaskDotActive(
      x: number,
      y: number,
      idleMask: Uint8ClampedArray | null,
      edgeNoise: number,
    ) {
      if (!idleMask) return false
      const sx = (x / MDS) | 0
      const sy = (y / MDS) | 0
      if (sx < 0 || sy < 0 || sx >= maskW || sy >= maskH) return false
      const alpha = idleMask[(sy * maskW + sx) * 4 + 3] ?? 0
      if (alpha >= 220) return true
      if (alpha <= 8) return false
      return edgeNoise < alpha / 255
    }

    function pointSegmentDistSq(
      x: number,
      y: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ) {
      const dx = x2 - x1
      const dy = y2 - y1
      if (dx === 0 && dy === 0) {
        const ax = x - x1
        const ay = y - y1
        return ax * ax + ay * ay
      }
      const t = clamp(
        ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy),
        0,
        1,
      )
      const px0 = x1 + dx * t
      const py0 = y1 + dy * t
      const ax = x - px0
      const ay = y - py0
      return ax * ax + ay * ay
    }

    function smoothstep(value: number) {
      return value * value * (3 - 2 * value)
    }

    function getTrailShrinkSpeed(x: number, y: number) {
      const broadWave = Math.sin(x * 0.011 + y * 0.006)
      const fineWave = Math.sin(x * 0.027 - y * 0.019 + 1.7)
      const variation = clamp(0.5 + broadWave * 0.32 + fineWave * 0.18, 0, 1)
      return (
        TRAIL_MIN_SHRINK_SPEED +
        (TRAIL_MAX_SHRINK_SPEED - TRAIL_MIN_SHRINK_SPEED) * variation
      )
    }

    function getTrailNoise(x: number, y: number) {
      const gridX = Math.round(x / CELL)
      const gridY = Math.round(y / CELL)
      const coarse = Math.sin(gridX * 71.31 + gridY * 29.17) * 19341.731
      const fine = Math.sin(gridX * 17.73 - gridY * 83.91 + 2.4) * 41758.129
      return (
        (coarse - Math.floor(coarse)) * 0.68 + (fine - Math.floor(fine)) * 0.32
      )
    }

    function queuePointerSegment(nx: number, ny: number) {
      if (!hasPointer) {
        hasPointer = true
        followerX = nx
        followerY = ny
        trailSpeed = 0
      }
      px = nx
      py = ny
    }

    function getAdaptiveTrailRadius(now: number) {
      const letterHeight = Math.max(1, bandH)
      const defaultRadius = letterHeight * TRAIL_DEFAULT_HEIGHT_RATIO * 0.5
      const dynamicRange = letterHeight * TRAIL_DYNAMIC_HEIGHT_RATIO
      const speedNorm = clamp(trailSpeed / 22, 0, 1)
      const slowRadius = 20
      const fastRadius = clamp(
        defaultRadius + dynamicRange * 0.7,
        slowRadius + 4,
        letterHeight * 0.3,
      )
      const baseRadius =
        slowRadius + (fastRadius - slowRadius) * smoothstep(speedNorm)
      const pulseBias =
        Math.sin(now * 0.0032 + trailSpeed * 0.045) *
        dynamicRange *
        (0.28 + speedNorm * 0.22)
      return clamp(baseRadius + pulseBias, slowRadius, letterHeight * 0.3)
    }

    // The resting wave's static (position-only) dither term, precomputed per dot
    // in buildField and passed back into getRestingWaveBand.
    function restDitherValue(x: number, y: number) {
      const gridX = Math.round(x / CELL)
      const gridY = Math.round(y / CELL)
      const staticNoise = Math.sin(gridX * 91.73 + gridY * 37.19) * 43758.5453
      return (staticNoise - Math.floor(staticNoise) - 0.5) * RESTING_WAVE_DITHER
    }

    function getRestingWaveBand(
      x: number,
      y: number,
      now: number,
      staticDither: number,
    ) {
      const normalizedX = x / Math.max(W, 1)
      const normalizedY = y / Math.max(H, 1)
      const wobble =
        Math.sin(normalizedX * TAU * 1.15 + now * RESTING_WAVE_WOBBLE_SPEED) *
          RESTING_WAVE_WOBBLE +
        Math.sin(
          normalizedX * TAU * 2.8 - now * RESTING_WAVE_WOBBLE_SPEED * 1.35,
        ) *
          (RESTING_WAVE_WOBBLE * 0.48) +
        Math.sin(
          normalizedX * TAU * 6.4 + now * RESTING_WAVE_WOBBLE_SPEED * 0.62,
        ) *
          (RESTING_WAVE_WOBBLE * 0.16)
      const phase =
        (normalizedY + wobble) * RESTING_WAVE_DENSITY - now * RESTING_WAVE_SPEED
      const gridX = Math.round(x / CELL)
      const gridY = Math.round(y / CELL)
      const grainPulse =
        Math.sin(gridX * 0.41 + gridY * 0.27 + now * 0.00022) * 0.035
      const wave = Math.sin(phase * TAU) + staticDither + grainPulse
      if (wave > 0.76) return 2
      if (wave > -0.76) return 1
      return 0
    }

    // Paint the three resting-dot opacity bands. `now` drives the breathing
    // wave; pass a fixed value (e.g. 0) for a static frame.
    function paintRestingDots(now: number) {
      if (!ctx) return
      const restingPaths = [new Path2D(), new Path2D(), new Path2D()]
      for (let i = 0; i < N; i += 1) {
        const xi = cx[i] ?? 0
        const yi = cy[i] ?? 0
        const path =
          restingPaths[getRestingWaveBand(xi, yi, now, dotRestDither[i] ?? 0)]
        if (!path) continue
        path.moveTo(xi + BASE_R, yi)
        path.arc(xi, yi, BASE_R, 0, TAU)
      }
      for (let index = 0; index < restingPaths.length; index += 1) {
        const path = restingPaths[index]
        const level = RESTING_LEVELS[index]
        if (!path || level === undefined) continue
        ctx.fillStyle = `rgba(${restR},${restG},${restB},${level})`
        ctx.fill(path)
      }
    }

    function frame(now: number) {
      if (!ctx) return
      ctx.clearRect(0, 0, W, H)

      const idleMaskState = getIdleMask(now)
      const idleMask = idleMaskState ? idleMaskState.data : null
      const prevFollowerX = followerX
      const prevFollowerY = followerY
      if (hasPointer) {
        followerX += (px - followerX) * FOLLOW_EASE
        followerY += (py - followerY) * FOLLOW_EASE
      }
      const segDX = followerX - prevFollowerX
      const segDY = followerY - prevFollowerY
      const moveDist = Math.hypot(segDX, segDY)
      trailSpeed = trailSpeed * 0.92 + moveDist * 0.08
      const segmentActive = moveDist > 0.001
      const segmentRadius = getAdaptiveTrailRadius(now)
      const segmentReach = segmentRadius * (1 + TRAIL_DITHER_AMOUNT)
      const segmentR2 = segmentReach * segmentReach
      // Bounding box of the trail segment expanded by its reach. A dot outside it
      // cannot be within segmentReach of the segment, so we skip the per-dot
      // distance math for it (same result, just cheaper).
      const segMinX = Math.min(prevFollowerX, followerX) - segmentReach
      const segMaxX = Math.max(prevFollowerX, followerX) + segmentReach
      const segMinY = Math.min(prevFollowerY, followerY) - segmentReach
      const segMaxY = Math.max(prevFollowerY, followerY) + segmentReach
      const dotRadius = snapSize(Math.max(DOT_R, BASE_R))
      const creationCore = 0.64
      const creationFringe = 1 + TRAIL_DITHER_AMOUNT

      const restingPaths = [new Path2D(), new Path2D(), new Path2D()]
      // Accent dots are batched into three layers (each a single fill below)
      // rather than a beginPath/arc/fill per lit dot.
      const weakPath = new Path2D()
      const strongHaloPath = new Path2D()
      const strongCorePath = new Path2D()

      // Single pass: update each dot's trail state, decide its state once
      // (idleActive computed a single time), and append it to the right path.
      for (let i = 0; i < N; i += 1) {
        const xi = cx[i] ?? 0
        const yi = cy[i] ?? 0
        const trailNoise = dotTrailNoise[i] ?? 0
        const idleActive = isIdleMaskDotActive(
          xi,
          yi,
          idleMask,
          dotIdleEdgeNoise[i] ?? 0,
        )

        const segmentDistanceSq =
          segmentActive &&
          xi >= segMinX &&
          xi <= segMaxX &&
          yi >= segMinY &&
          yi <= segMaxY
            ? pointSegmentDistSq(
                xi,
                yi,
                prevFollowerX,
                prevFollowerY,
                followerX,
                followerY,
              )
            : Number.POSITIVE_INFINITY
        const edge = Math.sqrt(segmentDistanceSq) / Math.max(1, segmentRadius)
        const fringeCoverage =
          smoothstep(
            clamp(
              (creationFringe - edge) / (creationFringe - creationCore),
              0,
              1,
            ),
          ) ** 1.35
        const entersTrail = edge <= creationCore || trailNoise <= fringeCoverage
        if (segmentDistanceSq <= segmentR2 && entersTrail) {
          if (trailActive[i]) {
            trailEdge[i] = Math.min(trailEdge[i] ?? 1, edge)
          } else {
            trailEdge[i] = edge
            trailStartedAt[i] = now
          }
          trailActive[i] = 1
        }

        const trailAge = now - (trailStartedAt[i] ?? 0)
        const shrinkProgress = Math.max(0, trailAge / TRAIL_SHRINK_MS)
        const localEnvelope = Math.max(
          0,
          1 - shrinkProgress * (dotShrinkSpeed[i] ?? TRAIL_MIN_SHRINK_SPEED),
        )
        const trailDither = (trailNoise - 0.5) * 2 * TRAIL_DITHER_AMOUNT
        const ditheredEnvelope = localEnvelope * (1 + trailDither)
        if (trailActive[i] && (trailEdge[i] ?? 1) > ditheredEnvelope) {
          trailActive[i] = 0
        }
        const isTrailVisible = (trailActive[i] ?? 0) === 1

        if (isTrailVisible || idleActive) {
          if (strong[i] === 1) {
            // livingCellOffset, inlined to avoid allocating an {x,y} object per
            // lit strong dot per frame.
            const clusterStrength = strongCluster[i] || 0.5
            const swirlT = now * 0.00022
            const flow = 0.55 + clusterStrength * 1.35
            const swirlA = Math.sin(xi * 0.025 + yi * 0.014 + swirlT * 1.3)
            const swirlB = Math.cos(xi * 0.012 - yi * 0.02 - swirlT * 0.9)
            const swirlC = Math.sin((xi + yi) * 0.009 + swirlT * 0.7)
            const x = snap(xi + (swirlA + swirlC * 0.7) * flow)
            const y = snap(yi + (swirlB - swirlC * 0.5) * flow)
            const halo = dotRadius * 1.14
            const core = dotRadius * 1.06
            strongHaloPath.moveTo(x + halo, y)
            strongHaloPath.arc(x, y, halo, 0, TAU)
            strongCorePath.moveTo(x + core, y)
            strongCorePath.arc(x, y, core, 0, TAU)
          } else {
            const x = snap(xi)
            const y = snap(yi)
            weakPath.moveTo(x + dotRadius, y)
            weakPath.arc(x, y, dotRadius, 0, TAU)
          }
        } else {
          const path =
            restingPaths[getRestingWaveBand(xi, yi, now, dotRestDither[i] ?? 0)]
          if (path) {
            path.moveTo(xi + BASE_R, yi)
            path.arc(xi, yi, BASE_R, 0, TAU)
          }
        }
      }

      // Resting dots underneath, then the accent layers on top (halo, core,
      // weak) - each a single fill.
      for (let index = 0; index < restingPaths.length; index += 1) {
        const path = restingPaths[index]
        const level = RESTING_LEVELS[index]
        if (!path || level === undefined) continue
        ctx.fillStyle = `rgba(${restR},${restG},${restB},${level})`
        ctx.fill(path)
      }
      ctx.fillStyle = accentHalo
      ctx.fill(strongHaloPath)
      ctx.fillStyle = accentStrong
      ctx.fill(strongCorePath)
      ctx.fillStyle = accentWeak
      ctx.fill(weakPath)

      rafId = requestAnimationFrame(frame)
    }

    // Pointer mapping. The canvas is pointer-events-none (so it never blocks
    // footer links), so we listen on window instead and project clientX/Y into
    // canvas-local coordinates. Moves well outside the canvas count as a leave.
    function onPointerMove(event: PointerEvent) {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const nx = event.clientX - rect.left
      const ny = event.clientY - rect.top
      // Allow a small slop band so the trail doesn't snap off right at the edge.
      const slop = 40
      if (
        nx >= -slop &&
        ny >= -slop &&
        nx <= rect.width + slop &&
        ny <= rect.height + slop
      ) {
        queuePointerSegment(nx, ny)
      } else {
        hasPointer = false
      }
    }

    function onPointerLeave() {
      hasPointer = false
    }

    function startLoop() {
      if (running || reduceMotion) return
      running = true
      rafId = requestAnimationFrame(frame)
    }

    function stopLoop() {
      running = false
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
    }

    // Only run while on-screen and the tab is visible.
    let isIntersecting = true
    function updateRunState() {
      if (reduceMotion) return
      if (isIntersecting && !document.hidden) startLoop()
      else stopLoop()
    }

    function onVisibilityChange() {
      updateRunState()
    }

    resize()

    if (reduceMotion) {
      // Static graphic: resting word dots only (wave sampled at t=0), no rAF
      // loop, no idle drift, no trail. Repaint on resize so it still appears if
      // the host is laid out (or resized) after mount - otherwise a host that is
      // 0-sized at mount (e.g. inside a not-yet-visible container) would stay
      // blank forever, since this branch skips the animated path's observers.
      const repaintStatic = () => {
        if (!ctx) return
        ctx.clearRect(0, 0, W, H)
        paintRestingDots(0)
      }
      repaintStatic()
      const staticObserver = new ResizeObserver(() => {
        resize()
        repaintStatic()
      })
      staticObserver.observe(host)
      return () => {
        staticObserver.disconnect()
        if (resizeFrame) cancelAnimationFrame(resizeFrame)
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      scheduleResize()
    })
    resizeObserver.observe(host)

    const intersectionObserver = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry) isIntersecting = entry.isIntersecting
      updateRunState()
    })
    intersectionObserver.observe(host)

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibilityChange)

    updateRunState()

    return () => {
      stopLoop()
      if (resizeFrame) cancelAnimationFrame(resizeFrame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [reduceMotion])

  return (
    // aspect-[1344/343] is the Figma footer-graphic frame ratio (node 1809:4629);
    // the wordmark letterboxes inside it via the engine's min(W/vbW, H/vbH) fit.
    // select-none here (not just on Footer.Banner) keeps it inert when used bare.
    <div
      aria-hidden
      className={cn('relative w-full select-none aspect-[1344/343]', className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full"
      />
    </div>
  )
}

FooterDotField.displayName = 'Footer.DotField'
