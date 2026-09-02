'use client'

import { useRouter } from 'next/navigation'

import {
  Button,
  type ButtonProps,
  ButtonVariant,
} from '@repo/design-system-ui/button'
import { Hotkey } from '@repo/design-system-ui/hotkey'

import { GET_ACCESS_HOTKEY } from '@/app/keyboard-shortcuts'

/**
 * `ButtonProps` is a (discriminated) union, so extend it via intersection - an
 * `interface` can't `extends` a union.
 */
export type GetAccessButtonProps = ButtonProps & {
  /**
   * Show the "A" keycap and announce the site-wide shortcut via
   * `aria-keyshortcuts`. The bare-"A" listener (mounted once per page) opens the
   * flow regardless; this is the visible hint, used on the closing CTA.
   * @default false
   */
  hotkey?: boolean
}

/**
 * A "Get access" button wired to the verified waitlist entry point. Shared by
 * the navigation and the closing CTA; all Button props
 * (size/variant/children) pass through.
 */
export function GetAccessButton({
  hotkey = false,
  onClick,
  rightSection,
  variant,
  ...props
}: GetAccessButtonProps) {
  const router = useRouter()
  const hotkeyTone = variant === ButtonVariant.Secondary ? 'default' : 'inverse'

  return (
    <Button
      {...props}
      aria-keyshortcuts={hotkey ? GET_ACCESS_HOTKEY : undefined}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          router.push('/waitlist')
        }
      }}
      variant={variant}
      rightSection={
        hotkey ? (
          // `aria-hidden`: the shortcut is already conveyed by
          // `aria-keyshortcuts`, so keep the keycap out of the accessible name.
          <Hotkey.Group aria-hidden>
            <Hotkey tone={hotkeyTone}>{GET_ACCESS_HOTKEY}</Hotkey>
          </Hotkey.Group>
        ) : (
          rightSection
        )
      }
    />
  )
}

GetAccessButton.displayName = 'GetAccessButton'
