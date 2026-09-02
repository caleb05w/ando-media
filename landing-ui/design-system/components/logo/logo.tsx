import { cn } from '#lib/cn'
import { type LogoProps, LogoVariant } from './types'

/** The logomark: the speech-bubble glyph with a folded corner and a tail. */
const mark = {
  id: 'mark',
  d: 'M109.528 0C116.968 0 123 6.03092 123 13.4707V80.828C123 88.2681 116.968 94.2997 109.528 94.2997H87.3711C86.745 94.2997 86.1452 94.5507 85.7051 94.996L52.5029 128.586C51.767 129.33 50.4981 128.809 50.498 127.763V77.2851C50.498 76.0783 51.0305 74.9323 51.9521 74.1532L82.6406 48.2128L86.1602 45.0966C87.724 43.7115 86.8241 41.1653 84.8057 41.0078L84.6074 41H37.5059C35.8885 41 34.5772 42.3113 34.5771 43.9287V91.9569C34.5771 93.2508 33.5282 94.2997 32.2344 94.2997H13.4717C6.03162 94.2997 0 88.2681 0 80.828V13.4707C0.000334631 6.03092 6.03182 0 13.4717 0H109.528Z',
}

/** The logomark path data (the speech-bubble glyph), for bespoke fills - e.g. the gradient app-icon in `DownloadHero`. */
export const MARK_PATH = mark.d

/** The "Ando" wordmark, as four letterform paths (rendered O, D, N, A). */
const wordmark = [
  {
    id: 'o',
    d: 'M515.44 104.191C485.471 104.191 465.585 83.465 465.585 52.0956C465.585 20.7262 485.471 0 515.44 0C545.269 0 565.154 20.7262 565.154 52.0956C565.154 83.465 545.269 104.191 515.44 104.191ZM515.44 87.5262C533.645 87.5262 545.549 74.0822 545.549 52.0956C545.549 30.109 533.645 16.665 515.44 16.665C497.234 16.665 485.331 30.109 485.331 52.0956C485.331 74.0822 497.234 87.5262 515.44 87.5262Z',
  },
  {
    id: 'd',
    d: 'M407.633 2.24068C440.122 2.24068 457.628 21.7065 457.628 52.0956C457.628 82.4847 440.122 101.951 407.633 101.951H369.541V2.24068H407.633ZM388.447 85.7057H407.353C426.678 85.7057 438.022 74.2222 438.022 52.0956C438.022 29.969 426.678 18.4855 407.353 18.4855H388.447V85.7057Z',
  },
  {
    id: 'n',
    d: 'M334.983 28.2885V2.24068H353.188V101.951H332.182L304.453 57.5572C298.152 47.6143 291.71 37.2512 286.668 27.5883C287.228 45.2335 287.228 61.1983 287.228 75.9027V101.951H269.023V2.24068H290.029L317.898 46.634C323.499 55.7367 330.501 67.2201 335.543 76.6029C335.123 58.9577 334.983 42.9929 334.983 28.2885Z',
  },
  {
    id: 'a',
    d: 'M261.73 101.951H241.704L233.861 79.964H190.168L182.466 101.951H163L200.951 2.24068H223.078L261.73 101.951ZM199.691 53.0759L195.91 63.8591H228.119L224.198 53.0759C220.697 43.9732 215.936 30.6692 211.875 18.9057C207.813 30.6692 203.052 43.9732 199.691 53.0759Z',
  },
]

// The artwork is exported edge-to-edge (paths touch the right bound), so at
// fractional render widths the right edge can lose a sub-pixel to antialiasing.
// Each viewBox keeps the left/top/bottom tight but adds a little slack on the
// right for breathing room; `overflow-visible` on the svg is the belt-and-braces
// so no edge ever clips. Height is unchanged, so `size` still maps to the exact
// glyph height.
const RIGHT_SLACK = 6

/** Per-variant SVG geometry: the viewBox and the paths it frames. */
const geometry = {
  [LogoVariant.Lockup]: {
    viewBox: `0 0 ${565.154 + RIGHT_SLACK} 128.936`,
    paths: [mark, ...wordmark],
  },
  [LogoVariant.Mark]: {
    viewBox: `0 0 ${123 + RIGHT_SLACK} 128.936`,
    paths: [mark],
  },
  [LogoVariant.Wordmark]: {
    viewBox: `163 0 ${402.154 + RIGHT_SLACK} 104.191`,
    paths: wordmark,
  },
}

/**
 * The Ando brand logo. Monochrome: the paths inherit `currentColor`, so the
 * logo follows the surrounding text `color` and adapts to light/dark with no
 * extra props. Sized by height (`size`); the width follows the artwork's aspect
 * ratio, so each variant stays undistorted. Presentational by design - wrap it
 * in your own link for a clickable home logo.
 */
export function Logo({
  variant = LogoVariant.Lockup,
  size = 20,
  label,
  className,
  style,
  ...props
}: LogoProps) {
  const { viewBox, paths } = geometry[variant]
  // Height drives the size; `w-auto` derives width from the viewBox ratio.
  // `overflow-visible` + the viewBox's right slack keep the edge antialiasing
  // from clipping (see `geometry`). A bare number is px; a string is any CSS length.
  const height = typeof size === 'number' ? `${size}px` : size

  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn('w-auto overflow-visible', className)}
      fill="currentColor"
      role={label ? 'img' : undefined}
      style={{ height, ...style }}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {paths.map(({ id, d }) => (
        <path d={d} key={id} />
      ))}
    </svg>
  )
}

Logo.displayName = 'Logo'
