/**
 * Download targets + client-side platform detection for the /download page.
 *
 * `navigator.platform`/`userAgent` report "MacIntel" on every Mac (Apple's
 * compatibility lie), so the OS and CPU architecture are sniffed from touch
 * points and the WebGL GPU renderer instead.
 */

import { useEffect, useState } from 'react'

/** download.ando.so resolves "latest" to the current signed installer per target. */
export const DOWNLOAD_URLS = {
  macArm64: 'https://download.ando.so/mac/latest/arm64',
  macIntel: 'https://download.ando.so/mac/latest',
  windows: 'https://download.ando.so/windows/latest',
  ios: 'https://apps.apple.com/us/app/ando-team-messaging/id6760619548',
} as const

/** Id on the DownloadPlatforms `<section>`; the hero's scroll fallback targets it. */
export const PLATFORMS_SECTION_ID = 'download-platforms'

export type DownloadPlatform = 'mac' | 'windows' | 'ios' | 'android' | 'unknown'

/** Coarse OS sniff for picking a download target. SSR-safe (returns 'unknown'). */
export function detectPlatform(): DownloadPlatform {
  if (typeof navigator === 'undefined') {
    return 'unknown'
  }
  const ua = navigator.userAgent
  const platform = navigator.platform || ''
  // iPadOS 13+ masquerades as "MacIntel"; its touch points give it away.
  const isIpad = platform === 'MacIntel' && navigator.maxTouchPoints > 1
  if (/iPhone|iPod|iPad/.test(ua) || isIpad) {
    return 'ios'
  }
  if (/Android/.test(ua)) {
    return 'android'
  }
  if (/Mac/.test(platform) || /Mac OS X/.test(ua)) {
    return 'mac'
  }
  if (/Win/.test(platform) || /Windows/.test(ua)) {
    return 'windows'
  }
  return 'unknown'
}

/**
 * Best-effort Apple Silicon check. Reads the WebGL GPU renderer: Chrome/Firefox
 * expose "Apple M-series" vs "Intel/AMD"; Safari masks it to "Apple GPU", so we
 * fall back to S3TC support, which Apple GPUs lack but Intel Macs have.
 */
export function isAppleSilicon(): boolean {
  if (typeof document === 'undefined') {
    return false
  }
  try {
    const gl = document.createElement('canvas').getContext('webgl')
    if (!gl) {
      return false
    }
    const debug = gl.getExtension('WEBGL_debug_renderer_info')
    if (debug) {
      const renderer = String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
      if (/Apple/.test(renderer) && !/Apple GPU/.test(renderer)) {
        return true
      }
      if (/Intel|AMD|Radeon|NVIDIA|GeForce/i.test(renderer)) {
        return false
      }
    }
    const extensions = gl.getSupportedExtensions() || []
    return !extensions.includes('WEBGL_compressed_texture_s3tc_srgb')
  } catch {
    return false
  }
}

/** Mac installer for the running CPU; defaults to arm64 for non-Macs and SSR. */
export function macDownloadUrl(appleSilicon: boolean): string {
  return appleSilicon ? DOWNLOAD_URLS.macArm64 : DOWNLOAD_URLS.macIntel
}

export interface PlatformInfo {
  platform: DownloadPlatform
  /** Apple Silicon vs Intel; defaults to arm64 (`true`) for non-Macs and SSR. */
  appleSilicon: boolean
}

/**
 * Detects the visitor's OS + Mac CPU after mount. SSR-safe: renders the Mac/arm64
 * default first, then corrects on the client (no hydration mismatch).
 */
export function usePlatform(): PlatformInfo {
  const [info, setInfo] = useState<PlatformInfo>({
    appleSilicon: true,
    platform: 'mac',
  })
  useEffect(() => {
    const platform = detectPlatform()
    // Arch only matters for Macs; everyone else keeps the arm64 default.
    setInfo({
      appleSilicon: platform === 'mac' ? isAppleSilicon() : true,
      platform,
    })
  }, [])
  return info
}

export interface HeroDownloadTarget {
  label: string
  /** Installer URL, or `undefined` when the button should scroll to the grid. */
  href?: string
}

/** Maps a detected platform to the hero CTA's label and link (or scroll fallback). */
export function heroDownloadTarget(
  platform: DownloadPlatform,
  appleSilicon: boolean,
): HeroDownloadTarget {
  switch (platform) {
    case 'mac':
      return { href: macDownloadUrl(appleSilicon), label: 'Download for Mac' }
    case 'windows':
      return { href: DOWNLOAD_URLS.windows, label: 'Download for Windows' }
    case 'ios':
      return { href: DOWNLOAD_URLS.ios, label: 'Download from App Store' }
    default:
      // Android (coming soon) + unknown/Linux: nudge down to the platform grid.
      return { label: 'Download' }
  }
}
