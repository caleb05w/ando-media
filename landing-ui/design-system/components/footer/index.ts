// FooterDotField is exported as a value (not just its type) so it can be used
// standalone via a named import - dot-notation `Footer.DotField` resolves to
// undefined when a Server Component reads it across the RSC client boundary.

export type { FooterDotFieldProps } from './dot-field'
export { FooterDotField } from './dot-field'
export { Footer } from './footer'
export type {
  FooterBannerProps,
  FooterBrandProps,
  FooterColumnProps,
  FooterColumnsProps,
  FooterComponent,
  FooterGraphicsProps,
  FooterLegalProps,
  FooterLinkProps,
  FooterProps,
  FooterTopProps,
} from './types'
export type { FooterWatermarkProps } from './watermark'
export type {
  FooterWatermarkShadowHoverParams,
  FooterWatermarkShadowHoverProps,
} from './watermark-shadow-hover'
