import type { ComponentPropsWithRef } from 'react'

import { Button, ButtonVariant } from '#components/button'
import { IconArrowRight } from '#components/icon'
import { Spinner, SpinnerSize, SpinnerVariant } from '#components/spinner'
import { cn } from '#lib/cn'

/** Props for `WaitlistArrowButton`: any native button attribute (the caller
 * sets the height via `className` and the action via `type="submit"` or
 * `onClick`), with an `aria-label` required since the button is icon-only. */
export type WaitlistArrowButtonProps = Omit<
  ComponentPropsWithRef<'button'>,
  'children'
> & {
  'aria-label': string
  loading?: boolean
}

/**
 * The waitlist's submit arrow: a 64px-wide dark rectangular action holding the
 * 24px right-arrow icon. Shared by the flow's text + select screens and the
 * landing-page email fields so the one control is reused, not re-rolled.
 */
export function WaitlistArrowButton({
  className,
  disabled,
  loading = false,
  ...props
}: WaitlistArrowButtonProps) {
  return (
    <Button
      aria-busy={loading || undefined}
      className={cn(
        'w-16 rounded-none [&_svg:not([role=status])]:size-6',
        className,
      )}
      disabled={disabled || loading}
      variant={ButtonVariant.Primary}
      {...props}
    >
      <span aria-hidden className="grid size-6 place-items-center">
        <IconArrowRight
          className={cn(
            'col-start-1 row-start-1 transition-all duration-200 ease-out',
            loading
              ? 'translate-x-1 scale-75 opacity-0 blur-[2px]'
              : 'translate-x-0 scale-100 opacity-100 blur-0',
          )}
        />
        <Spinner
          aria-hidden
          className={cn(
            'col-start-1 row-start-1 transition-all duration-200 ease-out',
            loading
              ? 'scale-100 opacity-100 blur-0'
              : 'scale-75 opacity-0 blur-[2px]',
          )}
          size={SpinnerSize.Large}
          variant={SpinnerVariant.Primary}
        />
      </span>
    </Button>
  )
}

WaitlistArrowButton.displayName = 'WaitlistArrowButton'
