import type { useRender } from '@base-ui/react/use-render'
import type { ReactNode } from 'react'

/** Props for `SubNavigation` - a section sub-nav bar (e.g. "About Ando"). */
export interface SubNavigationProps {
  /** A `SubNavigation.Section` title followed by `SubNavigation.Link`s. */
  children?: ReactNode
  /**
   * Extra classes for the centered, 1728px-capped content bar (where padding
   * and any mobile overflow live); the full-bleed background/border is fixed.
   */
  className?: string
  /** Accessible label for the links `<nav>` landmark. @default 'Section' */
  label?: string
}

/** Props for `SubNavigation.Section` - the bar's title label. */
export interface SubNavigationSectionProps {
  children?: ReactNode
  className?: string
}

/** Props for `SubNavigation.Link` - a packed link in the sub-nav bar. Pass
 * `render` (e.g. a `NextLink`) to navigate client-side. */
export interface SubNavigationLinkProps extends useRender.ComponentProps<'a'> {
  /** Marks this link as the current page (darkens it + sets `aria-current`). */
  active?: boolean
}

/** The compound `SubNavigation` type: the bar plus its part slots. */
export interface SubNavigationComponent {
  (props: SubNavigationProps): ReactNode
  Section(props: SubNavigationSectionProps): ReactNode
  Link(props: SubNavigationLinkProps): ReactNode
}
