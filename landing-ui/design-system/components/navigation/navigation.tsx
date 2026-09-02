'use client'

import { Dialog } from '@base-ui/react/dialog'
import { NavigationMenu as BaseNavigationMenu } from '@base-ui/react/navigation-menu'
import { useRender } from '@base-ui/react/use-render'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { IconCrossMedium } from '#components/icon'
import { Text, TextSize } from '#components/text'
import { arrowFocusNavigate } from '#lib/arrow-focus'
import { cn } from '#lib/cn'

/** Props for the `Navigation` header bar. Renders a `<header>` landmark. */
export interface NavigationProps extends ComponentPropsWithRef<'header'> {
  /** Controlled open state for the mobile menu. Pair with `onOpenChange`. */
  open?: boolean
  /** Initial open state for uncontrolled use. @default false */
  defaultOpen?: boolean
  /** Called when the mobile menu opens or closes. */
  onOpenChange?: (open: boolean) => void
}

/**
 * Header bar: brand (left), primary links (center), CTA (right). Below `md`,
 * the center `Menu` gives way to a `Toggle` + `MobileMenu`. The `Dialog.Root`
 * wires the toggle to the menu and is inert when neither is present.
 */
function NavigationRoot({
  className,
  children,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: NavigationProps) {
  const isControlled = open !== undefined
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
  const actualOpen = isControlled ? open : uncontrolledOpen

  // Close the mobile menu when the viewport grows past `md` (where it's hidden),
  // so it can't keep scroll locked or reopen on the way back down.
  useEffect(() => {
    if (!actualOpen) {
      return
    }
    const mql = window.matchMedia('(min-width: 768px)')
    const close = () => {
      if (!mql.matches) {
        return
      }
      if (!isControlled) {
        setUncontrolledOpen(false)
      }
      onOpenChange?.(false)
    }
    mql.addEventListener('change', close)
    return () => mql.removeEventListener('change', close)
  }, [actualOpen, isControlled, onOpenChange])

  return (
    <Dialog.Root
      onOpenChange={(next) => {
        if (!isControlled) {
          setUncontrolledOpen(next)
        }
        onOpenChange?.(next)
      }}
      open={actualOpen}
    >
      <div className="sticky top-0 z-50 w-full bg-surface-primary">
        <header
          className={cn(
            // The shared frame keeps the header aligned with page content/footer.
            'content-frame relative flex items-center justify-between py-3 md:py-5',
            className,
          )}
          {...props}
        >
          {children}
        </header>
      </div>
    </Dialog.Root>
  )
}

NavigationRoot.displayName = 'Navigation'

/**
 * Props for `Navigation.Brand` - the home-linked brand slot. Renders a semantic
 * `<a>` (defaults `href` to `'/'`); for client-side nav pass
 * `render={<NextLink href="/" />}`.
 */
export type NavigationBrandProps = useRender.ComponentProps<'a'>

/**
 * Left-aligned brand slot: renders its children (typically the `Logo`) inside a
 * home link. Keep the logo decorative and name the link with `aria-label` (e.g.
 * "Ando, home") so the brand isn't announced twice.
 */
function NavigationBrand({
  href = '/',
  className,
  children,
  render,
  ref,
  ...props
}: NavigationBrandProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center">
      {useRender({
        defaultTagName: 'a',
        ref,
        render,
        props: {
          ...props,
          href,
          className: cn(
            'inline-flex items-center rounded-lg',
            // Padding gives the focus ring room around the logo; the matching
            // negative margin keeps the logo optically flush at the gutter.
            '-m-2 p-2',
            'transition-opacity duration-150 ease-[ease] hover:opacity-70 motion-reduce:transition-none',
            'focus-ring',
            className,
          ),
          children,
        },
      })}
    </div>
  )
}

NavigationBrand.displayName = 'Navigation.Brand'

/** Props for `Navigation.Menu` - the primary-links nav landmark (center). */
export interface NavigationMenuProps {
  children?: ReactNode
  className?: string
  /** Accessible label for the `<nav>` landmark. Defaults to "Main". */
  label?: string
}

/**
 * Primary navigation. Wraps base-ui `NavigationMenu` (renders `<nav> > <ul>`).
 * Hidden below `md`, where `Navigation.Toggle` + `Navigation.MobileMenu` take
 * over.
 */
function NavigationMenuList({
  className,
  children,
  label = 'Main',
}: NavigationMenuProps) {
  return (
    <BaseNavigationMenu.Root
      aria-label={label}
      className={cn('shrink-0 hidden md:block', className)}
    >
      <BaseNavigationMenu.List className="flex items-center gap-6">
        {children}
      </BaseNavigationMenu.List>
    </BaseNavigationMenu.Root>
  )
}

NavigationMenuList.displayName = 'Navigation.Menu'

/** Props for `Navigation.Link`. Pass `render` (e.g. a `NextLink`) to route. */
export interface NavigationLinkProps extends useRender.ComponentProps<'a'> {
  /** Marks this link as the current page (darkens it + sets `aria-current`). */
  active?: boolean
}

/** A single primary-navigation link. */
function NavigationLink({
  active = false,
  className,
  children,
  ...props
}: NavigationLinkProps) {
  return (
    <BaseNavigationMenu.Item>
      <BaseNavigationMenu.Link
        active={active}
        aria-current={active ? 'page' : undefined}
        className={cn(
          // Tight padding keeps the focus ring near the label; `hit-area`
          // restores the larger click/hover target (the ring is an `outline`).
          'flex items-center justify-center rounded-lg px-3 py-1.5',
          'hit-area-x-2 hit-area-y-1',
          'text-text-tertiary transition-[color] duration-150 ease-[ease] hover:text-text-primary motion-reduce:transition-none',
          active && 'text-text-primary',
          'focus-ring',
          className,
        )}
        {...props}
      >
        <Text
          as="span"
          color="inherit"
          font="sans"
          size={TextSize.Medium}
          weight="medium"
        >
          {children}
        </Text>
      </BaseNavigationMenu.Link>
    </BaseNavigationMenu.Item>
  )
}

NavigationLink.displayName = 'Navigation.Link'

/** Props for `Navigation.Cta` - the right-hand slot. */
export type NavigationCtaProps = ComponentPropsWithRef<'div'>

/** Right-aligned slot for the call-to-action (and the mobile `Toggle`). */
function NavigationCta({ className, children, ...props }: NavigationCtaProps) {
  return (
    <div
      // `gap-4` spaces the CTA from the mobile `Toggle` (inert on desktop).
      className={cn(
        'flex min-w-0 flex-1 items-center justify-end gap-3 md:gap-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

NavigationCta.displayName = 'Navigation.Cta'

/** Props for `Navigation.Toggle` - the hamburger button (mobile only). */
export interface NavigationToggleProps
  extends Omit<ComponentPropsWithRef<'button'>, 'aria-label' | 'children'> {
  /**
   * Accessible name for the icon-only button. @default 'Menu' It both opens
   * and closes the menu; Base UI reflects the state via `aria-expanded`.
   */
  label?: string
}

/**
 * Opens and closes the mobile menu (mobile-only). The two bars morph into an X
 * while open, driven by the trigger's `data-popup-open`. Base UI wires
 * `aria-haspopup`, `aria-expanded`, and `aria-controls`.
 */
function NavigationToggle({
  label = 'Menu',
  className,
  ...props
}: NavigationToggleProps) {
  return (
    <Dialog.Trigger
      aria-label={label}
      className={cn(
        'group inline-flex items-center justify-center text-text-primary md:hidden',
        // `hit-area-3` grows the tap target to 44px without changing layout.
        'hit-area-3 rounded-lg',
        'cursor-pointer touch-manipulation',
        'transition-[opacity,scale] duration-150 ease-[ease] hover:opacity-70 active:scale-95 motion-reduce:transition-none',
        'focus-ring',
        // Modal isolation hides the header from the accessibility tree while
        // open. The popup renders its own semantic close button in this exact
        // position, so hide this visual trigger and let that control replace it.
        'data-[popup-open]:pointer-events-none data-[popup-open]:invisible',
        className,
      )}
      {...props}
    >
      {/* Two bars that rotate into an X. A morph moves on screen -> ease-in-out. */}
      <span aria-hidden className="relative size-5">
        <span className="-translate-x-1/2 -translate-y-1 absolute top-[calc(50%-0.75px)] left-1/2 h-[1.5px] w-[15px] rounded-full bg-current transition-transform duration-200 ease-in-out group-data-[popup-open]:translate-y-0 group-data-[popup-open]:rotate-45 motion-reduce:transition-none" />
        <span className="-translate-x-1/2 absolute top-[calc(50%-0.75px)] left-1/2 h-[1.5px] w-[15px] translate-y-1 rounded-full bg-current transition-transform duration-200 ease-in-out group-data-[popup-open]:-rotate-45 group-data-[popup-open]:translate-y-0 motion-reduce:transition-none" />
      </span>
    </Dialog.Trigger>
  )
}

NavigationToggle.displayName = 'Navigation.Toggle'

/** Props for `Navigation.MobileMenu` - the full-screen mobile menu. */
export interface NavigationMobileMenuProps {
  /** Grouped links (`Navigation.MobileGroup` + `Navigation.MobileLink`). */
  children?: ReactNode
  className?: string
  /** Accessible name for the dialog. @default 'Menu' */
  label?: string
}

/**
 * Mobile menu: a modal frosted surface that fades in below `md`, beneath the
 * `z-50` bar so the brand, CTA, and toggle stay in place. Base UI traps focus,
 * locks scroll, and closes on Escape / outside press.
 */
function NavigationMobileMenu({
  children,
  className,
  label = 'Menu',
}: NavigationMobileMenuProps) {
  return (
    <Dialog.Portal>
      <Dialog.Close
        render={
          <button
            aria-label="Close menu"
            className="hit-area-3 focus-ring fixed top-5 right-5 z-[60] inline-flex cursor-pointer touch-manipulation items-center justify-center rounded-lg text-text-primary transition-[opacity,scale] duration-150 ease-[ease] hover:opacity-70 active:scale-95 motion-reduce:transition-none sm:right-8 md:hidden"
            type="button"
          >
            <IconCrossMedium />
          </button>
        }
      />
      <Dialog.Popup
        aria-label={label}
        className={cn(
          // Frosted glass beneath the `z-50` bar (translucent surface + blur).
          'fixed inset-0 z-40 flex flex-col bg-surface-primary/80 outline-none backdrop-blur-xl',
          // Fade only; exit a touch quicker.
          'transition-opacity duration-200 ease-out',
          'data-[starting-style]:opacity-0',
          'data-[ending-style]:opacity-0 data-[ending-style]:duration-150',
          'motion-reduce:transition-none',
          className,
        )}
      >
        <Dialog.Close
          aria-label="Close menu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-5 focus:right-5 focus:z-[70] focus:inline-flex focus:items-center focus:justify-center focus:rounded-lg focus:text-text-primary focus:focus-ring"
        >
          <IconCrossMedium />
        </Dialog.Close>
        {/* `pt-20` clears the compact mobile bar. Up/Down arrows rove between links, like Tab. */}
        <nav
          className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 pt-20 pb-8 sm:px-8"
          onKeyDown={arrowFocusNavigate}
        >
          {children}
        </nav>
      </Dialog.Popup>
    </Dialog.Portal>
  )
}

NavigationMobileMenu.displayName = 'Navigation.MobileMenu'

/** Props for `Navigation.MobileGroup` - a titled column of mobile links. */
export interface NavigationMobileGroupProps {
  children?: ReactNode
  className?: string
  /** Muted group heading (e.g. "Company"); rendered as an `<h2>`. */
  title: ReactNode
}

/** A titled group of links inside `Navigation.MobileMenu` (e.g. "Company"). */
function NavigationMobileGroup({
  title,
  className,
  children,
}: NavigationMobileGroupProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <Text as="h2" color="tertiary" size={TextSize.Small}>
        {title}
      </Text>
      <ul className="flex flex-col gap-1">{children}</ul>
    </div>
  )
}

NavigationMobileGroup.displayName = 'Navigation.MobileGroup'

/** Props for `Navigation.MobileLink` - a link inside a mobile group. */
export interface NavigationMobileLinkProps
  extends useRender.ComponentProps<'a'> {
  /** Marks this link as the current page (sets `aria-current`). */
  active?: boolean
}

/** A single large link inside a `Navigation.MobileGroup`. */
function NavigationMobileLink({
  active = false,
  className,
  children,
  render,
  ref,
  ...props
}: NavigationMobileLinkProps) {
  return (
    <li>
      {useRender({
        defaultTagName: 'a',
        ref,
        render,
        props: {
          ...props,
          'aria-current': active ? 'page' : undefined,
          className: cn(
            'inline-flex w-fit touch-manipulation items-center rounded-lg',
            'py-0.5',
            'text-text-primary transition-[color] duration-150 ease-[ease] hover:text-text-strong motion-reduce:transition-none',
            'focus-ring',
            className,
          ),
          children: (
            <Text
              as="span"
              color="inherit"
              size={{ base: TextSize.Large, sm: TextSize.XL }}
            >
              {children}
            </Text>
          ),
        },
      })}
    </li>
  )
}

NavigationMobileLink.displayName = 'Navigation.MobileLink'

/** The compound `Navigation` type: a callable header plus its part slots. */
export interface NavigationComponent {
  (props: NavigationProps): ReactNode
  Brand(props: NavigationBrandProps): ReactNode
  Menu(props: NavigationMenuProps): ReactNode
  Link(props: NavigationLinkProps): ReactNode
  Cta(props: NavigationCtaProps): ReactNode
  Toggle(props: NavigationToggleProps): ReactNode
  MobileMenu(props: NavigationMobileMenuProps): ReactNode
  MobileGroup(props: NavigationMobileGroupProps): ReactNode
  MobileLink(props: NavigationMobileLinkProps): ReactNode
}

/** Compound navigation header. See `NavigationProps` and the part exports. */
export const Navigation: NavigationComponent = Object.assign(NavigationRoot, {
  Brand: NavigationBrand,
  Menu: NavigationMenuList,
  Link: NavigationLink,
  Cta: NavigationCta,
  Toggle: NavigationToggle,
  MobileMenu: NavigationMobileMenu,
  MobileGroup: NavigationMobileGroup,
  MobileLink: NavigationMobileLink,
})
