import { type RefObject, useEffect, useRef, useState } from 'react'

// Typed via sibling atmospheres.d.ts; runtime is plain JS.
import { mount } from '../background/atmospheres'
import soraConfig from '../background/sora-config.json'
import _soraPoster from './sora-poster.webp'

// A pre-rendered frame of the sky, shown when the live WebGL2 runtime can't
// start (no WebGL2, or the shader fails to compile - common on weaker mobile
// GPUs). Bundlers disagree on the import shape; normalize to a URL string.
const soraPoster =
  typeof _soraPoster === 'string'
    ? _soraPoster
    : (_soraPoster as unknown as { src: string }).src

/* ANDŌ atmospheres "sora" generative cloud sky (seed 1247). Code-split WebGL2 runtime,
   self-throttled to ~20fps, paused when off-screen or the tab is hidden.
   `occluderRef` is the app window: the sky measures the rect it covers so the runtime
   can skip rendering the (mostly hidden) core. */
export function SoraBackground({
  occluderRef,
}: {
  occluderRef?: RefObject<HTMLElement | null>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)
  // Gate the fade-in: the canvas/poster start transparent and ease to opaque
  // once content is actually on screen, so the sky never pops in abruptly.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    // `onReady` fires once after the first frame paints - that's the fade-in cue.
    const api = mount(canvas, soraConfig, { onReady: () => setReady(true) })
    if (api.failed) {
      // GPU/driver can't run the live sky - swap in the static poster.
      setFailed(true)
      return
    }

    // Sync the window's rect (normalized to canvas, y from top) on every reflow.
    const occluder = occluderRef?.current ?? null
    const syncOcclusion = () => {
      if (!occluder) return
      const c = canvas.getBoundingClientRect()
      if (c.width === 0 || c.height === 0) return
      const w = occluder.getBoundingClientRect()
      api.setOcclusion({
        x0: (w.left - c.left) / c.width,
        y0: (w.top - c.top) / c.height,
        x1: (w.right - c.left) / c.width,
        y1: (w.bottom - c.top) / c.height,
      })
    }

    let ro: ResizeObserver | null = null
    if (occluder && 'ResizeObserver' in window) {
      ro = new ResizeObserver(syncOcclusion)
      ro.observe(canvas)
      ro.observe(occluder)
    }
    syncOcclusion()

    if (reduceMotion) {
      // reduced-motion: compose one static frame, no animation loop
      api.play(false)
      api.renderOnce()
    }
    return () => {
      ro?.disconnect()
      api.dispose()
    }
  }, [occluderRef])

  // Shared fade: transparent until ready, then ease to opaque over 700ms.
  // Reduced motion skips the transition (the content just appears).
  const fade = `transition-opacity duration-700 ease-out motion-reduce:transition-none ${ready ? 'opacity-100' : 'opacity-0'}`

  if (failed) {
    return (
      <img
        src={soraPoster}
        alt=""
        aria-hidden
        // `onLoad` can be missed when the poster is served from cache (already
        // complete before the handler attaches), so also resolve via the ref.
        ref={(node) => {
          if (node?.complete) setReady(true)
        }}
        onLoad={() => setReady(true)}
        className={`absolute inset-0 -z-10 block h-full w-full object-cover ${fade}`}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 -z-10 block h-full w-full ${fade}`}
      aria-hidden
    />
  )
}
