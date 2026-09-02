'use client'

import { AndoHero } from '@repo/ando-hero-ui'

interface ProductAnimationProps {
  startDelay?: number
}

/**
 * The live Ando product walkthrough on a contained neutral stage. The cloud
 * renderer is intentionally disabled so the app window sits on a flat grey.
 */
export function ProductAnimation({ startDelay = 0 }: ProductAnimationProps) {
  return (
    <div className="w-full lg:rounded-3xl lg:border-[0.5px] lg:border-border-strong lg:p-2">
      <div className="h-[809px] overflow-clip rounded-2xl border border-border-subtle bg-surface-quaternary lg:h-[572px] lg:border-0">
        <div className="size-full lg:h-[953px] lg:w-[166.6667%] lg:origin-top-left lg:scale-[0.6]">
          <AndoHero className="size-full" contained startDelay={startDelay} />
        </div>
      </div>
    </div>
  )
}

ProductAnimation.displayName = 'ProductAnimation'
