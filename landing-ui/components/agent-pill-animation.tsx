'use client'

import { type ReactNode, useEffect, useState } from 'react'

import {
  IconClaudeai,
  IconDevin,
  IconOpenaiCodex,
  IconOpenclaw,
  IconSize,
} from '@repo/design-system-ui/icon'
import { Text } from '@repo/design-system-ui/text'

const ROTATION_INTERVAL_MS = 2800

type AgentPillItem = {
  id: string
  icon: ReactNode
  label: string
  textClassName: string
}

const agentPillItems = [
  {
    id: 'codex',
    label: 'Codex agents',
    icon: (
      <IconOpenaiCodex
        className="size-8 text-[#7c3aed]"
        size={IconSize.Large}
      />
    ),
    textClassName: 'text-[#7c3aed]',
  },
  {
    id: 'claude',
    label: 'Claude agents',
    icon: (
      <IconClaudeai className="size-8 text-[#d9977b]" size={IconSize.Large} />
    ),
    textClassName: 'text-[#b66f51]',
  },
  {
    id: 'devin',
    label: 'Devin agents',
    icon: <IconDevin className="size-8 text-[#2563eb]" size={IconSize.Large} />,
    textClassName: 'text-[#2563eb]',
  },
  {
    id: 'openclaw',
    label: 'OpenClaw agents',
    icon: (
      <IconOpenclaw className="size-8 text-[#188557]" size={IconSize.Large} />
    ),
    textClassName: 'text-[#188557]',
  },
] as const satisfies readonly AgentPillItem[]

function useCyclingIndex(length: number, intervalMs = ROTATION_INTERVAL_MS) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (length <= 1) {
      return
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) {
      return
    }

    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % length)
    }, intervalMs)
    return () => window.clearInterval(interval)
  }, [intervalMs, length])

  return index
}

export function BringYourOwnAgentsPill() {
  const index = useCyclingIndex(agentPillItems.length)

  return (
    <div className="flex flex-col items-center gap-4">
      <Text
        as="p"
        className="text-center"
        color="tertiary"
        size={{ base: 'md', md: 'lg' }}
      >
        Bring your own...
      </Text>
      <div
        aria-label="Bring your own Codex, Claude, Devin, and OpenClaw agents"
        className="flex w-[388px] max-w-[calc(100vw-2rem)] items-center justify-center rounded-full border border-black/[0.04] bg-black/[0.03] px-5 py-2 sm:px-6"
        role="img"
      >
        <div
          aria-hidden="true"
          className="relative h-12 w-full overflow-hidden"
        >
          {agentPillItems.map((agentItem, agentIndex) => {
            const active = agentIndex === index

            return (
              <div
                className={`absolute inset-0 flex items-center justify-center gap-4 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none sm:gap-5 ${
                  active
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-2 opacity-0'
                }`}
                key={agentItem.id}
              >
                <div className="flex shrink-0 items-center justify-center">
                  {agentItem.icon}
                </div>
                <Text
                  as="span"
                  className={`whitespace-nowrap text-center leading-[1.15] ${agentItem.textClassName}`}
                  size="2xl"
                  weight="medium"
                >
                  {agentItem.label}
                </Text>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

BringYourOwnAgentsPill.displayName = 'BringYourOwnAgentsPill'
