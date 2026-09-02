import type { CSSProperties, ReactNode } from 'react'

// Ported from the canonical Slack sync deck:
// https://github.com/sarayd/ando-media/blob/main/app/slack-sync-cards/cards.tsx

const CARD_HEIGHT = 531
const CARD_SCALE = 0.62
const CARD_WIDTH = 400
const TOTAL_CARDS = 10

interface SlackSyncCard {
  body: string
  glyph: ReactNode
  headline: string
  id: string
  position: number
}

const QUAD_ROWS = [
  { id: 'top', indexes: [0, 1] },
  { id: 'bottom', indexes: [2, 3] },
] as const

const QUIET_CELLS = Array.from({ length: 12 }, (_, index) => ({
  id: `channel-${index + 1}`,
  index,
}))

const SETTLED_CELLS = [
  { id: 'top-left', index: 0 },
  { id: 'top-right', index: 1 },
  { id: 'bottom-left', index: 3 },
  { id: 'bottom-right', index: 2 },
] as const

function GlyphQuad() {
  return (
    <div aria-hidden className="flex flex-col gap-[12px]">
      {QUAD_ROWS.map((row) => (
        <div className="flex items-center gap-[12px]" key={row.id}>
          {row.indexes.map((index) => (
            <div
              className="glyph-cycle size-[21px] shrink-0"
              key={index}
              style={{ '--i': index } as CSSProperties}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

const SPOKEN_IN = new Set([3, 8])

function GlyphQuiet() {
  return (
    <div aria-hidden className="grid grid-cols-6 gap-[8px]">
      {QUIET_CELLS.map((cell) =>
        SPOKEN_IN.has(cell.index) ? (
          <div className="size-[12px] shrink-0 bg-[#2563eb]" key={cell.id} />
        ) : (
          <div
            className="glyph-quiet size-[12px] shrink-0 bg-[#2563eb]"
            key={cell.id}
            style={{ '--i': cell.index } as CSSProperties}
          />
        ),
      )}
    </div>
  )
}

function GlyphSettled() {
  return (
    <div aria-hidden className="grid grid-cols-2 gap-[12px]">
      {SETTLED_CELLS.map((cell) => (
        <div
          className="glyph-breathe size-[21px] shrink-0 bg-[#2563eb]"
          key={cell.id}
          style={{ '--i': cell.index } as CSSProperties}
        />
      ))}
    </div>
  )
}

const slackSyncCards: SlackSyncCard[] = [
  {
    body: 'Add an agent to keep up with it.',
    glyph: <GlyphQuiet />,
    headline: '#engineering is your busiest channel — 8,200 messages.',
    id: 'busiest-agent',
    position: 5,
  },
  {
    body: '48,392 messages have made a new home.',
    glyph: <GlyphSettled />,
    headline: 'You’re all moved in.',
    id: 'wrap',
    position: 6,
  },
  {
    body: 'Two AI agents, plus two automations doing their best. Imagine four that actually knew your work.',
    glyph: <GlyphQuad />,
    headline: 'You worked with 4 Slack agents.',
    id: 'agents',
    position: 9,
  },
  {
    body: 'The other 41 just needed somewhere to put you. An agent can sit in all 47 and speak in the 6.',
    glyph: <GlyphQuiet />,
    headline: 'You’re in 47 channels. You’ve spoken in 6.',
    id: 'never-spoke',
    position: 10,
  },
]

function AmbientWash() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(60% 55% at 22% 18%, #f3ece1 0%, transparent 70%)',
            'radial-gradient(55% 50% at 82% 26%, #cfd9cb 0%, transparent 72%)',
            'radial-gradient(70% 60% at 68% 88%, #b9c6cd 0%, transparent 75%)',
            'radial-gradient(50% 45% at 12% 82%, #e3d9c6 0%, transparent 70%)',
          ].join(','),
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </>
  )
}

function SlackSyncCardView({ card }: { card: SlackSyncCard }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center rounded-[8px] bg-white/[0.38] px-[64px] pt-[32px] pb-[24px] backdrop-blur-[28px]">
      <div className="h-[14px] w-full shrink-0" />
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-[48px]">
        <div className="shrink-0">{card.glyph}</div>
        <div className="flex w-full flex-col gap-[12px]">
          <p className="w-full text-center text-[24px] leading-[1.2] font-medium text-[#1a1817]">
            {card.headline}
          </p>
          <p className="w-full text-center text-[14px] leading-[20px] text-[#78716c]">
            {card.body}
          </p>
        </div>
      </div>
      <div className="min-h-[16px] w-full shrink-0" />
      <div className="absolute inset-x-0 top-0 px-[24px] py-[12px]">
        <p className="text-[10px] leading-[16px] text-[#58524e]">
          {card.position}/{TOTAL_CARDS}
        </p>
      </div>
    </div>
  )
}

export function SlackSyncCards() {
  return (
    <>
      <div
        aria-hidden
        className="slack-sync-cards relative mx-auto overflow-hidden rounded-[8px] bg-[#dfdcd4]"
        style={{
          height: CARD_HEIGHT * CARD_SCALE,
          width: CARD_WIDTH * CARD_SCALE,
        }}
      >
        <AmbientWash />
        <div className="absolute inset-0 z-10">
          {slackSyncCards.map((card, index) => (
            <article
              className="slack-sync-card absolute inset-0"
              key={card.id}
              style={{ '--card-index': index } as CSSProperties}
            >
              <div className="slack-sync-card-float size-full">
                <div
                  className="relative origin-top-left"
                  style={{
                    height: CARD_HEIGHT,
                    transform: `scale(${CARD_SCALE})`,
                    width: CARD_WIDTH,
                  }}
                >
                  <SlackSyncCardView card={card} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <span className="sr-only">
        Highlights from Sara’s Slack sync: {slackSyncCards[0]?.headline}
      </span>
    </>
  )
}
