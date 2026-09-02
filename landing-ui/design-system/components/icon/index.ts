/**
 * Icons
 *
 * Self-contained inline SVG components (no runtime dependency on the source
 * icon packages). Central Icons (https://centralicons.com) live in
 * `generated.ts` and are managed by the generator (`pnpm icons:add`);
 * brand/platform logos Central Icons doesn't provide (Windows, Android) are
 * hand-authored in `./icons/*.tsx`.
 *
 * @example
 * import { IconArrowUpRight, IconSize } from '@repo/design-system-ui/icon'
 *
 * <IconArrowUpRight />                        // 20px (Medium) by default
 * <IconArrowUpRight size={IconSize.Small} />  // 16px
 * <IconArrowUpRight size={IconSize.Large} />  // 24px
 * <IconArrowUpRight className="text-text-secondary" /> // color via currentColor
 */

export * from './generated'
export { IconAndroid } from './icons/IconAndroid'
export { IconHermes } from './icons/IconHermes'
export { IconMicrosoftTeams } from './icons/IconMicrosoftTeams'
export { IconWindows } from './icons/IconWindows'
export type { IconProps, IconWithFillProps } from './types'
export { IconFill, IconSize } from './types'
