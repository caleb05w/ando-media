import type { ComponentPropsWithRef, FunctionComponent } from 'react'

import { Surface } from '#components/surface'
import {
  Text,
  TextColor,
  type TextProps,
  TextSize,
  TextWeight,
} from '#components/text'
import { cn } from '#lib/cn'
import {
  type DownloadCardHeaderProps,
  DownloadCardOrientation,
  type DownloadCardProps,
  type DownloadCardTitleProps,
} from './types'

const orientationClass: Record<DownloadCardOrientation, string> = {
  [DownloadCardOrientation.Vertical]: 'flex-col',
  [DownloadCardOrientation.Horizontal]: 'flex-row',
}

/**
 * DownloadCard - an outlined surface that frames one unit of content, modelled on the
 * Download frame's platform cards. Composes `Surface` (outlined, 24px radius)
 * and exposes slotted parts via dot notation:
 *
 * - `DownloadCard.Body` - the padded content column (32px padding).
 * - `DownloadCard.Header` - leading `icon` + title block + trailing `action`.
 * - `DownloadCard.Icon` / `DownloadCard.Title` / `DownloadCard.Description` - the header pieces.
 * - `DownloadCard.Footer` - an actions row for the stacked layout.
 * - `DownloadCard.Media` - an edge-to-edge media panel, clipped to the card radius.
 *
 * @example
 * <DownloadCard>
 *   <DownloadCard.Body>
 *     <DownloadCard.Header
 *       icon={<IconApple />}
 *       action={<Button size="small" variant="secondary">Download</Button>}
 *     >
 *       <DownloadCard.Title>MacOS</DownloadCard.Title>
 *     </DownloadCard.Header>
 *   </DownloadCard.Body>
 * </DownloadCard>
 */
function DownloadCardRoot({
  orientation = DownloadCardOrientation.Vertical,
  variant,
  radius,
  className,
  children,
  ref,
  ...props
}: DownloadCardProps) {
  return (
    <Surface
      className={cn(
        'relative flex overflow-hidden',
        orientationClass[orientation],
        className,
      )}
      radius={radius}
      ref={ref}
      variant={variant}
      {...props}
    >
      {children}
    </Surface>
  )
}
DownloadCardRoot.displayName = 'DownloadCard'

/** Padded content column (32px). Holds the header, footer, and any body content. */
function DownloadCardBody({
  className,
  ...props
}: ComponentPropsWithRef<'div'>) {
  return (
    <div
      className={cn('flex flex-1 flex-col gap-8 p-8', className)}
      {...props}
    />
  )
}
DownloadCardBody.displayName = 'DownloadCard.Body'

/** Leading visual slot - sizes the icon to 24px and tints it to the tertiary tier. */
function DownloadCardIcon({
  className,
  ...props
}: ComponentPropsWithRef<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex w-fit text-text-tertiary [&_svg]:size-6',
        className,
      )}
      {...props}
    />
  )
}
DownloadCardIcon.displayName = 'DownloadCard.Icon'

/**
 * Header layout: the icon sits on top; below it a row holds the title/description
 * block (left) and the optional action (right).
 */
function DownloadCardHeader({
  icon,
  action,
  className,
  children,
  ...props
}: DownloadCardHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {icon ? <DownloadCardIcon>{icon}</DownloadCardIcon> : null}
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">{children}</div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  )
}
DownloadCardHeader.displayName = 'DownloadCard.Header'

/** DownloadCard title - `Text` at the medium/primary card-title preset; `<h3>` by default. */
function DownloadCardTitle({ as = 'h3', ...props }: DownloadCardTitleProps) {
  return (
    <Text
      as={as}
      color={TextColor.Primary}
      size={TextSize.Medium}
      weight={TextWeight.Medium}
      {...props}
    />
  )
}
DownloadCardTitle.displayName = 'DownloadCard.Title'

/** Supporting copy under the title - `Text` at the small/tertiary preset. */
function DownloadCardDescription({ as = 'p', ...props }: TextProps) {
  return (
    <Text as={as} color={TextColor.Tertiary} size={TextSize.Small} {...props} />
  )
}
DownloadCardDescription.displayName = 'DownloadCard.Description'

/** Actions row for the stacked layout (e.g. the mobile cards' "Scan QR" pill). */
function DownloadCardFooter({
  className,
  ...props
}: ComponentPropsWithRef<'div'>) {
  return <div className={cn('flex items-center gap-3', className)} {...props} />
}
DownloadCardFooter.displayName = 'DownloadCard.Footer'

/**
 * Edge-to-edge media panel - a positioning context for an image or artwork.
 * Carries no padding so its content bleeds to the card edges; the root's
 * `overflow-hidden` clips it to the rounded corners. Size it with `className`
 * (e.g. a width or aspect ratio) and place the media inside.
 */
function DownloadCardMedia({
  className,
  ...props
}: ComponentPropsWithRef<'div'>) {
  return (
    <div
      className={cn('relative shrink-0 overflow-hidden', className)}
      {...props}
    />
  )
}
DownloadCardMedia.displayName = 'DownloadCard.Media'

/**
 * Explicit statics so the compound's type stays nameable in declaration emit
 * (`Object.assign` would otherwise infer the un-exported part functions, which
 * trips TS4023 in consumers like the stories file).
 */
type DownloadCardStatics = {
  Body: FunctionComponent<ComponentPropsWithRef<'div'>>
  Description: FunctionComponent<TextProps>
  Footer: FunctionComponent<ComponentPropsWithRef<'div'>>
  Header: FunctionComponent<DownloadCardHeaderProps>
  Icon: FunctionComponent<ComponentPropsWithRef<'span'>>
  Media: FunctionComponent<ComponentPropsWithRef<'div'>>
  Title: FunctionComponent<DownloadCardTitleProps>
}

export const DownloadCard = Object.assign(DownloadCardRoot, {
  Body: DownloadCardBody,
  Description: DownloadCardDescription,
  Footer: DownloadCardFooter,
  Header: DownloadCardHeader,
  Icon: DownloadCardIcon,
  Media: DownloadCardMedia,
  Title: DownloadCardTitle,
}) as FunctionComponent<DownloadCardProps> & DownloadCardStatics
