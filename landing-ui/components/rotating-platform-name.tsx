'use client'

import { useEffect, useState } from 'react'

const platforms = ['Slack', 'Teams', 'Discord', 'Telegram'] as const
const ROTATION_INTERVAL_MS = 2800

export function RotatingPlatformName() {
  const [platformIndex, setPlatformIndex] = useState(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) {
      return
    }

    const intervalId = window.setInterval(() => {
      setPlatformIndex((currentIndex) => (currentIndex + 1) % platforms.length)
    }, ROTATION_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <span className="flex w-full justify-center text-center">
      <span
        aria-hidden="true"
        className="inline-grid min-w-[8.7em] justify-items-center"
      >
        {platforms.map((platform, index) => (
          <span
            className={`col-start-1 row-start-1 whitespace-nowrap transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${
              index === platformIndex ? 'opacity-100' : 'opacity-0'
            }`}
            key={platform}
          >
            from <span className="text-text-tertiary">{platform}</span>
          </span>
        ))}
      </span>
      <span className="sr-only">from Slack, Teams, Discord, and Telegram</span>
    </span>
  )
}

RotatingPlatformName.displayName = 'RotatingPlatformName'
