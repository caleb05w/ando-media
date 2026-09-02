'use client'

import { Alignment, Fit, Layout, useRive } from '@rive-app/react-webgl2'
import { useEffect, useState } from 'react'

// The manifesto agent is the cursor-following variant of the 404 agent: same
// "look" art, but with a state machine + script (`CursorInput`) that reads the
// pointer and a feather-blurred glow that only the Rive Renderer (WebGL2) can
// draw. The script binds to `ViewModel1` (autoBind) and owns a fixed hit area,
// so the artboard is letterboxed with `Fit.Contain` (matching the 404 agent).
//
// Two builds ship: a desktop file with a generous hit area, and a mobile file
// sized for phones. We swap by viewport, matching the site's mobile/desktop
// divide (Tailwind `md`, where the nav also switches).
const AGENT_RIVE_DESKTOP = '/manifesto/agent-desktop.riv'
const AGENT_RIVE_MOBILE = '/manifesto/agent-mobile.riv'
const AGENT_STATE_MACHINE = 'State Machine 1'
const MOBILE_QUERY = '(max-width: 767.98px)'

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// `null` until resolved on the client, so we render the correct file once
// instead of loading the desktop build and then swapping it on phones.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY)

    setIsMobile(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}

function AgentCanvas({
  src,
  prefersReducedMotion,
}: {
  src: string
  prefersReducedMotion: boolean
}) {
  const { RiveComponent, rive } = useRive({
    src,
    stateMachines: AGENT_STATE_MACHINE,
    autoplay: true,
    autoBind: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  })

  // Respect reduced-motion: hold the agent on its resting pose instead of
  // tracking the cursor.
  useEffect(() => {
    if (!rive) {
      return
    }

    if (prefersReducedMotion) {
      rive.pause()
    } else {
      rive.play()
    }
  }, [prefersReducedMotion, rive])

  return <RiveComponent className="absolute inset-0 size-full" />
}

export function ManifestoAgent() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const isMobile = useIsMobile()

  // Resolve the file only once the viewport is known (isMobile !== null).
  let src: string | null = null
  if (isMobile === true) {
    src = AGENT_RIVE_MOBILE
  } else if (isMobile === false) {
    src = AGENT_RIVE_DESKTOP
  }

  return (
    <div
      aria-hidden="true"
      className="relative h-[220px] w-full max-w-[475px] sm:h-[280px]"
    >
      {src ? (
        // `key` remounts the canvas (fresh Rive instance) when the file changes.
        <AgentCanvas
          key={src}
          prefersReducedMotion={prefersReducedMotion}
          src={src}
        />
      ) : null}
    </div>
  )
}

ManifestoAgent.displayName = 'ManifestoAgent'
