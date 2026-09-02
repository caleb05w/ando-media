'use client'

import { useEffect, useRef } from 'react'

const CALENDLY_SCRIPT_ID = 'calendly-widget-script'
const CALENDLY_SCRIPT_URL =
  'https://assets.calendly.com/assets/external/widget.js'
const CALENDLY_URL = 'https://calendly.com/andosara/onboarding'

interface CalendlyEventData {
  event?: unknown
  payload?: {
    event?: { uri?: unknown }
    invitee?: { uri?: unknown }
  }
}

interface CalendlyWindow extends Window {
  Calendly?: {
    initInlineWidget: (options: {
      parentElement: HTMLElement
      url: string
    }) => void
  }
}

function scheduledEventData(value: unknown): {
  eventUri: string
  inviteeUri: string
} | null {
  if (typeof value !== 'object' || value == null) {
    return null
  }
  const data = value as CalendlyEventData
  const eventUri = data.payload?.event?.uri
  const inviteeUri = data.payload?.invitee?.uri
  if (
    data.event !== 'calendly.event_scheduled' ||
    typeof eventUri !== 'string' ||
    typeof inviteeUri !== 'string'
  ) {
    return null
  }
  return { eventUri, inviteeUri }
}

export function CalendlyScheduler({
  onScheduled,
}: {
  onScheduled: (booking: { eventUri: string; inviteeUri: string }) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onScheduledRef = useRef(onScheduled)
  onScheduledRef.current = onScheduled

  useEffect(() => {
    function initialize() {
      const calendlyWindow = window as CalendlyWindow
      if (containerRef.current == null || calendlyWindow.Calendly == null) {
        return
      }
      containerRef.current.replaceChildren()
      calendlyWindow.Calendly.initInlineWidget({
        parentElement: containerRef.current,
        url: CALENDLY_URL,
      })
    }

    const calendlyWindow = window as CalendlyWindow
    if (calendlyWindow.Calendly != null) {
      initialize()
      return
    }

    const existing = document.getElementById(
      CALENDLY_SCRIPT_ID,
    ) as HTMLScriptElement | null
    const script = existing ?? document.createElement('script')
    if (existing == null) {
      script.async = true
      script.id = CALENDLY_SCRIPT_ID
      script.src = CALENDLY_SCRIPT_URL
      document.head.append(script)
    }
    script.addEventListener('load', initialize)
    return () => script.removeEventListener('load', initialize)
  }, [])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== new URL(CALENDLY_URL).origin) {
        return
      }
      const booking = scheduledEventData(event.data)
      if (booking != null) {
        onScheduledRef.current(booking)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return <div className="h-[700px] w-full" ref={containerRef} />
}
