import type { ComponentProps } from 'react'

import type { VariantProps } from '#lib/cn'
import type { hotkeyVariants } from './styles'

export interface HotkeyProps
  extends ComponentProps<'kbd'>,
    VariantProps<typeof hotkeyVariants> {}
