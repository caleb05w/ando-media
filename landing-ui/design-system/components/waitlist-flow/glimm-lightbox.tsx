'use client'

import {
  accentChain,
  createShader,
  type Palette,
  playSweep,
  type ShaderController,
  type SweepHandle,
} from 'glimm'
import { useReducedMotion } from 'motion/react'
import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'

// Fit from the brand's two chromatic accents: the form's focus-blue (#51a6f5)
// and valid-input green (#75db84). See styles/colors/colors.css.
const SWEEP_PALETTE = accentChain(['#51A6F5', '#75DB84'])

/** Fired from `goTo` on the success screens. The palette override is for the
 * story's switcher; production passes nothing. */
export type GlimmLightboxHandle = { sweep: (palette?: Palette) => void }

/**
 * The glimm sweep behind the waitlist's success screens: a full-viewport WebGL
 * canvas in the dialog's backdrop layer, so the band crosses the lightbox
 * around the opaque card. The WebGL controller is created lazily on the first
 * `sweep()` so shader compilation never blocks the initial dialog render. It is
 * destroyed on close and skipped entirely under reduced motion.
 */
export function GlimmLightbox({ ref }: { ref?: Ref<GlimmLightboxHandle> }) {
  const reduceMotion = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const controllerRef = useRef<ShaderController | null>(null)
  const sweepRef = useRef<SweepHandle | null>(null)

  const ensureController = useCallback((): ShaderController | null => {
    if (reduceMotion) return null
    if (controllerRef.current != null) return controllerRef.current

    const canvas = canvasRef.current
    if (!canvas) return null

    try {
      const controller = createShader({ canvas, palette: SWEEP_PALETTE })
      controllerRef.current = controller
      return controller
    } catch {
      // The sweep is decorative. Unsupported or constrained WebGL should never
      // prevent the waitlist flow from opening or advancing.
      return null
    }
  }, [reduceMotion])

  useImperativeHandle(
    ref,
    () => ({
      sweep(palette) {
        const controller = ensureController()
        if (!controller) return
        // Cancel any in-flight sweep so a re-entry restarts cleanly.
        sweepRef.current?.cancel()
        sweepRef.current = playSweep(controller, {
          palette: palette ?? SWEEP_PALETTE,
        })
      },
    }),
    [ensureController],
  )

  // WebGL is an external system: dispose any lazily-created resources on close.
  useEffect(() => {
    return () => {
      sweepRef.current?.cancel()
      sweepRef.current = null
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
  }, [])

  if (reduceMotion) return null

  // Decorative; no `aria-hidden` (Biome forbids it on a canvas).
  return (
    <canvas
      className="pointer-events-none fixed inset-0 z-50 block size-full"
      ref={canvasRef}
    />
  )
}
