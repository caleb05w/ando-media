// The product's icon wrapper, reproduced. apps/web renders every glyph through
// `Icon` with the same defaults — round join, outlined, radius 1, stroke 1.5,
// 16px — so a stage that uses the same defaults gets the same icons.
//
// Names come from @central-icons-react/all. A handful of Ando-specific glyphs
// (the rail's active/inactive states, the folder mark) are not in that
// package; they resolve through ANDO_ICON_PATHS instead, copied from the
// product registry so nothing here is redrawn by hand.

import { CentralIcon, type CentralIconProps } from "@central-icons-react/all";
import { iconPathsFilled } from "../../product-ui/icons/paths-filled";
import { iconPathsOutlinedStroke1_5 } from "../../product-ui/icons/paths-outlined-stroke-1-5";
import { iconPathsOutlinedStroke2 } from "../../product-ui/icons/paths-outlined-stroke-2";
import { ANDO_ICON_PATHS, type AndoIconName } from "./ando-icons";

// The package exports the name union only through the component's props.
type CentralIconName = CentralIconProps["name"];

export type IconName = CentralIconName | AndoIconName;

type IconProps = {
  name: IconName;
  size?: number;
  fill?: "outlined" | "filled";
  stroke?: "1" | "1.5" | "2";
  className?: string;
};

// The product ships the path data it extracted from central icons (see
// packages/ui/src/components/icon-registry), and that snapshot is what the
// app draws. The npm package has since moved on for some glyphs, so the
// registry is the source of truth here and the package is only the fallback
// for names the snapshot never included.
const REGISTRY: Record<string, string> = {
  ...iconPathsFilled,
  ...iconPathsOutlinedStroke1_5,
  ...iconPathsOutlinedStroke2,
};

function isAndoIcon(name: IconName): name is AndoIconName {
  return Object.prototype.hasOwnProperty.call(ANDO_ICON_PATHS, name);
}

export function Icon({ name, size = 16, fill = "outlined", stroke = "1.5", className }: IconProps) {
  const classes = ["shrink-0", className].filter(Boolean).join(" ");
  const html = isAndoIcon(name)
    ? ANDO_ICON_PATHS[fill === "filled" && `${name}Filled` in ANDO_ICON_PATHS ? (`${name}Filled` as AndoIconName) : name]
    : REGISTRY[`round-${fill}-radius-1-stroke-${fill === "filled" ? "1.5" : stroke}/${name}`];
  if (html != null) {
    return (
      <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={classes} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }
  return (
    <CentralIcon name={name as CentralIconName} join="round" fill={fill} radius="1" stroke={stroke} size={size} aria-hidden className={classes} />
  );
}

/** The sidebar's compose glyph — a design-provided pencil-square with no
 *  central-icon equivalent. Path copied from compose-conversation-icon.tsx. */
export function ComposeConversationIcon() {
  return (
    <svg aria-hidden className="size-4 shrink-0" fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.5 7.50007V5.50006L12.0286 1.97147C12.2889 1.71112 12.7111 1.71112 12.9714 1.97147L14.0286 3.02866C14.2889 3.28901 14.2889 3.71112 14.0286 3.97147L10.5 7.50007H8.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 2.5H3.56667C3.1933 2.5 3.00661 2.5 2.86401 2.57266C2.73857 2.63658 2.63658 2.73857 2.57266 2.86401C2.5 3.00661 2.5 3.1933 2.5 3.56667V12.4333C2.5 12.8067 2.5 12.9934 2.57266 13.136C2.63658 13.2615 2.73857 13.3634 2.86401 13.4273C3.00661 13.5 3.1933 13.5 3.56667 13.5H12.4333C12.8067 13.5 12.9934 13.5 13.136 13.4273C13.2615 13.3634 13.3634 13.2615 13.4273 13.136C13.5 12.9934 13.5 12.8067 13.5 12.4333V8.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Private channel mark — HashtagLockIcon.tsx verbatim: a 0.9px hashtag (1.33
 *  when the row is unread), the lock body filled with square caps. */
export function HashtagLockIcon({ className, strokeWidth = 0.9 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg aria-hidden xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="none" viewBox="0 0 16 16" className={className}>
      <path d="M5.83333 2.5L4.5 13.5M11.5 2.5L11.1667 5.25L11 6.625M2.5 5.16667H13.5M2.5 10.8333H5.25H6.625" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.16724 11.6667C9.16724 11.2985 9.4657 11 9.8339 11H12.8339C13.2021 11 13.5006 11.2985 13.5006 11.6667V13.3333C13.5006 13.7015 13.2021 14 12.8339 14H9.8339C9.4657 14 9.16724 13.7015 9.16724 13.3333V11.6667Z" fill="currentColor" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" />
      <path d="M9.83276 10.5C9.83276 9.6716 10.5044 9 11.3328 9C12.1612 9 12.8328 9.6716 12.8328 10.5C12.8328 10.7761 12.6089 11 12.3328 11H10.3328C10.0566 11 9.83276 10.7761 9.83276 10.5Z" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" />
    </svg>
  );
}
