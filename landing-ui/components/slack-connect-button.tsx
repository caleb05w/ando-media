'use client'

import { Button, type ButtonProps } from '@repo/design-system-ui/button'

const ANDO_APP_URL = 'https://app.ando.so/'

/** Opens Ando, where Slack OAuth can be attached to the signed-in workspace. */
export function SlackConnectButton(props: ButtonProps) {
  return (
    <Button
      render={(renderProps) => <a {...renderProps} href={ANDO_APP_URL} />}
      {...props}
    />
  )
}

SlackConnectButton.displayName = 'SlackConnectButton'
