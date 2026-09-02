import { Button as BaseButton } from '@base-ui/react/button'

import { Spinner } from '#components/spinner'
import { Text, TextColor, TextWeight, textSizeClasses } from '#components/text'
import { cn } from '#lib/cn'
import { resolveResponsive } from '#lib/responsive'
import { buttonGeometryClasses, buttonTextSize } from './responsive-size'
import { buttonVariants } from './styles'
import { type ButtonProps, ButtonSize, ButtonVariant } from './types'

/**
 * Button - primary action control. A dark pill (primary) or subtle pill
 * (secondary), in three sizes, with optional left/right slots. The right slot
 * doubles as the hotkey-indicator slot on primary buttons.
 */
export function Button({
  className,
  children,
  leftSection,
  rightSection,
  size = ButtonSize.Medium,
  variant = ButtonVariant.Primary,
  isLoading = false,
  disabled,
  render,
  ref,
  ...props
}: ButtonProps) {
  // One responsive text size drives both the container (em-based icon sizing)
  // and the label, keeping them in lockstep across breakpoints.
  const textSize = buttonTextSize(size)

  return (
    <BaseButton
      aria-busy={isLoading || undefined}
      className={cn(
        buttonVariants({ variant }),
        buttonGeometryClasses(size),
        textSizeClasses(textSize),
        className,
      )}
      disabled={disabled || isLoading}
      focusableWhenDisabled={isLoading}
      nativeButton={render ? false : undefined}
      ref={ref}
      render={render}
      {...props}
    >
      {(isLoading || leftSection) && (
        <span className="flex items-center" data-section="left">
          {isLoading ? (
            // Decorative inside the button: the button conveys "busy" via
            // aria-busy, so the spinner must not add a second accessible name.
            // The spinner only shows while loading; responsive spinner sizing is
            // out of scope, so collapse to the base size.
            <Spinner
              aria-hidden
              size={resolveResponsive(size).base ?? ButtonSize.Medium}
              variant={variant}
            />
          ) : (
            leftSection
          )}
        </span>
      )}

      {children && (
        <Text
          as="span"
          color={TextColor.Inherit}
          data-label=""
          size={textSize}
          truncate
          weight={
            variant === ButtonVariant.Primary
              ? TextWeight.Medium
              : TextWeight.Regular
          }
        >
          {children}
        </Text>
      )}

      {!isLoading && rightSection && (
        <span className="flex items-center" data-section="right">
          {rightSection}
        </span>
      )}
    </BaseButton>
  )
}

Button.displayName = 'Button'
