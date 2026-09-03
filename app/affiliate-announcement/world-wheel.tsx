'use client'

// Iteration 5 — the wheel. The Brand dot wheel (Figma 3446-2571,
// ported from ando-media's /landing-page-animations) opens the
// acceptance as ONE continuous gesture: the crest of small faces
// drifts up to speed, freewheels, and the camera pushes in — spin,
// slow-down, and zoom overlapping as a single arc. No full
// revolutions: the member starts back in the pack and the sweep
// carries them to the apex (the angle curve is the momentum
// integral, snapped to the nearest whole sector so the landing is
// exact). The zoom ends with the crest face at the intro avatar's
// exact size, so the handoff is invisible — the zoom IS the grow —
// and the camera doesn't stop there: the ring passes THROUGH,
// growing on from the crest and fading as everyone else slides
// past the member, who stays. Then the text beats rise, and on the
// world turn nothing fades: the words PART — headline up past the
// rim, handle down below it — while the member shrinks into the
// pinned seat and the world blooms between them.
//
// Every beat runs off WheelTiming, and WheelStudio (the stepper
// mounts it) is the primitive timing studio: one slider per beat,
// replay on release.

import { useEffect, useMemo, useRef, useState } from 'react'

import { Heading, Text, TextSize } from '@repo/design-system-ui/text'

import { nth } from './nth'
import { profileFor } from './profiles'
import { POOL, solveCrowd } from './world-crowd'
import './world-crowd.css'
import './world-wheel.css'

const N = 31 // the crowd that shows up behind them
const PIN = 120 // the profile's seat — pinned at the crowd's exact centre

/* ── The wheel, in storyboard numbers (non-timing) ──────────────── */
const DOTS = 28
const SECTOR = 360 / DOTS
const RING_UNITS = 288.23 // the storyboard SVG's coordinate space
const DOT_UNITS = 11.52 // dot diameter in that space
const DOT_CY = 5.875 // crest dot centre, from the ring's top edge
const MAX = 7.7 // zoom range — small dots ≈ face/7.7, ~13px
const SPIN_UP_TO = 0.3 // leg fraction spent easing up to speed
const START_SPEED = 0.04 // rev/s the pass opens on
const PEAK_SPEED = 0.24 // rev/s at the top of the drift — unhurried
const FLOOR_SPEED = 0.02 // rev/s the freewheel decays toward
const FRICTION = 3 // gentle brake — the spin sustains through the zoom
const ZOOM_FROM = 0.05 // the push starts with the spin — one motion
const DEPART_FROM = 0.55 // fraction of the sweep where the ring starts letting go
const SPREAD_K = 0.35 // how much the angular gaps widen as the ring spins
                      // — space between profiles, not ring scale; measured
                      // from the MEMBER so the handoff stays exact
const BAND_ANCHOR = 220 // px from the band's top to the avatar centre —
                        // keep in sync with .ww-band's top in the css
/* The fold — arrival and departure are ONE event with ONE tail:
   rotation, the band's fade, and the shared zoom all rest at
   sweep + exit. The member's dot sits at the crest AT THE SWAP,
   mid-rotation, and the face rides the zoom to rest from there.
   The stream never stops: the spin drains only to TAIL_FLOW, so
   the departing faces keep travelling right while they spread, and
   the member is plucked out with the stream's own velocity — a
   rightward carry that settles back to centre. */
const TAIL_FLOW = 0.35 // the cruise the spin keeps through the fade
const EASE_POW = 2.2 // the house ease exponent — the carry math reuses it

/* ── The timeline — every beat, in seconds ──────────────────────── */
export type WheelTiming = {
  sweep: number // the wheel pass, spin-up through landing
  hold: number // stillness on the landed frame before the exit
  exit: number // the pass-through — ring grows on and fades
  headline: number // headline rise, after landing
  handle: number // handle rise, after landing
  world: number // the world turn, after landing
  bloomWait: number // first ring, after the world turn
  bloomSpread: number // inner ring → outer ring stagger
}

export const DEFAULT_TIMING: WheelTiming = {
  sweep: 3,
  hold: 0,
  exit: 0.37,
  headline: 0.5,
  handle: 1.3,
  world: 2,
  // iteration 4's bloom cadence — a beat of quiet, then a dense
  // radial build (~1.35s total) while the face is still in motion
  bloomWait: 0.3,
  bloomSpread: 0.55,
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function speedAt(h: number) {
  if (h < SPIN_UP_TO) {
    const u = h / SPIN_UP_TO
    return START_SPEED + (PEAK_SPEED - START_SPEED) * u * u
  }
  const u = (h - SPIN_UP_TO) / (1 - SPIN_UP_TO)
  return FLOOR_SPEED + (PEAK_SPEED - FLOOR_SPEED) * Math.exp(-FRICTION * u)
}

function vAt(h: number) {
  return (1 + (MAX - 1) * smoothstep(ZOOM_FROM, 1, h)) / MAX
}

/* The angle curve — the momentum integral over the WHOLE ring life
   (sweep + exit): the spin eases off just before the landing and
   dies with the band's fade, not before. The snap anchors the
   MID-TABLE landing value to a whole sector, so the member's dot
   is at the crest exactly when the swap fires; the tail beyond it
   is the departing ring still gently turning. */
function buildAngleTable(sweep: number, exit: number) {
  const E = sweep + exit
  const S = 256
  const table = new Float64Array(S + 1)
  const stopFrom = Math.max(0, (sweep - 0.1) / E)
  let acc = 0
  for (let i = 1; i <= S; i++) {
    const h = (i - 0.5) / S
    // the spin eases down to a CRUISE, never to zero — the stream
    // keeps flowing right through the fade
    const stopper = 1 - (1 - TAIL_FLOW) * smoothstep(stopFrom, 1, h)
    acc += speedAt(h) * stopper * (E / S) * 360
    table[i] = acc
  }
  const xL = (sweep / E) * S
  const iL = Math.floor(xL)
  const landRaw =
    table[iL] + (table[Math.min(S, iL + 1)] - table[iL]) * (xL - iL)
  // The spin's pace at the swap (deg/s), and from it the carry's
  // braking arc: the member aims SHY of the crest by exactly the
  // distance the inherited velocity needs to decelerate to rest —
  // so the face arrives AT centre with zero speed, no overshoot.
  const i1 = Math.max(1, iL - 1)
  const i2 = Math.min(S, iL + 1)
  const wRaw = (table[i2] - table[i1]) / ((i2 - i1) / S) / E
  const shyRaw = (wRaw * exit) / EASE_POW
  const sectors = Math.max(3, Math.round((landRaw + shyRaw) / SECTOR))
  const f = (sectors * SECTOR) / (landRaw + shyRaw)
  for (let i = 0; i <= S; i++) table[i] *= f
  return { table, sectors }
}

function angleAt(table: Float64Array, h: number) {
  const S = table.length - 1
  const x = Math.min(1, Math.max(0, h)) * S
  const i = Math.floor(x)
  if (i >= S) return table[S]
  return table[i] + (table[i + 1] - table[i]) * (x - i)
}

const foldDeg = (deg: number) => {
  const d = ((deg % 360) + 360) % 360
  return d > 180 ? d - 360 : d
}

/* ── One-click export — fully self-serve ─────────────────────────
   The pass is pure in vt, so it re-renders deterministically to an
   offscreen canvas (same math as the driver, same fonts probed off
   the live page) and records straight off it via captureStream —
   no permission prompt, no screen share, fixed 1080×1350 output.
   The joined card's mime ladder: mp4 where the browser writes it,
   webm otherwise. */
async function exportWheelVideo({
  person,
  people,
  timing: T,
}: {
  person: string
  people?: string[]
  timing: WheelTiming
}) {
  const pool = (people ?? ['sara', ...POOL]).filter((p) => p !== person)
  const src = (p: string) => (p.includes('/') ? p : `/avatars/${p}.png`)
  const { discs, R } = solveCrowd(N, PIN)
  const centreIdx = discs.findIndex((d) => Math.hypot(d.x, d.y) < 1)
  const PAD = 10
  const box = (R + PAD) * 2
  const personAt = (i: number) => {
    if (i === centreIdx) return person
    const at = i < centreIdx ? i : i - 1
    return nth(pool, (at * 3) % pool.length)
  }
  const { table, sectors } = buildAngleTable(T.sweep, T.exit)
  const memberDot = (DOTS - (sectors % DOTS)) % DOTS
  const wheelFace = (i: number) =>
    i === memberDot ? person : nth(pool, (i * 3) % pool.length)

  // Preload every face; remote avatars need CORS to stay recordable.
  const names = new Set<string>([person])
  for (let i = 0; i < DOTS; i++) names.add(wheelFace(i))
  discs.forEach((_, i) => names.add(personAt(i)))
  const images = new Map<string, HTMLImageElement>()
  await Promise.all(
    [...names].map(async (p) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = src(p)
      try {
        await img.decode()
      } catch {
        // a missing face just won't draw
      }
      images.set(p, img)
    }),
  )

  // The canvas speaks the page's own fonts.
  const famOf = (sel: string, fallback: string) => {
    const el = document.querySelector(sel)
    return el ? getComputedStyle(el).fontFamily : fallback
  }
  const serif = famOf('.wb-glide h3', 'serif')
  const sans = famOf('.wb-below span', 'sans-serif')

  // Scene layout in desktop units — a 16:9 banner (LinkedIn/
  // Twitter), scaled to 1920×1080. The wide frame lets the ring
  // breathe instead of leaving portrait dead space.
  const W = 1280
  const H = 720
  const SCALE = 1.5
  const CX = W / 2
  const AY = 350 // the member's seat
  const FACE = 104
  const CROWD_W = 260
  const rim = CROWD_W / 2 + 20
  const headlineLines = ['I’m a part of the Ando', 'affiliate program']
  const headBottom = AY - FACE / 2 - 48
  const handleY = AY + FACE / 2 + 48 + 10
  const headShift = AY - rim - headBottom
  const belowShift = AY + rim - (handleY - 11)

  // Ring geometry — identical formulas to the driver.
  const D = FACE * (RING_UNITS / DOT_UNITS)
  const baseR = D / 2
  const dotDrift = (DOT_CY / RING_UNITS) * D
  const E = T.sweep + T.exit
  const hL = T.sweep / E
  const wLand =
    (angleAt(table, hL + 0.004) - angleAt(table, hL - 0.004)) / 0.008 / E
  const carryV0 = ((wLand * Math.PI) / 180) * (baseR - dotDrift) * vAt(hL)
  const carryDelta = (carryV0 * T.exit) / EASE_POW
  const aSwap = angleAt(table, hL)
  const memberAngle = (memberDot / DOTS) * 360
  const dotRemote = Array.from({ length: DOTS }, (_, i) => {
    const ang = ((((i / DOTS) * 360 + aSwap) % 360) + 360) % 360
    return Math.min(ang, 360 - ang) / 180
  })
  const departAt = T.sweep * DEPART_FROM
  const tau = (T.sweep - departAt) / (E - departAt)
  const seat = discs[centreIdx]
  const targetScale = ((CROWD_W * (seat ? seat.size / box : 0.21)) / FACE)
  const ease = (p: number) => 1 - (1 - p) ** EASE_POW
  const clamp01 = (p: number) => Math.min(1, Math.max(0, p))

  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = H * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(SCALE, SCALE)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const circleImg = (
    p: string,
    x: number,
    y: number,
    d: number,
    alpha: number,
  ) => {
    const img = images.get(p)
    if (alpha <= 0.01 || d <= 0 || !img?.naturalWidth) return
    ctx.save()
    ctx.globalAlpha = Math.min(1, alpha)
    ctx.beginPath()
    ctx.arc(x, y, d / 2, 0, Math.PI * 2)
    ctx.clip()
    const s = Math.max(d / img.naturalWidth, d / img.naturalHeight)
    ctx.drawImage(
      img,
      x - (img.naturalWidth * s) / 2,
      y - (img.naturalHeight * s) / 2,
      img.naturalWidth * s,
      img.naturalHeight * s,
    )
    ctx.restore()
  }

  const drawFrame = (vt: number) => {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, W, H)
    const a = angleAt(table, vt / E)
    const vz = vAt(Math.min(1, vt / E))
    // the ring — spread, monotonic departure, edge dissolve
    if (vt < E + 0.1) {
      const dp = clamp01((vt - departAt) / (E - departAt))
      const s = 1 + SPREAD_K * ease(dp)
      const thM = foldDeg(a + memberAngle)
      const r = (baseR - dotDrift) * vz
      // crest-pinned: the circle's centre rides down with the zoom
      // so the top dot lands on AY at vz = 1 (same as the driver)
      const centreY = AY - dotDrift + baseR * vz
      for (let i = 0; i < DOTS; i++) {
        const dotAngle = (i / DOTS) * 360
        const thNew = thM + foldDeg(foldDeg(a + dotAngle) - thM) * s
        const pe = ease(clamp01((dp - tau * (1 - dotRemote[i])) / (1 - tau)))
        let alpha = 1 - pe
        if (i === memberDot && vt >= T.sweep) alpha = 0
        if (alpha <= 0.01) continue
        const th = (thNew * Math.PI) / 180
        const x = CX + Math.sin(th) * r
        const y = centreY - Math.cos(th) * r
        alpha *=
          clamp01(Math.min(x, W - x) / 120) * clamp01(Math.min(y, H - y) / 120)
        circleImg(wheelFace(i), x, y, FACE * vz, alpha)
      }
    }
    // the words — rises, then the parting
    const turnAt = T.sweep + T.world + T.bloomWait
    const partP = ease(clamp01((vt - turnAt) / 0.65))
    const headRise = ease(clamp01((vt - T.sweep - T.headline) / 0.5))
    const handleRise = ease(clamp01((vt - T.sweep - T.handle) / 0.5))
    ctx.textAlign = 'center'
    if (headRise > 0.01) {
      ctx.save()
      ctx.globalAlpha = headRise
      ctx.fillStyle = '#282828'
      ctx.font = `400 24px ${serif}`
      const dy = 8 * (1 - headRise) + headShift * partP
      ctx.fillText(headlineLines[0], CX, headBottom - 38 + dy)
      ctx.fillText(headlineLines[1], CX, headBottom - 8 + dy)
      ctx.restore()
    }
    if (handleRise > 0.01) {
      ctx.save()
      ctx.globalAlpha = handleRise
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.font = `400 14px ${sans}`
      const dy = 8 * (1 - handleRise) + belowShift * partP
      ctx.fillText(
        `ando.so/@${profileFor(person).handle}`,
        CX,
        handleY + 5 + dy,
      )
      ctx.restore()
    }
    // the world — bloom + strolls
    if (vt >= T.sweep + T.world) {
      const local = vt - T.sweep - T.world
      for (let i = 0; i < discs.length; i++) {
        if (i === centreIdx) continue
        const d = discs[i]
        const delay =
          T.bloomWait +
          (Math.max(0, Math.hypot(d.x, d.y) / R - 0.3) / 0.7) * T.bloomSpread
        const p = ease(clamp01((local - delay) / 0.5))
        if (p <= 0.01) continue
        const Torb = 11 + (i % 5) * 2.6
        const dir = i % 2 ? -1 : 1
        const phase = (((local + i * 1.7) / Torb) * Math.PI * 2) * dir
        const rOrb = 2 + (i % 3)
        const x = CX + (d.x / box) * CROWD_W + Math.cos(phase) * rOrb
        const y = AY + (d.y / box) * CROWD_W + Math.sin(phase) * rOrb
        circleImg(personAt(i), x, y, (d.size / box) * CROWD_W * (0.4 + 0.6 * p), p)
      }
    }
    // the member — carry, drift, shrink, breath
    if (vt >= T.sweep) {
      const pT = clamp01((vt - T.sweep) / T.exit)
      const dx = -carryDelta * (1 - ease(pT))
      const dyF = -(1 - vz) * dotDrift
      const shrinkP = ease(clamp01((vt - turnAt) / 0.45))
      const restAt = T.sweep + T.exit
      const breath =
        1 +
        0.012 *
          clamp01((vt - restAt) / 0.5) *
          (1 - clamp01((vt - T.sweep - T.world) / 0.25)) *
          Math.sin(((vt - restAt) / 1.6) * Math.PI * 2)
      const scale = vz * (1 + (targetScale - 1) * shrinkP) * breath
      circleImg(person, CX + dx, AY + dyF, FACE * scale, 1)
    }
  }

  const total = T.sweep + T.world + T.bloomWait + T.bloomSpread + 1.6
  const save = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ando-affiliate-${person}.${ext}`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Fast path — WebCodecs: the pass is pure in vt, so draw and
  // encode every frame as fast as the CPU allows (~1-2s for the
  // whole pass) and mux straight to mp4. Frame-exact timing, no
  // realtime wait, no rAF jitter.
  if ('VideoEncoder' in window) {
    try {
      const { Muxer, ArrayBufferTarget } = await import('mp4-muxer')
      // 60fps + integer-microsecond timestamps — 30fps reads
      // steppy against this motion, and fractional timestamps make
      // players judder. High@4.2 carries 1080p60.
      const fps = 60
      const width = W * SCALE
      const height = H * SCALE
      const config = {
        codec: 'avc1.64002a',
        width,
        height,
        bitrate: 20_000_000,
        framerate: fps,
      }
      const { supported } = await VideoEncoder.isConfigSupported(config)
      if (!supported) throw new Error('avc unsupported')
      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'avc', width, height },
        fastStart: 'in-memory',
      })
      let encodeError: unknown = null
      const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => {
          encodeError = e
        },
      })
      encoder.configure(config)
      const frames = Math.ceil(total * fps)
      for (let f = 0; f <= frames; f++) {
        drawFrame(Math.min(total, f / fps))
        const frame = new VideoFrame(canvas, {
          timestamp: Math.round((f * 1_000_000) / fps),
          duration: Math.round(1_000_000 / fps),
        })
        encoder.encode(frame, { keyFrame: f % 120 === 0 })
        frame.close()
        if (encodeError) throw encodeError
        // drain backpressure, keep the tab breathing
        if (encoder.encodeQueueSize > 8 || f % 30 === 29) {
          await new Promise((r) => setTimeout(r))
        }
      }
      await encoder.flush()
      muxer.finalize()
      save(new Blob([muxer.target.buffer], { type: 'video/mp4' }), 'mp4')
      return
    } catch {
      // fall through to the realtime recorder
    }
  }

  // Realtime fallback — captureStream + MediaRecorder (the joined
  // card's mime ladder), recording the pass at 1× wall clock.
  const mime = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm',
  ].find((m) => MediaRecorder.isTypeSupported(m))
  const ext = mime?.startsWith('video/mp4') ? 'mp4' : 'webm'
  const stream = canvas.captureStream(60)
  const recorder = new MediaRecorder(
    stream,
    mime ? { mimeType: mime, videoBitsPerSecond: 20_000_000 } : undefined,
  )
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data)
  }
  const saved = new Promise<void>((resolve) => {
    recorder.onstop = () => {
      save(
        new Blob(chunks, {
          type: ext === 'mp4' ? 'video/mp4' : 'video/webm',
        }),
        ext,
      )
      resolve()
    }
  })
  drawFrame(0)
  recorder.start()
  const t0 = performance.now()
  await new Promise<void>((resolve) => {
    const frame = (now: number) => {
      const vt = (now - t0) / 1000
      drawFrame(Math.min(vt, total))
      if (vt < total) requestAnimationFrame(frame)
      else resolve()
    }
    requestAnimationFrame(frame)
  })
  recorder.stop()
  await saved
}

type Phase = 'wheel' | 'landed' | 'world'

export function WorldWheel({
  onPick,
  person = 'sara',
  people,
  timing,
  pausedRef,
  speedRef,
  seekRef,
  onTick,
}: {
  onPick?: (person: string) => void
  /** the member — the face the wheel lands on */
  person?: string
  /** the roster for the ring and the crowd; names resolve to
      /avatars/<name>.png, anything with a slash is used as-is */
  people?: string[]
  timing?: Partial<WheelTiming>
  /* studio hooks — stable refs so the pass never restarts on a
     control change; the loop reads them every frame */
  pausedRef?: React.MutableRefObject<boolean>
  speedRef?: React.MutableRefObject<number>
  seekRef?: React.MutableRefObject<number | null>
  onTick?: (t: number) => void
}) {
  const T = useMemo(() => ({ ...DEFAULT_TIMING, ...timing }), [timing])
  const [phase, setPhase] = useState<Phase>('wheel')
  const rootRef = useRef<HTMLDivElement>(null)
  const bandRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const memberImgRef = useRef<SVGImageElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const faceRef = useRef<HTMLImageElement>(null)
  const crowdRef = useRef<HTMLDivElement>(null)
  const seatWrapRef = useRef<HTMLDivElement>(null)
  const belowRef = useRef<HTMLDivElement>(null)
  const profile = profileFor(person)
  const { discs, R } = useMemo(() => solveCrowd(N, PIN), [])
  const { table: angles, sectors } = useMemo(
    () => buildAngleTable(T.sweep, T.exit),
    [T.sweep, T.exit],
  )

  const centreIdx = useMemo(
    () => discs.findIndex((d) => Math.hypot(d.x, d.y) < 1),
    [discs],
  )
  const PAD = 10
  const box = (R + PAD) * 2
  const pct = (n: number) => `${Math.round((n / box) * 1000) / 10}%`
  const pool = (people ?? ['sara', ...POOL]).filter((p) => p !== person)
  const src = (p: string) => (p.includes('/') ? p : `/avatars/${p}.png`)
  const personAt = (i: number) => {
    if (i === centreIdx) return person
    const at = i < centreIdx ? i : i - 1
    return nth(pool, (at * 3) % pool.length)
  }
  const memberDot = (DOTS - (sectors % DOTS)) % DOTS
  const wheelFace = (i: number) =>
    i === memberDot ? person : nth(pool, (i * 3) % pool.length)
  const seat = discs[centreIdx]
  const pinFraction = seat ? seat.size / box : 0.21

  // The driver — the entire pass is a pure function of one virtual
  // clock. Playback advances the clock (dt clamped, the source
  // wheel's rule, so throttled frames slow rather than lurch);
  // pause zeroes it; a seek SETS it, in either direction. Ring,
  // band, swap, settle, shrink, and the parting words are computed
  // per frame from vt; the CSS-driven beats (rises, crowd
  // entrances, strolls) are held paused and SEEKED through the Web
  // Animations API. React phase state is derived from the clock,
  // both directions, so scrubbing backwards un-blooms the world.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('world')
      return
    }
    const ring = ringRef.current
    const face = faceRef.current
    const band = bandRef.current
    const crowd = crowdRef.current
    const wrap = seatWrapRef.current
    const below = belowRef.current
    const head = headRef.current
    if (!ring || !face || !band || !crowd || !wrap || !below || !head) return
    const D = face.offsetWidth * (RING_UNITS / DOT_UNITS)
    const baseR = D / 2
    // The crest dot's centre rides down by this much as the ring
    // scales — it only reaches the avatar's centre at FULL zoom.
    const dotDrift = (DOT_CY / RING_UNITS) * D
    const crest = BAND_ANCHOR - dotDrift
    ring.style.width = `${D}px`
    ring.style.height = `${D}px`
    ring.style.marginLeft = `${-baseR}px`
    ring.style.top = `${crest - baseR}px`
    // The world-turn geometry, measured once up front — offsetWidth
    // and offsetTop are layout values, untouched by transforms.
    const targetScale = (crowd.offsetWidth * pinFraction) / face.offsetWidth
    const centreY = wrap.offsetTop + wrap.offsetHeight / 2
    const rim = crowd.offsetWidth / 2 + 20
    const belowShift = centreY + rim - below.offsetTop
    const headShift = centreY - rim - (head.offsetTop + head.offsetHeight)
    // The stream's velocity at the swap — the crest's tangential
    // speed, read off the angle table — so the face can inherit it.
    const E = T.sweep + T.exit
    const hL = T.sweep / E
    const wLand =
      (angleAt(angles, hL + 0.004) - angleAt(angles, hL - 0.004)) / 0.008 / E
    const carryV0 =
      ((wLand * Math.PI) / 180) * (baseR - dotDrift) * vAt(hL)
    // The braking distance the snap aimed shy by — the face starts
    // there (with the dot) and decelerates INTO the centre.
    const carryDelta = (carryV0 * T.exit) / EASE_POW
    // The departure front — it opens mid-pass and reaches the crest
    // exactly at the swap (tau), so the member's dot is pristine at
    // the handoff while the rest of the ring has been letting go.
    const dotEls = Array.from(
      ring.querySelectorAll('image'),
    ) as SVGImageElement[]
    const departAt = T.sweep * DEPART_FROM
    const tau = (T.sweep - departAt) / (E - departAt)
    // Each dot's remoteness is FIXED — measured against where it
    // stands at the swap — so departure is monotonic; a live angle
    // would resurrect departed dots as they rotate toward the crest.
    const aSwap = angleAt(angles, hL)
    const dotRemote = dotEls.map((_, i) => {
      const ang = ((((i / DOTS) * 360 + aSwap) % 360) + 360) % 360
      return Math.min(ang, 360 - ang) / 180
    })
    const gEls = Array.from(ring.querySelectorAll('g'))
    const fold = (deg: number) => {
      const d = ((deg % 360) + 360) % 360
      return d > 180 ? d - 360 : d
    }
    const memberAngle = (memberDot / DOTS) * 360
    // The house ease, close enough for per-frame driving.
    const ease = (p: number) => 1 - (1 - p) ** EASE_POW
    const clamp01 = (p: number) => Math.min(1, Math.max(0, p))
    const seekAnims = (vt: number) => {
      const root = rootRef.current
      if (!root) return
      const landMs = T.sweep * 1000
      const worldMs = (T.sweep + T.world) * 1000
      for (const anim of document.getAnimations()) {
        const el = (anim.effect as KeyframeEffect | null)?.target
        if (!el || !root.contains(el)) continue
        if (anim.playState !== 'paused') anim.pause()
        const start = crowd.contains(el as Node) ? worldMs : landMs
        const ct = Math.max(0, vt * 1000 - start)
        const cur = typeof anim.currentTime === 'number' ? anim.currentTime : 0
        if (Math.abs(cur - ct) > 4) anim.currentTime = ct
      }
    }
    let raf = 0
    let vt = 0
    let lastPhase: Phase = 'wheel'
    let last = performance.now()
    const frame = (now: number) => {
      const paused = pausedRef?.current ?? false
      const speed = paused ? 0 : (speedRef?.current ?? 1)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      // The pass has a hard end — the clock parks there instead of
      // counting into the void; seeks land inside [0, totalEnd].
      const totalEnd = T.sweep + T.world + T.bloomWait + T.bloomSpread + 1.2
      if (seekRef?.current != null) {
        vt = Math.min(Math.max(0, seekRef.current), totalEnd)
        seekRef.current = null
      } else {
        vt = Math.min(vt + dt * speed, totalEnd)
      }
      onTick?.(vt)
      // Phase follows the clock — in both directions.
      const ph: Phase =
        vt >= T.sweep + T.world ? 'world' : vt >= T.sweep ? 'landed' : 'wheel'
      if (ph !== lastPhase) {
        lastPhase = ph
        setPhase(ph)
      }
      // The wheel: sweep, then the pass-through growing on from the
      // crest while the band fades over it.
      const h = Math.min(1, vt / T.sweep)
      // The angle rides the extended domain — rotation continues
      // through the landing and dies with the departure.
      const a = angleAt(angles, vt / (T.sweep + T.exit))
      // The shared zoom — ring and face read the same value through
      // the swap; the ring transform carries ONLY the zoom now, so
      // the crest dot and the face are identical by construction.
      const vz = vAt(Math.min(1, vt / (T.sweep + T.exit)))
      ring.style.transform = `translateY(${baseR * vz}px) rotate(${a}deg) scale(${vz})`
      // The departure — gradual across the ENTIRE ring: a front
      // opens mid-pass on the far side and sweeps toward the crest,
      // each dot swelling, drifting outward, and dissolving on its
      // own clock as it's reached. One eased progress per dot ties
      // its motion and its fade together.
      const dp = clamp01((vt - departAt) / (E - departAt))
      // The departure — dots never leave the track and never grow:
      // they slide FARTHER APART along the arc (each dot's angle
      // relative to the member multiplies out) and fade to zero.
      // The member (rel 0) is untouched by construction.
      const s = 1 + SPREAD_K * ease(dp)
      const thM = fold(a + memberAngle)
      for (let i = 0; i < dotEls.length; i++) {
        const dotAngle = (i / DOTS) * 360
        const thNew = thM + fold(fold(a + dotAngle) - thM) * s
        gEls[i]?.setAttribute(
          'transform',
          `rotate(${thNew - a} 144.115 144.115)`,
        )
        const pe = ease(
          clamp01((dp - tau * (1 - dotRemote[i])) / (1 - tau)),
        )
        const el = dotEls[i]
        el.style.opacity =
          i === memberDot && vt >= T.sweep ? '0' : String(1 - pe)
        el.style.transform = `rotate(${-thNew}deg)`
      }
      band.style.visibility = vt >= E ? 'hidden' : 'visible'
      // The scrim drains before touchdown — no wash may sit over
      // the crest face at the swap.
      if (scrimRef.current) {
        scrimRef.current.style.opacity = String(1 - smoothstep(0.75, 0.97, h))
      }
      // The swap — a pure threshold, so it scrubs cleanly.
      face.style.opacity = vt >= T.sweep ? '1' : '0'
      if (memberImgRef.current) {
        memberImgRef.current.style.opacity = vt >= T.sweep ? '0' : '1'
      }
      // The face rides the SAME zoom to rest — size, the crest
      // dot's vertical drift, AND the stream's rightward carry: it
      // leaves the swap at the ring's own tangential velocity and
      // settles back to centre over the tail. Then, on the world
      // turn, the shrink into the seat.
      // The world turn — one family, two spans, both keyed to the
      // bloom's beat: the face shrinks WITH the inner ring (short
      // window), and the words retreat WITH the world's growth,
      // settling only when the outermost ring has landed.
      const turnAt = T.sweep + T.world + T.bloomWait
      const shrinkP = ease(clamp01((vt - turnAt) / 0.45))
      // The words move briskly — most of the growth rides with
      // them; only the outer rings settle after.
      const partP = ease(clamp01((vt - turnAt) / 0.65))
      // The anticipation — once the carry rests, the lone face
      // BREATHES, a slight swell on a calm clock: something is
      // coming. The amplitude ramps in after the ring is gone and
      // hands over to the shrink. Pure in vt, so it scrubs.
      const restAt = T.sweep + T.exit
      const breath =
        1 +
        0.012 *
          clamp01((vt - restAt) / 0.5) *
          (1 - clamp01((vt - T.sweep - T.world) / 0.25)) *
          Math.sin(((vt - restAt) / 1.6) * Math.PI * 2)
      const scale = vz * (1 + (targetScale - 1) * shrinkP) * breath
      const dy = -(1 - vz) * dotDrift
      const pT = clamp01((vt - T.sweep) / T.exit)
      const dx = -carryDelta * (1 - ease(pT))
      face.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`
      head.style.transform = `translateY(${headShift * partP}px)`
      below.style.transform = `translateY(${belowShift * partP}px)`
      seekAnims(vt)
      // With studio hooks attached the loop stays alive for
      // scrubbing; a plain mount stands down after the settle.
      if (seekRef || vt < totalEnd) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [angles, T, pinFraction, pausedRef, speedRef, seekRef, onTick])

  const riseClass = () => (phase === 'wheel' ? 'opacity-0' : 'wb-rise')

  return (
    <div
      className="ww-drive isolate relative flex flex-col items-center text-center"
      ref={rootRef}
    >
      {/* the glide wrapper owns the world-turn transform; the rise
          animation lives a level down so its fill can't fight it */}
      <div className="wb-glide" ref={headRef}>
        <div
          className={riseClass()}
          style={{ ['--wb-delay' as string]: `${T.headline}s` }}
        >
          {/* first person on purpose — the settled frame is the
              thing people screenshot for Twitter/LinkedIn */}
          <Heading as="h3" className="max-w-[240px]" size={TextSize.XXL} weight="regular">
            I&rsquo;m a part of the Ando affiliate program
          </Heading>
        </div>
      </div>
      <div className="relative mt-12" ref={seatWrapRef}>
        <div
          ref={crowdRef}
          className="ww-crowd absolute top-1/2 left-1/2 -z-10 w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ aspectRatio: '1 / 1' }}
        >
          {phase === 'world'
            ? discs.map((d, i) => {
                if (i === centreIdx) return null
                return (
                  <span
                    key={`${personAt(i)}-${i}`}
                    className={`aw-enter aw-item absolute ${onPick ? 'cursor-pointer' : ''}`}
                    onClick={onPick ? () => onPick(personAt(i)) : undefined}
                    style={{
                      left: pct(d.x - d.size / 2 + box / 2),
                      top: pct(d.y - d.size / 2 + box / 2),
                      width: pct(d.size),
                      /* stagger normalized so the INNERMOST ring lands
                         exactly at bloomWait — in step with the
                         member's shrink, one synced motion — and the
                         rest radiate outward over bloomSpread */
                      animationDelay: `${Math.round((T.bloomWait + (Math.max(0, Math.hypot(d.x, d.y) / R - 0.3) / 0.7) * T.bloomSpread) * 100) / 100}s`,
                    }}
                  >
                    <span
                      className="aw-orbit block"
                      style={{
                        animationDirection: i % 2 ? 'reverse' : 'normal',
                        ['--aw-orbit-t' as string]: `${11 + (i % 5) * 2.6}s`,
                        ['--aw-orbit-d' as string]: `${-(i * 1.7)}s`,
                        ['--aw-orbit-r' as string]: `${2 + (i % 3)}px`,
                      }}
                    >
                      <img
                        src={src(personAt(i))}
                        alt=""
                        className="aspect-square w-full max-w-none rounded-full object-cover shadow-[0_0_0_0.5px_rgba(22,25,29,0.08)]"
                      />
                    </span>
                  </span>
                )
              })
            : null}
        </div>
        {/* the wheel band — the crest is tuned per mount so the top
            dot lands exactly on the member's seat at its exact size;
            the driver writes its opacity, so it scrubs both ways */}
        <div className="ww-band pointer-events-none" ref={bandRef}>
            <div className="ww-ring" ref={ringRef}>
              <svg
                aria-hidden="true"
                className="ww-svg"
                viewBox="0 0 288.23 288.23"
                xmlns="http://www.w3.org/2000/svg"
              >
                {Array.from({ length: DOTS }, (_, i) => (
                  <g
                    key={i}
                    transform={`rotate(${(i / DOTS) * 360} 144.115 144.115)`}
                  >
                    <image
                      ref={i === memberDot ? memberImgRef : undefined}
                      className="ww-avatar"
                      height={11.52}
                      href={src(wheelFace(i))}
                      preserveAspectRatio="xMidYMid slice"
                      style={
                        {
                          '--ww-da': `${(i / DOTS) * 360}deg`,
                          opacity:
                            phase !== 'wheel' && i === memberDot
                              ? 0
                              : undefined,
                        } as React.CSSProperties
                      }
                      width={11.52}
                      x={144.115 - 5.76}
                      y={5.875 - 5.76}
                    />
                  </g>
                ))}
              </svg>
            </div>
            <div className="ww-scrim" ref={scrimRef} />
        </div>
        <img
          ref={faceRef}
          alt=""
          className={`wb-face ww-face relative z-20 size-[104px] rounded-full object-cover shadow-[0_0_0_1px_rgba(22,25,29,0.08)] ${phase === 'world' && onPick ? 'cursor-pointer' : ''}`}
          onClick={phase === 'world' && onPick ? () => onPick(person) : undefined}
          src={src(person)}
          style={{ opacity: phase === 'wheel' ? 0 : 1 }}
        />
      </div>
      <div className="wb-below mt-12 flex flex-col items-center" ref={belowRef}>
        <div
          className={riseClass()}
          style={{ ['--wb-delay' as string]: `${T.handle}s` }}
        >
          <Text as="span" color="tertiary" size={TextSize.Small}>
            ando.so/@{profile.handle}
          </Text>
        </div>
      </div>
    </div>
  )
}

/* ── The stage — the scene is laid out ONCE at the mp4's design
   frame (1280×720) and uniformly scaled to fit, like a video
   player. No per-element responsiveness: every viewport sees the
   exact composition the export renders. ─────────────────────────── */

const STAGE_W = 1280
const STAGE_H = 720

function WheelStage({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    // Viewport-measured, never container-measured — the stage's own
    // fixed width would otherwise feed back through flex min-width
    // and lock the fit at 1.
    const fit = () => {
      setScale(
        Math.min(
          (document.documentElement.clientWidth - 32) / STAGE_W,
          (window.innerHeight * 0.85) / STAGE_H,
          1,
        ),
      )
    }
    fit()
    window.addEventListener('resize', fit)
    return () => {
      window.removeEventListener('resize', fit)
    }
  }, [])
  return (
    <div className="flex w-full justify-center">
      <div style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
        <div
          className="relative origin-top-left overflow-hidden"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `scale(${scale})`,
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── The studio — a primitive timeline editor. One lane per beat:
   drag a block to move it in time, drag a block's right edge to
   stretch it. Everything after the landing is anchored to the
   sweep's end, so stretching the sweep carries the whole tail.
   Release replays; the playhead runs with each pass. ───────────── */

const SPAN = 10 // seconds across the whole track
const snap = (v: number) => Math.round(v * 20) / 20
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))

const SAVES_KEY = 'ww-composer-saves'
const NOTES_URL = '/affiliate-announcement/api/notes'

/* A note pinned to the timeline — a moment (or an A–B window) plus
   what Caleb wants said about it. Synced to composer-notes.json at
   the repo root through the notes route, so Claude reads the file
   instead of receiving pasted state. */
type ComposerNote = {
  id: string
  at: number
  window: [number, number] | null
  text: string
  timing: WheelTiming
  active: string[]
  createdAt: string
}

type SavedTake = {
  id: string
  name: string
  t: number
  window: [number, number] | null
  timing: WheelTiming
}

/* The beat map — every driven gesture's absolute [start, end] in
   seconds, derived from a timing exactly the way the driver derives
   it. Copied context carries this map plus which beats overlap the
   window, so a pasted state names its own beats — no hand-naming
   lanes or elements, no wrong labels. */
const beatsFor = (T: WheelTiming): Record<string, [number, number]> => {
  const r2 = (v: number) => Math.round(v * 100) / 100
  const L = T.sweep
  const world = L + T.world
  const turn = world + T.bloomWait
  return {
    sweep: [0, r2(L)],
    tail: [r2(L), r2(L + T.exit)],
    departures: [r2(L * DEPART_FROM), r2(L + T.exit)],
    headline: [r2(L + T.headline), r2(L + T.headline + 0.5)],
    handle: [r2(L + T.handle), r2(L + T.handle + 0.5)],
    'world-carry': [r2(world), r2(world + 0.25)],
    turn: [r2(turn), r2(turn + 0.65)],
    bloom: [r2(turn), r2(turn + T.bloomSpread + 0.5)],
  }
}

const contextOf = (
  t: number,
  window: [number, number] | null,
  T: WheelTiming,
) => {
  const beats = beatsFor(T)
  const lo = window ? window[0] : t
  const hi = window ? window[1] : t
  const active = Object.entries(beats)
    .filter(([, span]) => span[0] <= hi && span[1] >= lo)
    .map(([name]) => name)
  return { t, window, timing: T, beats, active }
}

/* Debug spotlight — which scene element each lane drives, and which
   beats it owns (for the overlay label's time span). */
const LANE_TARGETS: Record<string, string[]> = {
  ring: ['.ww-band'],
  headline: ['.wb-glide'],
  handle: ['.wb-below'],
  turn: ['.wb-face'],
  bloom: ['.ww-crowd'],
}
const LANE_BEATS: Record<string, string[]> = {
  ring: ['sweep', 'tail'],
  headline: ['headline'],
  handle: ['handle'],
  turn: ['turn'],
  bloom: ['bloom'],
}

export function WheelStudio({
  onPick,
  person,
  people,
}: {
  onPick?: (person: string) => void
  person?: string
  people?: string[]
}) {
  const [timing, setTiming] = useState<WheelTiming>(DEFAULT_TIMING)
  const [run, setRun] = useState(0)
  const [paused, setPaused] = useState(false)
  const [speedStr, setSpeedStr] = useState('1')
  const [recording, setRecording] = useState(false)
  const [range, setRange] = useState<{ a: number; b: number } | null>(null)
  const [open, setOpen] = useState(false)
  const [dragLabel, setDragLabel] = useState<{
    f: number
    text: string
  } | null>(null)
  const [saves, setSaves] = useState<SavedTake[]>([])
  const [notes, setNotes] = useState<ComposerNote[]>([])
  const [draft, setDraft] = useState<{
    text: string
    at: number
    window: [number, number] | null
  } | null>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const playRef = useRef<HTMLDivElement>(null)
  const clockRef = useRef<HTMLSpanElement>(null)
  const sliderRef = useRef<HTMLInputElement>(null)
  const lastTRef = useRef(0)
  const pausedRef = useRef(false)
  const speedRef = useRef(1)
  const seekRef = useRef<number | null>(null)
  const historyRef = useRef<WheelTiming[]>([])
  const [spot, setSpot] = useState<{
    chain: string
    detail: string
    labelX: number
    labelY: number
    rects: Array<{ x: number; y: number; w: number; h: number }>
  } | null>(null)
  const timingRef = useRef(timing)
  timingRef.current = timing
  const replay = () => {
    pausedRef.current = false
    setPaused(false)
    setRun((r) => r + 1)
  }
  const togglePause = () => {
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
  }
  const pickSpeed = (s: number) => {
    speedRef.current = s
  }

  // Undo — every gesture that rewrites the timing (a grab, a reset,
  // loading a take) pushes the outgoing timing first; ⌘Z or the
  // button walks back one step and replays.
  const undo = () => {
    const prev = historyRef.current.pop()
    if (!prev) return
    setTiming(prev)
    replay()
  }
  const pushHistory = () => {
    historyRef.current.push({ ...timingRef.current })
    if (historyRef.current.length > 50) historyRef.current.shift()
  }

  // The spotlight — hovering a lane frames the element that lane
  // drives with an agentation-style overlay: blue box + dark label
  // chip, drawn fixed at z-100 so no mask, scrim, or stacking
  // context can swallow it (styling the element itself dies inside
  // the band's soft mask). Always armed; it fires only while the
  // pointer is inside the lane region.
  const spotlight = (lane: string | null) => {
    if (!lane) {
      setSpot(null)
      return
    }
    const sels = LANE_TARGETS[lane] ?? []
    const rects: Array<{ x: number; y: number; w: number; h: number }> = []
    for (const sel of sels) {
      for (const el of document.querySelectorAll<HTMLElement>(sel)) {
        const r = el.getBoundingClientRect()
        rects.push({ x: r.x, y: r.y, w: r.width, h: r.height })
      }
    }
    if (!rects.length) {
      setSpot(null)
      return
    }
    const spans = beatsFor(timingRef.current)
    const names = LANE_BEATS[lane] ?? [lane]
    const lo = Math.min(...names.map((n) => spans[n]?.[0] ?? 0))
    const hi = Math.max(...names.map((n) => spans[n]?.[1] ?? 0))
    const first = rects[0]
    setSpot({
      chain: `<WorldWheel> ${sels.join(' ')}`,
      detail: `${lane} · ${lo}–${hi}s`,
      labelX: Math.max(8, Math.min(first.x + first.w + 12, window.innerWidth - 340)),
      labelY: Math.max(8, Math.min(first.y, window.innerHeight - 88)),
      rects,
    })
  }

  // Saved takes — {t, window, timing} snapshots in localStorage.
  // Loaded after mount (never during SSR), kept until cleared.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVES_KEY)
      if (raw) setSaves(JSON.parse(raw) as SavedTake[])
    } catch {}
  }, [])
  const persistSaves = (next: SavedTake[]) => {
    setSaves(next)
    try {
      localStorage.setItem(SAVES_KEY, JSON.stringify(next))
    } catch {}
  }
  const saveTake = () => {
    persistSaves([
      ...saves,
      {
        id: `${Date.now()}`,
        name: `take ${saves.length + 1}`,
        t: +lastTRef.current.toFixed(3),
        window: range ? [range.a, range.b] : null,
        timing: { ...timingRef.current },
      },
    ])
  }
  const loadTake = (s: SavedTake) => {
    pushHistory()
    setTiming(s.timing)
    setRange(s.window ? { a: s.window[0], b: s.window[1] } : null)
    replay()
  }
  const copyTake = (s: SavedTake) => {
    const text = JSON.stringify({
      name: s.name,
      ...contextOf(s.t, s.window, s.timing),
    })
    navigator.clipboard?.writeText(text).catch(() => {})
    console.log('[wheel take]', text)
  }

  // Timeline notes — pinned to the current t (or the marked A–B
  // window), written through the notes route so the repo file is the
  // source of truth; the page just mirrors it.
  useEffect(() => {
    fetch(NOTES_URL, { cache: 'no-store' })
      .then((r) => r.json())
      .then((n) => {
        if (Array.isArray(n)) setNotes(n)
      })
      .catch(() => {})
  }, [])
  const pushNotes = (next: ComposerNote[]) => {
    setNotes(next)
    fetch(NOTES_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(next),
    }).catch(() => {})
  }
  const openDraft = () => {
    pausedRef.current = true
    setPaused(true)
    setDraft({
      text: '',
      at: +lastTRef.current.toFixed(3),
      window: range ? [range.a, range.b] : null,
    })
  }
  const commitDraft = () => {
    if (!draft || !draft.text.trim()) {
      setDraft(null)
      return
    }
    const ctx = contextOf(draft.at, draft.window, timingRef.current)
    pushNotes([
      ...notes,
      {
        id: `${Date.now()}`,
        at: draft.at,
        window: draft.window,
        text: draft.text.trim(),
        timing: { ...timingRef.current },
        active: ctx.active,
        createdAt: new Date().toISOString(),
      },
    ])
    setDraft(null)
    // The blue marking has served its purpose — the pinned note's
    // amber span takes over.
    if (draft.window) setRange(null)
  }
  const jumpToNote = (n: ComposerNote) => {
    pausedRef.current = true
    setPaused(true)
    seekRef.current = n.at
    setRange(n.window ? { a: n.window[0], b: n.window[1] } : null)
  }

  // The playhead rides the pass's own virtual clock (onTick), so
  // pausing or slowing the pass pauses and slows the line with it.
  // The clock readout makes the timeline addressable — "2.90–3.25"
  // is exact context, since the pass is a pure function of t.
  const onTick = useMemo(
    () => (t: number) => {
      lastTRef.current = t
      const line = playRef.current
      if (line) {
        line.style.left = `${(Math.min(t, SPAN) / SPAN) * 100}%`
        line.style.opacity = '1'
      }
      if (clockRef.current) {
        const T = timingRef.current
        const total = T.sweep + T.world + T.bloomWait + T.bloomSpread + 1.2
        clockRef.current.textContent = `${Math.min(t, total).toFixed(2)} / ${total.toFixed(2)}`
      }
      // The pill's slider follows the pass; a drag writes back
      // through onChange, so only mirror while the user isn't
      // holding it.
      const slider = sliderRef.current
      if (slider && document.activeElement !== slider) {
        slider.value = String(Math.min(t, SPAN))
      }
    },
    [],
  )

  // One copyable line of ground truth: the clock, the marked
  // window, the timing, the derived beat map (with which beats the
  // window touches), and what every driven element is doing right
  // now — paste it into chat instead of describing a frame.
  const copyState = () => {
    const q = (sel: string) => document.querySelector<HTMLElement>(sel)
    const state = {
      ...contextOf(
        +lastTRef.current.toFixed(3),
        range ? ([range.a, range.b] as [number, number]) : null,
        timing,
      ),
      live: {
        ring: q('.ww-ring')?.style.transform ?? null,
        bandOpacity: q('.ww-band')?.style.opacity ?? null,
        face: {
          opacity: q('.wb-face')?.style.opacity ?? null,
          transform: q('.wb-face')?.style.transform ?? null,
        },
        headline: q('.wb-glide')?.style.transform || 'none',
        handle: q('.wb-below')?.style.transform || 'none',
        discs: document.querySelectorAll('.aw-item').length,
      },
    }
    const text = JSON.stringify(state)
    navigator.clipboard?.writeText(text).catch(() => {})
    console.log('[wheel state]', text)
  }

  // The export — one click, no capture prompt: the pass is pure in
  // vt, so it re-renders deterministically to an offscreen canvas
  // and records straight off it (the joined card's approach), at a
  // fixed 1080×1350 regardless of the window.
  const record = async () => {
    if (recording) return
    setRecording(true)
    try {
      await exportWheelVideo({
        person: person ?? 'sara',
        people,
        timing: timingRef.current,
      })
    } finally {
      setRecording(false)
    }
  }

  // Space pauses — the analysis gesture. ⌘Z walks back a grab.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        undo()
        return
      }
      if (e.code !== 'Space' || e.target !== document.body) return
      e.preventDefault()
      togglePause()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* Scrubbing — drag anywhere on the lanes (the blocks still win
     their own grabs) to seek the pass, both directions. Scrubbing
     pauses; play or space resumes from wherever you left it.
     SHIFT-drag marks a window instead — "target between x and y" —
     shown on the ruler and carried into copied state; a plain
     shift-click clears it. */
  const scrub = (e: React.PointerEvent) => {
    const track = trackRef.current
    if (!track) return
    e.preventDefault()
    const el = e.currentTarget as HTMLElement
    try {
      el.setPointerCapture(e.pointerId)
    } catch {}
    const rect = track.getBoundingClientRect()
    const timeAt = (clientX: number) =>
      clamp(((clientX - rect.left) / rect.width) * SPAN, 0, SPAN)
    if (e.shiftKey) {
      // Basic snapping: window endpoints magnet to nearby anchors —
      // beat starts/ends and existing note points — else the grid.
      const anchors = (() => {
        const pts = new Set<number>([0])
        for (const span of Object.values(beatsFor(timingRef.current))) {
          pts.add(span[0])
          pts.add(span[1])
        }
        for (const n of notes) {
          pts.add(n.at)
          if (n.window) {
            pts.add(n.window[0])
            pts.add(n.window[1])
          }
        }
        return [...pts]
      })()
      const magnet = (t: number) => {
        let best: number | null = null
        let dist = 0.12
        for (const p of anchors) {
          const d = Math.abs(p - t)
          if (d < dist) {
            dist = d
            best = p
          }
        }
        return best ?? snap(t)
      }
      const a = magnet(timeAt(e.clientX))
      let latest = { a, b: a }
      setRange(latest)
      const onMove = (ev: PointerEvent) => {
        const b = magnet(timeAt(ev.clientX))
        latest = { a: Math.min(a, b), b: Math.max(a, b) }
        setRange(latest)
      }
      const onUp = () => {
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerup', onUp)
        if (latest.a === latest.b) {
          setRange(null)
          return
        }
        // Marking a stretch IS starting a comment — the draft opens
        // in the stack above, targeted at the window.
        setDraft({ text: '', at: latest.a, window: [latest.a, latest.b] })
      }
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerup', onUp)
      return
    }
    pausedRef.current = true
    setPaused(true)
    const seekTo = (clientX: number) => {
      seekRef.current = timeAt(clientX)
    }
    seekTo(e.clientX)
    const onMove = (ev: PointerEvent) => seekTo(ev.clientX)
    const onUp = () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
  }

  /* One grab: capture the pointer and the timing at grab-time, turn
     horizontal travel into seconds, replay on release. */
  const grab = (
    e: React.PointerEvent,
    edit: (orig: WheelTiming, dt: number) => Partial<WheelTiming>,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    pushHistory()
    const el = e.currentTarget as HTMLElement
    try {
      el.setPointerCapture(e.pointerId)
    } catch {}
    const startX = e.clientX
    const orig = { ...timingRef.current }
    const scale = (trackRef.current?.offsetWidth ?? 600) / SPAN
    const onMove = (ev: PointerEvent) => {
      const delta = edit(orig, (ev.clientX - startX) / scale)
      setTiming({ ...orig, ...delta })
      // Rive-style live readout: the edited value rides the cursor.
      const rect = trackRef.current?.getBoundingClientRect()
      if (rect) {
        setDragLabel({
          f: clamp((ev.clientX - rect.left) / rect.width, 0, 1),
          text: Object.entries(delta)
            .map(([k, v]) => `${k} ${(v as number).toFixed(2)}s`)
            .join(' · '),
        })
      }
    }
    const onUp = () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      setDragLabel(null)
      replay()
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
  }

  const T = timing
  const L = T.sweep // the landing — the tail's anchor
  const px = (t: number) => `${(t / SPAN) * 100}%`
  // One shared track geometry: every row (ruler, lanes, playhead
  // overlay, and the pill's slider) spans [128px, width-52px], so
  // the slider thumb rides exactly under the playhead.
  const laneLabel =
    'w-[104px] shrink-0 cursor-default text-right font-mono text-[10px] text-text-tertiary transition-colors duration-150 hover:text-text-primary'
  const laneTrack =
    'relative h-[24px] flex-1 border-l-[0.5px] border-[rgba(22,25,29,0.08)]'
  // Screen-Studio-style grab affordance: hovering a bar fades in a
  // little white pill on its stretchable edge; the hit zone is wider
  // than the pill and overhangs the edge for an easy grab.
  const barBase =
    'group absolute top-1/2 h-[16px] -translate-y-1/2 cursor-ew-resize touch-none rounded-[5px] transition-[filter] duration-150 hover:brightness-[1.15]'
  const gripBase =
    'absolute top-1/2 -right-[3px] h-[22px] w-[12px] -translate-y-1/2 cursor-ew-resize touch-none'
  const gripPill =
    'pointer-events-none absolute top-1/2 right-[5px] h-[10px] w-[3px] -translate-y-1/2 rounded-full bg-white opacity-0 shadow-[0_0_0_0.5px_rgba(22,25,29,0.3)] transition-opacity duration-150 group-hover:opacity-100'
  const markBase =
    'absolute top-1/2 h-[16px] w-[10px] -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none rounded-[4px] bg-[#242424] transition-transform duration-150 hover:scale-110'

  const pill =
    'cursor-pointer rounded-full border-[0.5px] border-[rgba(22,25,29,0.12)] px-2 py-0.5 font-sans text-[11px] text-text-secondary transition-colors ease-fast hover:text-text-primary'

  return (
    <>
      <div className="w-full" ref={sceneRef}>
        <WheelStage>
          <WorldWheel
            key={run}
            onPick={onPick}
            onTick={onTick}
            pausedRef={pausedRef}
            people={people}
            person={person}
            seekRef={seekRef}
            speedRef={speedRef}
            timing={timing}
          />
        </WheelStage>
      </div>
      {recording ? null : (
        <button
          className="fixed top-5 right-5 z-50 cursor-pointer rounded-full bg-[#242424] px-3 py-1.5 font-sans text-[13px] text-white/80 transition-transform ease-fast hover:scale-[1.03]"
          onClick={(e) => {
            e.currentTarget.blur()
            record()
          }}
          type="button"
        >
          download mp4
        </button>
      )}
      {recording ? null : (
      /* The composer sheet — a Vanta-style morph: the pill is the
         persistent bottom bar (play, clock, a primitive slider),
         and the full board expands above it on one shared Apple
         sheet curve. Width, radius, and the body's grid row all
         ride the same easing; the body fades slightly behind. */
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        {/* the comment stack — floats above the sheet so notes never
            crowd or reflow the timeline. Shift-drag a window on the
            lanes and the draft opens here on release. */}
        {open && (draft || notes.length > 0) ? (
          <div
            className="flex flex-col gap-1.5"
            style={{ width: 'min(760px, 94vw)' }}
          >
            {notes.length ? (
              <div className="flex w-full flex-wrap items-center gap-1.5 rounded-[14px] border-[0.5px] border-[rgba(22,25,29,0.12)] bg-white px-3 py-1.5 shadow-[0_2px_8px_rgba(22,25,29,0.06)]">
                {notes.map((n) => (
                  <span
                    className="flex items-center gap-1.5 rounded-full border-[0.5px] border-[#d97706]/30 bg-[#d97706]/5 px-2 py-0.5 font-mono text-[10px]"
                    key={n.id}
                  >
                    <button
                      className="cursor-pointer text-text-secondary transition-colors ease-fast hover:text-text-primary"
                      onClick={() => jumpToNote(n)}
                      title={n.text}
                      type="button"
                    >
                      {n.window
                        ? `${n.window[0].toFixed(2)}–${n.window[1].toFixed(2)}s`
                        : `${n.at.toFixed(2)}s`}
                      {' · '}
                      {n.text.length > 26 ? `${n.text.slice(0, 26)}…` : n.text}
                    </button>
                    <button
                      className="cursor-pointer text-text-tertiary transition-colors ease-fast hover:text-text-primary"
                      onClick={() =>
                        pushNotes(notes.filter((x) => x.id !== n.id))
                      }
                      type="button"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  className="ml-auto flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-[13px] text-text-tertiary transition-colors ease-fast hover:bg-[rgba(22,25,29,0.05)] hover:text-text-primary"
                  onClick={() => pushNotes([])}
                  title="clear all notes"
                  type="button"
                >
                  ×
                </button>
              </div>
            ) : null}
            {draft ? (
              <div className="flex w-full items-center gap-2 rounded-[14px] border-[0.5px] border-[rgba(22,25,29,0.12)] bg-white px-3 py-1.5 shadow-[0_2px_8px_rgba(22,25,29,0.06)]">
                <span className="shrink-0 font-mono text-[10px] text-[#d97706]">
                  note @{' '}
                  {draft.window
                    ? `${draft.window[0].toFixed(2)}–${draft.window[1].toFixed(2)}s`
                    : `${draft.at.toFixed(2)}s`}
                </span>
                <input
                  autoFocus
                  className="flex-1 rounded-full border-[0.5px] border-[rgba(22,25,29,0.12)] bg-transparent px-3 py-1 font-sans text-[11px] text-text-primary outline-none focus:border-[#d97706]"
                  onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitDraft()
                    if (e.key === 'Escape') setDraft(null)
                  }}
                  placeholder="what should Claude know about this stretch? Enter saves, Esc cancels"
                  value={draft.text}
                />
                <button
                  className="shrink-0 cursor-pointer rounded-full bg-[#d97706] px-2.5 py-1 font-sans text-[11px] text-white transition-transform ease-fast hover:scale-[1.03]"
                  onClick={commitDraft}
                  type="button"
                >
                  pin
                </button>
                <button
                  className="shrink-0 cursor-pointer font-sans text-[11px] text-text-tertiary transition-colors ease-fast hover:text-text-primary"
                  onClick={() => setDraft(null)}
                  type="button"
                >
                  ×
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      <div
        className="select-none overflow-hidden border-[0.5px] border-[rgba(22,25,29,0.12)] bg-white shadow-[0_2px_8px_rgba(22,25,29,0.06)]"
        style={{
          width: open ? 'min(760px, 94vw)' : 384,
          borderRadius: open ? 14 : 24,
          transition:
            'width 0.55s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.55s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div
          className="grid"
          style={{
            gridTemplateRows: open ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.55s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className="p-4 pb-2"
              style={{
                width: 'min(760px, 94vw)',
                opacity: open ? 1 : 0,
                transition: open
                  ? 'opacity 0.35s ease 0.15s'
                  : 'opacity 0.2s ease',
              }}
            >
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono font-medium text-[10px] text-text-tertiary tracking-[0.08em] uppercase">
            Timeline
          </span>
          {range ? (
            <span className="font-mono text-[10px] text-[#2563eb]">
              {range.a.toFixed(2)}–{range.b.toFixed(2)}s
            </span>
          ) : null}
          <div className="flex items-center gap-1.5">
            <button
              className={pill}
              onClick={(e) => {
                e.currentTarget.blur()
                undo()
              }}
              title="⌘Z — walk back the last grab"
              type="button"
            >
              undo
            </button>
            <button
              className={pill}
              onClick={(e) => {
                e.currentTarget.blur()
                openDraft()
              }}
              title="pin a note to the current t or marked window — synced to composer-notes.json for Claude"
              type="button"
            >
              note
            </button>
            <button
              className={pill}
              onClick={(e) => {
                e.currentTarget.blur()
                saveTake()
              }}
              title="snapshot t + window + timing to localStorage"
              type="button"
            >
              save
            </button>
            <button
              className={pill}
              onClick={(e) => {
                e.currentTarget.blur()
                copyState()
              }}
              type="button"
            >
              copy
            </button>
            <input
              className="w-12 rounded-full border-[0.5px] border-[rgba(22,25,29,0.12)] bg-transparent px-1.5 py-0.5 text-center font-mono text-[10px] text-text-secondary outline-none focus:border-[#242424]"
              max={4}
              min={0.05}
              onChange={(e) => {
                setSpeedStr(e.target.value)
                const f = Number.parseFloat(e.target.value)
                if (Number.isFinite(f) && f > 0) pickSpeed(clamp(f, 0.05, 4))
              }}
              step={0.05}
              title="playback speed ×"
              type="number"
              value={speedStr}
            />
            <button
              className={pill}
              onClick={(e) => {
                e.currentTarget.blur()
                pushHistory()
                setTiming(DEFAULT_TIMING)
                replay()
              }}
              type="button"
            >
              reset
            </button>
            <button
              className="cursor-pointer rounded-full bg-[#242424] px-2.5 py-0.5 font-sans text-[11px] text-white/80 transition-transform ease-fast hover:scale-[1.03]"
              onClick={(e) => {
                e.currentTarget.blur()
                replay()
              }}
              type="button"
            >
              replay
            </button>
          </div>
        </div>
        {saves.length ? (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {saves.map((s) => (
              <span
                className="flex items-center gap-1.5 rounded-full border-[0.5px] border-[rgba(22,25,29,0.12)] px-2 py-0.5 font-mono text-[10px]"
                key={s.id}
              >
                <button
                  className="cursor-pointer text-text-secondary transition-colors ease-fast hover:text-text-primary"
                  onClick={() => loadTake(s)}
                  title={`load · t ${s.t}s${s.window ? ` · ${s.window[0]}–${s.window[1]}s` : ''}`}
                  type="button"
                >
                  {s.name}
                </button>
                <button
                  className="cursor-pointer text-text-tertiary transition-colors ease-fast hover:text-text-primary"
                  onClick={() => copyTake(s)}
                  title="copy this take as context"
                  type="button"
                >
                  copy
                </button>
                <button
                  className="cursor-pointer text-text-tertiary transition-colors ease-fast hover:text-text-primary"
                  onClick={() => persistSaves(saves.filter((x) => x.id !== s.id))}
                  type="button"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              className="cursor-pointer font-mono text-[10px] text-text-tertiary transition-colors ease-fast hover:text-text-primary"
              onClick={() => persistSaves([])}
              type="button"
            >
              clear all
            </button>
          </div>
        ) : null}
        <div
          className="relative cursor-ew-resize touch-none pr-9"
          onPointerDown={scrub}
        >
          {/* the ruler */}
          <div className="flex items-center gap-2">
            <span className={laneLabel} />
            <div className="relative h-[16px] flex-1" ref={trackRef}>
              {Array.from({ length: SPAN + 1 }, (_, s) => (
                <span key={s}>
                  <span
                    className="absolute top-0 font-mono text-[9px] text-text-tertiary"
                    style={{ left: px(s) }}
                  >
                    {s}
                  </span>
                  <span
                    className="absolute bottom-0 h-[4px] w-px bg-[rgba(22,25,29,0.18)]"
                    style={{ left: px(s) }}
                  />
                </span>
              ))}
            </div>
          </div>
          {/* the ring — ONE life, one bar: body stretches the sweep,
              the grip stretches the tail (rotation, fade, and zoom
              all rest together), and the notch is the landing */}
          <div className="flex items-center gap-2 rounded-[4px] transition-colors duration-150 hover:bg-[rgba(22,25,29,0.03)]">
            <span
              className={laneLabel}
              onPointerEnter={() => spotlight('ring')}
              onPointerLeave={() => spotlight(null)}
            >
              ring
            </span>
            <div className={laneTrack}>
              <div
                className={`${barBase} bg-[#242424]`}
                onPointerDown={(e) =>
                  grab(e, (o, dt) => ({
                    sweep: clamp(snap(o.sweep + dt), 1, 6),
                  }))
                }
                style={{ left: 0, width: px(L + T.exit) }}
                title={`sweep ${T.sweep.toFixed(2)}s · tail ${T.exit.toFixed(2)}s · lands ${T.sweep.toFixed(2)}s`}
              >
                <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 font-mono text-[9px] text-white/60">
                  sweep {T.sweep.toFixed(2)}s
                </span>
                <div
                  className="pointer-events-none absolute top-0 h-full w-[2px] bg-white/70"
                  style={{ left: `${(L / (L + T.exit)) * 100}%` }}
                />
                <div
                  className={gripBase}
                  onPointerDown={(e) =>
                    grab(e, (o, dt) => ({
                      exit: clamp(snap(o.exit + dt), 0.2, 2),
                    }))
                  }
                >
                  <div className={gripPill} />
                </div>
              </div>
            </div>
          </div>
          {/* the text beats — markers, anchored to the landing */}
          <div className="flex items-center gap-2 rounded-[4px] transition-colors duration-150 hover:bg-[rgba(22,25,29,0.03)]">
            <span
              className={laneLabel}
              onPointerEnter={() => spotlight('headline')}
              onPointerLeave={() => spotlight(null)}
            >
              headline
            </span>
            <div className={laneTrack}>
              <div
                className={markBase}
                onPointerDown={(e) =>
                  grab(e, (o, dt) => ({
                    headline: clamp(snap(o.headline + dt), 0, 4),
                  }))
                }
                style={{ left: px(L + T.headline) }}
                title={`landing +${T.headline.toFixed(2)}s`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-[4px] transition-colors duration-150 hover:bg-[rgba(22,25,29,0.03)]">
            <span
              className={laneLabel}
              onPointerEnter={() => spotlight('handle')}
              onPointerLeave={() => spotlight(null)}
            >
              handle
            </span>
            <div className={laneTrack}>
              <div
                className={markBase}
                onPointerDown={(e) =>
                  grab(e, (o, dt) => ({
                    handle: clamp(snap(o.handle + dt), 0, 4),
                  }))
                }
                style={{ left: px(L + T.handle) }}
                title={`landing +${T.handle.toFixed(2)}s`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-[4px] transition-colors duration-150 hover:bg-[rgba(22,25,29,0.03)]">
            <span
              className={laneLabel}
              onPointerEnter={() => spotlight('turn')}
              onPointerLeave={() => spotlight(null)}
            >
              turn
            </span>
            <div className={laneTrack}>
              <div
                className={markBase}
                onPointerDown={(e) =>
                  grab(e, (o, dt) => ({
                    world: clamp(snap(o.world + dt), 0.3, 5),
                  }))
                }
                style={{ left: px(L + T.world) }}
                title={`landing +${T.world.toFixed(2)}s`}
              />
            </div>
          </div>
          {/* the bloom — body moves the wait, edge stretches the spread */}
          <div className="flex items-center gap-2 rounded-[4px] transition-colors duration-150 hover:bg-[rgba(22,25,29,0.03)]">
            <span
              className={laneLabel}
              onPointerEnter={() => spotlight('bloom')}
              onPointerLeave={() => spotlight(null)}
            >
              bloom
            </span>
            <div className={laneTrack}>
              <div
                className={`${barBase} bg-black/20`}
                onPointerDown={(e) =>
                  grab(e, (o, dt) => ({
                    bloomWait: clamp(snap(o.bloomWait + dt), 0, 2),
                  }))
                }
                style={{
                  left: px(L + T.world + T.bloomWait),
                  width: px(T.bloomSpread),
                }}
                title={`wait ${T.bloomWait.toFixed(2)}s · spread ${T.bloomSpread.toFixed(2)}s`}
              >
                <div
                  className={gripBase}
                  onPointerDown={(e) =>
                    grab(e, (o, dt) => ({
                      bloomSpread: clamp(snap(o.bloomSpread + dt), 0.2, 3),
                    }))
                  }
                >
                  <div className={gripPill} />
                </div>
              </div>
            </div>
          </div>
          {/* the playhead — sweeps the lanes on each run — and the
              marked window, the shared compass for "between x and y" */}
          <div className="pointer-events-none absolute inset-y-0 right-9 left-[112px]">
            {notes.map((n) =>
              n.window ? (
                <div
                  className="absolute inset-y-0 border-x border-[#d97706]/40 bg-[#d97706]/8"
                  key={n.id}
                  style={{
                    left: px(n.window[0]),
                    width: px(n.window[1] - n.window[0]),
                  }}
                />
              ) : (
                <div
                  className="absolute top-0 h-[10px] w-[2px] bg-[#d97706]"
                  key={n.id}
                  style={{ left: px(Math.min(n.at, SPAN)) }}
                />
              ),
            )}
            {range ? (
              <div
                className="absolute inset-y-0 border-x border-[#2563eb]/40 bg-[#2563eb]/8"
                style={{ left: px(range.a), width: px(range.b - range.a) }}
              />
            ) : null}
            <div
              className="absolute top-0 bottom-0 w-px bg-[#2563eb]"
              ref={playRef}
              style={{ left: 0, opacity: 0 }}
            >
              {/* the playhead's grab head — rides the ruler, drags
                  like Rive's; the line alone was never grabbable */}
              <div
                className="pointer-events-auto absolute top-0 left-1/2 h-[12px] w-[8px] -translate-x-1/2 cursor-ew-resize rounded-[2.5px] bg-[#2563eb] shadow-[0_1px_3px_rgba(37,99,235,0.4)]"
                onPointerDown={(e) => {
                  e.stopPropagation()
                  scrub(e)
                }}
              />
            </div>
            {dragLabel ? (
              <div
                className="absolute top-0 whitespace-nowrap rounded-[6px] bg-[#1b1d21] px-2 py-0.5 font-mono text-[10px] text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                style={{
                  left: `${dragLabel.f * 100}%`,
                  transform: 'translate(-50%, calc(-100% - 4px))',
                }}
              >
                {dragLabel.text}
              </div>
            ) : null}
          </div>
        </div>
            </div>
          </div>
        </div>
        {/* the pill — always present: play, the clock, a primitive
            slider, and the expand chevron */}
        <div
          className={`relative h-[48px] ${open ? 'border-t-[0.5px] border-[rgba(22,25,29,0.08)]' : ''}`}
        >
          <button
            className="absolute top-1/2 left-4 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[#242424] transition-transform ease-fast hover:scale-110"
            onClick={(e) => {
              e.currentTarget.blur()
              togglePause()
            }}
            title={paused ? 'play' : 'pause'}
            type="button"
          >
            {paused ? (
              <svg aria-hidden="true" viewBox="0 0 16 16" width="13">
                <path d="M4.5 2.5v11l9-5.5z" fill="currentColor" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 16 16" width="13">
                <rect fill="currentColor" height="11" rx="1" width="3.4" x="3.4" y="2.5" />
                <rect fill="currentColor" height="11" rx="1" width="3.4" x="9.2" y="2.5" />
              </svg>
            )}
          </button>
          <span
            className="absolute top-1/2 left-[52px] w-[68px] -translate-y-1/2 font-mono text-[10px] text-text-secondary"
            ref={clockRef}
          >
            0.00 / 0.00
          </span>
          <input
            aria-label="scrub"
            className="absolute top-1/2 right-[45px] left-[121px] h-[3px] -translate-y-1/2 cursor-ew-resize accent-[#242424]"
            defaultValue={0}
            max={SPAN}
            min={0}
            onChange={(e) => {
              seekRef.current = +e.target.value
            }}
            onPointerDown={() => {
              pausedRef.current = true
              setPaused(true)
            }}
            ref={sliderRef}
            step={0.01}
            type="range"
          />
          <button
            className="absolute top-1/2 right-4 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-text-tertiary transition-colors ease-fast hover:text-text-primary"
            onClick={(e) => {
              e.currentTarget.blur()
              setOpen((o) => !o)
            }}
            title={open ? 'collapse' : 'open the board'}
            type="button"
          >
            <svg
              aria-hidden="true"
              style={{
                transform: open ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.55s cubic-bezier(0.32, 0.72, 0, 1)',
              }}
              viewBox="0 0 16 16"
              width="14"
            >
              <path
                d="M3.5 10 8 5.5l4.5 4.5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.6"
              />
            </svg>
          </button>
        </div>
      </div>
      </div>
      )}
      {spot ? (
        <div className="pointer-events-none fixed inset-0 z-[100]">
          {spot.rects.map((r) => (
            <div
              className="absolute rounded-[8px] border-2 border-[#69a5ff] bg-[#69a5ff]/10"
              key={`${r.x},${r.y},${r.w}`}
              style={{
                left: r.x - 4,
                top: r.y - 4,
                width: r.w + 8,
                height: r.h + 8,
              }}
            />
          ))}
          <div
            className="absolute max-w-[420px] rounded-[10px] bg-[#1b1d21] px-4 py-2.5 font-sans text-[13px] leading-snug shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
            style={{ left: spot.labelX, top: spot.labelY }}
          >
            <div className="whitespace-nowrap text-white/50">{spot.chain}</div>
            <div className="whitespace-nowrap text-white">{spot.detail}</div>
          </div>
        </div>
      ) : null}
    </>
  )
}
