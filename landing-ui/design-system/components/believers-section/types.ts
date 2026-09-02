import type { ComponentPropsWithRef, ReactNode } from 'react'

/** One investor perspective rendered in the quote carousel. */
export interface Believer {
  /** The quoted person's name. */
  name: string
  /** Their firm or organization. */
  organization: string
  /** Their portrait. */
  avatar: ReactNode
  /** Their firm's wordmark. */
  logo: ReactNode
  /** The pull quote. */
  quote: ReactNode
}

export interface BelieversSectionProps
  extends ComponentPropsWithRef<'section'> {
  /**
   * The investor quotes to show one at a time. @default the three Ando investor
   * perspectives.
   */
  believers?: Believer[]
}
