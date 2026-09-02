import type { HTMLProps } from '@base-ui/react/use-render'
import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from 'react'

import type { Responsive } from '#lib/responsive'

/** Button size variants. */
export const ButtonSize = {
  Small: 'small',
  Medium: 'medium',
  Large: 'large',
} as const

export type ButtonSize = (typeof ButtonSize)[keyof typeof ButtonSize]

/** Button style variants (May 2026 brand: dark primary pill + subtle secondary pill). */
export const ButtonVariant = {
  Primary: 'primary',
  Secondary: 'secondary',
} as const

export type ButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant]

interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Render as a different element via Base UI's `render` prop (e.g. an anchor).
   * Accepts the function form `(props) => <a {...props} />` for full control.
   */
  render?: ReactElement | ((props: HTMLProps) => ReactElement)
  /** React 19: `ref` is a plain prop (no `forwardRef`). */
  ref?: Ref<HTMLButtonElement>
  /** Visual style. @default 'primary' */
  variant?: ButtonVariant
  /** Size - a single token or a per-breakpoint map. @default 'medium' @example size={{ base: 'small', lg: 'large' }} */
  size?: Responsive<ButtonSize>
  /** Swaps the left section for a spinner and disables the button. */
  isLoading?: boolean
  /** Content before the label (icon / indicator). */
  leftSection?: ReactNode
  /** Content after the label. Doubles as the hotkey-indicator slot. */
  rightSection?: ReactNode
}

/**
 * Accessibility: an icon-only button (no visible text label) must provide an
 * accessible name via `aria-label` or `aria-labelledby`.
 */
export type ButtonContentProps =
  | { children: ReactNode; 'aria-label'?: string; 'aria-labelledby'?: string }
  | { children?: never; 'aria-label': string; 'aria-labelledby'?: string }
  | { children?: never; 'aria-label'?: string; 'aria-labelledby': string }

export type ButtonProps = BaseButtonProps & ButtonContentProps
