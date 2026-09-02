import type { ComponentPropsWithRef, FunctionComponent } from 'react'

import {
  Text,
  TextColor,
  TextFont,
  type TextProps,
  TextSize,
} from '#components/text'
import { cn } from '#lib/cn'
import textureImage from '../../assets/foliage-texture.webp'
import { BelieverCardLinesLayer } from './lines-layer'
import { BelieverCardNoise } from './noise'
import {
  BelieverCardLinesAlign,
  type BelieverCardPersonProps,
  type BelieverCardProps,
} from './types'

/**
 * Per-card left placement (px): each card reveals a different slice of the shared
 * 1648x2058 foliage. Start is nudged ~30px left of its true -2px - its slice hugs
 * the source's left edge, so the leftward drift would otherwise gap.
 */
const textureLeft: Record<BelieverCardLinesAlign, number> = {
  [BelieverCardLinesAlign.Start]: -32,
  [BelieverCardLinesAlign.Center]: -440,
  [BelieverCardLinesAlign.End]: -1114,
}

/**
 * BelieverCard - one investor quote card from the "Believers Details" frame.
 *
 * Pastel surface = blended layers (back-to-front): blurred foliage texture (50%),
 * noise grain (hard-light), `accentColor` (overlay), lines (soft-light). `isolate`
 * scopes the blends. Parts: `.Person` (avatar + name), `.Quote` (pull quote),
 * `.Detail` (supporting line, with `.Highlight` spans).
 */
function BelieverCardRoot({
  accentColor,
  highlighted = true,
  lines,
  logo,
  className,
  children,
  ...props
}: BelieverCardProps) {
  return (
    <div
      className={cn(
        // `isolate` scopes the blends; `bg-[#F5F5F5]` is the Figma artboard base
        // the overlay blend composites against (back-solved, not a theme token).
        'group relative isolate flex h-[308px] flex-col overflow-hidden rounded-lg bg-[#F5F5F5] transition-colors duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
        !highlighted && 'bg-[#E4E4E4]',
        className,
      )}
      data-highlighted={highlighted}
      {...props}
    >
      {/* Texture (50%): one blurred element holding the full 1648x2058 foliage;
          each card reveals a slice via `left` + `background-position`, drifting on
          a compositor-only transform/translate (no per-frame reblur). */}
      <div
        aria-hidden
        className={cn(
          'animate-believer-drift pointer-events-none absolute h-[680px] w-[1648px] bg-no-repeat blur-[5.5px] transition-[filter,opacity] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
          highlighted ? 'opacity-50' : 'grayscale opacity-20',
        )}
        style={{
          left: `${textureLeft[lines]}px`,
          top: '-84px',
          backgroundImage: `url(${textureImage.src})`,
          backgroundSize: '1648px 2058px',
          backgroundPosition: '0px -487px',
        }}
      />
      {/* Noise grain via hard-light. */}
      <BelieverCardNoise
        className={cn(
          'absolute inset-0 size-full mix-blend-hard-light transition-opacity duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
          highlighted ? 'opacity-25' : 'opacity-10',
        )}
      />
      {/* Accent color over the base via overlay blend. */}
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-overlay transition-[background-color] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ backgroundColor: highlighted ? accentColor : '#C9C9C9' }}
      />
      {/* Lines (soft-light) + cursor-following highlight. */}
      <BelieverCardLinesLayer highlighted={highlighted} lines={lines} />
      <div className="relative flex h-full flex-col items-start justify-between px-5 pt-7 pb-5">
        {/* `geometricPrecision` renders the logo SVGs crisply. */}
        <div
          className={cn(
            'flex transition-[filter,opacity] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] [&_svg]:h-6 [&_svg]:w-auto [&_svg]:[shape-rendering:geometricPrecision]',
            !highlighted && 'opacity-45 grayscale contrast-0',
          )}
        >
          {logo}
        </div>
        <div className="flex max-w-[372px] flex-col gap-2.5">{children}</div>
      </div>
      {/* A single hairline frame keeps the layered artwork crisp without
          lifting the card off the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] border border-border-default"
      />
    </div>
  )
}
BelieverCardRoot.displayName = 'BelieverCard'

/**
 * Person row: compact avatar + sans-serif name for the reduced card format.
 */
function BelieverCardPerson({
  avatar,
  className,
  children,
  ...props
}: BelieverCardPersonProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)} {...props}>
      <div className="size-4 shrink-0 overflow-hidden rounded-full bg-opacity-50 transition-[filter,opacity] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-data-[highlighted=false]:grayscale group-data-[highlighted=false]:opacity-55 [&_img]:size-full [&_img]:object-cover">
        {avatar}
      </div>
      <Text
        className="leading-[1.2] transition-colors duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-data-[highlighted=false]:text-black/50"
        color={TextColor.InverseStrong}
        font={TextFont.Sans}
        size={TextSize.Small}
      >
        {children}
      </Text>
    </div>
  )
}
BelieverCardPerson.displayName = 'BelieverCard.Person'

/** The pull quote - compact Suisse Intl, pure white. */
function BelieverCardQuote({ className, ...props }: TextProps) {
  return (
    <Text
      className={cn(
        'leading-[1.35] transition-colors duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-data-[highlighted=false]:text-black/65',
        className,
      )}
      color={TextColor.Inverse}
      font={TextFont.Sans}
      size={TextSize.Medium}
      {...props}
    />
  )
}
BelieverCardQuote.displayName = 'BelieverCard.Quote'

/** Supporting detail line - 14px sans serif, with `Highlight` spans at white 80%. */
function BelieverCardDetail({ className, ...props }: TextProps) {
  return (
    <Text
      className={cn(
        'leading-[1.25] transition-colors duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-data-[highlighted=false]:text-black/40',
        className,
      )}
      color={TextColor.InverseTertiary}
      font={TextFont.Sans}
      size={TextSize.Small}
      {...props}
    />
  )
}
BelieverCardDetail.displayName = 'BelieverCard.Detail'

/** Inline emphasis inside a `BelieverCard.Detail` - lifts the span to white 80%. */
function BelieverCardHighlight({
  className,
  ...props
}: ComponentPropsWithRef<'span'>) {
  return (
    <span
      className={cn(
        'text-text-inverse-strong transition-colors duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-data-[highlighted=false]:text-black/65',
        className,
      )}
      {...props}
    />
  )
}
BelieverCardHighlight.displayName = 'BelieverCard.Highlight'

/**
 * Explicit statics so the compound's type stays nameable in declaration emit
 * (`Object.assign` would otherwise trip TS4023 in consumers).
 */
type BelieverCardStatics = {
  Person: FunctionComponent<BelieverCardPersonProps>
  Quote: FunctionComponent<TextProps>
  Detail: FunctionComponent<TextProps>
  Highlight: FunctionComponent<ComponentPropsWithRef<'span'>>
}

export const BelieverCard = Object.assign(BelieverCardRoot, {
  Detail: BelieverCardDetail,
  Highlight: BelieverCardHighlight,
  Person: BelieverCardPerson,
  Quote: BelieverCardQuote,
}) as FunctionComponent<BelieverCardProps> & BelieverCardStatics
