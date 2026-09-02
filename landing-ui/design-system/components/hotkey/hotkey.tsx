import type { ComponentProps, FunctionComponent } from 'react'

import { Text, TextColor, TextFont, TextSize } from '#components/text'
import { cn } from '#lib/cn'
import { hotkeyVariants } from './styles'
import type { HotkeyProps } from './types'

/** Single-key keycap badge (e.g. the "D" inside "Download for Mac"). */
function HotkeyKey({
  size = 'md',
  tone = 'inverse',
  className,
  children,
  ...props
}: HotkeyProps) {
  const labelSize = size === 'sm' ? TextSize.XS : TextSize.Small
  const labelColor = tone === 'default' ? TextColor.Tertiary : TextColor.Inverse

  return (
    <kbd
      className={cn(hotkeyVariants({ size, tone }), className)}
      data-slot="hotkey"
      {...props}
    >
      <Text as="span" color={labelColor} font={TextFont.Mono} size={labelSize}>
        {children}
      </Text>
    </kbd>
  )
}

HotkeyKey.displayName = 'Hotkey'

/**
 * Wraps several keys as a combo (e.g. ⌘+K) in an outer `<kbd>`. Per the HTML
 * spec, nesting `<kbd>` within `<kbd>` marks each as an individual key of a
 * larger input. Keep the sizes of the inner keys consistent.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/kbd
 */
function HotkeyGroup({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn('inline-flex items-center gap-1', className)}
      data-slot="hotkey-group"
      {...props}
    />
  )
}

HotkeyGroup.displayName = 'Hotkey.Group'

/** Single-key keycap `Hotkey`, plus its `Group` sub-part. */
type HotkeyComponent = FunctionComponent<HotkeyProps> & {
  Group: FunctionComponent<ComponentProps<'kbd'>>
}

/** Single-key keycap, with a `Group` sub-part for multi-key combos. */
export const Hotkey: HotkeyComponent = Object.assign(HotkeyKey, {
  Group: HotkeyGroup,
})
