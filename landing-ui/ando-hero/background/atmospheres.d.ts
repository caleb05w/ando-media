// Types for the plain-JS WebGL2 background runtime (`atmospheres.js`); lets
// `sora-background.tsx` import `mount` without a suppression or re-checking the JS.

/** Normalized occlusion rect (0..1, y from top). */
export interface OcclusionRect {
  x0: number
  y0: number
  x1: number
  y1: number
}

/** Handle for one mounted sky instance. */
export interface AtmosphereHandle {
  /** True when the sky couldn't start (no WebGL2, or the shader failed to
   * compile/link - common on weaker mobile GPUs). The caller shows a static
   * poster instead. Absent/false on a healthy mount. */
  failed?: boolean
  /** Mark a covered rect so the runtime skips hidden work. */
  setOcclusion(rect: OcclusionRect): void
  /** Start (`true`) or pause (`false`) the loop. */
  play(running: boolean): void
  /** Render one static frame (reduced motion). */
  renderOnce(): void
  /** Tear down and release GPU resources. */
  dispose(): void
}

/** Options for a mounted sky instance. */
export interface MountOptions {
  /** Called once, right after the first frame reaches the screen (lets the
   * caller fade the canvas in instead of popping the sky on). Not called on a
   * failed mount. */
  onReady?: () => void
}

/** Mount the generative sky onto a canvas. */
export function mount(
  canvas: HTMLCanvasElement,
  config: unknown,
  opts?: MountOptions,
): AtmosphereHandle
