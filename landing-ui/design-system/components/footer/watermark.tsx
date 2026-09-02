import type { ComponentPropsWithRef } from 'react'

import { cn } from '#lib/cn'
import { WATERMARK_PATHS } from './watermark-paths'

export type FooterWatermarkProps = ComponentPropsWithRef<'svg'>

// The faint "Ando" watermark wordmark, used verbatim from the Figma export. The
// artwork bakes in everything: the top-down fade + 4% tint (a vertical
// gradient) and the grainy softening (an feTurbulence + feDisplacementMap
// texture - not a CSS blur). The svg is widened by 64px (`-mx-8`) so the glyphs
// span the content frame 1:1 despite the WATERMARK_VIEWBOX padding (see
// watermark-paths.ts). It is the at-rest graphic and the fallback behind the
// interactive `Footer.WatermarkShadowHover` canvas.
export function FooterWatermark({ className, ...props }: FooterWatermarkProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 1536 232"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      className={cn(
        '-mx-8 block w-[calc(100%+4rem)] text-text-strong',
        className,
      )}
    >
      <defs>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="263.832"
          id="footer-watermark-texture"
          width="1536"
          x="0"
          y="0"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            in="SourceGraphic"
            in2="BackgroundImageFix"
            mode="normal"
            result="shape"
          />
          <feTurbulence
            baseFrequency="0.999 0.999"
            numOctaves="3"
            seed="5831"
            type="fractalNoise"
          />
          <feDisplacementMap
            height="100%"
            in="shape"
            result="displacedImage"
            scale="64"
            width="100%"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feMerge result="effect1_texture">
            <feMergeNode in="displacedImage" />
          </feMerge>
        </filter>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="footer-watermark-fade"
          x1="768"
          x2="768"
          y1="32"
          y2="235.594"
        >
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <clipPath id="footer-watermark-clip">
          <rect fill="white" height="232" width="1536" />
        </clipPath>
      </defs>
      <g clipPath="url(#footer-watermark-clip)">
        <g filter="url(#footer-watermark-texture)">
          {WATERMARK_PATHS.map(({ id, d }) => (
            <path
              d={d}
              fill="url(#footer-watermark-fade)"
              fillOpacity="0.04"
              key={id}
            />
          ))}
        </g>
      </g>
    </svg>
  )
}

FooterWatermark.displayName = 'Footer.Watermark'
