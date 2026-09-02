import { Logo } from '#components/logo'
import { Hero, TEXT_BODY_SIZE, Text, TextSize } from '#components/text'
import { cn } from '#lib/cn'
import { DownloadButton } from './download-button'
import type { DownloadHeroProps } from './types'

const DEFAULT_TITLE = 'Download Ando'
const DEFAULT_SUBTITLE = (
  <>
    <span className="md:hidden">Available on the App Store.</span>
    <span className="hidden md:inline">
      Available for macOS, Windows, iOS, and Android.
    </span>
  </>
)
const DEFAULT_ACTION = <DownloadButton />

/** A restrained download header using the same editorial measure as the site. */
export function DownloadHero({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  action = DEFAULT_ACTION,
  variant = 'simple',
  grid = false,
  logoStroke = false,
  className,
  ref,
  ...props
}: DownloadHeroProps) {
  return (
    <section
      className={cn('content-frame py-12 md:py-20', className)}
      data-grid={grid || undefined}
      data-logo-stroke={logoStroke || undefined}
      data-variant={variant}
      ref={ref}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-reading flex-col items-center text-center">
        <Logo size={32} variant="mark" />
        <Hero
          className="mt-8 text-balance leading-[0.96]"
          size={{ base: TextSize.XXXL, md: TextSize.Display }}
        >
          {title}
        </Hero>
        <Text
          as="p"
          className="mt-6 text-pretty"
          color="secondary"
          size={TEXT_BODY_SIZE}
        >
          {subtitle}
        </Text>
        <div className="mt-8 flex justify-center">{action}</div>
      </div>
    </section>
  )
}

DownloadHero.displayName = 'DownloadHero'
